/* Plegar Pro Plus v0.8 — rounded centreline profile for a SINGLE isolated bend.
 * This is a geometric visualization, not an elastic/plastic/contact solver.
 * Coordinates: x horizontal, y DOWN, mm. The nominal V shoulders are y=0.
 * Negative bends require repositioning, which is not calculated. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarFormingGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const G=typeof require==='function'?require('./geometry2d.js'):window.PlegarGeometry2D;
 const C=typeof require==='function'?require('./bendcalc.js'):window.PlegarBendCalc;
 const I=typeof require==='function'?require('./interference2d.js'):window.PlegarInterference2D;
 const T=typeof require==='function'?require('./toolprofiles2d.js'):window.PlegarToolProfiles2D;
 const P=typeof require==='function'?require('./previousbends2d.js'):window.PlegarPreviousBends2D;
 const A=typeof require==='function'?require('./assembly2d.js'):window.PlegarAssembly2D;
 const rad=d=>d*Math.PI/180;
 const round=n=>Math.round(n*1000000)/1000000;

 /* Rounded centreline of symmetric bend, measured relative to arc's LOW point.
  * R is the geometric mid-thickness radius Ri + t/2 (NOT the K-factor radius).
  * At a flank's virtual sharp corner, the tangent setback is R*tan(theta/2).
  */
 function relativeY(x,beta,R){
  const X=Math.abs(x),xt=R*Math.sin(beta);
  if(X<=xt+1e-10) return -R*(1-Math.sqrt(Math.max(0,1-(X/R)**2)));
  return -R*(1-Math.cos(beta))-(X-xt)*Math.tan(beta);
 }
 function scene(profile,orderIndex=0,progress=0){
  const piece=G.validate(profile),setup=C.validateSetup(profile.setup);
  if(!Number.isInteger(orderIndex)||orderIndex<0||orderIndex>=piece.sequence.length)throw new Error('Paso de secuencia fuera de rango.');
  if(!Number.isFinite(progress)||progress<0||progress>1)throw new Error('Progreso de reproducción entre 0 y 1.');
  const bend=piece.sequence[orderIndex];
  const die=C.DIES.find(d=>d.id===setup.die),punch=C.PUNCHES.find(p=>p.id===setup.punch);
  const turn=piece.angles[bend-1],angle=Math.abs(turn)*progress,beta=rad(angle/2);
  const half=die.opening/2,left=piece.segments[bend-1],right=piece.segments[bend];
  const t=piece.thickness,R=setup.radius+t/2;
  const dieDepth=T.dieDepth(die);
  const tangentSetback=R*Math.tan(beta),tangentX=R*Math.sin(beta);
  const warnings=[];
  const leftStraight=Math.max(0,left-tangentSetback),rightStraight=Math.max(0,right-tangentSetback);
  if(left+1e-7<tangentSetback||right+1e-7<tangentSetback){
   warnings.push('El radio necesita más longitud de ala que la disponible hasta el vértice nominal; el perfil se recorta solo para visualizar.');
  }
  if(tangentX>=half-1e-7 && beta>1e-7){
   warnings.push('La zona redondeada alcanza el hombro de la V; el apoyo en hombros ya no se puede estimar con las caras rectas.');
  }
  // Nominally position the sheet on BOTH V shoulders using the local tangent
  // slope and a half-thickness offset. This is NOT a calculated force/contact.
  const shoulderAngle=(half<tangentX && R>0)?Math.asin(Math.min(1,half/R)):beta;
  const cy= -relativeY(half,beta,R)-(t/2)*Math.cos(shoulderAngle);
  // El signo del plano (+/-) no cambia el sentido de deformación sobre la
  // matriz V. Para un -90° se necesita voltear la chapa ANTES del golpe.
  // No se considera resuelta la cinemática del volteo o la sujeción.
  const mountSign=turn<0?-1:1;
  const machineAngle=angle,sheetSign=1;
  const sheetY=y=>round(y);
  const ty=cy-R*(1-Math.cos(beta));
  const wingLeft={x:round(-tangentX-leftStraight*Math.cos(beta)),y:sheetY(ty-leftStraight*Math.sin(beta))};
  const wingRight={x:round(tangentX+rightStraight*Math.cos(beta)),y:sheetY(ty-rightStraight*Math.sin(beta))};
  const center={x:0,y:round(cy)};
  const tangentLeft={x:round(-tangentX),y:sheetY(ty)},tangentRight={x:round(tangentX),y:sheetY(ty)};
  const arc=[];
  const samples=Math.max(8,Math.ceil(angle/3));
  for(let k=0;k<=samples;k++){
   const a=-beta+(2*beta*k/samples);
   arc.push({x:round(R*Math.sin(a)),y:sheetY(cy-R*(1-Math.cos(a)))});
  }
  const centerline=[wingLeft,...arc,wingRight];
  const shoulderY=round(cy+relativeY(half,beta,R)+(t/2)*Math.cos(shoulderAngle));
  // A shoulder beyond the modeled end of an adjacent leg cannot support it.
  if(wingLeft.x>-half+1e-7||wingRight.x<half-1e-7){
   warnings.push('Un ala nominal no alcanza el hombro de la V en este perfil aislado.');
  }
  if(cy+t/2>dieDepth+1e-6){
   warnings.push('La cara inferior idealizada rebasa la profundidad nominal de la V; posible incompatibilidad geométrica, NO detección de colisión certificada.');
  }
  if(angle>0 && 180-angle<punch.angle-1e-8){
   warnings.push('El ángulo interior objetivo es menor que el ángulo nominal del punzón seleccionado.');
  }
  if(angle>0 && 180-angle<die.angle-1e-8){
   warnings.push('El ángulo interior objetivo es menor que el ángulo nominal de la matriz seleccionada.');
  }
  if(setup.radius<punch.nose-1e-8){
   warnings.push('Radio interior supuesto inferior al radio nominal de punta del punzón.');
  }
  if(turn<0)warnings.push('Pliegue negativo B'+bend+' '+turn+'°: requiere VOLTEO previo de chapa. Se muestra la orientación nominal ya preparada sobre la matriz V; el giro, agarre, retirada y recolocación reales no están calculados. NO CNC.');
  if(angle>150)warnings.push('Pliegue superior a 150°: aproximación fuera de su aplicación habitual.');
  const gauge=C.backgaugeTarget(piece,bend,setup);
  const output={
   bend,orderIndex,step:orderIndex+1,steps:piece.sequence.length,progress,turn,
   targetAngle:Math.abs(turn),currentAngle:angle,signedAngle:round(turn*progress),
   mountSign,machineAngle,sheetSign,requiresTurnover:turn<0,orientationVerified:false,
   left,right,center,wingLeft,wingRight,
   tangentLeft,tangentRight,centerline,dieOpening:die.opening,dieDepth,
   punchAngle:punch.angle,punchNose:punch.nose,punchHeight:punch.height,dieAngle:die.angle,dieHeight:setup.dieHeight??die.height,thickness:t,
   insideRadius:setup.radius,centreRadius:R,tangentSetback,tangentX,
   machineSetup:{machineId:setup.machineId,backgaugeMode:setup.backgaugeMode,dieHeight:setup.dieHeight??die.height??null,tableLeft:setup.tableLeft,tableRight:setup.tableRight,ramWidth:setup.ramWidth,ramBottomOffset:setup.ramBottomOffset},
   punchCatalogTool:punch,dieCatalogTool:die,
   // 'depth' is nominal centreline descent from its START position, not CNC Y.
   depth:round(cy+t/2),punchTipY:round(cy-t/2),shoulderY,
   stop:{x:gauge.x,bend,
    source:gauge.source,
    y:round(-t/2),width:Math.max(2,t),top:round(-t/2-12),bottom:round(-t/2+4)},warnings,
   note:'El signo (+/−) corresponde al PLANO final. Sobre la V se representa el golpe de prensa con punzón superior y alas elevándose; para -90° se supone un VOLTEO ANTERIOR que NO se ha simulado. No se conocen agarres, cambios de apoyo o trayectoria real. NO CNC ni colisiones verificadas.'
  };
  output.toolProfiles=T.profiles(output);
  output.previous=P.calculate(piece,output);
  output.assembly=A.calculate(piece,output);
  if(output.previous.completed.some(id=>piece.angles[id-1]<0))output.warnings.push('Hay pliegues anteriores negativos: la orientación y la recolocación necesarias NO se han resuelto.');
  if(gauge.source==='ala contigua'){
   // El tope se posiciona antes del golpe; no persigue el ala mientras sube.
   const datum=progress===0?I.rearExtent(output):scene(profile,orderIndex,0).stop.x;
   if(datum!==null&&datum>0){output.stop.x=round(datum);output.stop.source='borde de pieza';}
   else output.warnings.push('No se encuentra un borde trasero a la altura del tope. Revisar orientación y apoyo.');
  }
  output.interferences=I.inspect(output);
  return output;
 }
 return {scene};
});


