/* Plegar Pro Plus v0.24 — panel de auditoría nominal de tangencias DXF. */
(function(){'use strict';
const core=window.PlegarCadTangency,api=window.PlegarCadImport;if(!core||!api)return;
const oldMount=api.mount,oldRefresh=api.refresh;let host=null;const q=id=>host?.querySelector('#'+id);
function inspect(){const d=api.getCurrent();if(!d)return null;
 const a=q('cad-tangent-angle')?.value,t=q('cad-topo-tolerance')?.value;
 if(a===''||t==='')throw new Error('Introduce tolerancias válidas.');
 return core.inspect(d,{angleTolerance:Number(a),joinTolerance:Number(t),sameLayer:q('cad-topo-layer')?.checked===true});}
function update(){const label=q('cad-tangent-summary'),button=q('cad-tangent-export'),list=q('cad-tangent-examples');if(!label||!button)return;
 list?.replaceChildren();try{const r=inspect();button.disabled=!r;
  if(!r){label.textContent='Importa un DXF para analizar tangencias nominales.';return;}
  const s=r.summary;label.textContent=`${s.arcs} arcos/círculos · ${s.smoothTangencies} uniones tangentes · ${s.sharpTransitions} cambios de dirección · ${s.externalTangentCandidates} posibles tangencias entre entidades. ${s.limited?'ANÁLISIS PARCIAL.':'Auditoría nominal completada.'} SIN VERIFICAR / NO CNC.`;
  for(const x of r.examples.slice(0,5)){const li=document.createElement('li');li.textContent=`${x.type}: perfil ${x.from.contour+1} / ${x.to.contour+1} · ${x.deviation_deg}° · separación ${x.gap_mm} mm`;list?.append(li);}
 }catch(e){button.disabled=true;label.textContent='Auditoría no disponible: '+e.message;}}
function download(){try{const r=inspect();if(!r)throw new Error('Importa un DXF antes.');
 const source=api.getSourceMeta()||{},payload={software:'Plegar Pro Plus',source:{name:source.name||'',sha256:source.sha256||null},...r};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='Plegar-Pro-Tangencias-NO-VERIFICADAS.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){const label=q('cad-tangent-summary');if(label)label.textContent='No se ha podido exportar: '+e.message;}}
api.mount=function(element){const r=oldMount.apply(this,arguments);host=element;const parent=host?.querySelector('.cad-import-panel');if(!parent)return r;
 const section=document.createElement('section');section.className='cad-tangency-panel';section.setAttribute('aria-label','Inspección de tangencias de curvas DXF');
 section.innerHTML='<strong>Tangencias de arcos DXF · v0.24</strong><p>Compara direcciones tangentes analíticas de las entidades ARC, CIRCLE y polilíneas bulge, frente a líneas del mismo perfil o de otras entidades. No certifica continuidad geométrica industrial.</p><label for="cad-tangent-angle">Tolerancia angular (0–10°)</label><input id="cad-tangent-angle" type="number" min="0" max="10" value="1" step="0.1"><p id="cad-tangent-summary" role="status" class="cad-metrics">Importa un DXF para analizarlo.</p><ol id="cad-tangent-examples" class="cad-tangency-examples"></ol><button id="cad-tangent-export" type="button" disabled>Exportar informe de tangencias JSON</button><p class="cad-danger"><b>SIN VERIFICAR / NO CNC.</b> La coincidencia de tangentes no valida radios reales, amarre, colisiones ni fabricación.</p>';
 parent.append(section);q('cad-tangent-export').addEventListener('click',download);q('cad-tangent-angle').addEventListener('input',update);for(const id of ['cad-topo-tolerance','cad-topo-layer'])q(id)?.addEventListener('input',update);
 host.addEventListener('plegar-cad-updated',update);update();return r;};
api.refresh=function(){const r=oldRefresh.apply(this,arguments);update();return r;};
})();
