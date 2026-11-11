/* Plegar Pro Plus · calculadora de FUERZA de plegado al aire.
 * Valores orientativos: no aplica límites de herramienta/máquina, NO CNC. */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./engineering-checks.js'):root.PlegarEngineeringChecks,
  typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc
 );
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarForceView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E,C){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>Number.isFinite(x)?x.toLocaleString('es-ES',{maximumFractionDigits:2,minimumFractionDigits:2}):'—';
 function defaults(profile,width){
  const setup=C.validateSetup(profile.setup);
  const die=C.DIES.find(d=>d.id===setup.die);
  const mat=E.MATERIALS.find(m=>m.id===profile.material);
  return {thickness:profile.thickness,length:width,opening:die.opening,rm:mat?mat.rm:null,
   material:profile.material,punch:setup.punch,die:die.name};
 }
 function html(profile,width){
  const d=defaults(profile,width);
  const field=(name,label,value,min,max,step,helper='')=>
   '<label class="force-field">'+esc(label)+'<input type="number" inputmode="decimal" data-force-input="'+name+
   '" min="'+min+'" max="'+max+'" step="'+step+'" value="'+(value==null?'':esc(value))+'" aria-describedby="force-help-'+name+'"/>'+
   '<small id="force-help-'+name+'">'+esc(helper)+'</small></label>';
  return '<section class="force-calculator" aria-label="Calculadora orientativa de fuerza de plegado al aire">'+
   '<header><h2>FUERZA DE PLEGADO · ESTIMACIÓN</h2><p>Pieza: <strong>'+esc(profile.name)+'</strong> · Material: '+esc(profile.material)+
   ' · matriz: '+esc(d.die)+'</p></header>'+
   '<p class="force-warning"><strong>ATENCIÓN · NO CNC:</strong> es una aproximación de plegado <em>al aire</em> cerca de 90°. No verifica la fuerza admitida por matriz, punzón, amarres ni plegadora. Comprueba la tabla de tonelaje y la resistencia real del material antes de fabricar.</p>'+
   '<div class="force-grid">'+
   field('thickness','Espesor de chapa e (mm)',d.thickness,.1,35,.1,'Espesor real en mm; la fuerza aumenta con e².')+
   field('length','Longitud de línea L (mm)',d.length,1,5000,1,'Longitud transversal de pliegue, NO desarrollo de la pieza.')+
   field('opening','Apertura de matriz V (mm)',d.opening,2,400,.1,'Apertura entre hombros de la matriz seleccionada.')+
   field('rm','Resistencia a tracción Rm (MPa)',d.rm,50,2000,1,'Rm de referencia supuesto; confirma el certificado del material.')+'</div>'+
   '<div class="force-results" data-force-result role="status" aria-live="polite"></div>'+
   '<div class="force-notes" data-force-notes></div>'+
   '<p class="force-formula">F(kN) ≈ 1,33 × Rm × L × e² ÷ (1000 × V). La constante 1,33 es una hipótesis de cálculo; otros fabricantes emplean coeficientes diferentes. El resultado no incluye calibración, proceso de acuñado, plegado a fondo ni cargas excéntricas.</p>'+
   '<div class="force-actions"><button type="button" data-force-reset>Restablecer medidas del programa 2D</button>'+
   '<button type="button" data-dev-open-editor="1">Abrir Programación 2D</button></div>'+
   '</section>';
 }
 function values(host){
  const num=name=>{
   const el=host.querySelector('[data-force-input="'+name+'"]');
   if(!el||el.value.trim()==='')return NaN;
   return Number(el.value);
  };
  return {thickness:num('thickness'),length:num('length'),opening:num('opening'),rm:num('rm')};
 }
 function paint(host){
  const output=host.querySelector('[data-force-result]');
  const notes=host.querySelector('[data-force-notes]');
  try{
   const r=E.estimateAirForce(values(host));
   output.dataset.valid='true';
   output.innerHTML='<div><small>Fuerza total orientativa</small><strong>'+fmt(r.forceKN)+' kN</strong></div>'+
    '<div><small>Equivalente en toneladas métricas</small><strong>'+fmt(r.tonnes)+' t</strong></div>'+
    '<div><small>Fuerza por metro de pliegue</small><strong>'+fmt(r.perMeterKN)+' kN/m</strong></div>'+
    '<div><small>Relación apertura / espesor</small><strong>'+fmt(r.vRatio)+' × e</strong></div>';
   notes.textContent=(r.warnings.length?r.warnings.join(' '):'Relación V/e dentro del intervalo orientativo 6–12.')+
    ' Sin verificación de carga de punzón, matriz, amarres o posición del plegado. No comparar automáticamente con una capacidad nominal de máquina.';
   return r;
  }catch(error){
   output.dataset.valid='false';
   output.textContent='SIN RESULTADO · '+error.message;
   notes.textContent='Corrige las entradas para calcular. No se conserva ni se envía un dato inválido al programa.';
   return null;
  }
 }
 let active=null;
 function destroy(){
  if(!active)return;
  active.host.removeEventListener('input',active.onInput);
  active.host.removeEventListener('click',active.onClick);
  active=null;
 }
 function mount(host,getProfile,getWidth){
  if(!host||typeof getProfile!=='function'||typeof getWidth!=='function')throw Error('No se puede montar el cálculo de fuerza.');
  destroy();
  const refresh=()=>{
   const profile=getProfile(),width=getWidth();
   host.innerHTML=html(profile,width);
   paint(host);
  };
  const onInput=e=>{if(e.target.closest('[data-force-input]'))paint(host);};
  const onClick=e=>{if(e.target.closest('[data-force-reset]'))refresh();};
  host.addEventListener('input',onInput);
  host.addEventListener('click',onClick);
  active={host,onInput,onClick};
  refresh();
  return {values:()=>values(host),result:()=>paint(host),reset:refresh,destroy};
 }
 return {defaults,html,values,paint,mount,destroy};
});