/* Visor CAD 3D de sección extruida: geometría matemática procedente del DXF.
 * No triangulación ni fabricante homologado; solo inspección visual de la
 * sección y sus huecos. Jamás calcula colisiones reales ni valida amarres/CNC.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolDXF3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=v=>Number(v).toLocaleString('es-ES',{maximumFractionDigits:2});
 const area=points=>points.reduce((s,p,i)=>{
  const q=points[(i+1)%points.length];return s+p.x*q.y-q.x*p.y;
 },0)/2;
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 function data(record){
  if(!record||!Array.isArray(record.points)||record.points.length<3||
    !Array.isArray(record.holes))throw Error('Sección DXF incompleta.');
  const loops=[record.points,...record.holes],length=record.lengthMm;
  const lengthKnown=finite(length)&&length>0&&length<=10000;
  const b=record.bounds;
  if(!b||![b.minX,b.maxX,b.minY,b.maxY,b.width,b.height].every(finite)||
    b.width<=0||b.height<=0||loops.some(p=>p.length<3))throw Error('Cotas de sección no válidas.');
  // La longitud utilizada solo para previsualización SIN dato es ilustrativa.
  const zLength=lengthKnown?length:Math.max(12,Math.min(80,Math.max(b.width,b.height)*.6));
  const oriented=loops.map((loop,i)=>{
   if(!loop.every(p=>finite(p.x)&&finite(p.y)))throw Error('Contorno 3D con puntos incorrectos.');
   const signed=area(loop);
   if(Math.abs(signed)<1e-7)throw Error('Contorno 3D degenerado.');
   return ((i===0&&signed>0)||(i>0&&signed<0))?loop:[...loop].reverse();
  });
  const vertices=oriented.reduce((n,p)=>n+p.length,0)*2;
  if(vertices>800)throw Error('Perfil demasiado complejo para el visor interactivo.');
  return {loops:oriented,zLength,lengthKnown,vertexCount:vertices,
   holeCount:record.holes.length,bounds:b,kind:record.kind,
   brand:String(record.brand||''),code:String(record.code||''),
   areaMm2:record.areaMm2,geometryCertified:false,approvedForCNC:false};
 }
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const rad=n=>n*Math.PI/180;
 function options(options={}){
  const yaw=Number(options.yaw??32),pitch=Number(options.pitch??22),zoom=Number(options.zoom??1);
  if(![yaw,pitch,zoom].every(Number.isFinite))throw Error('Parámetros de cámara incorrectos.');
  return {yaw:((yaw%360)+360)%360,pitch:clamp(pitch,-80,80),zoom:clamp(zoom,.35,3.5)};
 }
 function projection(model,raw={}){
  const camera=options(raw),b=model.bounds,cosY=Math.cos(rad(camera.yaw)),sinY=Math.sin(rad(camera.y)),
   cosP=Math.cos(rad(camera.pitch)),sinP=Math.sin(rad(camera.pitch)),
   ox=(b.minX+b.maxX)/2,oy=(b.minY+b.maxY)/2,oz=model.zLength/2;
  const rotate=(p,z)=>{
   const x=p.x-ox,y=p.y-oy,depth=z-oz;
   const xx=x*cosY+depth*sinY,zz=-x*sinY+depth*cosY;
   return {x:xx,y:y*cosP-zz*sinP,depth:y*sinP+zz*cosP};
  };
  const outlines=model.loops.flatMap(loop=>loop.flatMap(p=>[rotate(p,0),rotate(p,model.zLength)]));
  const extrema={
   minX:Math.min(...outlines.map(v=>v.x)),maxX:Math.max(...outlines.map(v=>v.x)),
   minY:Math.min(...outlines.map(v=>v.y)),maxY:Math.max(...outlines.map(v=>v.y))
  };
  const w=Math.max(.001,extrema.maxX-extrema.minX),h=Math.max(.001,extrema.maxY-extrema.minY);
  const scale=Math.min(650/w,295/h)*camera.zoom;
  const cx=(extrema.minX+extrema.maxX)/2,cy=(extrema.minY+extrema.maxY)/2;
  const project=(p,z)=>{
   const r=rotate(p,z);
   return {x:380+(r.x-cx)*scale,y:211-(r.y-cy)*scale,depth:r.depth};
  };
  const eye={x:-sinY*cosP,y:sinP,z:cosY*cosP};
  const faces=[];
  for(let side=0;side<2;side++){
   const z=side*model.zLength;
   const rings=model.loops.map(loop=>loop.map(p=>project(p,z)));
   faces.push({kind:side?'cap-front':'cap-back',rings,
    depth:rings.flat().reduce((s,p)=>s+p.depth,0)/rings.flat().length,
    visible:(side?eye.z:-eye.z)>-.025});
  }
  for(let i=0;i<model.loops.length;i++){
   const loop=model.loops[i];
   for(let j=0;j<loop.length;j++){
    const a=loop[j],b=loop[(j+1)%loop.length];
    const nx=b.y-a.y,ny=-(b.x-a.x),facing=nx*eye.x+ny*eye.y;
    if(facing<=1e-8)continue;
    const ring=[project(a,0),project(b,0),project(b,model.zLength),project(a,model.zLength)];
    faces.push({kind:i?'hole-wall':'outer-wall',rings:[ring],depth:ring.reduce((s,p)=>s+p.depth,0)/4,visible:true});
   }
  }
  // Painter's algorithm approximated for this browser-side vector preview.
  return {camera,extrema,scale,faces:faces.filter(f=>f.visible).sort((a,b)=>a.depth-b.depth),eye};
 }
 const fmt=n=>Number(n.toFixed(3));
 const ring=pts=>pts.map((p,i)=>(i?'L':'M')+fmt(p.x)+' '+fmt(p.y)).join(' ')+' Z';
 function render(record,raw={}){
  const model=data(record),proj=projection(model,raw),
    punch=model.kind==='punch',face=punch?'#4da9d6':'#c47478',
    side=punch?'#336a90':'#8b4d5e';
  const faces=proj.faces.map((f,i)=>{
   const d=f.rings.map(ring).join(' '),color=f.kind.startsWith('cap')?face:(f.kind==='hole-wall'?'#243e56':side);
   return '<path data-3d-face="'+f.kind+'" d="'+d+'" fill="'+color+
    '" fill-rule="evenodd" fill-opacity="'+(f.kind==='cap-back'?'.55':'.92')+
    '" stroke="'+(f.kind==='hole-wall'?'#83b2cb':'#c5dce9')+'" stroke-width=".65" stroke-linejoin="round"/>';
  }).join('');
  const scale=proj.camera.zoom.toFixed(2),axial=model.lengthKnown?
   'L axial '+number(model.zLength)+' mm (declarada, NO validada)':
   'LONGITUD AXIAL DESCONOCIDA · profundidad ilustrativa';
  const label=esc(model.brand+' '+model.code);
  return '<svg class="tool-dxf-3d-canvas" viewBox="0 0 760 425" role="img" '+
   'aria-label="Visor tridimensional interactivo de '+label+', geometría geométrica no certificada">'+
   '<rect x="0" y="0" width="760" height="425" rx="8" fill="#081c2e"/>'+
   '<g stroke="#1a425e" stroke-width=".7"><path d="M0 211H760M380 0V425" stroke-dasharray="5 5"/></g>'+
   faces+
   '<text x="16" y="27" fill="#c7e8ff" font-size="15" font-weight="700">'+label+'</text>'+
   '<text x="16" y="48" fill="#a4d6ec" font-size="12">Sección '+number(model.bounds.width)+' × '+
   number(model.bounds.height)+' mm · '+model.holeCount+' huecos</text>'+
   '<text x="16" y="385" fill="#ffe1aa" font-size="12">'+axial+'</text>'+
   '<text x="16" y="404" fill="#ffe1aa" font-size="11">VISTA GEOMÉTRICA · amarre, tolerancia, colisión y CNC SIN VERIFICAR</text>'+
   '<text x="746" y="27" text-anchor="end" fill="#8fd8fa" font-size="11">Giro '+Math.round(proj.camera.yaw)+
   '° · elevación '+Math.round(proj.camera.pitch)+'° · zoom '+scale+'×</text></svg>';
 }
 return {data,options,projection,render};
});
