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

test('Omega 1→2→4→3 interpola X entre golpes sin mover la chapa',()=>{
 const omega={...part,sequence:[1,2,4,3],setup:{...part.setup,
  backgaugeX:120,backgaugeByBend:[70,95,null,145]}};
 const X=[70,95,145,120];
 assert.equal(K.frame(omega,0,0).scene.stop.x,70);
 for(let step=1;step<4;step++){
  const prior=K.frame(omega,step-1,1),start=K.frame(omega,step,0);
  const mid=K.frame(omega,step,.06),end=K.frame(omega,step,.12),bend=K.frame(omega,step,.5);
  eps(prior.scene.stop.x,X[step-1]);eps(start.scene.stop.x,X[step-1]);
  eps(mid.scene.stop.x,(X[step-1]+X[step])/2);
  eps(end.scene.stop.x,X[step]);eps(bend.scene.stop.x,X[step]);
  assert.equal(mid.phase,'reposicionamiento X');assert.equal(mid.backgaugeMotion.active,true);
  assert.equal(end.phase,'aproximación');assert.equal(bend.phase,'plegado');
  eps(start.punchLift,start.approachGap);eps(mid.punchLift,mid.approachGap);
  eps(start.angle,0);eps(mid.angle,0);
  assert.deepEqual(build(start.scene).vertices,build(mid.scene).vertices);
  assert.equal(mid.backgaugeMotion.axisValidated,false);
  assert.equal(mid.scene.interferences.backgaugeGap,Math.round((mid.scene.stop.x-mid.scene.interferences.backgaugeRearX)*1000)/1000);
  assert.notDeepEqual(groupVertices(start,'gauge'),groupVertices(end,'gauge'));
  assert.deepEqual(groupVertices(start,'die'),groupVertices(end,'die'));
 }
});
test('No se inventa desplazamiento X si dos pliegues comparten el mismo tope',()=>{
 const same={...part,sequence:[1,2,4,3],setup:{...part.setup,backgaugeX:120,backgaugeByBend:[80,80,80,80]}};
 const q=K.frame(same,1,.06);
 assert.equal(q.phase,'aproximación');assert.equal(q.scene.stop.travelling,false);
 eps(q.scene.stop.x,80);assert.equal(q.backgaugeMotion.required,false);
});
test('Interpolar no desplaza ni altera las posiciones de tope guardadas por B',()=>{
 const omega={...part,sequence:[1,2,4,3],setup:{...part.setup,
  backgaugeX:120,backgaugeByBend:[70,95,null,145]}};
 K.frame(omega,2,.06);
 assert.deepEqual(omega.setup.backgaugeByBend,[70,95,null,145]);
 const reordered={...omega,sequence:[4,1,3,2]};
 assert.equal(K.frame(reordered,1,0).scene.stop.x,145);
 assert.equal(K.frame(reordered,1,.12).scene.stop.x,70);
});

test('Secuencia negativa reproduce golpe sobre V con advertencia de volteo previo, no negativo bajo matriz',()=>{
 const f=K.frame({...part,sequence:[1,2,4,3]},0,.78);
 assert.equal(f.scene.signedAngle,-90);assert.equal(f.scene.requiresTurnover,true);
 assert.ok(f.scene.wingLeft.y<f.scene.center.y&&f.scene.wingRight.y<f.scene.center.y);
 assert.match(f.notice,/volteo/);
});

