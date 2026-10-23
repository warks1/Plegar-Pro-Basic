/* Plegar Pro Plus v0.38. Planos derivados EXCLUSIVAMENTE de dimensiones del editor.
 * Los SVG son documentación geométrica nominal, no CAD sólido ni posprocesador CNC.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
                   typeof module==='object'&&module.exports?require('./piece3d.js'):root.PlegarPiece3D);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarPlanDrawing=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,M){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&apos;'}[c]));
 const fmt=v=>Number(v).toFixed(2).replace(/\.00$/,'');
 const xy=p=>p.x.toFixed(2)+','+p.y.toFixed(2);
 const XML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" role="img">';
 const header=(name,type)=>`<rect width="900" height="600" fill="#f8fafc"/><rect width="900" height="74" fill="#153c59"/><text x="30" y="32" fill="#fff" font-size="19" font-weight="bold">PLEGAR PRO PLUS · ${type}</text><text x="30" y="57" fill="#bde9ff" font-size="14">${esc(name)}</text>`;
 function meshFromProfile(points,thickness,width){
  const vertices=[],faces=[];
  for(let i=0;i<points.length;i++){
   const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
   let dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
   if(l<1e-9){dx=1;dy=0;l=1;}
   const nx=-dy/l*thickness/2,ny=dx/l*thickness/2,p=points[i];
   vertices.push({x:p.x+nx,y:p.y+ny,z:0},{x:p.x-nx,y:p.y-ny,z:0},
                 {x:p.x+nx,y:p.y+ny,z:width},{x:p.x-nx,y:p.y-ny,z:width});
  }
  for(let i=0;i<points.length-1;i++){
   const a=i*4,b=a+4;
   faces.push({ids:[a,b,b+2,a+2],kind:'upper'},{ids:[a+1,a+3,b+3,b+1],kind:'lower'},
    {ids:[a,a+1,b+1,b],kind:'edge'},{ids:[a+2,b+2,b+3,a+3],kind:'edge'});
  }
  faces.push({ids:[0,2,3,1],kind:'edge'},{ids:[vertices.length-4,vertices.length-3,vertices.length-1,vertices.length-2],kind:'edge'});
  return {vertices,faces,width,thickness};
 }
 function create(profile,{width=100}={}){
  const p=G.validate(profile);
  if(!Number.isFinite(width)||width<1||width>5000)throw Error('Ancho 3D de 1 a 5000 mm, debe estar confirmado.');
  const pts=G.vertices(p);
  const minX=Math.min(...pts.map(v=>v.x)),maxX=Math.max(...pts.map(v=>v.x));
  const minY=Math.min(...pts.map(v=>v.y)),maxY=Math.max(...pts.map(v=>v.y));
  const sx=720/Math.max(1,maxX-minX),sy=340/Math.max(1,maxY-minY),scale=Math.min(sx,sy,8);
  const offX=450-(minX+maxX)/2*scale,offY=300+(minY+maxY)/2*scale;
  const transform=v=>({x:offX+v.x*scale,y:offY-v.y*scale});
  const view=pts.map(transform);
  const labels=p.segments.map((value,i)=>{const a=view[i],b=view[i+1],x=(a.x+b.x)/2,y=(a.y+b.y)/2-17;
   return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="#153c59" font-size="14" font-weight="bold" text-anchor="middle">${fmt(value)} mm</text>`;}).join('');
  const bends=p.angles.map((a,i)=>{const v=view[i+1];return `<g><circle cx="${v.x.toFixed(2)}" cy="${v.y.toFixed(2)}" r="16" fill="#f2a84a" stroke="#9b5a18"/><text x="${v.x.toFixed(2)}" y="${(v.y+4).toFixed(2)}" text-anchor="middle" font-size="12" fill="#092435">B${i+1}</text><text x="${(v.x+20).toFixed(2)}" y="${(v.y+25).toFixed(2)}" font-size="12" fill="#714b22">${fmt(a)}°</text></g>`;}).join('');
  const line=view.map(xy).join(' ');
  const status='GEOMETRÍA NOMINAL · COTAS ENTRE VÉRTICES TEÓRICOS · NO CNC';
  const common=`<text x="30" y="518" fill="#214965" font-size="14">Material: ${esc(p.material)} · Espesor: ${fmt(p.thickness)} mm · ${p.angles.length} pliegues</text><text x="30" y="545" fill="#8b3f1d" font-size="12">${status}</text><text x="30" y="572" fill="#46687c" font-size="12">Orden: ${p.sequence.map(id=>'B'+id).join(' → ')}</text>`;
  const svg2d=XML+header(p.name,'PLANO 2D')+`<polyline points="${line}" stroke="#1f719a" stroke-width="${Math.max(3,Math.min(13,p.thickness*scale))}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`+labels+bends+common+'</svg>';
  const mesh=meshFromProfile(pts,p.thickness,width);
  const projection=M.project(mesh,38,24,1);
  const polygons=projection.faces.map(f=>`<polygon points="${f.points.map(xy).join(' ')}" fill="${f.kind==='upper'?'#91c7e5':f.kind==='lower'?'#4f7b97':'#315d79'}" stroke="#163f5a" stroke-width="0.9" stroke-linejoin="round"/>`).join('');
  const svg3d=XML+header(p.name,'VISTA AXONOMÉTRICA 3D')+`<g transform="translate(0 38)">${polygons}</g><text x="30" y="518" fill="#214965" font-size="14">Ancho introducido: ${fmt(width)} mm · Espesor: ${fmt(p.thickness)} mm · Material: ${esc(p.material)}</text><text x="30" y="545" fill="#8b3f1d" font-size="12">MALLA 3D NOMINAL DE ESPESOR · SIN RADIOS FÍSICOS NI RECUPERACIÓN ELÁSTICA</text><text x="30" y="572" fill="#46687c" font-size="12">Vista proyectada del mismo perfil acotado 2D · No es STEP/STL sólido validado.</text></svg>`;
  const inside=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  const sheet='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 600" role="img"><svg x="0" y="0" width="900" height="600" viewBox="0 0 900 600">'+inside(svg2d)+'</svg><svg x="900" y="0" width="900" height="600" viewBox="0 0 900 600">'+inside(svg3d)+'</svg></svg>';
  return {profile:{...p,setup:profile.setup?{...profile.setup}:undefined},width,svg2d,svg3d,sheet,mesh,source:'Perfil calculado de longitudes y ángulos introducidos. NO sirve para fabricación ni CNC.'};
 }
 return {create,meshFromProfile};
});