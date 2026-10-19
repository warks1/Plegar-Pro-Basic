/* Plegar Pro Plus v0.25 — kinematic visualization only.
 * Synchronized approach / nominal forming / retract along Y.
 * A moving punch is NOT a Y-axis servo model, force/contact solver or safety check.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarFoldKinematics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=typeof require==='function'?require('./forming2d.js'):window.PlegarFormingGeometry;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const smooth=n=>{const x=clamp(n);return x*x*(3-2*x);};
 const APPROACH=.22,FORM_END=.78;
 function frame(profile,step,t=0){
  if(!Number.isFinite(t)||t<0||t>1)throw new Error('Posición del ciclo fuera del rango 0–1.');
  const initial=G.scene(profile,step,0);
  const gap=Math.max(18,Math.min(60,initial.dieOpening*1.8));
  let phase,formingProgress,lift;
  if(t<APPROACH){
   phase='aproximación';formingProgress=0;
   lift=gap*(1-smooth(t/APPROACH));
  }else if(t<FORM_END){
   phase='plegado';formingProgress=smooth((t-APPROACH)/(FORM_END-APPROACH));lift=0;
  }else{
   phase='retirada';formingProgress=1;
   lift=gap*smooth((t-FORM_END)/(1-FORM_END));
  }
  const scene=G.scene(profile,step,formingProgress);
  // Only a rigid, vertical displacement of the nominal punch outline.
  const punchTipY=scene.punchTipY-lift;
  scene.punchTipY=punchTipY;
  scene.toolProfiles={...scene.toolProfiles,punch:{...scene.toolProfiles.punch,
   outline:scene.toolProfiles.punch.outline.map(p=>({x:p.x,y:p.y-lift}))}};
  const physicalAxis=scene.turn<0?'Requiere recolocación no calculada':'Orientación nominal ilustrativa';
  return {cycle:t,phase,formingProgress,angle:scene.currentAngle,
   punchY:punchTipY,dieY:0,punchLift:lift,approachGap:gap,
   partMoved:formingProgress>0,partFormed:formingProgress>=1,
   scene,notice:physicalAxis,
   warning:'SECUENCIA CINEMÁTICA ILUSTRATIVA: no hay eje Y real, cálculos de fuerzas, contacto físico, compensación elástica ni validación de colisiones.'};
 }
 return {frame,phases:{approachEnd:APPROACH,formingEnd:FORM_END}};
});
