/* v0.14 — ficha de inspección de DXF para Programación 2D. No modifica el proyecto. */
(function(){'use strict';
 const CAD=window.PlegarCadProfile;
 let host=null,current=null,getReference=null;
 const fmt=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(n);
 function node(id){return host?.querySelector('#'+id);}
 function status(s,error=false){const el=node('cad-status');if(el){el.textContent=s;el.dataset.error=String(error);}}
 function preview(shape){
  const svg=node('cad-preview'),NS='http://www.w3.org/2000/svg';svg.replaceChildren();
  const b=shape.bounds,pad=Math.max(1,Math.max(b.width,b.height)*.08),left=b.minX-pad,top=b.minY-pad;
  svg.setAttribute('viewBox',`0 0 ${Math.max(1,b.width+2*pad)} ${Math.max(1,b.height+2*pad)}`);
  const p=document.createElementNS(NS,'polyline');
  const points=shape.closed?[...shape.points,shape.points[0]]:shape.points;
  p.setAttribute('points',points.map(v=>`${v.x-left},${b.maxY+pad-v.y}`).join(' '));
  p.setAttribute('fill','none');p.setAttribute('stroke','#68c8ff');p.setAttribute('stroke-width',String(Math.max(.02,Math.max(b.width,b.height)*.006)));p.setAttribute('vector-effect','non-scaling-stroke');p.setAttribute('stroke-linejoin','round');svg.appendChild(p);
  svg.setAttribute('aria-label',`Contorno ${shape.closed?'cerrado':'abierto'} de ${shape.points.length} puntos, ancho ${fmt(b.width)} y alto ${fmt(b.height)} milímetros`);
 }
 function refresh(){
  const panel=node('cad-comparison');if(!panel)return;
  if(!current){panel.textContent='Importa un DXF para comparar sus dimensiones con la ficha seleccionada.';return;}
  const r=getReference?.();
  if(!r){panel.textContent='No hay ficha de fabricante seleccionada.';return;}
  const result=CAD.compareBounds(current,r);
  const height=`Δ altura ${fmt(result.heightDelta)} mm`;
  const width=result.widthDelta===null?' · ancho no indicado en ficha':` · Δ ancho ${fmt(result.widthDelta)} mm`;
  const verdict=result.heightMatch&&(result.widthMatch===null||result.widthMatch)?'Coincidencia de cotas nominales (NO validada)':'Diferencia de cotas nominales';
  panel.textContent=`${r.manufacturer} ${r.orderNumber}: ${height}${width}. ${verdict}. Tolerancia de comparación ±${fmt(result.tolerance)} mm; orientación elegida automáticamente (${result.orientation}). ${result.warning}`;
 }
 async function read(event){
  const file=event.target.files?.[0];if(!file)return;
  current=null;node('cad-preview').replaceChildren();node('cad-metrics').textContent='—';
  try{
   if(!/\.dxf$/i.test(file.name))throw new Error('Selecciona un archivo .dxf.');
   if(file.size>CAD.MAX_BYTES)throw new Error('Archivo de más de 2 MB: rechazo por seguridad.');
   const unitInput=node('cad-units').value;
   current=CAD.parse(await file.text(),{unitsOverride:unitInput==='auto'?null:Number(unitInput)});
   preview(current);
   const b=current.bounds;
   node('cad-metrics').textContent=`${file.name.slice(0,90)} · ${current.units}${current.assumedUnits?' (unidades indicadas manualmente)':''} · ${current.points.length} vértices · ${current.closed?'cerrado':'abierto'} · X ${fmt(b.width)} mm · Y ${fmt(b.height)} mm · perímetro/longitud ${fmt(b.length)} mm.`;
   status('DXF leído y medidas calculadas. SOLO INSPECCIÓN: el perfil NO se incorpora a utillaje, simulación ni CNC.');
  }catch(e){status('Importación rechazada: '+(e?.message||'error desconocido'),true);}
  finally{event.target.value='';refresh();}
 }
 function mount(element,referenceGetter){
  if(!element)return;
  host=element;current=null;getReference=referenceGetter;
  host.innerHTML=`<section class="cad-import-panel" aria-label="Importador de perfil CAD 2D"><strong>Importar perfil CAD · v0.14</strong><p>Revisión de <b>DXF ASCII 2D</b> con una sola LWPOLYLINE de segmentos rectos. Máximo 2 MB. No importa STEP, DWG, SPLINE, ARC, 3D ni trayectorias CNC.</p><label class="ed-cell"><span>Unidades del archivo</span><select id="cad-units"><option value="auto">Leer $INSUNITS del DXF</option><option value="4">mm — confirmación manual</option><option value="1">pulgadas — confirmación manual</option><option value="5">cm — confirmación manual</option><option value="6">metros — confirmación manual</option></select></label><label class="cad-file"><span>Seleccionar DXF para inspección</span><input id="cad-file-input" type="file" accept=".dxf" aria-label="Importar DXF 2D"></label><svg id="cad-preview" viewBox="0 0 200 80" role="img" aria-label="Vista previa del perfil importado"></svg><p class="cad-metrics" id="cad-metrics">—</p><p class="cad-comparison" id="cad-comparison">Importa un DXF para comparar sus dimensiones con la ficha seleccionada.</p><p class="cad-status" id="cad-status" role="status">Selecciona un DXF. El archivo se procesa localmente, sin enviarlo al servidor.</p><p class="cad-danger"><b>SIN VERIFICAR · SOLO CONSULTA.</b> Comparar cajas envolventes no acredita identidad, radios, solidez, amarre, tolerancias, capacidad ni seguridad. No altera la pieza ni selecciona la herramienta.</p></section>`;
  node('cad-file-input').addEventListener('change',read);
 }
 window.PlegarCadImport={mount,refresh,getCurrent:()=>current};
})();
