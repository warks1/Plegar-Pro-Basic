const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const {build,project}=require('../piece3d.js');
const model={name:'Pieza 5 tramos',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
const near=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
test('full piece includes all nominal exterior segments, even pending hinges',()=>{
 const m=scene(model,0,.5);
 assert.equal(m.bend,3);assert.equal(m.assembly.left.items.length,2);
 assert.equal(m.assembly.right.items.length,1);
 assert.equal(m.assembly.hinges.length,3);
 assert.equal(m.assembly.completed.length,0);assert.equal(m.assembly.pending,3);
 assert.equal(m.assembly.contour[0].x,m.assembly.left.end.x);
 assert.equal(m.assembly.contour.at(-1).x,m.assembly.right.end.x);
});
test('the completed non-adjacent hinge is followed through pending intermediate hinges',()=>{
 const m=scene(model,2,1);
 assert.equal(m.bend,4);
 assert.deepEqual(m.assembly.completed,[3,1]);
 assert.equal(m.assembly.left.items.length,3);
 assert.equal(m.assembly.left.items[0].status,'realizado'); // bend 3
 assert.equal(m.assembly.left.items[1].status,'pendiente'); // bend 2
 assert.equal(m.assembly.left.items[2].status,'realizado'); // bend 1
});
test('zero-progress flat project remains collinear with all zero prior hinges',()=>{
 const m=scene({...model,sequence:[1,2,3,4]},0,0);
 near(m.assembly.left.end.y,-1);
 near(m.assembly.right.end.y,-1);
 assert.equal(m.assembly.pending,3);
});
test('changing sequence changes orientation of full piece without changing segment lengths',()=>{
 const m=scene({...model,sequence:[1,2,3,4]},1,.5),b=scene({...model,sequence:[3,2,1,4]},1,.5);
 assert.notDeepEqual(m.assembly.contour,b.assembly.contour);
});
test('3D extrudes actual 2D strip chain with representative thickness and breadth',()=>{
 const m=scene(model,1,1),mesh=build(m,130);
 assert.equal(mesh.stations,m.assembly.contour.length);
 assert.equal(mesh.vertices.length,mesh.stations*4);
 assert.equal(mesh.faces.length,4*(mesh.stations-1)+2);
 assert.equal(Math.max(...mesh.vertices.map(v=>v.z)),130);
 assert.equal(Math.min(...mesh.vertices.map(v=>v.z)),0);
 assert.ok(mesh.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)));
 near(Math.hypot(mesh.vertices[0].x-mesh.vertices[1].x,mesh.vertices[0].y-mesh.vertices[1].y),2);
});
test('3D surface projection obeys rotation and finite coordinate limits',()=>{
 const mesh=build(scene(model,2,.7));
 const a=project(mesh,40,24),b=project(mesh,80,24);
 assert.equal(a.faces.length,mesh.faces.length);
 assert.ok(a.faces.every(f=>f.points.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y))));
 assert.notDeepEqual(a.vertices.map(v=>v.x),b.vertices.map(v=>v.x));
 assert.ok(a.vertices.some(v=>v.x>0&&v.x<900));
});
test('invalid 3D dimensions and projection parameters fail clearly',()=>{
 const m=scene(model);
 for(const w of [0,-1,5001,Infinity,NaN])assert.throws(()=>build(m,w));
 assert.throws(()=>project(build(m),NaN));
 assert.throws(()=>project(build(m),0,20,0));
});
