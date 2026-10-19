/* Plegar Pro Plus v0.16: DXF ASCII 2D LINE, LWPOLYLINE, ARC y CIRCLE,
 * con arcos bulge muestreados con tolerancia nominal para PREVISUALIZAR.
 * Inspección exclusivamente: NUNCA transmite geometría al simulador/CNC. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=2*1024*1024,MAX_VERTICES=1500,MAX_GROUPS=60000,MAX_CONTOURS=100;
const CHORD_TOL=0.04; // mm; tolerancia geométrica nominal de discretización para visualización
const UNITS=Object.freeze({1:{name:'pulgadas',mm:25.4},4:{name:'milímetros',mm:1},5:{name:'centímetros',mm:10},6:{name:'metros',mm:1000}});
const err=message=>{throw new Error(message);};
function number(value,what){if(value===undefined||value===null||String(value).trim()==='')err(`${what} ausente.`);const n=Number(value);if(!Number.isFinite(n)||Math.abs(n)>1e9)err(`${what} no es un número válido.`);return n;}
function pairsOf(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)err('DXF demasiado grande: límite 2 MB.');
 if(text.includes('\0')||/^AutoCAD Binary DXF/i.test(text.slice(0,32)))err('Sólo se admiten DXF ASCII.');
 const lines=text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/);
 while(lines.length&&lines[lines.length-1].trim()==='')lines.pop();
 if(lines.length%2)err('DXF incompleto: código/valor sin pareja.');
 if(lines.length/2>MAX_GROUPS)err('Demasiados grupos DXF.');
 const pairs=[];
 for(let i=0;i<lines.length;i+=2){const code=Number(lines[i].trim());if(!Number.isInteger(code)||code<0||code>1071)err(`Código DXF inválido en línea ${i+1}.`);pairs.push({code,value:lines[i+1].trim()});}
 return pairs;
}
function segmentsIntersect(a,b,c,d){
 const orient=(u,v,w)=>(v.x-u.x)*(w.y-u.y)-(v.y-u.y)*(w.x-u.x);
 const f=orient(a,b,c),g=orient(a,b,d),h=orient(c,d,a),k=orient(c,d,b);
 const close=(p,u,v)=>Math.min(u.x,v.x)-1e-8<=p.x&&p.x<=Math.max(u.x,v.x)+1e-8&&Math.min(u.y,v.y)-1e-8<=p.y&&p.y<=Math.max(u.y,v.y)+1e-8;
 if(Math.abs(f)<1e-8&&close(c,a,b)||Math.abs(g)<1e-8&&close(d,a,b)||Math.abs(h)<1e-8&&close(a,c,d)||Math.abs(k)<1e-8&&close(b,c,d))return true;
 return (f>0)!==(g>0)&&(h>0)!==(k>0);
}
function validatePoints(points,closed){
 if(!Array.isArray(points)||points.length<(closed?3:2)||points.length>MAX_VERTICES)err('Número de vértices fuera de rango.');
 for(const p of points)if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.max(Math.abs(p.x),Math.abs(p.y))>1e6)err('Punto fuera de los límites admitidos (±1.000.000 mm).');
 const N=points.length,edges=closed?N:N-1;
 for(let i=0;i<edges;i++){
  const a=points[i],b=points[(i+1)%N];if(Math.hypot(a.x-b.x,a.y-b.y)<1e-5)err('Contorno con segmentos de longitud cero.');
 }
 for(let i=0;i<edges;i++)for(let j=i+1;j<edges;j++){
  if(j===i+1||closed&&i===0&&j===edges-1)continue;
  if(segmentsIntersect(points[i],points[(i+1)%N],points[j],points[(j+1)%N]))err('Autointersección detectada en el contorno.');
 }
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const width=maxX-minX,height=maxY-minY;
 if(width<0.001&&height<0.001)err('Perfil degenerado.');
 if(Math.max(width,height)>100000)err('Dimensión mayor de 100.000 mm: revisar unidades o escala.');
 let length=0;for(let i=0;i<edges;i++)length+=Math.hypot(points[i].x-points[(i+1)%N].x,points[i].y-points[(i+1)%N].y);
 return {width,height,minX,maxX,minY,maxY,length};
}
// Aproximación por cuerdas controlada, únicamente para visualización y cribado de dibujo.
function sampleArc(cx,cy,r,start,sweep,includeStart=true){
 if(!(r>1e-7)||!Number.isFinite(r)||r>1e7||!Number.isFinite(start)||!Number.isFinite(sweep)||Math.abs(sweep)>2*Math.PI+1e-8||Math.abs(sweep)<1e-9)err('Arco DXF con radio o barrido no válido.');
 const step=Math.min(Math.PI/18,2*Math.acos(Math.max(-1,1-Math.min(CHORD_TOL/r,1))));
 const steps=Math.max(2,Math.ceil(Math.abs(sweep)/Math.max(step,1e-7)));
 if(steps>MAX_VERTICES)err('Arco demasiado detallado para inspección (1500 puntos).');
 const pts=[];for(let i=includeStart?0:1;i<=steps;i++){const a=start+sweep*i/steps;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
 return pts;
}
function bulgeArc(a,z,bulge){
 const chord=Math.hypot(z.x-a.x,z.y-a.y);
 if(chord<1e-5)err('Arco bulge con segmento de longitud cero.');
 const sweep=4*Math.atan(bulge);
 const r=chord*(1+bulge*bulge)/(4*Math.abs(bulge));
 const dx=z.x-a.x,dy=z.y-a.y;
 const shift=(1-bulge*bulge)/(4*bulge);
 const cx=(a.x+z.x)/2-dy*shift,cy=(a.y+z.y)/2+dx*shift;
 const pts=sampleArc(cx,cy,r,Math.atan2(a.y-cy,a.x-cx),sweep);
 // Los extremos DXF son los exactos; evita desfases acumulados tras muestreo.
 pts[0]={x:a.x,y:a.y};pts[pts.length-1]={x:z.x,y:z.y};
 return {points:pts,length:Math.abs(sweep)*r,center:{x:cx,y:cy},radius:r,startAngle:Math.atan2(a.y-cy,a.x-cx),sweep};
}
function checkPlane(entity,label){
 for(const g of entity){
  if([30,31,38,39,40,41,43].includes(g.code)&&label==='LWPOLYLINE'&&Math.abs(number(g.value,'ancho/espesor/elevación'))>1e-9)err('No se admiten anchos, espesor ni elevaciones de LWPOLYLINE.');
  if([30,31,38,39].includes(g.code)&&label!=='LWPOLYLINE'&&Math.abs(number(g.value,'elevación/espesor'))>1e-9)err(label+' fuera del plano XY.');
  if(g.code===210&&Math.abs(number(g.value,'normal X'))>1e-9||g.code===220&&Math.abs(number(g.value,'normal Y'))>1e-9||g.code===230&&Math.abs(number(g.value,'normal Z')-1)>1e-9)err('DXF con plano de extrusión no compatible.');
 }
}
function readLW(entity,factor){
 const flags=entity.find(g=>g.code===70),declared=entity.find(g=>g.code===90);
 const closed=!!(flags&&(number(flags.value,'banderas')&1));
 checkPlane(entity,'LWPOLYLINE');
 const vertices=[];let vertex=null;
 for(const g of entity){
  if(g.code===10){
   if(vertex&&vertex.y===undefined)err('Vértice DXF sin coordenada Y.');
   vertex={x:number(g.value,'X')*factor,y:undefined,bulge:0};vertices.push(vertex);
  }else if(g.code===20){
   if(!vertex||vertex.y!==undefined)err('Coordenada Y sin X anterior.');
   vertex.y=number(g.value,'Y')*factor;
  }else if(g.code===42){
   if(!vertex||vertex.y===undefined)err('Curvatura bulge sin vértice XY completo.');
   vertex.bulge=number(g.value,'bulge');
   if(Math.abs(vertex.bulge)>100)err('Bulge demasiado grande para una inspección fiable.');
  }
 }
 if(!vertices.length||vertices.some(v=>v.y===undefined))err('LWPOLYLINE con coordenadas incompletas.');
 if(declared&&number(declared.value,'cantidad de vértices')!==vertices.length)err('El número de vértices no coincide.');
 if(vertices.length>MAX_VERTICES)err('Demasiados vértices para previsualizar.');
 // En muchos DXF, una polilínea cerrada repite el origen como último vértice.
 if(closed&&vertices.length>3&&Math.hypot(vertices[0].x-vertices.at(-1).x,vertices[0].y-vertices.at(-1).y)<1e-5){
  if(Math.abs(vertices.at(-1).bulge)>1e-9)err('Bulge no válido en vértice duplicado de cierre.');
  vertices.pop();
 }
 if(!closed&&Math.abs(vertices.at(-1).bulge)>1e-9)err('Bulge en último vértice de un contorno abierto: no hay segmento siguiente.');
 const points=[],primitives=[],count=closed?vertices.length:vertices.length-1;let length=0,arcCount=0;
 for(let i=0;i<count;i++){
  const a=vertices[i],z=vertices[(i+1)%vertices.length],bulge=a.bulge;
  if(Math.hypot(z.x-a.x,z.y-a.y)<1e-5)err('Contorno con segmentos de longitud cero.');
  if(!points.length)points.push({x:a.x,y:a.y});
  if(Math.abs(bulge)>1e-9){
   const arc=bulgeArc(a,z,bulge);length+=arc.length;arcCount++;
   primitives.push({kind:'ARC',start:{x:a.x,y:a.y},end:{x:z.x,y:z.y},center:arc.center,radius:arc.radius,startAngle:arc.startAngle,sweep:arc.sweep});
   points.push(...arc.points.slice(1));
  }else{primitives.push({kind:'LINE',start:{x:a.x,y:a.y},end:{x:z.x,y:z.y}});points.push({x:z.x,y:z.y});length+=Math.hypot(z.x-a.x,z.y-a.y);}
  if(points.length>MAX_VERTICES+1)err('Arcos con demasiados puntos: límite de 1500 por archivo.');
 }
 if(closed)points.pop(); // último punto coincide con primero
 return {points,primitives,closed,exactLength:length,arcCount,sourceVertices:vertices.length};
}
function readCircleOrArc(entity,factor,kind){
 const one=code=>entity.find(g=>g.code===code)?.value;
 checkPlane(entity,kind);
 const cx=number(one(10),'centro X')*factor,cy=number(one(20),'centro Y')*factor,r=number(one(40),'radio')*factor;
 const closed=kind==='CIRCLE';
 const start=closed?0:number(one(50),'ángulo inicial')*Math.PI/180;
 const end=closed?360:number(one(51),'ángulo final');
 if(!closed&&(!Number.isFinite(end)||end<0||end>360||start<0||start>=2*Math.PI))err('Ángulo de ARC fuera de 0°–360°.');
 const sweep=closed?2*Math.PI:((end* Math.PI/180-start+2*Math.PI)%(2*Math.PI));
 if(!closed&&sweep<1e-8)err('ARC de barrido nulo o completo no admitido: usa CIRCLE.');
 const points=sampleArc(cx,cy,r,start,sweep);
 if(closed)points.pop();
 return {points,primitives:[{kind:closed?'CIRCLE':'ARC',start:{x:cx+r*Math.cos(start),y:cy+r*Math.sin(start)},end:{x:cx+r*Math.cos(start+sweep),y:cy+r*Math.sin(start+sweep)},center:{x:cx,y:cy},radius:r,startAngle:start,sweep}],closed,exactLength:r*sweep,arcCount:1,sourceVertices:closed?1:2};
}
function readLine(entity,factor){
 const one=code=>entity.find(g=>g.code===code)?.value;
 if(entity.some(g=>(g.code===30||g.code===31||g.code===39||g.code===38)&&Math.abs(number(g.value,'elevación/espesor'))>1e-9))err('LINE con elevación o espesor: se admite únicamente geometría 2D.');
 if(entity.some(g=>g.code===210&&Math.abs(number(g.value,'normal X'))>1e-9||g.code===220&&Math.abs(number(g.value,'normal Y'))>1e-9||g.code===230&&Math.abs(number(g.value,'normal Z')-1)>1e-9))err('LINE en plano de extrusión no compatible.');
 const points=[{x:number(one(10),'inicio X')*factor,y:number(one(20),'inicio Y')*factor},{x:number(one(11),'fin X')*factor,y:number(one(21),'fin Y')*factor}];
 return {points,primitives:[{kind:'LINE',start:points[0],end:points[1]}],closed:false};
}
function layerOf(entity){
 const raw=entity.find(g=>g.code===8)?.value||'0';
 if(raw.length>120||/[\x00-\x1f]/.test(raw))err('Nombre de capa DXF inválido.');
 return raw;
}
// Bounding box analítica de segmentos rectos y arcos circulares del DXF.
// El muestreo sigue siendo para la vista previa y no valida sólidos CAD.
function analyticBounds(primitives){
 const values=[];const TAU=2*Math.PI;
 const inSweep=(angle,start,sweep)=>{
  if(Math.abs(sweep)>=TAU-1e-10)return true;
  const positive=x=>((x%TAU)+TAU)%TAU;
  return sweep>=0?positive(angle-start)<=sweep+1e-10:positive(start-angle)<=-sweep+1e-10;
 };
 for(const part of primitives){
  values.push(part.start,part.end);
  if(part.kind==='ARC'||part.kind==='CIRCLE'){
   for(const a of [0,Math.PI/2,Math.PI,3*Math.PI/2])if(inSweep(a,part.startAngle,part.sweep)){
    values.push({x:part.center.x+part.radius*Math.cos(a),y:part.center.y+part.radius*Math.sin(a)});
   }
  }
 }
 const xs=values.map(p=>p.x),ys=values.map(p=>p.y);
 return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}
function parseDocument(text,{unitsOverride=null}={}){
 const pairs=pairsOf(text);let section=null,unitCode=null,readUnits=false,hasEntities=false;
 const geometries=[],unsupported=new Set();
 for(let i=0;i<pairs.length;){const p=pairs[i];
  if(p.code===0&&p.value.toUpperCase()==='SECTION'){
   if(pairs[i+1]?.code!==2)err('Sección DXF inválida.');section=pairs[i+1].value.toUpperCase();if(section==='ENTITIES')hasEntities=true;i+=2;continue;
  }
  if(p.code===0&&(p.value.toUpperCase()==='ENDSEC'||p.value.toUpperCase()==='EOF')){section=null;i++;continue;}
  if(section==='HEADER'){
   if(p.code===9){readUnits=p.value==='$INSUNITS';i++;continue;}
   if(readUnits&&p.code===70){unitCode=number(p.value,'$INSUNITS');readUnits=false;}
   i++;continue;
  }
  if(section==='ENTITIES'&&p.code===0){
   const kind=p.value.toUpperCase(),entity=[];i++;
   while(i<pairs.length&&pairs[i].code!==0){entity.push(pairs[i]);i++;}
   if(['LWPOLYLINE','LINE','ARC','CIRCLE'].includes(kind)){
    if(geometries.length>=MAX_CONTOURS)err('Demasiadas entidades: máximo 100 contornos/líneas.');
    if(entity.some(g=>g.code===67&&number(g.value,'espacio')!==0))err('No se admiten entidades de espacio papel.');
    geometries.push({kind,entity});
   }else if(kind!=='ENDSEC'&&kind!=='EOF')unsupported.add(kind);
   continue;
  }
  i++;
 }
 if(!hasEntities)err('No existe sección ENTITIES válida.');
 if(unsupported.size)err(`Entidades no admitidas: ${[...unsupported].slice(0,5).join(', ')}. Exporta LINE, LWPOLYLINE, ARC o CIRCLE 2D sin INSERT ni bloques.`);
 if(!geometries.length)err('No se encontraron entidades LINE/LWPOLYLINE/ARC/CIRCLE 2D.');
 if(![null,1,4,5,6].includes(unitsOverride)||unitsOverride!==null&&!UNITS[unitsOverride])err('Unidades manuales no admitidas.');
 const unit=unitsOverride??unitCode;
 if(!UNITS[unit])err('DXF sin $INSUNITS compatible. Indica manualmente las unidades antes de importar.');
 const contours=[];let count=0;
 for(let i=0;i<geometries.length;i++){
  const g=geometries[i],scale=UNITS[unit].mm,s=g.kind==='LINE'?readLine(g.entity,scale):g.kind==='LWPOLYLINE'?readLW(g.entity,scale):readCircleOrArc(g.entity,scale,g.kind);
  count+=s.points.length;if(count>MAX_VERTICES)err('Demasiados vértices en total: máximo 1500.');
  const bounds=validatePoints(s.points,s.closed),layer=layerOf(g.entity);
  if(s.exactLength!==undefined)bounds.length=s.exactLength;
  if(s.primitives?.some(p=>p.kind!=='LINE')){
   const exact=analyticBounds(s.primitives);
   Object.assign(bounds,exact,{width:exact.maxX-exact.minX,height:exact.maxY-exact.minY});
  }
  contours.push(Object.freeze({...s,bounds,layer,kind:g.kind,index:i,id:`contorno-${i+1}`,verified:false,activeInSimulation:false}));
 }
 const minX=Math.min(...contours.map(s=>s.bounds.minX)),maxX=Math.max(...contours.map(s=>s.bounds.maxX));
 const minY=Math.min(...contours.map(s=>s.bounds.minY)),maxY=Math.max(...contours.map(s=>s.bounds.maxY));
 const bounds={minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY,length:contours.reduce((n,s)=>n+s.bounds.length,0)};
 if(Math.max(bounds.width,bounds.height)>100000)err('Extensión total mayor de 100.000 mm. Revisa escala y unidades.');
 return Object.freeze({format:'ASCII DXF',units:UNITS[unit].name,unitCode:unit,assumedUnits:unitsOverride!==null,
  contours,layers:[...new Set(contours.map(s=>s.layer))],bounds,points:count,verified:false,activeInSimulation:false,
  status:'SOLO INSPECCIÓN — SIN VALIDAR',warnings:['Los arcos se discretizan únicamente para la vista previa; las longitudes de arco se calculan analíticamente.','Los contornos y capas no se convierten en sólidos CAD.','Líneas independientes no se conectan ni se cierran automáticamente.','Las coincidencias dimensionales no acreditan la identidad ni el montaje del útil.']});
}
function parse(text,options={}){
 const doc=parseDocument(text,options);
 if(doc.contours.length!==1)err(`Se requiere exactamente una entidad de perfil 2D para el modo legado; encontradas: ${doc.contours.length}. Utiliza parseDocument para varios contornos.`);
 const shape=doc.contours[0];
 return Object.freeze({format:doc.format,units:doc.units,unitCode:doc.unitCode,assumedUnits:doc.assumedUnits,
  points:shape.points,closed:shape.closed,bounds:shape.bounds,status:doc.status,verified:false,activeInSimulation:false,
  warnings:['Perfil plano con líneas y/o arcos discretizados para inspección.','No se verifican amarre, tolerancias, orientación, fabricante ni colisiones.','No se ha añadido la geometría al simulador ni al cálculo CNC.']});
}
function compareBounds(profile,reference,{tolerance=0.5}={}){
 if(!profile||!reference||!Number.isFinite(tolerance)||tolerance<0||tolerance>10)err('Datos de comparación no válidos.');
 if(!Number.isFinite(reference.height)||reference.height<=0)err('Referencia sin altura dimensional.');
 const a=profile.bounds.width,b=profile.bounds.height,nom=reference.height;
 const deviations=[{orientation:'altura Y',delta:Math.abs(b-nom)},{orientation:'altura X',delta:Math.abs(a-nom)}];
 deviations.sort((x,y)=>x.delta-y.delta);
 const main=deviations[0];
 let widthDelta=null,widthMatch=null;
 if(Number.isFinite(reference.width)&&reference.width>0){
  const other=main.orientation==='altura Y'?a:b;
  widthDelta=Math.abs(other-reference.width);widthMatch=widthDelta<=tolerance;
 }
 return {heightDelta:main.delta,widthDelta,heightMatch:main.delta<=tolerance,widthMatch,orientation:main.orientation,tolerance,verified:false,warning:'Coincidencia dimensional ORIENTATIVA: no demuestra identidad del útil, geometría completa, montaje ni seguridad.'};
}
function report(doc,{fileName='archivo.dxf'}={}){
 if(!doc||!Array.isArray(doc.contours)||doc.verified!==false)err('Documento de inspección inválido.');
 if(typeof fileName!=='string'||fileName.length>128)err('Nombre del DXF no válido.');
 const bounds=b=>({ancho_mm:b.width,alto_mm:b.height,longitud_mm:b.length,min_x_mm:b.minX,max_x_mm:b.maxX,min_y_mm:b.minY,max_y_mm:b.maxY});
 return {software:'Plegar Pro Plus',version:'0.16',tipo:'INFORME ORIENTATIVO - NO VÁLIDO PARA FABRICACIÓN',archivo:fileName,
  generado_utc:new Date().toISOString(),formato:doc.format,unidades_originales:doc.units,unidades_asumidas:doc.assumedUnits,
  verificado:false,utilizable_cnc:false,activado_en_simulacion:false,tolerancia_visual_arcos_mm:CHORD_TOL,
  total_entidades:doc.contours.length,capas:doc.layers.slice(),medidas_generales:bounds(doc.bounds),
  elementos:doc.contours.map(c=>({numero:c.index+1,capa:c.layer,tipo:c.kind,cerrado:c.closed,
   arcos:c.arcCount||0,vertices_originales:c.sourceVertices??c.points.length,puntos_visualizacion:c.points.length,medidas:bounds(c.bounds)})),
  advertencias:['Las medidas se obtienen de geometría DXF declarada, no de una medición física.',
  'La visualización curva usa segmentos aproximados. No se han verificado tolerancias, referencia de fabricante, amarres ni colisiones.',
  'No se ha modificado ninguna herramienta activa ni generado un programa CNC.']};
}
function reportCSV(r){
 if(!r||!Array.isArray(r.elementos)||r.verificado!==false)err('Informe no válido.');
 const safe=value=>{
  const s=String(value??'');
  const neutral=/^[\s]*[=+@\-]/.test(s)?"'"+s:s;
  return '"'+neutral.replaceAll('"','""')+'"';
 };
 const rows=[['INFORME ORIENTATIVO — SIN VERIFICAR','Plegar Pro Plus v0.16'],
 ['Archivo',r.archivo],['Unidades originales',r.unidades_originales],['Uso CNC','PROHIBIDO'],
 ['Nº','Capa','Entidad','Cerrado','Arcos','Ancho mm','Alto mm','Longitud mm','Vertices originales']];
 for(const c of r.elementos)rows.push([c.numero,c.capa,c.tipo,c.cerrado,c.arcos,c.medidas.ancho_mm,c.medidas.alto_mm,c.medidas.longitud_mm,c.vertices_originales]);
 return '\uFEFF'+rows.map(row=>row.map(safe).join(';')).join('\r\n')+'\r\n';
}
return {parse,parseDocument,compareBounds,validatePoints,report,reportCSV,MAX_BYTES,MAX_CONTOURS,CHORD_TOL};
});
