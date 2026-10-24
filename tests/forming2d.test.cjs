const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const p={name:'Omega prueba',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:0.33,punch:'p88-r1',die:'v16-88'}};
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<eps,`${a} ≠ ${b}`);
test('ordered sequence selects the correct vertex and setup',()=>{
 const m=scene(p,0,0);assert.equal(m.bend,3);assert.equal(m.left,120);assert.equal(m.right,85);assert.equal(m.steps,4);
 near(m.currentAngle,0);near(m.center.y,-1);near(m.depth,0);
 assert.equal(m.insideRadius,2);assert.equal(m.centreRadius,3);
});
test('arc has the specified midline radius and tangents at 90 degrees',()=>{
 const m=scene(p,0,1),beta=Math.PI/4,R=3;
 near(m.tangentX,R*Math.sin(beta));near(m.tangentSetback,R*Math.tan(beta));
 near(m.tangentLeft.x,-m.tangentX);near(m.tangentRight.x,m.tangentX);
 near(m.tangentLeft.y,m.center.y-R*(1-Math.cos(beta)));
 near(m.centerline[0].x,m.wingLeft.x);near(m.centerline.at(-1).x,m.wingRight.x);
 const mid=m.centerline[Math.floor(m.centerline.length/2)];near(mid.x,0);near(mid.y,m.center.y);
 near(m.wingLeft.x,-(120-R*Math.tan(beta))*Math.cos(beta)-R*Math.sin(beta));
 near(m.wingRight.x,(85-R*Math.tan(beta))*Math.cos(beta)+R*Math.sin(beta));
 assert.ok(m.centerline.length>20);
});
test('idealized lower tangent surface rests on shoulders for feasible V',()=>{
 for(const a of [10,30,60,90]){
  const model=scene({...p,angles:[-90,90,a,-90]},0,1);
  near(model.shoulderY,0);
  assert.ok(model.tangentX<model.dieOpening/2);
  assert.ok(model.depth>=0);
 }
});
test('no artificial bending for zero-angle step or zero progress',()=>{
 const zero=scene({...p,angles:[0,90,90,-90],sequence:[1,2,3,4]},0,1);
 near(zero.depth,0);near(zero.tangentX,0);
 near(zero.wingLeft.y,-1);near(zero.wingRight.y,-1);
 const initial=scene(p,0,0);near(initial.wingRight.y,-1);near(initial.wingLeft.y,-1);
});
test('advance changes angle continuously and endpoints and punch follow the curved sheet',()=>{
 const first=scene(p,0,.25),last=scene(p,0,1);
 assert.ok(last.depth>first.depth);near(last.punchTipY,last.center.y-1);
 near(first.punchTipY,first.center.y-1);assert.ok(last.wingRight.y<first.wingRight.y);
});
test('change of die and thickness changes support position without changing nominal R',()=>{
 const x=scene(p,0,1),wide=scene({...p,setup:{...p.setup,die:'v32-88'}},0,1);
 assert.ok(wide.depth>x.depth);assert.equal(wide.dieOpening,32);near(wide.insideRadius,2);
 const thick=scene({...p,thickness:4},0,1);
 near(thick.centreRadius,4);near(thick.punchTipY,thick.center.y-2);near(thick.stop.y,-2);
});
test('the nominal backgauge remains stationary while the part moves',()=>{
 const start=scene(p,0,0),end=scene(p,0,1);
 near(start.stop.x,end.stop.x);near(start.stop.y,end.stop.y);
});
test('negative folds warn about missing part reorientation',()=>{
 const reversed=scene(p,1,.5);
 assert.equal(reversed.bend,1);assert.ok(reversed.warnings.some(w=>w.includes('negativo')));
});
test('short wings and excessive tangent setbacks are detected',()=>{
 const short=scene({...p,segments:[1,1,120,85,60],sequence:[1,2,3,4]},0,1);
 assert.ok(short.warnings.some(w=>w.includes('hombro')));
 assert.ok(short.warnings.some(w=>w.includes('radio necesita')));
});
test('too small V for a large assumed radius warns of round region hitting shoulder',()=>{
 const round=scene({...p,setup:{...p.setup,radius:20,die:'v6-88'}},0,1);
 assert.ok(round.warnings.some(w=>w.includes('zona redondeada')));
 assert.ok(round.centerline.every(pt=>Number.isFinite(pt.x)&&Number.isFinite(pt.y)));
});
test('over-depth and incompatible nominal tool angle emit warnings, not safety certification',()=>{
 const tooDeep=scene({...p,angles:[120,90,90,-90],sequence:[1,2,3,4]},0,1);
 assert.ok(tooDeep.warnings.some(w=>w.includes('profundidad')));
 assert.ok(tooDeep.warnings.some(w=>w.includes('punzón')));
 assert.ok(tooDeep.warnings.some(w=>w.includes('matriz')));
 assert.match(tooDeep.note,/NO/);
});
test('validated numerical inputs and catalogs remain mandatory',()=>{
 for(const [s,pct] of [[-1,0],[0,1.001],[1,-.01],[4,0]])assert.throws(()=>scene(p,s,pct));
 assert.throws(()=>scene({...p,setup:{...p.setup,die:'nonexistent'}},0,.5));
});

test('X del tope pertenece a B1,B2,B3,B4 y no a la posición del golpe',()=>{
 const setup={...p.setup,backgaugeX:120,backgaugeByBend:[70,95,null,145]};
 const omega={...p,sequence:[1,2,4,3],setup};
 assert.deepEqual(omega.sequence.map((_,i)=>scene(omega,i,.5).stop.x),[70,95,145,120]);
 assert.deepEqual(omega.sequence.map((_,i)=>scene(omega,i,.5).stop.source),
  ['por-pliegue','por-pliegue','por-pliegue','general']);
 for(let i=0;i<4;i++)assert.equal(scene(omega,i,0).stop.x,scene(omega,i,1).stop.x);
 const reversed={...omega,sequence:[4,1,3,2]};
 assert.deepEqual(reversed.sequence.map((_,i)=>scene(reversed,i,.5).stop.x),[145,70,120,95]);
});
