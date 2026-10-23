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
  ['eurostamp-d-trumpf','EUROSTAMP','die','Matrices compatibles con Trumpf',null,null,null,null,'Trumpf style','eurostamp','familia']
 ];
 // angle in degrees; V-opening and H in millimetres. No dimensions extrapolated.
 const ENTRIES=Object.freeze(base.map(([id,brand,kind,name,angle,opening,height,radius,code,source,fidelity])=>
  Object.freeze({id,brand,kind,name,angle,opening,height,radius,code,source:SOURCE[source],
   fidelity,geometryCertified:false,simulatable:false,checkedOn:'2026-10-23'})));
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
  return fields.length?fields.join(' · '):'Ángulo, radio, V y altura: no documentados en esta ficha';
 }
 function art(item,view='2d'){
  // Geometría ilustrativa procedente del tipo; jamás de un supuesto CAD real.
  const punch=item.kind==='punch';
  const angle=item.angle===null?'?':String(item.angle);
  const dim=item.opening===null?'V ?':'V '+item.opening;
  const grad='mfg-'+item.id+'-'+view;
  const offset=view==='3d'?-17:0;
  const shape=punch?
   'M85 18 L157 18 L157 51 L137 51 L137 76 L121 114 L105 76 L105 51 L85 51 Z':
   'M40 124 L40 48 L91 48 L121 76 L151 48 L203 48 L203 124 Z';
  const back=view==='3d'?
   '<path d="'+shape+'" transform="translate(16,-15)" fill="#344b5b" stroke="#8baac4" stroke-width="1.5"/>':
   '';
  const fill=punch?'url(#'+grad+')':'url(#'+grad+')';
  const g='<linearGradient id="'+grad+'" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+(punch?'#bddff8':'#a7b8cb')+'"/><stop offset=".5" stop-color="'+(punch?'#4c8ec0':'#556c83')+'"/><stop offset="1" stop-color="'+(punch?'#205d90':'#22344b')+'"/></linearGradient>';
  const tool='<path d="'+shape+'" fill="'+fill+'" stroke="'+(punch?'#a6dcff':'#b2c1d1')+'" stroke-width="2" stroke-linejoin="round"/>';
  const detail=punch?
   '<path d="M121 114 L121 139" stroke="#57c6fb" stroke-dasharray="3 4" stroke-width="1.3"/>':
   '<path d="M91 48 L121 76 L151 48" fill="none" stroke="#eb9a7f" stroke-width="2"/>';
  const texts='<text x="7" y="17" fill="#a7ddfa" font-size="10">'+(punch?'PUNZÓN':'MATRIZ')+' · '+view.toUpperCase()+'</text>'+
   '<text x="7" y="151" fill="#e8f5ff" font-size="11">α '+angle+'° · '+(punch?'R no verificado':dim)+'</text>'+
   '<text x="235" y="44" fill="#d0e7f6" font-size="9" text-anchor="end">'+(item.height!==null?'H '+item.height+' mm':'H ?')+'</text>'+
   '<text x="235" y="164" fill="#ffe0aa" font-size="9" text-anchor="end">ESQUEMA</text>';
  return '<svg class="mfg-art" viewBox="0 0 242 174" role="img" aria-label="Esquema '+view+' no acotado de '+escape(item.name)+'">'+
   '<defs>'+g+'</defs><rect width="242" height="174" rx="9" fill="#061727"/>'+
   '<path d="M20 146 H224 M121 28 V145" stroke="#183c50" stroke-dasharray="3 4"/>'+
   '<g transform="translate(0,'+offset+')">'+back+tool+detail+'</g>'+texts+'</svg>';
 }
 function card(e){
  return '<article class="mfg-card" data-mfg-id="'+e.id+'"><div class="mfg-dual">'+art(e,'2d')+art(e,'3d')+'</div>'+
   '<strong>'+escape(e.brand)+' · '+escape(e.code)+'</strong>'+
   '<p>'+escape(e.name)+'</p><small>'+escape(pointText(e))+'</small>'+
   '<small class="mfg-provenance">Fuente: '+escape(e.source.name)+' · '+escape(e.source.level)+'</small>'+
   '<span class="mfg-warning">Perfil ilustrativo · NO VÁLIDO PARA COLISIONES</span>'+
   '<a href="'+e.source.url+'" target="_blank" rel="noopener noreferrer">Consultar catálogo / referencia original ↗</a></article>';
 }
 function html(){
  return '<section class="mfg-catalog" aria-label="Catálogo documental de punzones y matrices">'+
   '<h2>Biblioteca de fabricantes · fichas documentadas</h2>'+
   '<p>Referencias comerciales encontradas en catálogos. Cada tarjeta tiene un <b>esquema 2D y una vista 3D conceptual</b>; NO es la silueta CAD del fabricante. '+
   'Los perfiles incompletos no se ofrecen para simulación ni validación de colisiones.</p>'+
   '<div class="mfg-controls"><label>Marca<select data-mfg-filter="brand"><option value="all">Todas</option>'+
    brandNames.map(n=>'<option value="'+escape(n)+'">'+escape(n)+'</option>').join('')+'</select></label>'+
   '<label>Tipo<select data-mfg-filter="kind"><option value="all">Punzones y matrices</option><option value="punch">Punzones</option><option value="die">Matrices</option></select></label>'+
   '<label>Referencia<input type="search" data-mfg-filter="q" placeholder="Código, V, marca..." autocomplete="off"></label></div>'+
   '<p class="mfg-count" role="status"></p><div class="mfg-grid" data-mfg-results></div>'+
   '<p class="mfg-legend"><strong>Verificación:</strong> las cotas rotuladas proceden de la fuente enlazada, pero faltan perfiles detallados, radios, geometría de amarre, tolerancias y capacidades de carga. Los gráficos NO están a escala métrica ni sirven como plano de fabricación.</p></section>';
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
