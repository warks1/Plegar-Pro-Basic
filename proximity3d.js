/* Plegar Pro Plus v0.11 — screening of nominal 3D extruded prisms ONLY.
 * Plate edge strips have sharp joins and a demonstration width. Tool outlines
 * are generic and fixed; distance ZERO is a possible overlap/contact of those
 * modeled solids, not a confirmed real-world collision.
 * No swept envelopes, real CAD, material physics, machine kinematics or safety.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarProximity3D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const T=typeof require==='function'?require('./tooling3d.js'):window.PlegarTooling3D;
 const EPS=1e-9;
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function pointInside(p,poly){
  let within=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j];
   if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)within=!within;
  }
  return within;
 }
 function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
 function onSegment(p,a,b){return Math.abs(cross(a,b,p))<EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;}
 function touches(a,b,c,d){
  const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);
  return ((x>EPS&&y< -EPS||x< -EPS&&y>EPS)&&(z>EPS&&w< -EPS||z< -EPS&&w>EPS))||
   onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);
 }
 function pointToEdge(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
  if(l2<EPS)return Math.hypot(p.x-a.x,p.y-a.y);
  const k=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2));
  return Math.hypot(p.x-a.x-k*dx,p.y-a.y-k*dy);
 }
 function flatGap(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length<3||b.length<3||![...a,...b].every(valid))throw new Error('Polígonos planos no válidos.');
  if(pointInside(a[0],b)||pointInside(b[0],a))return 0;
  let min=Infinity;
  for(let i=0;i<a.length;i++){
   const p=a[i],q=a[(i+1)%a.length];
   for(let j=0;j<b.length;j++){
    const r=b[j],s=b[(j+1)%b.length];
    if(touches(p,q,r,s))return 0;
    min=Math.min(min,pointToEdge(p,r,s),pointToEdge(q,r,s),pointToEdge(r,p,q),pointToEdge(s,p,q));
   }
  }
  return min;
 }
 function volumeGap(a,b){
  if(!Number.isFinite(a?.z0)||!Number.isFinite(a?.z1)||a.z0>=a.z1||!Number.isFinite(b?.z0)||!Number.isFinite(b?.z1)||b.z0>=b.z1)throw new Error('Intervalo Z inválido.');
  const planar=flatGap(a.outline,b.outline);
  const dz=Math.max(0,a.z0-b.z1,b.z0-a.z1);
  return Math.hypot(planar,dz);
 }
 function completedPrisms(sheet){
  if(!Array.isArray(sheet?.vertices)||!Array.isArray(sheet?.segmentStatuses)||!Number.isFinite(sheet.thickness)||sheet.thickness<=0||!Number.isFinite(sheet.width)||sheet.width<=0)throw new Error('Malla de chapa incompleta.');
  if(sheet.vertices.length!==4*(sheet.segmentStatuses.length+1))throw new Error('Estaciones de chapa inconsistentes.');
  const out=[];
  for(let i=0;i<sheet.segmentStatuses.length;i++){
   if(sheet.segmentStatuses[i]!=='completed')continue;
   const a=sheet.vertices.slice(i*4,i*4+2),b=sheet.vertices.slice((i+1)*4,(i+1)*4+2);
   const p={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
   const q={x:(b[0].x+b[1].x)/2,y:(b[0].y+b[1].y)/2};
   const dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy);
   if(l<1e-7)continue;
   const nx=-dy/l*sheet.thickness/2,ny=dx/l*sheet.thickness/2;
   out.push({segment:i+1,group:'sheet',z0:0,z1:sheet.width,outline:[{x:p.x+nx,y:p.y+ny},{x:q.x+nx,y:q.y+ny},{x:q.x-nx,y:q.y-ny},{x:p.x-nx,y:p.y-ny}]});
  }
  return out;
 }
 function inspect(sheet,scene,{nearMm=2}={}){
  if(!Number.isFinite(nearMm)||nearMm<0||nearMm>1000)throw new Error('Umbral de proximidad inválido.');
  const strips=completedPrisms(sheet),tools=T.prisms(sheet,scene),pairs=[];
  for(const strip of strips)for(const tool of tools){
   const mm=volumeGap(strip,tool);
   pairs.push({segment:strip.segment,tool:tool.group,mm,status:mm<=EPS?'solapamiento nominal':mm<nearMm?'proximidad nominal':'separado en modelo'});
  }
  pairs.sort((a,b)=>a.mm-b.mm);
  const minimum=pairs[0]||null;
  return {evaluatedSegments:strips.length,checkedPairs:pairs.length,minimum,pairs,
   verdict:!strips.length?'sin tramos previos representables':minimum?.mm<=EPS?'posible intersección de sólidos aproximados':minimum?.mm<nearMm?'cercanía de sólidos aproximados':'sin proximidad en sólidos aproximados examinados',
   note:'Cribado volumétrico SOLO entre prismas extruidos de chapa y herramientas genéricas con ancho ilustrativo. No calcula trayectorias, contacto real, radios CAD, reorientación ni posiciones de máquina verificadas. Un resultado separado NO acredita seguridad ni ausencia de colisiones.'};
 }
 return {flatGap,volumeGap,completedPrisms,inspect};
});
