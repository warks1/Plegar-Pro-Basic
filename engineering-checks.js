/* v0.41 · Diagnóstico orientativo, NO cálculo homologado de prensa.
 * Aproximación F(N) ~ C*Rm(MPa)*L(mm)*t(mm)^2/V(mm), para plegado al aire.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc,
                   typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarEngineeringChecks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,G){
 'use strict';
 const MATERIALS=Object.freeze([
  {id:'Acero S235JR',rm:360,description:'Acero estructural S235JR · Rm de referencia supuesto'},
  {id:'Acero S355JR',rm:470,description:'Acero estructural S355JR · Rm de referencia supuesto'},
  {id:'Inox 304',rm:600,description:'Acero inoxidable AISI 304 · Rm de referencia supuesto'},
  {id:'Aluminio 5754',rm:250,description:'Aluminio EN AW-5754 · Rm de referencia supuesto'}
 ]);
 function profileIntersections(profile){
  const pts=G.vertices(profile),hits=[];
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8;
  function between(a,b,c){
   return c.x>=Math.min(a.x,b.x)-1e-8&&c.x<=Math.max(a.x,b.x)+1e-8
    &&c.y>=Math.min(a.y,b.y)-1e-8&&c.y<=Math.max(a.y,b.y)+1e-8;
  }
  for(let i=0;i<pts.length-1;i++)for(let j=i+2;j<pts.length-1;j++){
   const a=pts[i],b=pts[i+1],c=pts[j],d=pts[j+1],o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
   const proper=o1*o2< -1e-8&&o3*o4< -1e-8;
   const near=(Math.abs(o1)<1e-8&&between(a,b,c))||(Math.abs(o2)<1e-8&&between(a,b,d))
     ||(Math.abs(o3)<1e-8&&between(c,d,a))||(Math.abs(o4)<1e-8&&between(c,d,b));
   if(proper||near||same(a,d)||same(b,c))hits.push({tramo1:i+1,tramo2:j+1});
  }
  return hits;
 }
 // Estimador BASE de plegado al aire (no certifica herramienta o máquina).
 // Se usa también en la calculadora interactiva: un solo motor y una fórmula.
 // 1 MPa=1 N/mm²; longitud y aperturas en mm -> fuerza en kN.
 function estimateAirForce({thickness,length,opening,rm}){
  const inputs={thickness,length,opening,rm};
  for(const [key,value] of Object.entries(inputs)){
   if(typeof value!=='number'||!Number.isFinite(value))throw Error('Fuerza: '+key+' debe ser numérico y finito.');
  }
  if(thickness<.1||thickness>35)throw Error('Espesor fuera del rango orientativo 0,1–35 mm.');
  if(length<1||length>5000)throw Error('Longitud de plegado entre 1 y 5000 mm.');
  if(opening<2||opening>400)throw Error('Apertura V entre 2 y 400 mm.');
  if(rm<50||rm>2000)throw Error('Resistencia a tracción Rm entre 50 y 2000 MPa.');
  const coefficient=1.33;
  const forceKN=coefficient*rm*length*thickness*thickness/opening/1000;
  const ratio=opening/thickness;
  const warnings=[];
  if(ratio<6||ratio>12)warnings.push('V/espesor='+ratio.toFixed(2)+' fuera del intervalo orientativo 6–12 para plegado al aire.');
  if(thickness>10)warnings.push('Espesor elevado: contrastar fórmulas y tabla del fabricante para la combinación de útil y material.');
  return {forceKN,tonnes:forceKN/9.80665,perMeterKN:forceKN*1000/length,
   coefficient,vRatio:ratio,nominalV:8*thickness,length,thickness,opening,rm,
   warnings,method:'F(kN)≈1,33×Rm(MPa)×L(mm)×e(mm)²÷[1000×V(mm)]',
   estimated:true,approvedForCNC:false,machineValidated:false,toolCapacityValidated:false};
 }
 function analyse(profile,{width=100}={}){
  if(!profile||!Number.isFinite(width)||width<1||width>5000)throw Error('Introduce un ancho de plegado confirmado entre 1 y 5000 mm.');
  const setup=C.validateSetup(profile.setup);
  const calc=C.estimate(profile,setup),mat=MATERIALS.find(x=>x.id===profile.material);
  const e=profile.thickness,opening=calc.die.opening,ratio=opening/e;
  const alerts=[...calc.problems,...calc.warnings];
  const crossings=profileIntersections(profile);
  for(const hit of crossings)alerts.unshift('Posible autointersección del perfil: tramo '+hit.tramo1+' con '+hit.tramo2+'.');
  if(!mat)alerts.push('Material sin resistencia de referencia: fuerza no calculable.');
  if(profile.segments.some(v=>v<.7*opening))alerts.push('Una o más alas están por debajo de la regla ilustrativa 0,7 × V; verificar apoyo real.');
  if(setup.radius<e/5)alerts.push('Radio interior elegido muy pequeño respecto al espesor: confirmar herramienta/material.');
  const forceKN=mat?estimateAirForce({thickness:e,length:width,opening,rm:mat.rm}).forceKN:null;
  return {material:mat,forceKN,tonnes:forceKN===null?null:forceKN/9.80665,
    vNominal:8*e,vRatio:ratio,opening,width,flat:calc.flat,intersections:crossings,errors:calc.problems,warnings:[...new Set(alerts)],
    isIllustrative:true,method:'Plegado al aire aproximado · F≈1,33×Rm×L×e²/V; Rm supuesto; no contempla límite de máquina ni geometría real.'};
 }
 return {MATERIALS,analyse,profileIntersections,estimateAirForce};
});