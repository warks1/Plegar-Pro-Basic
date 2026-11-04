'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../bendcalc.js'),F=require('../forming2d.js'),V=require('../machine-v85.js');
const piece={
 name:'Omega dos tipos de topes',material:'S235',thickness:2,
 segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[1,2,4,3],
 setup:{machineId:'trumpf-v85',punch:'amada-p-11.101',die:'v16-88',radius:2,kFactor:.33,
  backgaugePositionMode:'manual',backgaugeX:120,backgaugeMode:'stop',
  backgaugeByBend:[70,95,120,145],backgaugeModeByBend:[null,'support','stop','support']}
};
test('Tope 1/2 se aplica por identidad B, incluso con secuencia Omega 1-2-4-3',()=>{
 const expected=['stop','support','support','stop'];
 for(let i=0;i<4;i++){
  const m=F.scene(piece,i,0);
  assert.equal(m.bend,piece.sequence[i]);
  assert.equal(m.machineSetup.backgaugeMode,expected[i]);
  assert.equal(m.stop.mode,expected[i]);
  assert.equal(m.stop.modeSource,m.bend===1?'general':'por-pliegue');
 }
 const first=F.scene(piece,0,0),second=F.scene(piece,1,0);
 const sameStop={...piece,setup:{...piece.setup,backgaugeModeByBend:[null,null,null,null]}};
 const secondGeneral=F.scene(sameStop,1,0);
 assert.notDeepEqual(V.geometry(second).finger,V.geometry(secondGeneral).finger,'La geometría de dedo cambia según tipo por B');
 assert.deepEqual(V.geometry(first).finger,V.geometry(F.scene(sameStop,0,0)).finger);
});
test('Reordenar golpes no intercambia la selección de dedo de cada B',()=>{
 const reordered={...piece,sequence:[4,1,3,2]};
 for(let i=0;i<4;i++){
  const m=F.scene(reordered,i,0);
  assert.equal(m.stop.mode,piece.setup.backgaugeModeByBend[m.bend-1]||piece.setup.backgaugeMode);
 }
 assert.deepEqual(piece.setup.backgaugeModeByBend,[null,'support','stop','support']);
});
test('Validación impide modos falsos y conserva herencia general',()=>{
 assert.deepEqual(C.validateSetup(piece.setup).backgaugeModeByBend,[null,'support','stop','support']);
 assert.throws(()=>C.validateSetup({...piece.setup,backgaugeModeByBend:['rear']}),/B1/);
 assert.throws(()=>C.validateSetup({...piece.setup,backgaugeModeByBend:'support'}),/Tabla/);
 assert.throws(()=>C.validateSetup({...piece.setup,backgaugeModeByBend:Array(24).fill(null)}),/Tabla/);
 const fallback={...piece,setup:{...piece.setup,backgaugeMode:'support',backgaugeModeByBend:[null]}};
 assert.equal(F.scene(fallback,0,0).stop.mode,'support');
});
