const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const {validateSetup}=require('../bendcalc.js');
const p={name:'Omega',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
const withStop=x=>({...p,setup:{...p.setup,backgaugeX:x}});
test('posición X es una dimensión nominal validada',()=>{
 assert.equal(validateSetup({}).backgaugeX,120);
 assert.equal(validateSetup({backgaugeX:'90'}).backgaugeX,90);
 for(const v of [-5,0,.5,10000.1,'sin medida',Infinity,NaN]){
  assert.throws(()=>validateSetup({backgaugeX:v}),/tope X/);
 }
});
test('tope configurado queda fijo durante el paso aislado',()=>{
 const first=scene(withStop(50),0,0),last=scene(withStop(50),0,1);
 assert.equal(first.stop.x,50);assert.equal(last.stop.x,50);
 assert.equal(first.stop.top,last.stop.top);assert.equal(first.stop.bottom,last.stop.bottom);
});
test('separación horizontal correcta cuando el extremo queda lejos del tope',()=>{
 const m=scene(withStop(130),0,0);
 assert.equal(m.interferences.backgaugeState,'separado');
 assert.equal(m.interferences.backgaugeGap,45);
 assert.ok(!m.interferences.problems.some(x=>x.code==='BACKGAUGE_OVERLAP'));
});
test('el extremo justo en tope se marca contacto nominal, no solapamiento',()=>{
 const m=scene(withStop(85),0,0);
 assert.equal(m.interferences.backgaugeState,'contacto nominal');
 assert.ok(!m.interferences.problems.some(x=>x.code==='BACKGAUGE_OVERLAP'));
});
test('tope invadido en posición inicial: alerta conservadora por solapamiento 2D',()=>{
 const m=scene(withStop(30),0,0);
 assert.equal(m.interferences.backgaugeState,'interferencia');
 assert.equal(m.interferences.status,'revisar');
 assert.ok(m.interferences.problems.some(x=>x.code==='BACKGAUGE_OVERLAP'));
});
test('un flanco levantado por encima del tope deja de solaparlo en la vista aislada',()=>{
 const m=scene(withStop(30),0,1);
 assert.ok(!m.interferences.problems.some(x=>x.code==='BACKGAUGE_OVERLAP'));
 assert.ok(m.interferences.backgaugeGap<0); // La separación horizontal negativa por sí sola no certifica colisión
});
test('geometría V patológica se clasifica solo como potencial penetración',()=>{
 const m=scene({...p,angles:[120,90,90,-90],sequence:[1,2,3,4]},0,1);
 assert.ok(m.interferences.problems.some(x=>x.code==='DIE_ENVELOPE'));
 assert.match(m.interferences.disclosure,/no certificado/i);
});
test('todos los resultados de barrido numérico son finitos y conservan contrato',()=>{
 for (const die of ['v6-88','v16-88','v32-88']) for (const pct of [0,.1,.5,.9,1]) {
  const m=scene({...p,setup:{...p.setup,die}},0,pct);
  assert.equal(m.interferences.maxDiePenetration,null,'no inventar profundidad de penetración sin CAD');
  assert.ok(Array.isArray(m.interferences.dieOverlapSegments));
  assert.ok(m.interferences.backgaugeGap===null||Number.isFinite(m.interferences.backgaugeGap));
  assert.ok(Array.isArray(m.interferences.problems));
 }
});
