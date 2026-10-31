/* Plegar Pro Plus v0.90 — shared 2D/3D illustrative kinematics.
 * Preparation of backgauge X between nominal bends, approach, forming and retract.
 * NOT an actual axis trajectory, sheet turnover or verified collision sequence.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarFoldKinematics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=typeof require==='function'?require('./forming2d.js'):window.PlegarFormingGeometry;
 const I=typeof require==='function'?require('./interference2d.js'):window.PlegarInterference2D;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const smooth=n=>{const x=clamp(n);return x*x*(3-2*x);};
 const PREP_END=.12,APPROACH=.22,FORM_END=.78;
 const rounded=n=>Math.round(n*1000000)/1000000;
 function frame(profile,step,t=0){
  if(!Number.isFinite(t)||t<0||t>1)throw new Error('Posición del ciclo fuera del rango 0–1.');
  const initial=G.scene(profile,step,0),gap=Math.max(18,Math.min(60,initial.dieOpening*1.8));
  const xTarget=initial.stop.x,prevBend=step>0?profile.sequence[step-1]:null;
  // El cambio X se asocia al B precedente, no a su posición en el programa.
  // La configuración ha sido validada previamente por G.scene.
  const xPrevious=prevBend===null?xTarget:
   (G.scene(profile,step-1,0).stop.x);
  const hasTravel=step>0&&Math.abs(xTarget-xPrevious)>1e-9;
  const moving=hasTravel&&t<PREP_END;
  const ratio=hasTravel?smooth(t/PREP_END):1;
  const x=rounded(xPrevious+(xTarget-xPrevious)*ratio);
  let phase,formingProgress,lift;
  if(moving){
   // El punzón permanece levantado mientras X se desplaza en el dibujo;
   // no se reproduce el amarre, la retirada de chapa ni la lógica CNC.
   phase='reposicionamiento X';formingProgress=0;lift=gap;
  }else if(t<APPROACH){
   phase='aproximación';formingProgress=0;
   const from=hasTravel?PREP_END:0;
   lift=gap*(1-smooth((t-from)/(APPROACH-from)));
  }else if(t<FORM_END){
   phase='plegado';formingProgress=smooth((t-APPROACH)/(FORM_END-APPROACH));lift=0;
  }else{
   phase='retirada';formingProgress=1;
   lift=gap*smooth((t-FORM_END)/(1-FORM_END));
  }
  const scene=G.scene(profile,step,formingProgress);
  // Mantener el montaje sobre la V que ya calculó forming2d.scene.
  // La sustitución de 29/10 giraba de nuevo el arco activo y podía mover
  // la chapa a través del punzón. La pose local ya conserva alas previas.
  // El tope móvil se comparte con herramientas 2D, malla 3D y cribado.
  // No desplazar la chapa para hacer coincidir artificialmente ambos bordes.
  scene.stop={...scene.stop,x,previousX:xPrevious,targetX:xTarget,
   travelRatio:hasTravel?ratio:1,travelling:moving,axisValidated:false};
  scene.interferences=I.inspect(scene);
  const punchTipY=scene.punchTipY-lift;
  scene.punchTipY=punchTipY;
  scene.toolProfiles={...scene.toolProfiles,punch:{...scene.toolProfiles.punch,
   outline:scene.toolProfiles.punch.outline.map(p=>({x:p.x,y:p.y-lift}))}};
  scene.punchContact={gapMm:rounded(Math.max(0,scene.center.y-scene.thickness/2-punchTipY)),
   state:lift>0.05?'separado':'contacto geométrico nominal',verified:false};
  const physicalAxis=scene.turn<0?'Requiere volteo o recolocación de chapa no calculada':'Orientación de chapa nominal ilustrativa';
  const backgaugeMotion={fromX:xPrevious,toX:xTarget,x,progress:hasTravel?ratio:1,
   active:moving,required:hasTravel,axisValidated:false,completed:!moving,
   note:'Desplazamiento X ilustrativo, sin aceleración/velocidad real ni contacto calibrado.'};
  return {cycle:t,phase,formingProgress,angle:scene.currentAngle,
   punchY:punchTipY,dieY:0,punchLift:lift,approachGap:gap,
   partMoved:formingProgress>0,partFormed:formingProgress>=1,
   scene,backgaugeMotion,notice:physicalAxis,
   warning:'CINEMÁTICA ILUSTRATIVA: montaje geométrico sobre V sin segundo giro del tramo activo. El movimiento real de retirada, volteo y recolocación entre golpes aún no está modelado. Sin servo real, fuerzas, recorrido verificado, seguridad CNC ni colisiones certificadas.'};
 }
 return {frame,phases:{backgaugeEnd:PREP_END,approachEnd:APPROACH,formingEnd:FORM_END}};
});

