/* Plegar Pro Plus v0.16 — inspección CAD DXF multicapas y arcos.
 * Los datos DXF quedan aislados: no modifican piezas, geometría CNC ni catálogo.
 */
(function(){'use strict';
 const CAD=window.PlegarCadProfile;
 const ORIENT=window.PlegarCadOrientation;
 let host=null,current=null,getReference=null,activeLayer='*',activeIndex=-1,requestId=0,sourceName='',sourceMeta=null;
 const fmt=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(n);
 function node(id){return host?.querySelector('#'+id);}
 function status(text,error=false){const el=node('cad-status');if(el){el.textContent=text;el.dataset.error=String(error);}}
 function setOptions(select,items){select.replaceChildren(...items.map(([value,title])=>new Option(title,String(value))));}
 function selected(){return current?.contours?.[activeIndex]||null;}
 function options(){return {rotation:Number(node('cad-rotation')?.value||0),mirror:node('cad-mirror')?.checked===true,anchor:node('cad-origin')?.value||'min-min',tolerance:Number(node('cad-tolerance')?.value??0.5)};}
 function oriented(){const shape=selected();return shape&&ORIENT?ORIENT.inspect(shape,options()):null;}
 function orientedPreview(){
  const svg=node('cad-oriented-preview');if(!svg)return;svg.replaceChildren();
  let out;try{out=oriented();}catch(e){svg.setAttribute('viewBox','0 0 220 120');node('cad-orientation-metrics').textContent='Orientación no válida: '+e.message;return;}
  if(!out){svg.setAttribute('viewBox','0 0 220 120');node('cad-orientation-metrics').textContent='Importa y selecciona un contorno para orientar.';return;}
  const ns='http://www.w3.org/2000/svg',b=out.bounds,pad=Math.max(4,Math.max(b.width,b.height)*.1),left=Math.min(0,b.minX)-pad,right=Math.max(0,b.maxX)+pad,bottom=Math.min(0,b.minY)-pad,top=Math.max(0,b.maxY)+pad;
  svg.setAttribute('viewBox',`${left} ${-top} ${Math.max(1,right-left)} ${Math.max(1,top-bottom)}`);
  const path=document.createElementNS(ns,'polyline'),pts=out.closed?[...out.points,out.points[0]]:out.points;
  path.setAttribute('points',pts.map(p=>`${p.x},${-p.y}`).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke','#4ee0ff');path.setAttribute('stroke-width','3');path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('stroke-linejoin','round');svg.appendChild(path);
  const axis=document.createElementNS(ns,'path'),size=Math.max(3,pad*.45);axis.setAttribute('d',`M ${-size},0 H ${size} M 0,${-size} V ${size}`);axis.setAttribute('stroke','#ffbe72');axis.setAttribute('fill','none');axis.setAttribute('stroke-width','2');axis.setAttribute('vector-effect','non-scaling-stroke');svg.appendChild(axis);
  svg.setAttribute('aria-label',`Contorno orientado ${out.options.rotation} grados, origen nominal marcado con cruz naranja, anchura ${fmt(b.width)} y altura ${fmt(b.height)} milímetros`);
  node('cad-orientation-metrics').textContent=`Envolvente orientada ${fmt(b.width)} × ${fmt(b.height)} mm · origen DXF (${fmt(out.origin.x)}, ${fmt(out.origin.y)}) mm · eje relativo X: ${fmt(b.minX)} a ${fmt(b.maxX)} mm; Y: ${fmt(b.minY)} a ${fmt(b.maxY)} mm. Cruz naranja: origen NOMINAL, NO amarre mecánico.`;
 }
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
  let out=null;try{out=oriented();}catch(e){el.textContent=`Orientación no válida: ${e.message}`;return;}
  if(!out){el.textContent='Selecciona un contorno para cotejar cotas.';return;}
  try{
   const comp=ORIENT.checkDimensions(out,getReference?.());
   if(!comp.compared){el.textContent=comp.notice;return;}
   const other=comp.widthDelta===null?'ancho no documentado':`Δ ancho X ${fmt(comp.widthDelta)} mm`;
   const yes=comp.heightMatch&&(comp.widthMatch===null||comp.widthMatch);
   el.textContent=`Orientación ${out.options.rotation}°${out.options.mirror?' + espejo':''} · ${comp.manufacturer} ${comp.orderNumber}: Δ altura Y ${fmt(comp.heightDelta)} mm · ${other}. ${yes?'Coincidencia NOMINAL, NO validada':'Dimensiones nominales diferentes'}. Tolerancia ±${fmt(comp.tolerance)} mm. ${comp.notice}`;
  }catch(e){el.textContent='Comparación no disponible: '+e.message;}
 }
 function refresh(){
  if(!host)return;
  updateSelectors();preview();orientedPreview();
  const shape=selected(),b=current?.bounds;
  node('cad-metrics').textContent=!current?'—':`${current.contours.length} elementos · ${current.layers.length} capas · ${current.points} vértices · ${current.units}${current.assumedUnits?' (confirmación manual)':''} · extensión total ${fmt(b.width)} × ${fmt(b.height)} mm · longitud dibujada ${fmt(b.length)} mm.${shape?` Seleccionado #${activeIndex+1} (${shape.layer}): ${fmt(shape.bounds.width)} × ${fmt(shape.bounds.height)} mm, ${shape.closed?'cerrado':'abierto'}.`:''}`;
  node('cad-report-json').disabled=!current;node('cad-report-csv').disabled=!current;
  for(const id of ['cad-rotation','cad-origin','cad-mirror','cad-tolerance'])node(id).disabled=!shape;
  comparison();
 }
 async function read(event){
  const file=event.target.files?.[0];if(!file)return;
  const ticket=++requestId;current=null;sourceName='';sourceMeta=null;activeLayer='*';activeIndex=-1;refresh();
  try{
   if(!/\.dxf$/i.test(file.name))throw new Error('Selecciona un archivo .dxf.');
   if(file.size>CAD.MAX_BYTES)throw new Error('Archivo de más de 2 MB: rechazo por seguridad.');
   const val=node('cad-units').value;
   const bytes=new Uint8Array(await file.arrayBuffer());
   const parsed=CAD.parseDocument(new TextDecoder('utf-8',{fatal:true}).decode(bytes),{unitsOverride:val==='auto'?null:Number(val)});
   const fingerprint=window.PlegarCadTrace?.sha256(bytes);
   if(ticket!==requestId)return;
   current=parsed;sourceName=file.name.slice(0,128);sourceMeta=fingerprint?Object.freeze({name:sourceName,bytes:bytes.length,sha256:fingerprint}):null;activeIndex=0;
   status(`DXF leído (${file.name.slice(0,90)}). ${current.contours.length} elementos y ${current.layers.length} capas. SOLO INSPECCIÓN: geometría NO incorporada a simulación ni CNC.`);
  }catch(e){if(ticket===requestId)status('Importación rechazada: '+(e?.message||'error desconocido'),true);}
  finally{event.target.value='';if(ticket===requestId){refresh();host?.dispatchEvent(new CustomEvent('plegar-cad-updated'));}}
 }
 function downloadReport(format){
  if(!current)return;
  try{
   const report=ORIENT.extendReport(CAD.report(current,{fileName:sourceName}),oriented(),getReference?.());
   const data=format==='json'?JSON.stringify(report,null,2):CAD.reportCSV(report)+'\r\n'+ORIENT.csvAppend(report.inspeccion_orientacion);
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
  host.innerHTML=`<section class="cad-import-panel" aria-label="Importador de perfil CAD 2D"><strong>Importar DXF 2D · v0.17</strong><p>Inspección local de DXF ASCII: entidades <b>LINE, LWPOLYLINE (con bulge), ARC y CIRCLE</b> en varias capas. Máximo 2 MB, 100 entidades y 1500 puntos de vista previa. No admite SPLINE, INSERT, 3D, DWG ni STEP. Los arcos se discretizan solo para dibujar, con aproximación máxima de 0,04 mm.</p><label class="ed-cell"><span>Unidades del archivo</span><select id="cad-units"><option value="auto">Leer $INSUNITS del DXF</option><option value="4">mm — confirmación manual</option><option value="1">pulgadas — confirmación manual</option><option value="5">cm — confirmación manual</option><option value="6">metros — confirmación manual</option></select></label><label class="cad-file"><span>Seleccionar DXF para inspección</span><input id="cad-file-input" type="file" accept=".dxf" aria-label="Importar DXF 2D"></label><div class="cad-select-row"><label class="ed-cell"><span>Capa a visualizar</span><select id="cad-layer" disabled><option value="*">Todas las capas</option></select></label><label class="ed-cell"><span>Contorno a comparar</span><select id="cad-contour" disabled><option value="">Sin contornos</option></select></label></div><svg id="cad-preview" viewBox="0 0 200 80" role="img" aria-label="Vista previa del perfil importado"></svg><p class="cad-metrics" id="cad-metrics">—</p><div class="cad-orient-panel"><strong>Orientación y referencia nominal · solo inspección</strong><div class="cad-orient-controls"><label class="ed-cell"><span>Giro en el plano</span><select id="cad-rotation" disabled><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><label class="ed-cell"><span>Origen nominal (envolvente DXF)</span><select id="cad-origin" disabled><option value="min-min">Inferior izquierdo</option><option value="min-max">Superior izquierdo</option><option value="max-min">Inferior derecho</option><option value="max-max">Superior derecho</option><option value="center">Centro geométrico de la envolvente</option></select></label><label class="ed-cell"><span>Tolerancia visual (mm)</span><input id="cad-tolerance" type="number" min="0" max="10" step="0.1" value="0.5" disabled></label><label class="cad-mirror"><input type="checkbox" id="cad-mirror" disabled> Reflejar en eje vertical local</label></div><svg id="cad-oriented-preview" role="img" aria-label="Vista orientada del perfil"></svg><p class="cad-metrics" id="cad-orientation-metrics">Selecciona un contorno para orientar.</p><p class="cad-danger">Origen de referencia solo ilustrativo: no representa sujeción, apoyo, tolerancias de montaje ni altura de trabajo real. Sin verificación mecánica ni CNC.</p></div><p class="cad-comparison" id="cad-comparison">Importa un DXF para comparar las dimensiones de un contorno con una ficha seleccionada.</p><div class="cad-export-actions"><button type="button" id="cad-report-json" disabled>Informe JSON</button><button type="button" id="cad-report-csv" disabled>Informe CSV</button></div><p class="cad-status" id="cad-status" role="status">El archivo se procesa en tu dispositivo, sin enviarlo al servidor.</p><p class="cad-danger"><b>SIN VERIFICAR · SOLO INSPECCIÓN.</b> Las entidades LINE separadas no se conectan automáticamente. Las orientaciones y los contornos no pasan al motor CAD 3D, a la simulación, al utillaje activo ni al CNC. Faltan radios reales, tolerancias, amarre, solidez y validación de colisiones.</p></section>`;
  node('cad-file-input').addEventListener('change',read);
  node('cad-report-json').addEventListener('click',()=>downloadReport('json'));
  node('cad-report-csv').addEventListener('click',()=>downloadReport('csv'));
  node('cad-layer').addEventListener('change',e=>{activeLayer=e.target.value;refresh();});
  node('cad-contour').addEventListener('change',e=>{activeIndex=Number(e.target.value);refresh();});
  for(const id of ['cad-rotation','cad-origin','cad-mirror','cad-tolerance'])node(id).addEventListener('change',refresh);
 }
 window.PlegarCadImport={mount,refresh,getCurrent:()=>current,getSelected:()=>selected(),getSourceMeta:()=>sourceMeta,getOriented:()=>oriented()};
})();
