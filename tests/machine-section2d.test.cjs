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
 assert.equal(scan.checked.length,11);
 assert.ok(scan.checked.some(x=>x.id==='punzon'&&x.expectedContact));
 assert.ok(scan.checked.some(x=>x.id==='matriz'&&x.expectedContact));
 assert.equal(scan.physicallyValidated,false);
 assert.equal(scan.cncApproved,false);
 assert.ok(scan.checked.every(x=>typeof x.possibleOverlap==='boolean'));
 assert.ok(scan.hits.every(x=>x.verified===false));
});
test('No se aceptan escenas sin útiles',()=>assert.throws(()=>V.build({stop:{x:0}})));

test('La comprobación de contornos evita un falso positivo del rectángulo envolvente',()=>{
 const poly=[{x:0,y:0},{x:10,y:0},{x:0,y:10}];
 const a={x:8,y:8},b={x:9,y:9};
 assert.equal(V.crosses(a,b,V.bounds(poly)),true);
 assert.ok(require('../clearance2d.js').segmentPolygon(a,b,poly)>3);
});
test('Muestreo 2D informa primer posible contacto por fase y conserva el aviso NO CNC',()=>{
 const r=V.sweep(model,2,{intervals:12});
 assert.equal(r.frames,13);
 assert.equal(r.continuousSweep,false);
 assert.equal(r.cncApproved,false);
 assert.ok(r.hits.every(x=>x.step===3&&x.cyclePercent>=0&&x.cyclePercent<=100));
 assert.ok(r.minimums.every(x=>x.distanceMm>=0));
 assert.throws(()=>V.sweep(model,0,{intervals:70}),/Muestreo/);
});

test('Amarre superior sigue siendo independiente del nuevo perfil de punzón',()=>{
 const st=V.build(F.scene(model,1,.5));
 const punch=F.scene(model,1,.5).toolProfiles.punch.outline;
 assert.ok(st.upperHolder.length>=8);
 assert.ok(punch[1].y<st.upperHolder.at(-1).y+100,'Cuerpo de punzón acotado y separado');
 assert.equal(st.verified,false);
});

test('Distancia punta-pie de trancha aplicada en 2D y coincidente con el prisma 3D',()=>{
 const Tool3D=require('../tooling3d.js');
 for(const offset of [55,100,140]){
  const p={...model,setup:{...model.setup,ramWidth:95,ramBottomOffset:offset,dieHeight:60,tableLeft:180,tableRight:180}};
  for(const progress of [0,.5,1]){
   const scene=F.scene(p,0,progress),section=V.build(scene);
   const lowerEdge=section.ram[2].y,expected=scene.punchTipY-offset;
   assert.ok(Math.abs(lowerEdge-expected)<1e-7,'Distancia 2D incorrecta');
   assert.equal(section.ramDatumKnown,true);
   assert.equal(section.ramMeasured,true);
   assert.equal(section.holderGeometryVerified,false);
   const prism=Tool3D.prisms({width:100,thickness:scene.thickness},scene).find(x=>x.group==='ram');
   assert.ok(prism);
   assert.ok(Math.abs(prism.outline[2].y-lowerEdge)<1e-7,'Desfase 2D/3D');
  }
 }
});
test('Si no hay cota de trancha solo se dibuja la silueta esquemática',()=>{
 const section=V.build(F.scene(model,0,.3));
 assert.equal(section.ramDatumKnown,false);
 assert.equal(section.ramMeasured,false);
 assert.equal(section.holderGeometryVerified,false);
 assert.ok(Number.isFinite(section.ramBottom));
});
