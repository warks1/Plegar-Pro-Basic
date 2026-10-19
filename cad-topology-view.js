/* Plegar Pro Plus v0.20 — panel de topología y marcas nominales, SOLO inspección. */
(function(){'use strict';
const core=window.PlegarCadTopology,api=window.PlegarCadImport;
if(!core||!api)return;
const mountOriginal=api.mount,refreshOriginal=api.refresh;
let host=null;const n=id=>host?.querySelector('#'+id),fmt=x=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:3}).format(x);
function currentReport(){
 const document=api.getCurrent(),oriented=api.getOriented();if(!document)return null;
 const toleranceRaw=n('cad-topo-tolerance')?.value, tolerance=Number(toleranceRaw);
 if(toleranceRaw===''||!Number.isFinite(tolerance))throw new Error('Introduce una tolerancia de extremos entre 0 y 1 mm.');
 const report=core.inspect(document,{joinTolerance:tolerance,sameLayer:n('cad-topo-layer').checked});
 let mounting=null;if(oriented){const offsetRaw=n('cad-mount-offset')?.value||'0';if(!Number.isFinite(Number(offsetRaw)))throw new Error('Desplazamiento nominal de montaje inválido.');
  mounting=core.mountingMarks(oriented,{datum:n('cad-mount-datum')?.value||'inferior',offset:Number(offsetRaw)});}
 return {report,mounting};
}
function render(){if(!host||!n('cad-topo-summary'))return;
 const summary=n('cad-topo-summary'),download=n('cad-topo-export');
 try{
  const result=currentReport();download.disabled=!result;
  if(!result){summary.textContent='Importa un DXF para revisar si hay contornos abiertos, extremos próximos o formas anidadas.';return;}
  const s=result.report.summary,m=result.mounting;
  summary.textContent=`${s.entities} entidades; ${s.closed} cerradas y ${s.open} abiertas. ${s.endpointMatches} coincidencias nominales de extremos; ${s.nested} anidamientos posibles; ${s.uncertain} relaciones ambiguas. ${m?`Marcas de referencia A–B: ${fmt(m.distance_mm)} mm entre extremos de la envolvente, a Y = ${fmt(m.marks[0].y_mm)} mm. NO SON PUNTOS REALES DE AMARRE.`:'Selecciona un contorno para mostrar referencias nominales A–B.'} Ningún contorno se modifica ni se autoriza para CNC.`;
 }catch(e){download.disabled=true;summary.textContent='Auditoría no disponible: '+e.message;}
}
function exportJson(){try{const result=currentReport();if(!result)throw new Error('Sin DXF cargado.');const source=api.getSourceMeta(),payload={software:'Plegar Pro Plus',version:'0.20',source:{name:source?.name||'sin nombre',sha256:source?.sha256||null},...result,verified:false,approvedForCNC:false,approvedForSimulation:false};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='Plegar-Pro-Topologia-NO-VALIDADA.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){n('cad-topo-summary').textContent='No se ha podido exportar: '+e.message;}}
api.mount=function(element){const result=mountOriginal.apply(this,arguments);host=element;const panel=host?.querySelector('.cad-import-panel');if(!panel)return result;
 const section=document.createElement('section');section.className='cad-topology-panel';section.setAttribute('aria-label','Diagnóstico de topología y referencias nominales');
 section.innerHTML=`<strong>Topología DXF y referencias A–B · v0.20</strong><p>Busca contornos abiertos, extremos próximos y figuras cerradas anidadas. No reconstruye cadenas ni interpreta automáticamente huecos de corte.</p><div class="cad-topology-controls"><label class="ed-cell"><span>Tolerancia visual de extremos (mm)</span><input type="number" id="cad-topo-tolerance" value="0.05" step="0.01" min="0" max="1"></label><label class="cad-mirror"><input id="cad-topo-layer" type="checkbox" checked> Buscar extremos en la misma capa</label></div><p id="cad-topo-summary" class="cad-metrics" role="status">Carga un DXF para inspeccionarlo.</p><button type="button" id="cad-topo-export" disabled>Exportar topología y referencias JSON</button><p class="cad-danger"><b>SIN VERIFICAR / NO CNC.</b> Las referencias A–B son los extremos de la envolvente orientada, no amarras físicos. No se generan sólidos, programas de plegado ni aprobaciones de colisiones.</p>`;
 panel.append(section);
 for(const id of ['cad-topo-tolerance','cad-topo-layer'])n(id).addEventListener('input',render);
 n('cad-topo-export').addEventListener('click',exportJson);
 host.addEventListener('plegar-cad-updated',render);
 host.addEventListener('change',e=>{if(e.target.id?.startsWith('cad-'))render();});
 render();return result;};
api.refresh=function(){const r=refreshOriginal.apply(this,arguments);render();return r;};
})();
