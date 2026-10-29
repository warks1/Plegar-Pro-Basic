/* Cotas transcritas de pantallas Cybelec aportadas por el propietario, 29-10-2026.
 * No son una ficha de fabricante verificada independientemente.
 * mm; X perfil, Y hacia abajo, Z longitud de trabajo. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarMachineV85=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const id='trumpf-v85';
 const data=Object.freeze({id,manufacturer:'TRUMPF',model:'TrumaBend V85',
  source:'Pantallas Cybelec del propietario · 29/10/2026',
  width:2040,origin:0,holderWidth:2040,holderOrigin:0,toolWorkingDistance:30,
  ram:Object.freeze({L1:1340,L2:28,L3:2,L4:25.4,L5:20,L6:30,L7:125,L8:20,L9:39,L10:28}),
  table:Object.freeze({L1:820,L2:80,L3:25.25,L4:25.25,L5:50,L6:20,L7:20}),
  stop:Object.freeze({L1:70,L2:100,L3:18,L4:25,L5:12,L6:0,L6max:0,L6min:0,Ox:0,Oz:0}),
  support:Object.freeze({L1:70,L2:100,L3:8,L4:25,L5:12,L6:8,L6max:0,L6min:0,Ox:0,Oz:0}),
  preferredDistancePercent:80,encoderY1:50,encoderSpacing:3900,cylinderSpacing:3700,
  unresolved:['Distancia entre encoders 3900 y cilindros 3700 frente a ancho 2040: conservar sin escalar.',
   'Origen de montaje del útil y profundidad de inserción: confirmar distancia punta-trancha.',
   'L3/L5/L6/L8/L10 de trancha se conservan; detalle de rebajes de amarre pendiente de plano legible.',
   'Anchura Z de dedos y geometría de bastidor/garganta no aportadas.'],verified:false});
 const rect=(l,t,r,b)=>[{x:l,y:t},{x:r,y:t},{x:r,y:b},{x:l,y:b}];
 function selected(setup){return setup?.machineId===id;}
 function setup(input={}){return {...input,machineId:input.machineId||id};}
 function geometry(m){
  if(!selected(m.machineSetup))return null;
  const r=data.ram,t=data.table,cfg=m.machineSetup;
  // La distancia Tool-Working no identifica por sí sola el plano de inserción.
  // Montaje preliminar: altura nominal del punzón + 30 mm, editable por programa.
  const offset=Number.isFinite(cfg.ramBottomOffset)?cfg.ramBottomOffset:(m.punchHeight||m.punchTipY-Math.min(...m.toolProfiles.punch.outline.map(q=>q.y)))+data.toolWorkingDistance;
  const bottom=m.punchTipY-offset,shoulder=bottom-r.L4-r.L7,top=shoulder-r.L1;
  // Contorno exterior reconstruido. Rebajes de amarre aún no verificados.
  const ram=[{x:-r.L2,y:top},{x:r.L2,y:top},{x:r.L2,y:shoulder},
   {x:r.L9,y:shoulder},{x:r.L9,y:bottom-r.L4},{x:r.L6,y:bottom}, {x:-r.L2,y:bottom}];
  const dieBottom=Math.max(...m.toolProfiles.die.outline.map(q=>q.y));
  // Apoyo nominal: base de matriz en el fondo del canal L7 de la mesa.
  const tableTop=dieBottom-t.L7,step=tableTop+t.L2,base=step+t.L1;
  const table=[{x:-t.L3,y:tableTop},{x:-t.L6/2,y:tableTop},
   {x:-t.L6/2,y:dieBottom},{x:t.L6/2,y:dieBottom},{x:t.L6/2,y:tableTop},
   {x:t.L4,y:tableTop},{x:t.L4,y:step},{x:t.L5/2,y:step},
   {x:t.L5/2,y:base},{x:-t.L5/2,y:base},{x:-t.L5/2,y:step},{x:-t.L3,y:step}];
  const s=cfg.backgaugeMode==='support'?data.support:data.stop,x=m.stop.x,by=m.stop.y+s.L5;
  const finger=[{x:x-s.L6,y:by},{x,y:by-s.L4+s.L5},{x:x+s.L5,y:by-s.L4},
   {x:x+s.L1,y:by-s.L4},{x:x+s.L1,y:by-s.L3},{x:x+s.L2,y:by-s.L3},{x:x+s.L2,y:by}];
  // Vista de trabajo recortada; el cribado utiliza los contornos completos.
  const ramDisplay=ram.map(q=>({...q,y:Math.max(q.y,bottom-240)}));
  const tableDisplay=table.map(q=>({...q,y:Math.min(q.y,dieBottom+160)}));
  return {ram,table,finger,ramDisplay,tableDisplay,bottom,offset,
   z0:0,z1:data.width,mountingAssumed:!Number.isFinite(cfg.ramBottomOffset),
   punchHeightAssumed:!Number.isFinite(m.punchHeight),
   contourVerified:false,dimensionsSource:data.source};
 }
 function html(){
  const rows=obj=>Object.entries(obj).map(([k,v])=>'<tr><th>'+k+'</th><td>'+v+' mm</td></tr>').join('');
  return '<section class="machine-reference"><h2>TRUMPF TrumaBend V85 · Máquina principal</h2>'+
   '<p>Cotas copiadas de tus pantallas Cybelec. Ancho de trancha y portaútil: <b>2040 mm</b>; orígenes: 0 mm; Tool-Working distance: 30 mm.</p>'+
   '<div class="machine-reference-grid">'+[['Trancha',data.ram],['Mesa',data.table],['Tope Stop',data.stop],['Tope Support',data.support]].map(([name,obj])=>'<div><h3>'+name+'</h3><table><tbody>'+rows(obj)+'</tbody></table></div>').join('')+'</div>'+
   '<p>Distancia preferida: 80 %. Encoder Y1: 50 mm; distancia Y1–Y2: 3900 mm; entre cilindros: 3700 mm. Estos últimos datos no se convierten en volúmenes de colisión.</p>'+
   '<p>Sección reconstruida a partir del esquema. Montaje preliminar: punta-trancha = altura nominal de punzón + 30 mm. Puedes corregir esa distancia abajo. La mesa sitúa la base de matriz en el canal de 20 mm; confirmar montaje real.</p>'+
   '<details><summary>Cotas y geometrías pendientes de confirmar</summary><ul>'+data.unresolved.map(x=>'<li>'+x+'</li>').join('')+'</ul></details>'+
   '<label>Tipo de tope <select data-v85-stop><option value="stop">Stop</option><option value="support">Support</option></select></label><br><button type="button" data-machine-v85>Usar TRUMPF V85 en el programa activo</button><p>Interferencias de sección y muestreo del golpe; no incluye bastidor completo, movimientos de retirada/volteo ni validación industrial.</p></section>';
 }
 return {id,data,selected,setup,geometry,html,rect};
});
