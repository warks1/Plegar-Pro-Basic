/* Pose global del perfil para un golpe. Conserva todas las alas y los pliegues
 * concluidos, incluso los que no tocan el B activo. Los dobleces anteriores
 * siguen siendo bisagras ideales; la orientación de recolocación es nominal.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarSequencePose=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rad=d=>d*Math.PI/180;
 const point=(x,y)=>({x:Math.round(x*1e6)/1e6,y:Math.round(y*1e6)/1e6});
 const add=(a,b)=>point(a.x+b.x,a.y+b.y);
 const rotate=(p,origin,angle)=>{
  const x=p.x-origin.x,y=p.y-origin.y,c=Math.cos(angle),s=Math.sin(angle);
  return point(origin.x+x*c-y*s,origin.y+x*s+y*c);
 };
 function assemble(profile,step,progress,scene){
  const activeBend=profile.sequence[step];
  if(!Number.isInteger(activeBend)||!scene?.center||!scene?.wingLeft||!scene?.wingRight||!Array.isArray(scene.centerline))
   throw new Error('No se puede colocar el perfil completo en el golpe activo.');
  const completed=new Set(profile.sequence.slice(0,step));
  const turns=profile.angles.map((angle,i)=>{
   const bend=i+1;
   if(bend===activeBend)return Math.abs(angle)*progress;
   return completed.has(bend)?angle:0;
  });
  // Vértices de toda la pieza desde el plano. Cada pliegue ya concluido
  // conserva su giro con signo; los pendientes permanecen planos.
  const vertices=[{x:0,y:0}];let direction=0;
  profile.segments.forEach((length,i)=>{
   if(i>0)direction+=rad(turns[i-1]);
   const last=vertices.at(-1);
   vertices.push(point(last.x+Math.cos(direction)*length,last.y-Math.sin(direction)*length));
  });
  const pivot=vertices[activeBend],sumBefore=turns.slice(0,activeBend-1).reduce((a,b)=>a+b,0);
  const beta=rad(Math.abs(scene.turn)*progress/2);
  // Giro rígido nominal para apoyar el B seleccionado sobre el centro de la V.
  const mounting=beta+rad(sumBefore);
  const mapped=vertices.map(v=>rotate(v,pivot,mounting));
  mapped[activeBend]=point(scene.center.x,scene.center.y);
  const leftOffset=point(scene.wingLeft.x-mapped[activeBend-1].x,scene.wingLeft.y-mapped[activeBend-1].y);
  const rightOffset=point(scene.wingRight.x-mapped[activeBend+1].x,scene.wingRight.y-mapped[activeBend+1].y);
  for(let i=0;i<activeBend;i++)mapped[i]=add(mapped[i],leftOffset);
  for(let i=activeBend+1;i<mapped.length;i++)mapped[i]=add(mapped[i],rightOffset);
  mapped[activeBend-1]=point(scene.wingLeft.x,scene.wingLeft.y);
  mapped[activeBend]=point(scene.center.x,scene.center.y);
  mapped[activeBend+1]=point(scene.wingRight.x,scene.wingRight.y);

  const left=[],right=[],hinges=[];
  for(let bend=activeBend-1;bend>=1;bend--){
   left.push({from:mapped[bend],to:mapped[bend-1],throughBend:bend,
    status:completed.has(bend)?'realizado':'pendiente',length:profile.segments[bend-1]});
   hinges.push({bend,point:mapped[bend],status:completed.has(bend)?'realizado':'pendiente'});
  }
  for(let bend=activeBend+1;bend<=profile.angles.length;bend++){
   right.push({from:mapped[bend],to:mapped[bend+1],throughBend:bend,
    status:completed.has(bend)?'realizado':'pendiente',length:profile.segments[bend]});
   hinges.push({bend,point:mapped[bend],status:completed.has(bend)?'realizado':'pendiente'});
  }
  const curve=scene.centerline.map(p=>rotate(p,scene.center,mounting));
  curve[0]=point(scene.wingLeft.x,scene.wingLeft.y);
  curve[curve.length-1]=point(scene.wingRight.x,scene.wingRight.y);
  const contour=[...left.slice().reverse().map(item=>item.to),...curve,...right.map(item=>item.to)];
  return {left:{items:left,hinges:left.map(x=>({bend:x.throughBend,point:x.from,status:x.status})),end:mapped[0]},
   right:{items:right,hinges:right.map(x=>({bend:x.throughBend,point:x.from,status:x.status})),end:mapped.at(-1)},
   contour,hinges,completed:[...completed],pending:profile.angles.length-completed.size-1,
   mountingAngleDeg:mounting*180/Math.PI,physicallyRepositioned:false,
   note:'Pieza completa reconstruida con giros nominales y bisagras previas agudas. El montaje del B activo se orienta para el dibujo; no anima ni valida la recolocación física.'};
 }
 return {assemble};
});
