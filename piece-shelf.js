/* v0.51 · Mis piezas: guardar, abrir, eliminar y copias JSON (dispositivo local). */
(function(){
 'use strict';
 const Lib=window.PlegarPieceLibrary,G=window.PlegarGeometry2D;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const $=q=>document.querySelector(q);
 let activeId=null,dialog=null,source='Programación 2D';
 function thumb(profile){
  const pts=G.vertices(profile),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),
   minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y)),
   scale=Math.min(248/Math.max(1,maxX-minX),107/Math.max(1,maxY-minY),7);
  const points=pts.map(p=>[160+(p.x-(minX+maxX)/2)*scale,76-(p.y-(minY+maxY)/2)*scale].map(x=>x.toFixed(2)).join(',')).join(' ');
  return '<svg viewBox="0 0 320 150" aria-hidden="true"><rect width="320" height="150" fill="#081c2b"/>'+
   '<polyline points="'+points+'" fill="none" stroke="#071019" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>'+
   '<polyline points="'+points+'" fill="none" stroke="#95dfff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
 }
 function paint(){
  const host=$('#ps-items');if(!host)return;
  try{
   const rows=Lib.list();
   $('#ps-total').textContent=rows.length+' de '+Lib.MAX+' piezas · solo en este navegador';
   host.innerHTML=rows.length?rows.map(p=>
    '<article class="ps-item" data-id="'+esc(p.id)+'">'+
     '<div class="ps-thumb">'+thumb(p.profile)+'</div>'+
     '<div class="ps-data"><h3>'+esc(p.name)+'</h3>'+
     '<p>'+esc(p.profile.material)+' · '+esc(p.profile.thickness)+' mm · ancho '+esc(p.width)+' mm</p>'+
     '<p>'+p.profile.segments.length+' tramos · '+p.profile.angles.length+' pliegues · '+esc(p.profile.sequence.map(x=>'B'+x).join(' → '))+'</p>'+
     '<small>Actualizada '+esc(new Date(p.updatedAt).toLocaleString('es-ES'))+(p.id===activeId?' · PIEZA ACTIVA':'')+'</small></div>'+
     '<div class="ps-actions"><button type="button" data-ps-action="open2d">Abrir 2D</button>'+
     '<button type="button" data-ps-action="open3d">Abrir 3D</button>'+
     '<button type="button" data-ps-action="delete" class="ps-danger">Eliminar</button></div></article>'
   ).join(''):'<div class="ps-empty">Todavía no has guardado piezas. Utiliza «Crear nueva pieza» o «Guardar en Mis piezas» desde Programación 2D/3D.</div>';
  }catch(e){host.innerHTML='<p class="ps-error">'+esc(e.message)+'</p>';}
 }
 function notice(s,isError=false){
  const t=$('#ps-notice');if(t){t.textContent=s;t.dataset.error=String(isError);}
 }
 function downloadJson(){
  const data=Lib.exportBackup(),blob=new Blob([data],{type:'application/json;charset=utf-8'}),
   url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Plegar-Pro-Mis-Piezas-Respaldo.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  notice('Respaldo exportado. Guárdalo fuera del navegador.');
 }
 function saveActive(){
  const profile=window.PlegarEditor2D.getData(),width=window.PlegarEditor2D.getWidth();
  const saved=Lib.save(profile,width,{id:activeId});
  activeId=saved.id;
  if(dialog?.open){paint();notice('Guardada: '+saved.name+'.')}
  return saved;
 }
 function construct(){
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.id='pieces-dialog';dialog.className='ps-dialog';
  dialog.setAttribute('aria-labelledby','ps-title');document.body.appendChild(dialog);
  dialog.innerHTML='<header class="ps-header"><div><h2 id="ps-title">MIS PIEZAS · 2D / 3D</h2><p>Programas guardados en este dispositivo. No están sincronizados en la nube.</p></div><button type="button" data-ps-action="close" aria-label="Cerrar Mis piezas">✕</button></header>'+
   '<section class="ps-body"><div class="ps-toolbar"><strong id="ps-total"></strong><button type="button" data-ps-action="save">Guardar pieza activa</button>'+
   '<button type="button" data-ps-action="backup">Exportar respaldo JSON</button>'+
   '<label class="ps-import">Restaurar respaldo JSON<input type="file" id="ps-file" accept=".json,application/json" aria-label="Importar copia de Mis piezas"/></label></div>'+
   '<div id="ps-items"></div><p class="ps-caution">Guardar aquí conserva perfiles, medidas y herramientas nominales, no modelos CAD industriales ni programas CNC. Borra datos del navegador solo después de exportar una copia.</p></section>'+
   '<footer class="ps-footer"><span id="ps-notice" role="status" aria-live="polite"></span><button type="button" data-ps-action="close">Cerrar</button></footer>';
  dialog.addEventListener('click',e=>{
   const action=e.target.closest('[data-ps-action]')?.dataset.psAction;
   if(!action)return;
   if(action==='close'){dialog.close();return;}
   try{
    if(action==='save'){const p=saveActive();notice('Pieza guardada: '+p.name);return;}
    if(action==='backup'){downloadJson();return;}
    const id=e.target.closest('.ps-item')?.dataset.id,stored=Lib.get(id);
    if(!stored)return;
    if(action==='delete'){
     if(!window.confirm('¿Eliminar «'+stored.name+'» de Mis piezas? Esta acción no se puede deshacer.'))return;
     Lib.remove(id);if(activeId===id)activeId=null;paint();notice('Pieza eliminada de la biblioteca local.');return;
    }
    if(action==='open2d'||action==='open3d'){
     const screen=action==='open3d'?'Programación 3D':'Programación 2D';
     window.PlegarEditor2D.loadProfile(stored.profile,{width:stored.width});
     activeId=stored.id;dialog.close();
     window.PlegarApp.switchScreen(screen);
    }
   }catch(ex){notice(ex.message,true);}
  });
  $('#ps-file').addEventListener('change',async event=>{
   const file=event.target.files?.[0];if(!file)return;
   try{
    if(file.size>1024*1024)throw Error('Copia JSON demasiado grande (máx. 1 MB).');
    const result=Lib.importBackup(await file.text());
    paint();notice('Restauradas '+result.added+' piezas. Duplicados omitidos: '+result.skipped+'.');
   }catch(ex){notice('No se pudo restaurar: '+ex.message,true);}
   finally{event.target.value='';}
  });
 }
 function open({screen='Programación 2D'}={}){
  source=screen;construct();paint();notice('');if(!dialog.open)dialog.showModal();
 }
 function setActiveId(id){
  if(id!==null&&!Lib.get(id))throw Error('La pieza seleccionada no existe en Mis piezas.');
  activeId=id;
 }
 function resetActive(){activeId=null;}
 window.PlegarPieceShelf={open,saveActive,getActiveId:()=>activeId,setActiveId,resetActive};
})();