/* Inspector nominal de montaje v0.18. Extensión aislada de la vista DXF. */
(function(){'use strict';
const api=window.PlegarCadImport,orient=window.PlegarCadOrientation,audit=window.PlegarCadMountAudit;
if(!api||!orient||!audit)return;
const originalMount=api.mount,originalRefresh=api.refresh;
let currentHost=null,referenceGetter=null;
const fmt=x=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(x);
function element(id){return currentHost?.querySelector('#'+id);}
function data(){
 const doc=api.getCurrent(),shape=api.getSelected();if(!doc||!shape)return null;
 const settings={rotation:Number(element('cad-rotation')?.value||0),mirror:element('cad-mirror')?.checked===true,anchor:element('cad-origin')?.value||'min-min',tolerance:Number(element('cad-tolerance')?.value??0.5)};
 const out=orient.inspect(shape,settings);
 return audit.audit(doc,shape,out,referenceGetter?.(),{datum:element('cad-mount-datum')?.value||'inferior',offset:element('cad-mount-offset')?.value??0});
}
function render(){
 const status=element('cad-mount-result'),button=element('cad-mount-export');if(!status)return;
 try{const d=data();button.disabled=!d;
  if(!d){status.textContent='Carga un DXF y selecciona un contorno antes de realizar la auditoría.';return;}
  const p=d.nominalMountingPlane,c=d.comparison;
  status.textContent=`BLOQUEADO · SIN VERIFICAR. Plano ${p.type} Y=${fmt(p.y_mm)} mm. Distancia al borde inferior ${fmt(p.distanceFromLowerEdge_mm)} mm; al superior ${fmt(p.distanceFromUpperEdge_mm)} mm. ${c.compared?'Cotejo de cotas publicado: Δaltura '+fmt(c.heightDelta??0)+' mm'+(c.widthDelta!==null?', Δancho '+fmt(c.widthDelta)+' mm':' (ancho sin documentar)')+'.':'Sin referencia documental contrastable.'} ${d.blockers.length} aspectos pendientes: ${d.blockers.join(' ')}`;
 }catch(e){button.disabled=true;status.textContent='Auditoría no disponible: '+e.message;}
}
function download(){try{const out=data();if(!out)throw new Error('No hay un contorno seleccionado.');
 const payload=JSON.stringify(out,null,2),uri=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
 const a=document.createElement('a');a.href=uri;a.download='plegar-pro-auditoria-montaje-NO-VALIDADA.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(uri);
 }catch(e){element('cad-mount-result').textContent='No se pudo exportar: '+e.message;}}
api.mount=function(host,getReference){
 const result=originalMount.apply(this,arguments);currentHost=host;referenceGetter=getReference;
 const panel=host.querySelector('.cad-import-panel');if(!panel)return result;
 const field=document.createElement('section');field.className='cad-mounting-panel';field.setAttribute('aria-label','Auditoría nominal de montaje, no validada');
 field.innerHTML=`<strong>Auditoría dimensional de montaje · v0.18</strong><p>Plano de referencia NOMINAL del DXF, sin geometría de fijación real ni autorización para plegado.</p><div class="cad-mounting-controls"><label class="ed-cell"><span>Referencia en Y del contorno orientado</span><select id="cad-mount-datum"><option value="inferior">Borde inferior nominal</option><option value="superior">Borde superior nominal</option></select></label><label class="ed-cell"><span>Desplazamiento del plano (mm)</span><input id="cad-mount-offset" type="number" min="-500" max="500" step="0.1" value="0" inputmode="decimal"></label></div><p id="cad-mount-result" class="cad-mount-result" role="status">Importa un DXF para inspeccionar la referencia.</p><button type="button" id="cad-mount-export" disabled>Exportar auditoría JSON (NO VALIDADA)</button><p class="cad-danger"><b>SIN VERIFICAR — BLOQUEADO.</b> No es una línea de apoyo real, no certifica altura instalada, amarre, compatibilidad con máquina, colisiones ni exportación CNC.</p>`;
 panel.appendChild(field);
 for(const id of ['cad-mount-datum','cad-mount-offset'])element(id).addEventListener('input',render);
 element('cad-mount-export').addEventListener('click',download);
 host.addEventListener('change',e=>{if(e.target.id?.startsWith('cad-'))render();});
 const sourceStatus=element('cad-status');if(sourceStatus){new MutationObserver(render).observe(sourceStatus,{childList:true,subtree:true});}
 render();return result;
};
api.refresh=function(){const result=originalRefresh.apply(this,arguments);render();return result;};
})();
