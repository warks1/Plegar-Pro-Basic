/* Plegar Pro Plus v0.7 — schematic previously formed flanges in plane.
 * This is a conditional hypothesis, not an order/rotation/sequence solver.
 * Existing bends are ideal SHARP hinges; new bend uses v0.5 rounded profile.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarPreviousBends2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rad=n=>n*Math.PI/180;
 function calculate(profile,m){
  const ids=profile.sequence.slice(0,m.orderIndex);
  const completed=new Set(ids);
  const paths=[];
  // Left and right are traced away from the currently active bend.
  for (const side of ['left','right']){
   const backwards=side==='left';
   const origin=backwards?m.wingLeft:m.wingRight;
   const halfSigned=(m.signedAngle??Math.sign(m.turn||1)*m.currentAngle)*Math.PI/360;
   let direction=backwards?(-Math.PI+halfSigned):(-halfSigned);
   // Skip the current bend and use only joints ALREADY formed in order.
   let j=backwards?m.bend-1:m.bend+1;
   const points=[{x:origin.x,y:origin.y}];
   const included=[];
   let iter=0;
   while(j>=1&&j<=profile.angles.length&&iter++<profile.angles.length){
    if(!completed.has(j))break;
    const angle=profile.angles[j-1];
    direction+=(backwards?1:-1)*rad(angle);
    const length=profile.segments[backwards?j-1:j];
    const from=points[points.length-1];
    const target={x:from.x+length*Math.cos(direction),y:from.y+length*Math.sin(direction)};
    points.push(target);
    included.push(j);
    j+=backwards?-1:1;
   }
   if(included.length)paths.push({side,points,bends:included});
  }
  return {paths,completed:[...ids],note:'Alas previas dibujadas como bisagras agudas en un plano y sin recolocar la pieza, ni simular trayectorias CNC o cambios de apoyo. Solo cribado ilustrativo.'};
 }
 return {calculate};
});
