const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const p={name:'Omega prueba',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:0.33,punch:'p88-r1',die:'v16-88'}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≠ ${b}`);
test('ordered sequence selects physical vertex and its two adjacent segments',()=>{
 const m=scene(p,0,0);
 assert.equal(m.bend,3);assert.equal(m.left,120);assert.equal(m.right,85);assert.equal(m.steps,4);
 assert.equal(m.currentAngle,0);near(m.depth,0);near(m.center.y,-1);
});
test('V16 at 90° has geometrical half V depth at full progress, no machine stroke claims',()=>{
 const m=scene(p,0,1);
 near(m.depth,8);near(m.currentAngle,90);near(m.wingLeft.x,-120*Math.cos(Math.PI/4));
 near(m.wingLeft.y,m.depth-120*Math.sin(Math.PI/4)-1);
 near(m.dieDepth,8/Math.tan(88*Math.PI/360));
});
test('reordering sequence changes selected fold while preserving machine geometry',()=>{
 const old=scene(p,1,.5);assert.equal(old.bend,1);assert.ok(old.warnings.some(x=>x.includes('negativo')));
 const next=scene({...p,sequence:[2,1,3,4]},0,.5);assert.equal(next.bend,2);near(next.dieOpening,old.dieOpening);
});
test('changes of die, angle and thickness affect the view',()=>{
 const x=scene(p,0,1);
 const wide=scene({...p,setup:{...p.setup,die:'v32-88'}},0,1);
 near(wide.depth,2*x.depth);assert.equal(wide.dieOpening,32);
 const thick=scene({...p,thickness:4},0,1);near(thick.stop.y,-2);
 const angle=scene({...p,angles:[-90,60,90,-90]},0,1);near(angle.depth,x.depth);
});
test('zero-angle and impossible support are labeled, no invented physical motion',()=>{
 const flat=scene({...p,angles:[0,90,90,-90],sequence:[1,2,3,4]},0,1);
 near(flat.depth,0);
 const short=scene({...p,segments:[1,1,120,85,60],sequence:[1,2,3,4]},0,1);
 assert.ok(short.warnings.some(x=>x.includes('hombro')));
 const depth=scene({...p,angles:[120,90,90,-90],sequence:[1,2,3,4]},0,1);
 assert.ok(depth.warnings.some(x=>x.includes('profundidad')));
});
test('validated input and tool catalogs are required',()=>{
 for(const [s,pct] of [[-1,0],[0,1.001],[1,-.01],[4,0]])assert.throws(()=>scene(p,s,pct));
 assert.throws(()=>scene({...p,setup:{...p.setup,die:'nonexistent'}},0,.5));
});
