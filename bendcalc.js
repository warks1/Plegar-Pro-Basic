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
 const LIB=typeof module==='object'&&module.exports?require('./tool-library.js'):window.PlegarToolLibrary;
 if(!LIB)throw new Error('Biblioteca de herramientas no cargada.');
 const {PUNCHES,DIES}=LIB;
 const DEFAULT_SETUP=Object.freeze({radius:2,kFactor:0.33,punch:'p88-r1',die:'v16-88',backgaugeX:120,backgaugePositionMode:'manual',dimensionBasis:'outer',dieHeight:null,tableLeft:null,tableRight:null,ramWidth:null,ramBottomOffset:null});
 function lookup(list,id){return list.find(item=>item.id===id);}
 function validateSetup(source){
  const s={...DEFAULT_SETUP,...source};
  const radius=Number(s.radius),kFactor=Number(s.kFactor);
  if(!Number.isFinite(radius)||radius<0.1||radius>500)throw new Error('Radio interior estimado entre 0,1 y 500 mm.');
  if(!Number.isFinite(kFactor)||kFactor<0.2||kFactor>0.6)throw new Error('Factor K entre 0,2 y 0,6.');
  if(!lookup(PUNCHES,s.punch))throw new Error('Punzón no reconocido.');
  if(!lookup(DIES,s.die))throw new Error('Matriz no reconocida.');
  const dimensionBasis=s.dimensionBasis||'outer';
  if(!['outer','inner','tangent'].includes(dimensionBasis))throw new Error('Referencia de cotas desconocida. Selecciona exterior, interior o tramo recto hasta tangencia.');
  const dieHeight=s.dieHeight==null||s.dieHeight===''?null:Number(s.dieHeight);
  if(dieHeight!==null&&(!Number.isFinite(dieHeight)||dieHeight<5||dieHeight>400))throw new Error('Altura de matriz H entre 5 y 400 mm, o desconocida.');
  // Coordenadas de los envolventes de máquina en vista de perfil, nunca supuestas.
  const optional=(key,min,max)=>{
   const value=s[key]==null||s[key]===''?null:Number(s[key]);
   if(value!==null&&(!Number.isFinite(value)||value<min||value>max))throw new Error(key+' debe estar entre '+min+' y '+max+' mm, o quedar sin definir.');
   return value;
  };
  const tableLeft=optional('tableLeft',20,2000),tableRight=optional('tableRight',20,2000);
  const ramWidth=optional('ramWidth',20,2000),ramBottomOffset=optional('ramBottomOffset',10,500);
  const backgaugeX=Number(s.backgaugeX);
  if(!Number.isFinite(backgaugeX)||backgaugeX<1||backgaugeX>10000)throw new Error('Posición nominal del tope X entre 1 y 10000 mm.');
  const backgaugePositionMode=s.backgaugePositionMode||'manual';
  if(!['wing','manual'].includes(backgaugePositionMode))throw Error('Modo de posicionamiento X del tope desconocido.');
  // X por identificador B; null hereda el X general. Nunca por orden de ejecución.
  let backgaugeByBend;
  if(s.backgaugeByBend!=null){
   if(!Array.isArray(s.backgaugeByBend)||s.backgaugeByBend.length>23)
    throw Error('Tabla de posiciones del tope X inválida (máximo 23).');
   backgaugeByBend=s.backgaugeByBend.map((x,i)=>{
    if(x==null||x==='')return null;
    if(typeof x!=='number'||!Number.isFinite(x)||x<1||x>10000)
     throw Error('Tope X B'+(i+1)+' entre 1 y 10000 mm o vacío.');
    return x;
   });
  }
  const machineId=s.machineId==null?'generic':s.machineId;
  if(!['generic','trumpf-v85'].includes(machineId))throw Error('Máquina desconocida.');
  const backgaugeMode=s.backgaugeMode||'stop';
  if(!['stop','support'].includes(backgaugeMode))throw Error('Modo de tope desconocido.');
  return {machineId,backgaugeMode,backgaugePositionMode,radius,kFactor,punch:s.punch,die:s.die,backgaugeX,dimensionBasis,dieHeight,tableLeft,tableRight,ramWidth,ramBottomOffset,
   ...(backgaugeByBend?{backgaugeByBend}:{})};
 }
 function backgaugeTarget(profile,bendId,setupInput=profile?.setup){
  const setup=validateSetup(setupInput);
  if(!Number.isInteger(bendId)||bendId<1||bendId>=profile.segments.length)throw Error('Pliegue fuera de rango para posicionar el tope.');
  const override=setup.backgaugeByBend?.[bendId-1];
  if(override!=null)return {x:override,source:'por-pliegue'};
  if(setup.backgaugePositionMode==='wing')return {x:profile.segments[bendId],source:'ala contigua'};
  return {x:setup.backgaugeX,source:'general'};
 }
 function estimate(profile,setupInput){
  const setup=validateSetup(setupInput);
  if(!profile||!Array.isArray(profile.segments)||!Array.isArray(profile.angles)||profile.angles.length!==profile.segments.length-1||!profile.segments.every(v=>Number.isFinite(v)&&v>0)||!profile.angles.every(a=>Number.isFinite(a)&&Math.abs(a)<180)||!Number.isFinite(profile.thickness)||profile.thickness<=0){throw new Error('Perfil nominal no válido para cálculo.');}
  const die=lookup(DIES,setup.die),punch=lookup(PUNCHES,setup.punch);
  const e=profile.thickness,R=setup.radius,K=setup.kFactor,basis=setup.dimensionBasis;
  const overrides=profile.bendOverrides;
  if(overrides!==undefined){
   if(!Array.isArray(overrides)||overrides.length!==profile.angles.length)
    throw new Error('La tabla de Ri/K individuales no coincide con los pliegues.');
   overrides.forEach((v,i)=>{
    if(v===null)return;
    if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Parámetros del pliegue B'+(i+1)+' incorrectos.');
    for(const [key,min,max] of [['radius',.1,500],['kFactor',.2,.6]]){
     if(v[key]!==undefined&&v[key]!==null&&(!Number.isFinite(v[key])||v[key]<min||v[key]>max))
      throw new Error('Valor '+key+' incorrecto en B'+(i+1)+'.');
    }
   });
  }
  // Las longitudes de tramo se interpretan TODAS según la misma referencia:
  // exterior/interior hasta intersección virtual de caras, o recta hasta tangencia.
  const rows=profile.angles.map((signed,i)=>{
   const theta=Math.abs(signed)*Math.PI/180;
   const override=overrides?.[i],r=override?.radius??R,k=override?.kFactor??K;
   const outsideSetback=(r+e)*Math.tan(theta/2);
   const insideSetback=r*Math.tan(theta/2);
   const usedSetback=basis==='outer'?outsideSetback:basis==='inner'?insideSetback:0;
   const allowance=theta*(r+k*e);
   const deduction=2*usedSetback-allowance;
   return {bend:i+1,angle:Math.abs(signed),signedAngle:signed,inside:180-Math.abs(signed),
    theta,allowance,setback:outsideSetback,outsideSetback,insideSetback,usedSetback,deduction,
    radius:r,kFactor:k,localRadius:override?.radius!=null,localK:override?.kFactor!=null,neutralRadius:r+k*e};
  });
  const nominal=profile.segments.reduce((a,b)=>a+b,0);
  const deduction=rows.reduce((a,r)=>a+r.deduction,0);
  const allowance=rows.reduce((a,r)=>a+r.allowance,0);
  const flat=nominal-deduction;
  const problems=[];
  const straight=profile.segments.map((length,i)=>{
   const required=(rows[i-1]?.usedSetback||0)+(rows[i]?.usedSetback||0);
   const remaining=length-required;
   if(remaining< -1e-7)problems.push(`Tramo ${i+1}: longitud ${length.toFixed(2)} mm inferior a retranqueos ${required.toFixed(2)} mm.`);
   return remaining<0&&remaining> -1e-7?0:remaining;
  });
  if(flat<=0||!Number.isFinite(flat))problems.push('El desarrollo resultante no es geométricamente válido.');
  let cursor=0;
  const flatSegments=[],flatBends=[];
  for(let i=0;i<straight.length;i++){
   const start=cursor,end=start+straight[i];
   flatSegments.push({segment:i+1,start,end,length:straight[i]});
   cursor=end;
   if(i<rows.length){
    const row=rows[i],bendStart=cursor,bendEnd=bendStart+row.allowance;
    row.flatStart=bendStart;row.flatEnd=bendEnd;row.flatCenter=(bendStart+bendEnd)/2;
    flatBends.push({bend:i+1,start:bendStart,end:bendEnd,center:row.flatCenter,allowance:row.allowance,angle:row.angle,radius:row.radius,kFactor:row.kFactor,neutralRadius:row.neutralRadius});
    cursor=bendEnd;
   }
  }
  if(Math.abs(cursor-flat)>Math.max(1e-7,Math.abs(flat)*1e-10))throw new Error('Error interno: el desarrollo no coincide con la suma de rectas y arcos.');
  const flatValid=problems.length===0;
  const warnings=[];
  const vRatio=die.opening/e;
  if(vRatio<6||vRatio>10)warnings.push(`V/e = ${vRatio.toFixed(2)}: fuera del rango orientativo 6–10 para plegado al aire. Referencia habitual V≈8×e.`);
  if(rows.some(row=>row.radius<punch.nose))warnings.push('Radio supuesto de uno o más pliegues inferior a punta de punzón; revisar geometría y condiciones reales.');
  if(rows.some(row=>row.localRadius||row.localK))warnings.push('Se aplican radios/factores K específicos por pliegue: deben confirmarse con ensayos independientes.');
  if(rows.some(row=>row.angle>0&&row.radius<.2*e))warnings.push('Hay pliegues con Ri inferior a 0,2×espesor: revisar plegado real y límite del material.');
  if(rows.some(r=>r.angle>0&&r.inside<punch.angle))warnings.push('Uno o más ángulos interiores son inferiores al ángulo nominal del punzón seleccionado.');
  if(rows.some(r=>r.angle>0&&r.inside<die.angle))warnings.push('Uno o más ángulos interiores son inferiores al ángulo nominal de la matriz seleccionada.');
  if(rows.some(r=>r.angle>150))warnings.push('Pliegue muy cerrado: la hipótesis geométrica simplificada puede perder validez.');
  if(rows.some(r=>r.angle>=170))warnings.push('Giro extremo (≥170°): la intersección virtual de caras es inestable y se requiere CAD de radios reales.');
  warnings.push(basis==='outer'
   ? 'Cotas EXTERIORES: cada tramo llega a la intersección teórica de las caras exteriores; BD=2·OSSB−BA.'
   :basis==='inner'
   ? 'Cotas INTERIORES: cada tramo llega a la intersección teórica de las caras interiores; BD=2·ISSB−BA.'
   :'Tramos RECTOS HASTA TANGENCIA: se suman los arcos BA a los tramos rectos; deducción = −BA.');
  warnings.push('Datos de punzones y matrices genéricos, sin dimensiones certificadas de fabricante.');
  warnings.push('Resultado orientativo. Confirmar K, radio real, referencias dimensionales y primeras piezas antes de fabricar.');
  return {rows,nominal,allowance,deduction,flat:flatValid?flat:null,problems,warnings,vRatio,die,punch,setup,
   dimensionBasis:basis,straight,flatSegments:flatValid?flatSegments:[],flatBends:flatValid?flatBends:[],
   neutralRadius:R+K*e,hasBendOverrides:rows.some(row=>row.localRadius||row.localK),measurementReference:basis==='outer'?'cotas exteriores':basis==='inner'?'cotas interiores':'rectas hasta tangencia'};
 }
 function calibrateK(profile,setupInput,measuredFlat){
  const setup=validateSetup(setupInput),measured=Number(measuredFlat);
  if(!Number.isFinite(measured)||measured<=0||measured>1000000)throw new Error('Introduce un desarrollo de ensayo medido, positivo y en mm.');
  const current=estimate(profile,setup);
  if(current.rows.some(row=>row.localK))throw new Error('Hay factores K individuales; desactívalos antes de calibrar un único K general.');
  if(current.flat===null)throw new Error('No se puede calibrar un perfil con geometría no desarrollable.');
  const radians=current.rows.reduce((sum,row)=>sum+row.theta,0);
  if(radians<1e-9)throw new Error('Para calibrar K se necesita al menos un pliegue no nulo.');
  const derivative=profile.thickness*radians;
  const factor=setup.kFactor+(measured-current.flat)/derivative;
  if(!Number.isFinite(factor)||factor<.2||factor>.6)
   throw new Error('El ensayo implica K fuera de 0,20–0,60. Revisar cotas, radio, material y referencia dimensional antes de ajustar.');
  const corrected=estimate(profile,{...setup,kFactor:factor});
  if(corrected.flat===null)throw new Error('El factor calibrado no produce una geometría desarrollable.');
  return {kFactor:factor,measuredFlat:measured,previousFlat:current.flat,correctedFlat:corrected.flat,
   correction:measured-current.flat,basis:setup.dimensionBasis,
   note:'Ajuste matemático de un K común según un ensayo; NO garantiza otros ángulos, piezas, útiles o materiales.'};
 }
 function sensitivity(profile,setupInput,{kMin=.3,kMax=.5}={}){
  const setup=validateSetup(setupInput);
  if(!Number.isFinite(kMin)||!Number.isFinite(kMax)||kMin<.2||kMax>.6||kMin>kMax)
   throw new Error('Intervalo de K no válido.');
  const low=estimate(profile,{...setup,kFactor:kMin}),high=estimate(profile,{...setup,kFactor:kMax});
  return {kMin,kMax,flatMin:low.flat,flatMax:high.flat,spread:low.flat===null||high.flat===null?null:high.flat-low.flat,
   note:profile.bendOverrides?.some(x=>x?.kFactor!=null)?'Sólo cambia K general; los K individuales permanecen fijos.':'K general para todos los pliegues sin valor local.'};
 }
 return {PUNCHES,DIES,DEFAULT_SETUP,validateSetup,backgaugeTarget,estimate,calibrateK,sensitivity};
});
