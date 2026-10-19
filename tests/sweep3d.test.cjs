const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../sweep3d.js');
const K=require('../fold-kinematics.js');
const part={name:'Omega',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
test('muestras abarcan aproximación, plegado, retirada y extremos',()=>{
 const scan=S.sample(part,1,120,{intervals:20});
 assert.equal(scan.frames,21);assert.equal(scan.rows[0].t,0);assert.equal(scan.rows.at(-1).t,1);
 assert.equal(scan.rows[0].phase,'aproximación');assert.equal(scan.rows[10].phase,'plegado');assert.equal(scan.rows[20].phase,'retirada');
 assert.equal(scan.checkedPairs,scan.rows.reduce((s,x)=>s+x.checkedPairs,0));
 assert.ok(scan.rows.every(x=>x.checkedPairs===x.evaluatedSegments*3));
 assert.ok(scan.rows.every(x=>Number.isFinite(x.angle)&&x.minimum?.mm>=0));
});
test('primer pliegue no inventa interferencias con alas previas',()=>{
 const scan=S.sample(part,0,100);
 assert.equal(scan.evaluatedSegments,0);assert.equal(scan.checkedPairs,0);
 assert.equal(scan.minimum,null);assert.equal(scan.firstNear,null);
 assert.match(scan.verdict,/No hay alas/);
});
test('resumen y mínimo concuerdan exactamente con las muestras',()=>{
 const scan=S.sample(part,3,100,{intervals:8,nearMm:3});
 const mins=scan.rows.filter(x=>x.minimum).map(x=>x.minimum.mm);
 assert.ok(mins.length>0);
 assert.equal(scan.minimum.mm,Math.min(...mins));
 const first=scan.rows.find(x=>x.minimum&&x.minimum.mm<3);
 assert.equal(scan.firstNear?.percent,first?.percent);
 for(const x of [0,.5,1])assert.equal(S.at(scan,x).t,x);
});
test('minimización muestral no se presenta como barrido continuo ni seguridad',()=>{
 const scan=S.sample(part,2,180,{intervals:12});
 assert.equal(scan.continuousSweep,false);
 assert.equal(scan.safetyApproved,false);
 assert.equal(scan.cncApproved,false);
 assert.equal(scan.manufacturerGeometryVerified,false);
 const doc=JSON.parse(S.exportReport(scan));
 assert.equal(doc.rows.length,13);
 assert.deepEqual(doc.authorization,{cnc:false,industrialSafety:false,collisionCertification:false});
 assert.match(doc.note,/NO CNC/);
 assert.match(doc.note,/NO demuestra ausencia de colisión/);
});
test('cambio de ancho, matriz, paso y posición respeta dimensiones y fases',()=>{
 const a=S.sample(part,2,100,{intervals:4});
 const b=S.sample(part,2,200,{intervals:4});
 const c=S.sample({...part,setup:{...part.setup,die:'v24-88'}},2,100,{intervals:4});
 assert.equal(a.width,100);assert.equal(b.width,200);assert.equal(c.bend,a.bend);
 assert.equal(a.rows[2].angle,K.frame(part,2,.5).angle);
 assert.ok(Number.isFinite(c.rows[2].minimum.mm));
});
test('parámetros fuera de rango provocan errores',()=>{
 for(const intervals of [0,3,65,8.5,NaN])assert.throws(()=>S.sample(part,1,100,{intervals}),/intervalos/);
 for(const nearMm of [-1,Infinity,1001])assert.throws(()=>S.sample(part,1,100,{nearMm}),/Umbral/);
 for(const width of [0,5001,Infinity])assert.throws(()=>S.sample(part,1,width));
 assert.throws(()=>S.sample(part,99));
 assert.throws(()=>S.at({rows:[]},0));assert.throws(()=>S.at(S.sample(part,1),1.1));
 assert.throws(()=>S.exportReport({}));
});
