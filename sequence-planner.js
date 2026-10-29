/* v0.47: explorador acotado de secuencias con cribado geométrico CONSERVADOR.
 * No declarar secuencias viables ni aprobar fabricación sin CAD de máquina/útiles.
 */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
  typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc,
  typeof module==='object'&&module.exports?require('./forming2d.js'):root.PlegarFormingGeometry,
  typeof module==='object'&&module.exports?require('./machine-clearance.js'):root.PlegarMachineClearance,
  typeof module==='object'&&module.exports?require('./machine-section2d.js'):root.PlegarMachineSection2D);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarSequencePlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,C,F,Clearance,Section){
 'use strict';
 function hasOmega(profile){return Clearance.omegaPocket(profile)!==null;}
 function step(profile,chosen,id){
  const n=profile.angles.length,sequence=[...chosen,id,...Array.from({length:n},(_,i)=>i+1).filter(v=>v!==id&&!chosen.includes(v))];
  const candidate={...profile,sequence},idx=chosen.length;
  const scene=F.scene(candidate,idx,1),scan=Clearance.sweep(candidate,idx,{intervals:n<=6?4:2});
  const die=C.DIES.find(d=>d.id===candidate.setup.die),angle=Math.abs(candidate.angles[id-1]),interior=180-angle;
  const left=candidate.segments[id-1],right=candidate.segments[id],v=die.opening;
  const issues=[],riskCodes=[];
  const risk=(code,message)=>{if(!riskCodes.includes(code))riskCodes.push(code);issues.push(message);};
  let cost=1;
  if(interior<die.angle||interior<C.PUNCHES.find(p=>p.id===candidate.setup.punch).angle){
   cost+=120;risk('TOOL_ANGLE','Ángulo interior menor que el ángulo de herramienta.');
  }
  if(Math.min(left,right)<.7*v){cost+=45;risk('SHORT_FLANGE','Ala bajo 0,7×V; apoyo por revisar.');}
  if(scan.possibleTableContact){cost+=200;risk('TABLE','Posible choque con MESA durante ciclo nominal.');}
  if(scan.possibleRamContact){cost+=200;risk('RAM','Posible choque con TRANCHA durante ciclo nominal.');}
  if(scene.interferences?.problems?.some(p=>p.code==='PRIOR_FLANGE_NEAR_TOOL')){cost+=60;risk('PRIOR_FLANGE','Posible choque con punzón, matriz o ala plegada.');}
  if(scene.interferences?.problems?.some(p=>p.code==='BACKGAUGE_OVERLAP')){cost+=120;risk('GAUGE','Posible solape con el tope.');}
  // No confundir la ausencia de una geometría aportada con holgura verificada.
  if(scan.unknown.length)issues.push('Envolvente de máquina incompleta: '+scan.unknown.join(', ')+'.');
  // Un perfil con retorno se cierra prematuramente si ejecuta primero los bordes.
  // Se usa para priorizar pruebas, nunca para declarar una secuencia apta.
  if(hasOmega(profile)){
   const n2=n-1;
   if((id===1||id===n)&&!(chosen.includes(2)&&chosen.includes(n2)))cost+=35;
   if((id===2||id===n2)&&chosen.length===0)cost-=.15;
  }
  // Prefiere estados que todavía permiten acceder a las líneas centrales.
  if(chosen.length===0&&n>2)cost+=Math.abs(id-(n+1)/2)*.2;
  return {bend:id,score:cost,issues,riskCodes,possibleCollision:riskCodes.length>0,scan};
 }
 function evaluate(profile,sequence){
  let score=0;const rows=[],issues=[],riskCodes=[],unknown=new Set(),projected=new Set();
  for(let i=0;i<sequence.length;i++){
   const r=step(profile,sequence.slice(0,i),sequence[i]);
   score+=r.score;
   // Analizar el MISMO paso que se visualiza en el reproductor 2D.
   // El cálculo proyectado no modifica la puntuación del buscador porque
   // las formas de amarres/topes aún no son CAD dimensional verificado.
   const taken=sequence.slice(0,i+1),remaining=profile.angles.map((_,idx)=>idx+1).filter(v=>!taken.includes(v));
   const sample={...profile,sequence:[...taken,...remaining]},scene=F.scene(sample,i,1);
   const audit=Section.inspect(scene);
   const componentProximities=audit.hits.filter(hit=>!hit.expectedContact).map(hit=>hit.component);
   const toolContacts=audit.hits.filter(hit=>hit.expectedContact).map(hit=>hit.component);
   componentProximities.forEach(x=>projected.add(x));
   rows.push({position:i+1,bend:r.bend,score:r.score,issues:r.issues,riskCodes:r.riskCodes,
    possibleCollision:r.possibleCollision||componentProximities.length>0,
    componentProximities,toolContacts,projectedGeometryVerified:false,
    tableGap:r.scan.tableGap,possibleRamContact:r.scan.possibleRamContact,
    possibleTableContact:r.scan.possibleTableContact,sampledFrames:r.scan.frames});
   for(const code of r.riskCodes)if(!riskCodes.includes(code))riskCodes.push(code);
   for(const dimension of r.scan.unknown)unknown.add(dimension);
   for(const msg of [...r.issues,...r.scan.alerts])if(!issues.includes(msg))issues.push(msg);
   if(componentProximities.length)issues.push('Paso '+(i+1)+' B'+r.bend+': posible cruce en sección 2D con '+componentProximities.join(', ')+'. Dibujo sin cotas CAD verificadas.');
  }
  const missingDimensions=[...unknown];
  return {sequence:[...sequence],score:Math.round(score*100)/100,rows,issues,
   projectedComponents:[...projected],projectedGeometryVerified:false,
   riskCodes,riskCount:rows.reduce((n,r)=>n+r.riskCodes.length,0),missingDimensions,
   status:riskCodes.length?'POSIBLES INTERFERENCIAS · REVISAR':
    missingDimensions.length?'MÁQUINA INCOMPLETA · NO APLICABLE':'CRIBADO NOMINAL · NO VERIFICADO',
   physicallyValidated:false,cncApproved:false};
 }
 function suggest(source,{beamWidth=18,limit=4}={}){
  const profile={...G.validate(source),setup:C.validateSetup(source.setup)},n=profile.angles.length;
  if(!Number.isInteger(beamWidth)||beamWidth<1||beamWidth>60||!Number.isInteger(limit)||limit<1||limit>10)throw Error('Límites de búsqueda inválidos.');
  const current=evaluate(profile,profile.sequence);
  // Orden de estudio solicitado: se evalúa, no se certifica su seguridad.
  const preferredOmega=hasOmega(profile)&&n===4?evaluate(profile,[1,2,4,3]):null;
  if(n>12)return {current,best:null,recommended:null,preferredOmega,alternatives:[],searched:0,note:'Más de 12 pliegues: cálculo acotado no ejecutado. Revisar secuencia manualmente. NO CNC.'};
  let beam=[{sequence:[],score:0}],searched=0;
  for(let depth=0;depth<n;depth++){
   const next=[];
   for(const item of beam)for(let id=1;id<=n;id++){
    if(item.sequence.includes(id))continue;
    const partial=step(profile,item.sequence,id);
    next.push({sequence:[...item.sequence,id],score:item.score+partial.score,
      riskCount:(item.riskCount||0)+partial.riskCodes.length});
    searched++;
   }
   // Minimizar primero alertas de interferencia; sólo después, preferencias geométricas.
   next.sort((a,b)=>a.riskCount-b.riskCount||a.score-b.score||a.sequence.join(',').localeCompare(b.sequence.join(',')));
   beam=next.slice(0,beamWidth);
  }
  const alternatives=beam.slice(0,limit).map(item=>evaluate(profile,item.sequence));
  // Un dato desconocido NO equivale a una holgura válida; no permitir
  // secuenciación automática cuando la mesa/trancha no están caracterizadas.
  // La detección de proximidad en secciones nominales puede ser conservadora,
  // pero nunca se debe presentar como ausencia de choque al aplicar un orden.
  const recommended=alternatives.find(candidate=>candidate.riskCount===0&&
   candidate.missingDimensions.length===0&&candidate.projectedComponents.length===0)||null;
  return {current,best:alternatives[0]||null,preferredOmega,recommended,alternatives,searched,
   note:'Órdenes candidatos por cribado discreto y zonas modeladas de la sección 2D. El bloqueo automático también contempla posibles cruces proyectados con amarres, mesa y topes, sin interpretarlos como colisiones físicas confirmadas. Faltan CAD de útiles y máquina, volteos, topes calibrados y barridos continuos. NINGÚN orden está validado para CNC.'};
 }
 return {step,evaluate,suggest};
});