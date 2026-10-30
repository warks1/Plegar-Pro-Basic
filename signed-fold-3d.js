/* Vista 3D de la PIEZA con ángulos firmados (+ arriba / - abajo).
 * Solo representa la geometría nominal del plano: NO coloca la chapa sobre
 * la matriz, NO calcula agarres ni simula el volteo físico entre golpes. */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./signed-fold-view.js'):root.PlegarSignedFoldView,
  typeof module==='object'&&module.exports?require('./piece3d.js'):root.PlegarPiece3D,
  typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarSignedFold3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Signed,Mesh,G){
 'use strict';
 function build(source,step,progress,width=100){
  const p=G.validate(source),m=Signed.model(p,step,progress);
  const done=new Set(p.sequence.slice(0,step));
  const left=[],right=[];
  // Los tramos vecinos del pliegue activo conservan sus estados en la malla,
  // aunque el perfil completo se muestra fuera de la máquina.
  for(let bend=m.bend-1;bend>=1;bend--)
   left.push({status:done.has(bend)?'realizado':'pendiente'});
  for(let bend=m.bend+1;bend<=p.angles.length;bend++)
   right.push({status:done.has(bend)?'realizado':'pendiente'});
  const mesh=Mesh.build({thickness:p.thickness,assembly:{
   contour:m.points,left:{items:left},right:{items:right}
  }},width);
  return {...mesh,signedAngle:m.angle,turn:m.target,bend:m.bend,
   axisMode:'plano-firmado',sheetTurnoverSimulated:false,
   source:'Vista nominal de la pieza con signo (+ arriba, - abajo). Fuera de máquina. NO CNC ni colisiones verificadas.'};
 }
 return {build};
});