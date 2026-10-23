'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('../sample-library.js'),D=require('../plan-drawing.js'),E=require('../engineering-checks.js');
test('Catálogo: 12 piezas con medidas, materiales, ángulos, secuencias y ancho propios',()=>{
 const all=S.list();assert.equal(all.length,12);
 assert.equal(new Set(all.map(x=>x.id)).size,12);
 assert.equal(new Set(all.map(x=>x.name)).size,12);
 for(const p of all){
  assert.equal(p.profile.segments.length,p.profile.angles.length+1);
  assert.equal(p.profile.sequence.length,p.profile.angles.length);
  assert.ok(p.width>=1&&p.width<=5000);
  const d=S.drawing(p.id);
  assert.match(d.svg2d,/PLANO 2D/);
  assert.match(d.svg3d,/3D/);
  assert.match(d.svg2d,/GEOMETRÍA NOMINAL/);
  assert.deepEqual(d.profile.sequence,p.profile.sequence);
  assert.equal(d.width,p.width);
  const card=S.projectCard(p);
  assert.match(card,/data-sample-program/);
  assert.match(card,/data-sample-save/);
  assert.equal((card.match(/<svg/g)||[]).length,2);
  assert.equal((S.paired(p.profile,p.width).match(/<svg/g)||[]).length,2);
 }
 assert.equal(new Set(all.map(x=>S.drawing(x.id).svg2d)).size,12);
 assert.equal(new Set(all.map(x=>S.drawing(x.id).svg3d)).size,12);
});
test('Catálogo: borradores de nuevos proyectos no simulan disponer de planos reales',()=>{
 const p=S.draft('Pieza nueva','6 pliegues · 2,00 mm');
 assert.equal(p.kind,'draft');
 assert.equal(p.profile.angles.length,6);
 assert.equal(p.profile.thickness,2);
 assert.match(p.note,/NO|BORRADOR/);
 assert.equal(S.byName('Soporte motor S235').id,'soporte-motor');
 assert.equal(S.byName('Pieza inventada'),null);
 assert.throws(()=>S.drawing('not-found'));
});
test('Ingeniería: fuerza estimada depende de ancho, espesor, V y Rm supuesto',()=>{
 const p=S.get('canal-u').profile;
 const x=E.analyse(p,{width:100}),y=E.analyse(p,{width:200});
 assert.ok(x.forceKN>0);
 assert.ok(Math.abs(y.forceKN/x.forceKN-2)<1e-10);
 const thicker=E.analyse({...p,thickness:p.thickness*2},{width:100});
 assert.ok(thicker.forceKN>x.forceKN);
 const widerV=E.analyse({...p,setup:{...p.setup,die:'v24-88'}},{width:100});
 assert.ok(widerV.forceKN<x.forceKN);
 assert.equal(x.isIllustrative,true);
 assert.ok(x.method.includes('aproximado'));
 assert.equal(x.vNominal,8*p.thickness);
});
test('Ingeniería: advierte al pasar los límites y no inventa fuerza sin Rm de muestra',()=>{
 const p=S.get('canal-u').profile;
 const a=E.analyse({...p,material:'Aleación desconocida'},{width:120});
 assert.equal(a.forceKN,null);
 assert.ok(a.warnings.some(x=>x.includes('sin resistencia')));
 assert.throws(()=>E.analyse(p,{width:0}));
 assert.throws(()=>E.analyse(p,{width:5001}));
});

test('Ingeniería: señala cruces de alas no adyacentes y deja en paz una L sencilla',()=>{
 const G=require('../geometry2d.js');
 const square={name:'Cierre',material:'Acero S235JR',thickness:2,segments:[100,100,100,100],angles:[90,90,90],sequence:[1,2,3],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
 assert.ok(E.profileIntersections(square).length>0);
 assert.ok(E.analyse(square).warnings.some(x=>x.includes('autointersección')));
 const simple=S.get('escuadra-l').profile;
 assert.deepEqual(E.profileIntersections(simple),[]);
});
