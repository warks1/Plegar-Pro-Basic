const {test}=require('node:test');
const assert=require('node:assert/strict');
const K=require('../fold-kinematics.js');
const {build}=require('../piece3d.js');
const {assemble}=require('../tooling3d.js');
const part={name:'Omega',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
const eps=(v,w,tol=1e-6)=>assert.ok(Math.abs(v-w)<tol,`${v} != ${w}`);
const groupVertices=(f,group)=>{const mesh=assemble(build(f.scene,100),f.scene);const ids=new Set(mesh.faces.filter(face=>face.group===group).flatMap(face=>face.ids));return [...ids].map(i=>mesh.vertices[i]);};
test('cycle: approach, bend and retraction are distinct',()=>{
 assert.equal(K.frame(part,0,0).phase,'aproximación');
 assert.equal(K.frame(part,0,.5).phase,'plegado');
 assert.equal(K.frame(part,0,1).phase,'retirada');
});
test('on approach sheet is flat while punch descends',()=>{
 const a=K.frame(part,0,0),b=K.frame(part,0,.15);
 eps(a.angle,0);eps(b.angle,0);
 assert.ok(a.punchY<b.punchY);eps(a.dieY,b.dieY);
 assert.deepEqual(build(a.scene).vertices,build(b.scene).vertices);
});
test('on bend sheet geometry and angle progressively change',()=>{
 const a=K.frame(part,0,.22),b=K.frame(part,0,.5),c=K.frame(part,0,.78);
 eps(a.angle,0);assert.ok(b.angle>0&&b.angle<c.angle);
 eps(c.angle,90);assert.notDeepEqual(build(a.scene).vertices,build(b.scene).vertices);
 assert.notDeepEqual(build(b.scene).vertices,build(c.scene).vertices);
 assert.equal(b.punchLift,0);
});
test('during retract part keeps formed angle and punch leaves the sheet',()=>{
 const a=K.frame(part,0,.78),b=K.frame(part,0,.91),c=K.frame(part,0,1);
 eps(a.angle,b.angle);eps(b.angle,c.angle);
 assert.deepEqual(build(a.scene).vertices,build(c.scene).vertices);
 assert.ok(c.punchY<b.punchY&&b.punchY<a.punchY);
});
test('nominal punch tip and outline move together without shifting die/gauge',()=>{
 const a=K.frame(part,0,0),b=K.frame(part,0,.22);
 const pa=groupVertices(a,'punch'),pb=groupVertices(b,'punch');
 const da=groupVertices(a,'die'),db=groupVertices(b,'die');
 const ga=groupVertices(a,'gauge'),gb=groupVertices(b,'gauge');
 assert.equal(pa.length,pb.length);
 assert.ok(pa.every((p,i)=>Math.abs((pb[i].y-p.y)-(b.punchY-a.punchY))<1e-5));
 assert.deepEqual(da,db);assert.deepEqual(ga,gb);
});
test('tooling selection affects punch and die size, not the sequence logic',()=>{
 const a=K.frame(part,0,.5),b=K.frame({...part,setup:{...part.setup,die:'v24-88'}},0,.5);
 assert.equal(a.phase,b.phase);eps(a.angle,b.angle);
 assert.notDeepEqual(groupVertices(a,'die'),groupVertices(b,'die'));
});
test('sequence index chooses actual configured bend, preserving warnings for negative bends',()=>{
 const a=K.frame(part,0,.7),b=K.frame(part,1,.7);
 assert.equal(a.scene.bend,3);assert.equal(b.scene.bend,1);
 assert.equal(b.scene.turn,-90);
 assert.ok(b.notice.includes('recolocación'));
});
test('invalid playback positions rejected',()=>{
 for(const t of [-.01,1.01,NaN,Infinity])assert.throws(()=>K.frame(part,0,t),/ciclo/);
 assert.throws(()=>K.frame(part,99,.5));
});
test('all positions have finite mesh and punch coordinates',()=>{
 for(let step=0;step<part.sequence.length;step++)for(let j=0;j<=20;j++){
  const f=K.frame(part,step,j/20),m=assemble(build(f.scene,100),f.scene);
  assert.ok(m.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)));
  assert.ok(Number.isFinite(f.punchY));
 }
});
