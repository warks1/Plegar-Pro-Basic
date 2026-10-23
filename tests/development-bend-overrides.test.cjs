'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../geometry2d.js'),C=require('../bendcalc.js'),W=require('../bend-workplan.js'),V=require('../flat-pattern-view.js'),D=require('../development-tools.js');
const base={name:'Escuadra prueba',material:'Acero S235JR',thickness:2,
 segments:[60,85,60],angles:[90,-90],sequence:[2,1],
 setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',dimensionBasis:'outer'}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' ≠ '+b);
test('perfil admite Ri/K por pliegue sin perderlos en validación, clonación o cambio del orden',()=>{
 const p={...base,bendOverrides:[{radius:4,kFactor:null},{radius:null,kFactor:.45}]};
 const v=G.validate(p);
 assert.equal(v.bendOverrides[0].radius,4);assert.equal(v.bendOverrides[1].kFactor,.45);
 v.bendOverrides[0].radius=9;assert.equal(p.bendOverrides[0].radius,4);
 const r=C.estimate({...p,sequence:[1,2]},p.setup),old=C.estimate(p,p.setup);
 near(r.flat,old.flat);
 near(r.rows[0].radius,4);near(r.rows[0].kFactor,.33);
 near(r.rows[1].radius,2);near(r.rows[1].kFactor,.45);
 assert.equal(r.rows[0].localRadius,true);
 assert.equal(r.rows[1].localK,true);
 assert.equal(r.hasBendOverrides,true);
});
test('desarrollo mixto coincide con suma independiente de BA/BD de cada radio y K',()=>{
 const profile={...base,bendOverrides:[{radius:4,kFactor:.4},{radius:2.5,kFactor:.3}]};
 for(const dimensionBasis of ['outer','inner','tangent']){
  const p={...profile,setup:{...base.setup,dimensionBasis}};
  const r=C.estimate(p,p.setup),e=p.thickness,Rs=[4,2.5],Ks=[.4,.3],theta=Math.PI/2;
  const bends=Rs.map((radius,i)=>{
   const set=dimensionBasis==='outer'?(radius+e):dimensionBasis==='inner'?radius:0;
   return {ba:theta*(radius+Ks[i]*e),bd:2*set-theta*(radius+Ks[i]*e)};
  });
  near(r.rows[0].allowance,bends[0].ba);
  near(r.rows[1].allowance,bends[1].ba);
  near(r.flat,p.segments.reduce((a,b)=>a+b,0)-bends.reduce((a,b)=>a+b.bd,0));
  near(r.flatSegments.reduce((a,s)=>a+s.length,0)+r.flatBends.reduce((a,b)=>a+b.allowance,0),r.flat);
  assert.equal(r.flatBends[0].radius,4);assert.equal(r.flatBends[1].kFactor,.3);
 }
});
test('Ri/K heredados preservan cálculos anteriores y radios opcionales pueden ser nulos',()=>{
 const baseline=C.estimate(base,base.setup);
 const p={...base,bendOverrides:[null,{radius:null,kFactor:null}]};
 const r=C.estimate(p,p.setup);
 near(r.flat,baseline.flat);
 assert.equal(r.hasBendOverrides,false);
 near(r.rows[0].neutralRadius,base.setup.radius+base.setup.kFactor*base.thickness);
});
test('valida errores de estructura y límites de parámetros antes de aceptar un perfil',()=>{
 for(const invalid of [
  [],[{}],[{},{} ,{}],['texto',{}],[{radius:0},{}],[{radius:'3'},{}],
  [{kFactor:.7},{}],[{radius:Infinity},{}],[{kFactor:NaN},{}]
 ]){
  assert.throws(()=>G.validate({...base,bendOverrides:invalid}));
  assert.throws(()=>C.estimate({...base,bendOverrides:invalid},base.setup));
 }
});
test('calibración K se bloquea con K individuales; sensibilidad solo varía los heredados',()=>{
 const p={...base,bendOverrides:[{radius:4,kFactor:.4},{radius:3,kFactor:null}]};
 const current=C.estimate(p,p.setup);
 assert.throws(()=>C.calibrateK(p,p.setup,current.flat),/individuales/);
 const low=C.sensitivity(p,p.setup,{kMin:.3,kMax:.5});
 near(low.spread,2*(.5-.3)*Math.PI/2);
 assert.match(low.note,/Sólo cambia K general/);
 const p2={...p,bendOverrides:[{radius:4,kFactor:null},{radius:3,kFactor:null}]};
 const target=C.estimate(p2,{...p2.setup,kFactor:.42});
 near(C.calibrateK(p2,p2.setup,target.flat).kFactor,.42);
});
test('hojas, desplegado y comparador preservan parámetros efectivos sin inventar compatibilidad CNC',()=>{
 const p={...base,bendOverrides:[{radius:4,kFactor:.42},{radius:3,kFactor:.35}]};
 const w=W.build(p,{width:120}),calc=C.estimate(p,p.setup);
 assert.deepEqual(w.rows.map(r=>r.bend),[2,1]);
 assert.equal(w.rows[1].radius,4);assert.equal(w.rows[0].kFactor,.35);
 assert.match(W.csv(w),/Ri efectivo/);
 assert.match(W.html(w),/Ri efectivo/);
 assert.match(V.svg(calc),/Ri 4.00 mm, K 0.420/);
 assert.match(D.html('calculator',p,{width:120}),/Ri \(mm\)/);
 assert.ok(D.compareDies(p,{width:120}).every(x=>x.flat!==null));
});
