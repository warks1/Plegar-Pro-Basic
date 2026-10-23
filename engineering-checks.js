/* v0.41 · Diagnóstico orientativo, NO cálculo homologado de prensa.
 * Aproximación F(N) ~ C*Rm(MPa)*L(mm)*t(mm)^2/V(mm), para plegado al aire.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarEngineeringChecks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const MATERIALS=Object.freeze([
  {id:'Acero S235JR',rm:360,description:'Acero estructural S235JR · Rm de referencia supuesto'},
  {id:'Acero S355JR',rm:470,description:'Acero estructural S355JR · Rm de referencia supuesto'},
  {id:'Inox 304',rm:600,description:'Acero inoxidable AISI 304 · Rm de referencia supuesto'},
  {id:'Aluminio 5754',rm:250,description:'Aluminio EN AW-5754 · Rm de referencia supuesto'}
 ]);
 function analyse(profile,{width=100}={}){
  if(!profile||!Number.isFinite(width)||width<1||width>5000)throw Error('Introduce un ancho de plegado confirmado entre 1 y 5000 mm.');
  const setup=C.validateSetup(profile.setup);
  const calc=C.estimate(profile,setup),mat=MATERIALS.find(x=>x.id===profile.material);
  const e=profile.thickness,opening=calc.die.opening,ratio=opening/e;
  const alerts=[...calc.problems,...calc.warnings];
  if(!mat)alerts.push('Material sin resistencia de referencia: fuerza no calculable.');
  if(profile.segments.some(v=>v<.7*opening))alerts.push('Una o más alas están por debajo de la regla ilustrativa 0,7 × V; verificar apoyo real.');
  if(setup.radius<e/5)alerts.push('Radio interior elegido muy pequeño respecto al espesor: confirmar herramienta/material.');
  const forceKN=mat?1.33*mat.rm*width*e*e/opening/1000:null;
  return {material:mat,forceKN,tonnes:forceKN===null?null:forceKN/9.80665,
    vNominal:8*e,vRatio:ratio,opening,width,flat:calc.flat,errors:calc.problems,warnings:[...new Set(alerts)],
    isIllustrative:true,method:'Plegado al aire aproximado · F≈1,33×Rm×L×e²/V; Rm supuesto; no contempla límite de máquina ni geometría real.'};
 }
 return {MATERIALS,analyse};
});