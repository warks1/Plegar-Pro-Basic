const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const {build,project}=require('../piece3d.js');
const {assemble,extrude}=require('../tooling3d.js');
const profile={name:'Banco 3D',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
const m=scene(profile,1,.7),sheet=build(m,100),whole=assemble(sheet,m);
test('generic tooling forms separate nondegenerate 3D envelopes',()=>{
 assert.equal(whole.groups.sheet,1);assert.equal(whole.groups.punch,1);assert.equal(whole.groups.die,1);assert.equal(whole.groups.gauge,1);
 for(const group of ['punch','die','gauge'])assert.ok(whole.faces.filter(f=>f.group===group).length>=6);
 assert.ok(whole.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)));
});
test('common XYZ system of sheet, punch, V and gauge',()=>{
 const punch=whole.vertices.filter((v,i)=>whole.faces.some(f=>f.group==='punch'&&f.ids.includes(i)));
 assert.ok(punch.some(v=>Math.abs(v.y-m.punchTipY)<.001));
 const die=whole.vertices.filter((v,i)=>whole.faces.some(f=>f.group==='die'&&f.ids.includes(i)));
 assert.ok(die.some(v=>Math.abs(v.y-m.dieDepth)<.001));
 const gauge=whole.vertices.filter((v,i)=>whole.faces.some(f=>f.group==='gauge'&&f.ids.includes(i)));
 assert.ok(gauge.some(v=>Math.abs(v.x-m.stop.x)<.001));
});
test('visibility toggles change geometry without mutating the sheet',()=>{
 const solo=assemble(sheet,m,{punch:false,die:false,gauge:false});
 assert.equal(solo.vertices.length,sheet.vertices.length);
 assert.equal(solo.faces.length,sheet.faces.length);
 assert.deepEqual(sheet.faces.map(f=>f.kind),solo.faces.map(f=>f.kind));
 const punchOnly=assemble(sheet,m,{punch:true,die:false,gauge:false});
 assert.ok(punchOnly.faces.length>solo.faces.length);
 assert.equal(punchOnly.groups.punch,1);assert.equal(punchOnly.groups.die,0);
});
test('changing tool choice changes 3D envelope, not the sheet geometry',()=>{
 const alt=scene({...profile,setup:{...profile.setup,die:'v24-88'}},1,.7);
 const other=assemble(build(alt,100),alt);
 const first=whole.vertices.filter(v=>v.y>5).length;
 const second=other.vertices.filter(v=>v.y>5).length;
 assert.ok(first>0&&second>0);
 assert.notDeepEqual(whole.vertices,other.vertices);
});
test('projected tool colors/groups retain identity and finite coordinates',()=>{
 const image=project(whole,38,24,1);
 for(const group of ['sheet','punch','die','gauge'])assert.ok(image.faces.some(f=>f.group===group));
 assert.ok(image.faces.every(f=>f.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
});
test('broken contours and unknown tool parameters are rejected',()=>{
 assert.throws(()=>extrude([{x:0,y:0},{x:1,y:1},{x:2,y:2}],0,100,'punch'));
 assert.throws(()=>extrude([{x:0,y:0},{x:1,y:0},{x:0,y:1}],1,1,'punch'));
 assert.throws(()=>extrude([{x:0,y:0},{x:1,y:0},{x:0,y:1}],0,10,'unknown'));
 assert.throws(()=>assemble(sheet,{...m,toolProfiles:null}));
});
