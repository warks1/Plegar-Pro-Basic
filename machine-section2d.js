/* Vista de perfil industrial nominal. No es CAD de un fabricante.
 * Separa la geometría dibujada de las cotas introducidas y del cribado CNC.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./clearance2d.js'):root.PlegarClearance2D);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarMachineSection2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Clearance){
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
  // Misma referencia Y que los prismas 3D: distancia desde punta de punzón.
  // Si se desconoce, se representa una silueta didáctica.
  const ramBottom=finite(cfg.ramBottomOffset)?m.punchTipY-cfg.ramBottomOffset:tipTop-15;
  const upperBeam=rectangle(-ramHalf,ramBottom-35,ramHalf,ramBottom);
  const toolToRamNominalGapMm=Math.round(((tipTop-15)-ramBottom)*1000)/1000;
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
   ramDatumKnown:finite(cfg.ramBottomOffset),
   ramBottom,toolToRamNominalGapMm,holderGeometryVerified:false,
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
  for(const side of ['left','right'])for(const edge of m.assembly?.[side]?.items||[])
   spans.push({a:edge.from,b:edge.to,side,status:edge.status});
  // Comprobar también las herramientas, sin confundir contacto esperado
  // durante el plegado con una colisión no deseada.
  const toolZones=[
   {id:'punzon',name:'Punzón (contacto previsto)',points:m.toolProfiles.punch.outline,known:false,expectedContact:true},
   {id:'matriz',name:'Matriz (apoyo previsto)',points:m.toolProfiles.die.outline,known:false,expectedContact:true}
  ];
  const checked=[...toolZones,...section.parts].map(part=>{
   let gap=null;
   for(const edge of spans){
    const distance=Clearance.segmentPolygon(edge.a,edge.b,part.points)-m.thickness/2;
    gap=gap===null?distance:Math.min(gap,distance);
   }
   const distanceMm=gap===null?null:Math.round(Math.max(0,gap)*1000)/1000;
   return {id:part.id,name:part.name,known:part.known,approximate:true,
    expectedContact:part.expectedContact===true,
    distanceMm,possibleOverlap:gap!==null&&gap<=0.05,samples:spans.length};
  });
  const hits=checked.filter(part=>part.possibleOverlap).map(part=>({
   component:part.name,id:part.id,kind:part.expectedContact?'CONTACTO_O_PROXIMIDAD_DE_HERRAMIENTA':'POSIBLE_PROXIMIDAD_EN_PROYECCIÓN',
   expectedContact:part.expectedContact,distanceMm:part.distanceMm,verified:false
  }));
  return {hits,checked,physicallyValidated:false,cncApproved:false,continuousSweep:false,
   method:'Distancia entre alas y contorno poligonal 2D con medio espesor nominal.',
   note:'Proyección 2D sin volteo ni reposición física, contacto ni CAD de fabricante: no valida ausencia de colisiones.'};
 }
 function sweep(profile,orderIndex,{intervals=20}={}){
  if(!Number.isInteger(intervals)||intervals<2||intervals>60)throw Error('Muestreo de sección fuera de rango.');
  const K=typeof module==='object'&&module.exports?require('./fold-kinematics.js'):window.PlegarFoldKinematics;
  const first=new Map(),closest=new Map();
  for(let i=0;i<=intervals;i++){
   const fraction=i/intervals,frame=K.frame(profile,orderIndex,fraction),result=inspect(frame.scene);
   for(const part of result.checked)if(part.distanceMm!==null){
    const old=closest.get(part.id);
    if(old===undefined||part.distanceMm<old)closest.set(part.id,part.distanceMm);
   }
   for(const hit of result.hits)if(!first.has(hit.id))first.set(hit.id,{
    ...hit,cyclePercent:Math.round(100*fraction),phase:frame.phase,step:orderIndex+1
   });
  }
  return {frames:intervals+1,hits:[...first.values()],
   minimums:[...closest].map(([id,distanceMm])=>({id,distanceMm})),
   physicallyValidated:false,cncApproved:false,continuousSweep:false,
   note:'Muestreo discreto de proyección 2D; puede omitir choques entre muestras, fuera de plano o durante el volteo. NO CNC.'};
 }
 return {build,inspect,sweep,bounds,crosses};
});
