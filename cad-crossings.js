/* Plegar Pro Plus v0.22 — cribado topológico de cruces DXF (SOLO INSPECCIÓN).
 * Segmentos ARC/CIRCLE/bulge son cuerdas discretizadas por el importador: los resultados
 * son aproximados. No modifica el documento ni certifica sólidos, colisiones o CNC.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadCrossings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_SEGMENTS=1600, MAX_PAIRS=60000, MAX_EXAMPLES=80, EPS=1e-8;
function check(ok,msg){if(!ok)throw new Error(msg);}
function sub(a,b){return {x:a.x-b.x,y:a.y-b.y};}
function cross(a,b){return a.x*b.y-a.y*b.x;}
function dot(a,b){return a.x*b.x+a.y*b.y;}
function length(a){return Math.hypot(a.x,a.y);}
function clamp(x){return Math.max(0,Math.min(1,x));}
function pointGap(p,a,b){const v=sub(b,a),len2=dot(v,v),t=len2?clamp(dot(sub(p,a),v)/len2):0;return {gap:Math.hypot(p.x-a.x-t*v.x,p.y-a.y-t*v.y),t};}
function minGap(a,b,c,d){return Math.min(pointGap(a,c,d).gap,pointGap(b,c,d).gap,pointGap(c,a,b).gap,pointGap(d,a,b).gap);}
function segmentsFrom(document){const items=[];for(const c of document.contours){
 check(c&&c.verified===false&&c.activeInSimulation===false&&Number.isInteger(c.index)&&Array.isArray(c.points)&&c.points.length>=2,'Contorno DXF no verificado inválido.');
 check(c.points.length<=1600&&c.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)),'Coordenadas DXF inválidas.');
 const n=c.points.length,closed=c.closed===true,duplicate=closed&&length(sub(c.points[n-1],c.points[0]))<=EPS;
 const segments=(n-1)+(closed&&!duplicate?1:0);
 for(let i=0;i<segments;i++){
  const a=c.points[i],b=c.points[(i+1)%n],m=length(sub(a,b));
  check(m>EPS,'Contorno DXF con segmento degenerado.');
  items.push({contour:c.index,layer:String(c.layer||'0'),segment:i,segmentCount:segments,closed,a,b,
   minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minY:Math.min(a.y,b.y),maxY:Math.max(a.y,b.y)});
  check(items.length<=MAX_SEGMENTS,'El DXF supera el límite de 1600 segmentos para esta auditoría.');
 }
}return items;}
function adjacent(a,b){if(a.contour!==b.contour)return false;
 return Math.abs(a.segment-b.segment)===1||(a.closed&&b.closed&&Math.min(a.segment,b.segment)===0&&Math.max(a.segment,b.segment)===a.segmentCount-1);
}
function intersection(a,b,tol){const A=a.a,B=a.b,C=b.a,D=b.b,r=sub(B,A),s=sub(D,C),w=sub(C,A),den=cross(r,s),l1=length(r),l2=length(s);
 const parallel=Math.abs(den)<=EPS*l1*l2;
 if(parallel){const collinear=Math.abs(cross(w,r))/l1<=EPS&&Math.abs(cross(w,s))/l2<=EPS;
  if(collinear){const u=dot(w,r)/(l1*l1),v=dot(sub(D,A),r)/(l1*l1),overlap=Math.min(1,Math.max(u,v))-Math.max(0,Math.min(u,v));
   if(overlap*l1>EPS)return {kind:'solape',gap_mm:0};
   if(minGap(A,B,C,D)<=EPS)return null; // Coincidencia exacta de extremos: pertenece al grafo de cadenas.
  }
 }else{
  const t=cross(w,s)/den,u=cross(w,r)/den;
  if(t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS){
   const insideA=t>EPS&&t<1-EPS,insideB=u>EPS&&u<1-EPS;
   if(insideA&&insideB)return {kind:'cruce',gap_mm:0};
   if(insideA||insideB)return {kind:'unión T',gap_mm:0};
   return null; // Extremos coincidentes: competencia del grafo de v0.21.
  }
 }
 const gap=minGap(A,B,C,D);
 if(tol>0&&gap<=tol)return {kind:'proximidad',gap_mm:gap};
 return null;
}
function inspect(document,{joinTolerance=0.05,sameLayer=true}={}){
 check(document?.verified===false&&document?.activeInSimulation===false&&Array.isArray(document.contours),'Solo se admite un DXF de inspección no verificado.');
 check(typeof joinTolerance==='number'&&Number.isFinite(joinTolerance)&&joinTolerance>=0&&joinTolerance<=1,'Tolerancia de inspección fuera del intervalo 0–1 mm.');
 check(typeof sameLayer==='boolean','Filtro de capas inválido.');
 check(document.contours.length<=100,'Número de contornos superior al límite.');
 const segments=segmentsFrom(document),counts={cruce:0,'unión T':0,solape:0,proximidad:0},cases=[];
 let pairs=0,limited=false;
 outer:for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const a=segments[i],b=segments[j];if(sameLayer&&a.layer!==b.layer||adjacent(a,b))continue;
  if(++pairs>MAX_PAIRS){limited=true;break outer;}
  if(a.maxX+joinTolerance<b.minX||b.maxX+joinTolerance<a.minX||a.maxY+joinTolerance<b.minY||b.maxY+joinTolerance<a.minY)continue;
  const info=intersection(a,b,joinTolerance);if(!info)continue;
  counts[info.kind]++;
  if(cases.length<MAX_EXAMPLES)cases.push({type:info.kind,a:{contour:a.contour,segment:a.segment,layer:a.layer},b:{contour:b.contour,segment:b.segment,layer:b.layer},gap_mm:Number(info.gap_mm.toFixed(8))});
 }
 const intersections=counts.cruce+counts['unión T']+counts.solape;
 const issues=[];
 if(intersections)issues.push('Cruces, uniones T o solapes geométricos requieren revisión CAD.');
 if(counts.proximidad)issues.push('Proximidades dentro de la tolerancia no demuestran continuidad geométrica.');
 if(limited)issues.push('Análisis parcial: límite de comparaciones alcanzado; no se ha evaluado el resto.');
 const warnings=['Los arcos y círculos se evalúan mediante segmentos muestreados: NO son intersecciones CAD exactas.',
 'La detección de cruces no cierra cadenas ni valida agujeros, útiles, amarres o cuerpos sólidos.',
 'SIN VERIFICAR / NO CNC / NO SIMULACIÓN INDUSTRIAL.',...issues];
 return {version:'0.22',type:'AUDITORÍA DE CRUCES Y CONTINUIDAD (APROXIMADA)',verified:false,approvedForCNC:false,approvedForSimulation:false,
  geometryModified:false,complete:!limited,joinTolerance_mm:joinTolerance,sameLayer,
  summary:{contours:document.contours.length,segments:segments.length,checkedPairs:Math.min(pairs,MAX_PAIRS),crossings:counts.cruce,tJunctions:counts['unión T'],overlaps:counts.solape,nearGaps:counts.proximidad,limited},
  examples:cases,openIssues:issues,readiness:{status:'NO HABILITADO',canUseCNC:false,canUseSimulation:false,canGenerateSolid:false},warnings};
}
return {inspect};
});
