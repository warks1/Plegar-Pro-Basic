/* Programación 2D: editor de perfil geométrico y orden de pliegues.
   Ni la vista ni la longitud de ejes representan el desarrollo real, la fibra neutra,
   la recuperación elástica o una secuencia de fabricación validada. */
(function(){
'use strict';
const G = window.PlegarGeometry2D;
const C = window.PlegarBendCalc;
const fromEditor = source => ({...G.validate(source),setup:C.validateSetup(source.setup)});
const STORAGE='plegarpro-editor2d-v1';
const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
const initial = {name:'Perfil omega (ejemplo)', material:'Acero S235JR', thickness:2, segments:[60,85,120,85,60], angles:[-90,90,90,-90], sequence:[1,2,3,4]};
let state = fromEditor(initial);
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
 $('#ed-name').value=state.name;
 $('#ed-material').value=state.material;
 $('#ed-thickness').value=String(state.thickness);
 $('#ed-radius').value=String(state.setup.radius);
 $('#ed-kfactor').value=String(state.setup.kFactor);
 $('#ed-punch').value=state.setup.punch;
 $('#ed-die').value=state.setup.die;
 $('#ed-segments').innerHTML=state.segments.map((length,i)=>`<label class="ed-cell"><span>Tramo ${i+1} (mm)</span><input type="number" min="0.1" max="100000" step="0.1" inputmode="decimal" data-ed-segment="${i}" aria-label="Longitud tramo ${i+1}" value="${length}"></label>`).join('');
 $('#ed-angles').innerHTML=state.angles.map((value,i)=>`<label class="ed-cell"><span>Pliegue ${i+1} (°)</span><input type="number" min="-179" max="179" step="1" inputmode="decimal" data-ed-angle="${i}" aria-label="Ángulo firmado pliegue ${i+1}" value="${value}"></label>`).join('');
 $('#ed-order').innerHTML=state.sequence.map((id,i)=>`<button class="ed-order-item ${selected===id?'current':''}" data-ed-select="${id}" type="button" aria-pressed="${selected===id}"><strong>${i+1}</strong> Pliegue ${id} <small>${state.angles[id-1]>0?'+':''}${fmt(state.angles[id-1])}°</small></button>`).join('');
 $('#ed-undo').disabled=!undoStack.length;$('#ed-redo').disabled=!redoStack.length;
 $('#ed-remove').disabled=state.segments.length<=2;
 $('#ed-up').disabled=state.sequence.indexOf(selected)<=0;
 $('#ed-down').disabled=state.sequence.indexOf(selected)>=state.sequence.length-1;
 draw();renderCalc();inform('Perfil actualizado. Estimación de desarrollo no validada para fabricación.');
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
 <div class="ed-toolbar"><span class="ed-chip">EDITOR GEOMÉTRICO · v0.3</span><div class="ed-actions"><button type="button" id="ed-undo" aria-label="Deshacer">↶ Deshacer</button><button type="button" id="ed-redo" aria-label="Rehacer">↷ Rehacer</button><button type="button" id="ed-save">Guardar</button><button type="button" id="ed-export">Exportar JSON</button><label class="ed-import">Importar JSON<input type="file" id="ed-import" accept=".json,application/json" aria-label="Importar pieza JSON"></label></div></div>
 <div class="ed-grid"><div class="ed-primary"><div class="ed-canvas-top"><strong>PERFIL 2D DE LA PIEZA</strong><span id="ed-count"></span></div><svg id="ed-svg" viewBox="0 0 760 460" role="img" aria-label="Perfil de ejes de chapa y pliegues numerados"></svg><div class="ed-caption"><strong id="ed-total"></strong><span>Ángulo firmado: positivo antihorario, negativo horario. Los tramos representan ejes rectos nominales.</span></div><p class="ed-warning">Perfil dibujado entre vértices teóricos agudos. El cálculo orientativo de desarrollo se muestra debajo, con hipótesis explícitas. No sustituye validación de plegado real ni constituye un programa CNC.</p><div class="ed-section ed-calculation"><div class="ed-section-head"><strong>Estimación del desarrollo · hipótesis geométrica</strong><span>Longitudes entre vértices teóricos (no cotas exteriores/interiores)</span></div><div class="ed-results"><div id="ed-calc-result"><small>Desarrollo nominal estimado</small><strong id="ed-flat"></strong></div><div><small>Deducción total</small><strong id="ed-deduction"></strong></div><div><small>Suma BA (arcos)</small><strong id="ed-allowance"></strong></div><div><small>Apertura V/e</small><strong id="ed-vratio"></strong></div></div><div class="ed-table-wrap"><table class="ed-bend-table"><thead><tr><th>Pliegue</th><th>Giro</th><th>Ángulo interior</th><th>BA (mm)</th><th>BD (mm)</th></tr></thead><tbody id="ed-bend-table"></tbody></table></div><p class="ed-equation">BA = θ(rad) × (Ri + K × e) · BD = 2 × (Ri + e) × tan(θ/2) − BA · Desarrollo = Σ tramos nominales − Σ BD</p><ul id="ed-calc-warnings" class="ed-calc-warnings"></ul></div><div class="ed-section"><div class="ed-section-head"><strong>Orden de plegado</strong><span>Selecciona un pliegue y muévelo en la secuencia</span></div><div id="ed-order" class="ed-order"></div><div class="ed-actions"><button type="button" id="ed-up">↑ Adelantar</button><button type="button" id="ed-down">↓ Retrasar</button></div></div></div>
 <div class="ed-controls"><div class="ed-section"><strong>Datos de la pieza</strong><label class="ed-cell"><span>Nombre</span><input id="ed-name" maxlength="70" autocomplete="off"></label><label class="ed-cell"><span>Material (texto de proyecto)</span><select id="ed-material"><option value="Acero S235JR">Acero S235JR</option><option value="Acero S355JR">Acero S355JR</option><option value="Inox 304">Inox 304</option><option value="Aluminio 5754">Aluminio 5754</option></select></label><label class="ed-cell"><span>Espesor nominal (mm)</span><input id="ed-thickness" type="number" min="0.1" max="100" step="0.1" inputmode="decimal"></label></div>
 <div class="ed-section"><strong>Parámetros de desarrollo</strong><label class="ed-cell"><span>Radio interior supuesto Ri (mm) · introducido por usuario</span><input id="ed-radius" type="number" min="0.1" max="500" step="0.1" inputmode="decimal"></label><label class="ed-cell"><span>Factor K (0,20–0,60) · ajustar con ensayo</span><input id="ed-kfactor" type="number" min="0.2" max="0.6" step="0.01" inputmode="decimal"></label><label class="ed-cell"><span>Punzón (genérico, nominal)</span><select id="ed-punch">${C.PUNCHES.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label class="ed-cell"><span>Matriz (genérica, nominal)</span><select id="ed-die">${C.DIES.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label><p class="ed-mini">La V seleccionada no determina automáticamente el radio; se introduce Ri por separado. El cálculo no predice recuperación elástica, fuerza, interferencias ni ala mínima.</p></div><div class="ed-section"><div class="ed-section-head"><strong>Tramos rectos</strong><span>Longitudes en mm</span></div><div id="ed-segments" class="ed-fieldgrid"></div><div class="ed-actions"><button type="button" id="ed-add">+ Añadir tramo</button><button type="button" id="ed-remove">− Quitar último</button></div></div>
 <div class="ed-section"><div class="ed-section-head"><strong>Ángulos entre tramos</strong><span>Valores entre −179° y +179°</span></div><div id="ed-angles" class="ed-fieldgrid"></div></div></div></div><p id="editor-status" class="ed-status" role="status"></p></section>`;}
function change(event){
 const el=event.target;
 if(el.id==='ed-name'){const value=el.value.trim();if(!value){inform('El nombre no puede estar vacío.');render();return;}edit(d=>{d.name=value;});return;}
 if(el.id==='ed-material'){edit(d=>{d.material=el.value;});return;}
 if(el.id==='ed-radius'){const v=readNumber(el,.1,500);if(v!==null)edit(d=>{d.setup.radius=v;});return;}
 if(el.id==='ed-kfactor'){const v=readNumber(el,.2,.6);if(v!==null)edit(d=>{d.setup.kFactor=v;});return;}
 if(el.id==='ed-punch'){edit(d=>{d.setup.punch=el.value;});return;}
 if(el.id==='ed-die'){edit(d=>{d.setup.die=el.value;});return;}
 if(el.id==='ed-thickness'){const v=readNumber(el,.1,100);if(v!==null)edit(d=>{d.thickness=v;});return;}
 if(el.matches('[data-ed-segment]')){const v=readNumber(el,.1,100000);if(v!==null)edit(d=>{d.segments[Number(el.dataset.edSegment)]=v;});return;}
 if(el.matches('[data-ed-angle]')){const v=readNumber(el,-179,179);if(v!==null)edit(d=>{d.angles[Number(el.dataset.edAngle)]=v;});return;}
}
function actions(event){
 const b=event.target.closest('button,[data-ed-bend]');if(!b)return;
 const sel=b.dataset.edSelect??b.dataset.edBend;
 if(sel){selected=Number(sel);render();return;}
 switch(b.id){
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
 target.innerHTML=layout();target.classList.add('module-editor');
 const restored=loadLocal();if(restored)state=restored;
 render();
 // Escucha delegada en el contenedor: la interfaz se reconstruye al cambiar de módulo.
 target.onchange=event=>{if(event.target.id==='ed-import')imported(event);else change(event);};
 target.onclick=actions;
 target.onkeydown=event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-ed-bend]')){event.preventDefault();selected=Number(event.target.dataset.edBend);render();}};
 isInitialized=true;
}
function loadLocal(){try{const raw=localStorage.getItem(STORAGE);return raw?fromEditor(JSON.parse(raw)):null;}catch{return null;}}
window.PlegarEditor2D={mount, getData:()=>clone(state)};
})();
