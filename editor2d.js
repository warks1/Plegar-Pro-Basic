/* Programación 2D: editor de perfil geométrico y orden de pliegues.
   Ni la vista ni la longitud de ejes representan el desarrollo real, la fibra neutra,
   la recuperación elástica o una secuencia de fabricación validada. */
(function(){
'use strict';
const G = window.PlegarGeometry2D;
const C = window.PlegarBendCalc;
const L = window.PlegarToolLibrary;
const REF = window.PlegarManufacturerReferences;
let sourceFilter="all", sourceSelected=null;
const fromEditor = source => ({...G.validate(source),setup:C.validateSetup(source.setup)});
const STORAGE='plegarpro-editor2d-v1';
const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
const initial = {name:'Perfil omega (ejemplo)', material:'Acero S235JR', thickness:2, segments:[60,85,120,85,60], angles:[-90,90,90,-90], sequence:[1,2,3,4]};
let state = fromEditor(initial);
let planReference=null, planConfiguredId=null;
const Trace=window.PlegarPlanTrace;
let planVision={zoom:1,dx:0,dy:0,marking:false,pending:null,marks:[]};
function traceKey(id){return 'plegar-pro-plan-visual-v1:'+String(id).slice(0,100);}
function saveMarks(){if(!planReference)return;try{localStorage.setItem(traceKey(planReference.id),JSON.stringify(planVision.marks));}catch{inform('Las marcas no se pudieron guardar localmente.');}}
function loadMarks(id){try{return Trace.restore(JSON.parse(localStorage.getItem(traceKey(id))||'[]'));}catch{return [];}}
function stageTransform(){const stage=$('#ed-plan-stage');if(stage)stage.style.transform=`translate(${planVision.dx}px,${planVision.dy}px) scale(${planVision.zoom})`;const z=$('#ed-plan-zoom-label');if(z)z.textContent=Math.round(planVision.zoom*100)+' %';}
function zoomPlan(factor){planVision.zoom=Trace.clamp(Math.round(planVision.zoom*factor*100)/100,1,5);if(planVision.zoom===1){planVision.dx=0;planVision.dy=0;}stageTransform();}
function bindPlanViewer(){const frame=$('#ed-plan-viewer');if(!frame)return;let gesture=null;
 frame.onwheel=e=>{e.preventDefault();zoomPlan(e.deltaY<0?1.2:1/1.2);};
 frame.onpointerdown=e=>{
  if(e.button!==0||!e.isPrimary)return;
  if(planVision.marking){const r=$('#ed-plan-stage')?.getBoundingClientRect();if(!r)return;const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    try{const pt=Trace.point(x,y);if(!planVision.pending){planVision.pending=pt;}else{planVision.marks=Trace.append(planVision.marks,planVision.pending,pt);planVision.pending=null;saveMarks();}renderPlanReference();inform('Marca visual guardada. Confirma longitudes, ángulos y espesor en los campos: NO se infieren de la fotografía.');}catch(err){inform(err.message);}return;
  }
  if(planVision.zoom<=1)return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dx:planVision.dx,dy:planVision.dy};frame.setPointerCapture?.(e.pointerId);
 };
 frame.onpointermove=e=>{if(!gesture||e.pointerId!==gesture.id)return;const limX=frame.clientWidth*(planVision.zoom-1)/2,limY=frame.clientHeight*(planVision.zoom-1)/2;planVision.dx=Trace.clamp(gesture.dx+e.clientX-gesture.x,-limX,limX);planVision.dy=Trace.clamp(gesture.dy+e.clientY-gesture.y,-limY,limY);stageTransform();};
 frame.onpointerup=frame.onpointercancel=e=>{if(gesture?.id===e.pointerId)gesture=null;};
 stageTransform();
}

let selected=1, undoStack=[], redoStack=[], isInitialized=false;
function clone(value){return JSON.parse(JSON.stringify(value));}
function inform(message){const el=$('#editor-status');if(el){el.textContent=message;el.setAttribute('role','status');}}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));return true;}catch(e){inform('El navegador no pudo guardar los datos locales. Exporta un archivo JSON.');return false;}}
function modify(fn){
 const next=clone(state);
 fn(next);
 try{state=fromEditor(next);}catch(error){inform(error.message);return false;}
 undoStack.push(clone(fromEditor(lastState()))); // estado anterior exacto
 if(undoStack.length>50)undoStack.shift();redoStack=[];
 selected=Math.min(selected,state.angles.length);
 persist();render();return true;
}
// Se guarda la versión previa explícitamente al entrar en cada modificación.
let historySource=null;
function lastState(){return historySource || state;}
function edit(fn){historySource=clone(state);try{return modify(fn);}finally{historySource=null;}}
function history(action){const from=action==='undo'?undoStack:redoStack, to=action==='undo'?redoStack:undoStack;if(!from.length)return;to.push(clone(state));state=from.pop();selected=Math.min(selected,state.angles.length);persist();render();inform(action==='undo'?'Cambio deshecho.':'Cambio rehecho.');}
function readNumber(input,min,max){const v=Number(input.value);if(!input.value.trim()||!Number.isFinite(v)||v<min||v>max){inform(`Valor no válido: ${input.getAttribute('aria-label')||input.name||'campo'}.`);render();return null;}return v;}
function draw(){
 const points=G.vertices(state);
 const minX=Math.min(...points.map(p=>p.x)), maxX=Math.max(...points.map(p=>p.x));
 const minY=Math.min(...points.map(p=>p.y)), maxY=Math.max(...points.map(p=>p.y));
 const scale=Math.min(600/Math.max(30,maxX-minX),322/Math.max(30,maxY-minY));
 const offX=(760-(maxX-minX)*scale)/2,offY=(460-(maxY-minY)*scale)/2;
 const cv=p=>({x:offX+(p.x-minX)*scale,y:offY+(maxY-p.y)*scale});
 const coords=points.map(cv);
 const polylines=coords.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
 const labels=coords.slice(0,-1).map((p,i)=>{
  const q=coords[i+1];const midX=(p.x+q.x)/2,midY=(p.y+q.y)/2;
  return `<text class="ed-dim" x="${midX.toFixed(2)}" y="${(midY-12).toFixed(2)}" text-anchor="middle">${fmt(state.segments[i])} mm</text>`;
 }).join('');
 const bends=coords.slice(1,-1).map((p,i)=>{
  const id=i+1;
  return `<g data-ed-bend="${id}" class="ed-bend-point ${selected===id?'current':''}" role="button" tabindex="0" aria-label="Seleccionar pliegue ${id}"><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="16"/><text x="${p.x.toFixed(2)}" y="${(p.y+4).toFixed(2)}" text-anchor="middle">${id}</text></g>`;
 }).join('');
 $('#ed-svg').innerHTML=`<defs><pattern id="ed-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#21445c" stroke-width=".8"/></pattern></defs><rect width="760" height="460" fill="url(#ed-grid)"/><polyline points="${polylines}" stroke="#031321" stroke-width="13" fill="none" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${polylines}" stroke="#5bc8ff" stroke-width="7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>${labels}${bends}`;
 $('#ed-total').textContent=`${fmt(G.totalLength(state))} mm nominales entre vértices`;
 $('#ed-count').textContent=`${state.segments.length} tramos · ${state.angles.length} pliegues`;
}
function render(){
 if(!$('#ed-svg'))return;
 renderPlanReference();
 $('#ed-name').value=state.name;
 $('#ed-material').value=state.material;
 $('#ed-thickness').value=String(state.thickness);
 $('#ed-radius').value=String(state.setup.radius);
 $('#ed-kfactor').value=String(state.setup.kFactor);
 $('#ed-punch').value=state.setup.punch;
 $('#ed-die').value=state.setup.die;
 $('#ed-backgauge').value=String(state.setup.backgaugeX);
 $('#ed-tool-punch').textContent=L.details(L.get('punch',state.setup.punch));
 $('#ed-tool-die').textContent=L.details(L.get('die',state.setup.die));
 renderOfficialReferences();
 $('#ed-segments').innerHTML=state.segments.map((length,i)=>`<label class="ed-cell"><span>Tramo ${i+1} (mm)</span><input type="number" min="0.1" max="100000" step="0.1" inputmode="decimal" data-ed-segment="${i}" aria-label="Longitud tramo ${i+1}" value="${length}"></label>`).join('');
 $('#ed-angles').innerHTML=state.angles.map((value,i)=>`<label class="ed-cell"><span>Pliegue ${i+1} (°)</span><input type="number" min="-179" max="179" step="1" inputmode="decimal" data-ed-angle="${i}" aria-label="Ángulo firmado pliegue ${i+1}" value="${value}"></label>`).join('');
 $('#ed-order').innerHTML=state.sequence.map((id,i)=>`<button class="ed-order-item ${selected===id?'current':''}" data-ed-select="${id}" type="button" aria-pressed="${selected===id}"><strong>${i+1}</strong> Pliegue ${id} <small>${state.angles[id-1]>0?'+':''}${fmt(state.angles[id-1])}°</small></button>`).join('');
 $('#ed-undo').disabled=!undoStack.length;$('#ed-redo').disabled=!redoStack.length;
 $('#ed-remove').disabled=state.segments.length<=2;
 $('#ed-up').disabled=state.sequence.indexOf(selected)<=0;
 $('#ed-down').disabled=state.sequence.indexOf(selected)>=state.sequence.length-1;
 draw();renderCalc();window.PlegarForming2D?.refresh();inform('Perfil actualizado. Estimación de desarrollo no validada para fabricación.');
}
function renderPlanReference(){
 const target=$('#ed-plan-reference');if(!target)return;
 if(!planReference){target.hidden=true;target.innerHTML='';return;}
 const previous={};for(const id of ['length1','length2','angle','thickness'])previous[id]=$('#ed-plan-'+id)?.value??'';
 target.hidden=false;const valid=planConfiguredId===planReference.id;
 const src=planReference.preview||planReference.thumbnail||'';
 const pic=/^(data:image\/(jpeg|png|webp);base64,|planos\/trenirtrade\/(?:vistas|miniaturas)\/)/.test(src)?`<img src="${esc(src)}" alt="Plano de referencia ampliable" draggable="false" loading="eager"/>`:'<span class="ed-plan-unavailable">Este plano no tiene imagen disponible; abre el PDF original.</span>';
 const marks=Trace.svg(planVision.marks,planVision.pending);
 const markText=planVision.pending?'Marca el segundo extremo para completar la línea.':`${planVision.marks.length} línea(s) visual(es) B1–B${planVision.marks.length||1}. No contienen cotas.`;
 target.innerHTML=`<div class="ed-plan-header"><strong>PLANO EN PROGRAMACIÓN · ${esc(planReference.name)}</strong><span>${esc(planReference.source)}</span></div>
 <div class="ed-plan-visual"><div class="ed-plan-visual-toolbar" role="toolbar" aria-label="Visor del plano"><button type="button" id="ed-plan-zoom-out" aria-label="Reducir plano">− Zoom</button><span id="ed-plan-zoom-label">100 %</span><button type="button" id="ed-plan-zoom-in" aria-label="Ampliar plano">+ Zoom</button><button type="button" id="ed-plan-zoom-reset">Centrar</button><button type="button" id="ed-plan-mark-mode" aria-pressed="${planVision.marking}" class="${planVision.marking?'active':''}">✎ Marcar pliegue</button><button type="button" id="ed-plan-undo-mark" ${planVision.marks.length||planVision.pending?'':'disabled'}>Deshacer marca</button></div>
 <div id="ed-plan-viewer" class="ed-plan-viewer ${planVision.marking?'is-marking':''}" aria-label="Visor del plano. Usa zoom y arrastra para desplazarte. Marca dos extremos por línea visual." tabindex="0"><div class="ed-plan-stage" id="ed-plan-stage">${pic}<svg class="ed-plan-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${marks}</svg></div></div><p class="ed-plan-visual-note" id="ed-plan-visual-note">${markText} ${planVision.marking?'Modo marcar activo: pulsa dos puntos sobre el dibujo.':'Usa +/− para ampliar y arrastra con un dedo para mover.'}</p></div>
 <div class="ed-plan-body"><div><p><b>${valid?'Perfil editable creado':'Geometría pendiente de introducir'}</b>. Las marcas son orientativas; el simulador utiliza solo las medidas y ángulos confirmados manualmente. <b>SIN VERIFICAR / NO CNC.</b></p><div class="ed-plan-inputs"><label>Tramo 1 (mm)<input id="ed-plan-length1" type="number" min="0.1" max="100000" step="0.1" value="" placeholder="Ej. 30" /></label><label>Tramo 2 (mm)<input id="ed-plan-length2" type="number" min="0.1" max="100000" step="0.1" value="" placeholder="Ej. 30" /></label><label>Ángulo firmado (°)<input id="ed-plan-angle" type="number" min="-179" max="179" value="" placeholder="Ej. 90" /></label><label>Espesor (mm)<input id="ed-plan-thickness" type="number" min="0.1" max="100" step="0.1" value="" placeholder="Ej. 1.5" /></label></div><div class="ed-actions"><button id="ed-plan-create" type="button">Crear perfil 2D desde las medidas indicadas</button><button id="ed-plan-sim2d" type="button" ${!valid?'disabled':''}>Simular 2D</button><button id="ed-plan-sim3d" type="button" ${!valid?'disabled':''}>Simular 3D</button></div>${planReference.pdfUrl?`<a href="${esc(planReference.pdfUrl)}" target="_blank" rel="noopener noreferrer">Abrir PDF original en otra pestaña</a>`:''}</div></div>`;
 for(const [id,value] of Object.entries(previous))if($('#ed-plan-'+id))$('#ed-plan-'+id).value=value;
 bindPlanViewer();
}
function setPlanReference(ref){if(!ref||!ref.id)return;const changed=planReference?.id!==ref.id;planReference=ref;planConfiguredId=null;if(changed)planVision={zoom:1,dx:0,dy:0,marking:false,pending:null,marks:loadMarks(ref.id)};renderPlanReference();}
function configurePlan(){if(!planReference)return;const ids=['length1','length2','angle','thickness'];const values=ids.map(id=>Number($('#ed-plan-'+id)?.value));if(ids.some((id,i)=>!$('#ed-plan-'+id)?.value.trim()||!Number.isFinite(values[i]))||values[0]<=0||values[1]<=0||values[0]>100000||values[1]>100000||Math.abs(values[2])>179||Math.abs(values[2])<.01||values[3]<.1||values[3]>100){inform('Introduce dos tramos positivos, un ángulo distinto de 0° y el espesor real del plano.');return;}
 const previous=clone(state);try{state=fromEditor({name:planReference.name.replace(/\.pdf$/i,''),material:'Acero S235JR',thickness:values[3],segments:values.slice(0,2),angles:[values[2]],sequence:[1]});}catch(e){inform(e.message);return;}
 undoStack.push(previous);redoStack=[];selected=1;planConfiguredId=planReference.id;persist();render();inform('Perfil inicial creado desde las medidas que has introducido. Completa los demás pliegues antes de simular. NO CNC.');}
function renderOfficialReferences(){
 const dropdown=$('#ed-ref-item'), filter=$('#ed-ref-filter');if(!dropdown||!REF)return;
 filter.value=sourceFilter;
 const items=REF.list(sourceFilter);
 if(!items.some(r=>r.id===sourceSelected))sourceSelected=items[0]?.id||null;
 dropdown.innerHTML=items.map(r=>`<option value="${esc(r.id)}">${esc(r.model)} (${esc(r.orderNumber)})</option>`).join('');
 dropdown.value=sourceSelected||'';
 const record=REF.get(sourceSelected);
 if(!record)return;
 $('#ed-ref-family').textContent=`${record.manufacturer} · ${record.family} · ref. ${record.orderNumber}`;
 $('#ed-ref-dimensions').textContent=REF.summary(record);
 $('#ed-ref-mounting').textContent=`${record.mounting}. ${record.note}`;
 $('#ed-ref-origin').textContent=`Fuente: ${record.source.title} · consultada ${record.source.inspected} · revisión ${record.source.revision||'no indicada'}.`;
 const a=$('#ed-ref-link');a.href=record.source.url;
 const catalogs=$('#ed-ref-catalogs');
 catalogs.replaceChildren();
 for(const item of REF.SOURCES){
  const link=document.createElement('a');link.href=item.source.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${item.manufacturer}: ${item.source.title}`;
  catalogs.appendChild(link);
 }
 window.PlegarCadImport?.refresh();
}
function renderCalc(){
 const result=C.estimate(state,state.setup);
 $('#ed-flat').textContent=result.flat===null?'No calculable':`${fmt(result.flat)} mm`;
 $('#ed-deduction').textContent=`${fmt(result.deduction)} mm`;
 $('#ed-allowance').textContent=`${fmt(result.allowance)} mm`;
 $('#ed-vratio').textContent=`${fmt(result.vRatio)} × espesor`;
 $('#ed-bend-table').innerHTML=result.rows.map(row=>`<tr><th scope="row">${row.bend}</th><td>${fmt(row.angle)}°</td><td>${fmt(row.inside)}°</td><td>${fmt(row.allowance)}</td><td>${fmt(row.deduction)}</td></tr>`).join('');
 const warnings=[...result.problems,...result.warnings];
 $('#ed-calc-warnings').innerHTML=warnings.map(line=>`<li>${esc(line)}</li>`).join('');
 $('#ed-calc-result').setAttribute('data-calculable',String(result.flat!==null));
}
function layout(){return `<section class="editor2d" aria-label="Editor de programación 2D">
 <div class="ed-toolbar"><span class="ed-chip">EDITOR GEOMÉTRICO · v0.7</span><div class="ed-actions"><button type="button" id="ed-undo" aria-label="Deshacer">↶ Deshacer</button><button type="button" id="ed-redo" aria-label="Rehacer">↷ Rehacer</button><button type="button" id="ed-save">Guardar</button><button type="button" id="ed-export">Exportar JSON</button><label class="ed-import">Importar JSON<input type="file" id="ed-import" accept=".json,application/json" aria-label="Importar pieza JSON"></label></div></div>
 <div class="ed-plan-reference" id="ed-plan-reference" hidden></div><div class="ed-grid"><div class="ed-primary"><div class="ed-canvas-top"><strong>PERFIL 2D DE LA PIEZA</strong><span id="ed-count"></span></div><svg id="ed-svg" viewBox="0 0 760 460" role="img" aria-label="Perfil de ejes de chapa y pliegues numerados"></svg><div class="ed-caption"><strong id="ed-total"></strong><span>Ángulo firmado: positivo antihorario, negativo horario. Los tramos representan ejes rectos nominales.</span></div><p class="ed-warning">Perfil dibujado entre vértices teóricos agudos. El cálculo orientativo de desarrollo se muestra debajo, con hipótesis explícitas. No sustituye validación de plegado real ni constituye un programa CNC.</p><div class="f2-inline" id="ed-forming"></div><div class="ed-section ed-calculation"><div class="ed-section-head"><strong>Estimación del desarrollo · hipótesis geométrica</strong><span>Longitudes entre vértices teóricos (no cotas exteriores/interiores)</span></div><div class="ed-results"><div id="ed-calc-result"><small>Desarrollo nominal estimado</small><strong id="ed-flat"></strong></div><div><small>Deducción total</small><strong id="ed-deduction"></strong></div><div><small>Suma BA (arcos)</small><strong id="ed-allowance"></strong></div><div><small>Apertura V/e</small><strong id="ed-vratio"></strong></div></div><p class="ed-table-hint">Desliza la tabla hacia los lados para consultar todas las columnas →</p><div class="ed-table-wrap" tabindex="0" role="region" aria-label="Tabla de cotas por pliegue: desplázate horizontalmente"><table class="ed-bend-table"><thead><tr><th>Pliegue</th><th>Giro</th><th>Ángulo interior</th><th>BA (mm)</th><th>BD (mm)</th></tr></thead><tbody id="ed-bend-table"></tbody></table></div><p class="ed-equation">BA = θ(rad) × (Ri + K × e) · BD = 2 × (Ri + e) × tan(θ/2) − BA · Desarrollo = Σ tramos nominales − Σ BD</p><ul id="ed-calc-warnings" class="ed-calc-warnings"></ul></div><div class="ed-section"><div class="ed-section-head"><strong>Orden de plegado</strong><span>Selecciona un pliegue y muévelo en la secuencia</span></div><div id="ed-order" class="ed-order"></div><div class="ed-actions"><button type="button" id="ed-up">↑ Adelantar</button><button type="button" id="ed-down">↓ Retrasar</button></div></div></div>
 <div class="ed-controls"><div class="ed-section"><strong>Datos de la pieza</strong><label class="ed-cell"><span>Nombre</span><input id="ed-name" maxlength="70" autocomplete="off"></label><label class="ed-cell"><span>Material (texto de proyecto)</span><select id="ed-material"><option value="Acero S235JR">Acero S235JR</option><option value="Acero S355JR">Acero S355JR</option><option value="Inox 304">Inox 304</option><option value="Aluminio 5754">Aluminio 5754</option></select></label><label class="ed-cell"><span>Espesor nominal (mm)</span><input id="ed-thickness" type="number" min="0.1" max="100" step="0.1" inputmode="decimal"></label></div>
 <div class="ed-section"><strong>Parámetros de desarrollo</strong><label class="ed-cell"><span>Radio interior supuesto Ri (mm) · introducido por usuario</span><input id="ed-radius" type="number" min="0.1" max="500" step="0.1" inputmode="decimal"></label><label class="ed-cell"><span>Factor K (0,20–0,60) · ajustar con ensayo</span><input id="ed-kfactor" type="number" min="0.2" max="0.6" step="0.01" inputmode="decimal"></label><label class="ed-cell"><span>Punzón — biblioteca nominal sin verificar</span><select id="ed-punch">${C.PUNCHES.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label class="ed-cell"><span>Matriz — biblioteca nominal sin verificar</span><select id="ed-die">${C.DIES.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label><div class="ed-tool-card" aria-label="Ficha de herramienta seleccionada"><strong>Fichas de utillaje · biblioteca paramétrica v0.12</strong><p><b>Punzón:</b> <span id="ed-tool-punch"></span></p><p><b>Matriz:</b> <span id="ed-tool-die"></span></p><p class="ed-tool-warning">Modelos internos SIN VERIFICAR. No se atribuyen a MECOS, AMADA ni a otros fabricantes; comprobar DXF oficial, tolerancias, amarre y altura real antes de fabricar.</p></div><div class="ed-reference-library" aria-label="Referencias dimensionales de fabricantes"><strong>Referencias de fabricante · v0.13</strong><p class="ed-ref-note">Cotas documentadas de herramientas AMADA concretas. <b>SOLO CONSULTA:</b> no cambian el punzón o la matriz genéricos del cálculo ni su simulación. No hay DXF/CAD completo ni compatibilidad certificada.</p><label class="ed-cell"><span>Tipo de útil documentado</span><select id="ed-ref-filter"><option value="all">Todos</option><option value="punch">Punzones</option><option value="die">Matrices</option></select></label><label class="ed-cell"><span>Referencia concreta de fabricante</span><select id="ed-ref-item"></select></label><div class="ed-ref-details" role="group" aria-label="Ficha oficial de dimensiones"><b id="ed-ref-family"></b><p id="ed-ref-dimensions"></p><p id="ed-ref-mounting"></p><p id="ed-ref-origin"></p><a id="ed-ref-link" href="#" target="_blank" rel="noopener noreferrer">Abrir ficha o catálogo del fabricante ↗</a></div><div class="ed-ref-catalogs" id="ed-ref-catalogs" aria-label="Catálogos de fabricante"></div><p class="ed-ref-warning">Dimensiones publicadas por fabricante ≠ sólido CAD verificado. El modelo geométrico seleccionado arriba sigue siendo interno y SIN VERIFICAR. No usar estas fichas como certificación de fabricación.</p></div><div id="ed-cad-slot"></div><label class="ed-cell"><span>Posición nominal del tope X desde el eje de plegado (mm)</span><input id="ed-backgauge" type="number" min="1" max="10000" step="0.1" inputmode="decimal"></label><p class="ed-mini">El tope es una referencia fija y genérica; el valor X no procede de una máquina real. La V seleccionada no determina automáticamente el radio; se introduce Ri por separado. El cálculo no predice recuperación elástica, fuerza, interferencias ni ala mínima.</p></div><div class="ed-section"><div class="ed-section-head"><strong>Tramos rectos</strong><span>Longitudes en mm</span></div><div id="ed-segments" class="ed-fieldgrid"></div><div class="ed-actions"><button type="button" id="ed-add">+ Añadir tramo</button><button type="button" id="ed-remove">− Quitar último</button></div></div>
 <div class="ed-section"><div class="ed-section-head"><strong>Ángulos entre tramos</strong><span>Valores entre −179° y +179°</span></div><div id="ed-angles" class="ed-fieldgrid"></div></div></div></div><p id="editor-status" class="ed-status" role="status"></p></section>`;}
function change(event){
 const el=event.target;
 if(['ed-plan-length1','ed-plan-length2','ed-plan-angle','ed-plan-thickness'].includes(el.id)){
  if(planConfiguredId!==null){planConfiguredId=null;const a=$('#ed-plan-sim2d'),b=$('#ed-plan-sim3d');if(a)a.disabled=true;if(b)b.disabled=true;inform('Medidas modificadas: vuelve a pulsar Crear perfil para actualizar la simulación.');}
  return;
 }
 if(el.id==='ed-ref-filter'){sourceFilter=el.value;sourceSelected=null;renderOfficialReferences();return;}
 if(el.id==='ed-ref-item'){sourceSelected=el.value;renderOfficialReferences();return;}
 if(el.id==='ed-name'){const value=el.value.trim();if(!value){inform('El nombre no puede estar vacío.');render();return;}edit(d=>{d.name=value;});return;}
 if(el.id==='ed-material'){edit(d=>{d.material=el.value;});return;}
 if(el.id==='ed-radius'){const v=readNumber(el,.1,500);if(v!==null)edit(d=>{d.setup.radius=v;});return;}
 if(el.id==='ed-kfactor'){const v=readNumber(el,.2,.6);if(v!==null)edit(d=>{d.setup.kFactor=v;});return;}
 if(el.id==='ed-punch'){edit(d=>{d.setup.punch=el.value;});return;}
 if(el.id==='ed-die'){edit(d=>{d.setup.die=el.value;});return;}
 if(el.id==='ed-backgauge'){const v=readNumber(el,1,10000);if(v!==null)edit(d=>{d.setup.backgaugeX=v;});return;}
 if(el.id==='ed-thickness'){const v=readNumber(el,.1,100);if(v!==null)edit(d=>{d.thickness=v;});return;}
 if(el.matches('[data-ed-segment]')){const v=readNumber(el,.1,100000);if(v!==null)edit(d=>{d.segments[Number(el.dataset.edSegment)]=v;});return;}
 if(el.matches('[data-ed-angle]')){const v=readNumber(el,-179,179);if(v!==null)edit(d=>{d.angles[Number(el.dataset.edAngle)]=v;});return;}
}
function actions(event){
 const b=event.target.closest('button,[data-ed-bend]');if(!b)return;
 const sel=b.dataset.edSelect??b.dataset.edBend;
 if(sel){selected=Number(sel);render();return;}
 switch(b.id){
 case 'ed-plan-zoom-in':zoomPlan(1.3);return;
 case 'ed-plan-zoom-out':zoomPlan(1/1.3);return;
 case 'ed-plan-zoom-reset':planVision.zoom=1;planVision.dx=0;planVision.dy=0;stageTransform();return;
 case 'ed-plan-mark-mode':planVision.marking=!planVision.marking;planVision.pending=null;renderPlanReference();return;
 case 'ed-plan-undo-mark':if(planVision.pending)planVision.pending=null;else planVision.marks.pop();saveMarks();renderPlanReference();return;
 case 'ed-plan-create':configurePlan();return;
 case 'ed-plan-sim2d':if(planConfiguredId===planReference?.id)window.PlegarApp?.switchScreen('Simulación 2D');return;
 case 'ed-plan-sim3d':if(planConfiguredId===planReference?.id)window.PlegarApp?.switchScreen('Simulación 3D');return;
 case 'ed-add': if(state.segments.length>=G.MAX_SEGMENTS){inform('Máximo 24 tramos.');return;}edit(d=>{d.segments.push(60);d.angles.push(90);d.sequence.push(d.sequence.length+1);});break;
 case 'ed-remove': if(state.segments.length<=2)return;edit(d=>{d.segments.pop();d.angles.pop();d.sequence=d.sequence.filter(id=>id<=d.angles.length);});break;
 case 'ed-undo':history('undo');break;
 case 'ed-redo':history('redo');break;
 case 'ed-up':case 'ed-down':{
  const delta=b.id==='ed-up'?-1:1;
  edit(d=>{const at=d.sequence.indexOf(selected);const dest=at+delta;if(dest<0||dest>=d.sequence.length)return;[d.sequence[at],d.sequence[dest]]=[d.sequence[dest],d.sequence[at]];});break;
 }
 case 'ed-save':inform(persist()?'Datos guardados en este navegador.':'No se pudo guardar en este navegador.');break;
 case 'ed-export':{
  const content=JSON.stringify({format:'plegar-pro-profile2d',version:2,...state},null,2);
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='plegar-pro-perfil2d.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);inform('Archivo JSON de geometría exportado (no es CAD/CAM).');break;
 }
 }
}
async function imported(event){
 const file=event.target.files?.[0];if(!file)return;
 try{if(file.size>1024*1024)throw new Error('El archivo debe ocupar menos de 1 MB.');
  const incoming=JSON.parse(await file.text());
  if(incoming.format!=='plegar-pro-profile2d'||![1,2].includes(incoming.version))throw new Error('Formato de archivo no compatible.');
  const next=fromEditor(incoming);
  undoStack.push(clone(state));if(undoStack.length>50)undoStack.shift();redoStack=[];state=next;selected=1;persist();render();inform('Perfil importado y guardado.');
 }catch(e){inform(`No se pudo importar: ${e.message}`);}finally{event.target.value='';}
}
function mount(){
 const target=$('#module-sample');if(!target)return;
 target.innerHTML=layout();target.classList.remove('module-forming');target.classList.add('module-editor');
 window.PlegarCadImport?.mount($('#ed-cad-slot'),()=>REF.get(sourceSelected));
 const restored=loadLocal();if(restored)state=restored;
 window.PlegarForming2D.mount($('#ed-forming'),()=>clone(state),()=>selected,id=>{selected=id;render();});
 render();
 // Escucha delegada en el contenedor: la interfaz se reconstruye al cambiar de módulo.
 target.onchange=event=>{if(event.target.id==='ed-import')imported(event);else change(event);};
 target.onclick=actions;
 target.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-ed-bend]')){event.preventDefault();selected=Number(event.target.dataset.edBend);render();}};
 isInitialized=true;
}
function loadLocal(){try{const raw=localStorage.getItem(STORAGE);return raw?fromEditor(JSON.parse(raw)):null;}catch{return null;}}
window.PlegarEditor2D={mount,setPlanReference,getPlanReference:()=>planReference,isPlanConfigured:()=>!planReference||planConfiguredId===planReference.id,getData:()=>clone(state),getSelection:()=>selected,selectBend:id=>{if(state.sequence.includes(id)){selected=id;render();}}};
})();
