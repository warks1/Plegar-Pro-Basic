/* Plegar Pro Plus v0.40 · Panel de Inicio basado en el motor 3D, sin fotos estáticas. */
(function(){
'use strict';
const H=()=>window.PlegarHome3D,E=()=>window.PlegarExamples3D,Editor=()=>window.PlegarEditor2D,TL=()=>window.PlegarSequenceTimeline;
const $=s=>document.querySelector(s),state={step:1,cycle:0,width:100,zoom:1,yaw:38,previewZoom:1,previewYaw:38,raf:null,last:null,paint:null,cameraKey:'',camera:null,profileKey:'',maximized:false,mode:'photo'};
let machineGestures=null,previewGestures=null;
const Sample=()=>window.PlegarSampleLibrary;
function program(){return Editor()?.getData();}
function projectProfile(p,i){
 if(p.profile){
  try{
   const valid=window.PlegarGeometry2D.validate(p.profile);
   return {...valid,setup:p.profile.setup};
  }catch{return null;}
 }
 return Sample()?.get(p.sampleId)?.profile||Sample()?.byName(p.name)?.profile||Sample()?.draft(p.name,p.detail)?.profile||null;
}
function projectThumb(p,i){
 const model=projectProfile(p,i);
 if(!model)return '<span class="home-no-profile">Sin plano</span>';
 try{return Sample().paired(model,p.width||Sample().get(p.sampleId)?.width||Sample().byName(p.name)?.width||100);}catch{return '<span class="home-no-profile">Geometría inválida</span>';}
}
function projectRows(items){
 return items.slice(0,4).map((p,i)=>{
  const model=projectProfile(p,i),isSample=!!(Sample()?.get(p.sampleId)||Sample()?.byName(p.name)),
   detail=model?model.angles.length+' pliegues · '+model.thickness.toFixed(2)+' mm · '+(p.profile?'PROGRAMA VINCULADO':isSample?'EJEMPLO 2D/3D':'BORRADOR SIN COTAS CONFIRMADAS'):'SIN PLANO';
  return '<button class="project-row" type="button" data-project="'+i+'"><span class="home-project-thumb">'+projectThumb(p,i)+'</span><span class="ptext"><strong>'+escape(p.name)+'</strong><small>'+escape(detail)+'</small></span><time>'+escape(String(p.time||'').slice(0,10))+'</time></button>';
 }).join('');
}
function escape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function visible(){return !$('#summary-cards')?.hidden;}
function bounds(p){
 const k=JSON.stringify([p,state.width]);if(k!==state.cameraKey){state.cameraKey=k;state.camera=H().boundsFor(p,state.width,38,24);}
 return state.camera;
}
function count(){const p=program();return p?H().steps(p):2;}
function stop(){
 if(state.raf!==null){cancelAnimationFrame(state.raf);state.raf=null;}
 state.last=null;state.paint=null;
 const btn=$('#play');if(btn){btn.setAttribute('aria-label','Reproducir pliegues seguidos');$('#play-icon use')?.setAttribute('href','#i-play');}
}
function speed(){return Number($('#speed')?.value)||1100;}
function updateControls(){
 const p=program();if(!p)return;
 const labels=['Posicionar chapa',...p.sequence.map((id)=>'Pliegue '+id),'Pieza terminada'];
 const steps=$('#steps');
 if(steps?.dataset.geometryKey!==JSON.stringify([p,state.width])){
  steps.dataset.geometryKey=JSON.stringify([p,state.width]);
  steps.innerHTML=labels.map((label,i)=>'<button type="button" class="step-card" data-home-step="'+(i+1)+'" aria-label="Paso '+(i+1)+' '+escape(label)+'"><span>'+(i+1)+'</span>'+H().stepThumbnail(p,i+1,{width:state.width})+'<small>'+escape(label)+'</small></button>').join('');
 }
 steps?.querySelectorAll('[data-home-step]').forEach(b=>{const active=Number(b.dataset.homeStep)===state.step;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'step':'false');});
 const slider=$('#timeline');if(slider){slider.min='1';slider.max=String(labels.length);slider.value=String(state.step);}
 $('#step-count').textContent='Paso '+state.step+' / '+labels.length;
 $('#step-description').textContent=labels[state.step-1];
}
function setMode(mode){
 state.mode=mode==='cad'?'cad':'photo';
 const photo=$('.home-machine-photo'),cad=$('#home-machine-cad');
 if(photo)photo.hidden=state.mode!=='photo';
 if(cad)cad.hidden=state.mode!=='cad';
 const imgButton=$('#realistic-option'),modelButton=$('#home-view-model');
 for(const [button,pressed] of [[imgButton,state.mode==='photo'],[modelButton,state.mode==='cad']]){
  if(button){button.setAttribute('aria-pressed',String(pressed));button.classList.toggle('selected',pressed);}
 }
 const label=$('#home-scene-label');if(label)label.textContent=state.mode==='photo'
  ?'FOTOGRAFÍA REAL DE REFERENCIA · PARA ANIMAR ELIGE CINEMÁTICA 3D'
  :'CINEMÁTICA GEOMÉTRICA EN MOVIMIENTO · NO CONTROL CNC NI MÁQUINA CALIBRADA';
}
function draw(){
 if(!visible())return;
 const p=program();if(!p)return;
 try{
  const m=H().machine(p,{stage:state.step,progress:state.cycle,width:state.width,yaw:38,elevation:24,zoom:state.zoom,bounds:bounds(p)});
  $('#home-machine-cad').innerHTML=m.svg;
 }catch(err){stop();$('#home-machine-cad').textContent='Error de cinemática: '+err.message;}
}
function preview(){
 if(!visible())return;
 const p=program();if(!p)return;
 try{
  $('#home-preview-drawing').innerHTML=H().preview(p,{width:state.width,yaw:state.previewYaw,elevation:25,zoom:state.previewZoom});
  $('#active-project-thumb').innerHTML=H().thumb(p,{width:state.width});
  $('#project-name').textContent=p.name;
  $('#home-preview-source').textContent='Perfil 3D del programa: '+p.name+' · Sin plano CAD certificado';
 }catch(err){$('#home-preview-drawing').textContent='No se puede representar el perfil: '+err.message;}
}
function paint(){updateControls();draw();}
function tick(now){
 if(state.raf===null||!visible()){stop();return;}
 if(state.last===null)state.last=now;
 const dt=Math.min(100,Math.max(0,now-state.last));state.last=now;
 const total=count();
 if(state.step===1){state.step=2;state.cycle=0;}
 if(state.step<total){
  const next=TL().advance({step:state.step-2,cycle:state.cycle},dt,total-2,{duration:speed()});
  state.step=next.step+2;state.cycle=next.cycle;
  if(next.finished){state.step=total;state.cycle=1;stop();}
 }else stop();
 if(state.paint===null||now-state.paint>=33||state.raf===null){paint();state.paint=now;}
 if(state.raf!==null)state.raf=requestAnimationFrame(tick);
}
function toggle(){
 if(state.raf!==null){stop();draw();return;}
 if(state.step>=count()){state.step=1;state.cycle=0;}
 setMode('cad'); // La foto sigue disponible; la animación utiliza la geometría 3D real del programa.
 state.last=null;state.paint=null;state.raf=requestAnimationFrame(tick);
 $('#play-icon use')?.setAttribute('href','#i-pause');$('#play')?.setAttribute('aria-label','Pausar reproducción continua');
}
function seek(step){stop();state.step=Math.max(1,Math.min(count(),Number(step)));state.cycle=state.step===count()?1:0;paint();}
function sync(){
 if(!visible())return;
 const p=program();if(!p)return;
 const key=JSON.stringify(p);
 if(key!==state.profileKey){stop();state.profileKey=key;state.step=1;state.cycle=0;state.cameraKey='';$('#steps').dataset.geometryKey='';}
 preview();paint();
}
function selectProject(i){
 const p=window.PlegarApp?.getProjects()?.[i];
 if(!p)return;
 const model=projectProfile(p,i);if(!model){alert('Este proyecto no contiene un plano geométrico vinculado.');return;}
 stop();
 try{
  Editor().loadProfile({...model,name:p.name},{width:p.width||Sample()?.get(p.sampleId)?.width||Sample()?.byName(p.name)?.width||100});
  state.width=p.width||Sample()?.get(p.sampleId)?.width||Sample()?.byName(p.name)?.width||100;state.profileKey='';state.cameraKey='';sync();
  if(!p.profile)document.querySelector('#toast').textContent='Geometría provisional de ejemplo o borrador; comprobar las cotas del plano real.';
 }catch(err){alert('No es posible cargar la pieza: '+err.message);}
}
function cloneControl(id,handler,event='click'){
 const node=document.getElementById(id);if(!node)return;
 const fresh=node.cloneNode(true);node.replaceWith(fresh);fresh.addEventListener(event,handler);
}
function normalized(name){
 return String(name||'').replace(/\.(pdf|json|svg)$/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es-ES');
}
async function connectSavedDrawings(){
 try{
  const db=await window.PlegarPlans?.openDb();if(!db)return;
  const plans=await new Promise((resolve,reject)=>{
   const req=db.transaction('plans','readonly').objectStore('plans').getAll();
   req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
  });
  const current=window.PlegarApp?.getProjects?.()||[];
  let linked=false;
  current.forEach((p,i)=>{
   if(p.profile)return;
   const row=plans.find(doc=>doc.profile&&normalized(doc.name)===normalized(p.name));
   if(row&&window.PlegarApp.linkProjectPlan(i,row.profile,row.width||100))linked=true;
  });
  if(linked){$('#projects').innerHTML=projectRows(window.PlegarApp.getProjects());if(visible())sync();}
 }catch{/* Biblioteca local puede no estar disponible en modo privado. */}
}
function init(){
 const host=$('#home-machine-3d');if(!host)return;
 for(const id of ['step-back','step-next','play','timeline','speed','zoom-in','zoom-out','center-view','reset-view','rotate-prev','rotate-next','preview-zoom','preview-reset','preview-open','machine-info','view-option','views','realistic-option','home-view-model']){
  const handlers={
   'step-back':()=>seek(state.step-1),'step-next':()=>seek(state.step+1),'play':toggle,
   'zoom-in':()=>machineGestures?.zoomBy(1.2),'zoom-out':()=>machineGestures?.zoomBy(1/1.2),
   'center-view':()=>machineGestures?.reset(),'reset-view':()=>machineGestures?.reset(),
   'rotate-prev':()=>{state.previewYaw-=12;preview();},'rotate-next':()=>{state.previewYaw+=12;preview();},
   'preview-zoom':()=>previewGestures?.zoomBy(1.2),
   'preview-reset':()=>{state.previewYaw=38;state.previewZoom=1;previewGestures?.reset();preview();},
   'preview-open':()=>{const p=program();if(!p)return;$('#dialog-title').textContent='Pieza del programa: '+p.name;$('#dialog-body').innerHTML=H().preview(p,{width:state.width,yaw:state.previewYaw,zoom:1.5})+'<p>Vista nominal del perfil programado: no contiene taladros ni geometría CAD no proporcionada.</p>';$('#dialog').showModal();},
   'machine-info':()=>{const p=program();$('#toast').textContent='Cinemática basada en '+p.name+': punzón, matriz y chapa dinámicos. Sin contacto físico certificado.';$('#toast').classList.add('show');},
   'view-option':()=>window.PlegarApp.switchScreen('Simulación 3D'),
   'views':()=>window.PlegarApp.switchScreen('Simulación 3D'),
   'realistic-option':()=>{stop();setMode('photo');},
   'home-view-model':()=>setMode('cad')
  };
  cloneControl(id,handlers[id]||(()=>{}),id==='timeline'||id==='speed'?'change':'click');
 }
 $('#timeline').addEventListener('input',e=>seek(e.target.value));
 const steps=$('#steps');steps.addEventListener('click',e=>{const b=e.target.closest('[data-home-step]');if(b){e.stopPropagation();seek(b.dataset.homeStep);}});
 const list=$('#projects');list.addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b){e.stopPropagation();selectProject(Number(b.dataset.project));}});
 machineGestures=window.PlegarTouchView.attach($('#home-machine-3d'),$('#home-machine-camera'));
 previewGestures=window.PlegarTouchView.attach($('#home-preview-3d'),$('#home-preview-camera'));
 setMode('photo');
 const obs=new MutationObserver(()=>{if(visible())sync();else stop();});obs.observe($('#summary-cards'),{attributes:true,attributeFilter:['hidden']});
 sync();
 // Sustituir las miniaturas provisionales del arranque por plano 2D + pieza 3D de cada proyecto.
 const rows=window.PlegarApp?.getProjects?.();if(rows)$('#projects').innerHTML=projectRows(rows);
 connectSavedDrawings();
}
window.PlegarHomeDashboard={init,sync,stop,projectRows,projectThumb,selectProject};
init();
})();