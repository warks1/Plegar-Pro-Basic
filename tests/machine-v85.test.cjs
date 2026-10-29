'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../machine-v85'),F=require('../fold-kinematics'),S=require('../machine-section2d'),T=require('../tooling3d'),C=require('../machine-clearance'),B=require('../bendcalc');
const profile={name:'V85 Omega',material:'Acero S235JR',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[1,2,4,3],setup:{machineId:V.id,punch:'p30-r1-h100',die:'v16-30',radius:2}};
const frame=(step,t)=>F.frame(profile,step,t);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('Transcripción íntegra de las pantallas, sin mezclar ancho con encoders',()=>{
 assert.deepEqual(Object.values(V.data.ram),[1340,28,2,25.4,20,30,125,20,39,28]);
 assert.deepEqual(Object.values(V.data.table),[820,80,25.25,25.25,50,20,20]);
 assert.deepEqual(Object.values(V.data.stop),[70,100,18,25,12,0,0,0,0,0]);
 assert.deepEqual(Object.values(V.data.support),[70,100,8,25,12,8,0,0,0,0]);
 assert.equal(V.data.width,2040);assert.equal(V.data.holderWidth,2040);assert.equal(V.data.encoderSpacing,3900);assert.equal(V.data.cylinderSpacing,3700);
 assert.equal(V.data.verified,false);
});
test('La selección y modo Stop/Support sobreviven a JSON y validación de parámetros',()=>{
 for(const backgaugeMode of ['stop','support']){
  const cfg=B.validateSetup({...profile.setup,backgaugeMode});
  assert.deepEqual(B.validateSetup(JSON.parse(JSON.stringify(cfg))),cfg);
  assert.equal(cfg.machineId,V.id);
 }
 assert.throws(()=>B.validateSetup({machineId:'inventada'}));
 assert.throws(()=>B.validateSetup({backgaugeMode:'inventado'}));
});
test('Trancha sigue a la punta; mesa y dedo fijos durante el golpe',()=>{
 const a=frame(0,0).scene,b=frame(0,.6).scene,ga=V.geometry(a),gb=V.geometry(b);
 assert.deepEqual(ga.table,gb.table);assert.deepEqual(ga.finger,gb.finger);
 ga.ram.forEach((q,i)=>{close(gb.ram[i].x,q.x);close(gb.ram[i].y-q.y,b.punchTipY-a.punchTipY);});
 close(ga.offset,130);assert.equal(ga.mountingAssumed,true);
 const explicit=F.frame({...profile,setup:{...profile.setup,ramBottomOffset:155}},0,.5).scene;
 close(V.geometry(explicit).offset,155);assert.equal(V.geometry(explicit).mountingAssumed,false);
});
test('Un punzón sin altura no se convierte por error en una altura cero',()=>{
 const s=F.frame({...profile,setup:{...profile.setup,punch:'p88-r1'}},0,.5).scene,g=V.geometry(s);
 assert.ok(g.offset>50);assert.equal(g.punchHeightAssumed,true);
 assert.ok(C.inspect(profile,s).unknown.some(x=>x.includes('Altura del punzón')));
});
test('Los contornos físicos 2D coinciden con los prismas 3D y mantienen 2040 mm',()=>{
 const s=frame(2,.6).scene,g=V.geometry(s),section=S.build(s),prisms=T.prisms({width:100,thickness:2},s);
 for(const [id,group] of [['mesa','table'],['estructura-superior','ram']]){
  const part=section.parts.find(x=>x.id===id),solid=prisms.find(x=>x.group===group);
  assert.deepEqual(part.collisionPoints,solid.outline);assert.equal(solid.z1-solid.z0,2040);
  assert.notDeepEqual(solid.renderOutline,solid.outline);
 }
 close(Math.max(...g.table.map(q=>q.y))-Math.min(...g.table.map(q=>q.y)),900);
});
test('El cribado utiliza la parte lejana que la cámara recorta',()=>{
 const s=frame(0,0).scene,g=V.geometry(s);
 s.assembly={left:{items:[{from:{x:0,y:g.bottom-1000},to:{x:10,y:g.bottom-990},status:'pendiente'}]},right:{items:[]}};
 const scan=S.inspect(s);
 assert.ok(scan.hits.some(x=>x.id==='estructura-superior'&&!x.expectedContact));
 assert.equal(C.inspect(profile,s).possibleRamContact,true);
});
test('Contacto de punta previsto se distingue de choque de un ala remota',()=>{
 const s=frame(0,.55).scene;
 const local=S.inspect(s).checked.find(x=>x.id==='punzon');
 assert.equal(local.expectedContact,true);assert.equal(local.possibleOverlap,true);
 const y=s.punchTipY-50;
 // Cruzar el cuerpo de la pata de cabra: el hueco de su garganta NO es metal.
 const xs=s.toolProfiles.punch.outline.map(p=>p.x);
 s.assembly.left.items.push({from:{x:Math.min(...xs)-10,y},to:{x:Math.max(...xs)+10,y},status:'realizado'});
 const remote=S.inspect(s).checked.find(x=>x.id==='punzon');
 assert.equal(remote.expectedContact,false);assert.equal(remote.remoteOverlap,true);
});
test('Separación nominal decrece hasta contacto y crece en retirada',()=>{
 const a=frame(0,0),b=frame(0,.5),c=frame(0,1);
 assert.ok(a.scene.punchContact.gapMm>0);close(b.scene.punchContact.gapMm,0);
 assert.ok(c.scene.punchContact.gapMm>0);assert.equal(b.scene.punchContact.verified,false);
});
test('Orden Omega, giros negativos y geometría finita durante todo el ciclo',()=>{
 for(let step=0;step<4;step++)for(const t of [0,.12,.22,.5,.78,1]){
  const s=frame(step,t).scene,g=V.geometry(s);
  assert.equal(s.bend,[1,2,4,3][step]);assert.equal(s.turn,profile.angles[s.bend-1]);
  assert.ok([...g.ram,...g.table,...g.finger].every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
 }
 const scan=S.sweep(profile,2);assert.equal(scan.continuousSweep,false);assert.equal(scan.cncApproved,false);
});
test('Stop y Support tienen alturas posteriores diferentes y extensión L6 preservada',()=>{
 const a=V.geometry(frame(0,0).scene);
 const b=V.geometry(F.frame({...profile,setup:{...profile.setup,backgaugeMode:'support'}},0,0).scene);
 assert.notDeepEqual(a.finger,b.finger);close(b.finger[0].x,a.finger[0].x-8);
});
