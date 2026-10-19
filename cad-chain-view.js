/* Plegar Pro Plus v0.21 — panel independiente de conectividad, solo lectura. */
(function(){'use strict';
const core=window.PlegarCadChain,topo=window.PlegarCadTopology,api=window.PlegarCadImport;if(!core||!topo||!api)return;
const oldMount=api.mount,oldRefresh=api.refresh;let host=null;const q=id=>host?.querySelector('#'+id);
function result(){const d=api.getCurrent();if(!d)return null;
 const raw=q('cad-topo-tolerance')?.value;
 if(raw===''||raw===undefined)throw new Error('Indica una tolerancia en milímetros.');
 const tolerance=Number(raw),sameLayer=q('cad-topo-layer')?.checked===true;
 const topoReport=topo.inspect(d,{joinTolerance:tolerance,sameLayer});
 return core.inspect(d,{joinTolerance:tolerance,sameLayer,topology:topoReport});
}
function update(){const label=q('cad-chain-summary'),button=q('cad-chain-export');if(!label||!button)return;
 try{const r=result();button.disabled=!r;if(!r){label.textContent='Importa un DXF para inspeccionar cadenas y extremos.';return;}
  const s=r.summary;label.textContent=`${s.openEntities} entidades abiertas · ${s.components} agrupaciones · ${s.candidatePairs} coincidencias de extremos · ${s.branches} bifurcaciones · ${s.transitiveGroups} grupos ambiguos · ${s.nominalCycles} ciclos nominales. Estado de preparación 3D: NO HABILITADO. SIN VERIFICAR / NO CNC.`;
 }catch(e){button.disabled=true;label.textContent='Diagnóstico no disponible: '+e.message;}
}
function download(){try{const r=result();if(!r)throw new Error('Importa primero un archivo DXF.');
 const info=api.getSourceMeta()||{};const report={software:'Plegar Pro Plus',version:'0.21',source:{name:info.name||'',sha256:info.sha256||null},...r};
 const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='Plegar-Pro-Conectividad-NO-VALIDADA.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){const label=q('cad-chain-summary');if(label)label.textContent='Exportación no disponible: '+e.message;}
}
api.mount=function(element){const r=oldMount.apply(this,arguments);host=element;const parent=host?.querySelector('.cad-import-panel');if(!parent)return r;
 const section=document.createElement('section');section.className='cad-chain-panel';section.setAttribute('aria-label','Grafo nominal de cadenas y requisitos 3D');
 section.innerHTML='<strong>Conectividad de contornos · v0.21</strong><p>Detecta cadenas abiertas, bifurcaciones y ciclos nominales entre extremos próximos. No modifica el DXF ni incorpora perfiles al simulador.</p><p id="cad-chain-summary" class="cad-metrics" role="status">Carga un DXF para inspeccionarlo.</p><button type="button" id="cad-chain-export" disabled>Exportar diagnóstico de conectividad JSON</button><p class="cad-danger"><b>NO HABILITADO PARA 3D / CNC.</b> Un grafo de extremos no demuestra un sólido ni valida puntos de amarre o colisiones.</p>';
 parent.append(section);q('cad-chain-export').addEventListener('click',download);
 for(const id of ['cad-topo-tolerance','cad-topo-layer'])q(id)?.addEventListener('input',update);
 host.addEventListener('plegar-cad-updated',update);update();return r;};
api.refresh=function(){const r=oldRefresh.apply(this,arguments);update();return r;};
})();
