/* Plegar Pro Plus 0.19: historial voluntario de METADATOS locales de DXF. */
(function(){'use strict';
const core=window.PlegarCadTrace,api=window.PlegarCadImport;
if(!core||!api)return;
const originalMount=api.mount,originalRefresh=api.refresh;
let host=null,referenceGetter=null;
const n=id=>host?.querySelector('#'+id);
const message=(s)=>{const el=n('cad-trace-message');if(el)el.textContent=s;};
function input(){
 const source=api.getSourceMeta(),document=api.getCurrent(),shape=api.getSelected(),oriented=api.getOriented();
 if(!source||!document||!shape||!oriented)return null;
 return {source,document,shape,oriented,reference:referenceGetter?.()};
}
function exportJson(){
 const payload=core.exportRecords(localStorage),blob=new Blob([payload],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='plegar-pro-registro-DXF-SIN-VALIDAR.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function render(){
 if(!host)return;
 const pane=n('cad-trace-list'),save=n('cad-trace-save'),exportBtn=n('cad-trace-export'),clearBtn=n('cad-trace-clear');if(!pane)return;
 let current=null;try{current=input();}catch(e){n('cad-trace-current').textContent='Parámetros DXF no válidos: '+e.message;}
 save.disabled=!current;
 try{
  const records=core.list(localStorage);exportBtn.disabled=clearBtn.disabled=!records.length;
  pane.replaceChildren();
  if(!records.length){const p=document.createElement('p');p.textContent='No hay inspecciones guardadas en este navegador.';pane.append(p);}
  for(const rec of records){
   const row=document.createElement('div');row.className='cad-trace-entry';
   const summary=document.createElement('span');summary.textContent=`${rec.source.name} · SHA-256 ${rec.source.sha256.slice(0,14)}… · contorno #${rec.contour.index+1}, ${rec.contour.layer} · ${rec.recordedAt.slice(0,10)} · SIN VERIFICAR`;
   const remove=document.createElement('button');remove.type='button';remove.textContent='Borrar';remove.setAttribute('aria-label','Borrar registro local de '+rec.source.name);remove.addEventListener('click',()=>{try{core.remove(localStorage,rec.id);message('Registro local borrado.');render();}catch(e){message('Error al borrar: '+e.message);}});
   row.append(summary,remove);pane.append(row);
  }
  const match=current&&records.find(rec=>core.sameSource(rec,current.source.sha256));
  if(match)n('cad-trace-current').textContent='SHA-256 del DXF actual coincide con un archivo registrado anteriormente. Esto NO acredita procedencia ni validación CAD.';
  else n('cad-trace-current').textContent=current?`Archivo cargado: SHA-256 ${current.source.sha256} · NO VERIFICADO. Registrar es voluntario.`:'Carga un DXF para calcular su huella y registrar esta inspección.';
 }catch(e){exportBtn.disabled=clearBtn.disabled=true;pane.textContent='No se ha podido leer el registro local: '+e.message;}
}
api.mount=function(element,getReference){
 const response=originalMount.apply(this,arguments);host=element;referenceGetter=getReference;
 const panel=host?.querySelector('.cad-import-panel');if(!panel)return response;
 const section=document.createElement('section');section.className='cad-trace-panel';section.setAttribute('aria-label','Registro local de trazabilidad DXF');
 section.innerHTML=`<strong>Registro de inspecciones DXF · v0.19</strong><p>Guardado VOLUNTARIO en este navegador: nombre, SHA-256 de los bytes originales, capa, orientación y dimensiones. <b>No guarda el archivo DXF ni lo envía a servidores.</b> Al borrar los datos del navegador puedes perder este registro.</p><p id="cad-trace-current" class="cad-trace-current">Importa un archivo para obtener su huella.</p><div class="cad-trace-actions"><button type="button" id="cad-trace-save" disabled>Registrar inspección local</button><button type="button" id="cad-trace-export" disabled>Exportar registro JSON</button><button type="button" id="cad-trace-clear" disabled>Borrar todos los registros</button></div><div id="cad-trace-list" class="cad-trace-list" aria-label="Inspecciones registradas"></div><p id="cad-trace-message" role="status"></p><p class="cad-danger"><b>SIN VERIFICAR / NO CNC.</b> Una huella criptográfica identifica los bytes del archivo: NO certifica su origen, sus medidas, su contorno tridimensional, su amarre ni la seguridad de la operación.</p>`;
 panel.append(section);
 n('cad-trace-save').addEventListener('click',()=>{try{const record=core.makeRecord(input());core.save(localStorage,record);message('Metadatos guardados únicamente en este navegador. No se ha guardado el DXF.');render();}catch(e){message('No se pudo registrar: '+e.message);}});
 n('cad-trace-export').addEventListener('click',()=>{try{exportJson();message('Registro JSON exportado. No contiene el archivo DXF.');}catch(e){message('Error de exportación: '+e.message);}});
 n('cad-trace-clear').addEventListener('click',()=>{if(!window.confirm('¿Borrar todos los metadatos del registro DXF de este navegador?'))return;try{core.clear(localStorage);message('Se han borrado todos los registros locales.');render();}catch(e){message('Error de borrado: '+e.message);}});
 host.addEventListener('plegar-cad-updated',render);
 host.addEventListener('change',event=>{if(event.target.id?.startsWith('cad-'))render();});
 render();return response;
};
api.refresh=function(){const r=originalRefresh.apply(this,arguments);render();return r;};
})();
