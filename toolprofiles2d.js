/* Plegar Pro Plus v0.7: approximate dimensioned 2D envelopes. Not vendor CAD.
 * Units mm, x right, y down. The punch's tip is at tipY.
 * Its circular nose has tangent contact with generic straight 30/88-degree flanks.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolProfiles2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rad=n=>n*Math.PI/180;
 const pt=(x,y)=>({x,y});
 function punch({punchAngle,punchNose,punchTipY,dieOpening,punchHeight}){
  const alpha=rad(punchAngle/2),r=punchNose;
  const topHeight=Math.max(22,dieOpening*1.7,punchHeight||0);
  const centerY=punchTipY-r;
  const tx=r*Math.cos(alpha),ty=centerY+r*Math.sin(alpha);
  // Un flanco que crece durante toda la altura crea un triángulo enorme.
  // Representar una espiga recta y limitar la zona de flancos próximos a la punta.
  // Longitud SOLO ilustrativa: NO sustituye perfil medido, DXF ni CAD de fabricante.
  const topY=punchTipY-topHeight,flankHeight=Math.min(11,topHeight*.42);
  const shoulderY=ty-flankHeight,shankHalf=tx+flankHeight*Math.tan(alpha);
  const points=[pt(-shankHalf,topY),pt(shankHalf,topY),
   pt(shankHalf,shoulderY),pt(tx,ty)];
  for(let i=1;i<=20;i++){
   // Contacto tangente al flanco recto en a=alpha; el lado izquierdo
   // termina en pi-alpha. Para 30° el arco cubre 150°, para 88° cubre 92°.
   // El intervalo anterior (pi/2 +/- alpha) rompía el enlace, sobre todo en 30°.
   const a=alpha+(Math.PI-2*alpha)*i/20;
   points.push(pt(r*Math.cos(a),centerY+r*Math.sin(a)));
  }
  points.push(pt(-shankHalf,shoulderY));
  return {outline:points,tipY:punchTipY,nose:r,angle:punchAngle,
   geometry:'flancos-rectos-tangentes-a-radio',
   model:'espiga-recta-con-punta-nominal',verified:false};
 }
 function die({dieOpening,dieDepth,dieHeight}){
  const h=dieOpening/2,outer=h+Math.max(14,Math.min(40,dieOpening));
  const bottom=Math.max(dieDepth+22,32,dieHeight||0);
  return {outline:[pt(-outer,0),pt(-h,0),pt(0,dieDepth),pt(h,0),pt(outer,0),pt(outer,bottom),pt(-outer,bottom)],opening:dieOpening,depth:dieDepth};
 }
 function profiles(model){return {punch:punch(model),die:die(model)};}
 return {punch,die,profiles};
});
