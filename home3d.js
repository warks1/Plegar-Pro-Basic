/* Plegar Pro Plus v0.40: motor de vistas de portada ligado al perfil del editor.
 * Render CAD nominal interactivo; no es un gemelo digital certificado de una máquina real.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
 typeof module==='object'&&module.exports?require('./plan-drawing.js'):root.PlegarPlanDrawing,
 typeof module==='object'&&module.exports?require('./piece3d.js'):root.PlegarPiece3D,
 typeof module==='object'&&module.exports?()=>require('./fold-kinematics.js'):()=>root.PlegarFoldKinematics,
 typeof module==='object'&&module.exports?()=>require('./tooling3d.js'):()=>root.PlegarTooling3D);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarHome3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,D,M,K,T){
 'use strict';
 const palette={sheet:{upper:'#57c7f1',lower:'#196b9c',edge:'#9cecff'},
 punch:{cap:'#d8e8f4',side:'#8da7ba'},die:{cap:'#9aaec1',side:'#526f86'},
 gauge:{cap:'#ffcd83',side:'#ae7a42'},table:{cap:'#8193a2',side:'#4a5968'},ram:{cap:'#bec6d1',side:'#6c7889'}};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function steps(profile){return G.validate(profile).angles.length+2;}
 function frame(profile,stage,progress=0){
  const total=steps(profile),index=Math.max(1,Math.min(total,Math.floor(stage)));
  if(index===1)return K().frame(profile,0,0);
  if(index===total)return K().frame(profile,total-3,1);
  return K().frame(profile,index-2,Math.max(0,Math.min(1,progress)));
 }
 function frameMesh(profile,stage,progress,width,tools){
  const f=frame(profile,stage,progress),m=M.build(f.scene,width);
  return {f,mesh:tools?T().assemble(m,f.scene):m};
 }
 function boundsFor(profile,width=100,yaw=38,elevation=24){
  const count=steps(profile),boxes=[];
  for(let step=1;step<=count;step++){
   for(const t of [0,.22,.5,.78,1]){
    const {mesh}=frameMesh(profile,step,t,width,true);
    boxes.push(M.bounds(mesh,yaw,elevation));
   }
  }
  return {minX:Math.min(...boxes.map(b=>b.minX)),maxX:Math.max(...boxes.map(b=>b.maxX)),
   minY:Math.min(...boxes.map(b=>b.minY)),maxY:Math.max(...boxes.map(b=>b.maxY))};
 }
 function polys(mesh,yaw,elevation,zoom,bounds){
  const projected=M.project(mesh,yaw,elevation,zoom,bounds);
  const light={x:.3,y:-.58,z:.75};
  return projected.faces.map(f=>{
   const face=mesh.faces[f.index],a=mesh.vertices[face.ids[0]],b=mesh.vertices[face.ids[1]],c=mesh.vertices[face.ids[2]];
   const u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
   const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x};
   const norm=Math.hypot(n.x,n.y,n.z)||1;
   const diffuse=Math.abs((n.x*light.x+n.y*light.y+n.z*light.z)/norm);
   const group=f.group||'sheet',kind=f.kind;
   const base=group==='sheet'?(kind==='edge'?[117,177,203]:kind==='lower'?[74,129,155]:[148,199,222])
    :group==='punch'?[162,173,187]:group==='die'?[103,119,137]:group==='table'?[85,103,120]:group==='ram'?[147,158,171]:[203,165,105];
   const factor=.62+.48*diffuse;
   const fill='rgb('+base.map(n=>Math.min(255,Math.round(n*factor))).join(',')+')';
   const edge=group==='sheet'?'#dcf4ff':'#344657';
   return '<polygon data-group="'+group+'" data-status="'+(group==='sheet'?f.status||'':'')+
    '" points="'+f.points.map(v=>v.x.toFixed(2)+','+v.y.toFixed(2)).join(' ')+
    '" fill="'+fill+'" stroke="'+edge+'" stroke-width="'+(group==='sheet'?'1.35':'.8')+
    '" stroke-opacity=".88" stroke-linejoin="round"/>';
  }).join('');
 }
 function machine(profile,{stage=1,progress=0,width=100,yaw=30,elevation=22,zoom=1,bounds=null}={}){
  const {f,mesh}=frameMesh(profile,stage,progress,width,true);
  const svg='<svg class="home-simulation-svg" viewBox="0 0 900 480" role="img" aria-label="Punzón, matriz, tope y chapa en ciclo 3D de plegado">'+
   '<defs><linearGradient id="home-bed" x2="0" y2="1"><stop stop-color="#244158"/><stop offset="1" stop-color="#071724"/></linearGradient></defs>'+
   '<rect width="900" height="480" fill="#091d2d"/><path d="M0 86 H900 M0 372 H900" stroke="#24445b" stroke-width="1"/>'+
   '<rect x="15" y="46" width="870" height="17" rx="4" fill="url(#home-bed)" stroke="#477087"/>'+
   '<rect x="17" y="410" width="866" height="28" rx="5" fill="url(#home-bed)" stroke="#4f738c"/>'+
   '<rect x="30" y="75" width="14" height="334" fill="#284257"/><rect x="855" y="75" width="14" height="334" fill="#284257"/>'+
   polys(mesh,yaw,elevation,zoom,bounds)+
   '<text x="60" y="100" fill="#9edfff" font-size="16">GEMELO GEOMÉTRICO 3D · '+esc(f.phase.toUpperCase())+'</text>'+
   '<text x="60" y="126" fill="#d7eefb" font-size="14">Punzón Y: '+f.punchY.toFixed(1)+' mm · ángulo: '+f.angle.toFixed(1)+'°</text>'+
   '<text x="60" y="395" fill="#ffcf9f" font-size="12">Matriz y tope nominales fijos · movimiento ilustrativo, sin CNC</text></svg>';
  return {svg,frame:f,faceCount:mesh.faces.length};
 }
 function finishedMesh(profile,width){const f=frame(profile,steps(profile),1);return M.build(f.scene,width);}
 function preview(profile,{width=100,yaw=38,elevation=25,zoom=1}={}){
  const mesh=finishedMesh(profile,width);
  return '<svg class="home-preview-svg" viewBox="0 0 900 480" role="img" aria-label="Vista previa 3D de la pieza programada">'+
   '<defs><radialGradient id="pp-preview-bg"><stop stop-color="#17384b"/><stop offset=".78" stop-color="#091a28"/><stop offset="1" stop-color="#05111d"/></radialGradient><radialGradient id="pp-preview-shadow"><stop stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><rect width="900" height="480" fill="url(#pp-preview-bg)"/><ellipse cx="455" cy="386" rx="330" ry="62" fill="url(#pp-preview-shadow)"/>'+
   '<path d="M0 420 H900 M60 0 V480" stroke="#193b53" stroke-width="1"/>'+
   polys(mesh,yaw,elevation,zoom)+
   '<text x="22" y="34" fill="#8ccff5" font-size="15">PIEZA PROGRAMADA · '+esc(profile.name||'Sin nombre')+'</text>'+
   '<text x="22" y="460" fill="#d6e7f5" font-size="12">Vista nominal 3D desde el perfil del editor · '+Number(width).toFixed(0)+' mm de ancho ilustrativo</text></svg>';
 }
 function thumb(profile,{width=100}={}){const svg=preview(profile,{width});return svg.replace('home-preview-svg','home-thumb-svg');}
 function stepThumbnail(profile,stage,{width=100}={}){
  const {mesh}=frameMesh(profile,stage,stage===1?0:1,width,false);
  return '<svg class="home-step-svg" viewBox="0 0 900 480" aria-hidden="true"><rect width="900" height="480" fill="#10283b"/>'+polys(mesh,38,25,1)+'</svg>';
 }
 return {steps,frame,boundsFor,machine,preview,thumb,stepThumbnail};
});