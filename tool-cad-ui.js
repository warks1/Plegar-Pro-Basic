/* Plegar Pro Plus · vista/descarga de perfiles reconstruidos v127f.
   No transmite datos a la máquina ni guarda archivos del cliente en el servidor. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./tool-cad.js'):root.PlegarToolCAD);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolCADUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(CAD){
 'use strict';
 const clean=s=>String(s??'').replace(/[^a-zA-Z0-9._-]/g,'_');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null;
 function close(){
  if(!current)return;
  document.removeEventListener('keydown',current.onKey);
  const previous=current.previous;
  current.root.remove();current=null;
  if(previous?.isConnected)previous.focus?.();
 }
 function filename(rec,format){return clean(rec.id)+'_RECONSTRUIDO_NO_CNC.'+format;}
 function contents(rec,format){
  if(format==='dxf')return {body:CAD.dxf(rec),mime:'application/dxf;charset=utf-8'};
  if(format==='svg')return {body:CAD.svg(rec),mime:'image/svg+xml;charset=utf-8'};
  if(format==='json')return {body:JSON.stringify(CAD.sheet(rec),null,2),mime:'application/json;charset=utf-8'};
  throw Error('Formato de plano no admitido');
 }
 function open(tool){
  if(typeof document==='undefined')throw Error('Se necesita un navegador');
  const rec=CAD.build(tool);
  close();
  const previous=document.activeElement,root=document.createElement('div');
  root.className='toolcad-overlay';
  root.innerHTML='<section class="toolcad-dialog" role="dialog" aria-modal="true" aria-label="Planos de herramienta '+esc(rec.code||rec.id)+'">'+
   '<header><h2>Planos de '+esc(rec.name)+'</h2><button type="button" data-cad-close aria-label="Cerrar plano">✕ Cerrar</button></header>'+
   '<p class="toolcad-warning"><strong>'+esc(rec.status)+'</strong>. Este plano es un perfil reconstruido, NO es CAD oficial del fabricante y NO se debe usar para CNC ni para verificar colisiones.</p>'+
   '<div class="toolcad-preview">'+CAD.svg(rec)+'</div>'+
   '<div class="toolcad-checks"><strong>Comprobaciones geométricas</strong><p>'+rec.checks.filter(c=>c.ok).length+' de '+rec.checks.length+' correctas · '+rec.assumedCount+' cotas supuestas o transiciones sin documentar.</p>'+
   rec.checks.filter(c=>!c.ok).map(c=>'<p>Revisar: '+esc(c.id)+' · '+esc(c.detail)+'</p>').join('')+'</div>'+
   '<nav aria-label="Descargar plano reconstruido"><button data-cad-format="dxf" type="button">DXF acotado</button><button data-cad-format="svg" type="button">SVG acotado</button><button data-cad-format="json" type="button">Ficha JSON</button></nav>'+
   '<p class="toolcad-status" role="status" aria-live="polite">Todas las cotas asumidas requieren confirmación física o documental.</p>'+
   '</section>';
  document.body.appendChild(root);
  const onKey=e=>{if(e.key==='Escape')close();};
  document.addEventListener('keydown',onKey);
  current={root,previous,onKey,rec};
  root.addEventListener('click',e=>{
   if(e.target===root||e.target.closest('[data-cad-close]')){close();return;}
   const format=e.target.closest('[data-cad-format]')?.dataset.cadFormat;
   if(!format)return;
   try{
    const {body,mime}=contents(rec,format);
    const url=URL.createObjectURL(new Blob([body],{type:mime}));
    const a=document.createElement('a');a.href=url;a.download=filename(rec,format);
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    root.querySelector('.toolcad-status').textContent='Archivo '+format.toUpperCase()+' generado y preparado para descarga. NO CNC.';
   }catch(error){root.querySelector('.toolcad-status').textContent='No se pudo generar el plano: '+error.message;}
  });
  root.querySelector('[data-cad-close]').focus();
  return rec;
 }
 return {open,close,contents,filename};
});