'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../examples3d.js'),G=require('../geometry2d.js');
test('exactamente cuatro ejemplos distintos con programas validos y miniatura 3D propia',()=>{
 const models=E.list();assert.equal(models.length,4);
 assert.deepEqual(models.map(x=>x.id),['l','u','z','omega']);
 assert.equal(new Set(models.map(x=>JSON.stringify(x.profile.segments)+JSON.stringify(x.profile.angles))).size,4);
 const thumbs=models.map(x=>E.thumb(x));
 assert.equal(new Set(thumbs).size,4);
 for(const model of models){
  assert.deepEqual(G.validate(model.profile).sequence,model.profile.sequence);
  assert.equal(E.get(model.id).label,model.label);
  assert.match(E.thumb(model),/<polygon/);assert.match(E.thumb(model),/<svg/);
  assert.ok(model.width>0);
 }
});
test('las tarjetas 3D ofrecen botones táctiles y mantienen forma distintiva',()=>{
 const markup=E.cards('Canal U (ejemplo)');
 assert.equal((markup.match(/class="example-gadget(?: selected)?"/g)||[]).length,4);
 assert.equal((markup.match(/data-example-id=/g)||[]).length,4);
 assert.equal((markup.match(/<svg/g)||[]).length,8);
 assert.match(markup,/example-gadget selected/);
 assert.equal(E.get('missing'),null);
});
