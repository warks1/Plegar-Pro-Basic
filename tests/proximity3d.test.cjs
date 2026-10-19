const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../proximity3d.js');
const T=require('../tooling3d.js');
const M=require('../piece3d.js');
const {scene}=require('../forming2d.js');
const square=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const prism=(x0,y0,x1,y1,z0=0,z1=100)=>({outline:square(x0,y0,x1,y1),z0,z1});
const profile={name:'Ensayo',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
test('polígonos separados, en contacto y cruzados',()=>{
 assert.equal(P.flatGap(square(0,0,2,2),square(0.5,.5,1,1)),0);
 assert.equal(P.flatGap(square(0,0,2,2),square(2,2,3,3)),0);
 assert.equal(P.flatGap(square(0,0,2,2),square(3,0,4,2)),1);
 assert.equal(P.flatGap(square(0,0,2,2),square(1,-1,1.5,3)),0);
});
test('separación transversal Z impide falsos contactos',()=>{
 assert.equal(P.volumeGap(prism(0,0,2,2,0,20),prism(0,0,2,2,25,30)),5);
 assert.equal(P.volumeGap(prism(0,0,2,2,0,20),prism(3,0,4,2,24,30)),Math.hypot(1,4));
 assert.equal(P.volumeGap(prism(0,0,2,2),prism(0,0,2,2)),0);
});
test('extremo recto y esquina degenerada se manejan sin NaN',()=>{
 assert.ok(P.flatGap(square(0,0,1,1),square(100,100,101,101))>100);
 assert.throws(()=>P.flatGap([{x:0,y:0}],square(0,0,1,1)));
 assert.throws(()=>P.volumeGap(prism(0,0,1,1,4,4),prism(0,0,1,1)));
});
test('prismas reales de herramienta coinciden con la malla de dibujo',()=>{
 const s=scene(profile,1,.8),sheet=M.build(s,100),d=T.prisms(sheet,s),mesh=T.assemble(sheet,s);
 for(const t of d){
  const ids=new Set(mesh.faces.filter(f=>f.group===t.group).flatMap(f=>f.ids));
  const z=[...ids].map(i=>mesh.vertices[i].z);
  assert.ok(Math.abs(Math.min(...z)-t.z0)<1e-8);
  assert.ok(Math.abs(Math.max(...z)-t.z1)<1e-8);
 }
});
test('ninguna ala anterior no inventa medidas',()=>{
 const s=scene(profile,0,.7),report=P.inspect(M.build(s),s);
 assert.equal(report.evaluatedSegments,0);assert.equal(report.checkedPairs,0);
 assert.equal(report.minimum,null);assert.match(report.verdict,/sin tramos previos/);
});
test('cada segmento completado se examina contra punzón, matriz y tope',()=>{
 const s=scene(profile,3,1),sheet=M.build(s,100),a=P.inspect(sheet,s);
 assert.ok(a.evaluatedSegments>0);
 assert.equal(a.checkedPairs,a.evaluatedSegments*3);
 assert.ok(a.pairs.every((p,i)=>Number.isFinite(p.mm)&&p.mm>=0&&(!i||p.mm>=a.pairs[i-1].mm)));
 assert.equal(a.minimum.mm,a.pairs[0].mm);
 assert.match(a.note,/NO acredita|NO acredita/i);
});
test('prisma de chapa más ancha mantiene las posiciones compartidas',()=>{
 const s=scene(profile,2,1),a=M.build(s,100),b=M.build(s,170);
 const aa=P.inspect(a,s),bb=P.inspect(b,s);
 assert.equal(aa.evaluatedSegments,bb.evaluatedSegments);
 assert.ok(aa.pairs.every((p,i)=>Number.isFinite(bb.pairs[i].mm)));
});
test('parametrización inválida se rechaza',()=>{
 const s=scene(profile,2,.5),m=M.build(s);
 assert.throws(()=>P.inspect(m,s,{nearMm:-1}));
 assert.throws(()=>P.inspect({...m,vertices:[]},s));
 assert.throws(()=>P.inspect(m,{...s,stop:{...s.stop,width:0}}));
});
