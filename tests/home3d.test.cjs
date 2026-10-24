'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Home=require('../home3d.js'),Examples=require('../examples3d.js'),Draw=require('../plan-drawing.js');
test('Inicio: cada etapa refleja el número de pliegues y el programa actual',()=>{
 for(const e of Examples.list()){
  const total=Home.steps(e.profile);
  assert.equal(total,e.profile.angles.length+2);
  const atFirst=Home.frame(e.profile,1,0),end=Home.frame(e.profile,total,1);
  assert.equal(atFirst.scene.step,1);
  assert.equal(end.scene.bend,e.profile.sequence.at(-1));
  assert.equal(end.phase,'retirada');
  for(let step=1;step<=total;step++){
   const m=Home.machine(e.profile,{stage:step,progress:.5,width:e.width});
   assert.match(m.svg,/data-group="punch"/);
   assert.match(m.svg,/data-group="sheet"/);
   assert.match(m.svg,/data-group="die"/);
   assert.ok(m.faceCount>0);
  }
 }
});
test('Inicio: el punzón y la chapa cambian en el ciclo, con matriz fija en la escena geométrica',()=>{
 const p=Examples.get('u').profile,first=Home.frame(p,2,0),forming=Home.frame(p,2,.55),last=Home.frame(p,2,1);
 assert.notEqual(first.punchY,forming.punchY);
 assert.notEqual(forming.punchY,last.punchY);
 assert.notEqual(first.angle,forming.angle);
 assert.equal(forming.dieY,last.dieY);
 const a=Home.machine(p,{stage:2,progress:.15}).svg,b=Home.machine(p,{stage:2,progress:.65}).svg;
 assert.notEqual(a,b);
});
test('Inicio: las cuatro miniaturas reflejan cuatro geometrías distintas y pueden representar cualquier perfil validado',()=>{
 const e=Examples.list(),previews=e.map(x=>Home.thumb(x.profile,{width:x.width}));
 assert.equal(new Set(previews).size,4);
 for(const x of e){
  const p=Home.preview(x.profile,{width:x.width});
  assert.match(p,/data-group="sheet"/);
  assert.match(p,/PIEZA PROGRAMADA/);
  assert.match(Home.stepThumbnail(x.profile,2,{width:x.width}),/<polygon/);
 }
});

test('Pieza final independiente de orden: el plano y la vista previa usan una misma malla',()=>{
 for(const example of Examples.list()){
  const p=example.profile,changed={...p,sequence:[...p.sequence].reverse()};
  const m=Home.finishedMesh(p,example.width),n=Draw.create(p,{width:example.width}).mesh;
  assert.deepEqual(m,n);
  assert.deepEqual(m,Home.finishedMesh(changed,example.width));
  assert.equal(Home.preview(p,{width:example.width}),Home.preview(changed,{width:example.width}));
  assert.equal(Home.stepThumbnail(p,Home.steps(p),{width:example.width}),
               Home.stepThumbnail(changed,Home.steps(changed),{width:example.width}));
 }
});
test('Perfil Omega final coincide con sus ángulos aunque se cambie el último pliegue',()=>{
 const p=Examples.get('omega').profile;
 const a=Home.finishedMesh(p,140);
 const b=Home.finishedMesh({...p,angles:[90,90,90,-90]},140);
 assert.notDeepEqual(a.vertices,b.vertices);
 assert.equal(a.vertices.length,(p.segments.length+1)*4);
});
