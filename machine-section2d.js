/* Vista de perfil industrial nominal. No es CAD de un fabricante.
 * Separa la geometría dibujada de las cotas introducidas y del cribado CNC.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarMachineSection2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 const pt=(x,y)=>({x,y});
 const poly=(...coords)=>coords.map(([x,y])=>pt(x,y));
 const rectangle=(l,t,r,b)=>poly([l,t],[r,t],[r,b],[l,b]);
 const bounds=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
  minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
 function build(m){
  if(!m?.toolProfiles?.punch?.outline?.length||!m?.toolProfiles?.die?.outline?.length||!m?.stop)
   throw Error('La vista de máquina necesita perfiles de punzón, matriz y tope.');
  const cfg=m.machineSetup||{},punch=m.toolProfiles.punch.outline,die=m.toolProfiles.die.outline;
  const tipTop=Math.min(...punch.map(p=>p.y)),dieBottom=Math.max(...die.map(p=>p.y));
  const punchHalf=Math.max(...punch.map(p=>Math.abs(p.x))),dieHalf=Math.max(...die.map(p=>Math.abs(p.x)));
  const tableLeft=finite(cfg.tableLeft)?cfg.tableLeft:Math.max(dieHalf+22,68);
  const tableRight=finite(cfg.tableRight)?cfg.tableRight:Math.max(dieHalf+22,68);
  const ramHalf=finite(cfg.ramWidth)?cfg.ramWidth/2:Math.max(punchHalf+16,63);
  const clampHalf=Math.max(punchHalf+3,10);
  // El portapunzón se desplaza solidario con la carrera: NO se infiere altura
  // real de un equipo a partir del diámetro/apertura de la herramienta.
  const upperHolder=poly([-clampHalf,tipTop-15],[clampHalf,tipTop-15],
   [clampHalf,tipTop-7],[punchHalf+5,tipTop-3],[punchHalf+3,tipTop+3],
   [punchHalf-1,tipTop+3],[punchHalf-1,tipTop],[1-punchHalf,tipTop],
   [1-punchHalf,tipTop+3],[-punchHalf-3,tipTop+3],
   [-punchHalf-5,tipTop-3],[-clampHalf,tipTop-7]);
  const upperBeam=rectangle(-ramHalf,tipTop-49,ramHalf,tipTop-15);
  const clampJaw=rectangle(-Math.max(5,punchHalf/3),tipTop-8,Math.max(5,punchHalf/3),tipTop);
  const dieHolder=poly([-dieHalf-3,dieBottom+2],[dieHalf+3,dieBottom+2],
   [dieHalf+7,dieBottom+13],[-dieHalf-7,dieBottom+13]);
  const table=rectangle(-Math.max(tableLeft,dieHalf+8),dieBottom+13,
   Math.max(tableRight,dieHalf+8),dieBottom+38);
  const lowerBody=poly([-Math.max(tableLeft,dieHalf+8)+11,dieBottom+38],
   [Math.max(tableRight,dieHalf+8)-11,dieBottom+38],
   [Math.max(tableRight,dieHalf+8)-22,dieBottom+80],
   [-Math.max(tableLeft,dieHalf+8)+22,dieBottom+80]);
  const x=m.stop.x, top=m.stop.top,bottom=m.stop.bottom;
  const fingerHalf=Math.max(1.2,Math.min(m.stop.width,4));
  const finger=rectangle(x-fingerHalf,top,x+fingerHalf,bottom);
  const arm=poly([x+fingerHalf,top+2],[x+fingerHalf+Math.max(12,m.dieOpening),top+2],
   [x+fingerHalf+Math.max(19,m.dieOpening+10),top-7],
   [x+fingerHalf+Math.max(24,m.dieOpening+16),top-7],
   [x+fingerHalf+Math.max(24,m.dieOpening+16),bottom+4],
   [x+fingerHalf,bottom+4]);
  const carriage=rectangle(x+Math.max(21,m.dieOpening+12),bottom+4,
   x+Math.max(34,m.dieOpening+25),bottom+29);
  const parts=[
   {id:'estructura-superior',name:'Estructura superior',points:upperBeam,known:finite(cfg.ramWidth)&&finite(cfg.ramBottomOffset)},
   {id:'portapunzon',name:'Amarre del punzón',points:upperHolder,known:false},
   {id:'mordaza',name:'Mordaza portapunzón',points:clampJaw,known:false},
   {id:'portamatriz',name:'Amarre inferior de matriz',points:dieHolder,known:false},
   {id:'mesa',name:'Mesa',points:table,known:finite(cfg.tableLeft)&&finite(cfg.tableRight)&&finite(cfg.dieHeight)},
   {id:'estructura-inferior',name:'Estructura inferior',points:lowerBody,known:false},
   {id:'tope-dedo',name:'Dedo de tope X',points:finger,known:false},
   {id:'tope-brazo',name:'Brazo del tope',points:arm,known:false},
   {id:'tope-carro',name:'Carro del tope',points:carriage,known:false}
  ];
  return {ram:upperBeam,table,parts,dieHolder,upperHolder,lowerBody,finger,arm,carriage,
   tableMeasured:finite(cfg.tableLeft)&&finite(cfg.tableRight)&&finite(cfg.dieHeight),
   ramMeasured:finite(cfg.ramWidth)&&finite(cfg.ramBottomOffset),
   projected:true,verified:false};
 }
 function crosses(a,b,box,r=0){
  const B={minX:box.minX-r,maxX:box.maxX+r,minY:box.minY-r,maxY:box.maxY+r};
  let lo=0,hi=1,dx=b.x-a.x,dy=b.y-a.y;
  for(const [p,q] of [[-dx,a.x-B.minX],[dx,B.maxX-a.x],[-dy,a.y-B.minY],[dy,B.maxY-a.y]]){
   if(Math.abs(p)<1e-12){if(q<0)return false;}
   else{const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;}
  }
  return true;
 }
 function inspect(m,section=build(m)){
  const spans=[];
  for(const side of ['left','right'])for(const item of m.assembly?.[side]?.items||[])
   spans.push({a:item.from,b:item.to,side,status:item.status});
  // El radio activo suele estar en contacto con las herramientas y se excluye
  // aquí para no interpretar el conformado intencionado como un choque.
  const hits=[];
  for(const part of section.parts){
   const b=bounds(part.points),near=spans.some(edge=>crosses(edge.a,edge.b,b,m.thickness/2));
   if(near)hits.push({component:part.name,id:part.id,kind:'POSIBLE_PROXIMIDAD_EN_PROYECCIÓN',verified:false});
  }
  return {hits,checked:section.parts.map(part=>({id:part.id,name:part.name,
   known:part.known,approximate:true,possibleOverlap:hits.some(hit=>hit.id===part.id)})),
   physicallyValidated:false,cncApproved:false,continuousSweep:false,
   note:'Cribado de proyección 2D, por cajas conservadoras: no representa penetración física comprobada. No se ha validado ninguna holgura de útiles, amarres, estructura o tope.'};
 }
 return {build,inspect,bounds,crosses};
});
