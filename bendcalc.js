/* Plegar Pro Plus v0.3: estimador geométrico de desarrollo (NO datos de máquina).
   Hipótesis: longitudes entre vértices teóricos agudos, sin zona curva; doblado
   uniforme y espesor constante. BA = θrad·(Ri + K·e), OSSB=(Ri+e)·tan(θ/2),
   BD=2·OSSB−BA. No incluye springback, elasticidad, tolerancias o colisiones. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarBendCalc=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PUNCHES=Object.freeze([
  {id:'p88-r1',name:'Punzón genérico 88° · punta R1',angle:88,nose:1},
  {id:'p88-r2',name:'Punzón genérico 88° · punta R2',angle:88,nose:2},
  {id:'p30-r1',name:'Punzón genérico 30° · punta R1',angle:30,nose:1},
  {id:'p30-r2',name:'Punzón genérico 30° · punta R2',angle:30,nose:2}
 ]);
 const DIES=Object.freeze([6,8,10,12,16,22,24,32,35,40,50].map(v=>({id:`v${v}-88`,name:`Matriz genérica V${v} · 88°`,opening:v,angle:88})).concat([
  {id:'v10-30',name:'Matriz genérica V10 · 30°',opening:10,angle:30},
  {id:'v16-30',name:'Matriz genérica V16 · 30°',opening:16,angle:30}
 ]));
 const DEFAULT_SETUP=Object.freeze({radius:2,kFactor:0.33,punch:'p88-r1',die:'v16-88'});
 function lookup(list,id){return list.find(item=>item.id===id);}
 function validateSetup(source){
  const s={...DEFAULT_SETUP,...source};
  const radius=Number(s.radius),kFactor=Number(s.kFactor);
  if(!Number.isFinite(radius)||radius<0.1||radius>500)throw new Error('Radio interior estimado entre 0,1 y 500 mm.');
  if(!Number.isFinite(kFactor)||kFactor<0.2||kFactor>0.6)throw new Error('Factor K entre 0,2 y 0,6.');
  if(!lookup(PUNCHES,s.punch))throw new Error('Punzón no reconocido.');
  if(!lookup(DIES,s.die))throw new Error('Matriz no reconocida.');
  return {radius,kFactor,punch:s.punch,die:s.die};
 }
 function estimate(profile,setupInput){
  const setup=validateSetup(setupInput);
  if(!profile||!Array.isArray(profile.segments)||!Array.isArray(profile.angles)||profile.angles.length!==profile.segments.length-1||!profile.segments.every(v=>Number.isFinite(v)&&v>0)||!profile.angles.every(a=>Number.isFinite(a)&&Math.abs(a)<180)||!Number.isFinite(profile.thickness)||profile.thickness<=0){throw new Error('Perfil nominal no válido para cálculo.');}
  const die=lookup(DIES,setup.die),punch=lookup(PUNCHES,setup.punch);
  const e=profile.thickness,R=setup.radius,K=setup.kFactor;
  const rows=profile.angles.map((signed,i)=>{
   const theta=Math.abs(signed)*Math.PI/180;
   const setback=(R+e)*Math.tan(theta/2);
   const allowance=theta*(R+K*e);
   return {bend:i+1,angle:Math.abs(signed),inside:180-Math.abs(signed),allowance,setback,deduction:2*setback-allowance};
  });
  const nominal=profile.segments.reduce((a,b)=>a+b,0);
  const deduction=rows.reduce((a,r)=>a+r.deduction,0);
  const allowance=rows.reduce((a,r)=>a+r.allowance,0);
  const flat=nominal-deduction;
  const problems=[];
  for(let i=0;i<profile.segments.length;i++){
   const required=(rows[i-1]?.setback||0)+(rows[i]?.setback||0);
   if(profile.segments[i]+1e-7<required)problems.push(`Tramo ${i+1}: longitud ${profile.segments[i].toFixed(2)} mm inferior a retranqueos ${required.toFixed(2)} mm.`);
  }
  if(flat<=0||!Number.isFinite(flat))problems.push('El desarrollo resultante no es geométricamente válido.');
  const warnings=[];
  const vRatio=die.opening/e;
  if(vRatio<6||vRatio>10)warnings.push(`V/e = ${vRatio.toFixed(2)}: fuera del rango orientativo 6–10 para plegado al aire. Referencia habitual V≈8×e.`);
  if(R<punch.nose)warnings.push('Radio supuesto inferior al radio nominal de punta del punzón; revisar geometría y condiciones reales.');
  if(rows.some(r=>r.angle>0&&r.inside<punch.angle))warnings.push('Uno o más ángulos interiores son inferiores al ángulo nominal del punzón seleccionado.');
  if(rows.some(r=>r.angle>0&&r.inside<die.angle))warnings.push('Uno o más ángulos interiores son inferiores al ángulo nominal de la matriz seleccionada.');
  if(rows.some(r=>r.angle>150))warnings.push('Pliegue muy cerrado: la hipótesis geométrica simplificada puede perder validez.');
  warnings.push('Datos de punzones y matrices genéricos, sin dimensiones certificadas de fabricante.');
  warnings.push('Resultado orientativo. Confirmar K, radio real, referencias dimensionales y primeras piezas antes de fabricar.');
  return {rows,nominal,allowance,deduction,flat:problems.length?null:flat,problems,warnings,vRatio,die,punch,setup};
 }
 return {PUNCHES,DIES,DEFAULT_SETUP,validateSetup,estimate};
});
