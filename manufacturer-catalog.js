/* Biblioteca de referencias documentales de utillaje (2026-10-23).
   NO contiene perfiles CAD completos certificados ni autoriza uso en plegado físico.
   Las vistas 2D/3D son ESQUEMAS generados, no copias de perfiles de fabricante.
*/
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarManufacturerCatalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SOURCE=Object.freeze({
  mecos:{name:'MECOS · catálogo general utillaje 2022',url:'https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf',level:'catálogo del distribuidor'},
  amada:{name:'AMADA · catálogo de utillaje',url:'https://www.amada.eu/es-es/amada-espana/mas/noticias/catalogo-de-utillaje',level:'página oficial'},
  bystronic:{name:'Bystronic · familias XPT y RF-A',url:'https://www.bystronic.com/usa/en-us/lp/press-brakes-tooling',level:'página oficial'},
  eurostamp:{name:'EUROSTAMP · catálogo de 272 páginas',url:'https://www.canmet.eu/perch/resources/eurostamp-1.pdf',level:'copia de catálogo del fabricante'},
  eurostampShop:{name:'EUROSTAMP · referencias online',url:'https://www.eurostamp-abkantwerkzeuge.de/negozio/',level:'tienda distribuidora'},
  forge:{name:'Forge · fichas de utillaje EUROSTAMP',url:'https://forge-usa.com/tooling',level:'distribuidor comercial'}
 });
 const base=[
  // Entrada de FAMILIA: no atribuir medidas o códigos a modelos concretos no identificados.
  ['mecos-punch-gold','MECOS','punch','Gold Line · punzones para plegadora',null,null,null,null,'MECOS Gold Line','mecos','familia'],
  ['mecos-die-gold','MECOS','die','Gold Line · matrices para plegadora',null,null,null,null,'MECOS Gold Line','mecos','familia'],
  ['mecos-special-punch','MECOS','punch','Utillaje especial · punzones',null,null,null,null,'Catálogo MECOS · utillaje especial','mecos','familia'],
  ['mecos-special-die','MECOS','die','Utillaje especial · matrices',null,null,null,null,'Catálogo MECOS · utillaje especial','mecos','familia'],
  ['amada-punch-afh','AMADA','punch','Familia de punzones AMADA AFH',null,null,null,null,'AMADA AFH','amada','familia'],
  ['amada-die-afh','AMADA','die','Familia de matrices AMADA AFH',null,null,null,null,'AMADA AFH','amada','familia'],
  ['amada-hemming','AMADA','die','Utillaje de aplastado / hemming',null,null,null,null,'AMADA hemming','amada','familia'],
  ['bystronic-xpt-punch','Bystronic','punch','XPT · punzones de carga frontal',null,null,null,null,'XPT / Wila NSCL II','bystronic','familia'],
  ['bystronic-xpt-die','Bystronic','die','XPT · matrices segmentadas',null,null,null,null,'XPT / Wila NSCL II','bystronic','familia'],
  ['bystronic-rfa-punch','Bystronic','punch','RF-A · punzones',null,null,null,null,'Bystronic RF-A','bystronic','familia'],
  ['bystronic-rfa-die','Bystronic','die','RF-A · matrices',null,null,null,null,'Bystronic RF-A','bystronic','familia'],
  ['eurostamp-p1171','EUROSTAMP','punch','Referencia 1171 · punzón',85,null,null,null,'1171','eurostampShop','modelo'],
  ['eurostamp-p1338','EUROSTAMP','punch','Referencia 1338 · punzón',75,null,null,null,'1338','eurostampShop','modelo'],
  ['eurostamp-p1339','EUROSTAMP','punch','Referencia 1339 · punzón',75,null,null,null,'1339','eurostampShop','modelo'],
  ['eurostamp-p1340','EUROSTAMP','punch','Referencia 1340 · punzón',86,null,null,null,'1340','eurostampShop','modelo'],
  ['eurostamp-d-v10','EUROSTAMP','die','Bystronic style · matriz 1V',88,10,55,null,'V10 H55 C45','forge','variante'],
  ['eurostamp-d-v24','EUROSTAMP','die','Bystronic style · matriz 1V',88,24,55,null,'V24 H55 C45','forge','variante'],
  ['eurostamp-d-v60','EUROSTAMP','die','Bystronic style · matriz 1V',60,60,65,null,'V60 H65 C45','forge','variante'],
  ['eurostamp-d-v12','EUROSTAMP','die','AMADA style · matriz T 1V',88,12,120,null,'V12 H120','forge','variante'],
  ['eurostamp-p-trumpf','EUROSTAMP','punch','Punzones compatibles con Trumpf',null,null,null,null,'Trumpf style','eurostamp','familia'],
  ['eurostamp-d-trumpf','EUROSTAMP','die','Matrices compatibles con Trumpf',null,null,null,null,'Trumpf style','eurostamp','familia'],
  // Códigos que figuran en el esquema de segmentación EUROSTAMP (PDF, página impresa 94).
  // No se han leído sus siluetas ni las dimensiones completas. NO se interpolan.
  ...['1233','1234','1235','1236','1237','1238','1295','1302','1308','1313','1314','1316','1317','1318']
    .map(code=>['eurostamp-p'+code,'EUROSTAMP','punch','Código de punzón (esquema de segmentación)',null,null,null,null,code,'eurostamp','modelo']),
  ['bystronic-rfac-punch','Bystronic','punch','Sistema RF-AC · familia',null,null,null,null,'RF-AC','bystronic','familia']
 ];
 // angle in degrees; V-opening and H in millimetres. No dimensions extrapolated.
 // Las cinco fichas dimensionales AMADA ya están en manufacturer-references.js.
 // Compartir esos datos evita inventar alturas/radios de una referencia distinta.
 const refs=(typeof require==='function'?require('./manufacturer-references.js'):window.PlegarManufacturerReferences);
 const measured=(refs?.RECORDS||[]).map(r=>Object.freeze({
  id:r.id,brand:r.manufacturer,kind:r.kind,name:r.model,angle:r.angle,
  opening:r.kind==='die'?r.opening:null,height:r.height,
  radius:r.kind==='punch'?r.nose:r.shoulderRadius,nose:r.kind==='punch'?r.nose:null,
  width:r.width??null,length:r.length,capacity:r.capacity,orderNumber:r.orderNumber,mounting:r.mounting,
  code:r.orderNumber,source:Object.freeze({name:r.source.title,url:r.source.url,level:'documentación declarada del fabricante'}),
  fidelity:'referencia dimensional',geometryCertified:false,simulatable:false,checkedOn:'2026-10-23'
 }));
 const ENTRIES=Object.freeze([...base.map(([id,brand,kind,name,angle,opening,height,radius,code,source,fidelity])=>
  Object.freeze({id,brand,kind,name,angle,opening,height,radius,code,source:SOURCE[source],
   fidelity,geometryCertified:false,simulatable:false,checkedOn:'2026-10-23'})),...measured]);
 const brandNames=['MECOS','Bystronic','AMADA','EUROSTAMP'];
 const escape=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[x]));
 function find(id){return ENTRIES.find(e=>e.id===id)||null;}
 function list({brand='all',kind='all',q=''}={}){
  const text=String(q).trim().toLowerCase();
  return ENTRIES.filter(t=>(brand==='all'||t.brand===brand)&&(kind==='all'||t.kind===kind)&&
   (!text||[t.brand,t.name,t.code,t.fidelity].join(' ').toLowerCase().includes(text)));
 }
 function pointText(item){
  const fields=[];
  if(item.angle!==null)fields.push('Ángulo '+item.angle+'°');
  if(item.opening!==null)fields.push('V '+item.opening+' mm');
  if(item.height!==null)fields.push('H '+item.height+' mm');
  if(item.radius!==null)fields.push('Radio R'+item.radius+' mm');
  if(item.length!==undefined)fields.push('L '+item.length+' mm');
  if(item.width!==undefined&&item.width!==null)fields.push('Ancho '+item.width+' mm');
  if(item.capacity!==undefined)fields.push('Capacidad publicada '+item.capacity+' kN/m');
  return fields.length?fields.join(' · '):'Perfil y dimensiones completos no publicados para esta referencia';
 }
 function art(item,view='2d'){
  const painter=(typeof require==='function'?require('./manufacturer-drawings.js'):window.PlegarManufacturerDrawings);
  if(!painter)throw Error('Motor de dibujos de utillaje no disponible.');
  return painter.outlineSVG(item,view);
 }
 function card(e){
  return '<article class="mfg-card" data-mfg-id="'+e.id+'"><div class="mfg-dual">'+art(e,'2d')+art(e,'3d')+'</div>'+
   '<strong>'+escape(e.brand)+' · '+escape(e.code)+'</strong>'+
   '<p>'+escape(e.name)+'</p><small>'+escape(pointText(e))+'</small>'+
   '<small class="mfg-provenance">Fuente: '+escape(e.source.name)+' · '+escape(e.source.level)+'</small>'+
   (e.mounting?'<small class="mfg-provenance">Amarre: '+escape(e.mounting)+'</small>':'')+
   '<span class="mfg-warning">Perfil ilustrativo · NO VÁLIDO PARA COLISIONES</span>'+
   '<a href="'+e.source.url+'" target="_blank" rel="noopener noreferrer">Consultar catálogo / referencia original ↗</a></article>';
 }
 function html(){
  return '<section class="mfg-catalog" aria-label="Catálogo documental de punzones y matrices">'+
   '<h2>Biblioteca de fabricantes · fichas documentadas</h2>'+
   '<p>Referencias y familias de las cuatro marcas. Cada tarjeta dibuja <b>la categoría, el ángulo y la V documentados</b> en un esquema 2D y volumen conceptual 3D; no es una copia del perfil CAD del fabricante. '+
   'Los perfiles incompletos no se ofrecen para simulación ni validación de colisiones.</p>'+
   '<div class="mfg-controls"><label>Marca<select data-mfg-filter="brand"><option value="all">Todas</option>'+
    brandNames.map(n=>'<option value="'+escape(n)+'">'+escape(n)+'</option>').join('')+'</select></label>'+
   '<label>Tipo<select data-mfg-filter="kind"><option value="all">Punzones y matrices</option><option value="punch">Punzones</option><option value="die">Matrices</option></select></label>'+
   '<label>Referencia<input type="search" data-mfg-filter="q" placeholder="Código, V, marca..." autocomplete="off"></label></div>'+
   '<p class="mfg-count" role="status"></p><div class="mfg-grid" data-mfg-results></div>'+
   '<p class="mfg-legend"><strong>Verificación:</strong> las cotas numéricas solo se muestran cuando están registradas para esa referencia. Los dibujos son modelos esquemáticos: NO son dibujos del fabricante, NO permiten comprobar colisiones y NO sustituyen CAD, amarre, tolerancias ni capacidad de máquina.</p></section>';
 }
 function mount(host){
  if(!host)return;
  host.innerHTML=html();
  const filters={brand:'all',kind:'all',q:''};
  const paint=()=>{
   const records=list(filters);
   host.querySelector('[data-mfg-results]').innerHTML=records.map(card).join('')||
    '<p>No hay referencias con estos filtros.</p>';
   host.querySelector('.mfg-count').textContent=records.length+' referencias documentales mostradas · '+ENTRIES.length+' cargadas · 0 perfiles CAD certificados.';
  };
  host.oninput=host.onchange=e=>{
   const key=e.target.dataset.mfgFilter;if(!key)return;
   filters[key]=e.target.value;paint();
  };
  paint();
 }
 function validate(){
  if(new Set(ENTRIES.map(e=>e.id)).size!==ENTRIES.length)throw Error('IDs repetidos');
  for(const e of ENTRIES){
   if(!brandNames.includes(e.brand)||!['punch','die'].includes(e.kind)||e.geometryCertified||e.simulatable)throw Error('Referencia no segura');
   if(!e.source||!/^https:\/\//.test(e.source.url))throw Error('Sin fuente');
   for(const k of ['angle','opening','height','radius'])if(e[k]!==null&&!(Number.isFinite(e[k])&&e[k]>0))throw Error('Cota incorrecta');
   if(e.kind==='punch'&&e.opening!==null)throw Error('V imposible en punzón');
  }
  return {total:ENTRIES.length,brands:brandNames.length,exactProfiles:0,withDimensions:ENTRIES.filter(e=>e.angle!==null||e.opening!==null||e.height!==null).length};
 }
 validate();
 return {ENTRIES,SOURCE,brandNames,find,list,card,art,html,mount,validate};
});
