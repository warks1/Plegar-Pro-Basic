'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Calc=require('../bendcalc.js');
const Flat=require('../flat-pattern-view.js');
const p={name:'Placa L',material:'Acero S235JR',thickness:2,segments:[50,50],angles:[90],sequence:[1]};
const setup={radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88'};
const near=(actual,expected,eps=1e-7)=>assert.ok(Math.abs(actual-expected)<eps,actual+' != '+expected);
test('exterior: 90° se deduce OSSB dos veces menos BA; no se mezclan cotas',()=>{
 const r=Calc.estimate(p,{...setup,dimensionBasis:'outer'});
 const ba=Math.PI/2*(2+.33*2);
 near(r.rows[0].setback,4);
 near(r.rows[0].deduction,8-ba);
 near(r.flat,100-8+ba);
 near(r.flatSegments[0].length,46);
 near(r.flatSegments[1].length,46);
 near(r.flatBends[0].start,46);
 near(r.flatBends[0].center,46+ba/2);
 near(r.flatBends[0].end,46+ba);
 near(r.flatBends[0].end+r.flatSegments[1].length,r.flat);
});
test('interior: ISSB usa Ri, no Ri+e; mismo perfil no genera mismo desarrollo',()=>{
 const out=Calc.estimate(p,setup),inside=Calc.estimate(p,{...setup,dimensionBasis:'inner'});
 const ba=Math.PI/2*(2+.33*2);
 near(inside.rows[0].usedSetback,2);
 near(inside.rows[0].deduction,4-ba);
 near(inside.flat,100-4+ba);
 near(inside.flat-out.flat,4);
});
test('tangencia: sumas rectas ya sin retranqueos y BA del arco',()=>{
 const res=Calc.estimate(p,{...setup,dimensionBasis:'tangent'});
 const ba=Math.PI/2*(2+.33*2);
 near(res.flat,100+ba);
 near(res.flatSegments[0].length,50);
 near(res.flatSegments[1].length,50);
 near(res.rows[0].deduction,-ba);
 near(res.flatBends[0].center,50+ba/2);
});
test('múltiples pliegues: los retranqueos se restan una vez por extremo y se reconstruye la tira completa',()=>{
 const shape={...p,segments:[50,80,60,70],angles:[90,-45,120],sequence:[3,1,2]};
 for(const dimensionBasis of ['outer','inner','tangent']){
  const r=Calc.estimate(shape,{...setup,dimensionBasis});
  assert.equal(r.rows.length,3);
  assert.equal(r.flatBends.length,3);
  assert.equal(r.flatSegments.length,4);
  near(r.flatSegments.reduce((a,v)=>a+v.length,0)+r.rows.reduce((a,v)=>a+v.allowance,0),r.flat);
  r.flatBends.forEach((b,i)=>near(b.center,(b.start+b.end)/2));
  assert.ok(r.flatBends.every((b,i,a)=>b.start>=0 && (i===0||b.start>a[i-1].end)));
  assert.equal(r.flatBends[0].bend,1); // posición en la pieza, independiente del orden de fabricación
 }
});
test('cada referencia rechaza tramos incompatibles y no muestra falsos planos calculables',()=>{
 for(const dimensionBasis of ['outer','inner']){
  const r=Calc.estimate({...p,segments:[1,1]},{...setup,dimensionBasis});
  assert.equal(r.flat,null);assert.ok(r.problems.length);
  assert.match(Flat.html(r),/Desarrollo no representable/);
 }
 const r=Calc.estimate(p,{...setup,dimensionBasis:'tangent'});
 assert.ok(r.flat!==null);
});
test('sensibilidad al K y resolución de K por probeta medida',()=>{
 const r=Calc.estimate(p,setup),target=Calc.estimate(p,{...setup,kFactor:.42});
 const calibration=Calc.calibrateK(p,setup,target.flat);
 near(calibration.kFactor,.42);
 near(calibration.correctedFlat,target.flat);
 near(calibration.correction,target.flat-r.flat);
 const width=Calc.sensitivity(p,setup,{kMin:.3,kMax:.5});
 near(width.spread,p.thickness*(.5-.3)*Math.PI/2);
 assert.ok(width.flatMax>width.flatMin);
 assert.throws(()=>Calc.calibrateK(p,setup,-1));
 assert.throws(()=>Calc.calibrateK(p,setup,r.flat+300));
 assert.throws(()=>Calc.calibrateK({...p,angles:[0]},setup,100));
});
test('modo heredado mantiene cota exterior por defecto y valida configuración',()=>{
 assert.equal(Calc.validateSetup(setup).dimensionBasis,'outer');
 assert.throws(()=>Calc.validateSetup({...setup,dimensionBasis:'centerline'}),/Referencia/);
 const orig=Calc.estimate(p,setup).flat;
 near(orig,Calc.estimate(p,{...setup,dimensionBasis:'outer'}).flat);
});
test('la vista del desarrollo marca posición de cada pliegue y su cota',()=>{
 const output=Flat.html(Calc.estimate({...p,segments:[50,80,55],angles:[90,-90],sequence:[2,1]},setup));
 assert.match(output,/B1/);
 assert.match(output,/B2/);
 assert.match(output,/DESARROLLO NOMINAL/);
 assert.match(output,/Inicio zona/);
 assert.match(output,/fibra neutra/);
});
