/* Plegar Pro Plus · Seguimiento de producción basado en los trabajos reales de Agenda.
   Guardado local, sin comunicación CNC ni órdenes ficticias. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./agenda-core.js'):root.PlegarAgendaCore);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarProduction=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Agenda){
 'use strict';
 const KEY='plegar-agenda-v1', statuses=Agenda.STATUSES,keys=Object.keys(statuses);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let host=null,clean=null;
 function destroy(){if(clean)clean();clean=null;if(host)host.classList.remove('module-workshop');host=null;}
 function mount(target){
  destroy();host=target;
  host.classList.remove('module-editor','module-forming','module-piece3d');
  host.classList.add('module-workshop');
  host.innerHTML='<p class="workshop-status" role="status" aria-live="polite"></p><section><h3>Órdenes de trabajo · estado de fabricación</h3><p>Seguimiento de trabajos guardados en Agenda. No transmite datos a ninguna máquina ni genera CNC.</p><div class="workshop-actions"><button type="button" data-screen="Agenda">Abrir Agenda / crear trabajo</button><button type="button" data-production-refresh>Actualizar</button></div><div class="workshop-fields"><label>Estado<select data-production-filter><option value="all">Todos</option>'+keys.map(k=>'<option value="'+k+'">'+esc(statuses[k])+'</option>').join('')+'</select></label><label>Buscar trabajo, operario o proyecto<input type="search" data-production-search placeholder="Buscar…"></label></div><div data-production-summary aria-live="polite"></div><div data-production-list></div></section>';
  const say=(message,error=false)=>{const el=host.querySelector('.workshop-status');el.textContent=message;el.classList.toggle('error',error);};
  let rows=[],safe=false;
  function load(){
   try{const raw=localStorage.getItem(KEY);rows=raw?Agenda.importJSON(raw):[];say('');return true;}
   catch(e){rows=[];say('No se ha podido leer Agenda; no se sobrescribirán datos: '+e.message,true);return false;}
  }
  function render(){
   const counts=Object.fromEntries(keys.map(k=>[k,rows.filter(t=>t.status===k).length]));
   host.querySelector('[data-production-summary]').innerHTML='<p><strong>'+rows.length+' trabajos reales</strong> · '+keys.map(k=>esc(statuses[k])+': '+counts[k]).join(' · ')+'</p>';
   const filter=host.querySelector('[data-production-filter]').value;
   const q=host.querySelector('[data-production-search]').value.trim().toLocaleLowerCase('es');
   const found=Agenda.order(rows.filter(t=>(filter==='all'||filter===t.status)&&(!q||[t.title,t.project,t.operator,t.notes].some(x=>x.toLocaleLowerCase('es').includes(q)))));
   host.querySelector('[data-production-list]').innerHTML=found.map(t=>'<article class="workshop-task"><strong>'+esc(t.title)+'</strong><p>'+esc(t.date)+' · '+esc(t.time)+' · '+t.duration+' minutos</p><p>Proyecto: '+esc(t.project||'Sin vincular')+' · Operario: '+esc(t.operator||'Sin asignar')+'</p><p class="workshop-notes">'+esc(t.notes)+'</p><label>Estado<select data-production-id="'+esc(t.id)+'" '+(!safe?'disabled':'')+'>'+keys.map(k=>'<option value="'+k+'" '+(t.status===k?'selected':'')+'>'+esc(statuses[k])+'</option>').join('')+'</select></label></article>').join('')||'<p>No hay trabajos para este filtro. Crea uno en Agenda.</p>';
  }
  function onInput(e){if(e.target.matches('[data-production-search]'))render();}
  function onChange(e){
   if(e.target.matches('[data-production-filter]')){render();return;}
   const el=e.target.closest('[data-production-id]');if(!el)return;
   if(!safe){say('No se modificarán los datos de Agenda.',true);return;}
   const task=rows.find(t=>t.id===el.dataset.productionId);if(!task)return;
   try{const next=Agenda.upsert(rows,{...task,status:el.value});localStorage.setItem(KEY,Agenda.exportJSON(next));rows=next;say('Estado guardado: '+task.title);render();}
   catch(error){say('No se pudo guardar: '+error.message,true);render();}
  }
  function onClick(e){if(e.target.closest('[data-production-refresh]')){safe=load();render();}}
  target.addEventListener('input',onInput);target.addEventListener('change',onChange);target.addEventListener('click',onClick);
  clean=()=>{target.removeEventListener('input',onInput);target.removeEventListener('change',onChange);target.removeEventListener('click',onClick);};
  safe=load();render();
 }
 return {mount,destroy};
});