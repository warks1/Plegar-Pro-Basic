/* v0.48: cribado AABB 2D de mesa/trancha con cotas INTRODUCIDAS.
 * Y hacia abajo; hombros de V en y=0, eje del pliegue en x=0.
 * Sólo trayectorias discretas en un plano; SIN transformación/recolocación 3D,
 * CINEMÁTICA VERIFICADA, CAD de fabricante ni autorización CNC.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarMachineClearance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 function config(profile){
  const setup=C.validateSetup(profile.setup);
  const die=C.DIES.find(d=>d.id===setup.die);
  return {...setup,dieHeight:setup.dieHeight??die.height??null};
 }
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function omegaPocket(profile){
  const a=profile.angles,s=profile.segments;
  if(a.length!==4||s.length!==5)return null;
  const sign=Math.sign(a[0]);
  if(!sign||Math.sign(a[3])!==sign||Math.sign(a[1])!==-sign||Math.sign(a[2])!==-sign)return null;
  if(a.some(x=>Math.abs(x)<60||Math.abs(x)>120))return null;
  return Math.min(s[1],s[3])*Math.min(Math.abs(a[1]),Math.abs(a[2]))/90;
 }
 function dieHeight(profile){return config(profile).dieHeight;}
 function envelope(profile,scene){
  if(!scene?.toolProfiles?.die?.outline)throw Error('Escena y perfiles de utillaje requeridos.');
  const cfg=config(profile),t=profile.thickness;
  const maxX=Math.max(...scene.toolProfiles.die.outline.map(p=>Math.abs(p.x)));
  const unknown=[];
  if(cfg.dieHeight===null)unknown.push('Altura H de matriz');
  if(cfg.tableLeft===null)unknown.push('Alcance de mesa X−');
  if(cfg.tableRight===null)unknown.push('Alcance de mesa X+');
  if(cfg.ramWidth===null)unknown.push('Ancho de trancha');
  if(cfg.ramBottomOffset===null)unknown.push('Distancia punta-pie de trancha');
  const rects=[];
  if(cfg.dieHeight!==null){
   // La mesa apoya a la matriz; no se coloca dentro del cuerpo de la V.
   const h=cfg.dieHeight;
   if(cfg.tableLeft!==null&&cfg.tableLeft>maxX)
    rects.push({component:'Mesa',side:'X−',minX:-cfg.tableLeft,maxX:-maxX,minY:h,maxY:h+100000});
   if(cfg.tableRight!==null&&cfg.tableRight>maxX)
    rects.push({component:'Mesa',side:'X+',minX:maxX,maxX:cfg.tableRight,minY:h,maxY:h+100000});
  }
  if(cfg.ramBottomOffset!==null&&cfg.ramWidth!==null){
   const half=cfg.ramWidth/2, bottom=scene.punchTipY-cfg.ramBottomOffset;
   rects.push({component:'Trancha',side:'superior',minX:-half,maxX:half,minY:bottom-100000,maxY:bottom});
  }
  return {config:cfg,rects,unknown,outerDie:maxX,thickness:t,
   dimensionalOnly:true,machineGeometryVerified:false};
 }
 function segments(scene){
  // Las alas pendientes TAMBIÉN son materia existente y deben evaluarse.
  const result=[];
  for(const side of ['left','right'])for(const [index,item] of (scene.assembly?.[side]?.items||[]).entries()){
   if(valid(item.from)&&valid(item.to))result.push({from:item.from,to:item.to,side,status:item.status,index});
  }
  const pts=scene.centerline||[];
  if(pts.length>2){
   result.push({from:pts[0],to:pts[1],side:'izquierda',status:'activo',index:-1});
   result.push({from:pts[pts.length-2],to:pts[pts.length-1],side:'derecha',status:'activo',index:-1});
  }
  return result;
 }
 function overlapsSegmentRect(a,b,radius,rect){
  // Recorte paramétrico Liang–Barsky, con rectángulo ampliado por t/2.
  // La ampliación cuadrada es conservadora alrededor de aristas oblicuas.
  const box={minX:rect.minX-radius,maxX:rect.maxX+radius,minY:rect.minY-radius,maxY:rect.maxY+radius};
  const dx=b.x-a.x,dy=b.y-a.y;
  let low=0,high=1;
  for(const [p,q] of [[-dx,a.x-box.minX],[dx,box.maxX-a.x],[-dy,a.y-box.minY],[dy,box.maxY-a.y]]){
   if(Math.abs(p)<1e-12){if(q<0)return false;}
   else{
    const u=q/p;
    if(p<0)low=Math.max(low,u);else high=Math.min(high,u);
    if(low>high)return false;
   }
  }
  return true;
 }
 function inspect(profile,scene){
  const V=typeof module==='object'&&module.exports?require('./machine-v85.js'):window.PlegarMachineV85;
  if(V.selected(scene.machineSetup)){
   const Section=typeof module==='object'&&module.exports?require('./machine-section2d.js'):window.PlegarMachineSection2D;
   const scan=Section.inspect(scene),vg=V.geometry(scene),hits=scan.hits.filter(h=>!h.expectedContact);
   const pocket=omegaPocket(profile),constraints=[];
   if(pocket!==null&&scene.dieHeight!==null&&pocket>scene.dieHeight)constraints.push('Perfil omega: profundidad nominal de paredes '+pocket.toFixed(1)+' mm > H matriz '+scene.dieHeight+' mm. Revisar orientación y posible choque con mesa/trancha.');
   const unknown=['Rebajes de amarre y bastidor completo','Posición Z/anchura de dedos'];
   if(vg.mountingAssumed)unknown.push('Montaje punta-trancha supuesto: altura de punzón + 30 mm');
   if(vg.punchHeightAssumed)unknown.push('Altura del punzón sin cota: se usa su silueta nominal');
   return {dieHeight:scene.dieHeight,tableGap:null,possibleTableContact:hits.some(h=>h.id==='mesa'),
    possibleRamContact:hits.some(h=>h.id==='estructura-superior'),hits,unknown,rects:[],details:scan.checked,
    alerts:[...constraints,...hits.map(h=>h.component+': posible interferencia de sección'),...unknown],
    physicallyValidated:false,cncApproved:false,geometryVerified:false,machineId:V.id};
  }
  const env=envelope(profile,scene),pieces=segments(scene),alerts=[],hits=[];
  let possibleTableContact=false,possibleRamContact=false,tableGap=null;
  for(const rect of env.rects){
   for(const item of pieces){
    if(overlapsSegmentRect(item.from,item.to,env.thickness/2,rect)){
     hits.push({component:rect.component,side:rect.side,flange:item.side,status:item.status,segment:item.index});
     if(rect.component==='Mesa')possibleTableContact=true;else possibleRamContact=true;
    }
    if(rect.component==='Mesa'){
     for(const p of [item.from,item.to]){
      if(p.x>=rect.minX&&p.x<=rect.maxX){
       const gap=env.config.dieHeight-(p.y+env.thickness/2);
       tableGap=tableGap===null?gap:Math.min(tableGap,gap);
      }
     }
    }
   }
  }
  if(possibleTableContact)alerts.push('MESA: posible invasión de la zona nominal de mesa por ala ya conformada, pendiente o activa.');
  if(possibleRamContact)alerts.push('TRANCHA: posible interferencia de chapa con la envolvente rectangular superior introducida.');
  const pocket=omegaPocket(profile);
  if(env.config.dieHeight!==null&&pocket!==null&&pocket>env.config.dieHeight)
   alerts.push('Perfil omega: profundidad nominal de paredes '+pocket.toFixed(1)+' mm > H matriz '+env.config.dieHeight+' mm. Verificar cierre, orientación y posible choque con mesa/trancha antes de plegar.');
  if(env.config.dieHeight===null)alerts.push('Altura de matriz desconocida: no se puede comprobar la proximidad a la mesa.');
  if(env.config.dieHeight!==null&&env.config.dieHeight<=scene.dieDepth+2)
   alerts.push('Altura de matriz introducida incompatible o demasiado justa para el perfil geométrico de la V.');
  for(const problem of scene.interferences?.problems||[]){
   if(['PRIOR_FLANGE_NEAR_TOOL','BACKGAUGE_OVERLAP'].includes(problem.code))
    alerts.push(problem.component+': '+problem.message);
  }
  if(env.unknown.length)alerts.push('Envolvente de máquina INCOMPLETA: faltan '+env.unknown.join(', ')+'.');
  alerts.push('Sin CAD de fabricante, inversión/recolocación, deformación elástica, sólidos de amarre o trayectoria continua verificada.');
  return {dieHeight:env.config.dieHeight,tableGap,possibleTableContact,possibleRamContact,
   hits:hits.slice(0,24),unknown:env.unknown,rects:env.rects,alerts:[...new Set(alerts)],details:[],
   physicallyValidated:false,cncApproved:false,geometryVerified:false};
 }
 function sweep(profile,orderIndex,{intervals=4}={}){
  if(!Number.isInteger(intervals)||intervals<2||intervals>20)throw Error('Muestreo de máquina fuera de rango.');
  const K=typeof module==='object'&&module.exports?require('./fold-kinematics.js'):window.PlegarFoldKinematics;
  const events=[],allAlerts=[],unknown=new Set();
  let table=false,ram=false,minimumGap=null;
  for(let i=0;i<=intervals;i++){
   const t=i/intervals,scene=K.frame(profile,orderIndex,t).scene,scan=inspect(profile,scene);
   table ||= scan.possibleTableContact;
   ram ||= scan.possibleRamContact;
   if(scan.tableGap!==null)minimumGap=minimumGap===null?scan.tableGap:Math.min(minimumGap,scan.tableGap);
   for(const item of scan.hits)if(events.length<40)events.push({...item,percent:Math.round(t*100)});
   scan.unknown.forEach(x=>unknown.add(x));
   scan.alerts.forEach(x=>{if(!allAlerts.includes(x))allAlerts.push(x)});
  }
  return {frames:intervals+1,possibleTableContact:table,possibleRamContact:ram,
   tableGap:minimumGap,events,unknown:[...unknown],alerts:allAlerts,
   physicallyValidated:false,cncApproved:false,continuousSweep:false,
   note:'Muestreo geométrico 2D NOMINAL. Entre muestras, reorientaciones y maniobras fuera de modelo. NO CNC.'};
 }
 return {config,dieHeight,omegaPocket,envelope,segments,overlapsSegmentRect,inspect,sweep};
});