const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../bendcalc.js');
const P={thickness:2,segments:[60,80,60],angles:[90,-90]};
const S={radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88'};
const nearly=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);
test('90° BA, OSSB, BD and flat for dimensions between theoretical apices',()=>{
 const r=C.estimate(P,S);const ba=Math.PI/2*(2+.33*2);
 nearly(r.rows[0].allowance,ba);nearly(r.rows[0].setback,4);
 nearly(r.rows[0].deduction,8-ba);nearly(r.flat,200-2*(8-ba));
 nearly(r.vRatio,8);assert.deepEqual(r.problems,[]);
});
test('angle sign flips orientation without affecting flat',()=>{
 nearly(C.estimate({...P,angles:[-90,90]},S).flat,C.estimate(P,S).flat);
});
test('different K and Ri alter the estimated flat',()=>{
 assert.notEqual(C.estimate(P,S).flat,C.estimate(P,{...S,kFactor:.45}).flat);
 assert.notEqual(C.estimate(P,S).flat,C.estimate(P,{...S,radius:4}).flat);
});
test('short legs yield non-calculable result (not a misleading number)',()=>{
 const r=C.estimate({...P,segments:[1,2,1]},S);
 assert.equal(r.flat,null);assert.ok(r.problems.some(x=>x.includes('Tramo')));
});
test('punch angle and matrix V ratio warnings',()=>{
 const r=C.estimate({...P,angles:[110,0]},S);
 assert.ok(r.warnings.some(x=>x.includes('punzón')));
 assert.ok(C.estimate(P,{...S,die:'v6-88'}).warnings.some(x=>x.includes('V/e')));
});
test('validated generic tooling, no manufacturer claims',()=>{
 for(const setup of [{...S,radius:0},{...S,kFactor:1},{...S,punch:'madeup'},{...S,die:'fake'}])assert.throws(()=>C.validateSetup(setup));
 assert.ok(C.DIES.some(x=>x.opening===50));
});
test('zero angle contributes no bend deduction',()=>{
 const r=C.estimate({...P,angles:[0,90]},S);
 nearly(r.rows[0].deduction,0);
});

test('Tope X opcional por B mantiene valor general y valida rangos sin modificar entrada',()=>{
 const source={...S,backgaugeX:120,backgaugeByBend:[null,95,null,70]};
 const result=C.validateSetup(source);
 assert.deepEqual(result.backgaugeByBend,[null,95,null,70]);
 result.backgaugeByBend[1]=200;
 assert.equal(source.backgaugeByBend[1],95);
 assert.equal(C.validateSetup({...S}).backgaugeByBend,undefined);
 assert.throws(()=>C.validateSetup({...S,backgaugeByBend:'95'}),/Tabla/);
 assert.throws(()=>C.validateSetup({...S,backgaugeByBend:[0]}),/Tope X B1/);
 assert.throws(()=>C.validateSetup({...S,backgaugeByBend:[10001]}),/Tope X B1/);
 assert.throws(()=>C.validateSetup({...S,backgaugeByBend:Array(24).fill(null)}),/máximo 23/);
});
