'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const F=require('../fold-kinematics'),G=require('../forming2d');
const p={name:'Omega',material:'Acero S235JR',thickness:2,segments:[60,85,120,85,60],angles:[90,90,90,90],sequence:[1,2,4,3],setup:{machineId:'trumpf-v85',punch:'amada-p-11.101',die:'v16-88',radius:2}};
test('Tope automático detrás de toda la chapa, no en el vértice del ala contigua',()=>{
 assert.equal(G.scene(p,0,0).stop.x,350);
 for(let step=0;step<4;step++){
  const m=F.frame(p,step,.22).scene;
  assert.equal(m.interferences.backgaugeGap,0);
  assert.equal(m.interferences.backgaugeState,'contacto nominal');
  assert.equal(m.stop.source,'borde de pieza');
 }
});
test('El tope conserva su posición durante el plegado y respeta la cota manual',()=>{
 const x=F.frame(p,0,.22).scene.stop.x;
 for(const t of [.3,.5,.78,1])assert.equal(F.frame(p,0,t).scene.stop.x,x);
 const manual={...p,setup:{...p.setup,backgaugePositionMode:'manual',backgaugeX:85}};
 const m=F.frame(manual,0,.22).scene;
 assert.equal(m.stop.x,85);assert.equal(m.interferences.backgaugeGap,-265);
 assert.equal(m.interferences.backgaugeState,'interferencia');
});
test('Una cota por B tiene prioridad sobre el borde automático',()=>{
 const q={...p,setup:{...p.setup,backgaugeByBend:[100,null,70,50]}};
 const m=F.frame(q,2,.22).scene;
 assert.equal(m.bend,4);assert.equal(m.stop.x,50);assert.equal(m.stop.source,'por-pliegue');
});
