'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../bendcalc.js');
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<t,a+' ≠ '+b);
test('referencia plegado exterior 90°, e=2, Ri=2, K=0,33: BA=4,178 OSSB=4 BD=3,822',()=>{
 const r=C.estimate({thickness:2,segments:[50,50],angles:[90]},{radius:2,kFactor:.33,die:'v16-88'});
 near(r.rows[0].allowance,4.178);near(r.rows[0].setback,4,1e-9);near(r.rows[0].deduction,3.822);near(r.flat,100-3.822);
});
test('cotas interiores ISSB y tangentes siguen coherentes con BA',()=>{
 const p={thickness:2,segments:[50,50],angles:[90]},s={radius:2,kFactor:.33,die:'v16-88'};
 const i=C.estimate(p,{...s,dimensionBasis:'inner'}).rows[0];near(i.insideSetback,2,1e-9);near(i.deduction,4-4.178);
 const t=C.estimate(p,{...s,dimensionBasis:'tangent'}).rows[0];near(t.deduction,-4.178);
});
test('K orientativo en función de Ri/e; rechaza valores no finitos',()=>{
 const k=(r,t)=>C.suggestK(r,t).kFactor;
 for(const [r,kref] of [[1,.33],[2,.35],[3,.38],[4,.42],[6,.445],[20,.5]])assert.equal(k(r,2),kref);
 for(const [r,t] of [[2,0],[NaN,2],[Infinity,2],[2,Infinity]])assert.throws(()=>C.suggestK(r,t));
});
test('radio al aire ≈0,16·V y advertencias de radio y K incoherentes',()=>{
 near(C.airBendRadius(16).radius,2.56,1e-9);
 for(const bad of [0,NaN,Infinity])assert.throws(()=>C.airBendRadius(bad));
 const p={thickness:2,segments:[50,50],angles:[90]};
 const ok=C.estimate(p,{radius:2.5,kFactor:.35,die:'v16-88'});
 assert.ok(!ok.warnings.some(w=>/plegado al aire estimado|valor orientativo/.test(w)));
 const bad=C.estimate(p,{radius:8,kFactor:.2,die:'v16-88'});
 assert.ok(bad.warnings.some(w=>/plegado al aire estimado/.test(w)));
 assert.ok(bad.warnings.some(w=>/valor orientativo/.test(w)));
});