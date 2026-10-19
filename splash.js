/* Presentación animada de arranque: progreso VISUAL ESTIMADO, no telemetría CNC. */
(function(root){
'use strict';
if(!root.document)return;
const splash=root.document.getElementById('startup-splash');
if(!splash)return;
const meter=root.document.getElementById('startup-meter'), fill=root.document.getElementById('startup-fill'), value=root.document.getElementById('startup-value');
const status=root.document.getElementById('startup-status'), skip=root.document.getElementById('startup-skip');
const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const duration=reduced?500:4400;
const started=root.performance?.now?.()||Date.now();
let ready=root.document.readyState==='complete', done=false,handle=0;
function paint(percentage){const n=Math.max(0,Math.min(100,Math.floor(percentage)));fill.style.width=n+'%';meter.setAttribute('aria-valuenow',String(n));value.textContent=n+'%';}
function finish(){if(done)return;done=true;root.cancelAnimationFrame(handle);paint(100);status.textContent='INTERFAZ PREPARADA';splash.classList.add('pp-splash-done');root.setTimeout(()=>splash.remove(),650);}
function loaded(){ready=true;}
root.addEventListener('load',loaded,{once:true});
skip.addEventListener('click',finish);
function frame(now){if(done)return;const elapsed=Math.max(0,now-started);const progress=Math.min(94,elapsed/duration*94);paint(ready?Math.min(100,elapsed/duration*100):progress);
if(ready && elapsed>=duration){finish();return;}
if(elapsed>12000){status.textContent='EL ARRANQUE ESTÁ TARDANDO. PUEDES OMITIR LA PRESENTACIÓN.';}
handle=root.requestAnimationFrame(frame);
}
handle=root.requestAnimationFrame(frame);
})(typeof window!=='undefined'?window:this);
