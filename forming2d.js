/* Plegar Pro Plus v0.4: local kinematic *illustration* of ONE bend at a time.
 * Nominal sheet centreline; no material deformation/contact forces/collision clearance.
 * All measurements in mm; signed bends require orientation changes not implemented. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarFormingGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=typeof require==='function'?require('./geometry2d.js'):window.PlegarGeometry2D;
 const C=typeof require==='function'?require('./bendcalc.js'):window.PlegarBendCalc;
 function scene(profile,orderIndex=0,progress=0){
  const piece=G.validate(profile), setup=C.validateSetup(profile.setup);
  if(!Number.isInteger(orderIndex)||orderIndex<0||orderIndex>=piece.sequence.length)throw new Error('Paso de secuencia fuera de rango.');
  if(!Number.isFinite(progress)||progress<0||progress>1)throw new Error('Progreso de reproducción entre 0 y 1.');
  const bend=piece.sequence[orderIndex];
  const die=C.DIES.find(d=>d.id===setup.die),punch=C.PUNCHES.find(p=>p.id===setup.punch);
  const turn=piece.angles[bend-1],fold=Math.abs(turn)*progress*Math.PI/180;
  const half=die.opening/2,left=piece.segments[bend-1],right=piece.segments[bend];
  const depth=half*Math.tan(fold/2), dieDepth=half/Math.tan(die.angle*Math.PI/360);
  const wingLeft={x:-left*Math.cos(fold/2),y:depth-left*Math.sin(fold/2)-piece.thickness/2};
  const wingRight={x:right*Math.cos(fold/2),y:depth-right*Math.sin(fold/2)-piece.thickness/2};
  const center={x:0,y:depth-piece.thickness/2};
  const warnings=[];
  const leftSupport=half/Math.max(1e-10,Math.cos(fold/2));
  if(Math.min(left,right)+1e-7<leftSupport) warnings.push('Un ala nominal no alcanza el hombro de la V en esta geometría idealizada.');
  if(depth+piece.thickness/2>dieDepth+0.0001)warnings.push('La geometría idealizada sobrepasa la profundidad nominal de la V: revisar configuración; esto no es una detección de colisión certificada.');
  if(turn<0)warnings.push('Pliegue negativo: habría que reorientar la pieza; la maniobra no está modelada.');
  if(Math.abs(turn)>150)warnings.push('Giro superior a 150°: perfil idealizado sin radios ni interferencias.');
  return {
   bend,orderIndex,step:orderIndex+1,steps:piece.sequence.length,progress,turn,targetAngle:Math.abs(turn),currentAngle:Math.abs(turn)*progress,
   left,right,center,wingLeft,wingRight,dieOpening:die.opening,dieDepth,punchAngle:punch.angle,
   punchNose:punch.nose,dieAngle:die.angle,thickness:piece.thickness,depth,
   stop:{x:right,y:-piece.thickness/2},warnings,
   note:'Cinemática local ilustrativa de un solo pliegue. No reproduce radios, apoyo real, recuperación elástica, topes dinámicos, alas anteriores ni colisiones fiables.'
  };
 }
 return {scene};
});
