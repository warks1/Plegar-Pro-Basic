/* v0.35: presentación responsive sin botón de omitir. El progreso es estimado, no es telemetría CNC. */
(function(root){
'use strict';
if(!root.document)return;
const splash=root.document.getElementById('startup-splash');
if(!splash)return;
const meter=root.document.getElementById('startup-meter');
const fill=root.document.getElementById('startup-fill');
const value=root.document.getElementById('startup-value');
const status=root.document.getElementById('startup-status');
const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const duration=reduced?500:4400, maxWait=12000;
const started=root.performance?.now?.()||Date.now();
let ready=root.document.readyState==='complete',done=false,handle=0;
function paint(pct){const p=Math.max(0,Math.min(100,Math.floor(pct)));fill.style.width=p+'%';meter.setAttribute('aria-valuenow',String(p));value.textContent=p+'%';}
function finish(){if(done)return;done=true;root.cancelAnimationFrame(handle);paint(100);status.textContent=ready?'INTERFAZ PREPARADA':'ABRIENDO INTERFAZ';splash.classList.add('pp-splash-done');root.setTimeout(()=>splash.remove(),550);}
root.addEventListener('load',()=>{ready=true;},{once:true});
function frame(now){if(done)return;const elapsed=Math.max(0,now-started);paint(ready?Math.min(100,elapsed/duration*100):Math.min(94,elapsed/duration*94));if((ready&&elapsed>=duration)||elapsed>maxWait){finish();return;}if(elapsed>8000&&!ready)status.textContent='PREPARANDO LA INTERFAZ...';handle=root.requestAnimationFrame(frame);}
handle=root.requestAnimationFrame(frame);
})(typeof window!=='undefined'?window:this);
