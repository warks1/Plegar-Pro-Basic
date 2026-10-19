/* Plegar Pro Plus v0.22 — informe de cruces/continuidad DXF, sin mutación. */
(function(){'use strict';
const core=window.PlegarCadCrossings,api=window.PlegarCadImport;
if(!core||!api)return;
const oldMount=api.mount,oldRefresh=api.refresh;let host=null;const q=id=>host?.querySelector('#'+id);
function report(){const d=api.getCurrent();if(!d)return null;
 const value=q('cad-topo-tolerance')?.value;
 if(value===undefined||value==='')throw new Error('Indica una tolerancia en milímetros.');
 return core.inspect(d,{joinTolerance:Number(value),sameLayer:q('cad-topo-layer')?.checked===true});}
function update(){const label=q('cad-crossings-summary'),exportButton=q('cad-crossings-export');if(!label||!exportButton)return;
 try{const r=report();exportButton.disabled=!r;
  if(!r){label.textContent='Importa un DXF para analizar cruces, uniones T y solapes.';return;}
  const s=r.summary;label.textContent=`${s.segments} segmentos · ${s.crossings} cruces · ${s.tJunctions} uniones T · ${s.overlaps} solapes · ${s.nearGaps} proximidades. ${s.limited?'ANÁLISIS PARCIAL: límite de comparaciones alcanzado.':'Cribado nominal completado.'} SIN VERIFICAR / NO CNC.`;
 }catch(e){exportButton.disabled=true;label.textContent='Auditoría no disponible: '+e.message;}}
function download(){try{const r=report();if(!r)throw new Error('Importa un DXF primero.');
 const source=api.getSourceMeta()||{},payload={software:'Plegar Pro Plus',version:'0.22',source:{name:source.name||'',sha256:source.sha256||null},...r};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Plegar-Pro-Cruces-NO-VALIDADOS.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){const label=q('cad-crossings-summary');if(label)label.textContent='No se ha podido exportar: '+e.message;}}
api.mount=function(element){const r=oldMount.apply(this,arguments);host=element;const parent=host?.querySelector('.cad-import-panel');if(!parent)return r;
 const section=document.createElement('section');section.className='cad-crossings-panel';section.setAttribute('aria-label','Auditoría orientativa de cruces de perfiles DXF');
 section.innerHTML='<strong>Cruces y continuidad de perfiles DXF · v0.22</strong><p>Detecta cruces de segmentos, uniones T, solapes y separaciones muy pequeñas dentro de la tolerancia de topología. Los arcos son aproximados por segmentos.</p><p id="cad-crossings-summary" class="cad-metrics" role="status">Importa un DXF para analizarlo.</p><button id="cad-crossings-export" type="button" disabled>Exportar cruces y continuidad JSON</button><p class="cad-danger"><b>SIN VERIFICAR / NO CNC.</b> No ensambla geometría, no certifica un perfil de fabricante ni comprueba colisiones reales.</p>';
 parent.append(section);q('cad-crossings-export').addEventListener('click',download);
 for(const id of ['cad-topo-tolerance','cad-topo-layer'])q(id)?.addEventListener('input',update);
 host.addEventListener('plegar-cad-updated',update);update();return r;};
api.refresh=function(){const r=oldRefresh.apply(this,arguments);update();return r;};
})();
