/* Cribado 2D de accesibilidad de piezas conformadas. NO certifica colisiones.
 * Eje Y positivo hacia mesa. Altura de matriz desde hombro hasta mesa nominal.
 * Sin CAD de trancha, soportes, útiles, topes ni transformación física validada.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarMachineClearance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 function dieHeight(profile){
  const setup=C.validateSetup(profile.setup);
  const selected=C.DIES.find(d=>d.id===setup.die);
  return setup.dieHeight===null?(selected.height??null):setup.dieHeight;
 }
 function omegaPocket(profile){
  // Patrón característico de cuatro pliegues de un sombrerete/omega.
  // La profundidad aquí es nominal, NO holgura ni altura física de entrada.
  const a=profile.angles,s=profile.segments;
  if(a.length!==4||s.length!==5)return null;
  const sign=Math.sign(a[0]);
  if(!sign||Math.sign(a[3])!==sign||Math.sign(a[1])!==-sign||Math.sign(a[2])!==-sign)return null;
  if(a.some(x=>Math.abs(x)<60||Math.abs(x)>120))return null;
  return Math.min(s[1],s[3])*Math.min(Math.abs(a[1]),Math.abs(a[2]))/90;
 }
 function inspect(profile,scene){
  if(!scene||!scene.toolProfiles?.die?.outline)throw Error('Escena de plegado requerida para revisar holguras.');
  const height=dieHeight(profile),alerts=[],details=[],t=profile.thickness;
  let tableGap=null,possibleTableContact=false;
  if(height===null){
   alerts.push('Altura de matriz desconocida: no se puede comprobar la proximidad a la mesa.');
  }else{
   const outer=Math.max(...scene.toolProfiles.die.outline.map(p=>Math.abs(p.x)));
   // Sólo alas anteriores. El pliegue activo queda fuera porque es zona de contacto previsto.
   for(const path of scene.previous?.paths||[]){
    for(const p of path.points||[]){
     if(Math.abs(p.x)<=outer+t/2)continue;
     const gap=height-(p.y+t/2);
     tableGap=tableGap===null?gap:Math.min(tableGap,gap);
    }
   }
   if(tableGap!==null&&tableGap<1){
    possibleTableContact=true;
    alerts.push('Posible interferencia de ala anterior con la mesa: holgura 2D aproximada '+tableGap.toFixed(1)+' mm (H matriz '+height+' mm).');
   }
   const pocket=omegaPocket(profile);
   if(pocket!==null&&pocket>height){
    alerts.push('Perfil omega: profundidad nominal de paredes '+pocket.toFixed(1)+' mm > H matriz '+height+' mm. Verificar cierre, orientación y posible choque con mesa/trancha antes de plegar.');
   }
   details.push('Matriz H'+height+' mm; mesa idealizada a Y='+height+' mm desde el hombro de V.');
  }
  for(const problem of scene.interferences?.problems||[]){
   if(problem.code==='PRIOR_FLANGE_NEAR_TOOL'||problem.code==='BACKGAUGE_OVERLAP'){
    alerts.push(problem.component+': '+problem.message);
   }
  }
  // No inferir un hueco libre en una máquina de la que NO existe un sólido CAD.
  alerts.push('Trancha, mesa real, anclajes, inversión/reorientación de chapa y recorrido completo no verificados.');
  return {dieHeight:height,tableGap,possibleTableContact,alerts:[...new Set(alerts)],details,
   physicallyValidated:false,cncApproved:false,geometryVerified:false};
 }
 return {dieHeight,omegaPocket,inspect};
});