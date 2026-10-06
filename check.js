
'use strict';
const $=id=>document.getElementById(id);
const VLIST=[6,12,16,22,24,32,36,40,50];
let model={
  reference:'PIEZA-001',material:'Acero S235',thickness:2,k:.33,width:800,dimensionMode:'inside',
  wings:[120,80,55,35],
  bends:[
    {angle:90,radius:2,direction:'Arriba',v:16,bendLength:800,gauge:120},
    {angle:90,radius:2,direction:'Arriba',v:16,bendLength:800,gauge:80},
    {angle:135,radius:2.5,direction:'Abajo',v:22,bendLength:800,gauge:55}
  ]
};
let sim={mode:'2d',step:0,progress:1,playing:false,last:0,frame:0};
let lastCurve=null;
const pages={dashboard:['Panel principal','Todos los módulos usan el mismo programa'],program:['Programar plegado','Longitud, radio, V, sentido, tope y longitud de plegado'],development:['Desarrollo','Cotas interiores o exteriores'],compare:['Comparador V','Pérdida o ganancia con varios pliegues'],simulation:['Simulación 2D/3D','Forma acumulada de la pieza'],curve:['Curva perfecta','Golpes sucesivos'],tools:['Matrices y punzones','Biblioteca multimarca'],production:['Tiempos','Preparación y fabricación'],quality:['Calidad','Primera pieza'],clients:['Clientes','WhatsApp y correo'],documents:['Documentos','Archivos y copias'],ai:['Copiloto IA','Asistencia sobre el programa']};
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===name));
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  const m=pages[name]||[name,''];$('pageTitle').textContent=m[0];$('pageSub').textContent=m[1];$('sidebar').classList.remove('open');
  if(name==='simulation')setTimeout(resizeSim,30);
  if(name==='development')setTimeout(calculateDevelopment,30);
  if(name==='compare')setTimeout(compareV,30);
  if(name==='curve')setTimeout(calculateCurve,30);
}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');

function effectiveWing(index,mode=model.dimensionMode){
  const raw=+model.wings[index]||0;
  if(mode==='inside')return raw;
  const t=+model.thickness||0;
  let correction=0;
  if(index>0){const b=model.bends[index-1];correction+=(b?Math.tan((180-b.angle)*Math.PI/360)*t:0)}
  if(index<model.bends.length){const b=model.bends[index];correction+=(b?Math.tan((180-b.angle)*Math.PI/360)*t:0)}
  return Math.max(0,raw-correction);
}
function bendMath(b,overrideV=null){
  const t=+model.thickness||2,k=+model.k||.33;
  const v=overrideV??+b.v;
  const radius=overrideV===null?Math.max(.1,+b.radius):Math.max(.1,v*.16);
  const theta=(180-Math.max(1,Math.min(179,+b.angle)))*Math.PI/180;
  const ba=theta*(radius+k*t);
  const setback=Math.tan(theta/2)*(radius+t);
  const bd=Math.max(0,2*setback-ba);
  return{v,radius,ba,bd,setback};
}
function calculateModel(overrideV=null,baseProgram=false){
  const nominalRaw=model.wings.reduce((s,w)=>s+(+w||0),0);
  const effective=model.wings.map((_,i)=>effectiveWing(i,model.dimensionMode));
  const nominalEffective=effective.reduce((s,w)=>s+w,0);
  let ba=0,bd=0,radiusTotal=0;
  const rows=model.bends.map((b,i)=>{
    const c=bendMath(b,baseProgram?null:overrideV);
    ba+=c.ba;bd+=c.bd;radiusTotal+=c.radius;
    return{i,b,c,wing:model.wings[i]||0,effective:effective[i]||0};
  });
  return{nominalRaw,nominalEffective,ba,bd,radiusTotal,flat:Math.max(0,nominalEffective-bd),rows,effective};
}
function syncInputs(){
  model.thickness=+$('thickness').value||2;model.k=+$('kFactor').value||.33;model.width=+$('partWidth').value||800;
  model.material=$('material').value;model.reference=$('partRef').value;model.dimensionMode=$('devDimensionMode').value;
  $('programThickness').value=model.thickness;$('dimensionMode').value=model.dimensionMode;$('simDimensionMode').value=model.dimensionMode;
}
function syncFromProgram(){
  model.thickness=+$('programThickness').value||2;model.dimensionMode=$('dimensionMode').value;
  $('thickness').value=model.thickness;$('devDimensionMode').value=model.dimensionMode;$('simDimensionMode').value=model.dimensionMode;
}
function renderProgram(){
  $('programRows').innerHTML=model.bends.map((b,i)=>`<div class="program-row">
    <div class="num">#${i+1}</div>
    <div class="field"><label>Longitud pestaña</label><input type="number" step=".1" value="${model.wings[i]||0}" data-wing="${i}"></div>
    <div class="field"><label>Ángulo interior</label><input type="number" min="1" max="179" step=".1" value="${b.angle}" data-bend="${i}" data-key="angle"></div>
    <div class="field"><label>Radio interior</label><input type="number" min=".1" step=".1" value="${b.radius}" data-bend="${i}" data-key="radius"></div>
    <div class="field"><label>Sentido</label><select data-bend="${i}" data-key="direction"><option ${b.direction==='Arriba'?'selected':''}>Arriba</option><option ${b.direction==='Abajo'?'selected':''}>Abajo</option></select></div>
    <div class="field"><label>Matriz</label><select data-bend="${i}" data-key="v">${VLIST.map(v=>`<option value="${v}" ${+b.v===v?'selected':''}>V${v}</option>`).join('')}</select></div>
    <div class="field"><label>Long. plegado</label><input type="number" value="${b.bendLength}" data-bend="${i}" data-key="bendLength"></div>
    <div class="field"><label>Tope X</label><input type="number" step=".1" value="${b.gauge}" data-bend="${i}" data-key="gauge"></div>
    <div class="field"><label>Cota efectiva</label><input disabled value="${effectiveWing(i).toFixed(2)}"></div>
    <button class="delete" data-remove="${i}">×</button>
  </div>`).join('');
  bindEditors();renderWings();renderDevBends();renderSequence();updateEverything();
}
function renderWings(){
  $('wingRows').innerHTML=model.wings.map((w,i)=>`<div class="program-row" style="grid-template-columns:46px 1fr 1fr 36px">
    <div class="num">#${i+1}</div><div class="field"><label>Longitud introducida</label><input type="number" step=".1" value="${w}" data-wing="${i}"></div>
    <div class="field"><label>Longitud efectiva ${model.dimensionMode==='inside'?'interior':'convertida a interior'}</label><input disabled value="${effectiveWing(i).toFixed(2)}"></div>
    <button class="delete" data-remove-wing="${i}">×</button></div>`).join('');
  bindEditors();
}
function renderDevBends(){
  $('devBendRows').innerHTML=model.bends.map((b,i)=>`<div class="program-row" style="grid-template-columns:46px repeat(6,minmax(85px,1fr)) 36px">
    <div class="num">#${i+1}</div>
    <div class="field"><label>Ángulo</label><input type="number" value="${b.angle}" data-bend="${i}" data-key="angle"></div>
    <div class="field"><label>Radio</label><input type="number" step=".1" value="${b.radius}" data-bend="${i}" data-key="radius"></div>
    <div class="field"><label>Sentido</label><select data-bend="${i}" data-key="direction"><option ${b.direction==='Arriba'?'selected':''}>Arriba</option><option ${b.direction==='Abajo'?'selected':''}>Abajo</option></select></div>
    <div class="field"><label>V</label><select data-bend="${i}" data-key="v">${VLIST.map(v=>`<option value="${v}" ${+b.v===v?'selected':''}>V${v}</option>`).join('')}</select></div>
    <div class="field"><label>Long. plegado</label><input type="number" value="${b.bendLength}" data-bend="${i}" data-key="bendLength"></div>
    <div class="field"><label>Tope X</label><input type="number" value="${b.gauge}" data-bend="${i}" data-key="gauge"></div>
    <button class="delete" data-remove="${i}">×</button></div>`).join('');
  bindEditors();
}
function bindEditors(){
  document.querySelectorAll('[data-wing]').forEach(el=>el.onchange=()=>{model.wings[+el.dataset.wing]=+el.value;renderProgram()});
  document.querySelectorAll('[data-bend][data-key]').forEach(el=>el.onchange=()=>{const i=+el.dataset.bend,k=el.dataset.key;model.bends[i][k]=k==='direction'?el.value:+el.value;renderProgram()});
  document.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>removeBend(+el.dataset.remove));
  document.querySelectorAll('[data-remove-wing]').forEach(el=>el.onclick=()=>removeWing(+el.dataset.removeWing));
}
function addBend(){
  model.bends.push({angle:90,radius:2,direction:'Arriba',v:16,bendLength:model.width,gauge:50});
  if(model.wings.length<model.bends.length+1)model.wings.push(50);renderProgram();
}
function removeBend(i){if(model.bends.length<=1)return;model.bends.splice(i,1);if(model.wings.length>model.bends.length+1)model.wings.splice(i+1,1);sim.step=Math.min(sim.step,model.bends.length-1);renderProgram()}
function removeWing(i){if(model.wings.length<=2)return;model.wings.splice(i,1);while(model.bends.length>model.wings.length-1)model.bends.pop();renderProgram()}
function loadExample(){
  model.wings=[100,70,45,35,25,20];
  model.bends=[
    {angle:90,radius:1.8,direction:'Arriba',v:12,bendLength:600,gauge:100},
    {angle:90,radius:2,direction:'Arriba',v:16,bendLength:600,gauge:70},
    {angle:135,radius:3,direction:'Abajo',v:24,bendLength:600,gauge:45},
    {angle:90,radius:2,direction:'Arriba',v:16,bendLength:600,gauge:35},
    {angle:88,radius:1.8,direction:'Arriba',v:12,bendLength:600,gauge:25}
  ];sim.step=0;sim.progress=1;renderProgram();
}
function updateEverything(){
  const r=calculateModel(null,true);
  $('programNominal').textContent=r.nominalRaw.toFixed(2)+' mm';$('programFlat').textContent=r.flat.toFixed(2)+' mm';$('programBA').textContent=r.ba.toFixed(2)+' mm';$('programBD').textContent=r.bd.toFixed(2)+' mm';
  $('dashBends').textContent=model.bends.length;$('dashWings').textContent=model.wings.length;$('dashFlat').textContent=r.flat.toFixed(2)+' mm';$('dashMode').textContent=model.dimensionMode==='inside'?'Interior':'Exterior';
  $('dashSummary').innerHTML=`<b>${model.reference}</b> · ${model.material} ${model.thickness} mm · ${model.bends.length} pliegues · desarrollo ${r.flat.toFixed(2)} mm`;
  const warnings=[];model.bends.forEach((b,i)=>{if(b.v/model.thickness<5)warnings.push(`Pliegue ${i+1}: V estrecha para el espesor.`);if(effectiveWing(i)<b.v*.7)warnings.push(`Pestaña ${i+1}: cota efectiva corta para V${b.v}.`)});
  $('programWarnings').innerHTML=warnings.length?warnings.map(w=>`<div class="warn">${w}</div>`).join(''):'<span class="good">Datos coherentes para una comprobación inicial.</span>';
  calculateDevelopment();resizeSim();
}
function calculateDevelopment(){
  syncInputs();const r=calculateModel(null,true);
  $('devNominal').textContent=r.nominalRaw.toFixed(2)+' mm';$('devBA').textContent=r.ba.toFixed(2)+' mm';$('devBD').textContent=r.bd.toFixed(2)+' mm';$('devFlat').textContent=r.flat.toFixed(2)+' mm';
  $('devTable').innerHTML=r.rows.map(x=>`<tr><td>${x.i+1}</td><td>${x.wing.toFixed(2)}</td><td>${x.effective.toFixed(2)}</td><td>${x.b.angle}°</td><td>${x.c.radius.toFixed(2)}</td><td>V${x.b.v}</td><td>${x.c.ba.toFixed(3)}</td><td>${x.c.bd.toFixed(3)}</td></tr>`).join('');
  drawDevelopment(r);return r;
}
function drawDevelopment(r){
  const c=$('devCanvas'),d=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);
  x.fillStyle='#02080e';x.fillRect(0,0,w,h);const pad=38,y=h/2,s=(w-pad*2)/Math.max(r.flat,1);
  const grad=x.createLinearGradient(pad,0,w-pad,0);grad.addColorStop(0,'#35bfa7');grad.addColorStop(.5,'#65f0cf');grad.addColorStop(1,'#2cae99');
  x.strokeStyle=grad;x.lineWidth=14;x.lineCap='round';x.beginPath();x.moveTo(pad,y);x.lineTo(w-pad,y);x.stroke();
  let pos=pad; r.rows.forEach((row,i)=>{pos+=Math.max(0,row.effective-row.c.bd)*s;x.strokeStyle='#ffc266';x.lineWidth=2;x.beginPath();x.moveTo(pos,y-28);x.lineTo(pos,y+28);x.stroke();x.fillStyle='#fff';x.font='11px sans-serif';x.fillText(`#${i+1} V${row.b.v}`,pos-18,y-35)});
  x.fillStyle='#91aabd';x.font='12px sans-serif';x.fillText(`Modo ${model.dimensionMode==='inside'?'interior':'exterior'} · Desarrollo ${r.flat.toFixed(2)} mm`,20,25);
}
function scenarioSingleV(v){return calculateModel(v,false)}
function compareV(){
  const selected=[...$('vChecks').querySelectorAll('input:checked')].map(x=>+x.value);const baseProgram=$('baseConfiguration').value==='program';
  const base=baseProgram?calculateModel(null,true):scenarioSingleV(+$('baseV').value);
  if(!selected.length)selected.push(+$('baseV').value);
  const results=selected.sort((a,b)=>a-b).map(v=>({v,r:scenarioSingleV(v)}));
  $('compareRows').innerHTML=results.map(item=>{const diff=item.r.flat-base.flat,per=diff/Math.max(1,model.wings.length),ratio=item.v/model.thickness,risk=ratio<5?'V estrecha':ratio>14?'Radio grande':'Controlado';return`<tr><td>V${item.v}</td><td>${item.r.radiusTotal.toFixed(2)}</td><td>${item.r.bd.toFixed(2)}</td><td>${item.r.flat.toFixed(2)}</td><td class="${diff>=0?'good':'bad'}">${diff>=0?'+':''}${diff.toFixed(2)} mm</td><td>${per>=0?'+':''}${per.toFixed(3)} mm</td><td>${risk}</td></tr>`}).join('');
  $('compareDetail').innerHTML=results.map(item=>{const details=item.r.rows.map((row,i)=>{const baseRow=base.rows[i],d=row.c.bd-baseRow.c.bd;return`P${i+1}: radio ${row.c.radius.toFixed(2)} mm · ΔBD ${d>=0?'+':''}${d.toFixed(3)} mm`}).join('<br>');return`<div class="compare-card"><b>V${item.v}</b><div class="small muted">${details}</div></div>`}).join('');
  drawCompare(results,base);
}
function drawCompare(results,base){
  const c=$('compareCanvas'),d=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.fillStyle='#02080e';x.fillRect(0,0,w,h);
  const max=Math.max(...results.map(z=>Math.abs(z.r.flat-base.flat)),1),pad=42;
  results.forEach((z,i)=>{const diff=z.r.flat-base.flat,bw=(w-pad*2)/results.length*.55,cx=pad+(i+.5)*(w-pad*2)/results.length,bh=Math.abs(diff)/max*(h-105)/2,y=h/2-(diff>=0?bh:0);x.fillStyle=diff>=0?'#42dfbe':'#ff7886';x.fillRect(cx-bw/2,y,bw,bh);x.fillStyle='#fff';x.font='11px sans-serif';x.fillText(`V${z.v}`,cx-10,h-22);x.fillText(`${diff>=0?'+':''}${diff.toFixed(2)}`,cx-17,diff>=0?y-7:y+bh+15)});
  x.strokeStyle='#496f87';x.beginPath();x.moveTo(pad,h/2);x.lineTo(w-pad,h/2);x.stroke();
}
function foldedPoints(){
  let pts=[[0,0]],heading=0;
  for(let i=0;i<model.wings.length;i++){
    const L=effectiveWing(i,$('simDimensionMode').value),last=pts[pts.length-1];pts.push([last[0]+Math.cos(heading)*L,last[1]-Math.sin(heading)*L]);
    if(i<model.bends.length){const b=model.bends[i],factor=i<sim.step?1:i===sim.step?sim.progress:0;heading+=(180-b.angle)*Math.PI/180*(b.direction==='Abajo'?-1:1)*factor}
  }return pts;
}
function fit(pts,w,h,pad=60){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min((w-pad*2)/Math.max(1,maxX-minX),(h-pad*2)/Math.max(1,maxY-minY));return pts.map(p=>[pad+(p[0]-minX)*s,pad+(p[1]-minY)*s])}
function finishColors(){
  return {steel:['#39d2b3','#d7fff7'],inox:['#d9e6ed','#ffffff'],aluminium:['#a9d6e8','#eafaff'],galvanized:['#8fb2c4','#e2eef4']}[$('finish').value];
}
function resizeSim(){const c=$('simCanvas'),d=Math.min(devicePixelRatio||1,$('quality').value==='high'?2:1.3),w=c.clientWidth,h=c.clientHeight;c.width=w*d;c.height=h*d;drawSim()}
function drawSim(){
  const c=$('simCanvas'),d=c.width/Math.max(1,c.clientWidth),w=c.clientWidth,h=c.clientHeight,x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);
  const bg=x.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0e2a40');bg.addColorStop(.55,'#071724');bg.addColorStop(1,'#02070b');x.fillStyle=bg;x.fillRect(0,0,w,h);
  sim.mode==='2d'?draw2D(x,w,h):draw3D(x,w,h);
  $('hud').textContent=`${sim.mode.toUpperCase()} · Pliegue ${sim.step+1}/${model.bends.length} · ${Math.round(sim.progress*100)}% · cotas ${$('simDimensionMode').value==='inside'?'interiores':'exteriores'}`;
}
function draw2D(x,w,h){
  const raw=foldedPoints(),pts=fit(raw,w,h,72),colors=finishColors();
  x.shadowColor='#000';x.shadowBlur=18;x.strokeStyle=colors[0];x.lineWidth=14;x.lineCap='round';x.lineJoin='round';x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.stroke();x.shadowBlur=0;
  x.strokeStyle=colors[1];x.lineWidth=2;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.stroke();
  pts.slice(1,-1).forEach((p,i)=>{x.fillStyle=i===sim.step?'#ffc266':'#f1fbff';x.beginPath();x.arc(p[0],p[1],6,0,Math.PI*2);x.fill();x.font='11px sans-serif';x.fillText(`#${i+1}`,p[0]+8,p[1]-8)});
  x.font='11px sans-serif';model.wings.forEach((wing,i)=>{const a=pts[i],b=pts[i+1],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;x.fillStyle='#9db5c6';x.fillText(`${($('simDimensionMode').value==='inside'?effectiveWing(i,'inside'):wing).toFixed(1)} mm`,mx-20,my-10)});
  x.fillStyle='#67869a';x.fillRect(w*.18,h*.82,w*.64,18);x.fillStyle='#dce6ec';x.beginPath();x.moveTo(w/2-100,h*.78);x.lineTo(w/2,h*.68);x.lineTo(w/2+100,h*.78);x.closePath();x.fill();
}
function project3D(p,z,w,h){
  const cam=$('camera').value;let ay=-.66,ax=.42;
  if(cam==='front'){ay=0;ax=.04}else if(cam==='side'){ay=-1.35;ax=.12}else if(cam==='top'){ay=0;ax=1.15}
  const X=p[0]*Math.cos(ay)-z*Math.sin(ay),Z=p[0]*Math.sin(ay)+z*Math.cos(ay),Y=p[1]*Math.cos(ax)-Z*Math.sin(ax);
  return[X,Y];
}
function draw3D(x,w,h){
  // Floor and full press-brake silhouette
  const floor=x.createLinearGradient(0,h*.68,0,h);floor.addColorStop(0,'#132534');floor.addColorStop(1,'#050a0e');x.fillStyle=floor;x.fillRect(0,h*.68,w,h*.32);
  x.fillStyle='#162d3e';x.fillRect(w*.08,h*.15,w*.12,h*.62);x.fillRect(w*.80,h*.15,w*.12,h*.62);
  x.fillStyle='#24475e';x.fillRect(w*.08,h*.12,w*.84,h*.10);x.fillStyle='#aebdca';x.fillRect(w*.18,h*.25,w*.64,h*.08);
  x.fillStyle='#526d80';x.fillRect(w*.20,h*.64,w*.60,h*.06);x.fillStyle='#1e3e53';x.fillRect(w*.17,h*.70,w*.66,h*.08);
  // Back gauges
  x.strokeStyle='#5e8299';x.lineWidth=5;x.beginPath();x.moveTo(w*.25,h*.58);x.lineTo(w*.34,h*.48);x.moveTo(w*.75,h*.58);x.lineTo(w*.66,h*.48);x.stroke();
  // Punch and die
  x.fillStyle='#eef5f8';x.beginPath();x.moveTo(w/2-135,h*.34);x.lineTo(w/2+135,h*.34);x.lineTo(w/2,h*.50);x.closePath();x.fill();
  x.fillStyle='#6f899b';x.beginPath();x.moveTo(w/2-145,h*.64);x.lineTo(w/2,h*.50);x.lineTo(w/2+145,h*.64);x.closePath();x.fill();
  // Extruded sheet
  const raw=foldedPoints(),depth=$('quality').value==='mobile'?12:28,up=raw.map(p=>project3D(p,0,w,h)),down=raw.map(p=>project3D(p,depth,w,h)),all=up.concat(down),mapped=fit(all,w,h,95),u=mapped.slice(0,up.length),l=mapped.slice(up.length),colors=finishColors();
  x.shadowColor='#000';x.shadowBlur=16;
  for(let i=0;i<u.length-1;i++){
    const grad=x.createLinearGradient(u[i][0],u[i][1],l[i+1][0],l[i+1][1]);grad.addColorStop(0,colors[1]);grad.addColorStop(.5,colors[0]);grad.addColorStop(1,'#183945');x.fillStyle=grad;
    x.beginPath();x.moveTo(...u[i]);x.lineTo(...u[i+1]);x.lineTo(...l[i+1]);x.lineTo(...l[i]);x.closePath();x.fill();x.strokeStyle='#dff7ff';x.lineWidth=1;x.stroke();
  }x.shadowBlur=0;
  x.strokeStyle=colors[1];x.lineWidth=3;x.beginPath();u.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.stroke();
  u.slice(1,-1).forEach((p,i)=>{x.fillStyle=i===sim.step?'#ffc266':'#e9f8ff';x.beginPath();x.arc(p[0],p[1],4,0,Math.PI*2);x.fill()});
  // Highlights and machine labels
  x.fillStyle='#7fdcff';x.font='12px sans-serif';x.fillText('ARIETE',w*.12,h*.19);x.fillText('MESA',w*.12,h*.75);x.fillText('PUNZÓN',w*.52,h*.31);x.fillText('MATRIZ',w*.52,h*.67);
}
function renderSequence(){
  $('simStep').innerHTML=model.bends.map((b,i)=>`<option value="${i}">#${i+1} · ${b.angle}° · V${b.v}</option>`).join('');$('simStep').value=Math.min(sim.step,model.bends.length-1);
  $('sequence').innerHTML=model.bends.map((b,i)=>`<button class="${i===sim.step?'active':''}" data-step="${i}">#${i+1} ${b.angle}° V${b.v}</button>`).join('');
  $('sequence').querySelectorAll('button').forEach(b=>b.onclick=()=>{sim.step=+b.dataset.step;sim.progress=1;$('simProgress').value=100;renderSequence();drawSim()});
}
function animate(t){
  if(!sim.playing)return;if(!sim.last)sim.last=t;sim.progress+=(t-sim.last)/1500;sim.last=t;
  if(sim.progress>=1){sim.progress=1;if(sim.step<model.bends.length-1){sim.step++;sim.progress=0;renderSequence()}else sim.playing=false}
  $('simProgress').value=Math.round(sim.progress*100);drawSim();if(sim.playing)sim.frame=requestAnimationFrame(animate);
}
function calculateCurve(){
  const R=+$('curveRadius').value||1,A=Math.max(1,Math.min(180,+$('curveAngle').value||90)),t=+$('curveThickness').value||1,hits=Math.max(2,Math.min(80,Math.round(+$('curveHits').value||9))),v=+$('curveV').value||16;
  const arc=2*Math.PI*(R+t*.33)*(A/360),angle=A/hits,pitch=arc/hits;lastCurve={R,A,t,hits,v,arc,angle,pitch};
  $('curveOutHits').textContent=hits;$('curveOutAngle').textContent=angle.toFixed(2)+'°';$('curveOutPitch').textContent=pitch.toFixed(2)+' mm';$('curveOutArc').textContent=arc.toFixed(2)+' mm';
  $('curveAdvice').innerHTML=angle>12?'<span class="warn">Aumenta los golpes para conseguir una curva más suave.</span>':'<span class="good">Distribución adecuada como punto de partida.</span>';drawCurve();
}
function drawCurve(){
  if(!lastCurve)return;const d=lastCurve,c=$('curveCanvas'),px=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=w*px;c.height=h*px;const x=c.getContext('2d');x.setTransform(px,0,0,px,0,0);x.fillStyle='#02080e';x.fillRect(0,0,w,h);const cx=w/2,cy=h*.80,s=Math.min((w-100)/(2*(d.R+d.t)),(h-90)/(d.R+d.t));x.strokeStyle='#42dfbe';x.lineWidth=11;x.lineCap='round';x.beginPath();for(let i=0;i<=d.hits;i++){const a=(-90+i*d.angle)*Math.PI/180,xx=cx+Math.cos(a)*(d.R+d.t*.5)*s,yy=cy+Math.sin(a)*(d.R+d.t*.5)*s;i?x.lineTo(xx,yy):x.moveTo(xx,yy)}x.stroke();
}
const tools=[];VLIST.forEach(v=>[30,60,88,90].forEach(a=>tools.push({type:'Matriz',brand:'Mecos',family:'Bystronic',name:`Matriz Mecos V${v} ${a}°`,v,angle:a})));
tools.push(
 {type:'Punzón',brand:'Mecos',family:'Bystronic',name:'Punzón recto 30°',angle:30},
 {type:'Punzón',brand:'Mecos',family:'Bystronic',name:'Punzón recto 88°',angle:88},
 {type:'Punzón',brand:'Mecos',family:'Bystronic',name:'Punzón pata de cabra 90°',angle:90},
 {type:'Punzón',brand:'TRUMPF',family:'TRUMPF',name:'Punzón estándar 88°',angle:88},
 {type:'Matriz',brand:'TRUMPF',family:'TRUMPF',name:'Matriz V16 90°',v:16,angle:90},
 {type:'Punzón',brand:'AMADA',family:'AMADA',name:'Punzón pata de cabra 90°',angle:90},
 {type:'Matriz',brand:'AMADA',family:'AMADA',name:'Matriz V24 88°',v:24,angle:88},
 {type:'Punzón',brand:'Corplec',family:'Corplec',name:'Punzón recto 90°',angle:90},
 {type:'Matriz',brand:'Corplec',family:'Corplec',name:'Matriz V16 90°',v:16,angle:90},
 {type:'Punzón',brand:'WILA',family:'New Standard',name:'Punzón New Standard 90°',angle:90},
 {type:'Matriz',brand:'Wilson Tool',family:'European Precision',name:'Matriz V24 90°',v:24,angle:90}
);
function renderTools(){const q=$('toolSearch').value.toLowerCase(),type=$('toolType').value;$('toolGrid').innerHTML=tools.filter(t=>(type==='Todos'||t.type===type)&&`${t.name} ${t.brand} ${t.family} ${t.v||''}`.toLowerCase().includes(q)).map(t=>`<div class="tool"><b>${t.name}</b><small>${t.brand} · ${t.family}</small><small>${t.type}${t.v?' · V'+t.v:''} · ${t.angle}°</small></div>`).join('')||'<div class="notice">Sin coincidencias.</div>'}
function download(text,name,type){const b=new Blob([text],{type}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function exportCSV(){const r=calculateDevelopment(),lines=['pliegue,pestana,cota_efectiva,angulo,radio,V,longitud_plegado,tope_X,BA,BD'];r.rows.forEach(row=>lines.push([row.i+1,row.wing,row.effective,row.b.angle,row.b.radius,row.b.v,row.b.bendLength,row.b.gauge,row.c.ba.toFixed(4),row.c.bd.toFixed(4)].join(',')));download(lines.join('\n'),`${model.reference}_desarrollo.csv`,'text/csv')}
function saveLocal(){localStorage.setItem('plegarpro_v18_7',JSON.stringify(model));alert('Programa guardado en este dispositivo.')}
function restoreModel(data){if(!data||!Array.isArray(data.wings)||!Array.isArray(data.bends))throw new Error('Formato no válido');model={...model,...data};syncUI();renderProgram()}
function syncUI(){
  $('partRef').value=model.reference;$('material').value=model.material;$('thickness').value=model.thickness;$('kFactor').value=model.k;$('partWidth').value=model.width;
  $('devDimensionMode').value=model.dimensionMode;$('dimensionMode').value=model.dimensionMode;$('programThickness').value=model.thickness;$('simDimensionMode').value=model.dimensionMode;
}
$('addBend').onclick=addBend;$('addWing').onclick=()=>{model.wings.push(50);if(model.bends.length<model.wings.length-1)model.bends.push({angle:90,radius:2,direction:'Arriba',v:16,bendLength:model.width,gauge:50});renderProgram()};
$('loadExample').onclick=loadExample;$('saveProgram').onclick=saveLocal;$('dimensionMode').onchange=()=>{syncFromProgram();renderProgram()};$('programThickness').onchange=()=>{syncFromProgram();renderProgram()};
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===t.dataset.tab));if(t.dataset.tab==='result')calculateDevelopment()});
['partRef','material','thickness','kFactor','partWidth','devDimensionMode'].forEach(id=>$(id).onchange=()=>{syncInputs();renderProgram()});
$('calculateDev').onclick=calculateDevelopment;$('exportCSV').onclick=exportCSV;
$('baseV').innerHTML=VLIST.map(v=>`<option value="${v}" ${v===16?'selected':''}>V${v}</option>`).join('');
$('vChecks').innerHTML=VLIST.map(v=>`<label class="tool"><input type="checkbox" value="${v}" ${[12,16,24,32,40].includes(v)?'checked':''}> V${v}</label>`).join('');
$('runCompare').onclick=compareV;$('baseConfiguration').onchange=compareV;$('baseV').onchange=compareV;
$('mode2D').onclick=()=>{sim.mode='2d';$('mode2D').classList.add('active');$('mode3D').classList.remove('active');drawSim()};
$('mode3D').onclick=()=>{sim.mode='3d';$('mode3D').classList.add('active');$('mode2D').classList.remove('active');drawSim()};
$('simStep').onchange=()=>{sim.step=+$('simStep').value;sim.progress=1;renderSequence();drawSim()};
$('simProgress').oninput=()=>{sim.progress=+$('simProgress').value/100;drawSim()};
['simDimensionMode','camera','finish','quality'].forEach(id=>$(id).onchange=()=>{if(id==='simDimensionMode'){model.dimensionMode=$('simDimensionMode').value;syncUI();renderProgram()}resizeSim()});
$('play').onclick=()=>{sim.playing=!sim.playing;if(sim.playing){sim.progress=0;sim.last=0;$('simProgress').value=0;cancelAnimationFrame(sim.frame);sim.frame=requestAnimationFrame(animate)}};
$('previous').onclick=()=>{sim.step=Math.max(0,sim.step-1);sim.progress=1;renderSequence();drawSim()};$('next').onclick=()=>{sim.step=Math.min(model.bends.length-1,sim.step+1);sim.progress=1;renderSequence();drawSim()};
$('reset').onclick=()=>{sim.playing=false;cancelAnimationFrame(sim.frame);sim.step=0;sim.progress=0;$('simProgress').value=0;renderSequence();drawSim()};
$('curveV').innerHTML=VLIST.map(v=>`<option value="${v}" ${v===16?'selected':''}>V${v}</option>`).join('');$('calculateCurve').onclick=calculateCurve;
$('curveToProgram').onclick=()=>{if(!lastCurve)calculateCurve();const d=lastCurve;model.wings=Array.from({length:d.hits+1},()=>d.pitch);model.bends=Array.from({length:d.hits},(_,i)=>({angle:180-d.angle,radius:Math.max(.1,d.R/d.hits),direction:'Arriba',v:d.v,bendLength:model.width,gauge:Math.max(0,d.arc-(i+1)*d.pitch)}));renderProgram();showPage('program')};
$('toolSearch').oninput=renderTools;$('toolType').onchange=renderTools;
$('calculateTime').onclick=()=>{const total=+$('programMinutes').value+(+$('toolMinutes').value)+(+$('qty').value)*model.bends.length*(+$('secondsPerBend').value)/60;$('timeResult').innerHTML=`Programación: ${+$('programMinutes').value} min<br>Montaje: ${+$('toolMinutes').value} min<br>Fabricación: ${(total-(+$('programMinutes').value)-(+$('toolMinutes').value)).toFixed(1)} min<br><b>Total: ${total.toFixed(1)} min</b>`};
$('analyzeQuality').onclick=()=>{const d=+$('measuredDim').value-(+$('targetDim').value),a=+$('measuredAngle').value-(+$('targetAngle').value);$('qualityResult').innerHTML=`Diferencia dimensional: <b>${d>=0?'+':''}${d.toFixed(2)} mm</b><br>Diferencia angular: <b>${a>=0?'+':''}${a.toFixed(2)}°</b><br>${d<0?'Revisar radio, V, deducción y tope.':d>0?'Revisar desarrollo y corrección del tope.':'Cota correcta.'}`};
$('whatsapp').onclick=()=>window.open(`https://wa.me/${$('phone').value.replace(/\D/g,'')}?text=${encodeURIComponent($('message').value)}`,'_blank');$('sendEmail').onclick=()=>location.href=`mailto:${$('email').value}?subject=Trabajo de plegado&body=${encodeURIComponent($('message').value)}`;
$('files').onchange=()=>{$('fileList').innerHTML=[...$('files').files].map(f=>`<div class="tool" style="margin-top:7px">${f.name} · ${(f.size/1024).toFixed(1)} KB</div>`).join('')};
$('backup').onclick=()=>download(JSON.stringify(model,null,2),'PlegarPro_v18_7_backup.json','application/json');$('restore').onclick=()=>$('restoreFile').click();$('restoreFile').onchange=async()=>{try{restoreModel(JSON.parse(await $('restoreFile').files[0].text()))}catch(e){alert('No se pudo restaurar: '+e.message)}};
$('ask').onclick=()=>{const q=$('question').value.trim();if(!q)return;let a='Puedo analizar el programa actual.';if(/exterior|interior/i.test(q))a='Selecciona Interior o Exterior en Programar plegado o Desarrollo. Las cotas exteriores se convierten a cotas efectivas interiores antes de calcular el desarrollo.';else if(/perd|gan|matriz|v\d/i.test(q))a='El Comparador V calcula la diferencia acumulada para todos los pliegues y muestra pérdida o ganancia total y por pestaña.';else if(/3d|2d|simul/i.test(q))a='La simulación 2D y 3D utiliza el mismo programa y muestra la forma que adquiere la pieza en cada operación.';$('chat').innerHTML+=`<p><b>Tú:</b> ${q.replace(/[<>]/g,'')}</p><p><b>IA:</b> ${a}</p>`;$('question').value=''};
window.addEventListener('resize',()=>{resizeSim();calculateDevelopment();compareV();drawCurve()});
const saved=localStorage.getItem('plegarpro_v18_7');if(saved){try{model={...model,...JSON.parse(saved)}catch(e){}}
syncUI();renderProgram();renderTools();compareV();calculateCurve();setTimeout(resizeSim,60);
