'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Work=require('../bend-workplan.js');
const Samples=require('../sample-library.js');
test('hoja de plegado respeta orden táctil, material, espesor y herramienta',()=>{
 const sample=Samples.get('perfil-omega'),p={...sample.profile,sequence:[3,1,4,2]};
 const w=Work.build(p,{width:250});
 assert.deepEqual(w.rows.map(s=>s.bend),[3,1,4,2]);
 assert.deepEqual(w.rows.map(s=>s.step),[1,2,3,4]);
 assert.equal(w.thickness,2);
 assert.equal(w.width,250);
 assert.equal(w.material,'Acero S235JR');
 assert.equal(w.rows[0].die,p.setup.die);
 assert.equal(w.rows[0].punch,p.setup.punch);
 assert.equal(w.rows[0].angle,90);
 assert.ok(w.estimatedForceKN>0);
 assert.match(w.warning,/NO/);
 assert.match(Work.html(w),/HOJA DE PLEGADO/);
 assert.match(Work.csv(w),/Acero S235JR/);
});
test('cada uno de los 12 planos de ejemplo produce una hoja individual de secuencia',()=>{
 const items=Samples.list();assert.equal(items.length,12);
 for(const s of items){
  const result=Work.build(s.profile,{width:s.width});
  assert.equal(result.rows.length,s.profile.angles.length);
  assert.equal(new Set(result.rows.map(x=>x.bend)).size,result.rows.length);
  assert.ok(result.rows.every(x=>x.opening>0));
  assert.match(Work.csv(result),/NO CNC|NO ACEPTACIÓN|NO/);
 }
});
test('CSV escapa formulas de hoja de cálculo introducidas en nombres de proyecto',()=>{
 const item=Samples.get('canal-u');const p={...item.profile,name:'=HYPERLINK("https://ejemplo.test")'};
 const w=Work.build(p,{width:200}),csv=Work.csv(w);
 assert.ok(csv.includes('"\'=HYPERLINK('));
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(!csv.includes('"=HYPERLINK('));
});
test('ancho no válido y pliegues incorrectos no se aceptan',()=>{
 const p=Samples.get('canal-u').profile;
 assert.throws(()=>Work.build(p,{width:0}));
 assert.throws(()=>Work.build(p,{width:5001}));
 assert.throws(()=>Work.build({...p,sequence:[1,1]},{width:100}));
});

test('Hoja de trabajo y CSV emplean X del pliegue B, no el X del paso',()=>{
 const sample=Samples.get('perfil-omega'),p={...sample.profile,sequence:[1,2,4,3],
  setup:{...sample.profile.setup,backgaugeX:120,backgaugeByBend:[70,95,null,145]}};
 const w=Work.build(p,{width:140});
 assert.deepEqual(w.rows.map(r=>r.bend),[1,2,4,3]);
 assert.deepEqual(w.rows.map(r=>r.backgaugeX),[70,95,145,120]);
 assert.deepEqual(w.rows.map(r=>r.backgaugeSource),['por-pliegue','por-pliegue','por-pliegue','general']);
 const html=Work.html(w),csv=Work.csv(w);
 assert.ok(html.includes('Tope X (mm)'));
 assert.ok(html.includes('145 mm (B)'));
 assert.ok(csv.includes('Tope X (mm)'));
 assert.ok(csv.includes('"145";"por-pliegue"'));
 assert.ok(csv.includes('"120";"general"'));
 assert.match(w.warning,/NO CNC/);
 const reversed=Work.build({...p,sequence:[4,1,3,2]},{width:140});
 assert.deepEqual(reversed.rows.map(r=>r.backgaugeX),[145,70,120,95]);
});
