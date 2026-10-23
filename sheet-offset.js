/* v0.42 · Desplazamiento de espesor en perfiles 2D.
 * Unión de bisectrices (miter) para preservar espesor NORMAL a cada tramo.
 * Ángulos extremos se limitan para evitar coordenadas infinitas; no añade radios reales.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarSheetOffset=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function normals(points,thickness){
  if(!Array.isArray(points)||points.length<2||!Number.isFinite(thickness)||thickness<=0)
   throw Error('Se requieren al menos dos vértices y un espesor positivo.');
  const dirs=[];
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
   if(!Number.isFinite(l)||l<1e-8)throw Error('Tramo 2D degenerado en la generación 3D.');
   dirs.push({x:-dy/l,y:dx/l});
  }
  return points.map((p,i)=>{
   const a=dirs[Math.max(0,i-1)],b=dirs[Math.min(dirs.length-1,i)];
   const sum={x:a.x+b.x,y:a.y+b.y};
   const d=sum.x*b.x+sum.y*b.y;
   if(!Number.isFinite(d)||d<.0001)return {x:a.x*thickness/2,y:a.y*thickness/2,limited:true};
   const scale=Math.min(1/d,4*thickness/Math.hypot(sum.x,sum.y));
   return {x:sum.x*scale*thickness/2,y:sum.y*scale*thickness/2,limited:scale<1/d};
  });
 }
 return {normals};
});