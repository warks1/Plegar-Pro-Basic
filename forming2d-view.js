/* Reproductor de vista de perfil para Programación 2D y Simulación 2D.
   Muestra una aproximación con radio, no controla una plegadora. */
(function(){
'use strict';
const Model=window.PlegarFormingGeometry;
const as2=n=>Number(n).toLocaleString('es-ES',{maximumFractionDigits:2});
let active=null;
function svg(m,zoom){
 const half=m.dieOpening/2,outer=Math.max(m.left,m.right,half*2)+14;
 const s=Math.min(7.5,310/Math.max(outer,m.dieOpening*2,30))*zoom;
 const dieOutline=m.toolProfiles.die.outline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+' Z';
 const tip=m.punchTipY;
 const dimension=-Math.min(18,m.dieOpening*1.15)-m.thickness;
 const line=m.centerline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ');
 const punchOutline=m.toolProfiles.punch.outline.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+' Z';
 const priorPaths=m.previous.paths.map(p=>`<polyline points="${p.points.map(v=>`${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ')}" fill="none" stroke="#feac78" stroke-width="${m.thickness}" stroke-dasharray="2.2 1.5" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
 const overlap=m.interferences.problems.length>0;
 const warn=m.warnings.length?'#efb06e':'#59ceff';
 return `<svg class="f2d-svg" viewBox="0 0 900 480" role="img" aria-label="Vista lateral esquemática de punzón, matriz y chapa con zona curva tangente. No es una simulación física ni una verificación de colisiones.">
 <defs><pattern id="f2d-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0V20H0" fill="none" stroke="#193a55" stroke-width=".7"/></pattern><linearGradient id="f2d-metal" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#435970"/><stop offset=".48" stop-color="#b8d2e9"/><stop offset="1" stop-color="#364a60"/></linearGradient><linearGradient id="f2d-sheet" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e0f5ff"/><stop offset="1" stop-color="#38b6ed"/></linearGradient></defs>
 <rect width="900" height="480" fill="#071a29"/><rect width="900" height="480" fill="url(#f2d-grid)"/>
 <g transform="translate(440 250) scale(${s.toFixed(5)})">
 <path d="${dieOutline}" fill="url(#f2d-metal)" stroke="#83a1ba" stroke-width=".7"/>
 <path d="M ${-half} 0 L 0 ${m.dieDepth} L ${half} 0" stroke="#b7d8ee" stroke-width=".9" fill="none"/>
 <path d="${punchOutline}" fill="url(#f2d-metal)" stroke="#d0e5f4" stroke-width=".9"/>
 ${priorPaths}
 <path d="${line}" stroke="#081526" stroke-width="${m.thickness+1.6}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
 <path d="${line}" stroke="url(#f2d-sheet)" stroke-width="${m.thickness}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
 <g stroke="#f8bf56" stroke-width=".6" fill="#f8bf56"><circle cx="${-half}" cy="0" r=".9"/><circle cx="${half}" cy="0" r=".9"/></g>
 <circle cx="0" cy="${m.center.y}" r="1.1" fill="#ffb754"/>
 <rect x="${m.stop.x}" y="${m.stop.top}" width="${m.stop.width}" height="${m.stop.bottom-m.stop.top}" rx="1" fill="${overlap?'#dc7770':'#e7b34a'}" stroke="#f8d890" stroke-width=".4"/>
 <path d="M ${m.stop.x+m.stop.width/2} ${m.stop.top} v -15 h ${Math.max(5,m.dieOpening/3)}" stroke="#ddab4b" stroke-width="1.4" fill="none"/>
 <path d="M ${-half} ${dimension} V ${dimension-3} M ${half} ${dimension} V ${dimension-3} M ${-half} ${dimension-1.5} H ${half}" stroke="#67bce9" stroke-width=".6" fill="none" stroke-dasharray="1.5 1"/>
 </g>
 <rect x="14" y="16" width="290" height="92" rx="7" fill="#0b2941" stroke="#2b678b"/>
 <text x="27" y="36" font-size="12" fill="#96c6e4">PLEGADO ACTIVO · ${m.bend} / ${m.steps}</text>
 <text x="27" y="59" font-size="18" font-weight="bold" fill="#e0f3ff">${as2(m.currentAngle)}° / ${as2(m.targetAngle)}°</text>
 <text x="27" y="77" font-size="11" fill="#93b9d4">Radio interior supuesto: ${as2(m.insideRadius)} mm</text>
 <text x="27" y="94" font-size="11" fill="#93b9d4">Espesor ${as2(m.thickness)} mm · V${m.dieOpening} · P${m.punchAngle}°</text>
 <text x="885" y="28" text-anchor="end" font-size="11" fill="#eac187">PERFIL CON RADIO · APROXIMACIÓN</text>
 <text x="885" y="434" text-anchor="end" font-size="11" fill="${overlap?'#ff927b':warn}">Cribado 2D: ${html(m.interferences.status)}</text>
 <text x="885" y="450" text-anchor="end" font-size="11" fill="${warn}">Descenso estimado del eje: ${as2(m.depth)} mm</text>
 <text x="15" y="455" font-size="11" fill="#c8d5df">Naranja discontinuo: alas previas aproximadas (sin recolocación). NO verifica seguridad.</text>
 </svg>`;
}
function halt(){if(active?.timer){clearInterval(active.timer);active.timer=null;}if(active){const b=active.host.querySelector('[data-f2-action="play"]');if(b)b.textContent='▶ Reproducir';}}
function destroy(){halt();active=null;}
function render(){
 const ctl=active;if(!ctl||!ctl.host.isConnected)return;
 const data=ctl.getData(), order=data.sequence;
 if(ctl.currentStep>=order.length)ctl.currentStep=0;
 const m=Model.scene(data,ctl.currentStep,ctl.progress);
 ctl.host.querySelector('.f2-stage').innerHTML=svg(m,ctl.zoom);
 const label=ctl.host.querySelector('.f2-step-label');label.textContent=`Paso ${m.step} de ${m.steps} · pliegue ${m.bend} · ${as2(m.turn)}°`;
 ctl.host.querySelector('.f2-progress').textContent=`${Math.round(m.progress*100)} %`;
 const slider=ctl.host.querySelector('.f2-range');slider.value=String(Math.round(m.progress*100));
 slider.setAttribute('aria-valuetext',`${as2(m.currentAngle)} grados de ${as2(m.targetAngle)}`);
 ctl.host.querySelector('[data-f2-action="previous"]').disabled=ctl.currentStep===0;
 ctl.host.querySelector('[data-f2-action="next"]').disabled=ctl.currentStep>=order.length-1;
 ctl.host.querySelector('.f2-nominal').textContent=`Tope X ${as2(m.stop.x)} mm · extremo derecho: ${as2(m.wingRight.x)} mm · separación horizontal: ${as2(m.interferences.backgaugeGap)} mm · ${m.interferences.backgaugeState}`;
 ctl.host.querySelector('.f2-nominal').dataset.status=m.interferences.problems.length?'warning':'info';
 ctl.host.querySelector('.f2-prior-summary').textContent=m.previous.paths.length?
  `Alas previas dibujadas: ${m.previous.paths.flatMap(p=>p.bends).join(', ')}. Holguras 2D orientativas (chapa/herramienta): ${m.interferences.flangeClearances.map(v=>`${v.component} ${as2(v.gap)} mm`).join(' · ')}`:
  `No hay alas previas contiguas representables en este paso. La simulación no garantiza ausencia de colisiones.`;
 ctl.host.querySelector('.f2-notes').innerHTML=m.interferences.problems.map(p=>`<li><strong>${html(p.component)}:</strong> ${html(p.message)}</li>`).join('')+m.warnings.map(w=>`<li>${html(w)}</li>`).join('')+`<li>${html(m.interferences.disclosure)}</li><li>${html(m.note)}</li>`;
 const options=ctl.host.querySelector('.f2-steps');
 options.innerHTML=order.map((id,i)=>`<button type="button" class="f2-step ${i===ctl.currentStep?'selected':''}" data-f2-step="${i}" aria-pressed="${i===ctl.currentStep}">${i+1} · P${id}</button>`).join('');
}
const html=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(host,getData,getSelection=()=>1,onSelect=()=>{}){
 destroy();
 if(!host)return;
 let step=Math.max(0,getData().sequence.indexOf(getSelection()));
 active={host,getData,getSelection,onSelect,currentStep:step,progress:0,zoom:1,timer:null};
 host.innerHTML=`<section class="f2-view" aria-label="Seguimiento cinemático 2D de plegado">
 <div class="f2-title"><div><strong>SEGUIMIENTO DE PLEGADO · PERFIL</strong><small>Punzón superior · matriz V inferior · tope posterior · chapa</small></div><span>PERFIL GEOMÉTRICO v0.7</span></div>
 <div class="f2-stage"></div><div class="f2-toolbar"><strong class="f2-step-label"></strong><div class="f2-controls"><button type="button" data-f2-action="previous">← Anterior</button><button type="button" data-f2-action="play">▶ Reproducir</button><button type="button" data-f2-action="next">Siguiente →</button><button type="button" data-f2-action="reset">Reiniciar</button><button type="button" data-f2-action="zoom-out" aria-label="Reducir zoom">−</button><button type="button" data-f2-action="zoom-in" aria-label="Ampliar zoom">+</button></div></div>
 <div class="f2-slider"><label for="f2-range">Avance del pliegue</label><input id="f2-range" class="f2-range" type="range" min="0" max="100" step="1" value="0"><output class="f2-progress" for="f2-range">0 %</output></div>
 <div class="f2-steps" aria-label="Orden de plegado"></div><div class="f2-prior-summary" role="status"></div><div class="f2-nominal" role="status"></div><ul class="f2-notes"></ul></section>`;
 host.onclick=e=>{
  const ctl=active;if(!ctl||ctl.host!==host)return;
  const stepBtn=e.target.closest('[data-f2-step]');
  if(stepBtn){halt();ctl.currentStep=Number(stepBtn.dataset.f2Step);ctl.progress=0;ctl.onSelect(ctl.getData().sequence[ctl.currentStep]);render();return;}
  const action=e.target.closest('[data-f2-action]')?.dataset.f2Action;
  if(!action)return;
  if(action==='play'){
   if(ctl.timer){halt();return;}
   if(ctl.progress>=1)ctl.progress=0;
   ctl.host.querySelector('[data-f2-action="play"]').textContent='⏸ Pausar';
   ctl.timer=setInterval(()=>{
    if(active!==ctl||!ctl.host.isConnected){halt();return;}
    ctl.progress=Math.min(1,Math.round((ctl.progress+0.025)*1000)/1000);
    render();if(ctl.progress>=1)halt();
   },75);return;
  }
  halt();
  if(action==='previous'||action==='next'){
   ctl.currentStep=Math.max(0,Math.min(ctl.getData().sequence.length-1,ctl.currentStep+(action==='next'?1:-1)));
   ctl.progress=0;ctl.onSelect(ctl.getData().sequence[ctl.currentStep]);
  }
  if(action==='reset')ctl.progress=0;
  if(action==='zoom-in')ctl.zoom=Math.min(1.8,Math.round((ctl.zoom+.1)*10)/10);
  if(action==='zoom-out')ctl.zoom=Math.max(.7,Math.round((ctl.zoom-.1)*10)/10);
  render();
 };
 host.oninput=e=>{if(!e.target.matches('.f2-range')||!active||active.host!==host)return;halt();active.progress=Number(e.target.value)/100;render();};
 render();
}
function refresh(){const ctl=active;if(!ctl)return;halt();let next=ctl.getData().sequence.indexOf(ctl.getSelection());if(next>=0)ctl.currentStep=next;render();}
window.PlegarForming2D={mount,destroy,refresh};
})();
