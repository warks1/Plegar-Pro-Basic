'use strict';
/* Regresión 31/10/2026: una actualización no puede volver a rotar la chapa
   después de situarla sobre el punzón. Referencia: fotos/vídeos de taller. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Forming=require('../forming2d.js');
const K=require('../fold-kinematics.js');
const Sample=require('../sample-library.js');
const {build}=require('../piece3d.js');
const omega=Sample.get('perfil-omega').profile;
const reverse={...omega,angles:omega.angles.map(v=>-v)};
const profiles=[omega,reverse];
for(const [caseIndex,profile] of profiles.entries()){
 test('Contacto V / punzón: perfil montado no se gira de nuevo (caso '+(caseIndex+1)+')',()=>{
  for(let step=0;step<profile.sequence.length;step++){
   for(const cycle of [0,.12,.22,.29,.4,.5,.65,.78,.89,1]){
    const frame=K.frame(profile,step,cycle),model=frame.scene;
    const reference=Forming.scene(profile,step,frame.formingProgress);
    assert.deepEqual(model.assembly.contour,reference.assembly.contour,
     'Paso '+step+' ciclo '+cycle+': la chapa debe conservar la posición local de la V');
    assert.deepEqual(model.assembly.left.items,reference.assembly.left.items);
    assert.deepEqual(model.assembly.right.items,reference.assembly.right.items);
    const left=model.assembly.left.items.length;
    assert.deepEqual(model.assembly.contour.slice(left,left+model.centerline.length),
      model.centerline,'El arco activo no puede sufrir un segundo giro independiente del punzón');
    const mesh=build(model,100);
    assert.ok(mesh.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)));
   }
  }
 });
}
test('Al retirarse el punzón, la chapa ya plegada mantiene exactamente su pose',()=>{
 for(let step=0;step<omega.sequence.length;step++){
  const a=K.frame(omega,step,.78),b=K.frame(omega,step,1);
  assert.deepEqual(a.scene.assembly.contour,b.scene.assembly.contour);
  assert.ok(b.punchY<a.punchY);
 }
});
test('No se modifica la secuencia del usuario ni las herramientas seleccionadas',()=>{
 const before=JSON.stringify(omega);
 K.frame(omega,omega.sequence.length-1,.56);
 assert.equal(JSON.stringify(omega),before);
});
