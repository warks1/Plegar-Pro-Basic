/* Plegar Pro Plus v0.7: cribado de interferencias geométricas de un
 * pliegue aislado, perfiles genéricos. Sin sólidos CAD, calibración,
 * deformación física ni acreditación de seguridad industrial. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarInterference2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=0.05;
 const Clearance=typeof require==='function'?require('./clearance2d.js'):window.PlegarClearance2D;
 // Extremo trasero del espesor de chapa dentro de la altura del dedo.
 // Se consideran todas las alas, incluidas las que no tocan el pliegue activo.
 function rearExtent(model){
  const line=model.assembly?.contour||model.centerline,stop=model.stop,r=model.thickness/2;
  let extent=null;
  for(let i=1;i<line.length;i++){
   const a=line[i-1],b=line[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
   if(len<1e-9)continue;
   const nx=-dy/len*r,ny=dx/len*r;
   const poly=[{x:a.x+nx,y:a.y+ny},{x:b.x+nx,y:b.y+ny},{x:b.x-nx,y:b.y-ny},{x:a.x-nx,y:a.y-ny}];
   const candidates=[];
   for(let j=0;j<4;j++){
    const u=poly[j],v=poly[(j+1)%4];
    if(u.y>=stop.top&&u.y<=stop.bottom)candidates.push(u.x);
    if(Math.abs(v.y-u.y)>1e-9)for(const y of [stop.top,stop.bottom]){
     const t=(y-u.y)/(v.y-u.y);if(t>=0&&t<=1)candidates.push(u.x+t*(v.x-u.x));
    }
   }
   if(candidates.length)extent=Math.max(extent??-Infinity,...candidates);
  }
  return extent;
 }
 function inspect(model){
  const problems=[];
  const t=model.thickness;
  const stop=model.stop;
  const rear=rearExtent(model);
  const tipGap=rear===null?null:stop.x-rear;
  let backgaugeState=rear===null?'sin borde a altura del dedo':'separado';
  const contactLine=model.assembly?.contour||model.centerline;
  const machine=typeof require==='function'?require('./machine-v85.js'):window.PlegarMachineV85;
  const machineGeometry=machine?.geometry(model);
  const gaugePolygon=machineGeometry?.finger||[{x:stop.x,y:stop.top},{x:stop.x+stop.width,y:stop.top},{x:stop.x+stop.width,y:stop.bottom},{x:stop.x,y:stop.bottom}];
  const gaugeHits=Clearance.sheetPolygonOverlaps(contactLine,t,gaugePolygon,EPS);
  if(gaugeHits.length){
   backgaugeState='interferencia';
   problems.push({code:'BACKGAUGE_OVERLAP',component:'Tope',message:'El espesor del perfil de chapa invade el contorno del tope representado. Revisar posición X, altura y orientación.'});
  }else if(tipGap!==null&&tipGap < -EPS){
   backgaugeState='detrás del tope';
   problems.push({code:'BACKGAUGE_WRONG_SIDE',component:'Tope',message:'Hay chapa detrás de la cara frontal del tope a su altura. Revisar la colocación; no se ha detectado cruce con su contorno.'});
  }else if(tipGap!==null&&Math.abs(tipGap)<=EPS)backgaugeState='contacto nominal';
  const dieHits=Clearance.sheetPolygonOverlaps(contactLine,t,model.toolProfiles.die.outline,EPS);
  if(dieHits.length)problems.push({code:'DIE_ENVELOPE',component:'Matriz',message:'El espesor del perfil de chapa invade el contorno de la matriz representada. Revisar geometría, apoyo y pliegues previos.'});
  const flangeClearances=[];
  for(const path of model.previous?.paths||[]){
   // Check only the EXTRA segment after each already folded hinge.
   // No swept-volume path is checked, and these are sharp centre-lines.
   const polyline=path.points;
   const toolPolys=[['Punzón',model.toolProfiles.punch.outline],['Matriz',model.toolProfiles.die.outline],
    ['Tope',gaugePolygon]];
   for(const [name,polygon] of toolPolys){
    const d=Clearance.polylinePolygon(polyline,polygon);
    if(!Number.isFinite(d))continue;
    const gap=Math.max(0,d-t/2);
    flangeClearances.push({side:path.side,component:name,gap:Math.round(gap*1000)/1000});
    if(gap<=EPS)problems.push({code:'PRIOR_FLANGE_NEAR_TOOL',component:name,message:`Ala previa (${path.side==='left'?'izquierda':'derecha'}): posible solapamiento de perfil genérico en el plano. No contempla cambio de sujeción ni radio real de pliegues anteriores.`});
   }
  }
  const result={status:problems.length?'revisar':'sin alertas geométricas',problems,flangeClearances,priorBendsEvaluated:model.previous?.paths?.flatMap(p=>p.bends)||[],

   backgaugeState,backgaugeGap:tipGap===null?null:Math.round(tipGap*1000)/1000,backgaugeRearX:rear,
   maxDiePenetration:null,dieOverlapSegments:dieHits,backgaugeOverlapSegments:gaugeHits,contactTolerance:Math.min(EPS,t/4),
   disclosure:'Cruces de franjas de espesor con los contornos representados, tolerancia máxima 0,05 mm. Sin resolución de uniones entre franjas ni profundidad exacta de penetración. Cribado NO certificado. Alas previas solo como bisagras planas idealizadas: no se modelan reposicionamiento, colisiones barridas, radios reales anteriores, deformación, sólidos CAD, ejes CNC ni el entorno 3D. La ausencia de alertas NO demuestra seguridad.'};
  return result;
 }
 return {inspect,rearExtent};
});


