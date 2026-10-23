/* Auditoría comparativa de longitud axial de utillajes DXF locales.
 * Inspección documental, sin cálculo de amarre, fuerza, secuencia ni colisiones.
 * Las coordenadas de sección NO definen por sí solas una superficie de apoyo.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolFitAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function positiveOptional(v,label,limit=10000){
  if(v===null||v===undefined||v==='')return null;
  const n=Number(v);
  if(!Number.isFinite(n)||n<=0||n>limit)throw Error(label+' fuera de rango o inválido.');
  return n;
 }
 function span(tool,kind){
  if(!tool)return null;
  if(tool.kind!==kind||typeof tool.id!=='string'||!/^local-[a-z0-9-]{8,60}$/.test(tool.id))
   throw Error('Selecciona un DXF local del tipo correcto ('+kind+').');
  if(tool.geometryCertified!==false||tool.collisionApproved!==false||tool.simulatable!==false)
   throw Error('Perfil incompatible con el inspector documental.');
  const height=tool.bounds?.height,sectionWidth=tool.bounds?.width;
  if(!finite(height)||height<=0||!finite(sectionWidth)||sectionWidth<=0)
   throw Error('Dimensiones DXF inválidas.');
  return {id:tool.id,brand:String(tool.brand),code:String(tool.code),axialMm:positiveOptional(tool.lengthMm,'Longitud axial'),
   sectionHeightMm:height,sectionWidthMm:sectionWidth,holeCount:tool.holeCount||0};
 }
 function inspect({punch=null,die=null,sheetWidthMm=null,machine=null,machineSetup=null}={}){
  const p=span(punch,'punch'),d=span(die,'die');
  const width=positiveOptional(sheetWidthMm,'Ancho de chapa');
  let length=null,machineInfo=null;
  if(machine!==null){
   if(!machine||machine.id!=='bystronic-ep-ii-31-100-2006')throw Error('Modelo de referencia no reconocido.');
   length=positiveOptional(machine.bendingLengthMm,'Longitud de plegado de ficha');
   machineInfo={id:machine.id,title:'Bystronic EP II 31-100 (2006)',
    candidate:true,lengthMm:length,source:String(machine.source?.name||'Anuncio no oficial'),
    verifiedOnSpecificMachine:false};
  }
  const s=machineSetup||{},required=['dieHeight','tableLeft','tableRight','ramWidth','ramBottomOffset'];
  const measured={};
  for(const key of required)measured[key]=positiveOptional(s[key],key,2000);
  const provided=required.filter(k=>measured[k]!==null),missing=required.filter(k=>measured[k]===null);
  const warnings=[],blockers=[
   'Las superficies reales de amarre punzón-trancha y matriz-mesa no están definidas en estos perfiles.',
   'Sin topes, posición X/R, envolventes verificadas y trayectoria completa; NO se puede autorizar una secuencia CNC.',
   'Se desconocen compatibilidad de amarre, resistencia y tolerancias del montaje.'
  ];
  if(!p)blockers.push('Selecciona un DXF de punzón.');
  if(!d)blockers.push('Selecciona un DXF de matriz.');
  if(width===null)blockers.push('Indica el ancho nominal de la chapa.');
  if(!machineInfo)blockers.push('No has elegido una referencia de máquina para contrastar su longitud.');
  else blockers.push('La EP II 31-100 es solo un modelo candidato procedente de un anuncio; verifica la placa y el número de serie.');
  if(missing.length)blockers.push('Envolventes de mesa/trancha no completas: '+missing.join(', ')+'.');
  if(p&&p.axialMm===null)blockers.push('Largo axial del punzón desconocido.');
  if(d&&d.axialMm===null)blockers.push('Largo axial de la matriz desconocido.');
  const axialCapacity=p?.axialMm!==null&&d?.axialMm!==null&&p&&d?Math.min(p.axialMm,d.axialMm):null;
  const exceedsPair=width!==null&&axialCapacity!==null&&width>axialCapacity+1e-6;
  if(exceedsPair)warnings.push('El ancho de chapa supera la longitud mínima del par individual. Habría que estudiar fraccionamiento, apoyos y disposición real.');
  const exceedsMachine=width!==null&&length!==null&&width>length+1e-6;
  if(exceedsMachine)warnings.push('El ancho de chapa supera la longitud publicada del modelo candidato (sin confirmar tu máquina).');
  const toolLongerThanMachine=length!==null&&[p?.axialMm,d?.axialMm].some(v=>v!==null&&v!==undefined&&v>length+1e-6);
  if(toolLongerThanMachine)warnings.push('Al menos una herramienta declarada supera la longitud nominal publicada del modelo candidato.');
  if(d&&measured.dieHeight!==null)warnings.push('Altura DXF de sección y altura de matriz respecto al apoyo no son necesariamente la misma cota: verificar origen CAD.');
  return {
   version:1,scope:'COTEJO NOMINAL DE LONGITUDES; NO SEGURIDAD',
   approvedForSimulation:false,approvedForCNC:false,collisionClearanceVerified:false,
   punch:p,die:d,sheetWidthMm:width,machine:machineInfo,nominalPairSpanMm:axialCapacity,
   machineSetup:{supplied:provided,missing,values:measured,geometryVerified:false},
   checks:{sheetExceedsSinglePair:exceedsPair,sheetExceedsCandidateMachine:exceedsMachine,toolExceedsCandidateMachine:toolLongerThanMachine},
   warnings,blockers,
   conclusion:exceedsPair||exceedsMachine||toolLongerThanMachine?'INCOMPATIBILIDAD NOMINAL / REVISAR':'INDETERMINADO · SIN VERIFICAR'
  };
 }
 function svg(report){
  if(!report||report.version!==1||report.approvedForCNC!==false)throw Error('Auditoría nominal inválida.');
  const maximum=Math.max(100,report.sheetWidthMm||0,report.nominalPairSpanMm||0,
   report.punch?.axialMm||0,report.die?.axialMm||0,report.machine?.lengthMm||0);
  const scale=650/maximum,x=130;
  const bars=[
   {name:'Chapa',mm:report.sheetWidthMm,y:62,fill:'#3baad9'},
   {name:'Punzón',mm:report.punch?.axialMm??null,y:116,fill:'#d3dae3'},
   {name:'Matriz',mm:report.die?.axialMm??null,y:170,fill:'#cd7880'},
   {name:'Máquina¹',mm:report.machine?.lengthMm??null,y:224,fill:'#9885bf'}
  ];
  return '<svg viewBox="0 0 850 304" class="tool-fit-graph" role="img" aria-label="Comparador nominal de longitudes de chapa, punzón y matriz; sin verificación física">'+
   '<rect width="850" height="304" rx="10" fill="#091f32"/>'+
   '<text x="18" y="26" font-size="16" fill="#d2efff">Longitudes axiales · mm · no es plano de montaje</text>'+
   bars.map(b=>{
    const n=b.mm===null?null:Math.max(1,Math.round(b.mm*scale));
    return '<text x="17" y="'+(b.y+11)+'" font-size="13" fill="#f3f6fc">'+esc(b.name)+'</text>'+
     (n===null?'<rect x="'+x+'" y="'+b.y+'" width="400" height="18" fill="#243e54" stroke="#849eb0" stroke-dasharray="4 4"/>'+
      '<text x="'+(x+10)+'" y="'+(b.y+13)+'" font-size="11" fill="#fff">SIN MEDIDA</text>':
      '<rect x="'+x+'" y="'+b.y+'" width="'+n+'" height="18" rx="2" fill="'+b.fill+'"/>'+
      '<text x="'+(x+n+9)+'" y="'+(b.y+14)+'" font-size="12" fill="#fff">'+fmt(b.mm)+' mm</text>');
   }).join('')+
   '<text x="18" y="279" font-size="11" fill="#ffe1b3">¹ Referencia Bystronic solo si elegida: modelo CANDIDATO, no máquina identificada</text>'+
   '<text x="18" y="294" font-size="11" fill="#ffe1b3">Barras alineadas para comparar longitudes, NO posiciones de amarre ni topes</text></svg>';
 }
 function json(report){
  if(!report||report.version!==1||report.approvedForCNC!==false||report.collisionClearanceVerified!==false)
   throw Error('No se admite informe que autorice el plegado.');
  return JSON.stringify(report,null,2);
 }
 let active=null;
 function mount(host){
  if(!host)return;
  active={host,punch:'',die:''};
  host.innerHTML='<section class="tool-fit-panel" aria-label="Cotejo de montaje nominal de punzón y matriz">'+
   '<details><summary>Comparar montaje nominal · punzón / matriz / chapa / máquina</summary>'+
   '<p>Selecciona perfiles DXF importados para comparar las longitudes axiales declaradas con el ancho de chapa. '+
   'Este examen documental NO identifica amarres, NO certifica topes ni verifica colisiones.</p>'+
   '<div class="tool-fit-fields">'+
   '<label>Punzón importado<select data-tool-fit="punch"><option value="">Seleccionar DXF de punzón</option></select></label>'+
   '<label>Matriz importada<select data-tool-fit="die"><option value="">Seleccionar DXF de matriz</option></select></label>'+
   '<label>Ancho de chapa (mm)<input data-tool-fit="sheet" type="number" min="0.01" max="10000" step="0.01" placeholder="Sin medir"></label>'+
   '<label>Longitud nominal de la máquina<select data-tool-fit="machine"><option value="">Sin máquina identificada</option>'+
   '<option value="bystronic-ep-ii-31-100-2006">Bystronic EP II 31-100 2006 · modelo CANDIDATO</option></select></label></div>'+
   '<button type="button" data-tool-fit-action="inspect">Actualizar cotejo</button>'+
   '<button type="button" data-tool-fit-action="export">Exportar informe JSON · NO VALIDADO</button>'+
   '<div data-tool-fit-result role="status" aria-live="polite"></div>'+
   '<p class="tool-fit-warning"><strong>SIN HOMOLOGAR.</strong> Un resultado sin incompatibilidades numéricas NO significa ausencia de colisiones. Las medidas de mesa, trancha, adaptadores, apoyos y topes de tu máquina siguen pendientes de verificación.</p>'+
   '</details></section>';
  const editor=root.PlegarEditor2D;
  const width=editor?.getWidth?.();
  if(finite(width)&&width>0)host.querySelector('[data-tool-fit="sheet"]').value=String(width);
  host.onchange=e=>{if(e.target.matches('[data-tool-fit]'))draw();};
  host.onclick=e=>{
   const a=e.target.closest('[data-tool-fit-action]');if(!a)return;
   const action=a.dataset.toolFitAction;
   if(action==='inspect'){draw();return;}
   if(action==='export'){
    try{
     const output=json(current()),url=root.URL.createObjectURL(new Blob([output],{type:'application/json'}));
     const link=root.document.createElement('a');link.href=url;link.download='plegar-pro-cotejo-montaje-SIN-VALIDAR.json';
     root.document.body.appendChild(link);link.click();link.remove();
     setTimeout(()=>root.URL.revokeObjectURL(url),1200);
    }catch(err){host.querySelector('[data-tool-fit-result]').textContent='No se pudo exportar: '+err.message;}
   }
  };
  refresh();
 }
 function current(){
  if(!active?.host)throw Error('Inspector sin abrir.');
  const h=active.host,library=root.PlegarToolDXF?.read?.()||[];
  const select=k=>h.querySelector('[data-tool-fit="'+k+'"]').value;
  const punch=library.find(x=>x.id===select('punch'))||null,
   die=library.find(x=>x.id===select('die'))||null,
   machine=select('machine')==='bystronic-ep-ii-31-100-2006'?root.PlegarMachineReferences?.reference:null,
   machineSetup=root.PlegarEditor2D?.getData?.()?.setup||null;
  return inspect({punch,die,sheetWidthMm:select('sheet'),machine,machineSetup});
 }
 function draw(){
  if(!active?.host)return;
  const area=active.host.querySelector('[data-tool-fit-result]');
  try{
   const report=current();
   area.innerHTML='<p><strong>'+esc(report.conclusion)+'</strong> · '+report.blockers.length+
    ' aspectos pendientes · '+report.warnings.length+' avisos nominales.</p>'+
    svg(report)+
    '<p class="tool-fit-subtitle">Pendiente verificar:</p><ul>'+report.blockers.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
    (report.warnings.length?'<p class="tool-fit-subtitle">Incompatibilidades y observaciones:</p><ul>'+
      report.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'');
  }catch(err){area.textContent='Cotejo no disponible: '+err.message;}
 }
 function refresh(){
  if(!active?.host?.isConnected)return;
  const h=active.host,library=root.PlegarToolDXF?.read?.()||[];
  for(const kind of ['punch','die']){
   const sel=h.querySelector('[data-tool-fit="'+kind+'"]'),prior=sel.value;
   sel.innerHTML='<option value="">Seleccionar DXF de '+(kind==='punch'?'punzón':'matriz')+'</option>'+
    library.filter(x=>x.kind===kind).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.brand+' · '+x.code+
      (x.lengthMm===null?' · largo desconocido':' · '+fmt(x.lengthMm)+' mm'))+'</option>').join('');
   if(library.some(x=>x.kind===kind&&x.id===prior))sel.value=prior;
  }
  draw();
 }
 return {inspect,svg,json,mount,refresh};
});
