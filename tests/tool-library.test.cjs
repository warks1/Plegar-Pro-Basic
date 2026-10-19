const {test}=require('node:test');
const assert=require('node:assert/strict');
const L=require('../tool-library.js'),C=require('../bendcalc.js');
const {scene}=require('../forming2d.js');
const {build}=require('../piece3d.js');
const {assemble}=require('../tooling3d.js');
const P={name:'Prueba de utillaje',material:'Acero S235JR',thickness:2,segments:[60,80,60],angles:[90,90],sequence:[1,2]};
test('fichas únicas de origen paramétrico no verificado',()=>{
 const x=L.validate();assert.equal(x.punches,8);assert.equal(x.dies,21);assert.equal(x.verified,0);
 assert.equal(new Set([...L.PUNCHES,...L.DIES].map(v=>v.id)).size,29);
 assert.ok([...L.PUNCHES,...L.DIES].every(v=>!v.source.verified&&!v.manufacturer&&!v.source.url));
});
test('series V y alturas disponibles, sin inventar marca oficial',()=>{
 for(const v of [6,10,12,16,22,24,32,35,40,50]){
  assert.equal(L.get('die','v'+v+'-30').opening,v);
  assert.equal(L.get('die','v'+v+'-88').angle,88);
 }
 assert.equal(L.get('punch','p30-r1-h120').height,120);
 assert.match(L.details(L.get('punch','p30-r1-h120')),/SIN VERIFICAR/);
 assert.match(L.details(L.get('die','v16-30')),/V 16 mm/);
 assert.throws(()=>L.details(null));
});
test('validación mantiene perfiles importados y descarta referencias erróneas',()=>{
 assert.equal(C.validateSetup().punch,'p88-r1');assert.equal(C.validateSetup().die,'v16-88');
 assert.equal(C.validateSetup({punch:'p30-r1-h100',die:'v24-30'}).die,'v24-30');
 assert.throws(()=>C.validateSetup({punch:'otro'}));assert.throws(()=>C.validateSetup({die:'otro'}));
});
test('la altura nominal seleccionada cambia el volumen 3D ilustrativo',()=>{
 const setup={radius:2,kFactor:.33,die:'v16-88',punch:'p30-r1-h100',backgaugeX:120};
 const a=scene({...P,setup},0,1),b=scene({...P,setup:{...setup,punch:'p30-r1-h150'}},0,1);
 assert.ok(Math.min(...b.toolProfiles.punch.outline.map(p=>p.y))<Math.min(...a.toolProfiles.punch.outline.map(p=>p.y)));
 assert.ok(assemble(build(a,100),a).faces.length>0);
});
