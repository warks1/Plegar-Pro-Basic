/* Plegar Pro Plus v0.9 — generic 3D tooling envelopes (illustrative only).
 * One coordinate system with sheet: x along profile, y downward, z across width.
 * NOT manufacturer tool geometry or swept-volume collision checking.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarTooling3D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const groups=['sheet','punch','die','gauge','table','ram'];
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 function extrude(outline,z0,z1,group){
  if(!Array.isArray(outline)||outline.length<3||!outline.every(p=>finite(p.x)&&finite(p.y)))throw new Error('Contorno de herramienta inválido.');
  if(!finite(z0)||!finite(z1)||z1<=z0||z1-z0>10000)throw new Error('Ancho de herramienta inválido.');
  if(!groups.includes(group)||group==='sheet')throw new Error('Tipo de herramienta inválido.');
  const n=outline.length;let doubleArea=0;
  for(let i=0;i<n;i++){const a=outline[i],b=outline[(i+1)%n];doubleArea+=a.x*b.y-b.x*a.y;}
  if(Math.abs(doubleArea)<1e-6)throw new Error('Contorno degenerado.');
  const vertices=[...outline.map(p=>({x:p.x,y:p.y,z:z0})),...outline.map(p=>({x:p.x,y:p.y,z:z1}))];
  const faces=[{ids:[...Array(n).keys()].reverse(),kind:'cap',group},{ids:[...Array(n).keys()].map(i=>i+n),kind:'cap',group}];
  for(let i=0;i<n;i++){
   const j=(i+1)%n;
   faces.push({ids:[i,j,j+n,i+n],kind:'side',group});
  }
  return {vertices,faces};
 }
 function prisms(sheet,scene){
  if(!sheet||!finite(sheet.width)||sheet.width<=0||!finite(sheet.thickness)||sheet.thickness<=0)throw new Error('Dimensiones de chapa requeridas.');
  if(!scene?.toolProfiles?.punch?.outline||!scene?.toolProfiles?.die?.outline||!scene?.stop)throw new Error('Escena geométrica y utillaje requeridos.');
  const margin=Math.max(8,Math.min(30,sheet.width*.12));
  const g=scene.stop;
  if(![g.x,g.top,g.bottom,g.width].every(finite)||g.width<=0||g.bottom<=g.top)throw new Error('Tope nominal inválido.');
  const gaugeDepth=Math.max(8,Math.min(26,sheet.width*.16));
  const bodies=[
   {group:'punch',outline:scene.toolProfiles.punch.outline,z0:-margin,z1:sheet.width+margin},
   {group:'die',outline:scene.toolProfiles.die.outline,z0:-margin,z1:sheet.width+margin},
   {group:'gauge',outline:[{x:g.x,y:g.top},{x:g.x+g.width,y:g.top},{x:g.x+g.width,y:g.bottom},{x:g.x,y:g.bottom}],z0:Math.max(0,(sheet.width-gaugeDepth)/2),z1:Math.min(sheet.width,(sheet.width+gaugeDepth)/2)}
  ];
  const V=typeof module==='object'&&module.exports?require('./machine-v85.js'):window.PlegarMachineV85;
  const vg=V.geometry(scene);
  if(vg){
   bodies[2].outline=vg.finger;
   bodies.push({group:'ram',outline:vg.ram,renderOutline:vg.ramDisplay,z0:vg.z0,z1:vg.z1,renderZ0:-margin,renderZ1:sheet.width+margin});
   bodies.push({group:'table',outline:vg.table,renderOutline:vg.tableDisplay,z0:vg.z0,z1:vg.z1,renderZ0:-margin,renderZ1:sheet.width+margin});
   return bodies;
  }
  const cfg=scene.machineSetup||{},outer=Math.max(...scene.toolProfiles.die.outline.map(p=>Math.abs(p.x)));
  const rectangle=(xmin,ymin,xmax,ymax)=>[{x:xmin,y:ymin},{x:xmax,y:ymin},{x:xmax,y:ymax},{x:xmin,y:ymax}];
  if(cfg.dieHeight!==null&&Number.isFinite(cfg.dieHeight)){
   const h=cfg.dieHeight;
   if(Number.isFinite(cfg.tableLeft)&&cfg.tableLeft>outer)
    bodies.push({group:'table',outline:rectangle(-cfg.tableLeft,h,-outer,h+25),z0:-margin,z1:sheet.width+margin});
   if(Number.isFinite(cfg.tableRight)&&cfg.tableRight>outer)
    bodies.push({group:'table',outline:rectangle(outer,h,cfg.tableRight,h+25),z0:-margin,z1:sheet.width+margin});
  }
  if(Number.isFinite(cfg.ramWidth)&&Number.isFinite(cfg.ramBottomOffset)){
   const bottom=scene.punchTipY-cfg.ramBottomOffset,half=cfg.ramWidth/2;
   bodies.push({group:'ram',outline:rectangle(-half,bottom-35,half,bottom),z0:-margin,z1:sheet.width+margin});
  }
  return bodies;
 }
 function assemble(sheet,scene,visible={}){
  if(!sheet||!Array.isArray(sheet.vertices)||!Array.isArray(sheet.faces))throw new Error('Malla de chapa requerida.');
  const descriptors=prisms(sheet,scene);
  const out={vertices:sheet.vertices.map(v=>({...v})),faces:sheet.faces.map(f=>({...f,ids:[...f.ids],group:'sheet'})),width:sheet.width,thickness:sheet.thickness,groups:{sheet:1,punch:0,die:0,gauge:0,table:0,ram:0}};
  for(const d of descriptors){
   if(visible[d.group]===false)continue;
   const mesh=extrude(d.renderOutline||d.outline,d.renderZ0??d.z0,d.renderZ1??d.z1,d.group),offset=out.vertices.length;
   out.vertices.push(...mesh.vertices);
   out.faces.push(...mesh.faces.map(f=>({...f,ids:f.ids.map(i=>i+offset)})));
   out.groups[d.group]=1;
  }
  return out;
 }
 return {extrude,prisms,assemble};
});
