'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../machine-section2d.js'),F=require('../forming2d.js');
const model={name:'Omega',material:'Acero S235JR',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[1,2,4,3],
 setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
test('La sección tiene amarre, estructura superior e inferior, topes con dedo y carro',()=>{
 const scene=F.scene(model,0,.5),section=V.build(scene),ids=section.parts.map(x=>x.id);
 for(const id of ['estructura-superior','portapunzon','mordaza','portamatriz','mesa','estructura-inferior','tope-dedo','tope-brazo','tope-carro'])assert.ok(ids.includes(id),id);
 assert.ok(section.parts.every(x=>x.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
 assert.equal(section.verified,false);
 assert.equal(section.tableMeasured,false);
});
test('Elementos inferiores quietos, portapunzón y trancha siguen la carrera Y',()=>{
 const start=V.build(F.scene(model,0,0)),finish=V.build(F.scene(model,0,1));
 assert.deepEqual(start.table,finish.table);
 assert.deepEqual(start.dieHolder,finish.dieHolder);
 assert.notDeepEqual(start.ram,finish.ram);
 assert.notDeepEqual(start.upperHolder,finish.upperHolder);
 assert.deepEqual(start.finger,finish.finger);
});
test('El cribado conserva estados nominales por pieza sin certificar contacto real',()=>{
 const a=F.scene(model,0,.7),s=V.build(a),scan=V.inspect(a,s);
 assert.equal(scan.checked.length,9);
 assert.equal(scan.physicallyValidated,false);
 assert.equal(scan.cncApproved,false);
 assert.ok(scan.checked.every(x=>typeof x.possibleOverlap==='boolean'));
 assert.ok(scan.hits.every(x=>x.verified===false));
});
test('No se aceptan escenas sin útiles',()=>assert.throws(()=>V.build({stop:{x:0}})));
