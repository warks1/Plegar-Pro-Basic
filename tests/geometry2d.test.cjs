const assert = require('node:assert/strict');
const {test} = require('node:test');
const g = require('../geometry2d.js');
const base = {name:'L',material:'S235',thickness:2,segments:[60,80,60],angles:[90,-90],sequence:[2,1]};
test('perfil con ángulos firmados calculado como ejes',()=>{
 const p=g.vertices(base);
 assert.equal(p.length,4);
 assert.ok(Math.abs(p[1].x-60)<1e-9&&Math.abs(p[1].y)<1e-9);
 assert.ok(Math.abs(p[2].x-60)<1e-9&&Math.abs(p[2].y-80)<1e-9);
 assert.ok(Math.abs(p[3].x-120)<1e-9&&Math.abs(p[3].y-80)<1e-9);
 assert.equal(g.totalLength(base),200);
});
test('validación no acepta NaN, tramos negativos o secuencia duplicada',()=>{
 for (const change of [{segments:[60,-4,60]},{segments:[60,NaN,60]},{angles:[90]},{sequence:[1,1]},{thickness:0},{segments:Array(25).fill(1)}]) {
   assert.throws(()=>g.validate({...base,...change}));
 }
});
test('validate returns independent copies',()=>{const copy=g.validate(base);copy.segments[0]=1000;assert.equal(base.segments[0],60)});
