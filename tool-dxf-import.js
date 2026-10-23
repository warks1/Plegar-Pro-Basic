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
   const a=endpoints[i],b=endpoints[(i+1)%endpoints.length],bulge=a.bulge||0;
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
    polys.push(sampleBulges(points));
   }else if(['LINE','ARC','CIRCLE','SPLINE','ELLIPSE','POLYLINE','VERTEX','INSERT','HATCH','REGION','3DSOLID'].includes(q.value)){
    unsupported.push(q.value);
   }
  }
  if(!entities||!polys.length)throw Error('Se requiere DXF ASCII con una LWPOLYLINE cerrada en ENTITIES.');
  if(polys.length!==1||unsupported.length)throw Error('El archivo contiene varios perfiles o entidades geométricas no soportadas ('+unsupported.slice(0,4).join(', ')+'). Exporta únicamente una sección exterior cerrada.');
  const result=validatePoints(polys[0].points);
  return {...result,arcCount:polys[0].arcCount,chordErrorMm:polys[0].chordErrorMm,
   unit:'mm',unitsDeclared:units===4,sourceFormat:'DXF ASCII LWPOLYLINE',geometryCertified:false,collisionApproved:false};
 }
 function normalizeRecord(r){
  if(!r||typeof r!=='object')throw Error('Registro no válido.');
  if(!BRANDS.includes(r.brand))throw Error('Marca de referencia desconocida.');
  if(!['punch','die'].includes(r.kind))throw Error('Tipo de útil desconocido.');
  const code=String(r.code||'').trim(),name=String(r.name||'').trim();
  if(!code||code.length>70||!name||name.length>120)throw Error('Referencia y descripción obligatorias (máximo 70/120 caracteres).');
  const geometry=validatePoints(r.points);
  const id=String(r.id||'').trim();
  if(!/^local-[a-z0-9-]{8,60}$/.test(id))throw Error('Identificador local no válido.');
  const lengthMm=r.lengthMm===null||r.lengthMm===''||r.lengthMm===undefined?null:Number(r.lengthMm);
  if(lengthMm!==null&&(!finite(lengthMm)||lengthMm<=0||lengthMm>10000))throw Error('Longitud nominal de herramienta incorrecta.');
  return {id,brand:r.brand,kind:r.kind,code,name,
   lengthMm,points:geometry.points,bounds:geometry.bounds,areaMm2:geometry.areaMm2,
   sourceFile:String(r.sourceFile||'').slice(0,140),importedAt:String(r.importedAt||''),
   unitsDeclared:r.unitsDeclared===true,arcCount:Number.isInteger(r.arcCount)&&r.arcCount>0?r.arcCount:0,
   chordErrorMm:r.arcCount>0?CHORD_ERROR_MM:0,sourceFormat:'DXF ASCII LWPOLYLINE',
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
  const safe=list.slice(0,MAX_FILES).map(normalizeRecord);
  try{root.localStorage.setItem(KEY,JSON.stringify(safe));return safe;}catch{throw Error('No se pudo guardar el perfil en este dispositivo (almacenamiento bloqueado o lleno).');}
 }
 function add(metadata,dxfText,opts){
  const parsed=parseDXF(dxfText,opts),list=read();
  if(list.length>=MAX_FILES)throw Error('Máximo de '+MAX_FILES+' perfiles locales. Exporta y elimina uno antes de añadir.');
  const uid='local-'+(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10));
  const r=normalizeRecord({...metadata,id:uid,points:parsed.points,unitsDeclared:parsed.unitsDeclared,
    arcCount:parsed.arcCount,importedAt:new Date().toISOString()});
  store([r,...list]);return r;
 }
 function remove(id){const list=read();store(list.filter(r=>r.id!==id));return list.length!==read().length;}
 function render(r,mode='2d'){
  if(!['2d','3d'].includes(mode))throw Error('Vista incorrecta.');
  const v=normalizeRecord(r),b=v.bounds,span=Math.max(b.width/175,b.height/105,.01);
  const x=n=>Number((121+(n-(b.minX+b.maxX)/2)/span).toFixed(2));
  const y=n=>Number((82-(n-(b.minY+b.maxY)/2)/span).toFixed(2));
  const points=v.points.map(p=>[x(p.x),y(p.y)]);
  const line=p=>p.map((q,i)=>(i?'L':'M')+q[0]+' '+q[1]).join(' ')+' Z';
  const front=line(points);
  const fill=v.kind==='punch'?'#2e90cb':'#a34f58',edge=v.kind==='punch'?'#b1e2ff':'#ffc0c0';
  const depth=mode==='3d'?18:0;
  const sides=depth?points.map((q,i)=>{
   const n=points[(i+1)%points.length];
   return '<path d="M'+q[0]+' '+q[1]+'L'+n[0]+' '+n[1]+'L'+(n[0]+depth)+' '+(n[1]-10)+'L'+(q[0]+depth)+' '+(q[1]-10)+'Z" fill="#324e63" stroke="#9bc5df" stroke-width=".5"/>';
  }).join(''):'';
  return '<svg class="mfg-art tool-dxf-art" viewBox="0 0 242 174" role="img" aria-label="Perfil importado de DXF en mm, '+esc(mode)+'; sin validación CNC">'+
   '<rect width="242" height="174" fill="#061624"/><path d="M121 18V145 M18 145H222" stroke="#34546b" stroke-dasharray="3 3" stroke-width=".8"/>'+
   (depth?'<path d="'+front+'" transform="translate(18,-10)" fill="#1d394c" stroke="#bce2ef" stroke-width=".8"/>':'')+
   sides+'<path data-dxf-profile="'+esc(v.id)+'" d="'+front+'" fill="'+fill+'" stroke="'+edge+'" stroke-width="1.4" fill-opacity=".88"/>'+
   '<text x="10" y="15" fill="#a0e8ff" font-size="11">'+mode.toUpperCase()+' · '+esc(v.brand)+'</text>'+
   '<text x="10" y="154" fill="#d5eaff" font-size="10">Sección: '+num(b.width)+' × '+num(b.height)+' mm</text>'+
   '<text x="10" y="167" fill="#ffdaaa" font-size="8">'+(depth?'EXTRUSIÓN VISUAL · PROFUNDIDAD NO MEDIDA':'DXF ESCALA MÉTRICA · NO CNC')+'</text></svg>';
 }
 const card=r=>'<article class="mfg-card tool-dxf-card" data-dxf-id="'+esc(r.id)+'">'+
  '<div class="mfg-dual">'+render(r,'2d')+render(r,'3d')+'</div>'+
  '<strong>'+esc(r.brand)+' · '+esc(r.code)+'</strong><p>'+esc(r.name)+'</p>'+
  '<small>Perfil de sección importado: '+num(r.bounds.width)+' × '+num(r.bounds.height)+' mm'+
   (r.lengthMm!==null?' · Largo declarado '+num(r.lengthMm)+' mm':' · Longitud axial desconocida')+
   (r.arcCount?' · '+r.arcCount+' arco(s) discretizados; error de cuerda ≤0,05 mm':'')+'</small>'+
  '<small>Origen: archivo local '+esc(r.sourceFile||'sin nombre')+(r.unitsDeclared?' · mm en DXF':' · mm confirmados manualmente')+'</small>'+
  '<span class="mfg-warning">PERFIL IMPORTADO · amarre/capacidad sin certificar · NO COLISIONES/CNC</span>'+
  '<button type="button" data-dxf-remove="'+esc(r.id)+'">Eliminar esta copia local</button></article>';
 function html(){
  return '<section class="tool-dxf-importer" aria-label="Importar perfiles CAD DXF en milímetros">'+
   '<details><summary>Importar perfil DXF de punzón o matriz · ver sección 2D y volumen 3D</summary>'+
   '<p>Importa un <strong>DXF ASCII con una sola polilínea LWPOLYLINE cerrada</strong>, sección de contorno exterior, con segmentos rectos o arcos circulares DXF (bulge) aproximados con error de cuerda máximo 0,05 mm; sin bloques ni huecos. '+
   'Los puntos se leen en milímetros, sin reescalar. DXF 3D, STEP, SPLINE, varios perfiles y unidades diferentes deben convertirse externamente sin perder geometría. '+
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
   '<p>El dibujo respeta las coordenadas de la sección DXF. El volumen 3D representa una extrusión visual sin largo axial salvo que lo declares. '+
   'No se conectan estos perfiles automáticamente al planificador ni al motor de colisiones.</p>'+
   '<p class="tool-dxf-count" role="status"></p><div class="mfg-grid tool-dxf-results"></div></div></section>';
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
  host.onclick=e=>{
   const target=e.target.closest('[data-dxf-remove]');if(!target)return;
   remove(target.dataset.dxfRemove);paint();feedback().textContent='Copia local eliminada. Las fichas de fabricante permanecen intactas.';
  };
  paint();
 }
 return {KEY,BRANDS,parseDXF,validatePoints,normalizeRecord,add,read,remove,render,html,mount};
});
