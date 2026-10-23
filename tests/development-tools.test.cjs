'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../development-tools.js'),C=require('../bendcalc.js'),Sample=require('../sample-library.js');
const p=Sample.get('canal-u').profile;
test('Comparador de V calcula V/e con cada apertura real del catálogo interno',()=>{
 const values=D.compareDies(p,{width:140});
 assert.equal(values.length,C.DIES.length);
 assert.equal(new Set(values.map(v=>v.die)).size,values.length);
 for(const v of values){
  assert.equal(v.ratio,v.opening/p.thickness);
  assert.equal(v.shortFlange,p.segments.some(l=>l<.7*v.opening));
  assert.equal(v.badRatio,v.ratio<6||v.ratio>10);
  assert.ok(v.opening>0);
  assert.ok(v.forceKN>0);
 }
});
test('No se finge diferencia de desarrollo por variar la matriz si Ri y K son constantes',()=>{
 const values=D.compareDies(p,{width:140});
 const valid=values.filter(x=>x.flat!==null);
 assert.ok(valid.length>5);
 const reference=valid[0].flat;
 assert.ok(valid.every(x=>Math.abs(x.flat-reference)<1e-8));
 assert.notEqual(values[0].forceKN,values.at(-1).forceKN);
 assert.match(D.html('comparison',p,{width:140}),/Cambiar V NO cambia por sí solo el desarrollo/);
 assert.match(D.html('comparison',p,{width:140}),/data-dev-die=/);
});
test('Calculadora describe referencia de cotas, sensibilidad y posición del pliegue',()=>{
 const html=D.html('calculator',p,{width:140});
 assert.match(html,/DESARROLLO NOMINAL/);
 assert.match(html,/cotas exteriores/);
 assert.match(html,/K=0/);
 assert.match(html,/BA total/);
 assert.match(html,/B1/);
 assert.match(html,/data-dev-open-editor/);
});
test('El comparador rechaza ancho inválido, sin fabricar fuerza para material no definido',()=>{
 assert.throws(()=>D.compareDies(p,{width:0}));
 assert.throws(()=>D.compareDies(p,{width:5001}));
 const unknown={...p,material:'No documentado'};
 assert.ok(D.compareDies(unknown,{width:100}).every(x=>x.forceKN===null));
});
