/* PlegadoX — 02 TITANIUM. Presentación animada; progreso de inicio medido en scripts, no CNC. */
(function(root){
'use strict';
const doc=root.document,splash=doc.getElementById('startup-splash');
if(!splash)return;
splash.setAttribute('aria-label','PlegadoX TITANIUM, cargando la aplicación');
splash.innerHTML=String.raw`
<div class="ti-grain" aria-hidden="true"></div>
<div class="ti-shell">
  <header class="ti-top"><div class="ti-company"><span class="ti-mark">A</span>A.M.S TECNOLIGICS</div><span class="ti-edition">02 / TITANIUM · INDUSTRIAL EDITION</span></header>
  <div class="ti-title"><div class="ti-kicker">INGENIERÍA DE PLEGADO DE NUEVA GENERACIÓN</div><div class="ti-name"><span>PLEGADO</span><b>X</b></div><div class="ti-subtitle">LA PRECISIÓN TOMA FORMA</div></div>
  <div class="ti-stage" role="img" aria-label="Animación decorativa: un punzón dobla una chapa plateada sobre una matriz en V">
    <span class="ti-corner ti-tl"></span><span class="ti-corner ti-br"></span>
    <div class="ti-hud"><span>MÓDULO / CINEMÁTICA DE PLEGADO</span><span class="ti-live">● SECUENCIA ANIMADA</span></div>
    <svg class="ti-machine" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="ti-beam" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dae9f8"/><stop offset=".15" stop-color="#54758f"/><stop offset=".54" stop-color="#17334d"/><stop offset="1" stop-color="#668aa4"/></linearGradient>
        <linearGradient id="ti-steel" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#ecfaff"/><stop offset=".2" stop-color="#739bb7"/><stop offset=".47" stop-color="#e6f4ff"/><stop offset=".65" stop-color="#789bb7"/><stop offset="1" stop-color="#edfaff"/></linearGradient>
        <linearGradient id="ti-die" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#bbdbf0"/><stop offset=".35" stop-color="#496981"/><stop offset="1" stop-color="#0c2237"/></linearGradient>
        <radialGradient id="ti-halo"><stop stop-color="#279fff" stop-opacity=".3"/><stop offset="1" stop-color="#1b63a1" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="500" cy="335" rx="420" ry="265" fill="url(#ti-halo)"/>
      <g opacity=".17" fill="none" stroke="#71ccff"><circle cx="500" cy="310" r="217" stroke-dasharray="4 11"/><circle cx="500" cy="310" r="165" stroke-dasharray="24 11"/><path d="M500 50V535M76 405H924" stroke-dasharray="6 9"/></g>
      <path d="M112 108L142 88H858L888 108V163H112Z" fill="url(#ti-beam)" stroke="#a4d4ef" stroke-opacity=".8" stroke-width="3"/>
      <path d="M118 124H882" stroke="#dbf4ff" stroke-opacity=".5" stroke-width="3"/>
      <path d="M140 169V485M860 169V485" fill="none" stroke="#54758d" stroke-opacity=".28" stroke-width="19"/>
      <rect x="205" y="511" width="590" height="31" rx="3" fill="url(#ti-beam)" stroke="#7398ae" stroke-width="2"/>
      <path d="M260 405H340L500 488L660 405H740V513H260Z" fill="url(#ti-die)" stroke="#a7d5f0" stroke-width="3"/>
      <path d="M260 405H340L500 488L660 405H740" fill="none" stroke="#e6f8ff" stroke-width="5"/>
      <path d="M269 415H338L500 499L663 415H731" fill="none" stroke="#152f46" stroke-width="5"/>
      <g id="ti-sheet"><path id="ti-sheet-face" d="" fill="url(#ti-steel)" stroke="#b6f1ff" stroke-width="2"/><path id="ti-sheet-glint" d="" fill="none" stroke="#f7ffff" stroke-width="3.5" stroke-linejoin="round"/><path id="ti-sheet-edge" d="" fill="none" stroke="#3e94c4" stroke-width="4"/></g>
      <g id="ti-punch">
        <rect x="433" y="181" width="134" height="60" rx="3" fill="url(#ti-beam)" stroke="#c6edff" stroke-width="2"/>
        <path d="M454 241H546V276L513 326L500 347L487 326L454 276Z" fill="url(#ti-steel)" stroke="#dbf6ff" stroke-width="2.5"/>
        <path d="M500 347V259" stroke="#165579" stroke-width="2"/>
        <path d="M453 248H547" stroke="#efffff" stroke-opacity=".65" stroke-width="3"/>
      </g>
      <g font-family="monospace" font-size="13" fill="#83b7d8" letter-spacing="2"><text x="100" y="345">EJE Y1/Y2</text><text x="780" y="345">MATRIZ V</text><text x="102" y="484">ÁNGULO</text><text x="770" y="484">ACERO S235</text></g>
      <text id="ti-angle" x="102" y="514" fill="#bbf0ff" font-size="30" font-family="monospace" font-weight="bold">0.0°</text>
    </svg>
    <div class="ti-stage-foot"><span id="ti-operation">POSICIONANDO CHAPA</span><span>V / 24 · PERFIL TRANSVERSAL</span></div>
  </div>
  <section class="ti-bottom">
    <div class="ti-progress-head"><div><small>SISTEMA DE INICIALIZACIÓN</small><p id="startup-status">Cargando componentes de PlegadoX…</p></div><strong id="startup-value">0%</strong></div>
    <div class="ti-track" id="startup-meter" role="progressbar" aria-label="Carga de los archivos de la aplicación" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="startup-fill"></div></div>
    <div class="ti-ticks"><span>00 / INICIO</span><span>SCRIPTS · INTERFAZ · MÓDULOS</span><span>100 / LISTO</span></div>
  </section>
  <footer class="ti-footer"><span>© 2026 A.M.S TECNOLIGICS · TODOS LOS DERECHOS RESERVADOS.</span><span id="ti-footer-info">PRECISION ENGINEERING INTERFACE</span><button id="ti-retry" type="button" hidden>REINTENTAR INICIO</button></footer>
</div>`;
let displayed=0;
const preview=doc.createElement('iframe');
preview.className='ti-embedded';
preview.src='titanium-loading.html';
preview.title='Presentación PlegadoX TITANIUM';
preview.setAttribute('aria-hidden','true');preview.tabIndex=-1;
splash.appendChild(preview);
preview.addEventListener('load',()=>{
 try{preview.contentWindow.PlegadoXLoading.setProgress(displayed,doc.getElementById('startup-status')?.textContent||'Cargando PlegadoX…');preview.classList.add('ti-frame-ready');}
 catch(e){preview.remove();}
});
const el=id=>doc.getElementById(id);
const sheet=el('ti-sheet'),face=el('ti-sheet-face'),glint=el('ti-sheet-glint'),edge=el('ti-sheet-edge'),punch=el('ti-punch'),angle=el('ti-angle'),operation=el('ti-operation');
const fill=el('startup-fill'),meter=el('startup-meter'),value=el('startup-value'),status=el('startup-status');
const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
function draw(t){
 const approach=ease(t/.16),bend=t<.16?0:t<.53?ease((t-.16)/.37):t<.93?1:0;
 const retract=t<.64?1:t<.84?1-ease((t-.64)/.20):0;
 const travel=55*approach+84*bend*retract;
 const coords=[[160,402],[335,402],[500,402+84*bend],[665,402],[840,402]];
 const path=arr=>arr.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
 face.setAttribute('d',path(coords)+' '+path(coords.slice().reverse().map(p=>[p[0],p[1]+8])).replace(/^M/,'L')+' Z');
 glint.setAttribute('d',path(coords));edge.setAttribute('d',path(coords.map(p=>[p[0],p[1]+8])));
 punch.setAttribute('transform','translate(0 '+travel.toFixed(2)+')');
 const disappearing=t>.87&&t<.93?1-ease((t-.87)/.06):t>=.93?ease((t-.93)/.07):1;
 sheet.style.opacity=String(disappearing);
 angle.textContent=(bend*90).toFixed(1)+'°';
 operation.textContent=t<.16?'POSICIONANDO CHAPA':t<.53?'PLEGANDO':t<.64?'ÁNGULO ALCANZADO':t<.84?'RETORNO DEL PUNZÓN':'PREPARANDO SIGUIENTE CICLO';
}
let raf=0,begin=0;
function animate(ts){if(!begin)begin=ts;draw(((ts-begin)%6800)/6800);raf=root.requestAnimationFrame(animate);}
if(reduced)draw(.32);else raf=root.requestAnimationFrame(animate);
const scripts=[...doc.querySelectorAll('script[defer][src]')];
let loaded=1,failed=[],finished=false;
const settled=new Set([doc.currentScript||scripts[0]]);
function paint(p){
 const n=Math.max(0,Math.min(100,Math.floor(p)));
 displayed=n;fill.style.width=n+'%';meter.setAttribute('aria-valuenow',String(n));value.textContent=n+'%';try{preview.contentWindow?.PlegadoXLoading?.setProgress(n,status.textContent)}catch(e){}
}
function update(){
 if(finished)return;
 status.textContent='Cargando archivos de la aplicación ('+loaded+' de '+scripts.length+')…';
 paint(Math.min(96,Math.floor(96*loaded/Math.max(1,scripts.length))));
}
for(const script of scripts){
 if(settled.has(script))continue;
 script.addEventListener('load',()=>{if(settled.has(script))return;settled.add(script);loaded++;update();},{once:true});
 script.addEventListener('error',()=>{if(settled.has(script))return;settled.add(script);loaded++;failed.push(script.getAttribute('src'));update();},{once:true});
}
update();
function ready(){
 return !!(root.PlegarApp?.switchScreen && root.PlegarHomeDashboard?.init &&
 doc.querySelector('#menu-nav')?.children.length && doc.querySelector('#projects')?.children.length);
}
function complete(){
 if(finished)return;
 if(failed.length||!ready()){
  status.textContent=failed.length?'Error al cargar '+failed.length+' archivo(s). Revisa tu conexión.':'No se ha podido inicializar la interfaz de PlegadoX.';
  el('ti-retry').hidden=false;el('ti-footer-info').textContent='ARRANQUE NO COMPLETADO';
  return;
 }
 finished=true;status.textContent='PlegadoX listo.';paint(100);
 root.cancelAnimationFrame(raf);
 splash.classList.add('ti-done');
 root.setTimeout(()=>splash.remove(),420);
}
el('ti-retry').addEventListener('click',()=>root.location.reload());
doc.addEventListener('DOMContentLoaded',complete,{once:true});
root.PlegadoXLoading={getState:()=>({loaded,total:scripts.length,failed:[...failed],ready:finished})};
})(typeof window!=='undefined'?window:this);