/* Visor 3D interactivo por referencia: extrusión del mismo perfil que simula
 * la plegadora. El contorno reconstructivo NO equivale a CAD fabricante.
 * Rotación libre 360°, volteo 180°, zoom, vista de perfil y controles táctiles. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./catalog-tool-view.js'):root.PlegarCatalogToolView,
  typeof module==='object'&&module.exports?require('./tooling3d.js'):root.PlegarTooling3D,
  typeof module==='object'&&module.exports?require('./piece3d.js'):root.PlegarPiece3D);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolViewer3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(View,Tooling,Piece){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const valid=tool=>tool&&['punch','die'].includes(tool.kind)&&typeof tool.code==='string';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function model(tool){
  if(!valid(tool))throw Error('Selecciona una referencia de punzón o matriz con perfil.');
  const section=View.section(tool);
  if(!section?.length)throw Error('Esta referencia no tiene todavía una sección modelable.');
  const documented=finite(tool.length)&&tool.length>0;
  const axial=documented?tool.length:100;
  const z0=-axial/2,z1=axial/2;
  const solid=Tooling.extrude(section,z0,z1,tool.kind);
  return {...solid,width:axial,thickness:1,lengthKnown:documented,axialLength:axial,code:tool.code};
 }
 function camera(input={}){
  const yaw=Number(input.yaw??38),pitch=Number(input.pitch??24),zoom=Number(input.zoom??1);
  if(![yaw,pitch,zoom].every(finite))throw Error('Cámara 3D inválida');
  return {yaw:((yaw%360)+360)%360,pitch:clamp(pitch,-180,180),zoom:clamp(zoom,.5,2.8)};
 }
 function graphic(mesh,opts={}){
  const cam=camera(opts),v=Piece.project(mesh,cam.yaw,cam.pitch,cam.zoom);
  const front=mesh.code,fill=mesh.faces.length>0?'#399cc8':'#879cac';
  const polygons=v.faces.map(f=>{
   const kind=f.kind==='cap'?'cap':'side';
   const color=kind==='cap'?'#4689ad':'#255778';
   return '<polygon data-face="'+kind+'" points="'+f.points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')+
    '" fill="'+color+'" stroke="#a0d9f5" stroke-width=".7" stroke-opacity=".87"/>';
  }).join('');
  return '<svg class="tool3d-graphic" viewBox="0 0 900 480" role="img" aria-label="Modelo tridimensional giratorio de '+escape(front)+'; referencia de utillaje no certificada">'+
   '<rect width="900" height="480" fill="#071b2b"/><g>'+polygons+'</g>'+
   '<text x="16" y="32" fill="#d5f2ff" font-size="19">'+escape(front)+' · MODELO 3D</text>'+
   '<text x="16" y="58" fill="#f2d19b" font-size="14">Rotación '+cam.yaw.toFixed(0)+'° · elevación '+cam.pitch.toFixed(0)+'° · zoom '+cam.zoom.toFixed(2)+'×</text>'+
   '<text x="16" y="446" fill="#ffce95" font-size="13">'+(mesh.lengthKnown?'Largo axial '+mesh.axialLength+' mm (catálogo)':'Largo axial ilustrativo 100 mm · NO ACOTADO')+'</text>'+
   '<text x="16" y="464" fill="#ffce95" font-size="12">Silueta reconstruida, NO CAD fabricante / NO CNC</text></svg>';
 }
 let active=null;
 function close(){
  if(!active)return;
  const v=active;active=null;
  v.root.remove();
  v.previous?.focus?.();
  document.removeEventListener('keydown',v.escape);
 }
 function open(tool){
  if(typeof document==='undefined')throw Error('El visor necesita un navegador');
  const solid=model(tool),initial=camera(),previous=document.activeElement;
  close();
  const shell=document.createElement('div');
  shell.className='tool3d-overlay';
  shell.innerHTML='<section class="tool3d-dialog" role="dialog" aria-modal="true" aria-label="Visor tridimensional '+escape(tool.code)+'">'+
   '<header><strong>'+escape(tool.name||tool.code)+'</strong><button type="button" data-tool3d="close" aria-label="Cerrar visor 3D">✕ Cerrar</button></header>'+
   '<p>Gira la herramienta con un dedo, pellizca para acercar y usa «Voltear» para verla por detrás. Es una extrusión reconstruida de su sección, no un sólido oficial certificado.</p>'+
   '<div class="tool3d-stage" aria-label="Arrastra para girar el útil en 360 grados y pellizca para hacer zoom" tabindex="0"></div>'+
   '<nav aria-label="Controlar modelo 3D"><button type="button" data-tool3d="iso">Isométrica</button><button type="button" data-tool3d="front">Perfil</button><button type="button" data-tool3d="back">Frontal opuesto</button><button type="button" data-tool3d="top">Superior</button><button type="button" data-tool3d="flip">⤾ Voltear 180°</button><button type="button" data-tool3d="left">↶ Girar</button><button type="button" data-tool3d="right">↷ Girar</button><button type="button" data-tool3d="minus">− Zoom</button><button type="button" data-tool3d="plus">+ Zoom</button></nav>'+
   '<div class="tool3d-metadata"></div>'+
   '<div class="tool3d-original"></div></section>';
  document.body.appendChild(shell);
  let cam=initial;const stage=shell.querySelector('.tool3d-stage'),pointers=new Map();
  const paint=()=>{stage.innerHTML=graphic(solid,cam);};
  function setCamera(value){cam=camera({...cam,...value});paint();}
  const safe=v=>escape(v??'—');
  shell.querySelector('.tool3d-metadata').textContent='Código '+tool.code+' · '+(tool.kind==='punch'?'Punzón':'Matriz')+
   ' · H '+(tool.height??'desconocida')+' mm · '+(tool.kind==='die'?'V '+tool.opening:'R '+tool.nose)+
   ' · '+(tool.angle??'—')+'° · geometría CAD no verificada';
  const pages=typeof globalThis!=='undefined'?(globalThis.PlegarCatalogPages||[]):[];
  const page=pages.find(p=>p.codes.includes(tool.code));
  if(page)shell.querySelector('.tool3d-original').innerHTML='<a href="'+safe(page.src)+'" target="_blank" rel="noopener noreferrer">Ver fotografía original · '+safe(page.label)+'</a>';
  shell.addEventListener('click',e=>{
   if(e.target===shell||e.target.closest('[data-tool3d="close"]')){close();return;}
   const command=e.target.closest('[data-tool3d]')?.dataset.tool3d;
   if(!command)return;
   const views={iso:{yaw:38,pitch:24,zoom:1},front:{yaw:0,pitch:0},back:{yaw:180,pitch:0},top:{yaw:0,pitch:90}};
   if(views[command])setCamera(views[command]);
   else if(command==='flip')setCamera({yaw:cam.yaw+180,pitch:-cam.pitch});
   else if(command==='left')setCamera({yaw:cam.yaw-20});
   else if(command==='right')setCamera({yaw:cam.yaw+20});
   else if(command==='plus')setCamera({zoom:cam.zoom*1.2});
   else if(command==='minus')setCamera({zoom:cam.zoom/1.2});
  });
  stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture?.(e.pointerId);});
  stage.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId))return;
   const p=pointers.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;
   if(pointers.size===1)setCamera({yaw:cam.yaw+dx*.65,pitch:cam.pitch-dy*.65});
   else{
    const others=[...pointers.entries()].filter(([id])=>id!==e.pointerId);
    if(others.length){
     const other=others[0][1],before=Math.hypot(p.x-other.x,p.y-other.y);
     const after=Math.hypot(e.clientX-other.x,e.clientY-other.y);
     if(before>2)setCamera({zoom:cam.zoom*after/before});
    }
   }
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(e.cancelable)e.preventDefault();
  });
  for(const kind of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(kind,e=>pointers.delete(e.pointerId));
  stage.addEventListener('wheel',e=>{e.preventDefault();setCamera({zoom:cam.zoom*(e.deltaY<0?1.12:.89)});},{passive:false});
  const escapeKey=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',escapeKey);
  active={root:shell,previous,escape:escapeKey};paint();shell.querySelector('[data-tool3d="close"]').focus();
  return {camera:()=>({...cam}),solid};
 }
 return {model,camera,graphic,open,close};
});