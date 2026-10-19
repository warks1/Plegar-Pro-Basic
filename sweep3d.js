/* Plegar Pro Plus v0.26 — muestreo discreto de holguras NOMINALES durante un ciclo.
 * Evalúa únicamente alas anteriores y prismas genéricos (punch/die/gauge).
 * El pliegue activo, los contactos previstos, ejes de máquina y reorientaciones
 * entre pasos quedan FUERA del modelo; los instantes entre muestras NO se evalúan.
 * Los resultados NO constituyen colisiones certificadas ni autorización CNC.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarSweep3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const K=typeof require==='function'?require('./fold-kinematics.js'):window.PlegarFoldKinematics;
 const M=typeof require==='function'?require('./piece3d.js'):window.PlegarPiece3D;
 const P=typeof require==='function'?require('./proximity3d.js'):window.PlegarProximity3D;
 const NOTE='MUESTREO DISCRETO ILUSTRATIVO de alas anteriores frente a prismas de herramientas genéricas. Sin barrido continuo, modelo CAD verificado, pliegue activo, contacto físico, eje X/Y/Z real ni recolocación entre pliegues. Separación positiva NO demuestra ausencia de colisión. NO CNC / SIN VERIFICAR.';
 function sample(profile,step,width=100,{intervals=24,nearMm=2}={}){
  if(!Number.isInteger(intervals)||intervals<4||intervals>64)throw new Error('Número de intervalos de muestreo entre 4 y 64.');
  if(!Number.isFinite(nearMm)||nearMm<0||nearMm>1000)throw new Error('Umbral de proximidad inválido.');
  // K.frame and M.build also validate part/step/tool selection and width.
  const rows=[];let min=null,earliest=null,totalPairs=0;
  for(let i=0;i<=intervals;i++){
   const time=i/intervals,f=K.frame(profile,step,time),sheet=M.build(f.scene,width),r=P.inspect(sheet,f.scene,{nearMm});
   const item={t:time,percent:Math.round(time*1000)/10,phase:f.phase,angle:f.angle,
    minimum:r.minimum?{mm:r.minimum.mm,segment:r.minimum.segment,tool:r.minimum.tool}:null,
    evaluatedSegments:r.evaluatedSegments,checkedPairs:r.checkedPairs,
    status:!r.minimum?'no evaluable':r.minimum.mm<=1e-9?'solapamiento nominal':r.minimum.mm<nearMm?'proximidad nominal':'separado en muestras'};
   rows.push(item);totalPairs+=r.checkedPairs;
   if(item.minimum && (!min||item.minimum.mm<min.mm-1e-9))min={...item.minimum,t:time,percent:item.percent,phase:item.phase};
   if(!earliest && item.minimum && item.minimum.mm<nearMm)earliest={...item.minimum,t:time,percent:item.percent,phase:item.phase};
  }
  const count=rows[0].evaluatedSegments;
  return {model:'muestreo_prismas_nominales_v0.26',step:step+1,bend:profile.sequence[step],width,
   intervals,frames:rows.length,nearMm,checkedPairs:totalPairs,evaluatedSegments:count,
   minimum:min,firstNear:earliest,rows,
   verdict:count===0?'No hay alas previas representables en este paso':min?.mm<=1e-9?'Posible solapamiento en alguna muestra':min&&min.mm<nearMm?'Proximidad en alguna muestra':'Sin proximidad en muestras evaluables (NO garantiza seguridad)',
   safetyApproved:false,cncApproved:false,manufacturerGeometryVerified:false,continuousSweep:false,
   note:NOTE};
 }
 function at(report,cycle){
  if(!Array.isArray(report?.rows)||!report.rows.length||!Number.isFinite(cycle)||cycle<0||cycle>1)throw new Error('Informe o posición de ciclo inválidos.');
  return report.rows[Math.min(report.rows.length-1,Math.round(cycle*report.intervals))];
 }
 function exportReport(report){
  if(!Array.isArray(report?.rows)||!Number.isInteger(report.frames))throw new Error('Informe de barrido inválido.');
  return JSON.stringify({application:'Plegar Pro Plus',version:'0.26',type:'cribado_discreto_3d',
   generatedAt:new Date().toISOString(),...report,authorization:{cnc:false,industrialSafety:false,collisionCertification:false}},null,2);
 }
 return {sample,at,exportReport,NOTE};
});
