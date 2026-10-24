/* Plegar Pro Plus v0.25 — 3D kinematic sequence visualization.
 * Synchronized punch travel + active flange curvature, but no machine physics.
 */
(function(){
 'use strict';
 const K=window.PlegarFoldKinematics,M=window.PlegarPiece3D,T=window.PlegarTooling3D,A=window.PlegarSceneAudit3D,P=window.PlegarProximity3D,S=window.PlegarSweep3D,TL=window.PlegarSequenceTimeline,E=window.PlegarExamples3D;
 let active=null;
 const palette={sheet:{upper:'#479fc4',lower:'#225576',edge:'#9bd9f1'},punch:{cap:'#bccbd8',side:'#778e9e'},die:{cap:'#8599aa',side:'#354b5d'},gauge:{cap:'#d9ae68',side:'#926735'},table:{cap:'#8d9caa',side:'#4d5e6c'},ram:{cap:'#d3dbe5',side:'#78899c'}};
 function render(){
  const c=active;if(!c||!c.host.isConnected)return;
  const p=c.getData(),f=K.frame(p,c.step,c.cycle),s=f.scene,sheet=M.build(s,c.width);
  const combined=T.assemble(sheet,s,c.visible),audit=A.inspect(s,sheet),spatial=P.inspect(sheet,s);
  // Precompute sampled cycle once per step/setup/width; not on each animation frame.
  const scanKey=JSON.stringify([p,c.step,c.width]);
  if(c.scanKey!==scanKey){c.scan=S.sample(p,c.step,c.width);c.scanKey=scanKey;}
  const observed=S.at(c.scan,c.cycle);
  // Lock the camera around all travel phases; otherwise automatic fitting would
  // make a stationary matrix or gauge appear to move during animation.
  const cameraKey=JSON.stringify([p,c.step,c.width,c.yaw,c.elevation,c.visible]);
  if(c.cameraKey!==cameraKey){
   const limits=[0,.06,.12,.22,.5,.78,1].map(t=>{
    const x=K.frame(p,c.step,t).scene;
    return M.bounds(T.assemble(M.build(x,c.width),x,c.visible),c.yaw,c.elevation);
   });
   c.cameraBounds={minX:Math.min(...limits.map(b=>b.minX)),maxX:Math.max(...limits.map(b=>b.maxX)),minY:Math.min(...limits.map(b=>b.minY)),maxY:Math.max(...limits.map(b=>b.maxY))};
   c.cameraKey=cameraKey;
  }
  const projection=M.project(combined,c.yaw,c.elevation,c.zoom,c.cameraBounds);
  const rendering=window.PlegarMetalRender;
  const visibleFaces=projection.faces.filter(q=>!(q.group==='sheet'&&q.status==='pending'&&!c.showPending));
  const polys=rendering.polys(combined,{faces:visibleFaces},'pp-live-metal',{material:p.material,highlightPrior:c.highlightPrior});
  c.host.querySelector('.p3-camera-content').innerHTML=`<svg viewBox="0 0 900 480" class="p3-svg" role="img" aria-label="Cinemática ilustrativa del plegado con movimiento del punzón y deformación nominal de la chapa">${rendering.defs('pp-live-metal')}${rendering.background('pp-live-metal')}${polys}<text x="16" y="30" fill="#a1d9f1" font-size="13">CICLO 3D · PASO ${s.step}/${s.steps} · ${f.phase.toUpperCase()} · ÁNGULO ${Math.round(f.scene.signedAngle*10)/10}°</text><text x="16" y="454" fill="#eec48c" font-size="12">Ancho ${c.width} mm · ${s.requiresTurnover?'GIRO NEGATIVO: VOLTEO PREVIO NO SIMULADO':'MONTAJE NOMINAL'} · NO CNC</text></svg>`;
  const names={punch:'Punzón',die:'Matriz',gauge:'Tope',table:'Mesa (cotas)',ram:'Trancha (cotas)'};
  for(const key of Object.keys(names)){
   const button=c.host.querySelector(`[data-p3-toggle="${key}"]`);
   button.setAttribute('aria-pressed',String(c.visible[key]));
   button.textContent=`${c.visible[key]?'☑':'☐'} ${names[key]}`;
  }
  c.host.querySelector('[data-p3-sheet="highlight"]').setAttribute('aria-pressed',String(c.highlightPrior));
  c.host.querySelector('[data-p3-sheet="pending"]').setAttribute('aria-pressed',String(c.showPending));
  const min=audit.minimum;
  c.host.querySelector('.p3-clearance').textContent=`${audit.status}. Alas previas representadas: ${audit.priorBends.length} pliegues; tramos ilustrativos realizados ${audit.counts.completed}, pendientes ${audit.counts.pending}. ${min?`Separación plana mínima estimada: ${min.gap.toFixed(2)} mm frente a ${min.component} (${min.side}).`:'Sin medición de alas previas para este paso.'} Alertas geométricas: ${audit.warningCount}. NO valida colisiones 3D.`;
  const proximityText=spatial.minimum?`Mínimo estimado: ${spatial.minimum.mm.toFixed(2)} mm (${spatial.minimum.tool}, segmento ${spatial.minimum.segment}).`:'Sin alas previas que permita evaluar el modelo.';
  c.host.querySelector('.p3-proximity3d').textContent=`CRIBADO DE PRISMAS 3D · ${spatial.verdict}. Tramos anteriores: ${spatial.evaluatedSegments}; pares evaluados: ${spatial.checkedPairs}. ${proximityText} NO acredita ausencia de colisiones ni sustituye datos CAD de herramientas.`;
  const sweep=c.scan;
  const pct=x=>x.percent.toFixed(1)+' %';
  const first=sweep.firstNear?`Primera proximidad observada: ${pct(sweep.firstNear)}, ${sweep.firstNear.tool}, segmento ${sweep.firstNear.segment}.`:'Ninguna proximidad observada en los instantes evaluados.';
  const machine=window.PlegarMachineClearance.inspect(p,s);
  c.host.querySelector('.p3-machine-envelope').textContent='MÁQUINA · Matriz H '+(machine.dieHeight===null?'no introducida':machine.dieHeight+' mm')+' · '+(machine.possibleTableContact?'POSIBLE CONTACTO MESA. ':'')+(machine.possibleRamContact?'POSIBLE CONTACTO TRANCHA. ':'')+(machine.unknown.length?'Faltan cotas: '+machine.unknown.join(', ')+'. ':'')+'Perfil rectangular orientativo: sin CAD real ni seguridad CNC.';
  c.host.querySelector('.p3-sweep').textContent=`MUESTREO DEL CICLO · ${sweep.frames} posiciones, ${sweep.checkedPairs} pares. ${sweep.verdict}. ${first} ${sweep.minimum?`Mínimo observado ${sweep.minimum.mm.toFixed(2)} mm en ${pct(sweep.minimum)}.`:'Sin alas anteriores evaluables.'} Instante próximo al cursor ${pct(observed)}: ${observed.status}. NO constituye barrido continuo ni certificación de colisiones. NO CNC / SIN VERIFICAR.`;
  c.host.querySelector('.p3-sweep-marker').innerHTML=sweep.rows.filter(row=>row.minimum?.mm<=sweep.nearMm).map(row=>`<i title="Muestra ${row.percent.toFixed(1)} %: distancia nominal ${row.minimum.mm.toFixed(2)} mm" style="left:${row.percent}%"></i>`).join('');
  c.host.querySelector('[data-p3="scan-export"]').disabled=false;
  c.host.querySelector('.p3-state').textContent=`Pliegue ${s.bend} · fase ${f.phase} · avance de conformado ${Math.round(f.formingProgress*100)} % · espesor ${s.thickness} mm · V${s.dieOpening} · punzón ${s.punchAngle}° · tope X ${s.stop.x} mm · ${combined.faces.length} caras ilustrativas`;
  c.host.querySelector('.p3-kinematics').textContent=`FASE: ${f.phase.toUpperCase()} · Punzón Y nominal ${f.punchY.toFixed(2)} mm · holgura de retirada ${f.punchLift.toFixed(2)} mm · ángulo representado ${f.angle.toFixed(1)}° · matriz fija · ${f.backgaugeMotion.active?'TOPE X '+f.backgaugeMotion.fromX.toFixed(1)+' → '+f.backgaugeMotion.toX.toFixed(1)+' mm; posición '+s.stop.x.toFixed(1)+' mm':'tope X nominal fijo durante el plegado'}. REPRODUCCIÓN SEGUIDA · desplazamiento X ilustrativo, sin velocidades ni recolocación física de la chapa. ${f.notice}. NO CNC / SIN VERIFICAR.`;
  c.host.querySelector('.p3-width').value=String(c.width);
  c.host.querySelector('.p3-progress').value=String(Math.round(c.cycle*100));
  c.host.querySelector('.p3-step').textContent=`Paso ${s.step} / ${s.steps}`;
  c.host.querySelector('.p3-cycle-progress').textContent=`${Math.round(c.cycle*100)} %`;
  c.host.querySelector('[data-p3="prev"]').disabled=c.step===0;
  c.host.querySelector('[data-p3="next"]').disabled=c.step===p.sequence.length-1;
  c.host.querySelector('[data-p3="play"]').textContent=c.playing?'⏸ Pausar':'▶ Reproducir sin pausas';
  c.host.querySelector('[data-p3="all"]').textContent=c.playing&&c.all?'⏸ Pausar secuencia':'⏵ Desde el primer pliegue';
  c.host.querySelector('[data-p3="play"]').setAttribute('aria-pressed',String(c.playing&&!c.all));
  c.host.querySelector('[data-p3="all"]').setAttribute('aria-pressed',String(c.playing&&c.all));
  const repeat=c.host.querySelector('.p3-loop');if(repeat)repeat.checked=c.loop;
  const key=p.sequence.join(',');
  if(c.orderKey!==key){
   c.host.querySelector('.p3-order-list').innerHTML=p.sequence.map((id,i)=>`<div class="p3-order-slot"><button data-p3-step="${i}" type="button" aria-label="Ver paso ${i+1}">Paso ${i+1}</button><select data-p3-order="${i}" aria-label="Pliegue para el paso ${i+1}">${p.sequence.map((_,j)=>`<option value="${j+1}" ${id===j+1?'selected':''}>Pliegue ${j+1}</option>`).join('')}</select></div>`).join('');
   c.orderKey=key;
  }
 }
 function pause(){if(!active)return;active.playing=false;active.all=false;active.lastFrame=null;active.holdUntil=null;if(active.raf!==null){cancelAnimationFrame(active.raf);active.raf=null;}}
 function destroy(){pause();active?.touchCamera?.destroy();if(active?.host){active.host.onclick=null;active.host.oninput=null;active.host.onchange=null;}active=null;}
 function animation(now){
  const c=active;if(!c||!c.playing||!c.host.isConnected){pause();return;}
  if(c.lastFrame===null)c.lastFrame=now;
  const dt=Math.min(100,Math.max(0,now-c.lastFrame));c.lastFrame=now;
  if(c.holdUntil!==null){
   if(now>=c.holdUntil){
    c.holdUntil=null;c.step=0;c.cycle=0;
    c.onSelect(c.getData().sequence[0]);
   }
  }else{
   const next=TL.advance({step:c.step,cycle:c.cycle},dt,c.getData().sequence.length,{speed:c.speed});
   c.step=next.step;c.cycle=next.cycle;
   if(next.transition)c.onSelect(c.getData().sequence[c.step]);
   if(next.finished){
    if(c.loop){c.holdUntil=now+480;c.cycle=1;}
    else pause();
   }
  }
  // Mantener ~30 fps en móvil y mostrar la pieza terminada antes de repetir.
  if(c.lastPaint===null||now-c.lastPaint>=33||!c.playing){render();c.lastPaint=now;}
  if(c.playing)c.raf=requestAnimationFrame(animation);
 }
 function play(all=false){
  const c=active;if(!c)return;
  if(c.playing){pause();render();return;}
  if(all){c.step=0;c.cycle=0;c.onSelect(c.getData().sequence[0]);}
  else if(c.cycle>=1){c.step=0;c.cycle=0;c.onSelect(c.getData().sequence[0]);}
  c.playing=true;c.all=all;c.holdUntil=null;c.lastFrame=null;c.lastPaint=null;
  render();c.raf=requestAnimationFrame(animation);
 }
 function mount(host,getData,getSelection=()=>1,onSelect=()=>{}){
  destroy();if(!host)return;
  const p=getData(),prefs=window.PlegarSettings?.get?.()||{};
  const view={iso:[38,24],profile:[0,0],front:[90,0],top:[0,90]}[prefs.camera]||[38,24];
  active={host,getData,getSelection,onSelect,step:Math.max(0,p.sequence.indexOf(getSelection())),cycle:0,width:window.PlegarEditor2D?.getWidth?.()||100,yaw:view[0],elevation:view[1],zoom:1,speed:Number(prefs.speed)||1,raf:null,playing:false,all:false,loop:prefs.repeat!==false,holdUntil:null,lastFrame:null,lastPaint:null,visible:{punch:true,die:true,gauge:true,table:true,ram:true},highlightPrior:true,showPending:true};
  host.innerHTML=`<section class="p3-view" aria-label="Simulación cinemática tridimensional ilustrativa"><div class="p3-heading"><div><strong>CINEMÁTICA 3D · CHAPA, PUNZÓN, MATRIZ Y TOPE</strong><small>Secuencia desde Programación 2D · geometrías paramétricas genéricas</small></div><span>PREVISUALIZACIÓN v0.39</span></div><div class="p3-new-piece-actions"><button type="button" data-p3="new" class="p3-new-piece">＋ Crear nueva pieza 3D</button><span>Medidas, alas, arriba/abajo, punzón, matriz y orden de plegado</span></div><div class="p3-library-controls"><button type="button" data-p3="edit">✎ Editar pieza actual</button><button type="button" data-p3="library">▤ Mis piezas</button><button type="button" data-p3="save-library">Guardar pieza</button><small>Los cambios se reflejan en Programación 2D y 3D.</small></div><div class="example-gallery-wrap"><div class="example-gallery-title"><strong>CUATRO PIEZAS DE EJEMPLO</strong><small>Toca su silueta 3D para cargar el programa.</small></div><div class="example-gallery p3-example-gallery"></div></div><div class="p3-stage" aria-label="Arrastra con un dedo para mover la vista y pellizca con dos dedos para ampliar o alejar"><div class="p3-camera-content"></div></div><div class="p3-kinematics" role="status" aria-label="Fase de movimiento de plegado"></div><div class="p3-state" role="status"></div><div class="p3-clearance" role="status" aria-label="Holguras orientativas en 2D"></div><div class="p3-proximity3d" role="status" aria-label="Cribado volumétrico nominal 3D"></div><div class="p3-machine-envelope" role="status" aria-label="Envolvente de mesa y trancha según medidas introducidas"></div><div class="p3-sweep" role="status" aria-label="Muestreo nominal de proximidades durante el ciclo"></div><div class="p3-sweep-marker" aria-hidden="true"></div><div class="p3-sweep-actions"><button data-p3="scan-export" type="button">Exportar informe de muestreo JSON</button></div><div class="p3-motion-controls" role="group" aria-label="Controles de cinemática de plegado"><button data-p3="play" type="button" aria-pressed="false">▶ Reproducir sin pausas</button><button data-p3="all" type="button" aria-pressed="false">⏵ Desde el primer pliegue</button><button data-p3="rewind" type="button">↤ Reiniciar paso</button><label class="p3-loop-control"><input class="p3-loop" type="checkbox" checked> Repetir secuencia</label><label>Velocidad <select class="p3-speed" aria-label="Velocidad de reproducción"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div><div class="p3-order-controls" role="group" aria-label="Orden de plegado editable"><strong>ORDEN DE PLEGADO · Selecciona cada pliegue</strong><p>Elige el B para cada puesto: se mueve a esa posición desplazando los demás (igual que 2D), sin cambiar el ángulo del B.</p><div class="p3-order-list"></div></div><div class="p3-sheet-switch" role="group" aria-label="Visibilidad de la secuencia"><strong>CHAPA POR SECUENCIA</strong><button type="button" data-p3-sheet="highlight" aria-pressed="true">Destacar pliegues previos</button><button type="button" data-p3-sheet="pending" aria-pressed="true">Mostrar pendientes</button><span class="p3-legend"><i class="p3-prior-dot"></i> Realizados <i class="p3-active-dot"></i> Activo <i class="p3-pending-dot"></i> Pendientes</span></div><div class="p3-tool-switch" role="group" aria-label="Elementos 3D visibles"><strong>VISIBILIDAD</strong><button data-p3-toggle="punch" type="button" aria-pressed="true">☑ Punzón</button><button data-p3-toggle="die" type="button" aria-pressed="true">☑ Matriz</button><button data-p3-toggle="gauge" type="button" aria-pressed="true">☑ Tope</button><button data-p3-toggle="table" type="button" aria-pressed="true">☑ Mesa (cotas)</button><button data-p3-toggle="ram" type="button" aria-pressed="true">☑ Trancha (cotas)</button></div><div class="p3-controls"><button data-p3="prev" type="button">← Pliegue</button><span class="p3-step"></span><button data-p3="next" type="button">Siguiente →</button><button data-p3="profile" type="button">Vista de perfil</button><button data-p3="front" type="button">Frontal</button><button data-p3="top" type="button">Superior</button><button data-p3="iso" type="button">Isométrica</button><button data-p3="left" type="button">↶ Girar</button><button data-p3="right" type="button">↷ Girar</button><button data-p3="zin" type="button">+ Zoom</button><button data-p3="zout" type="button">− Zoom</button><button data-p3="reset" type="button">Restablecer vista</button></div><div class="p3-values"><label>Ciclo: aproximación → plegado → retirada <span class="p3-cycle-progress">0 %</span><input class="p3-progress" aria-label="Avance del ciclo cinemático" type="range" min="0" max="100" step="1" value="0"/></label><label>Ancho de previsualización (mm) <input class="p3-width" type="number" min="1" max="5000" step="1" value="100"/></label></div><p class="p3-disclosure">Cinemática esquemática: el punzón desciende, la chapa cambia de curvatura nominal y después el punzón se retira. No es el ciclo real de un control Cybelec, ni simula movimiento de topes/ejes, fuerza, contacto sólido, retorno elástico o recolocación de la pieza entre pliegues. Un pliegue negativo requiere reorientación física no calculada. Utillaje y máquina son genéricos, sin geometrías de fabricante verificadas. v0.26 añade muestreo discreto de alas anteriores y prismas nominales; NO comprueba el espacio entre muestras ni el pliegue activo. No existen comprobaciones fiables de colisiones barridas. NO utilizar para fabricación, CNC ni seguridad.</p></section>`;
  const speedPref=host.querySelector('.p3-speed');if(speedPref)speedPref.value=String(active.speed);
  const repeatPref=host.querySelector('.p3-loop');if(repeatPref)repeatPref.checked=active.loop;
  active.touchCamera=window.PlegarTouchView.attach(host.querySelector('.p3-stage'),host.querySelector('.p3-camera-content'));
   host.querySelector('.p3-example-gallery').innerHTML=E.cards(p.name);
  host.onclick=e=>{
   if(!active||active.host!==host)return;
   const c=active;
   const ex=e.target.closest('[data-example-id]')?.dataset.exampleId;
   if(ex){const item=E.get(ex);if(item){
    pause();window.PlegarEditor2D.loadProfile(item.profile);
    c.step=0;c.cycle=0;c.width=item.width;c.cameraKey=null;c.scanKey=null;c.orderKey=null;
    host.querySelector('.p3-example-gallery').innerHTML=E.cards(item.profile.name);render();
   }return;}
   const stepBtn=e.target.closest('[data-p3-step]');
   if(stepBtn){pause();c.step=Math.max(0,Math.min(c.getData().sequence.length-1,Number(stepBtn.dataset.p3Step)));c.cycle=0;c.onSelect(c.getData().sequence[c.step]);render();return;}
   const sheetSwitch=e.target.closest('[data-p3-sheet]')?.dataset.p3Sheet;
   if(sheetSwitch==='highlight'){c.highlightPrior=!c.highlightPrior;render();return;}
   if(sheetSwitch==='pending'){c.showPending=!c.showPending;render();return;}
   const toggle=e.target.closest('[data-p3-toggle]')?.dataset.p3Toggle;
   if(toggle){if(toggle in c.visible){c.visible[toggle]=!c.visible[toggle];render();}return;}
   const k=e.target.closest('[data-p3]')?.dataset.p3;if(!k)return;
   const p=c.getData();
   if(k==='new'){pause();window.PlegarNewPiece.open({screen:'Programación 3D'});return;}
   if(k==='edit'){pause();window.PlegarNewPiece.open({screen:'Programación 3D',edit:true});return;}
   if(k==='library'){pause();window.PlegarPieceShelf.open({screen:'Programación 3D'});return;}
   if(k==='save-library'){pause();try{window.PlegarPieceShelf.saveActive();window.PlegarPieceShelf.open({screen:'Programación 3D'});}catch(error){window.alert('No se ha podido guardar la pieza: '+error.message);}return;}
   if(k==='scan-export'){
    const data=S.exportReport(c.scan),blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`plegar-pro-muestreo-3d-paso-${c.step+1}.json`;host.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);return;
   }
   if(k==='play'){play(false);return;}
   if(k==='all'){play(true);return;}
   if(k==='rewind'){pause();c.cycle=0;render();return;}
   if(k==='prev'||k==='next'){pause();c.step=Math.max(0,Math.min(p.sequence.length-1,c.step+(k==='next'?1:-1)));c.cycle=0;c.onSelect(p.sequence[c.step]);}
   if(k==='profile'){c.yaw=0;c.elevation=0;}
   if(k==='iso'){c.yaw=38;c.elevation=24;}
   if(k==='front'){c.yaw=90;c.elevation=0;}
   if(k==='top'){c.yaw=0;c.elevation=90;}
   if(k==='left')c.yaw-=15;if(k==='right')c.yaw+=15;
   if(k==='zin')c.zoom=Math.min(2.5,c.zoom+.1);if(k==='zout')c.zoom=Math.max(.5,c.zoom-.1);
   if(k==='reset'){c.yaw=38;c.elevation=24;c.zoom=1;c.touchCamera?.reset();}
   render();
  };
  host.oninput=e=>{
   if(!active||active.host!==host)return;
   if(e.target.matches('.p3-progress')){pause();active.cycle=Number(e.target.value)/100;}
   else if(e.target.matches('.p3-width')){const value=Number(e.target.value);if(!Number.isFinite(value)||value<=0||value>5000)return;active.width=value;}
   else return;
   render();
  };
  host.onchange=e=>{
   if(!active||active.host!==host)return;
   if(e.target.matches('.p3-speed')){
    active.speed=Number(e.target.value);
    try{window.PlegarSettings?.set?.('speed',String(active.speed));}catch{}
    return;
   }
   if(e.target.matches('.p3-loop')){
    active.loop=!!e.target.checked;
    try{window.PlegarSettings?.set?.('repeat',active.loop);}catch{}
    if(!active.loop&&active.holdUntil!==null){pause();render();}
    return;
   }
   if(e.target.matches('[data-p3-order]')){
    const c=active,index=Number(e.target.dataset.p3Order),id=Number(e.target.value),order=c.getData().sequence.slice();
    if(!Number.isInteger(index)||index<0||index>=order.length||!order.includes(id))return;
    pause();const oldIndex=order.indexOf(id);order.splice(oldIndex,1);order.splice(index,0,id);
    if(window.PlegarEditor2D?.setSequence(order)){c.step=index;c.cycle=0;c.scanKey=null;c.cameraKey=null;c.orderKey=null;c.onSelect(id);}
    render();
   }
  };
  render();
 }
 window.PlegarPiece3DView={mount,destroy};
})();
