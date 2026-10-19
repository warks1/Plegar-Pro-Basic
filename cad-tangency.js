/* Plegar Pro Plus v0.24 — tangencias de primitivas circulares DXF.
 * Inspección analítica del dibujo (G1 nominal), NO CAD sólido ni aprobación CNC.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadTangency=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_PRIMITIVES=1500,MAX_COMPARISONS=60000,MAX_EXAMPLES=80;
const toDeg=180/Math.PI;
function ensure(ok,msg){if(!ok)throw new Error(msg);}
function gap(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function tangent(part,at){
 if(part.kind==='LINE'){
  const dx=part.end.x-part.start.x,dy=part.end.y-part.start.y,n=Math.hypot(dx,dy);
  return {x:dx/n,y:dy/n};
 }
 const angle=part.startAngle+(at==='end'?part.sweep:0),direction=Math.sign(part.sweep);
 return {x:-Math.sin(angle)*direction,y:Math.cos(angle)*direction};
}
function deviation(a,b,unoriented=false){
 const dot=tangent(a.part,a.end).x*tangent(b.part,b.end).x+tangent(a.part,a.end).y*tangent(b.part,b.end).y;
 return Math.acos(Math.min(1,Math.max(-1,unoriented?Math.abs(dot):dot)))*toDeg;
}
function endpoint(part,end){return end==='start'?part.start:part.end;}
function round(n){return Number(n.toFixed(6));}
function inspect(document,{joinTolerance=0.05,angleTolerance=1,sameLayer=true}={}){
 ensure(document?.verified===false&&document?.activeInSimulation===false&&Array.isArray(document.contours),'Solo se admite un DXF sin verificar.');
 ensure(typeof joinTolerance==='number'&&Number.isFinite(joinTolerance)&&joinTolerance>=0&&joinTolerance<=1,'Tolerancia lineal fuera de 0–1 mm.');
 ensure(typeof angleTolerance==='number'&&Number.isFinite(angleTolerance)&&angleTolerance>=0&&angleTolerance<=10,'Tolerancia angular fuera de 0–10 grados.');
 ensure(typeof sameLayer==='boolean','Filtro de capas inválido.');
 const parts=[];
 for(const contour of document.contours){
  ensure(contour?.verified===false&&contour?.activeInSimulation===false&&Number.isInteger(contour.index)&&Array.isArray(contour.primitives),'Perfil sin geometría fuente analítica DXF.');
  ensure(typeof contour.layer==='string'&&contour.primitives.length>0,'Perfil CAD sin capa o segmentos.');
  for(let i=0;i<contour.primitives.length;i++){
   const p=contour.primitives[i];
   ensure(['LINE','ARC','CIRCLE'].includes(p?.kind)&&p.start&&p.end&&[p.start.x,p.start.y,p.end.x,p.end.y].every(Number.isFinite),'Primitiva no válida.');
   if(p.kind==='LINE')ensure(gap(p.start,p.end)>1e-7,'Línea degenerada.');
   else ensure(p.center&&[p.center.x,p.center.y,p.radius,p.startAngle,p.sweep].every(Number.isFinite)&&p.radius>0&&Math.abs(p.sweep)>1e-8,'Arco no válido.');
   parts.push({contour:contour.index,layer:contour.layer,index:i,part:p});
   ensure(parts.length<=MAX_PRIMITIVES,'Demasiadas primitivas para inspección de tangencias.');
  }
 }
 const summary={primitives:parts.length,arcs:parts.filter(x=>x.part.kind!=='LINE').length,internalJoints:0,smoothTangencies:0,sharpTransitions:0,externalCandidates:0,externalTangentCandidates:0,externalCorners:0,checkedPairs:0,limited:false};
 const examples=[];
 function add(type,a,b,separation,angle,nominal){
  if(examples.length<MAX_EXAMPLES){
   const A=endpoint(a.part,a.end),B=endpoint(b.part,b.end);
   examples.push({type,nominal,from:{contour:a.contour,segment:a.index,layer:a.layer,endpoint:a.end},to:{contour:b.contour,segment:b.index,layer:b.layer,endpoint:b.end},gap_mm:round(separation),deviation_deg:round(angle),point_mm:{x:round((A.x+B.x)/2),y:round((A.y+B.y)/2)}});
  }
 }
 // Tangencias dirigidas dentro del recorrido de la polilínea DXF.
 for(const contour of document.contours){
  const list=parts.filter(x=>x.contour===contour.index),n=list.length;
  const joins=n>1?(contour.closed?n:n-1):0;
  for(let k=0;k<joins;k++){
   const a={...list[k],end:'end'},b={...list[(k+1)%n],end:'start'};
   if(a.part.kind==='LINE'&&b.part.kind==='LINE')continue;
   const d=gap(a.part.end,b.part.start),angle=deviation(a,b),smooth=d<=joinTolerance&&angle<=angleTolerance;
   summary.internalJoints++;
   if(smooth)summary.smoothTangencies++;else summary.sharpTransitions++;
   add(smooth?'tangencia dirigida':'cambio de tangente',a,b,d,angle,true);
  }
 }
 // Entidades separadas: orientación del recorrido NO conocida. Se mide ángulo sin signo.
 outer:for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
  const a=parts[i],b=parts[j];
  if(a.contour===b.contour||(sameLayer&&a.layer!==b.layer)||a.part.kind==='CIRCLE'||b.part.kind==='CIRCLE'||a.part.kind==='LINE'&&b.part.kind==='LINE')continue;
  if(++summary.checkedPairs>MAX_COMPARISONS){summary.checkedPairs=MAX_COMPARISONS;summary.limited=true;break outer;}
  for(const e1 of ['start','end'])for(const e2 of ['start','end']){
   const A={...a,end:e1},B={...b,end:e2},d=gap(endpoint(a.part,e1),endpoint(b.part,e2));
   if(d>joinTolerance)continue;
   const angle=deviation(A,B,true),smooth=angle<=angleTolerance;
   summary.externalCandidates++;
   if(smooth)summary.externalTangentCandidates++;else summary.externalCorners++;
   add(smooth?'posible tangencia':'encuentro con ángulo',A,B,d,angle,false);
  }
 }
 const warnings=['La tangencia dentro de una polilínea es G1 NOMINAL basada en el DXF; no valida tolerancias físicas ni continuidad de curvatura G2.',
 'Entre entidades independientes el sentido de montaje y recorrido es desconocido: las tangencias se indican como POSIBLES.',
 'No se detectan todas las intersecciones curva-curva ni la compatibilidad de amarres; el módulo de cruces por cuerdas sigue siendo aproximado.',
 'SIN VERIFICAR / NO CNC / NO SIMULACIÓN INDUSTRIAL.'];
 if(summary.limited)warnings.push('ANÁLISIS PARCIAL: se alcanzó el límite de comparaciones y quedan pares sin revisar.');
 return {version:'0.24',type:'AUDITORÍA NOMINAL DE TANGENCIAS DXF',verified:false,approvedForCNC:false,approvedForSimulation:false,geometryModified:false,
 complete:!summary.limited,joinTolerance_mm:joinTolerance,angleTolerance_deg:angleTolerance,sameLayer,summary,examples,warnings,
 readiness:{status:'NO HABILITADO',canUseCNC:false,canUseSimulation:false,canGenerateSolid:false}};
}
return {inspect};
});
