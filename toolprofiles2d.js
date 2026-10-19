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
 function punch({punchAngle,punchNose,punchTipY,dieOpening}){
  const alpha=rad(punchAngle/2),r=punchNose;
  const topHeight=Math.max(22,dieOpening*1.7);
  const centerY=punchTipY-r;
  const tx=r*Math.cos(alpha),ty=centerY+r*Math.sin(alpha);
  const topY=punchTipY-topHeight,topX=tx+(ty-topY)*Math.tan(alpha);
  const points=[pt(-topX,topY),pt(topX,topY),pt(tx,ty)];
  for(let i=1;i<=20;i++){
   const a=Math.PI/2-alpha+(2*alpha*i/20);
   points.push(pt(r*Math.cos(a),centerY+r*Math.sin(a)));
  }
  return {outline:points,tipY:punchTipY,nose:r,angle:punchAngle};
 }
 function die({dieOpening,dieDepth}){
  const h=dieOpening/2,outer=h+Math.max(14,Math.min(40,dieOpening));
  const bottom=Math.max(dieDepth+22,32);
  return {outline:[pt(-outer,0),pt(-h,0),pt(0,dieDepth),pt(h,0),pt(outer,0),pt(outer,bottom),pt(-outer,bottom)],opening:dieOpening,depth:dieDepth};
 }
 function profiles(model){return {punch:punch(model),die:die(model)};}
 return {punch,die,profiles};
});
