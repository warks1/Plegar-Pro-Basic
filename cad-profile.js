/* Plegar Pro Plus v0.14: importación restringida de contornos ASCII DXF 2D.
 * Sólo INSPECCIÓN, nunca activa una geometría de máquina ni marca CAD verificado.
 * No soporta splines, bulges/arcos, polilíneas 3D ni contornos múltiples.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=2*1024*1024,MAX_VERTICES=1500,MAX_GROUPS=60000;
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
function readLW(entity,factor){
 const vertices=[],flags=entity.find(g=>g.code===70),declared=entity.find(g=>g.code===90);
 const closed=!!(flags&&(number(flags.value,'banderas')&1));
 const xVals=entity.filter(g=>g.code===10),yVals=entity.filter(g=>g.code===20);
 if(xVals.length!==yVals.length||!xVals.length)err('LWPOLYLINE con coordenadas incompletas.');
 let waitingY=false;for(const g of entity){if(g.code===10){if(waitingY)err('Vértice DXF sin coordenada Y.');waitingY=true;}else if(g.code===20){if(!waitingY)err('Coordenada Y sin X anterior.');waitingY=false;}}if(waitingY)err('Último vértice sin Y.');
 if(declared&&number(declared.value,'cantidad de vértices')!==xVals.length)err('El número de vértices no coincide.');
 for(const g of entity){
  if((g.code===42||[39,40,41,43,38,30].includes(g.code))&&Math.abs(number(g.value,'curvatura/espesor/elevación'))>1e-9)err('No se admiten bulges, anchos ni elevaciones. Exporta un contorno plano de líneas rectas.');
  if(g.code===210&&Math.abs(number(g.value,'normal X'))>1e-9||g.code===220&&Math.abs(number(g.value,'normal Y'))>1e-9||g.code===230&&Math.abs(number(g.value,'normal Z')-1)>1e-9)err('DXF con plano de extrusión no compatible.');
 }
 if(xVals.length>MAX_VERTICES)err('Demasiados vértices para previsualizar.');
 for(let i=0;i<xVals.length;i++)vertices.push({x:number(xVals[i].value,'X')*factor,y:number(yVals[i].value,'Y')*factor});
 // Algunos CAD repiten el primer punto en las polilíneas cerradas.
 if(closed&&vertices.length>3&&Math.hypot(vertices[0].x-vertices.at(-1).x,vertices[0].y-vertices.at(-1).y)<1e-5)vertices.pop();
 return {points:vertices,closed};
}
function parse(text,{unitsOverride=null}={}){
 const pairs=pairsOf(text);let section=null,unitCode=null,readUnits=false;
 const geometries=[],unsupported=new Set();
 for(let i=0;i<pairs.length;){const p=pairs[i];
  if(p.code===0&&p.value.toUpperCase()==='SECTION'){
   if(pairs[i+1]?.code!==2)err('Sección DXF inválida.');section=pairs[i+1].value.toUpperCase();i+=2;continue;
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
   if(kind==='LWPOLYLINE')geometries.push({kind,entity});
   else if(kind!=='ENDSEC'&&kind!=='EOF')unsupported.add(kind);
   continue;
  }
  i++;
 }
 if(unsupported.size)err(`Entidades no admitidas: ${[...unsupported].slice(0,5).join(', ')}. Exporta una sola LWPOLYLINE 2D sin arcos.`);
 if(geometries.length!==1)err(`Se requiere exactamente una LWPOLYLINE 2D; encontradas: ${geometries.length}.`);
 if(![null,1,4,5,6].includes(unitsOverride)||unitsOverride!==null&&!UNITS[unitsOverride])err('Unidades manuales no admitidas.');
 const unit=unitsOverride??unitCode;
 if(!UNITS[unit])err('DXF sin $INSUNITS compatible. Indica manualmente las unidades antes de importar.');
 const shape=readLW(geometries[0].entity,UNITS[unit].mm);
 const bounds=validatePoints(shape.points,shape.closed);
 return Object.freeze({format:'ASCII DXF',units:UNITS[unit].name,unitCode:unit,assumedUnits:unitsOverride!==null,points:shape.points,closed:shape.closed,bounds,status:'SOLO INSPECCIÓN — SIN VALIDAR',verified:false,activeInSimulation:false,warnings:['Perfil plano formado por segmentos rectos.','No se verifican amarre, tolerancias, orientación, fabricante ni colisiones.','No se ha añadido la geometría al simulador ni al cálculo CNC.']});
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
return {parse,compareBounds,validatePoints,MAX_BYTES};
});
