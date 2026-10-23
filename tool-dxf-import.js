/* Perfil propio de utillaje a partir de DXF ASCII LWPOLYLINE cerrada.
 * Un DXF importado NO es automáticamente un utillaje certificado y NO alimenta
 * el motor de colisiones: requiere amarre, alturas, capacidades y montaje reales.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolDXF=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const KEY='plegarpro-tool-dxf-v1',MAX_FILES=40,MAX_SIZE=750000,MAX_POINTS=400;
 const BRANDS=['MECOS','Bystronic','AMADA','EUROSTAMP','Otra / sin identificar'];
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const area=p=>p.reduce((a,q,i)=>{const r=p[(i+1)%p.length];return a+q.x*r.y-r.x*q.y;},0)/2;
 const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
 function isIntersect(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);
  // Tratar solapamientos colineales y contacto entre lados no adyacentes como invalidación.
  const eps=1e-8;
  if(Math.abs(ab1)<eps&&Math.abs(ab2)<eps&&Math.abs(cd1)<eps&&Math.abs(cd2)<eps){
   const overlap=(a,b,c,d)=>Math.max(Math.min(a,b),Math.min(c,d))<=Math.min(Math.max(a,b),Math.max(c,d))+eps;
   return overlap(a.x,b.x,c.x,d.x)&&overlap(a.y,b.y,c.y,d.y);
  }
  return ab1*ab2<=eps&&cd1*cd2<=eps;
 }
 function validatePoints(points){
  if(!Array.isArray(points)||points.length<3||points.length>MAX_POINTS)throw Error('Contorno: entre 3 y '+MAX_POINTS+' vértices.');
  const p=points.map(a=>{
   const x=Number(a.x),y=Number(a.y);
   if(!finite(x)||!finite(y)||Math.abs(x)>100000||Math.abs(y)>100000)throw Error('Coordenada DXF inválida o fuera de rango.');
   return {x,y};
  });
  if(dist2(p[0],p[p.length-1])<1e-10)p.pop();
  if(p.length<3)throw Error('No hay tres vértices distintos.');
  for(let i=0;i<p.length;i++)if(dist2(p[i],p[(i+1)%p.length])<1e-10)throw Error('Contorno con segmento de longitud cero.');
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
   if(j===i+1||(i===0&&j===p.length-1))continue;
   if(isIntersect(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))
    throw Error('Contorno autointersecado: comprueba o repara el perfil CAD.');
  }
  if(Math.abs(area(p))<1e-7)throw Error('Contorno de área nula.');
  const minX=Math.min(...p.map(q=>q.x)),maxX=Math.max(...p.map(q=>q.x));
  const minY=Math.min(...p.map(q=>q.y)),maxY=Math.max(...p.map(q=>q.y));
  if(maxX-minX<.001||maxY-minY<.001)throw Error('Dimensión de perfil inferior a 0,001 mm.');
  return {points:p,bounds:{minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY},areaMm2:Math.abs(area(p))};
 }
 // Separar material y huecos sin inventar sólidos CAD. Se admiten un
 // perímetro exterior y como máximo 8 cavidades de perfil, sin islas anidadas.
 const MAX_CONTOURS=9;
 function insideStrict(point,poly){
  let hits=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j],cross=(point.x-a.x)*(b.y-a.y)-(point.y-a.y)*(b.x-a.x);
   if(Math.abs(cross)<1e-8&&point.x>=Math.min(a.x,b.x)-1e-8&&
     point.x<=Math.max(a.x,b.x)+1e-8&&point.y>=Math.min(a.y,b.y)-1e-8&&
     point.y<=Math.max(a.y,b.y)+1e-8)return false;
   if((a.y>point.y)!==(b.y>point.y)){
    const x=a.x+(point.y-a.y)*(b.x-a.x)/(b.y-a.y);
    if(point.x<x)hits=!hits;
   }
  }
  return hits;
 }
 function contoursCross(a,b){
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)
   if(isIntersect(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
  return false;
 }
 function validateGeometry(outside,holes=[]){
  if(!Array.isArray(holes)||holes.length>=MAX_CONTOURS)
   throw Error('Máximo de 8 huecos por sección de utillaje.');
  const outer=validatePoints(outside),cavities=holes.map(validatePoints);
  if(outer.points.length+cavities.reduce((sum,h)=>sum+h.points.length,0)>MAX_POINTS)
   throw Error('La sección DXF supera el límite total de 400 vértices.');
  for(const h of cavities){
   if(contoursCross(outer.points,h.points)||!h.points.every(p=>insideStrict(p,outer.points)))
    throw Error('Un hueco invade o toca el contorno exterior.');
   for(const other of cavities){
    if(h===other)continue;
    if(contoursCross(h.points,other.points)||insideStrict(h.points[0],other.points))
     throw Error('Huecos solapados, en contacto o anidados: geometría no admitida.');
   }
  }
  const material=outer.areaMm2-cavities.reduce((a,h)=>a+h.areaMm2,0);
  if(material<=1e-7)throw Error('La sección no contiene material válido.');
  return {points:outer.points,holes:cavities.map(x=>x.points),bounds:outer.bounds,
   areaMm2:material,holeCount:cavities.length};
 }
 function fromContours(polys){
  if(polys.length>MAX_CONTOURS)throw Error('Máximo: una sección exterior y 8 huecos.');
  if(polys.reduce((sum,p)=>sum+p.points.length,0)>MAX_POINTS)
   throw Error('Demasiados vértices: límite 400 sumando todos los contornos.');
  const areaOf=p=>Math.abs(area(p.points));
  const sorted=[...polys].sort((a,b)=>areaOf(b)-areaOf(a));
  return {...validateGeometry(sorted[0].points,sorted.slice(1).map(p=>p.points)),
   arcCount:polys.reduce((n,p)=>n+p.arcCount,0),
   chordErrorMm:polys.some(p=>p.arcCount)?CHORD_ERROR_MM:0,
   sourceFormat:[...new Set(polys.map(p=>p.sourceFormat))].join(' + ')};
 }
 // Los bulges DXF describen arcos circulares firmados. Aproximamos
 // únicamente la representación, con desviación de cuerda máxima de 0,05 mm.
 // No se pierde el dato de que hubo curvas y nunca se certifica su geometría.
 const CHORD_ERROR_MM=.05;
 function sampleBulges(raw){
  const points=[],endpoints=raw.slice();
  if(endpoints.length>3&&dist2(endpoints[0],endpoints[endpoints.length-1])<1e-10){
   if(Math.abs(endpoints[endpoints.length-1].bulge||0)>1e-10)throw Error('Último vértice de cierre con bulge ambiguo.');
   endpoints.pop();
  }
  let arcCount=0;
  for(let i=0;i<endpoints.length;i++){
   const a=endpoints[i],b=endpoints[(i+1)%endpoints.length],bulge=a.bulge??0;
   if(!finite(bulge)||Math.abs(bulge)>1000)throw Error('Bulge DXF no válido.');
   points.push({x:a.x,y:a.y});
   if(Math.abs(bulge)<1e-10)continue;
   const chord=Math.hypot(b.x-a.x,b.y-a.y);
   if(chord<1e-9)throw Error('Arco DXF con extremos coincidentes.');
   const theta=4*Math.atan(bulge);
   if(Math.abs(theta)>=2*Math.PI-1e-6)throw Error('Arco de vuelta completa no compatible con una sola cuerda.');
   const radius=chord*(1+bulge*bulge)/(4*Math.abs(bulge));
   const offset=chord*(1-bulge*bulge)/(4*bulge);
   const cx=(a.x+b.x)/2+(-(b.y-a.y)/chord)*offset;
   const cy=(a.y+b.y)/2+((b.x-a.x)/chord)*offset;
   const start=Math.atan2(a.y-cy,a.x-cx);
   const step=2*Math.acos(Math.max(-1,Math.min(1,1-CHORD_ERROR_MM/radius)));
   const n=Math.max(2,Math.ceil(Math.abs(theta)/Math.max(step,.000001)));
   if(n>MAX_POINTS||points.length+n-1>MAX_POINTS)throw Error('Perfil curvo demasiado complejo. Simplifica el DXF sin superar error de 0,05 mm.');
   for(let k=1;k<n;k++){
    const angle=start+theta*k/n;
    points.push({x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)});
   }
   arcCount++;
  }
  return {points,arcCount,chordErrorMm:arcCount?CHORD_ERROR_MM:0};
 }
 function parseDXF(input,{confirmUnitlessMm=false}={}){
  if(typeof input!=='string'||input.length>MAX_SIZE||input.length<30)throw Error('DXF ASCII demasiado grande, vacío o inválido (máximo 750 KB).');
  if(input.includes('\0'))throw Error('DXF binario no admitido. Exporta en ASCII.');
  const rows=input.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
  const pairs=[];
  for(let i=0;i+1<rows.length;i+=2){
   const code=Number(rows[i].trim()),value=rows[i+1].trim();
   if(!Number.isInteger(code)||code<0||code>1071)throw Error('DXF con código de grupo no válido.');
   pairs.push({code,value});
  }
  let units=null;
  for(let i=0;i<pairs.length-1;i++){
   if(pairs[i].code===9&&pairs[i].value==='$INSUNITS'){
    let j=i+1;while(j<pairs.length&&pairs[j].code!==9&&pairs[j].code!==0){
     if(pairs[j].code===70){units=Number(pairs[j].value);break;}j++;
    }
    break;
   }
  }
  if(units!==null&&units!==0&&units!==4)throw Error('El DXF no está en milímetros ($INSUNITS='+units+'). Convierte primero a mm.');
  if((units===null||units===0)&&confirmUnitlessMm!==true)throw Error('DXF sin unidades definidas. Confirma expresamente que las coordenadas están en mm.');
  let section='',entities=false;
  const polys=[],unsupported=[];
  for(let i=0;i<pairs.length;i++){
   let q=pairs[i];
   if(q.code===0&&q.value==='SECTION'&&pairs[i+1]?.code===2){section=pairs[++i].value;continue;}
   if(q.code===0&&q.value==='ENDSEC'){section='';continue;}
   if(section!=='ENTITIES'||q.code!==0)continue;
   entities=true;
   if(q.value==='LWPOLYLINE'){
    const row=[];
    for(i++;i<pairs.length&&pairs[i].code!==0;i++)row.push(pairs[i]);
    i--;
    const flags=Number(row.find(a=>a.code===70)?.value||0);
    const points=[];let variableWidth=false;
    for(const c of row){
     if(c.code===10)points.push({x:Number(c.value),y:null,bulge:0});
     if(c.code===20){if(!points.length||points[points.length-1].y!==null)throw Error('Vértices DXF sin pareja X/Y.');points[points.length-1].y=Number(c.value);}
     if(c.code===42){
      if(!points.length)throw Error('Bulge sin vértice DXF.');
      points[points.length-1].bulge=Number(c.value);
     }
     if([40,41,43].includes(c.code)&&Math.abs(Number(c.value))>1e-10)variableWidth=true;
     if([210,220,230].includes(c.code)&&c.code!==230&&Math.abs(Number(c.value))>1e-10)throw Error('Plano DXF inclinado: convertir a vista XY.');
    }
    if(variableWidth)throw Error('DXF con anchura de polilínea variable no admitida.');
    if(points.some(p=>p.y===null))throw Error('Vértice sin Y.');
    if(!(flags&1)&&!(points.length>2&&dist2(points[0],points[points.length-1])<1e-10))
     throw Error('La polilínea debe estar cerrada.');
    const count=row.find(c=>c.code===90);
    if(count&&Number(count.value)!==points.length)throw Error('Conteo de vértices DXF inconsistente.');
    polys.push({...sampleBulges(points),sourceFormat:'DXF ASCII LWPOLYLINE'});
   }else if(q.value==='POLYLINE'){
    // Sección 2D DXF clásico R12: POLYLINE, VERTEX*, SEQEND.
    const header=[];
    for(i++;i<pairs.length&&pairs[i].code!==0;i++)header.push(pairs[i]);
    const get=(arr,code,def)=>arr.find(c=>c.code===code)?.value??def;
    const flags=Number(get(header,70,'0'));
    if(!Number.isInteger(flags)||(flags&~1))throw Error('POLYLINE 3D, malla o spline no admitida.');
    for(const c of header)if([30,39].includes(c.code)&&(!finite(Number(c.value))||Math.abs(Number(c.value))>1e-8))
      throw Error('POLYLINE con elevación o espesor no nulos.');
    const nx=Number(get(header,210,'0')),ny=Number(get(header,220,'0')),nz=Number(get(header,230,'1'));
    if(!finite(nx)||!finite(ny)||!finite(nz)||Math.abs(nx)>1e-8||Math.abs(ny)>1e-8||Math.abs(nz-1)>1e-8)
     throw Error('POLYLINE inclinada: exporta sección XY.');
    let foundEnd=false;const vertices=[];
    while(i<pairs.length&&pairs[i].code===0){
     if(pairs[i].value==='SEQEND'){foundEnd=true;break;}
     if(pairs[i].value!=='VERTEX')throw Error('POLYLINE sin SEQEND o con entidades intercaladas.');
     const fields=[];
     for(i++;i<pairs.length&&pairs[i].code!==0;i++)fields.push(pairs[i]);
     const vf=Number(get(fields,70,'0'));
     if(!Number.isInteger(vf)||vf!==0)throw Error('VERTEX 3D, malla o spline no admitido.');
     const xs=fields.filter(c=>c.code===10),ys=fields.filter(c=>c.code===20);
     if(xs.length!==1||ys.length!==1)throw Error('VERTEX sin coordenadas X/Y únicas.');
     const z=Number(get(fields,30,'0'));
     if(!finite(z)||Math.abs(z)>1e-8)throw Error('VERTEX elevado fuera del plano XY.');
     const bulges=fields.filter(c=>c.code===42);
     if(bulges.length>1)throw Error('VERTEX con bulges duplicados.');
     for(const c of fields)
      if([40,41].includes(c.code)&&(!finite(Number(c.value))||Math.abs(Number(c.value))>1e-10))
       throw Error('POLYLINE con anchura variable no admitida.');
     vertices.push({x:Number(xs[0].value),y:Number(ys[0].value),bulge:Number(bulges[0]?.value??0)});
     if(vertices.length>MAX_POINTS)throw Error('POLYLINE con demasiados vértices.');
    }
    if(!foundEnd)throw Error('POLYLINE: falta SEQEND.');
    if(!(flags&1)&&!(vertices.length>2&&dist2(vertices[0],vertices[vertices.length-1])<1e-10))
     throw Error('La POLYLINE debe estar cerrada.');
    polys.push({...sampleBulges(vertices),sourceFormat:'DXF ASCII POLYLINE'});
   }else{
    unsupported.push(q.value);
   }
  }
  if(!entities||!polys.length)throw Error('Se requiere DXF ASCII con una LWPOLYLINE o POLYLINE cerrada en ENTITIES.');
  if(unsupported.length)throw Error('DXF con entidades geométricas no soportadas ('+unsupported.slice(0,4).join(', ')+'). Exporta solo polilíneas cerradas.');
  const result=fromContours(polys);
  return {...result,unit:'mm',unitsDeclared:units===4,
   geometryCertified:false,collisionApproved:false};
 }
 function normalizeRecord(r){
  if(!r||typeof r!=='object')throw Error('Registro no válido.');
  if(!BRANDS.includes(r.brand))throw Error('Marca de referencia desconocida.');
  if(!['punch','die'].includes(r.kind))throw Error('Tipo de útil desconocido.');
  const code=String(r.code||'').trim(),name=String(r.name||'').trim();
  if(!code||code.length>70||!name||name.length>120)throw Error('Referencia y descripción obligatorias (máximo 70/120 caracteres).');
  const geometry=validateGeometry(r.points,r.holes??[]);
  const id=String(r.id||'').trim();
  if(!/^local-[a-z0-9-]{8,60}$/.test(id))throw Error('Identificador local no válido.');
  const lengthMm=r.lengthMm===null||r.lengthMm===''||r.lengthMm===undefined?null:Number(r.lengthMm);
  if(lengthMm!==null&&(!finite(lengthMm)||lengthMm<=0||lengthMm>10000))throw Error('Longitud nominal de herramienta incorrecta.');
  return {id,brand:r.brand,kind:r.kind,code,name,
   lengthMm,points:geometry.points,holes:geometry.holes,holeCount:geometry.holeCount,
   bounds:geometry.bounds,areaMm2:geometry.areaMm2,
   sourceFile:String(r.sourceFile||'').slice(0,140),importedAt:String(r.importedAt||''),
   unitsDeclared:r.unitsDeclared===true,arcCount:Number.isInteger(r.arcCount)&&r.arcCount>0?r.arcCount:0,
   chordErrorMm:r.arcCount>0?CHORD_ERROR_MM:0,
   sourceFormat:['DXF ASCII POLYLINE','DXF ASCII LWPOLYLINE',
     'DXF ASCII POLYLINE + DXF ASCII LWPOLYLINE',
     'DXF ASCII LWPOLYLINE + DXF ASCII POLYLINE'].includes(r.sourceFormat)?
     r.sourceFormat:'DXF ASCII LWPOLYLINE',
   geometryCertified:false,collisionApproved:false,simulatable:false};
 }
 function read(){
  try{
   const list=JSON.parse(root.localStorage?.getItem(KEY)||'[]');
   if(!Array.isArray(list))return [];
   return list.slice(0,MAX_FILES).flatMap(r=>{try{return [normalizeRecord(r)];}catch{return [];}});
  }catch{return [];}
 }
 function store(list){
  if(!Array.isArray(list)||list.length>MAX_FILES)throw Error('El almacén supera el máximo de '+MAX_FILES+' perfiles.');
  const safe=list.map(normalizeRecord);
  if(new Set(safe.map(x=>x.id)).size!==safe.length)throw Error('Identificadores duplicados de perfiles.');
  try{root.localStorage.setItem(KEY,JSON.stringify(safe));return safe;}catch{throw Error('No se pudo guardar el perfil en este dispositivo (almacenamiento bloqueado o lleno).');}
 }
 function exportBackup(){
  return JSON.stringify({
   format:'plegar-pro-tool-profiles',version:1,
   exportedAt:new Date().toISOString(),
   note:'Contornos DXF muestreados en mm. NO CAD homologado, NO validación de colisiones/CNC.',
   profiles:read()
  },null,2);
 }
 function importBackup(json){
  if(typeof json!=='string'||json.length>2000000)throw Error('Copia demasiado grande (máximo 2 MB).');
  let backup;
  try{backup=JSON.parse(json);}catch{throw Error('Archivo JSON no válido.');}
  if(!backup||backup.format!=='plegar-pro-tool-profiles'||backup.version!==1||
    !Array.isArray(backup.profiles)||backup.profiles.length>MAX_FILES)
   throw Error('Formato o versión de copia no compatible.');
  // Validar TODO antes de escribir: una ficha inválida no puede corromper la biblioteca.
  const incoming=backup.profiles.map(normalizeRecord);
  if(new Set(incoming.map(x=>x.id)).size!==incoming.length)throw Error('Copia con identificadores duplicados.');
  const existing=read(),byId=new Map(existing.map(x=>[x.id,x]));
  let added=0;
  for(const profile of incoming){
   if(byId.has(profile.id)){
    const old=byId.get(profile.id);
    // La hora/metadatos pueden variar, pero un mismo ID no puede contener otros puntos.
    if(old.brand!==profile.brand||old.kind!==profile.kind||
      JSON.stringify(old.points)!==JSON.stringify(profile.points)||
      JSON.stringify(old.holes)!==JSON.stringify(profile.holes))
     throw Error('La copia contiene un perfil distinto con identificador ya existente.');
    continue;
   }
   byId.set(profile.id,profile);added++;
  }
  if(byId.size>MAX_FILES)throw Error('Demasiados perfiles al combinar bibliotecas (máximo '+MAX_FILES+').');
  store([...byId.values()]);
  return {added,total:byId.size};
 }
 function add(metadata,dxfText,opts){
  const parsed=parseDXF(dxfText,opts),list=read();
  if(list.length>=MAX_FILES)throw Error('Máximo de '+MAX_FILES+' perfiles locales. Exporta y elimina uno antes de añadir.');
  const uid='local-'+(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
  const r=normalizeRecord({...metadata,id:uid,points:parsed.points,holes:parsed.holes,unitsDeclared:parsed.unitsDeclared,
    arcCount:parsed.arcCount,sourceFormat:parsed.sourceFormat,importedAt:new Date().toISOString()});
  store([r,...list]);return r;
 }
 function remove(id){const list=read();store(list.filter(r=>r.id!==id));return list.length!==read().length;}
 // Exportación vectorial sólo de secciones verificadas por el parser:
 // perfil exterior + huecos. Nunca exporta un volumen CAD ni NC.
 function exportSectionDXF(record){
  const v=normalizeRecord(record);
  const lines=[];
  const pair=(k,value)=>{lines.push(String(k),String(value));};
  pair(0,'SECTION');pair(2,'HEADER');pair(9,'$INSUNITS');pair(70,4);pair(0,'ENDSEC');
  pair(0,'SECTION');pair(2,'ENTITIES');
  for(const contour of [v.points,...v.holes]){
   pair(0,'LWPOLYLINE');pair(90,contour.length);pair(70,1);pair(8,'0');
   for(const p of contour){pair(10,p.x.toFixed(6));pair(20,p.y.toFixed(6));}
  }
  pair(0,'ENDSEC');pair(0,'EOF');
  const dx=lines.join('\n')+'\n';
  // Una copia utilizable vuelve a importarse como sección métrica sin ambigüedad.
  const check=parseDXF(dx);
  if(check.holeCount!==v.holeCount||Math.abs(check.areaMm2-v.areaMm2)>0.05)
   throw Error('La sección DXF exportada no conserva la geometría; comprueba el archivo.');
  return dx;
 }
 function exportSectionSVG(record){
  const v=normalizeRecord(record),b=v.bounds,pad=18,areaLabel=num(v.areaMm2);
  const width=b.width+pad*2,height=b.height+pad*2;
  const fmt=n=>Number(n.toFixed(6));
  const pt=p=>[fmt(p.x-b.minX+pad),fmt(b.maxY-p.y+pad)];
  const contourPath=ps=>ps.map((p,i)=>{const xy=pt(p);return (i?'L':'M')+xy[0]+' '+xy[1];}).join(' ')+' Z';
  const outline=[v.points,...v.holes].map(contourPath).join(' ');
  const center=fmt(pad+b.width/2),vertical=fmt(pad+b.height/2),right=fmt(pad+b.width+10);
  const label=esc(v.brand+' · '+v.code);
  return '<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<svg xmlns="http://www.w3.org/2000/svg" width="'+fmt(width)+'mm" height="'+fmt(height)+'mm" '+
   'viewBox="0 0 '+fmt(width)+' '+fmt(height)+'" aria-label="Sección DXF medida en milímetros">'+
   '<title>'+label+' · sección 2D no certificada</title>'+
   '<desc>Perfil vectorial en milímetros, '+v.holeCount+' huecos, área neta '+areaLabel+' mm². No CNC ni colisiones.</desc>'+
   '<path d="'+outline+'" fill="#85b6d2" fill-rule="evenodd" stroke="#15354c" stroke-width=".45"/>'+
   '<path d="M'+pad+' '+(pad-6)+'H'+fmt(pad+b.width)+
   ' M'+right+' '+pad+'V'+fmt(pad+b.height)+'" fill="none" stroke="#196da2" stroke-width=".3"/>'+
   '<text x="'+center+'" y="'+(pad-8)+'" text-anchor="middle" font-size="3.5" fill="#164a6d">'+num(b.width)+' mm</text>'+
   '<text x="'+(right+3)+'" y="'+vertical+'" transform="rotate(-90 '+(right+3)+' '+vertical+')" '+
   'text-anchor="middle" font-size="3.5" fill="#164a6d">'+num(b.height)+' mm</text>'+
   '</svg>';
 }
 function safeFileName(v,ext){
  const name=(v.code||'perfil').normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'')
    .replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,55)||'perfil';
  return 'Plegar-Pro-'+name+'.'+ext;
 }
 function downloadFile(data,kind,record){
  const v=normalizeRecord(record),mime=kind==='dxf'?'application/dxf':'image/svg+xml';
  const ext=kind==='dxf'?'dxf':'svg';
  const url=root.URL.createObjectURL(new Blob([data],{type:mime+';charset=utf-8'}));
  const link=root.document.createElement('a');
  link.href=url;link.download=safeFileName(v,ext);
  root.document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>root.URL.revokeObjectURL(url),1200);
 }
 function render(r,mode='2d'){
  if(!['2d','3d'].includes(mode))throw Error('Vista incorrecta.');
  const v=normalizeRecord(r),b=v.bounds,span=Math.max(b.width/175,b.height/105,.01);
  const x=n=>Number((121+(n-(b.minX+b.maxX)/2)/span).toFixed(2));
  const y=n=>Number((82-(n-(b.minY+b.maxY)/2)/span).toFixed(2));
  const points=v.points.map(p=>[x(p.x),y(p.y)]);
  const holes=v.holes.map(contour=>contour.map(p=>[x(p.x),y(p.y)]));
  const line=p=>p.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join(' ')+' Z';
  const front=[points,...holes].map(line).join(' ');
  const fill=v.kind==='punch'?'#2e90cb':'#a34f58',edge=v.kind==='punch'?'#b1e2ff':'#ffc0c0';
  const depth=mode==='3d'?18:0;
  const sideFaces=profile=>profile.map((q,i)=>{
   const n=profile[(i+1)%profile.length];
   return '<path d="M'+q[0]+' '+q[1]+'L'+n[0]+' '+n[1]+'L'+(n[0]+depth)+' '+(n[1]-10)+'L'+(q[0]+depth)+' '+(q[1]-10)+'Z" fill="#324e63" stroke="#9bc5df" stroke-width=".5"/>';
  }).join('');
  const sides=depth?[points,...holes].map(sideFaces).join(''):'';
  return '<svg class="mfg-art tool-dxf-art" viewBox="0 0 242 174" role="img" aria-label="Perfil importado de DXF en mm, '+esc(mode)+'; sin validación CNC">'+
   '<rect width="242" height="174" fill="#061624"/><path d="M121 18V145 M18 145H222" stroke="#34546b" stroke-dasharray="3 3" stroke-width=".8"/>'+
   (depth?'<path d="'+front+'" transform="translate(18,-10)" fill="#1d394c" fill-rule="evenodd" stroke="#bce2ef" stroke-width=".8"/>':'')+
   sides+'<path data-dxf-profile="'+esc(v.id)+'" d="'+front+'" fill="'+fill+'" fill-rule="evenodd" stroke="'+edge+'" stroke-width="1.4" fill-opacity=".88"/>'+
   '<text x="10" y="15" fill="#a0e8ff" font-size="11">'+mode.toUpperCase()+' · '+esc(v.brand)+'</text>'+
   '<text x="10" y="151" fill="#d5eaff" font-size="10">Sección: '+num(b.width)+' × '+num(b.height)+' mm</text>'+
   '<text x="10" y="160" fill="#b2e3f9" font-size="8">Huecos: '+v.holeCount+' · Área neta '+num(v.areaMm2)+' mm²</text>'+
   '<text x="10" y="170" fill="#ffdaaa" font-size="8">'+(depth?'EXTRUSIÓN VISUAL · PROFUNDIDAD NO MEDIDA':'DXF ESCALA MÉTRICA · NO CNC')+'</text></svg>';
 }
 const card=r=>'<article class="mfg-card tool-dxf-card" data-dxf-id="'+esc(r.id)+'">'+
  '<div class="mfg-dual">'+render(r,'2d')+render(r,'3d')+'</div>'+
  '<strong>'+esc(r.brand)+' · '+esc(r.code)+'</strong><p>'+esc(r.name)+'</p>'+
  '<small>Perfil de sección importado: '+num(r.bounds.width)+' × '+num(r.bounds.height)+' mm'+
   (r.lengthMm!==null?' · Largo declarado '+num(r.lengthMm)+' mm':' · Longitud axial desconocida')+
   (r.arcCount?' · '+r.arcCount+' arco(s) discretizados; error de cuerda ≤0,05 mm':'')+
   ' · '+r.holeCount+' hueco(s) · sección neta '+num(r.areaMm2)+' mm²</small>'+
  '<small>Origen: archivo local '+esc(r.sourceFile||'sin nombre')+' · '+esc(r.sourceFormat)+(r.unitsDeclared?' · mm en DXF':' · mm confirmados manualmente')+'</small>'+
  '<span class="mfg-warning">PERFIL IMPORTADO · amarre/capacidad sin certificar · NO COLISIONES/CNC</span>'+
  '<div class="tool-dxf-file-actions">'+
  '<button type="button" data-dxf-section="dxf" data-dxf-id="'+esc(r.id)+'">Exportar sección DXF (mm)</button>'+
  '<button type="button" data-dxf-section="svg" data-dxf-id="'+esc(r.id)+'">Exportar plano SVG (mm)</button>'+
  '<button type="button" data-dxf-remove="'+esc(r.id)+'">Eliminar copia local</button></div></article>';
 function html(){
  return '<section class="tool-dxf-importer" aria-label="Importar perfiles CAD DXF en milímetros">'+
   '<details><summary>Importar perfil DXF de punzón o matriz · ver sección 2D y volumen 3D</summary>'+
   '<p>Importa un <strong>DXF ASCII con una sección exterior cerrada LWPOLYLINE o POLYLINE/VERTEX y hasta 8 huecos interiores cerrados</strong>, con segmentos rectos o arcos circulares DXF (bulge) aproximados con error de cuerda máximo 0,05 mm; sin bloques, islas anidadas ni perfiles que se toquen o crucen. '+
   'Los puntos se leen en milímetros, sin reescalar. DXF 3D, STEP, SPLINE, contornos exteriores separados o unidades diferentes deben convertirse externamente sin perder geometría. '+
   'No se publica el archivo: queda únicamente en este navegador.</p>'+
   '<form class="tool-dxf-form"><label>Marca<select name="brand">'+BRANDS.map(x=>'<option>'+esc(x)+'</option>').join('')+'</select></label>'+
   '<label>Tipo<select name="kind"><option value="punch">Punzón</option><option value="die">Matriz</option></select></label>'+
   '<label>Código<input name="code" maxlength="70" required placeholder="Referencia visible en catálogo"></label>'+
   '<label>Descripción<input name="description" maxlength="120" required placeholder="Recto, cuello cisne, 1V..."></label>'+
   '<label>Largo axial (mm), si se conoce<input name="lengthMm" type="number" min="0.01" max="10000" step="0.01" placeholder="No documentado"></label>'+
   '<label>Archivo DXF ASCII<input name="file" type="file" accept=".dxf,text/plain" required></label>'+
   '<label class="tool-dxf-consent"><input type="checkbox" name="confirmUnits"> Confirmo que las coordenadas están en mm si el DXF no declara unidades</label>'+
   '<button type="submit">Importar y dibujar perfil</button></form>'+
   '<p class="tool-dxf-feedback" role="status"></p></details>'+
   '<div class="tool-dxf-current"><h3>Mis perfiles CAD locales (sin validar)</h3>'+
   '<p>El dibujo respeta las coordenadas de la sección DXF y recorta los huecos interiores. El volumen 3D representa una extrusión visual sin largo axial aunque lo declares (no se escala su profundidad). '+
   'Puedes exportar el contorno como DXF LWPOLYLINE en mm (los arcos se mantienen discretizados a 0,05 mm) '+
   'o como SVG acotado de sección. Exportar NO genera un sólido CAD, ni NC, ni datos de amarre. '+
   'No se conectan estos perfiles automáticamente al planificador ni al motor de colisiones.</p>'+
   '<p class="tool-dxf-count" role="status"></p>'+
   '<div class="tool-dxf-backup" role="group" aria-label="Copias de perfiles propios">'+
   '<button type="button" data-dxf-export>Exportar biblioteca JSON</button>'+
   '<label>Importar copia JSON <input data-dxf-backup-file type="file" accept=".json,application/json"></label>'+
   '<small>La copia contiene las coordenadas importadas y las referencias locales, no los archivos DXF originales. '+
   'Al restaurar se combinan fichas sin borrar las existentes y se mantienen siempre desactivadas las colisiones y CNC.</small></div>'+
   '<div class="mfg-grid tool-dxf-results"></div></div></section>';
 }
 function mount(host){
  if(!host)return;
  host.innerHTML=html();
  const list=()=>read(),paint=()=>{
   const arr=list();
   host.querySelector('.tool-dxf-count').textContent=arr.length+' perfiles importados en este navegador, máximo '+MAX_FILES+'.';
   host.querySelector('.tool-dxf-results').innerHTML=arr.map(card).join('')||'<p>No hay perfiles DXF importados.</p>';
  };
  const feedback=()=>host.querySelector('.tool-dxf-feedback');
  host.onsubmit=async e=>{
   if(!e.target.matches('.tool-dxf-form'))return;
   e.preventDefault();
   const form=e.target,file=form.elements.file.files?.[0];
   try{
    if(!file)throw Error('Selecciona un DXF.');
    if(file.size>MAX_SIZE)throw Error('Archivo mayor de 750 KB.');
    const data=await file.text();
    add({brand:form.elements.brand.value,kind:form.elements.kind.value,
     code:form.elements.code.value,name:form.elements.description.value,
     lengthMm:form.elements.lengthMm.value,sourceFile:file.name},data,
     {confirmUnitlessMm:form.elements.confirmUnits.checked});
    paint();form.reset();feedback().textContent='Perfil DXF guardado y representado en 2D/3D. NO validado para colisiones.';
   }catch(err){feedback().textContent='No se pudo importar: '+err.message;}
  };
  host.onchange=async e=>{
   const target=e.target;
   if(!target.matches('[data-dxf-backup-file]'))return;
   const file=target.files?.[0];if(!file)return;
   try{
    if(file.size>2000000)throw Error('La copia supera 2 MB.');
    const result=importBackup(await file.text());
    paint();
    feedback().textContent='Copia restaurada: '+result.added+' fichas nuevas; '+result.total+' en total. Sin certificar colisiones.';
   }catch(err){feedback().textContent='Restauración rechazada: '+err.message;}
   finally{target.value='';}
  };
  host.onclick=e=>{
   const section=e.target.closest('[data-dxf-section]');
   if(section){
    try{
     const record=read().find(x=>x.id===section.dataset.dxfId);
     if(!record)throw Error('Perfil no encontrado.');
     const format=section.dataset.dxfSection;
     if(!['dxf','svg'].includes(format))throw Error('Formato no admitido.');
     downloadFile(format==='dxf'?exportSectionDXF(record):exportSectionSVG(record),format,record);
     feedback().textContent='Sección '+format.toUpperCase()+' exportada en milímetros. Geometría no certificada ni válida para CNC.';
    }catch(err){feedback().textContent='No se pudo exportar: '+err.message;}
    return;
   }
   if(e.target.closest('[data-dxf-export]')){
    const url=root.URL.createObjectURL(new Blob([exportBackup()],{type:'application/json;charset=utf-8'}));
    const link=root.document.createElement('a');
    link.href=url;link.download='plegar-pro-perfiles-utillaje.json';
    root.document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>root.URL.revokeObjectURL(url),1200);
    feedback().textContent='Copia JSON exportada. Consérvala fuera de este navegador.';
    return;
   }
   const target=e.target.closest('[data-dxf-remove]');if(!target)return;
   remove(target.dataset.dxfRemove);paint();feedback().textContent='Copia local eliminada. Las fichas de fabricante permanecen intactas.';
  };
  paint();
 }
 return {KEY,BRANDS,parseDXF,validatePoints,validateGeometry,normalizeRecord,add,read,remove,store,exportBackup,importBackup,exportSectionDXF,exportSectionSVG,render,html,mount};
});
