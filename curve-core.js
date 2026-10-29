/* Curvado por golpes: planificación geométrica sobre la fibra neutra.
 * BA = (Ri + K e) θ. Golpes en centros de N intervalos iguales.
 * Las posiciones son marcas en el desarrollo, no valores del eje X.
 * Referencia de proceso: https://trushop.my.trumpf.com/en_GB/bending-tools/request-for-special-applications/radius-bending-SA12350
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCurveCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAX_HITS=360;
 function number(value,name,min,max){
  if(value===null||value===undefined||String(value).trim()==='')throw Error('Introduce '+name+'.');
  const n=typeof value==='string'?Number(value.replace(',','.')):value;
  if(!Number.isFinite(n)||n<min||n>max)throw Error(name+': valor entre '+min+' y '+max+'.');return n;
 }
 function calculate(input){
  if(!input||typeof input!=='object')throw Error('Faltan los datos de la curva.');
  const name=String(input.name||'Curva').trim().slice(0,100)||'Curva';
  const radius=number(input.radius,'radio interior (mm)',.1,100000),thickness=number(input.thickness,'espesor (mm)',.1,100);
  const angle=number(input.angle,'giro total (°)',.1,180),kFactor=number(input.kFactor,'factor K',.2,.6);
  const lead=number(input.lead,'tramo recto inicial (mm)',0,100000),tail=number(input.tail,'tramo recto final (mm)',0,100000);
  const opening=number(input.opening,'apertura V (mm)',1,1000),width=number(input.width,'longitud de plegado (mm)',1,10000);
  const direction=input.direction==='down'?'down':input.direction==='up'?'up':null;if(!direction)throw Error('Selecciona arriba o abajo.');
  const mode=input.mode==='pitch'?'pitch':input.mode==='count'?'count':null;if(!mode)throw Error('Selecciona número de golpes o separación máxima.');
  const neutralRadius=radius+kFactor*thickness,theta=angle*Math.PI/180,arcLength=neutralRadius*theta;
  let hits,pitchLimit=null;
  if(mode==='count'){hits=number(input.hits,'número de golpes',1,MAX_HITS);if(!Number.isInteger(hits))throw Error('El número de golpes debe ser entero.');}
  else{pitchLimit=number(input.pitchLimit,'separación máxima (mm)',.01,10000);hits=Math.ceil(arcLength/pitchLimit);if(hits>MAX_HITS)throw Error('La separación solicitada necesita '+hits+' golpes; el máximo es '+MAX_HITS+'.');}
  const pitch=arcLength/hits,increment=angle/hits,sign=direction==='down'?-1:1;
  const rows=Array.from({length:hits},(_,i)=>({hit:i+1,position:lead+(i+.5)*pitch,fromEnd:tail+arcLength-(i+.5)*pitch,increment:sign*increment,total:sign*(i+1)*increment}));
  const warnings=[];
  if(radius<thickness)warnings.push('Radio interior menor que el espesor: comprobar material y utillaje.');
  if(pitch<opening/2)warnings.push('La separación es menor que V/2: varios golpes comparten la zona de apoyo. Requiere comprobación y prueba de curvado.');
  if(lead+pitch/2<opening/2||tail+pitch/2<opening/2)warnings.push('El primer o último golpe queda a menos de V/2 del borde: revisar el apoyo de la chapa.');
  if(increment>15)warnings.push('Más de 15° por golpe: se representará una curva con facetas pronunciadas.');
  return {name,radius,thickness,angle,kFactor,lead,tail,opening,width,direction,mode,hits,pitchLimit,
   material:String(input.material||'Sin especificar').slice(0,100),punch:String(input.punch||'').slice(0,100),die:String(input.die||'').slice(0,100),
   neutralRadius,arcLength,flatLength:lead+arcLength+tail,pitch,increment:sign*increment,rows,warnings,
   note:'Plan geométrico de marcas y giros. La recuperación elástica, la penetración Y y la recolocación del tope requieren ajuste de máquina.'};
 }
 function inputOf(plan){return Object.fromEntries(['name','radius','thickness','angle','kFactor','lead','tail','opening','width','direction','mode','hits','pitchLimit','material','punch','die'].map(k=>[k,plan[k]]));}
 function points(plan,progress=plan.hits){
  const n=number(progress,'avance',0,plan.hits),points=[{x:0,y:0}];let x=0,y=0,heading=0;
  const lengths=[plan.lead+plan.pitch/2,...Array(plan.hits-1).fill(plan.pitch),plan.tail+plan.pitch/2];
  lengths.forEach((length,i)=>{if(i>0)heading-=plan.increment*Math.PI/180*Math.max(0,Math.min(1,n-(i-1)));x+=length*Math.cos(heading);y+=length*Math.sin(heading);points.push({x,y});});
  return points;
 }
 function cell(v){const s=String(v??'');return '"'+(/^[=+@\t\r]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"';}
 function csv(plan){return '\ufeff'+[['Pieza',plan.name],['Material',plan.material],['Radio interior mm',plan.radius],['Espesor mm',plan.thickness],['Factor K',plan.kFactor],['Giro total grados',plan.angle],['Apertura V mm',plan.opening],['Nota',plan.note],[],['Golpe','Marca desde inicio mm','Marca desde final mm','Giro incremental grados','Giro acumulado grados'],...plan.rows.map(r=>[r.hit,r.position.toFixed(4),r.fromEnd.toFixed(4),r.increment.toFixed(4),r.total.toFixed(4)])].map(r=>r.map(cell).join(';')).join('\r\n');}
 return {calculate,points,inputOf,csv,MAX_HITS};
});
