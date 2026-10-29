/* Plegar Pro Basic - preferencias reales del navegador, sin ajustes CNC ni red.
 * Cada control realiza una acción local verificable. Ningún cambio altera parámetros físicos.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarSettings=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const KEY='plegarpro-settings-v1';
 const DEFAULT=Object.freeze({
  theme:'dark',accent:'blue',density:'normal',textScale:'100',
  reducedMotion:false,homeView:'cad',camera:'profile',
  repeat:true,speed:'1',exportResolution:'2160',startupScreen:'Inicio'
 });
 const OPTIONS=Object.freeze({
  theme:['dark','light','contrast'],accent:['blue','cyan','amber'],
  density:['normal','compact'],textScale:['90','100','110','125'],
  homeView:['cad'],camera:['iso','profile','front','top'],
  speed:['0.5','1','2'],exportResolution:['1080','1440','2160'],
  startupScreen:['Inicio','Proyectos','Programación 2D','Simulación 3D']
 });
 const safe=(s='')=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function normalize(source){
  const p={...DEFAULT};
  if(!source||typeof source!=='object'||Array.isArray(source))return p;
  for(const [key,options] of Object.entries(OPTIONS))
   if(Object.prototype.hasOwnProperty.call(source,key)&&options.includes(String(source[key])))p[key]=String(source[key]);
  if(typeof source.reducedMotion==='boolean')p.reducedMotion=source.reducedMotion;
  if(typeof source.repeat==='boolean')p.repeat=source.repeat;
  return p;
 }
 function load(){
  try{return normalize(JSON.parse(root.localStorage.getItem(KEY)||'null'));}
  catch{return normalize(null);}
 }
 let prefs=load();
 function get(){return {...prefs};}
 function apply(){
  const doc=root.document;if(!doc)return;
  const el=doc.documentElement;
  el.dataset.ppTheme=prefs.theme;
  el.dataset.ppAccent=prefs.accent;
  el.dataset.ppDensity=prefs.density;
  el.dataset.ppMotion=prefs.reducedMotion?'reduced':'normal';
  el.style.setProperty('--pp-zoom',String(Number(prefs.textScale)/100));
 }
 function save(){
  try{root.localStorage.setItem(KEY,JSON.stringify(prefs));return true;}catch{return false;}
 }
 function set(key,value){
  if(!Object.prototype.hasOwnProperty.call(DEFAULT,key))throw new Error('Ajuste desconocido.');
  let v=value;
  if(key==='reducedMotion'||key==='repeat'){
   if(typeof v!=='boolean')throw new Error('Interruptor inválido.');
  }else{
   v=String(v);
   if(!OPTIONS[key]?.includes(v))throw new Error('Opción no admitida.');
  }
  prefs={...prefs,[key]:v};apply();return save();
 }
 function replace(source){
  if(!source||source.format!=='plegar-pro-settings'||source.version!==1)
   throw new Error('Archivo de preferencias incompatible.');
  if(!source.settings||typeof source.settings!=='object'||Array.isArray(source.settings))
   throw new Error('Preferencias incompletas.');
  const normalized=normalize(source.settings);
  // No aceptar opciones desconocidas o inválidas en un import, evitar cambios silenciosos.
  for(const [key,value] of Object.entries(source.settings)){
   if(!(key in DEFAULT))throw new Error('Ajuste no reconocido: '+key);
   if(key==='repeat'||key==='reducedMotion'){if(typeof value!=='boolean')throw new Error('Ajuste incorrecto: '+key);}
   else if(!OPTIONS[key].includes(String(value)))throw new Error('Valor incorrecto: '+key);
  }
  prefs=normalized;apply();save();return get();
 }
 function reset(){prefs=normalize(null);apply();save();return get();}
 function exportData(){return JSON.stringify({format:'plegar-pro-settings',version:1,settings:get()},null,2);}
 function field(key,label,description,items){
  return '<label class="pp-setting-field"><span>'+safe(label)+'</span><small>'+safe(description)+'</small><select data-pp-setting="'+key+'">'+
   items.map(([value,text])=>'<option value="'+value+'"'+(prefs[key]===value?' selected':'')+'>'+safe(text)+'</option>').join('')+
   '</select></label>';
 }
 function toggle(key,label,description){
  return '<label class="pp-setting-switch"><input type="checkbox" data-pp-setting="'+key+'"'+(prefs[key]?' checked':'')+'><span><strong>'+safe(label)+'</strong><small>'+safe(description)+'</small></span></label>';
 }
 function section(name,content){
  return '<section class="pp-settings-section"><h2>'+name+'</h2><div class="pp-settings-grid">'+content+'</div></section>';
 }
 function html(){
  return '<div class="pp-settings" aria-label="Preferencias de Plegar Pro Basic">'+
   '<p class="pp-settings-intro">Ajustes funcionales guardados sólo en este navegador. Los datos de seguridad, las cotas reales, los ángulos y los programas no se modifican aquí.</p>'+
   section('Interfaz y accesibilidad',
    field('theme','Tema de la interfaz','Cambia los colores de paneles y menús.',[['dark','Industrial oscuro'],['light','Industrial claro'],['contrast','Alto contraste']])+
    field('accent','Color de acento','Color de los controles destacados.',[['blue','Azul industrial'],['cyan','Cian'],['amber','Ámbar']])+
    field('density','Espaciado','Ajusta el espacio entre menús y controles.',[['normal','Cómodo'],['compact','Compacto']])+
    field('textScale','Escala de la interfaz','Amplía o reduce visualmente la aplicación. En móvil, comprueba el desplazamiento.',[['90','90 %'],['100','100 %'],['110','110 %'],['125','125 %']])+
    toggle('reducedMotion','Reducir animaciones decorativas','Evita animaciones CSS innecesarias; no altera los controles de reproducción de plegado.'))+
   section('Simulación, reproducción y exportación',
    field('homeView','Vista inicial','La portada abre con la TRUMPF TrumaBend V85 configurada.',[['cad','TRUMPF V85 · Cinemática 3D']])+
    field('camera','Cámara inicial','Orientación al abrir una simulación.',[['iso','Isométrica'],['profile','Perfil lateral'],['front','Frontal'],['top','Superior']])+
    field('speed','Velocidad predeterminada','Aplicable al reproductor de Inicio y Simulación 3D.',[['0.5','0,5×'],['1','1×'],['2','2×']])+
    field('exportResolution','Resolución PNG','Tamaño de las imágenes exportadas desde la simulación vectorial.',[['1080','Full HD · 1920 × 1080'],['1440','QHD · 2560 × 1440'],['2160','UHD · 3840 × 2160']])+
    toggle('repeat','Repetición automática de plegado','Reproduce la secuencia completa en bucle hasta que pulses Pausa.'))+
   section('Navegación y acceso',
    field('startupScreen','Pantalla al abrir la aplicación','Pantalla preferida en el siguiente inicio.',[['Inicio','Inicio'],['Proyectos','Proyectos'],['Programación 2D','Programación 2D'],['Simulación 3D','Simulación 3D']])+
    '<div class="pp-settings-shortcuts"><strong>Acceso directo a módulos</strong><div class="pp-settings-links">'+
    [['Inicio','Inicio'],['Programación 2D','Programación 2D'],['Programación 3D','Programación 3D'],['Simulación 2D','Simulación 2D'],['Simulación 3D','Simulación 3D'],['Máquinas','Máquinas'],['Utillaje','Utillaje'],['Planos','Planos'],['Calculadora de plegado','Cálculo'],['Comparador de V','Comparador de V']].map(([id,label])=>'<button type="button" data-screen="'+id+'">'+label+'</button>').join('')+
    '</div><small>Ctrl/⌘ + K: buscar módulos del menú · Esc: cerrar menú o pantalla completa.</small></div>')+
   section('Copias y restablecimiento',
    '<div class="pp-settings-actions"><button type="button" data-pp-settings-action="export">Exportar preferencias JSON</button>'+
    '<label class="pp-settings-import">Importar preferencias JSON <input type="file" accept="application/json,.json" data-pp-settings-import></label>'+
    '<button type="button" data-pp-settings-action="reset">Restablecer únicamente preferencias</button>'+
    '<small>No borra proyectos, piezas, planos, radios Ri/K ni cotas de máquina.</small></div>')+
   '<p class="pp-settings-message" id="pp-settings-message" role="status">Los cambios se guardan automáticamente. Ningún ajuste implica conexión CNC ni verificación de colisiones.</p></div>';
 }
 function mount(host){
  if(!host)return;
  host.innerHTML=html();
  const status=()=>host.querySelector('#pp-settings-message');
  host.onchange=async(event)=>{
   const control=event.target;
   if(control.matches('[data-pp-setting]')){
    const key=control.dataset.ppSetting;
    try{
     const saved=set(key,control.type==='checkbox'?control.checked:control.value);
     status().textContent=saved?'Ajuste guardado.':'Ajuste aplicado solo en esta sesión: almacenamiento local no disponible.';
    }catch(err){status().textContent=err.message;mount(host);}
    return;
   }
   if(control.matches('[data-pp-settings-import]')){
    const file=control.files?.[0];if(!file)return;
    try{
     if(file.size>100*1024)throw new Error('Archivo de preferencias demasiado grande.');
     replace(JSON.parse(await file.text()));
     mount(host);status().textContent='Preferencias importadas y aplicadas.';
    }catch(err){status().textContent='No se pudo importar: '+err.message;}
    finally{control.value='';}
   }
  };
  host.onclick=event=>{
   const action=event.target.closest('[data-pp-settings-action]')?.dataset.ppSettingsAction;
   if(action==='reset'){
    reset();mount(host);status().textContent='Preferencias restablecidas; piezas, planos y medidas conservados.';
   }else if(action==='export'){
    const blob=new Blob([exportData()],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=root.document.createElement('a');
    a.href=url;a.download='plegar-pro-preferencias.json';root.document.body.appendChild(a);
    a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    status().textContent='Preferencias exportadas en JSON.';
   }
  };
 }
 apply();
 return {DEFAULT,OPTIONS,get,set,reset,replace,exportData,apply,html,mount,normalize};
});
