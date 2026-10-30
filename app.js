'use strict';

// Plegar Pro UI — prototipo de navegación. NO CONTIENE MOTOR FÍSICO DE PLEGADO.
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const navGroups = [
  {title:'PRINCIPAL', items:[['Inicio','home','#168ef7'],['Proyectos','folder','#235dc2'],['Planos','folder','#1d9cbd'],['Programación 2D','ruler','#ec7b19'],['Programación 3D','box','#6530f5'],['Simulación 2D','box','#0eb2c9'],['Simulación 3D','box','#663be3'],['Utillaje','wrench','#536a94'],['Materiales','box','#32ab49'],['Máquinas','box','#1b6fc2'],['Producción','wrench','#ec741b'],['Agenda','calendar','#e83d65']]},
  {title:'HERRAMIENTAS',items:[['Calculadora de plegado','calc','#536786'],['Curva perfecta','wrench','#1275a2'],['Comparador de V','box','#7d2bd8']]},
  {title:'CONFIGURACIÓN',items:[['Ajustes','gear','#496b91'],['Acerca de','help','#476482']]}
];
const initialProjects=window.PlegarSampleLibrary.list().map((s,i)=>({
 name:s.name,detail:s.profile.angles.length+' pliegues · '+s.thickness.toFixed(2)+' mm · EJEMPLO',
 time:new Date(Date.UTC(2026,9,1,12,0)+i*60000).toISOString(),sampleId:s.id,kind:'example'
}));
const materials = [
  ['Acero S235JR','2.00 mm'],['Acero Inox 304','1.50 mm'],['Aluminio 5754','2.50 mm'],['Acero S355JR','3.00 mm'],['Galvanizado DX51D','1.20 mm']
];
const descriptions = {
 'Proyectos':'Proyectos de chapa, archivos asociados y revisiones. Vista inicial de demostración.',
 'Planos':'Archivo de planos por clientes: fotografías, ficheros CAD, PDF y exportación de originales.',
 'Programación 2D':'Editor de perfil 2D: tramos, ángulos, secuencia y estimación geométrica de desarrollo (no validada para fabricación).',
 'Programación 3D':'Previsualización 3D geométrica derivada del editor 2D, sin edición CAD en volumen.',
 'Simulación 2D':'Vista cinemática local de perfil sincronizada con Programación 2D, sin física ni colisiones verificadas.',
 'Simulación 3D':'Cinemática ilustrativa 3D de descenso del punzón y plegado de chapa; no simula fuerzas ni seguridad de máquina.',
 'Utillaje':'Biblioteca de utillaje del catálogo MECOS. Los punzones del programa proceden de las referencias MECOS documentadas.',
 'Materiales':'Materiales de muestra. Propiedades mecánicas y espesores pendientes de validación.',
 'Máquinas':'Catálogo de plegadoras, ejes y configuraciones. Aún sin gemelos digitales calibrados.',
 'Producción':'Seguimiento de los trabajos reales de Agenda, con cambios de estado guardados localmente. Sin CNC.',
 'Agenda':'Trabajos de taller, fechas, operarios y estados. Guardado local con copia de seguridad.',
 'Calculadora de plegado':'Formulario de cálculo listo visualmente. No genera desarrollos hasta validar el motor.',
 'Curva perfecta':'Curvado progresivo: desarrollo, marcas de golpe y animación geométrica del perfil.',
 'Comparador de V':'Comparación de matrices según espesor y geometría. Motor pendiente.',
 'Ajustes':'Preferencias funcionales, accesibilidad, simulación, navegación y copias locales.',
 'Acerca de':'Plegar Pro — nueva base de interfaz para AMS Engineering.'
};
let projects;
try { projects = JSON.parse(localStorage.getItem('plegarpro-demo-projects') || 'null') || initialProjects.slice(); }
catch { projects=initialProjects.slice(); }
// Agregar piezas de muestra nuevas sin reemplazar ni eliminar los proyectos locales del usuario.
if(!Array.isArray(projects))projects=initialProjects.slice();
for(const example of initialProjects){if(!projects.some(p=>p.sampleId===example.sampleId||p.name===example.name))projects.push(example);}
let previousScreen='Inicio', activeScreen='Inicio', currentStep=3, playerTimer=null, machineZoom=1, previewZoom=1, previewRotation=0, toastTimeout;

const steps=['Posicionar chapa','Plegado 1','Plegado 2','Plegado 3','Plegado 4','Pieza terminada'];
function buildNav(){
 $('#menu-nav').innerHTML=navGroups.map(group=>`<div class="nav-group"><div class="nav-heading">${group.title}</div>${group.items.map(([title,i,bg])=>`<button class="nav-item ${title===activeScreen?'active':''}" data-screen="${title}" type="button"><span class="nav-icon" style="--icon-bg:${bg}">${icon(i)}</span>${title}</button>`).join('')}</div>`).join('');
}
function renderProjects(){
 $('#projects').innerHTML=window.PlegarHomeDashboard?window.PlegarHomeDashboard.projectRows(projects):projects.slice(0,4).map((p,i)=>`<button class="project-row" type="button" data-project="${i}"><span class="home-project-thumb">${window.PlegarHome3D?.thumb(window.PlegarExamples3D.get(['u','z','omega','l'][i]).profile)||'Sin plano'}</span><span class="ptext"><strong>${escapeHtml(p.name)}</strong><small>Ejemplo 3D · pendiente de vincular plano</small></span></button>`).join('');
}
function renderMaterials(){
 $('#materials').innerHTML=materials.map(([title,thick],i)=>`<button type="button" class="material-row ${i===activeMaterial?'selected':''}" data-material="${i}"><img src="assets/chapa-mini.webp" alt=""/><strong>${title}</strong><small>${thick}</small></button>`).join('');
}
let activeMaterial=0;
function setMaterial(index){
 activeMaterial=index;
 $('#material-name').textContent=materials[index][0];
 renderMaterials();
 toast(`Material de ejemplo seleccionado: ${materials[index][0]}`);
}
function chooseProject(i){
 const p=projects[i];if(!p)return;
 if(window.PlegarHomeDashboard){window.PlegarHomeDashboard.selectProject(i);return;}
 $('#project-name').textContent=p.name;
 toast(`Proyecto activo: ${p.name}`);
}
function renderSteps(){
 $('#steps').innerHTML=steps.map((label,i)=>`<button type="button" class="step-card ${currentStep===i+1?'active':''}" data-step="${i+1}" aria-label="Paso ${i+1}: ${label}" aria-current="${currentStep===i+1?'step':'false'}"><span>${i+1}</span><img src="assets/paso-${i+1}.webp" alt=""/><small>${label}</small></button>`).join('');
 $('#timeline').value=String(currentStep); $('#step-count').textContent=`Paso ${currentStep} / 6`;
 $('#step-description').textContent=currentStep===1?'Posicionar chapa':currentStep===6?'Pieza terminada':`Plegado ${currentStep-1} de 4`;
}
function setStep(n){currentStep=Math.max(1,Math.min(6,n));renderSteps();if(currentStep===6) stopPlayer();}
function stopPlayer(){if(playerTimer!==null)clearInterval(playerTimer);playerTimer=null;$('#play-icon use').setAttribute('href','#i-play');$('#play').setAttribute('aria-label','Reproducir');}
function playPause(){
 if(playerTimer!==null){stopPlayer();return;}
 if(currentStep===6)setStep(1);
 playerTimer=setInterval(()=>setStep(currentStep+1),Number($('#speed').value));
 $('#play-icon use').setAttribute('href','#i-pause');$('#play').setAttribute('aria-label','Pausar');
}
function toast(message){
 const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3200);
}
function showDialog(title,content){$('#dialog-title').textContent=title;$('#dialog-body').innerHTML=content;$('#dialog').showModal();}
function showNotice(title,message){showDialog(title,`<p>${escapeHtml(message)}</p><p><strong>Estado:</strong> prototipo visual. No se ha conectado ninguna máquina ni hay cálculos certificados.</p>`);}
function closeMenu(){ $('#sidebar').classList.remove('open');$('#sidebar-curtain').classList.remove('open');}
function toggleMenu(){const opened=$('#sidebar').classList.toggle('open');$('#sidebar-curtain').classList.toggle('open',opened);}
function switchScreen(name){
 if(['Simulación 2D','Simulación 3D','Programación 3D'].includes(name)&&window.PlegarEditor2D?.getPlanReference()&&!window.PlegarEditor2D.isPlanConfigured()){name='Programación 2D';toast('Define primero las medidas del perfil del plano seleccionado para habilitar su simulación.');}
 window.PlegarWorkshop?.destroy();
 window.PlegarProduction?.destroy();
 window.PlegarPlans?.destroy();
 window.PlegarForming2D?.destroy();
 window.PlegarPiece3DView?.destroy();
 stopPlayer();if(name!==activeScreen)previousScreen=activeScreen;activeScreen=name;buildNav();closeMenu();
 $$('.mobile-bottom [data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));
 $('#summary-cards').hidden=name!=='Inicio';$('#module-view').hidden=name==='Inicio';
 $$('.main-panels,.bottom-panels').forEach(el=>el.hidden=name!=='Inicio');
 if(name!=='Inicio')renderModule(name);
 else window.PlegarHomeDashboard?.applySettings?.();
 window.scrollTo({top:0,behavior:'instant'});
}
function renderModule(name){
 $('#module-title').textContent=name;$('#module-subtitle').textContent=descriptions[name]||'Módulo del nuevo Plegar Pro.';
 let content='';
 $('#module-sample').classList.remove('module-piece3d','module-workshop');
 if(name==='Agenda'){window.PlegarWorkshop.agenda($('#module-sample'),projects);return;}
 if(name==='Producción'){window.PlegarProduction.mount($('#module-sample'));return;}
 if(name==='Curva perfecta'){window.PlegarWorkshop.curve($('#module-sample'));return;}
 if(name==='Planos'){
   $('#module-sample').classList.remove('module-editor','module-forming','module-piece3d');
   $('#module-sample').innerHTML='';
   window.PlegarPlans.mount($('#module-sample'));
   return;
 }else if(name==='Programación 2D'){
   $('#module-sample').innerHTML='';
   window.PlegarEditor2D.mount();
   return;
 }else if(name==='Simulación 2D'){
   $('#module-sample').classList.remove('module-editor');
   $('#module-sample').classList.add('module-forming');
   window.PlegarForming2D.mount($('#module-sample'),window.PlegarEditor2D.getData,window.PlegarEditor2D.getSelection,window.PlegarEditor2D.selectBend);
   return;
 }else if(name==='Simulación 3D'||name==='Programación 3D'){
   $('#module-sample').classList.remove('module-editor','module-forming');
   $('#module-sample').classList.add('module-piece3d');
   $('#module-sample').innerHTML='';
   window.PlegarPiece3DView.mount($('#module-sample'),window.PlegarEditor2D.getData,window.PlegarEditor2D.getSelection,window.PlegarEditor2D.selectBend);
   return;
 }else if(name==='Proyectos'){
 content=projects.map((p,i)=>`<div class="module-tile"><div class="home-project-big-thumb">${window.PlegarHomeDashboard?.projectThumb(p,i)||'Sin plano vinculado'}</div><strong>${escapeHtml(p.name)}</strong><p>${p.profile?'Plano del programa vinculado':p.sampleId||window.PlegarSampleLibrary.byName(p.name)?'Plano 2D + vista 3D de ejemplo, no original de cliente':'Borrador 2D/3D con cotas sin confirmar; sustituir por programa real'}</p><div class="project-work-buttons"><button type="button" data-project-action="plan" data-project-index="${i}">Ver plano y pieza 3D</button><button type="button" data-project-action="program2d" data-project-index="${i}">Programar 2D</button><button type="button" data-project-action="sim3d" data-project-index="${i}">Simular 3D</button><button type="button" data-project-action="save" data-project-index="${i}">Guardar planos</button><button type="button" data-attach-project="${i}">Vincular programa actual</button></div></div>`).join('')+`<div class="module-tile"><strong>Nuevo proyecto</strong><p>Crea un proyecto de muestra almacenado en este navegador.</p><button type="button" id="new-project">Crear proyecto</button></div>`;
 }else if(name==='Materiales'){
 content=materials.map(([title,thick],i)=>`<div class="module-tile"><img src="assets/chapa-mini.webp" alt="Muestra de chapa"/><strong>${title}</strong><p>Espesor de demostración: ${thick}</p><button type="button" data-material="${i}">Seleccionar material</button></div>`).join('');
 }else if(name==='Simulación 3D'||name==='Simulación 2D'){
 content=`<div class="module-tile"><img src="assets/${name==='Simulación 3D'?'maquina':'seccion-2d'}.webp" alt="Referencia aprobada"/><strong>Imagen del boceto original</strong><p>Reproduce la identidad visual aprobada. No realiza simulación geométrica.</p><button type="button" data-screen="Inicio">Abrir panel principal</button></div><div class="module-tile"><strong>Controles de secuencia</strong><p>En Inicio puedes avanzar, retroceder o reproducir automáticamente los seis pasos ilustrativos.</p></div>`;
 }else if(name==='Máquinas'){
 content=window.PlegarMachineReferences?.html(window.PlegarEditor2D?.getData()?.setup)||'<div class="module-tile">Ficha técnica de máquinas no disponible.</div>';
 }else if(name==='Utillaje'){
  const lib=window.PlegarToolLibrary,catalog=window.PlegarManufacturerCatalog;
  if(!catalog){content='<p>Catálogo de fabricantes no disponible. Reabre la aplicación para actualizar.</p>';}
  else{
   const el=$('#module-sample');
   el.classList.remove('module-editor','module-forming','module-piece3d');
   el.innerHTML='<section class="mecos-source-card" aria-label="Fuente y revisión semanal del catálogo MECOS"><div><span class="mecos-source-kicker">FUENTE PRINCIPAL · PUNZONES Y MATRICES</span><h2>Catálogo de utillaje MECOS</h2><p>Los punzones seleccionables del programa proceden de las páginas del catálogo MECOS aportadas. Se conserva el fabricante impreso en cada referencia. Consulta los dibujos originales y las cotas de tus fotografías junto a la sección que usa el simulador.</p><small>La lectura de dibujos escaneados puede ser ambigua: las cotas nuevas se revisan antes de entrar en la simulación.</small></div><a href="https://www.mecos.es/files/productos/utillaje-plegadora/MECOS-Catalogo-General-de-Utillaje-2022.pdf" target="_blank" rel="noopener noreferrer">Abrir catálogo MECOS ↗</a></section>'+
    '<div class="catalog-quick-3d"><strong>VISOR 3D INTERACTIVO DE PUNZONES Y MATRICES</strong><p>Selecciona una referencia de las fotografías y gira o voltea su modelo con los dedos. Las siluetas incompletas son reconstrucciones, NO CAD oficial.</p><label>Referencia de utillaje<select data-tool3d-picker>'+[...lib.PUNCHES,...lib.DIES].filter(t=>t.kind==='punch'||t.kind==='die').map(t=>'<option value="'+escapeHtml(t.id)+'">'+escapeHtml(t.name)+'</option>').join('')+'</select></label><button class="catalog-view3d-action" type="button" data-tool3d-quick>Girar y voltear herramienta en 3D</button></div>'+
    window.PlegarCatalogToolView.gallery()+
    '<div id="tool-dxf-panel" aria-label="Importar perfiles reales DXF de utillaje"></div>'+
    
    '<details class="mfg-internal" open><summary>Utillaje WILA–TRUMPF, AMADA–PROMECAM y adaptadores · catálogo</summary>'+
    '<p>Incluye las cotas legibles de las páginas MECOS WILA–TRUMPF 45–55, AMADA–PROMECAM 13–41 y adaptadores 4/82 fotografiadas. Selecciona un punzón o matriz para cargarlo en el programa y verlo en Simulación 2D/3D. Los útiles con geometría insuficientemente acotada quedan como ficha documental. Las siluetas reconstruidas no son CAD del fabricante ni validación de colisiones.</p>'+
    '<label class="catalog-search">Buscar referencia, V, altura o fabricante<input type="search" data-catalog-search placeholder="Ejemplo: 22.312, V16, H74…"></label><p data-catalog-count role="status"></p><div class="module-tiles">'+[...lib.PUNCHES,...lib.DIES,...(lib.ACCESSORIES||[])].map(tool=>
     '<div class="module-tile" data-catalog-tool="'+escapeHtml(tool.id)+'">'+window.PlegarCatalogToolView.cardArt(tool)+'<strong>'+escapeHtml(tool.name)+'</strong><p>'+escapeHtml(lib.details(tool))
     '</p>'+(tool.kind==='punch'||tool.kind==='die'?'<button type="button" class="catalog-view3d-action" data-tool3d-open="'+escapeHtml(tool.id)+'">Girar / voltear 3D · '+escapeHtml(tool.code||tool.id)+'</button><button type="button" data-tool-set="'+tool.kind+':'+tool.id+'">Cargar '+(tool.kind==='die'?'matriz':'punzón')+' en el programa</button>':'<small>Referencia de catálogo · cotas/contorno insuficientes para simular</small>')+'</div>').join('')+'</div></details><details><summary>Otras familias documentales · esquemas genéricos</summary><div id="manufacturer-catalog" aria-label="Familias documentales"></div></details>';
   window.PlegarToolDXF?.mount($('#tool-dxf-panel'));
   catalog.mount($('#manufacturer-catalog'));
   window.PlegarCatalogToolView.mount(el);
   return;
  }
 }else if(name==='Ajustes'){
  $('#module-sample').classList.remove('module-editor','module-forming','module-piece3d');
  window.PlegarSettings.mount($('#module-sample'));return;
 }else if(name==='Acerca de'){
  content='<div class="module-tile"><h2>Plegar Pro Plus</h2><p><strong>Propietario del software: Antonio Molina Sánchez (AMS).</strong></p><p>Programación geométrica, desarrollo orientativo y simulación de plegado en evolución. Sin control CNC ni certificación de colisiones.</p>'+
   '<p>Preferencias guardadas en este navegador. Máquina principal: TRUMPF V85 con cotas de tus pantallas Cybelec.</p>'+
   '<button data-screen="Ajustes">Abrir preferencias</button> <button data-screen="Máquinas">Ver máquinas</button></div>';
 }else if(name==='Calculadora de plegado'||name==='Comparador de V'){
  const profile=window.PlegarEditor2D?.getData();
  try{content=window.PlegarDevelopmentTools.html(name==='Comparador de V'?'comparison':'calculator',profile,{width:window.PlegarEditor2D.getWidth()});}
  catch(error){content='<div class="module-tile"><strong>Cálculo no disponible</strong><p>'+escapeHtml(error.message)+'</p><button data-screen="Programación 2D">Revisar parámetros de plegado</button></div>';}
 }else{
 content=`<div class="module-tile"><strong>Diseño del módulo preparado</strong><p>Este módulo está identificado en el mapa maestro. Su implementación funcional corresponde a una fase posterior.</p></div>`;
 }
 $('#module-sample').classList.remove('module-editor','module-forming');
 $('#module-sample').innerHTML=content;
}

function projectGeometry(i){
 const p=projects[i];if(!p)return null;
 const sample=window.PlegarSampleLibrary;
 const item=sample?.get(p.sampleId)||sample?.byName(p.name);
 const source=p.profile||item?.profile||sample?.draft(p.name,p.detail)?.profile;
 if(!source)return null;
 try{
  const profile={...window.PlegarGeometry2D.validate(source),setup:window.PlegarBendCalc.validateSetup(source.setup)};
  return {profile,width:p.width||item?.width||100,kind:p.profile?'vinculado':item?'ejemplo':'borrador'};
 }catch{return null;}
}
function projectAction(i,action){
 const item=projectGeometry(i);if(!item){toast('Revisa las medidas del proyecto.');return;}
 const record=projects[i],value={...item.profile,name:record.name};
 if(action==='plan'){
  showDialog('Plano 2D y pieza 3D · '+record.name,
    '<div class="project-plan-dialog">'+window.PlegarSampleLibrary.paired(value,item.width)+'</div>'+
    '<p>Geometría '+escapeHtml(item.kind)+' · '+value.angles.length+' pliegues · '+item.width+
    ' mm de ancho. Sin taladros ni recortes no programados. NO ES PLANO DE FABRICACIÓN NI CNC.</p>');
  return;
 }
 if(action==='save'){
  if(item.kind==='borrador'){toast('El borrador necesita cotas confirmadas en Programación 2D antes de guardarlo.');return;}
  window.PlegarPlans.saveProgram(value,{width:item.width})
   .then(()=>toast('Ficha PDF, vistas 2D/3D y programa editable guardados en Planos (dispositivo local).'))
   .catch(e=>toast('No se pudo guardar el plano: '+e.message));return;
 }
 window.PlegarEditor2D.loadProfile(value,{width:item.width});
 switchScreen(action==='sim3d'?'Simulación 3D':'Programación 2D');
 toast('Proyecto '+record.name+' cargado · '+item.kind+'.');
}

function updateToolCard(kind,id){
 const tool=window.PlegarToolLibrary?.get(kind,id);
 if(!tool)return;
 const rows=[...document.querySelectorAll('.tool-specs > div')];
 if(rows.length<7)return;
 const values=[
  tool.code||id,
  kind==='die'?tool.opening.toFixed(2)+' mm':'No aplica · punzón',
  tool.angle+'°',
  tool.height===null?'No documentada':tool.height.toFixed(2)+' mm',
  tool.bodyWidth?tool.bodyWidth.toFixed(2)+' mm':'No acotado',
  kind==='punch'?'R'+tool.nose+' mm':tool.shoulderRadius?'R'+tool.shoulderRadius+' mm':'No acotado',
  tool.capacityTonPerM?tool.capacityTonPerM+' T/m · catálogo':'No indicada'
 ];
 rows.forEach((row,i)=>{const dd=row.querySelector('dd');if(dd)dd.textContent=values[i]||'—';});
}

// Delegación: navegación y selecciones. Todas las superficies que actúan son botones reales.
document.addEventListener('click',event=>{
 if(event.target.closest('[data-machine-v85]')){
  window.PlegarEditor2D.setMachineEnvelope({machineId:'trumpf-v85',backgaugeMode:document.querySelector('[data-v85-stop]')?.value||'stop'});
  toast('TRUMPF V85 aplicada al programa activo.');return;
 }
 if(event.target.closest('[data-machine-save]')){
  const fields=[...document.querySelectorAll('.machine-measurement-editor [data-machine-measure]')],values={};
  if(fields.length!==(window.PlegarEditor2D.getData().setup.machineId==='trumpf-v85'?2:5)){toast('Faltan campos de medida de máquina.');return;}
  for(const field of fields)values[field.dataset.machineMeasure]=field.value.trim()===''?null:Number(field.value);
  try{
   if(!window.PlegarEditor2D?.setMachineEnvelope(values))throw Error('No se pudo guardar el programa activo.');
   try{localStorage.setItem('plegarpro-machine-measurements-v1',JSON.stringify({
    recordedAt:new Date().toISOString(),source:'Cotas introducidas manualmente; no verificadas por fabricante',
    supplied:Object.keys(values).filter(key=>values[key]!==null)
   }));}catch{/* La configuración de plegado ya queda en el programa activo. */}
   renderModule('Máquinas');
   toast('Cotas locales guardadas en el programa activo. Cribado NOMINAL: no se validan colisiones reales ni CNC.');
  }catch(error){toast('Medida no guardada: '+error.message);}
  return;
 }
 if(event.target.closest('[data-app-back]')){switchScreen(previousScreen||'Inicio');return;}
 const screen=event.target.closest('[data-screen]');if(screen){switchScreen(screen.dataset.screen);return;}
 const orbit=event.target.closest('[data-tool3d-open],[data-tool3d-quick]');
 if(orbit){
  const id=orbit.hasAttribute('data-tool3d-quick')?document.querySelector('[data-tool3d-picker]')?.value:orbit.dataset.tool3dOpen;
  const lib=window.PlegarToolLibrary;
  const tool=[...(lib?.PUNCHES||[]),...(lib?.DIES||[])].find(t=>t.id===id);
  if(!tool){toast('Referencia 3D no encontrada.');return;}
  try{window.PlegarToolViewer3D.open(tool);}catch(e){toast('No se pudo abrir el 3D: '+e.message);}
  return;
 }
 const chosenTool=event.target.closest('[data-tool-set]');
 if(chosenTool){
  const [kind,id]=String(chosenTool.dataset.toolSet).split(':');
  const tool=window.PlegarToolLibrary?.get(kind,id);
  if(!tool){toast('Herramienta desconocida.');return;}
  try{
   const done=kind==='die'?window.PlegarEditor2D.setDie(id):window.PlegarEditor2D.setPunch(id);
   if(!done)throw Error('No fue posible actualizar el programa.');
   switchScreen('Programación 2D');
   toast('Herramienta paramétrica '+tool.name+' aplicada; verificación física pendiente.');
  }catch(error){toast(error.message);}
  return;
 }
 const step=event.target.closest('[data-step]');if(step){stopPlayer();setStep(Number(step.dataset.step));return;}
 const chosenDie=event.target.closest('[data-dev-die]');if(chosenDie){
   try{window.PlegarEditor2D.setDie(chosenDie.dataset.devDie);switchScreen('Programación 2D');toast('Matriz nominal aplicada. Revisa radio interior y compatibilidad real.');}
   catch(error){toast('No se pudo seleccionar la matriz: '+error.message);}return;
  }
  if(event.target.closest('[data-dev-open-editor]')){switchScreen('Programación 2D');return;}
  const projectButton=event.target.closest('[data-project-action]');
 if(projectButton){projectAction(Number(projectButton.dataset.projectIndex),projectButton.dataset.projectAction);return;}
 const attach=event.target.closest('[data-attach-project]');if(attach){
  const i=Number(attach.dataset.attachProject),data=window.PlegarEditor2D?.getData();
  if(!projects[i]||!data)return;
  const previous=projects[i].profile;
  projects[i].profile=JSON.parse(JSON.stringify(data));
  try{localStorage.setItem('plegarpro-demo-projects',JSON.stringify(projects));}
  catch{projects[i].profile=previous;toast('No se pudo guardar el programa del proyecto.');return;}
  renderProjects();renderModule('Proyectos');toast('Programa vinculado. La miniatura ahora utiliza las medidas introducidas en el editor.');return;
 }
 const project=event.target.closest('[data-project]');if(project){chooseProject(Number(project.dataset.project));return;}
 const material=event.target.closest('[data-material]');if(material){setMaterial(Number(material.dataset.material));return;}
 const tool=event.target.closest('#tool-tabs [data-tab]');
 if(tool){
  $$('#tool-tabs [data-tab]').forEach(b=>b.classList.toggle('selected',b===tool));
  const kind=tool.dataset.tab==='Punzones'?'punch':tool.dataset.tab==='Matrices'?'die':null;
  const sel=$('#tool-select');
  if(!kind){sel.innerHTML='<option value="">Sin catálogo de adaptadores verificado</option>';sel.disabled=true;$('#tool-code').textContent='SIN REFERENCIA';return;}
  sel.disabled=false;
  sel.innerHTML=(kind==='punch'?window.PlegarToolLibrary.PUNCHES:window.PlegarToolLibrary.DIES)
   .map(x=>'<option value="'+x.kind+':'+x.id+'">'+escapeHtml(x.name)+'</option>').join('');
  updateToolCard(kind,sel.value.split(':')[1]);
  return;
 }
 const calc=event.target.closest('[data-calc]');if(calc){
  $('#calc-tabs [data-calc]').forEach(b=>b.classList.toggle('selected',b===calc));
  switchScreen(calc.dataset.calc==='Curva perfecta'?'Curva perfecta':'Calculadora de plegado');
  return;
 }
 if(event.target.closest('#new-project')){
  showDialog('Nuevo proyecto de demostración','<p>Este formulario crea únicamente un registro local, no un proyecto CAD.</p><label>Nombre del proyecto<input type="text" id="new-project-name" maxlength="55" placeholder="Ej. Soporte plegado"/></label><button type="button" class="dialog-btn" id="confirm-project">Crear proyecto</button>');return;
 }
 if(event.target.closest('#confirm-project')){
  const value=$('#new-project-name')?.value.trim();if(!value){toast('Introduce un nombre de proyecto.');return;}
  projects.unshift({name:value,detail:'BORRADOR geométrico · cotas por introducir',time:new Date().toLocaleString('es-ES'),profile:null});localStorage.setItem('plegarpro-demo-projects',JSON.stringify(projects));$('#dialog').close();renderProjects();renderModule('Proyectos');toast('Proyecto de muestra guardado en este navegador.');return;
 }
});
$('#brand-home').addEventListener('click',()=>switchScreen('Inicio'));
 $('#avatar')?.addEventListener('click',()=>switchScreen('Ajustes'));
$('#open-menu').addEventListener('click',toggleMenu);
$('#bottom-more').addEventListener('click',toggleMenu);
$('#sidebar-curtain').addEventListener('click',closeMenu);
$('#step-back').addEventListener('click',()=>{stopPlayer();setStep(currentStep-1);});
$('#step-next').addEventListener('click',()=>{stopPlayer();setStep(currentStep+1);});
$('#play').addEventListener('click',playPause);
$('#timeline').addEventListener('input',event=>{stopPlayer();setStep(Number(event.target.value));});
$('#speed').addEventListener('change',()=>{if(playerTimer!==null){stopPlayer();playPause();}});
$('#machine-info').addEventListener('click',()=>showNotice('Simulación 3D','La imagen central procede del boceto aprobado. Los controles de pasos son interactivos pero todavía no deforman geométricamente la chapa.'));
$('#view-option').addEventListener('click',()=>toast('Vista frontal del boceto aprobado. Otras cámaras pendientes.'));
$('#realistic-option').addEventListener('click',()=>toast('Modo visual realista: imagen de referencia aprobada.'));
$('#views').addEventListener('click',()=>toast('Otras vistas 3D pendientes del futuro motor geométrico.'));
$('#section-switch').addEventListener('click',()=>switchScreen('Simulación 2D'));
$('#calc-action').addEventListener('click',()=>switchScreen('Calculadora de plegado'));
$('#calc-close').addEventListener('click',()=>{
  const hidden=$('.calculator-panel').classList.toggle('calculator-collapsed');
  $('#calc-close').setAttribute('aria-label',hidden?'Restaurar calculadora':'Minimizar calculadora');
  $('#calc-close').setAttribute('aria-expanded',String(!hidden));
  $('#calc-close').textContent=hidden?'＋':'×';
 });
$('#tool-select').addEventListener('change',event=>{
  const [kind,id]=event.target.value.split(':');
  const item=window.PlegarToolLibrary?.get(kind,id);if(!item)return;
  try{
   const done=kind==='die'?window.PlegarEditor2D.setDie(id):window.PlegarEditor2D.setPunch(id);
   if(!done)throw Error('No se pudo guardar.');
   updateToolCard(kind,id);toast('Herramienta nominal '+item.name+' aplicada al programa.');
  }catch(e){toast(e.message);}
 });
$('#open-menu').setAttribute('aria-expanded','false');
$('#zoom-in').addEventListener('click',()=>setMachineZoom(machineZoom+.10));
$('#zoom-out').addEventListener('click',()=>setMachineZoom(machineZoom-.10));
$('#reset-view').addEventListener('click',()=>setMachineZoom(1));
$('#center-view').addEventListener('click',()=>setMachineZoom(1));
function setMachineZoom(z){machineZoom=Math.max(.8,Math.min(1.7,z));$('.machine-stage img').style.transform=`scale(${machineZoom})`;}
let maximized=false;
$('#maximize').addEventListener('click',()=>{
 maximized=!maximized;$('#machine-panel').classList.toggle('maximized-panel',maximized);
 $('#maximize use').setAttribute('href',maximized?'#i-min':'#i-max');
 document.body.style.overflow=maximized?'hidden':'';
});
$('#preview-open').addEventListener('click',()=>showDialog('Pieza del boceto aprobado','<img src="assets/pieza-3d.webp" alt="Pieza de chapa" style="width:100%;height:auto"/><p>Vista ilustrativa, no modelo CAD exportable.</p>'));
function setPreview(){ $('.preview-image img').style.transform=`scale(${previewZoom}) rotate(${previewRotation}deg)`; }
$('#rotate-prev').addEventListener('click',()=>{previewRotation-=10;setPreview();});
$('#rotate-next').addEventListener('click',()=>{previewRotation+=10;setPreview();});
$('#preview-zoom').addEventListener('click',()=>{previewZoom=previewZoom>=1.5?1:previewZoom+.1;setPreview();});
$('#preview-reset').addEventListener('click',()=>{previewZoom=1;previewRotation=0;setPreview();});
$('#notifications').addEventListener('click',()=>showNotice('Notificaciones de ejemplo','Los contadores rojos replican el diseño aprobado. No existen notificaciones de servidor en este prototipo.'));
$('#messages').addEventListener('click',()=>showNotice('Mensajes de ejemplo','Este prototipo todavía no tiene mensajería real.'));
$('#search').addEventListener('input',e=>{const v=e.target.value.toLowerCase().trim();$$('.nav-item').forEach(b=>{b.style.display=!v||b.textContent.toLowerCase().includes(v)?'':'none';});if(v&&!$('#sidebar').classList.contains('open')&&window.innerWidth<1121)toggleMenu();});
$('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$$('.nav-item').find(el=>el.style.display!=='none');if(first) switchScreen(first.dataset.screen);e.target.blur();}});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search').focus();}
 if(e.key==='Escape'){closeMenu();if(maximized){$('#maximize').click();}}
});
$('#dialog-close').addEventListener('click',()=>$('#dialog').close());
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog'))$('#dialog').close();});
buildNav();renderProjects();renderMaterials();renderSteps();
 switchScreen(window.PlegarSettings?.get()?.startupScreen||'Inicio');
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'})
    .then(reg=>reg.update().catch(()=>{})).catch(()=>{});
}

function linkProjectPlan(i,profile,width){
 if(!projects[i]||!profile)return false;
 try{
  const geometry=window.PlegarGeometry2D.validate(profile);
  const setup=window.PlegarBendCalc.validateSetup(profile.setup);
  if(!Number.isFinite(width)||width<1||width>5000)return false;
  const next={...projects[i],profile:{...geometry,setup},width};
  const updated=projects.slice();updated[i]=next;
  localStorage.setItem('plegarpro-demo-projects',JSON.stringify(updated));
  projects=updated;renderProjects();
  return true;
 }catch{return false;}
}
window.PlegarApp={switchScreen,linkProjectPlan,getProjects:()=>projects.map(p=>({...p}))};



