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
 const clamp=(a,b,c)=>Math.max(b,Math.min(c,a));
 function inspect(model){
  const problems=[];
  const half=model.dieOpening/2,depth=model.dieDepth,t=model.thickness;
  const stop=model.stop;
  const tipGap=stop.x-model.wingRight.x;
  let backgaugeState='separado';
  // Backgauge is an idealized upright 2D rectangle behind the RIGHT flank.
  // Check sheet centreline at multiple locations, projected to the gauge face.
  // Detect only substantive overlap, not a simple butt contact at the edge.
  if(tipGap < -EPS && model.centerline.length>1){
   const xProbe=stop.x+Math.min(0.3,stop.width/2);
   for(let k=0;k<model.centerline.length-1;k++){
    const a=model.centerline[k],b=model.centerline[k+1];
    if(Math.min(a.x,b.x)-EPS<=xProbe && xProbe<=Math.max(a.x,b.x)+EPS && Math.abs(a.x-b.x)>1e-9){
     const u=(xProbe-a.x)/(b.x-a.x);
     const y=a.y+(b.y-a.y)*u;
     if(y+t/2>stop.top+EPS && y-t/2<stop.bottom-EPS){
      backgaugeState='interferencia';
      problems.push({code:'BACKGAUGE_OVERLAP',component:'Tope',message:'Posible solapamiento 2D de la chapa con el tope nominal. Revisar eje X y posición vertical del tope.'});
      break;
     }
    }
   }
  }
  if(backgaugeState!=='interferencia'&&Math.abs(tipGap)<=EPS)backgaugeState='contacto nominal';
  // Die V boundary: within |x| <= V/2, tool material lies BELOW the
  // idealized descending V face. Outside the shoulders, material starts y=0.
  // Nominal centreline + half thickness is a deliberately conservative check.
  let maxDiePenetration=0;
  for(const p of model.centerline){
   const face=(Math.abs(p.x)<half)?depth*(1-Math.abs(p.x)/half):0;
   const penetration=p.y+t/2-face;
   if(penetration>maxDiePenetration)maxDiePenetration=penetration;
  }
  if(maxDiePenetration>Math.max(0.3,t*0.12)){
   problems.push({code:'DIE_ENVELOPE',component:'Matriz',message:'La envolvente nominal de chapa invade el perfil simplificado de la matriz V. Comprobación conservadora: podría ser un falso positivo.'});
  }
  const flangeClearances=[];
  for(const path of model.previous?.paths||[]){
   // Check only the EXTRA segment after each already folded hinge.
   // No swept-volume path is checked, and these are sharp centre-lines.
   const polyline=path.points;
   const toolPolys=[['Punzón',model.toolProfiles.punch.outline],['Matriz',model.toolProfiles.die.outline],
    ['Tope',[{x:stop.x,y:stop.top},{x:stop.x+stop.width,y:stop.top},{x:stop.x+stop.width,y:stop.bottom},{x:stop.x,y:stop.bottom}]]];
   for(const [name,polygon] of toolPolys){
    const d=Clearance.polylinePolygon(polyline,polygon);
    if(!Number.isFinite(d))continue;
    const gap=Math.max(0,d-t/2);
    flangeClearances.push({side:path.side,component:name,gap:Math.round(gap*1000)/1000});
    if(gap<=EPS)problems.push({code:'PRIOR_FLANGE_NEAR_TOOL',component:name,message:`Ala previa (${path.side==='left'?'izquierda':'derecha'}): posible solapamiento de perfil genérico en el plano. No contempla cambio de sujeción ni radio real de pliegues anteriores.`});
   }
  }
  const result={status:problems.length?'revisar':'sin alertas geométricas',problems,flangeClearances,priorBendsEvaluated:model.previous?.paths?.flatMap(p=>p.bends)||[],

   backgaugeState,backgaugeGap:Math.round(tipGap*1000)/1000,
   maxDiePenetration:Math.round(maxDiePenetration*1000)/1000,
   disclosure:'Cribado NO certificado. Alas previas solo como bisagras planas idealizadas: no se modelan reposicionamiento, colisiones barridas, radios reales anteriores, deformación, sólidos CAD, ejes CNC ni el entorno 3D. La ausencia de alertas NO demuestra seguridad.'};
  return result;
 }
 return {inspect};
});
