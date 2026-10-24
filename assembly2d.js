/* Plegar Pro Plus v0.8 - chain of ALL nominal flanges around the active bend.
 * Flat, sharp hinge approximation for folds other than the active rounded bend.
 * Not a folding sequence or repositioning solver; units mm and local XY only.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarAssembly2D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const deg=d=>d*Math.PI/180;
 const point=(x,y)=>({x:Math.round(x*1e6)/1e6,y:Math.round(y*1e6)/1e6});
 function calculate(profile,model){
  const done=new Set(profile.sequence.slice(0,model.orderIndex));
  function walk(side){
   const left=side==='left',base=left?model.wingLeft:model.wingRight;
   const halfSigned=deg((model.signedAngle??Math.sign(model.turn||1)*model.currentAngle)/2);
   let angle=left?-Math.PI+halfSigned:-halfSigned;
   const items=[],hinges=[]; let from=point(base.x,base.y);
   for(let j=model.bend+(left?-1:1);j>=1&&j<=profile.angles.length;j+=left?-1:1){
    const completed=done.has(j);
    // Recorrer hacia la izquierda invierte el sentido del giro respecto al
    // recorrido original. En coordenadas SVG, +arriba equivale a restar ángulo.
    if(completed)angle+=(left?1:-1)*deg(profile.angles[j-1]);
    const len=profile.segments[left?j-1:j];
    const to=point(from.x+len*Math.cos(angle),from.y+len*Math.sin(angle));
    hinges.push({bend:j,point:from,status:completed?'realizado':'pendiente'});
    items.push({from,to,throughBend:j,status:completed?'realizado':'pendiente',length:len});
    from=to;
   }
   return {items,hinges,end:from};
  }
  const left=walk('left'),right=walk('right');
  const contour=[...left.items.slice().reverse().map(x=>x.to),model.wingLeft,...model.centerline.slice(1,-1),model.wingRight,...right.items.map(x=>x.to)].map(p=>point(p.x,p.y));
  const vertices=[...left.hinges,...right.hinges];
  return {left,right,contour,hinges:vertices,completed:[...done],pending:profile.angles.length-done.size-1,
    note:'Perfil entero supuesto en un solo plano, sin recolocación; los pliegues realizados se tratan como bisagras agudas salvo el actual. Los pendientes se muestran rectos. NO calcula un ciclo de máquina ni seguridad.'};
 }
 return {calculate};
});
