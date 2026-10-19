/* Plegar Pro Plus v0.16 — inspección CAD DXF multicapas y arcos.
 * Los datos DXF quedan aislados: no modifican piezas, geometría CNC ni catálogo.
 */
(function(){'use strict';
 const CAD=window.PlegarCadProfile;
 let host=null,current=null,getReference=null,activeLayer='*',activeIndex=-1,requestId=0,sourceName='';
 const fmt=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(n);
 function node(id){return host?.querySelector('#'+id);}
 function status(text,error=false){const el=node('cad-status');if(el){el.textContent=text;el.dataset.error=String(error);}}
 function setOptions(select,items){select.replaceChildren(...items.map(([value,title])=>new Option(title,String(value))));}
 function selected(){return current?.contours?.[activeIndex]||null;}
 function filterShapes(){return current?.contours.filter(p=>activeLayer==='*'||p.layer===activeLayer)||[];}
 function updateSelectors(){
  const layer=node('cad-layer'),contour=node('cad-contour');
  layer.disabled=!current;contour.disabled=!current;
  if(!current){setOptions(layer,[['*','Todas las capas']]);setOptions(contour,[['','Sin contornos']]);return;}
  setOptions(layer,[['*',`Todas las capas (${current.contours.length})`],...current.layers.map(l=>[l,`Capa ${l} (${current.contours.filter(c=>c.layer===l).length})`])]);
  layer.value=activeLayer;
  const visible=filterShapes();
  if(!visible.some(x=>x.index===activeIndex))activeIndex=visible[0]?.index??-1;
  setOptions(contour,visible.map(s=>[s.index,`#${s.index+1} · ${s.kind} · ${s.layer} · ${fmt(s.bounds.width)} × ${fmt(s.bounds.height)} mm`]));
  contour.value=String(activeIndex);
 }
 function preview(){
  const svg=node('cad-preview'),NS='http://www.w3.org/2000/svg';svg.replaceChildren();
  if(!current){svg.setAttribute('viewBox','0 0 200 80');svg.setAttribute('aria-label','Sin DXF cargado');return;}
  const b=current.bounds,pad=Math.max(1,Math.max(b.width,b.height)*0.07),W=Math.max(1,b.width+2*pad),H=Math.max(1,b.height+2*pad);
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const visible=filterShapes();
  for(const s of visible){
   const path=document.createElementNS(NS,'polyline');
   const pts=s.closed?[...s.points,s.points[0]]:s.points;
   path.setAttribute('points',pts.map(v=>`${v.x-b.minX+pad},${b.maxY+pad-v.y}`).join(' '));
   path.setAttribute('fill','none');path.setAttribute('stroke',s.index===activeIndex?'#4ee0ff':'#90a4b7');
   path.setAttribute('stroke-width',s.index===activeIndex?'2.8':'1.6');
   path.setAttribute('vector-effect','non-scaling-stroke');
   path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');
   svg.appendChild(path);
  }
  svg.setAttribute('aria-label',`${visible.length} contornos mostrados de ${current.contours.length}, extensión ${fmt(b.width)} × ${fmt(b.height)} milímetros. Seleccionado: ${activeIndex+1}`);
 }
 function comparison(){
  const el=node('cad-comparison');if(!el)return;
  const profile=selected();
  if(!profile){el.textContent='Selecciona un contorno para cotejar cotas.';return;}
  const ref=getReference?.();if(!ref){el.textContent='No hay ficha de fabricante seleccionada.';return;}
  try{
   const r=CAD.compareBounds(profile,ref);
   const width=r.widthDelta===null?' · ancho sin cotejar':` · Δ ancho ${fmt(r.widthDelta)} mm`;
   const verdict=r.heightMatch&&(r.widthMatch===null||r.widthMatch)?'Coincidencia nominal NO validada':'Dimensiones nominales diferentes';
   el.textContent=`Contorno #${activeIndex+1} · ${ref.manufacturer} ${ref.orderNumber}: Δ altura ${fmt(r.heightDelta)} mm${width}. ${verdict}. Tolerancia de cotejo ±${fmt(r.tolerance)} mm; orientación ${r.orientation}. ${r.warning}`;
  }catch(e){el.textContent=`Comparación no disponible: ${e.message}`;}
 }
 function refresh(){
  if(!host)return;
  updateSelectors();preview();
  const shape=selected(),b=current?.bounds;
  node('cad-metrics').textContent=!current?'—':`${current.contours.length} elementos · ${current.layers.length} capas · ${current.points} vértices · ${current.units}${current.assumedUnits?' (confirmación manual)':''} · extensión total ${fmt(b.width)} × ${fmt(b.height)} mm · longitud dibujada ${fmt(b.length)} mm.${shape?` Seleccionado #${activeIndex+1} (${shape.layer}): ${fmt(shape.bounds.width)} × ${fmt(shape.bounds.height)} mm, ${shape.closed?'cerrado':'abierto'}.`:''}`;
  node('cad-report-json').disabled=!current;node('cad-report-csv').disabled=!current;
  comparison();
 }
 async function read(event){
  const file=event.target.files?.[0];if(!file)return;
  const ticket=++requestId;current=null;sourceName='';activeLayer='*';activeIndex=-1;refresh();
  try{
   if(!/\.dxf$/i.test(file.name))throw new Error('Selecciona un archivo .dxf.');
   if(file.size>CAD.MAX_BYTES)throw new Error('Archivo de más de 2 MB: rechazo por seguridad.');
   const val=node('cad-units').value;
   const parsed=CAD.parseDocument(await file.text(),{unitsOverride:val==='auto'?null:Number(val)});
   if(ticket!==requestId)return;
   current=parsed;sourceName=file.name.slice(0,128);activeIndex=0;
   status(`DXF leído (${file.name.slice(0,90)}). ${current.contours.length} elementos y ${current.layers.length} capas. SOLO INSPECCIÓN: geometría NO incorporada a simulación ni CNC.`);
  }catch(e){if(ticket===requestId)status('Importación rechazada: '+(e?.message||'error desconocido'),true);}
  finally{event.target.value='';if(ticket===requestId)refresh();}
 }
 function downloadReport(format){
  if(!current)return;
  try{
   const report=CAD.report(current,{fileName:sourceName});
   const data=format==='json'?JSON.stringify(report,null,2):CAD.reportCSV(report);
   const type=format==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8';
   const filename=`plegar-pro-informe-dxf.${format}`;
   const url=URL.createObjectURL(new Blob([data],{type})),anchor=document.createElement('a');
   anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();
   // Las descargas son una interacción explícita. La app NO sube el DXF a ningún servidor.
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   status('Informe '+format.toUpperCase()+' generado para descarga. Datos NO VERIFICADOS; no es plano de fabricación.');
  }catch(e){status('No se pudo exportar el informe: '+e.message,true);}
 }
 function mount(element,referenceGetter){
  if(!element)return;
  host=element;current=null;getReference=referenceGetter;activeLayer='*';activeIndex=-1;
  host.innerHTML=`<section class="cad-import-panel" aria-label="Importador de perfil CAD 2D"><strong>Importar DXF 2D · v0.16</strong><p>Inspección local de DXF ASCII: entidades <b>LINE, LWPOLYLINE (con bulge), ARC y CIRCLE</b> en varias capas. Máximo 2 MB, 100 entidades y 1500 puntos de vista previa. No admite SPLINE, INSERT, 3D, DWG ni STEP. Los arcos se discretizan solo para dibujar, con aproximación máxima de 0,04 mm.</p><label class="ed-cell"><span>Unidades del archivo</span><select id="cad-units"><option value="auto">Leer $INSUNITS del DXF</option><option value="4">mm — confirmación manual</option><option value="1">pulgadas — confirmación manual</option><option value="5">cm — confirmación manual</option><option value="6">metros — confirmación manual</option></select></label><label class="cad-file"><span>Seleccionar DXF para inspección</span><input id="cad-file-input" type="file" accept=".dxf" aria-label="Importar DXF 2D"></label><div class="cad-select-row"><label class="ed-cell"><span>Capa a visualizar</span><select id="cad-layer" disabled><option value="*">Todas las capas</option></select></label><label class="ed-cell"><span>Contorno a comparar</span><select id="cad-contour" disabled><option value="">Sin contornos</option></select></label></div><svg id="cad-preview" viewBox="0 0 200 80" role="img" aria-label="Vista previa del perfil importado"></svg><p class="cad-metrics" id="cad-metrics">—</p><p class="cad-comparison" id="cad-comparison">Importa un DXF para comparar las dimensiones de un contorno con una ficha seleccionada.</p><div class="cad-export-actions"><button type="button" id="cad-report-json" disabled>Informe JSON</button><button type="button" id="cad-report-csv" disabled>Informe CSV</button></div><p class="cad-status" id="cad-status" role="status">El archivo se procesa en tu dispositivo, sin enviarlo al servidor.</p><p class="cad-danger"><b>SIN VERIFICAR · SOLO INSPECCIÓN.</b> Las entidades LINE separadas no se conectan automáticamente. Los contornos no pasan al motor CAD 3D, a la simulación, al utillaje activo ni al CNC. Faltan radios reales, tolerancias, amarre, solidez y validación de colisiones.</p></section>`;
  node('cad-file-input').addEventListener('change',read);
  node('cad-report-json').addEventListener('click',()=>downloadReport('json'));
  node('cad-report-csv').addEventListener('click',()=>downloadReport('csv'));
  node('cad-layer').addEventListener('change',e=>{activeLayer=e.target.value;refresh();});
  node('cad-contour').addEventListener('change',e=>{activeIndex=Number(e.target.value);refresh();});
 }
 window.PlegarCadImport={mount,refresh,getCurrent:()=>current,getSelected:()=>selected()};
})();
