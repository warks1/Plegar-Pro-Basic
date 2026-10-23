/* Alta de pieza común a Programación 2D y Programación 3D.
 * Sólo guarda al pulsar "Crear"; Cancelar no modifica el programa activo.
 */
(function(){
 'use strict';
 const Core=window.PlegarNewPieceCore,G=window.PlegarGeometry2D,C=window.PlegarBendCalc;
 const $=(q,root=document)=>root.querySelector(q);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=(v)=>Number(v);
 let draft=null,picked=[],destination='Programación 2D',dialog=null;
 const setupOptions=(values,id)=>values.map(v=>'<option value="'+esc(v.id)+'"'+(v.id===id?' selected':'')+'>'+esc(v.name)+'</option>').join('');
 function draw2d(){
  const pts=G.vertices(draft),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),
   minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
  const factor=Math.min(600/Math.max(25,maxX-minX),280/Math.max(25,maxY-minY),8);
  const transform=p=>({x:380+(p.x-(minX+maxX)/2)*factor,y:225-(p.y-(minY+maxY)/2)*factor});
  const points=pts.map(transform);
  const poly=points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ');
  const lengths=draft.segments.map((v,i)=>{
   const a=points[i],b=points[i+1],x=(a.x+b.x)/2,y=(a.y+b.y)/2-13;
   return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" class="np-dimension" text-anchor="middle">'+esc(v)+' mm</text>';
  }).join('');
  const bends=draft.angles.map((angle,i)=>{
   const p=points[i+1],id=i+1,order=draft.sequence.indexOf(id)+1,active=picked.includes(id);
   return '<g data-np-touch="'+id+'" role="button" tabindex="0" aria-label="Elegir pliegue B'+id+' como siguiente paso" class="np-bend'+(active?' selected':'')+'">'+
    '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="23"/>'+
    '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+5).toFixed(1)+'" text-anchor="middle">B'+id+'</text>'+
    '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+39).toFixed(1)+'" text-anchor="middle" class="np-order-number">Paso '+order+'</text>'+
   '</g>';
  }).join('');
  return '<svg viewBox="0 0 760 450" role="img" aria-label="Vista 2D acotada, toca un pliegue para asignar su orden">'+
   '<rect width="760" height="450" fill="#081d2d"/>'+
   '<path d="M0 225H760M380 0V450" stroke="#29485a" stroke-width="1"/>'+
   '<polyline points="'+poly+'" stroke="#001420" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
   '<polyline points="'+poly+'" stroke="#65cfff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
   lengths+bends+'</svg>';
 }
 function fields(){
  const setup=draft.setup;
  const label=(name,field,type='number',extra='')=>'<label>'+name+'<input data-np-field="'+field+'" type="'+type+'" '+extra+' value="'+esc(field.split('.').reduce((v,k)=>v?.[k],draft)??'')+'"></label>';
  const select=(name,field,options,value)=>'<label>'+name+'<select data-np-field="'+field+'">'+options.map(([v,title])=>'<option value="'+esc(v)+'"'+(v===value?' selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>';
  const materials=Core.materials.map(v=>[v,v]);
  return '<div class="np-fieldgrid">'+
    label('Nombre de la pieza','name','text','maxlength="70" required')+
    select('Material','material',materials,draft.material)+
    label('Espesor chapa (mm)','thickness','number','min="0.1" max="100" step="0.1" inputmode="decimal" required')+
    label('Ancho total de plegado (mm)','width','number','min="1" max="5000" step="0.1" inputmode="decimal" required')+
    '<label>Punzón<select data-np-field="setup.punch">'+setupOptions(C.PUNCHES,setup.punch)+'</select></label>'+
    '<label>Matriz (V)<select data-np-field="setup.die">'+setupOptions(C.DIES,setup.die)+'</select></label>'+
    label('Radio interior Ri (mm)','setup.radius','number','min="0.1" max="500" step="0.1" inputmode="decimal" required')+
    label('Factor K','setup.kFactor','number','min="0.2" max="0.6" step="0.01" inputmode="decimal" required')+
    select('Referencia de las cotas','setup.dimensionBasis',[['outer','Exteriores'],['inner','Interiores'],['tangent','Tramos hasta tangencia']],setup.dimensionBasis)+
    label('Tope X nominal (mm)','setup.backgaugeX','number','min="1" max="10000" step="0.1" inputmode="decimal" required')+
    label('Altura matriz H (mm) · opcional','setup.dieHeight','number','min="5" max="400" step="0.1" placeholder="Desconocida" inputmode="decimal"')+
    '</div>';
 }
 function rows(){
  return draft.segments.map((length,i)=>{
   const bend=i+1,hasBend=i<draft.angles.length,angle=hasBend?draft.angles[i]:null;
   return '<div class="np-row">'+
    '<div class="np-row-heading"><strong>Tramo / ala '+(i+1)+'</strong>'+(hasBend?'<span>Después: pliegue B'+bend+'</span>':'<span>Última ala</span>')+'</div>'+
    '<label>Longitud del ala (mm)<input data-np-length="'+i+'" type="number" min=".1" max="100000" step=".1" inputmode="decimal" required value="'+esc(length)+'"></label>'+
    (hasBend?'<label>Grados del pliegue<input data-np-angle="'+i+'" type="number" min=".1" max="179" step=".1" inputmode="decimal" required value="'+esc(Math.abs(angle))+'"></label>'+
     '<label>Sentido del pliegue<select data-np-direction="'+i+'"><option value="up"'+(angle>0?' selected':'')+'>↑ Arriba (+)</option><option value="down"'+(angle<0?' selected':'')+'>↓ Abajo (−)</option></select></label>'+
     '<label>Orden de plegado<select data-np-position="'+bend+'">'+draft.sequence.map((id,j)=>'<option value="'+(j+1)+'"'+(id===bend?' selected':'')+'>Paso '+(j+1)+'</option>').join('')+'</select></label>':'')+
   '</div>';
  }).join('');
 }
 function error(message=''){
  const el=$('#np-status',dialog);if(el){el.textContent=message;el.setAttribute('data-error',String(Boolean(message)));}
 }
 function paint(){
  const host=$('#np-rows',dialog);if(!host)return;
  host.innerHTML=rows();
  const readout=$('#np-sequence',dialog);
  readout.textContent='Orden: '+draft.sequence.map(n=>'B'+n).join(' → ')+(picked.length?' · seleccionando paso '+(picked.length+1):'');
  $('#np-count',dialog).textContent=draft.segments.length+' tramos · '+draft.angles.length+' pliegues';
  const drawing=$('#np-drawing',dialog),volume=$('#np-volume',dialog);
  try{
   drawing.innerHTML=draw2d();
   const preview=Core.build(draft);
   volume.innerHTML=window.PlegarHome3D.preview(preview.profile,{width:preview.width});
   const calc=C.estimate(preview.profile,preview.profile.setup);
   $('#np-estimate',dialog).textContent='Desarrollo orientativo: '+(calc.flat===null?'no calculable':calc.flat.toFixed(2)+' mm')+' · NO CNC / SIN VALIDAR';
  }catch(ex){
   if(!drawing.innerHTML)drawing.textContent='Revisa primero la geometría.';
   volume.textContent='Vista 3D disponible cuando se completen las medidas válidas.';
   $('#np-estimate',dialog).textContent='Pendiente: '+ex.message;
  }
 }
 function syncFormValues(){
  // En iOS y en navegadores embebidos, el último cambio puede no emitir "change"
  // antes de tocar Crear. Leer el DOM actual evita perder medidas y ancho.
  for(const el of dialog.querySelectorAll('[data-np-field]')){
   const key=el.dataset.npField,value=el.value;
   const val=el.type==='number'?(value.trim()===''?null:Number(value)):value;
   if(key.startsWith('setup.'))draft.setup[key.slice(6)]=val;
   else draft[key]=val;
  }
  for(const el of dialog.querySelectorAll('[data-np-length]'))
   draft.segments[Number(el.dataset.npLength)]=Number(el.value);
  for(const el of dialog.querySelectorAll('[data-np-angle]')){
   const i=Number(el.dataset.npAngle),direction=dialog.querySelector('[data-np-direction="'+i+'"]')?.value;
   draft.angles[i]=(direction==='down'?-1:1)*Math.abs(Number(el.value));
  }
 }
 function close(){if(dialog?.open)dialog.close();}
 function construct(){
  if(dialog)return;
  dialog=document.createElement('dialog');
  dialog.id='new-piece-dialog';
  dialog.className='np-dialog';
  dialog.setAttribute('aria-labelledby','np-title');
  document.body.append(dialog);
  dialog.addEventListener('click',e=>{
   const action=e.target.closest('[data-np-action]')?.dataset.npAction;
   if(action==='cancel'){close();return;}
   if(action==='add'||action==='remove'){
    try{draft=action==='add'?Core.add(draft):Core.remove(draft);picked=[];paint();error();}
    catch(ex){error(ex.message);}return;
   }
   if(action==='reset'){draft.sequence=draft.angles.map((_,i)=>i+1);picked=[];paint();error();return;}
   if(action==='create'){
    try{
     syncFormValues();
     const {profile,width}=Core.build(draft);
     window.PlegarEditor2D.loadProfile(profile,{width});
     close();
     window.PlegarApp.switchScreen(destination);
    }catch(ex){error('No se ha guardado: '+ex.message);}
    return;
   }
   const id=Number(e.target.closest('[data-np-touch]')?.dataset.npTouch);
   if(id){
    try{
     const result=Core.touchOrder(draft,picked,id);
     draft=result.draft;picked=result.picked;paint();
     error(result.finished?'Orden elegido. Comprueba la secuencia antes de crear la pieza.':'');
    }catch(ex){error(ex.message);}
   }
  });
  dialog.addEventListener('keydown',e=>{
   if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-np-touch]')){
    e.preventDefault();e.target.click();
   }
  });
  dialog.addEventListener('change',e=>{
   const target=e.target;
   try{
    const i=Number(target.dataset.npLength??target.dataset.npAngle??target.dataset.npDirection);
    if(target.matches('[data-np-length]')){
     draft.segments[i]=num(target.value);
    }else if(target.matches('[data-np-angle]')){
     draft.angles[i]=Math.sign(draft.angles[i]||1)*Math.abs(num(target.value));
    }else if(target.matches('[data-np-direction]')){
     draft.angles[i]=(target.value==='down'?-1:1)*Math.abs(draft.angles[i]);
    }else if(target.matches('[data-np-position]')){
     draft=Core.reposition(draft,num(target.dataset.npPosition),num(target.value));picked=[];
    }else if(target.matches('[data-np-field]')){
     const key=target.dataset.npField,value=target.value;
     const normalized=target.type==='number'?(value===''?null:num(value)):value;
     if(key.startsWith('setup.'))draft.setup[key.slice(6)]=normalized;
     else draft[key]=normalized;
    }else{return;}
    error();paint();
   }catch(ex){error(ex.message);}
  });
 }
 function open({screen='Programación 2D'}={}){
  construct();
  destination=screen==='Programación 3D'?'Programación 3D':'Programación 2D';
  draft=Core.create(window.PlegarEditor2D?.getData(),window.PlegarEditor2D?.getWidth?.());
  picked=[];
  dialog.innerHTML='<div class="np-header"><div><h2 id="np-title">CREAR NUEVA PIEZA · '+(destination==='Programación 3D'?'PROGRAMACIÓN 3D':'PROGRAMACIÓN 2D')+'</h2><p>Introduce medidas reales y define cada pliegue. Al crear se sincronizará con los módulos 2D y 3D.</p></div><button type="button" data-np-action="cancel" aria-label="Cerrar sin guardar">✕</button></div>'+
   '<div class="np-content"><fieldset><legend>1 · Material, chapa y utillaje</legend>'+fields()+'</fieldset>'+
   '<fieldset><legend>2 · Alas, longitudes, ángulos y sentidos</legend><div id="np-rows"></div><div class="np-add-controls"><button type="button" data-np-action="add">＋ Añadir ala y pliegue</button><button type="button" data-np-action="remove">− Quitar última ala</button></div></fieldset>'+
   '<fieldset><legend>3 · Elegir orden de plegado tocando B1, B2…</legend><p id="np-sequence" aria-live="polite"></p><button type="button" data-np-action="reset">Restablecer orden 1, 2, 3…</button><div class="np-visuals"><div id="np-drawing"></div><div id="np-volume"></div></div><p id="np-count"></p><p id="np-estimate"></p></fieldset>'+
   '<p class="np-caution">Los pliegues positivos/negativos indican el sentido respecto al dibujo. Para la máquina real pueden requerir voltear la pieza. El orden elegido no certifica ausencia de colisiones con matriz, trancha, mesa o topes.</p>'+
   '</div><div class="np-bottom"><span id="np-status" role="status" aria-live="polite"></span><button type="button" data-np-action="cancel">Cancelar</button><button type="button" data-np-action="create" class="np-primary">Crear pieza y abrir '+(destination==='Programación 3D'?'3D':'2D')+'</button></div>';
  paint();dialog.showModal();
 }
 window.PlegarNewPiece={open,close};
})();
