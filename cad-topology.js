/* Plegar Pro Plus v0.20 — auditoría topológica orientativa de contornos DXF.
 * SOLO LECTURA: no cierra polilíneas, no une LINE y no crea sólidos ni amarres.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadTopology=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_PAIRS=10000;
function assert(test,message){if(!test)throw new Error(message);}
function close(a,b,t){return Math.hypot(a.x-b.x,a.y-b.y)<=t;}
function signedArea(points){let n=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];n+=a.x*b.y-b.x*a.y;}return n/2;}
function distancePointSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy;if(!d)return Math.hypot(p.x-a.x,p.y-a.y);const u=Math.min(1,Math.max(0,((p.x-a.x)*dx+(p.y-a.y)*dy)/d));return Math.hypot(p.x-a.x-u*dx,p.y-a.y-u*dy);}
function pointInRing(point,points,eps){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
 const a=points[i],b=points[j];if(distancePointSegment(point,a,b)<=eps)return 0;
 if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }return inside?1:-1;}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function segmentsTouch(a,b,c,d,eps){
 const x=Math.max(Math.abs(a.x),Math.abs(b.x),Math.abs(c.x),Math.abs(d.x),1);
 const y=Math.max(Math.abs(a.y),Math.abs(b.y),Math.abs(c.y),Math.abs(d.y),1);
 const z=eps*Math.max(x,y);
 const e1=cross(a,b,c),e2=cross(a,b,d),e3=cross(c,d,a),e4=cross(c,d,b);
 const box=(p,u,v)=>p.x>=Math.min(u.x,v.x)-eps&&p.x<=Math.max(u.x,v.x)+eps&&p.y>=Math.min(u.y,v.y)-eps&&p.y<=Math.max(u.y,v.y)+eps;
 if((Math.abs(e1)<=z&&box(c,a,b))||(Math.abs(e2)<=z&&box(d,a,b))||(Math.abs(e3)<=z&&box(a,c,d))||(Math.abs(e4)<=z&&box(b,c,d)))return true;
 return (e1>0)!==(e2>0)&&(e3>0)!==(e4>0);
}
function boundariesIntersect(a,b,eps,budget){const as=a.points,bs=b.points;
 for(let i=0;i<as.length;i++)for(let j=0;j<bs.length;j++){
  if(++budget.count>MAX_PAIRS)return null;
  if(segmentsTouch(as[i],as[(i+1)%as.length],bs[j],bs[(j+1)%bs.length],eps))return true;
 }
 return false;
}
function inspect(document,{joinTolerance=0.05,sameLayer=true}={}){
 assert(document?.verified===false&&document?.activeInSimulation===false&&Array.isArray(document.contours),'Solo se admite un DXF de inspección no verificado.');
 assert(typeof sameLayer==='boolean','Filtro de capa no válido.');
 assert(typeof joinTolerance==='number'&&Number.isFinite(joinTolerance)&&joinTolerance>=0&&joinTolerance<=1,'Tolerancia de extremos fuera del intervalo 0–1 mm.');
 assert(document.contours.length<=100,'Demasiados contornos para la inspección.');
 const contours=document.contours;
 for(const c of contours)assert(c&&c.verified===false&&c.activeInSimulation===false&&Array.isArray(c.points)&&c.points.length>=2&&c.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'Contorno inválido o activo en simulación.');
 const closed=contours.filter(c=>c.closed===true),open=contours.filter(c=>c.closed!==true);
 const rings=closed.map(c=>({index:c.index,layer:c.layer,area_mm2:Math.abs(signedArea(c.points)),winding:signedArea(c.points)<0?'horario':'antihorario',enclosedBy:[],encloses:[],relation:'no evaluada'}));
 const candidates=[];const endpoints=open.flatMap(c=>[{index:c.index,layer:c.layer,which:'inicio',point:c.points[0]},{index:c.index,layer:c.layer,which:'fin',point:c.points[c.points.length-1]}]);
 for(let i=0;i<endpoints.length;i++)for(let j=i+1;j<endpoints.length;j++){
  const a=endpoints[i],b=endpoints[j];if(a.index===b.index||(sameLayer&&a.layer!==b.layer))continue;
  const mm=Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
  if(mm<=joinTolerance)candidates.push({a:{contour:a.index,extreme:a.which,layer:a.layer},b:{contour:b.index,extreme:b.which,layer:b.layer},gap_mm:mm});
 }
 const nesting=[];const uncertain=[];const budget={count:0};
 for(let i=0;i<closed.length;i++)for(let j=i+1;j<closed.length;j++){
  const a=closed[i],b=closed[j];
  const separated=a.bounds.maxX<b.bounds.minX||b.bounds.maxX<a.bounds.minX||a.bounds.maxY<b.bounds.minY||b.bounds.maxY<a.bounds.minY;
  if(separated)continue;
  const crossed=boundariesIntersect(a,b,1e-7,budget);
  if(crossed!==false){uncertain.push({a:a.index,b:b.index,reason:crossed===null?'Límite de comparaciones alcanzado':'Bordes cruzados o tangentes'});continue;}
  const bInside=pointInRing(b.points[0],a.points,1e-7),aInside=pointInRing(a.points[0],b.points,1e-7);
  if(bInside===1){nesting.push({outer:a.index,inner:b.index});rings[i].encloses.push(b.index);rings[j].enclosedBy.push(a.index);}
  else if(aInside===1){nesting.push({outer:b.index,inner:a.index});rings[j].encloses.push(a.index);rings[i].enclosedBy.push(b.index);}
  else if(bInside===0||aInside===0)uncertain.push({a:a.index,b:b.index,reason:'Límites demasiado próximos para clasificar'});
 }
 for(const r of rings)r.relation=r.enclosedBy.length?'contenido (posible hueco no validado)':r.encloses.length?'contiene perfiles interiores':'independiente';
 const warnings=['Los extremos próximos se señalan, pero NO se unen, cierran ni ajustan automáticamente.',
  'Un contorno dentro de otro NO acredita un hueco, la intención de corte ni un sólido CAD.',
  'Análisis 2D sobre curvas discretizadas, sin verificación de tolerancias, amarre o máquina.'];
 if(open.length)warnings.push(`${open.length} contorno(s) abierto(s): geometría incompleta para construir sólido.`);
 if(uncertain.length)warnings.push(`${uncertain.length} relación(es) entre contornos sin clasificación fiable.`);
 return {version:'0.20',type:'AUDITORÍA TOPOLÓGICA ORIENTATIVA',verified:false,approvedForSimulation:false,approvedForCNC:false,
  joinTolerance_mm:joinTolerance,sameLayer,summary:{entities:contours.length,closed:closed.length,open:open.length,endpointMatches:candidates.length,nested:nesting.length,uncertain:uncertain.length},
  endpointCandidates:candidates.slice(0,75),nestedContours:nesting,rings,ambiguousRelations:uncertain.slice(0,75),warnings};
}
function mountingMarks(oriented,{datum='inferior',offset=0}={}){
 assert(oriented?.verified===false&&oriented?.activeInSimulation===false,'Solo se admiten referencias de inspección orientadas.');
 assert(['inferior','superior'].includes(datum),'Referencia superior/inferior no válida.');
 assert(typeof offset==='number'&&Number.isFinite(offset)&&Math.abs(offset)<=500,'Desplazamiento de referencia no válido.');
 const b=oriented.bounds;assert(b&&['minX','maxX','minY','maxY'].every(k=>Number.isFinite(b[k])),'Envolvente orientada incompleta.');
 const y=(datum==='inferior'?b.minY:b.maxY)+offset;
 return {type:'PUNTOS NOMINALES DE INSPECCIÓN; NO SON AMARRES REALES',verified:false,approvedForCNC:false,
  datum,offset_mm:offset,distance_mm:b.maxX-b.minX,
  marks:[{id:'A',x_mm:b.minX,y_mm:y},{id:'B',x_mm:b.maxX,y_mm:y}],
  warning:'Extremos de la envolvente DXF, no puntos de fijación, apoyo o contacto verificados.'};
}
return {inspect,mountingMarks};
});
