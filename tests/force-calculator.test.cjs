'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../engineering-checks.js'),Force=require('../force-view.js');
const Sample=require('../sample-library.js');
const near=(a,b,epsilon=1e-8)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
test('Fuerza al aire métrica correcta: e2, V16, Rm360, L1000 = 119,7 kN',()=>{
 const r=E.estimateAirForce({thickness:2,length:1000,opening:16,rm:360});
 near(r.forceKN,119.7);near(r.perMeterKN,119.7);
 near(r.tonnes,119.7/9.80665);
 near(r.vRatio,8);
 assert.equal(r.approvedForCNC,false);assert.equal(r.machineValidated,false);
 assert.equal(r.toolCapacityValidated,false);assert.equal(r.estimated,true);
 assert.equal(r.warnings.length,0);
 assert.match(r.method,/1,33/);
});
test('Relaciones fuerza: cuadrática con espesor, lineal con L y Rm, inversa con V',()=>{
 const vars={thickness:2,length:1000,opening:16,rm:360};
 const f=opts=>E.estimateAirForce({...vars,...opts}).forceKN;
 near(f({thickness:4})/f({}),4);
 near(f({length:500})/f({}),.5);
 near(f({rm:720})/f({}),2);
 near(f({opening:32})/f({}),.5);
});
test('Rechazar datos falsos: Rm vacío no es 0, límites y valores no finitos',()=>{
 const vars={thickness:2,length:1000,opening:16,rm:360};
 for(const key of Object.keys(vars))
  for(const bad of [NaN,Infinity,-Infinity,0,'360',null])
   assert.throws(()=>E.estimateAirForce({...vars,[key]:bad}),undefined,key+'='+bad);
 assert.throws(()=>E.estimateAirForce({...vars,length:5001}),/Longitud/);
 assert.throws(()=>E.estimateAirForce({...vars,thickness:36}),/Espesor/);
 assert.throws(()=>E.estimateAirForce({...vars,opening:401}),/Apertura/);
 assert.throws(()=>E.estimateAirForce({...vars,rm:2001}),/Rm/);
});
test('Una V fuera de 6–12× espesor exige advertencia, nunca certifica tonelaje',()=>{
 const base={thickness:3,length:1000,opening:8,rm:470};
 const result=E.estimateAirForce(base);
 assert.ok(result.warnings.some(w=>/V\/espesor/.test(w)));
 assert.equal(result.approvedForCNC,false);
 assert.match(Force.html(Sample.get('canal-u').profile,120),/NO CNC/);
 assert.match(Force.html(Sample.get('canal-u').profile,120),/data-force-input="rm"/);
});
test('Se reutiliza la fórmula del diagnóstico nominal existente, sin discrepancias',()=>{
 const profile=Sample.get('canal-u').profile;
 const width=140;
 const check=E.analyse(profile,{width});
 assert.ok(check.material);
 const d=Force.defaults(profile,width);
 near(check.forceKN,E.estimateAirForce({thickness:d.thickness,length:d.length,opening:d.opening,rm:d.rm}).forceKN);
 assert.equal(d.length,width);
 assert.equal(d.material,profile.material);
});
test('Material desconocido no inventa Rm ni fuerza; pide entrada verificada',()=>{
 const p={...Sample.get('canal-u').profile,material:'Material sin ficha'};
 const defaults=Force.defaults(p,100);
 assert.equal(defaults.rm,null);
 assert.match(Force.html(p,100),/resistencia del material|Resistencia a tracción/i);
});