/* v0.10: diagnostic presentation using EXISTING 2D planar clearance estimates.
 * No new collision solver, swept tool envelopes or 3D machining verification.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarSceneAudit3D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function inspect(scene,mesh){
  if(!scene?.interferences||!Array.isArray(mesh?.segmentStatuses))throw new Error('Escena 3D incompleta.');
  const counts={completed:0,active:0,pending:0};
  mesh.segmentStatuses.forEach(s=>{if(s in counts)counts[s]++;});
  const clearances=(scene.interferences.flangeClearances||[]).filter(c=>Number.isFinite(c.gap)&&c.gap>=0)
   .slice().sort((a,b)=>a.gap-b.gap).map(c=>({component:String(c.component),side:c.side==='left'?'izquierda':'derecha',gap:c.gap}));
  const minimum=clearances.length?clearances[0]:null;
  const priorBends=scene.interferences.priorBendsEvaluated||[];
  const nearThreshold=Math.max(1,scene.thickness);
  const status=!priorBends.length?'sin alas previas evaluables':minimum?.gap<=0.05?'posible solapamiento plano':minimum&&minimum.gap<nearThreshold?'distancia pequeña (modelo plano)':'sin proximidad en trayectorias examinadas';
  return {counts,minimum,clearances,priorBends:[...priorBends],status,
   warningCount:scene.warnings.length+scene.interferences.problems.length,
   note:'Distancias calculadas únicamente con contornos 2D genéricos, alas previas planas y espesor nominal. No son holguras reales 3D ni garantizan ausencia de colisión.'};
 }
 return {inspect};
});
