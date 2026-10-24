/* Reproductor de vista de perfil para Programación 2D y Simulación 2D.
   Muestra una aproximación con radio, no controla una plegadora. */
(function(){
'use strict';
const Model=window.PlegarFormingGeometry,K=()=>window.PlegarFoldKinematics,TL=()=>window.PlegarSequenceTimeline,Section=window.PlegarMachineSection2D;
const as2=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
let active=null;
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
const rect=(x1,y1,x2,y2)=>[{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x1,y:y2}];
const path=pts=>pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(3)+' '+p.y.toFixed(3)).join(' ')+' Z';
// La sección ampliada separa máquina superior, mesa, portaherramientas y topes.
function machineOutlines(m){return Section.build(m);}

function extents(m){
 const bodies=machineOutlines(m);
 const pts=[...m.assembly.contour,...m.toolProfiles.die.outline,...m.toolProfiles.punch.outline,
 ...bodies.parts.flatMap(part=>part.points),
 {x:m.stop.x,y:m.stop.top},{x:m.stop.x+m.stop.width,y:m.stop.bottom}];
 return [Math.min(...pts.map(v=>v.x)),Math.max(...pts.map(v=>v.x)),Math.min(...pts.map(v=>v.y)),Math.max(...pts.map(v=>v.y))];
}
function fixedExtents(data,step,mode){
 // Encuadre estable durante la carrera del punzon: matriz y tope quietos.
 const ext=[0,.11,.22,.5,.78,.89,1].map(t=>extents(mode==='cycle'?K().frame(data,step,t).scene:Model.scene(data,step,t)));
 return [Math.min(...ext.map(v=>v[0])),Math.max(...ext.map(v=>v[1])),Math.min(...ext.map(v=>v[2])),Math.max(...ext.map(v=>v[3]))];
}
// Encuadre de detalle: la zona lejana queda fuera deliberadamente.
function detailExtents(data,step){
 const m=Model.scene(data,step,0),w=Math.max(36,m.dieOpening*2.4);
 return [-w,w,-w*.95,w*1.05];
}
function svg(m,zoom,bounds){
 const half=m.dieOpening/2;
 const [minX,maxX,minY,maxY]=bounds||extents(m);
 const s=Math.min(7.5,740/Math.max(35,maxX-minX),315/Math.max(35,maxY-minY))*zoom;
 const centreX=(minX+maxX)/2,centreY=(minY+maxY)/2;
 const dieOutline=m.toolProfiles.die.outline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+' Z';
 const tip=m.punchTipY;
 const dimension=-Math.min(18,m.dieOpening*1.15)-m.thickness;
 const line=m.centerline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ');
 const punchOutline=m.toolProfiles.punch.outline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+' Z';
 const wholePaths=[...m.assembly.left.items,...m.assembly.right.items].map(v=>`<line x1="${v.from.x}" y1="${v.from.y}" x2="${v.to.x}" y2="${v.to.y}" stroke="${v.status==='realizado'?'#fea478':'#71b5ed'}" stroke-width="${m.thickness}" stroke-dasharray="${v.status==='realizado'?'2 1.4':'none'}" stroke-linecap="round"/>`).join('');
 const hingeLabels=m.assembly.hinges.map(v=>`<circle cx="${v.point.x}" cy="${v.point.y}" r="1.1" fill="${v.status==='realizado'?'#ffc37f':'#a1cceb'}"/>`).join('');
 const bodies=machineOutlines(m);
 const overlap=m.interferences.problems.length>0;
 const warn=m.warnings.length?'#efb06e':'#59ceff';
 return `<svg class="f2d-svg" viewBox="0 0 900 480" role="img" aria-label="Vista lateral esquemática de punzón, matriz y chapa con zona curva tangente. No es una simulación física ni una verificación de colisiones.">
 <defs><pattern id="f2d-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0V20H0" fill="none" stroke="#193a55" stroke-width=".7"/></pattern><linearGradient id="f2d-metal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#435970"/><stop offset=".48" stop-color="#b8d2e9"/><stop offset="1" stop-color="#364a60"/></linearGradient><linearGradient id="f2d-sheet" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e0f5ff"/><stop offset="1" stop-color="#38b6ed"/></linearGradient></defs>
 <rect width="900" height="480" fill="#071a29"/><rect width="900" height="480" fill="url(#f2d-grid)"/>
 <g transform="translate(440 250) scale(${s.toFixed(5)}) translate(${-centreX.toFixed(5)} ${-centreY.toFixed(5)})">
 <!-- Siluetas de amarres y estructura NOMINALES; sus cotas no están certificadas. -->
 <path data-component="estructura-inferior" d="${path(bodies.lowerBody)}" fill="#53637a" fill-opacity=".70" stroke="#bdcde1" stroke-width="1"/>
 <path data-component="mesa" d="${path(bodies.table)}" fill="#8d7eaa" fill-opacity="${bodies.tableMeasured?'1':'.72'}" stroke="#e0d0f5" stroke-width="1"/>
 <path data-component="portamatriz" d="${path(bodies.dieHolder)}" fill="#657889" stroke="#d5e7f5" stroke-width="1"/>
 <path data-component="trancha" d="${path(bodies.ram)}" fill="#75879b" fill-opacity="${bodies.ramMeasured?'1':'.72'}" stroke="#cbddec" stroke-width="1"/>
 <path data-component="amarre-punzon" d="${path(bodies.upperHolder)}" fill="#a5afba" stroke="#ecf5fd" stroke-width="1"/>
 <path data-component="mordaza" d="${path(bodies.parts.find(part=>part.id==='mordaza').points)}" fill="#49596b" stroke="#cfdfeb" stroke-width=".8"/>
 <path data-component="matriz" d="${dieOutline}" fill="#744047" stroke="#e3a4aa" stroke-width=".8"/>
 <path d="M ${-half} 0 L 0 ${m.dieDepth} L ${half} 0" stroke="#b7d8ee" stroke-width=".9" fill="none"/>
 <path data-component="punzon" d="${punchOutline}" fill="url(#f2d-metal)" stroke="#eaf5ff" stroke-width="1.2"/>
 <path data-component="tope-carro" d="${path(bodies.carriage)}" fill="#526479" stroke="#bbd2d9" stroke-width="1"/>
 <path data-component="tope-brazo" d="${path(bodies.arm)}" fill="#617f85" stroke="#a6e9c9" stroke-width="1"/>
 ${wholePaths}
 ${hingeLabels}
 <path d="${line}" stroke="#081526" stroke-width="${m.thickness+1.6}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
 <path data-component="chapa" d="${line}" stroke="url(#f2d-sheet)" stroke-width="${m.thickness}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
 <g stroke="#f8bf56" stroke-width=".6" fill="#f8bf56"><circle cx="${-half}" cy="0" r=".9"/><circle cx="${half}" cy="0" r=".9"/></g>
 <circle cx="0" cy="${m.center.y}" r="1.1" fill="#ffb754"/>
 <path data-component="topes" d="${path(bodies.finger)}" fill="#50e4a7" stroke="#d0ffe7" stroke-width="1"/>
 <text x="${m.stop.x+5}" y="${m.stop.top-9}" font-size="5" fill="#cbffe6">TOPE X</text>
 <text x="${-Math.max(20,m.dieOpening*1.2)}" y="${m.toolProfiles.punch.outline[0].y-12}" font-size="5" fill="#d6efff">AMARRE · ILUSTRATIVO</text>
 <path d="M ${-half} ${dimension} V ${dimension-3} M ${half} ${dimension} V ${dimension-3} M ${-half} ${dimension-1.5} H ${half}" stroke="#67bce9" stroke-width=".6" fill="none" stroke-dasharray="1.5 1"/>
 </g>
 <rect x="14" y="16" width="290" height="92" rx="7" fill="#0b2941" stroke="#2b678b"/>
 <text x="27" y="36" font-size="12" fill="#96c6e4">PLEGADO ACTIVO · ${m.bend} / ${m.steps}</text>
 <text x="27" y="59" font-size="18" font-weight="bold" fill="#e0f3ff">${as2(m.signedAngle)}° / ${as2(m.turn)}°</text>
 <text x="27" y="77" font-size="11" fill="#93b9d4">Radio interior supuesto: ${as2(m.insideRadius)} mm</text>
 <text x="27" y="94" font-size="11" fill="#93b9d4">Espesor ${as2(m.thickness)} mm · V${m.dieOpening} · P${m.punchAngle}°</text>
 <g data-component="indicador-tope" transform="translate(685 45)" aria-label="Detalle auxiliar del tope nominal, no a escala">
 <rect width="200" height="67" rx="6" fill="#0d2b3e" stroke="#478b89"/>
 <path d="M18 38 H181 M129 39 V21 H161" stroke="#51ddb2" stroke-width="3" fill="none"/>
 <circle cx="129" cy="39" r="4" fill="#a6f8d7"/>
 <text x="12" y="15" fill="#c4ffe6" font-size="11">TOPE X · ${as2(m.stop.x)} mm</text>
 <text x="12" y="56" fill="#c1dbea" font-size="9">Referencia esquemática · no a escala</text>
 </g>
 <text x="885" y="28" text-anchor="end" font-size="11" fill="#eac187">PERFIL CON RADIO · APROXIMACIÓN</text>
 <text x="885" y="434" text-anchor="end" font-size="11" fill="${overlap?'#ff927b':warn}">Cribado 2D: ${html(m.interferences.status)}</text>
 <text x="885" y="450" text-anchor="end" font-size="11" fill="${warn}">Descenso estimado del eje: ${as2(m.depth)} mm</text>
 <text x="15" y="455" font-size="11" fill="#c8d5df">Trancha gris · Punzón acero · Chapa azul · Matriz granate · Mesa violeta · Topes verdes.</text>
 <text x="15" y="471" font-size="10" fill="#ffd49e">Mesa / trancha ${bodies.tableMeasured&&bodies.ramMeasured?'con cotas introducidas':'PARCIALMENTE SIN COTAS · esquemas'} · NO CNC</text>
 </svg>`;
}
function halt(){
 if(active?.timer!==null&&active?.timer!==undefined){cancelAnimationFrame(active.timer);active.timer=null;}
 if(active){active.lastFrame=null;const b=active.host.querySelector('[data-f2-action="play"]');if(b)b.textContent='▶ Reproducir sin pausas';}
}
function animation(now){
 const ctl=active;if(!ctl||ctl.timer===null||!ctl.host.isConnected){halt();return;}
 if(ctl.lastFrame===null)ctl.lastFrame=now;
 const dt=Math.min(100,Math.max(0,now-ctl.lastFrame));ctl.lastFrame=now;
 let finished=false,transition=false;
 if(ctl.holdUntil!==null){
  if(now>=ctl.holdUntil){
   ctl.currentStep=0;ctl.progress=0;ctl.holdUntil=null;transition=true;
   ctl.selfSelecting=true;
   try{ctl.onSelect(ctl.getData().sequence[0]);}finally{ctl.selfSelecting=false;}
  }
 }else{
  const next=TL().advance({step:ctl.currentStep,cycle:ctl.progress},dt,ctl.getData().sequence.length,{speed:ctl.speed});
  ctl.currentStep=next.step;ctl.progress=next.cycle;finished=next.finished;transition=next.transition;
  if(next.transition){
   ctl.selfSelecting=true;
   try{ctl.onSelect(ctl.getData().sequence[ctl.currentStep]);}finally{ctl.selfSelecting=false;}
  }
  if(next.finished){
   if(ctl.loop)ctl.holdUntil=now+550; // Pieza terminada a la vista, sin detener reproducción.
   else halt();
  }
 }
 if(ctl.lastPaint===null||now-ctl.lastPaint>=33||finished||transition){render();ctl.lastPaint=now;}
 if(ctl.timer!==null)ctl.timer=requestAnimationFrame(animation);
}
function destroy(){halt();active?.touchCamera?.destroy();active=null;}
function render(){
 const ctl=active;if(!ctl||!ctl.host.isConnected)return;
 const data=ctl.getData(), order=data.sequence;
 if(ctl.currentStep>=order.length)ctl.currentStep=0;
 const key=JSON.stringify([data,ctl.currentStep,ctl.mode,ctl.focus]);
 if(ctl.cameraKey!==key){ctl.bounds=ctl.focus?detailExtents(data,ctl.currentStep):fixedExtents(data,ctl.currentStep,ctl.mode);ctl.cameraKey=key;}
 const motion=ctl.mode==='cycle'?K().frame(data,ctl.currentStep,ctl.progress):null;
 const m=motion?motion.scene:Model.scene(data,ctl.currentStep,ctl.progress);
 ctl.host.querySelector('.f2-camera-content').innerHTML=svg(m,ctl.zoom,ctl.bounds);
 const proximity=Section.inspect(m),zones=ctl.host.querySelector('.f2-machine-zones');
 const sweepKey=JSON.stringify([data,ctl.currentStep]);
 if(ctl.sectionSweepKey!==sweepKey){
  ctl.sectionSweep=Section.sweep(data,ctl.currentStep,{intervals:20});
  ctl.sectionSweepKey=sweepKey;
 }
 if(zones){
  const checked=proximity.checked.map(part=>'<span class="f2-zone'+(part.possibleOverlap?' f2-zone-near':'')+
   '" title="Modelo 2D nominal; no es plano CAD verificado">'+part.name+' · '+
   (part.distanceMm===null?'sin tramo analizable':part.possibleOverlap?(part.expectedContact?'contacto previsto o posible solape':'posible cruce 2D'):part.distanceMm.toFixed(1)+' mm aprox.')+'</span>').join('');
  const first=ctl.sectionSweep.hits.slice(0,4).map(hit=>hit.component+' · '+hit.phase+' '+hit.cyclePercent+' %').join('; ');
  zones.innerHTML='<strong>SECCIÓN 2D · 11 zonas modeladas · NO CNC</strong>'+
   '<p>Posición actual: '+(proximity.hits.length?'posibles cruces de contornos: '+proximity.hits.map(x=>x.component).join(', '):'sin cruce observado en esta proyección')+
   '. Ausencia de cruces NO implica seguridad.</p><div class="f2-zone-grid">'+checked+'</div>'+
   '<p>Muestreo del golpe ('+ctl.sectionSweep.frames+' posiciones): '+
   (first?'primeras proximidades: '+first:'sin cruce en las posiciones muestreadas')+
   '. El contacto del punzón y la matriz con la chapa puede ser intencionado. Sin barrido continuo ni volteo real.</p>';
 }
 const label=ctl.host.querySelector('.f2-step-label');label.textContent=`Paso ${m.step} de ${m.steps} · pliegue ${m.bend} · ${as2(m.turn)}°`;
 ctl.host.querySelector('.f2-progress').textContent=`${Math.round(ctl.progress*100)} %`;
 const slider=ctl.host.querySelector('.f2-range');slider.value=String(Math.round(ctl.progress*100));
 slider.setAttribute('aria-valuetext',`${as2(m.signedAngle)} grados de ${as2(m.turn)} · ${motion?motion.phase:'conformado'}`);
 const modeButton=ctl.host.querySelector('[data-f2-action="mode"]');
 modeButton.textContent=ctl.mode==='cycle'?'☑ Ciclo completo':'☐ Ciclo completo';
 modeButton.setAttribute('aria-pressed',String(ctl.mode==='cycle'));
 const fb=ctl.host.querySelector('[data-f2-action="focus"]');if(fb){fb.setAttribute('aria-pressed',String(ctl.focus));fb.textContent=ctl.focus?'◱ Vista completa':'⌕ Detalle del pliegue';}
 ctl.host.querySelector('.f2-cycle-state').textContent=motion
  ? `FASE: ${motion.phase.toUpperCase()} · Punzón Y nominal ${as2(motion.punchY)} mm · retirada ${as2(motion.punchLift)} mm. ${motion.notice}. NO CNC / SIN VERIFICAR.`
  : 'MODO CONFORMADO · avance angular sin aproximación ni retirada. Activa Ciclo completo para ver las tres fases.';
 ctl.host.querySelector('[data-f2-action="previous"]').disabled=ctl.currentStep===0;
 ctl.host.querySelector('[data-f2-action="next"]').disabled=ctl.currentStep>=order.length-1;
 const loopBox=ctl.host.querySelector('.f2-loop');if(loopBox)loopBox.checked=ctl.loop;
 ctl.host.querySelector('.f2-nominal').textContent=`Tope X ${as2(m.stop.x)} mm · extremo derecho: ${as2(m.wingRight.x)} mm · separación horizontal: ${as2(m.interferences.backgaugeGap)} mm · ${m.interferences.backgaugeState}`;
 ctl.host.querySelector('.f2-nominal').dataset.status=m.interferences.problems.length?'warning':'info';
 ctl.host.querySelector('.f2-prior-summary').textContent=`Perfil completo: ${m.assembly.contour.length} puntos · ${m.assembly.completed.length} pliegues previos · ${m.assembly.pending} pliegues pendientes. ${m.previous.paths.length?'Holguras 2D orientativas de alas contiguas: '+m.interferences.flangeClearances.map(v=>`${v.component} ${as2(v.gap)} mm`).join(' · '):'No hay alas previas contiguas comprobables en este paso.'}`;
 ctl.host.querySelector('.f2-notes').innerHTML=m.interferences.problems.map(p=>`<li><strong>${html(p.component)}:</strong> ${html(p.message)}</li>`).join('')+m.warnings.map(w=>`<li>${html(w)}</li>`).join('')+`<li>${html(m.interferences.disclosure)}</li><li>${html(m.note)}</li>`;
 const pane=ctl.host.querySelector('.f2-data-values'),setup=data.setup||{};
 if(pane){
  const values=[
   ['Máquina','Modelo por confirmar'],['Punzón',setup.punch||'No elegido'],
   ['Matriz',setup.die||'No elegida'],['Espesor',as2(data.thickness)+' mm'],
   ['Material',data.material||'Sin especificar'],['Fuerza actual','NO CALCULADA'],
   ['Ángulo',as2(m.signedAngle)+'°'],
   ['Distancia punta–pie trancha',setup.ramBottomOffset==null?'Desconocida':as2(setup.ramBottomOffset)+' mm introducidos'],
   ['Y geométrica',as2(motion?.punchY??m.punchTipY)+' mm · NO CNC'],
   ['Avisos nominales',String(m.interferences.problems.length)]
  ];
  pane.innerHTML=values.map(([key,value])=>'<div><dt>'+html(key)+'</dt><dd>'+html(value)+'</dd></div>').join('');
 }
 const tiles=ctl.host.querySelector('.f2-steps'),key2=JSON.stringify(data);
 if(ctl.tilesKey!==key2){ctl.tilesKey=key2;tiles.innerHTML=gallery(data,order);}
 tiles.querySelectorAll('[data-f2-step]').forEach(button=>{
  const id=button.dataset.f2Step;
  const selected=id==='final'?ctl.currentStep===order.length-1&&ctl.progress===1:
   id==='start'?ctl.currentStep===0&&ctl.progress===0:Number(id)===ctl.currentStep;
  button.classList.toggle('selected',selected);
  button.setAttribute('aria-pressed',String(selected));
 });
}
function stepArt(data,index,progress){
 const m=Model.scene(data,index,progress);
 const [x1,x2,y1,y2]=extents(m),scale=Math.min(4,188/Math.max(25,x2-x1),73/Math.max(20,y2-y1));
 const cx=(x1+x2)/2,cy=(y1+y2)/2;
 const path=pts=>pts.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ');
 const punch=path(m.toolProfiles.punch.outline)+' Z',die=path(m.toolProfiles.die.outline)+' Z';
 const parts=machineOutlines(m),ram=path(parts.ram)+' Z',table=path(parts.table)+' Z';
 const sheet=path(m.assembly.contour);
 return '<svg viewBox="0 0 222 96" aria-hidden="true"><rect width="222" height="96" fill="#061929"/>'+
  '<g transform="translate(111 44) scale('+scale.toFixed(4)+') translate('+(-cx).toFixed(3)+' '+(-cy).toFixed(3)+')">'+
  '<path d="'+table+'" fill="#716985" stroke="#baa6d1" stroke-width=".8"/>'+
  '<path d="'+ram+'" fill="#5d7186" stroke="#c3d4e3" stroke-width=".8"/>'+
  '<path d="'+die+'" fill="#744346" stroke="#c67572" stroke-width=".8"/>'+
  '<path d="'+punch+'" fill="#b2c6d8" stroke="#ebf8ff" stroke-width=".8"/>'+
  '<rect x="'+m.stop.x+'" y="'+m.stop.top+'" width="'+m.stop.width+'" height="'+(m.stop.bottom-m.stop.top)+'" fill="#4ac587"/>'+
  '<path d="'+sheet+'" fill="none" stroke="#69ccff" stroke-width="'+Math.max(1.4,m.thickness)+'" stroke-linejoin="round"/></g></svg>';
}
function gallery(data,order){
 const card=(key,label,modelIdx,pct)=>'<button type="button" class="f2-step f2-tile" data-f2-step="'+key+'">'+
  stepArt(data,modelIdx,pct)+'<span>'+label+'</span></button>';
 let out=card('start','0 · Posicionar',0,0);
 for(let i=0;i<order.length;i++)out+=card(String(i),(i+1)+' · Pliegue '+order[i],i,1);
 return out+card('final','Final · pieza plegada',order.length-1,1);
}
const html=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(host,getData,getSelection=()=>1,onSelect=()=>{}){
 destroy();
 if(!host)return;
 let step=Math.max(0,getData().sequence.indexOf(getSelection()));
 active={host,getData,getSelection,onSelect,currentStep:step,progress:0,zoom:1,focus:false,mode:'cycle',timer:null,lastFrame:null,lastPaint:null,speed:Number(window.PlegarSettings?.get?.().speed)||1,
 loop:window.PlegarSettings?.get?.().repeat!==false,holdUntil:null,selfSelecting:false,cameraKey:null,bounds:null,tilesKey:null};
 host.innerHTML=`<section class="f2-view" aria-label="Seguimiento cinemático 2D de plegado">
 <div class="f2-title"><div><strong>SEGUIMIENTO DE PLEGADO · PERFIL</strong><small>Punzón superior · matriz V inferior · tope posterior · chapa</small></div><span>PERFIL GEOMÉTRICO v0.39</span></div>
 <div class="f2-layout"><div class="f2-stage" aria-label="Mueve la simulación 2D con un dedo y usa dos dedos para cambiar el zoom"><div class="f2-camera-content"></div></div><aside class="f2-data-panel" aria-label="Datos de operación nominal"><h3>DATOS</h3><dl class="f2-data-values"></dl><small>Geometría ilustrativa. Sin fuerzas calculadas ni trayectorias certificadas.</small></aside></div><div class="f2-toolbar"><strong class="f2-step-label"></strong><div class="f2-controls"><button type="button" data-f2-action="previous">← Anterior</button><button type="button" data-f2-action="play">▶ Reproducir sin pausas</button><button type="button" data-f2-action="mode" aria-pressed="false">☐ Ciclo completo</button><button type="button" data-f2-action="next">Siguiente →</button><button type="button" data-f2-action="reset">Reiniciar</button><button type="button" data-f2-action="focus" aria-pressed="false">⌕ Detalle del pliegue</button><label class="f2-loop-control"><input class="f2-loop" type="checkbox" checked> Repetir secuencia</label><button type="button" data-f2-action="zoom-out" aria-label="Reducir zoom">−</button><button type="button" data-f2-action="zoom-in" aria-label="Ampliar zoom">+</button></div></div>
 <div class="f2-cycle-state" role="status" aria-label="Fase cinemática 2D"></div><div class="f2-slider"><label for="f2-range">Avance del ciclo o conformado</label><input id="f2-range" class="f2-range" type="range" min="0" max="100" step="1" value="0"><output class="f2-progress" for="f2-range">0 %</output></div>
 <div class="f2-steps" aria-label="Orden de plegado"></div><div class="f2-machine-zones" role="status" aria-label="Componentes de máquina y proximidades"></div><div class="f2-prior-summary" role="status"></div><div class="f2-nominal" role="status"></div><ul class="f2-notes"></ul></section>`;
 active.touchCamera=window.PlegarTouchView.attach(host.querySelector('.f2-stage'),host.querySelector('.f2-camera-content'));
  host.onclick=e=>{
  const ctl=active;if(!ctl||ctl.host!==host)return;
  const stepBtn=e.target.closest('[data-f2-step]');
  if(stepBtn){
   halt();ctl.holdUntil=null;
   const target=stepBtn.dataset.f2Step,total=ctl.getData().sequence.length;
   ctl.currentStep=target==='start'?0:target==='final'?total-1:Number(target);
   ctl.progress=target==='final'?1:0;
   ctl.onSelect(ctl.getData().sequence[ctl.currentStep]);render();return;
  }
  const action=e.target.closest('[data-f2-action]')?.dataset.f2Action;
  if(!action)return;
  if(action==='mode'){halt();ctl.mode=ctl.mode==='bend'?'cycle':'bend';ctl.progress=0;ctl.holdUntil=null;render();return;}
  if(action==='play'){
   if(ctl.timer!==null){halt();render();return;}
   if(ctl.progress>=1){ctl.currentStep=0;ctl.progress=0;}
   ctl.host.querySelector('[data-f2-action="play"]').textContent='⏸ Pausar';
   ctl.holdUntil=null;ctl.lastFrame=null;ctl.lastPaint=null;
   ctl.timer=requestAnimationFrame(animation);return;
  }
  halt();ctl.holdUntil=null;
  if(action==='focus'){ctl.focus=!ctl.focus;ctl.cameraKey=null;render();return;}
  if(action==='previous'||action==='next'){
   ctl.currentStep=Math.max(0,Math.min(ctl.getData().sequence.length-1,ctl.currentStep+(action==='next'?1:-1)));
   ctl.progress=0;ctl.onSelect(ctl.getData().sequence[ctl.currentStep]);
  }
  if(action==='reset')ctl.progress=0;
  if(action==='zoom-in')ctl.zoom=Math.min(1.8,Math.round((ctl.zoom+.1)*10)/10);
  if(action==='zoom-out')ctl.zoom=Math.max(.7,Math.round((ctl.zoom-.1)*10)/10);
  render();
 };
 host.oninput=e=>{
  if(!active||active.host!==host)return;
  if(e.target.matches('.f2-loop')){
   active.loop=e.target.checked;
   try{window.PlegarSettings?.set?.('repeat',active.loop);}catch{}
   if(!active.loop&&active.holdUntil!==null){halt();active.holdUntil=null;}
   render();return;
  }
  if(!e.target.matches('.f2-range'))return;
  halt();active.holdUntil=null;active.progress=Number(e.target.value)/100;render();
 };
 render();
}
function refresh(){const ctl=active;if(!ctl||ctl.selfSelecting)return;halt();let next=ctl.getData().sequence.indexOf(ctl.getSelection());if(next>=0)ctl.currentStep=next;render();}
window.PlegarForming2D={mount,destroy,refresh};
})();
