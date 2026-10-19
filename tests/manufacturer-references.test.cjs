const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../manufacturer-references.js');
const L=require('../tool-library.js');
const C=require('../bendcalc.js');

test('fichas documentadas tienen fuente oficial, fecha y referencia única',()=>{
 const stats=R.validate();
 assert.equal(stats.records,5);assert.equal(stats.punches,3);assert.equal(stats.dies,2);assert.equal(stats.catalogs,4);assert.equal(stats.cadValidated,0);
 assert.equal(new Set(R.RECORDS.map(r=>r.id)).size,R.RECORDS.length);
 assert.ok(R.RECORDS.every(r=>r.source.url.startsWith('https://')&&r.source.inspected==='2026-10-19'));
});
test('matriz AMADA AMTS V8/30 coincide con su ficha de variante',()=>{
 const d=R.get('amada-mt508-v8-30-415');
 assert.equal(d.opening,8);assert.equal(d.angle,30);assert.equal(d.height,116);assert.equal(d.shoulderRadius,1);assert.equal(d.width,18);assert.equal(d.orderNumber,'50838E');
 assert.match(R.summary(d),/V8 mm/);
});
test('punzones documentados conservan sus referencias exactas y radios',()=>{
 const p=R.get('amada-202-p88-r06-835'),g=R.get('amada-846-p88-r06-835'),a=R.get('amada-a13-p30-r06-835');
 assert.equal(p.nose,0.6);assert.equal(p.height,100);assert.equal(p.orderNumber,'DX602061');
 assert.equal(g.height,120);assert.equal(g.orderNumber,'ES8467061');
 assert.equal(a.angle,30);assert.equal(a.height,120);assert.equal(a.orderNumber,'AGA13061');
});
test('matriz New AFH V16 especifica el radio de hombro y no el radio interior de pieza',()=>{
 const d=R.get('amada-newafh-v16-88-835');
 assert.equal(d.opening,16);assert.equal(d.shoulderRadius,2.5);assert.equal(d.height,60);assert.equal(d.width,20);
 assert.match(d.note,/CAD|geometría/);
});
test('catálogo de fabricante no modifica la lista simulable ni las selecciones antiguas',()=>{
 assert.equal(L.PUNCHES.length,8);assert.equal(L.DIES.length,21);
 assert.equal(C.validateSetup().punch,'p88-r1');assert.equal(C.validateSetup().die,'v16-88');
 assert.equal(L.get('die','amada-mt508-v8-30-415'),null);
 assert.equal(R.get('v16-88'),null);
 assert.equal(R.list('punch').length,3);assert.equal(R.list('die').length,2);
 assert.throws(()=>R.summary(null));
});
