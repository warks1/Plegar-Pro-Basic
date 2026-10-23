/* Plegar Pro Plus v0.43 · hoja de proceso nominal para cada paso.
 * No es programación CNC ni un control de colisiones certificado.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
  typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc,
  typeof module==='object'&&module.exports?require('./engineering-checks.js'):root.PlegarEngineeringChecks);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarWorkplan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,C,Checks){
 'use strict';
 function build(profile,{width=100}={}){
  const p=G.validate(profile),setup=C.validateSetup(profile.setup),calc=C.estimate(p,setup);
  const review=Checks.analyse({...p,setup},{width});
  const rows=p.sequence.map((bend,i)=>{
   const index=bend-1,angle=p.angles[index],a=p.segments[index],b=p.segments[index+1];
   const minFlange=.7*calc.die.opening,near=(a<minFlange||b<minFlange);
   const inside=180-Math.abs(angle);
   const issues=[];
   if(near)issues.push('Tramo contiguo bajo regla orientativa de 0,7×V');
   if(inside<calc.punch.angle||inside<calc.die.angle)issues.push('Ángulo interior inferior al ángulo nominal de herramienta');
   const row=calc.rows[index];
   if(row&&row.setback*2>a+b)issues.push('Retranqueos del pliegue superan la suma de tramos contiguos');
   return {step:i+1,bend,angle,inside,preceding:a,following:b,
    die:setup.die,punch:setup.punch,opening:calc.die.opening,
    minFlange,allowance:row.allowance,deduction:row.deduction,issues};
  });
  return {name:p.name,material:p.material,thickness:p.thickness,width,
   setup,rows,nominalLength:calc.nominal,flat:calc.flat,estimatedForceKN:review.forceKN,
   issues:[...calc.problems,...review.warnings],intersections:review.intersections,
   warning:'Ficha geométrica orientativa. NO CNC / NO APTO PARA FABRICACIÓN. Sin máquina calibrada, radios, colisiones o utillaje real validado.'};
 }
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function html(plan){
  return '<div class="ed-workplan-heading"><strong>HOJA DE PLEGADO · ORDEN SELECCIONADO</strong><span>Se actualiza al tocar los pliegues o cambiar punzón, matriz, material o espesor.</span></div>'+
   '<div class="ed-workplan-scroll"><table><thead><tr><th>Paso</th><th>Pliegue</th><th>Giro</th><th>Interior</th><th>Tramo antes</th><th>Tramo después</th><th>Punzón</th><th>Matriz</th><th>Revisión</th></tr></thead><tbody>'+
   plan.rows.map(r=>'<tr><td>'+r.step+'</td><td>B'+r.bend+'</td><td>'+r.angle+'°</td><td>'+r.inside+'°</td><td>'+r.preceding+' mm</td><td>'+r.following+' mm</td><td>'+esc(r.punch)+'</td><td>'+esc(r.die)+'</td><td>'+(r.issues.length?esc(r.issues.join(' · ')):'Sin alertas locales')+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p class="ed-workplan-note">Desarrollo nominal: '+(plan.flat===null?'no calculable':plan.flat.toFixed(2)+' mm')+
   ' · Fuerza aproximada: '+(plan.estimatedForceKN===null?'no calculable':plan.estimatedForceKN.toFixed(1)+' kN')+
   '. <b>NO CNC / NO ACEPTACIÓN DE FABRICACIÓN.</b></p>'+
   '<button id="ed-export-workplan" type="button">↓ Exportar hoja de secuencia CSV</button>';
 }
 function field(v){let x=String(v??'');if(/^[\s]*[=+@-]/.test(x)&&typeof v==='string')x="'"+x;return '"'+x.replace(/"/g,'""')+'"';}
 function csv(plan){
  const body=[
   ['PLEGAR PRO PLUS','HOJA DE PLEGADO NOMINAL'],
   ['Pieza',plan.name],['Material',plan.material],['Espesor (mm)',plan.thickness],
   ['Ancho introducido (mm)',plan.width],['Punzón nominal',plan.setup.punch],['Matriz nominal',plan.setup.die],
   ['Desarrollo nominal (mm)',plan.flat===null?'NO CALCULABLE':plan.flat],
   ['Fuerza aproximada (kN)',plan.estimatedForceKN===null?'NO CALCULABLE':plan.estimatedForceKN],
   ['AVISO',plan.warning],
   ['Paso','Pliegue','Giro (°)','Interior (°)','Tramo anterior (mm)','Tramo posterior (mm)','Apertura V (mm)','Punzón','Matriz','Incidencias'],
   ...plan.rows.map(r=>[r.step,r.bend,r.angle,r.inside,r.preceding,r.following,r.opening,r.punch,r.die,r.issues.join(' · ')])
  ];
  return '\uFEFF'+body.map(line=>line.map(field).join(';')).join('\r\n')+'\r\n';
 }
 return {build,html,csv};
});