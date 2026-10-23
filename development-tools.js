/* Plegar Pro Plus v0.45 · Herramientas de cálculo y comparador de matrices V
 * Se comparan equipos GENÉRICOS con el mismo Ri y K definido en el programa.
 * V/e influye en fuerza y geometría admisible; sin Ri real no se infiere BD diferente.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc,
 typeof module==='object'&&module.exports?require('./engineering-checks.js'):root.PlegarEngineeringChecks,
 typeof module==='object'&&module.exports?require('./flat-pattern-view.js'):root.PlegarFlatPatternView);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarDevelopmentTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C,E,Flat){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>x===null||!Number.isFinite(x)?'—':Number(x).toFixed(2);
 function compareDies(profile,{width=100}={}){
  const setup=C.validateSetup(profile.setup),t=profile.thickness;
  if(!Number.isFinite(width)||width<1||width>5000)throw Error('Introduce un ancho de plegado válido.');
  return C.DIES.map(die=>{
   const s={...setup,die:die.id},calc=C.estimate(profile,s),check=E.analyse({...profile,setup:s},{width});
   const ratio=die.opening/t,badRatio=ratio<6||ratio>10;
   const minNominal=.7*die.opening,shortFlange=profile.segments.some(v=>v<minNominal);
   const toolAngle=profile.angles.some(a=>Math.abs(a)>0 && 180-Math.abs(a)<die.angle);
   return {die:die.id,opening:die.opening,angle:die.angle,ratio,shortFlange,toolAngle,badRatio,
     flat:calc.flat,forceKN:check.forceKN,
     status:calc.flat===null?'NO DESARROLLABLE':badRatio||shortFlange||toolAngle?'REVISAR':'ORIENTATIVO',
     label:die.name,
     warnings:[badRatio?'V/e fuera de 6–10':'',shortFlange?'Ala menor que 0,7V':'',toolAngle?'Ángulo interior menor que matriz':''].filter(Boolean)};
  }).sort((a,b)=>Math.abs(a.ratio-8)-Math.abs(b.ratio-8)||Number(a.badRatio)-Number(b.badRatio)||a.opening-b.opening||a.angle-b.angle);
 }
 function report(profile,{width=100}={}){
  const setup=C.validateSetup(profile.setup),calc=C.estimate(profile,setup);
  return {setup,calc,checks:E.analyse({...profile,setup},{width}),sensitivity:C.sensitivity(profile,setup),width,profile};
 }
 function html(mode,profile,{width=100}={}){
  const r=report(profile,{width}),c=r.calc,dim=c.measurementReference;
  if(mode==='comparison'){
   const rows=compareDies(profile,{width});
   return '<section class="development-tools" aria-label="Comparador de aperturas V"><h2>COMPARADOR DE MATRICES V · perfil actual</h2>'+
   '<p>Espesor '+fmt(profile.thickness)+' mm · V recomendada SOLO como punto de partida ≈'+fmt(8*profile.thickness)+' mm. Cotas '+esc(dim)+'.</p>'+
   '<p><strong>Importante:</strong> se conserva el MISMO radio Ri='+fmt(r.setup.radius)+' mm y factor K='+fmt(r.setup.kFactor)+' en todas las filas. Cambiar V NO cambia por sí solo el desarrollo sin radio de pliegue determinado para esa matriz.</p>'+
   '<div class="development-table-scroll"><table><thead><tr><th>Matriz</th><th>V (mm)</th><th>V/e</th><th>Ala mín. orientativa</th><th>Fuerza aproximada (kN)</th><th>Desarrollo (mm)</th><th>Revisión</th><th>Aplicar</th></tr></thead><tbody>'+
   rows.map(v=>'<tr data-dev-status="'+esc(v.status)+'"><td>'+esc(v.label)+'</td><td>'+fmt(v.opening)+'</td><td>'+fmt(v.ratio)+'</td><td>'+fmt(.7*v.opening)+'</td><td>'+fmt(v.forceKN)+'</td><td>'+fmt(v.flat)+'</td><td>'+esc(v.status)+(v.warnings.length?' · '+esc(v.warnings.join(', ')):'')+'</td><td><button type="button" data-dev-die="'+esc(v.die)+'">Usar matriz</button></td></tr>').join('')+'</tbody></table></div>'+
   '<p>Los datos de utillaje son modelos internos SIN VERIFICAR. La estimación de fuerza asume plegado al aire y una resistencia nominal, sin datos de máquina ni seguridad certificados.</p>'+
   '<button type="button" data-dev-open-editor="1">Abrir Programación 2D y confirmar cotas</button></section>';
  }
  return '<section class="development-tools" aria-label="Calculadora de desarrollo de chapa"><h2>DESARROLLO · PROGRAMA ACTUAL</h2>'+
   '<p>Pieza '+esc(profile.name)+' · material '+esc(profile.material)+' · espesor '+fmt(profile.thickness)+' mm · '+esc(dim)+'.</p>'+
   '<div class="development-kpi"><div><small>Desarrollo</small><strong>'+fmt(c.flat)+' mm</strong></div><div><small>BA total</small><strong>'+fmt(c.allowance)+' mm</strong></div><div><small>BD total</small><strong>'+fmt(c.deduction)+' mm</strong></div><div><small>Fuerza nominal</small><strong>'+fmt(r.checks.forceKN)+' kN</strong></div></div>'+
   Flat.html(c)+
   '<p>Factor K '+fmt(r.setup.kFactor)+' · radio interior supuesto '+fmt(r.setup.radius)+' mm · V/e '+fmt(c.vRatio)+'. La banda K=0,30 a 0,50 implica una diferencia de '+fmt(r.sensitivity.spread)+' mm en esta geometría: NO es una tolerancia de fabricación.</p>'+
   '<div class="development-table-scroll"><table><thead><tr><th>Bend</th><th>Giro</th><th>BA</th><th>Deducción</th><th>Centro en desarrollo</th></tr></thead><tbody>'+
   c.rows.map(v=>'<tr><td>B'+v.bend+'</td><td>'+fmt(v.signedAngle)+'°</td><td>'+fmt(v.allowance)+'</td><td>'+fmt(v.deduction)+'</td><td>'+fmt(c.flat===null?null:v.flatCenter)+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p>'+esc(c.problems.concat(c.warnings).join(' · '))+'</p>'+
   '<button type="button" data-dev-open-editor="1">Editar cotas y calibrar factor K en Programación 2D</button></section>';
 }
 return {compareDies,report,html};
});