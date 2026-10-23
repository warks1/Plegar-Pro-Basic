const {test}=require('node:test');
const assert=require('node:assert/strict');
const B=require('../bendcalc.js');
const F=require('../forming2d.js');
const M=require('../machine-clearance.js');
const P=require('../sequence-planner.js');
const S=require('../sample-library.js');
const omega=S.get('perfil-omega').profile;
test('Altura de matriz es opcional y no se presupone en útiles sin cota',()=>{
 assert.equal(B.validateSetup(omega.setup).dieHeight,null);
 assert.equal(M.dieHeight(omega),null);
 assert.throws(()=>B.validateSetup({...omega.setup,dieHeight:-20}),/Altura de matriz/);
 assert.throws(()=>B.validateSetup({...omega.setup,dieHeight:999}),/Altura de matriz/);
 assert.equal(B.validateSetup({...omega.setup,dieHeight:60}).dieHeight,60);
});
test('Omega 85 mm / matriz H60: alerta explícita sin certificar choque real',()=>{
 const piece={...omega,setup:{...omega.setup,dieHeight:60}};
 const scan=M.inspect(piece,F.scene(piece,2,1));
 assert.ok(scan.alerts.some(a=>a.includes('omega')&&a.includes('85.0 mm')&&a.includes('H matriz 60 mm')));
 assert.equal(scan.physicallyValidated,false);
 assert.equal(scan.cncApproved,false);
 assert.equal(scan.dieHeight,60);
});
test('Sin altura: la mesa no puede considerarse verificada',()=>{
 const scan=M.inspect(omega,F.scene(omega,0,1));
 assert.equal(scan.tableGap,null);
 assert.ok(scan.alerts.some(a=>a.includes('desconocida')));
});
test('Planificador: no pierde pliegues, respeta orden actual y no afirma que sea viable',()=>{
 const sample={...omega,setup:{...omega.setup,dieHeight:60}};
 const result=P.suggest(sample);
 assert.deepEqual(result.current.sequence,sample.sequence);
 assert.ok(result.best);
 assert.equal(result.best.sequence.length,4);
 assert.deepEqual([...result.best.sequence].sort((a,b)=>a-b),[1,2,3,4]);
 assert.ok(result.best.riskCount<=result.current.riskCount,'priorizar menos advertencias nominales');
 assert.equal(result.best.physicallyValidated,false);
 assert.equal(result.best.cncApproved,false);
 assert.ok(result.note.includes('NINGÚN orden'));
 assert.ok(result.searched>=24);
});
test('Planificador: controles contra búsqueda explosiva y otros perfiles',()=>{
 for(const item of ['escuadra-l','canal-u','perfil-z']){
  const out=P.suggest(S.get(item).profile);
  assert.ok(out.best);
  assert.equal(out.best.sequence.length,S.get(item).profile.angles.length);
 }
 assert.throws(()=>P.suggest(omega,{beamWidth:0}),/Límites/);
 const long={...omega,segments:Array(14).fill(50),angles:Array(13).fill(90),sequence:Array.from({length:13},(_,i)=>i+1)};
 const skipped=P.suggest(long);
 assert.equal(skipped.best,null);
 assert.ok(skipped.note.includes('12 pliegues'));
});

test('Datos de mesa y trancha: nunca se rellenan de forma ficticia',()=>{
 const result=B.validateSetup(omega.setup);
 for(const name of ['tableLeft','tableRight','ramWidth','ramBottomOffset'])assert.equal(result[name],null);
 assert.throws(()=>B.validateSetup({...omega.setup,tableLeft:-10}),/tableLeft/);
 assert.throws(()=>B.validateSetup({...omega.setup,ramWidth:0}),/ramWidth/);
 const same=B.validateSetup({...omega.setup,dieHeight:60,tableLeft:160,tableRight:170,ramWidth:110,ramBottomOffset:100});
 assert.equal(same.tableLeft,160);
 assert.equal(same.ramBottomOffset,100);
});
test('Recorte continuo de un segmento contra rectángulos nominales de máquina',()=>{
 const rect={minX:60,maxX:150,minY:60,maxY:100};
 assert.equal(M.overlapsSegmentRect({x:0,y:80},{x:170,y:80},1,rect),true);
 assert.equal(M.overlapsSegmentRect({x:0,y:20},{x:170,y:20},1,rect),false);
 assert.equal(M.overlapsSegmentRect({x:0,y:0},{x:0,y:200},1,rect),false);
 assert.equal(M.overlapsSegmentRect({x:50,y:80},{x:55,y:80},1,rect),false);
});
test('Avisos de choques con mesa y trancha frente a cotas y escena artificial',()=>{
 const profile={...omega,setup:{...omega.setup,dieHeight:60,tableLeft:160,tableRight:160,ramWidth:80,ramBottomOffset:80}};
 const fake={
  punchTipY:0,dieDepth:8,toolProfiles:{die:{outline:[{x:-20,y:0},{x:20,y:0},{x:20,y:60},{x:-20,y:60}]}},
  assembly:{left:{items:[{from:{x:-120,y:80},to:{x:-80,y:80},status:'realizado'}]},right:{items:[{from:{x:-10,y:-90},to:{x:10,y:-90},status:'pendiente'}]}},
  centerline:[],interferences:{problems:[]}
 };
 const scan=M.inspect(profile,fake);
 assert.equal(scan.possibleTableContact,true);
 assert.equal(scan.possibleRamContact,true);
 assert.equal(scan.unknown.length,0);
 assert.ok(scan.alerts.some(x=>x.startsWith('MESA:')));
 assert.ok(scan.alerts.some(x=>x.startsWith('TRANCHA:')));
 assert.equal(scan.physicallyValidated,false);
 assert.equal(scan.cncApproved,false);
 const omitted=M.inspect({...profile,setup:{...profile.setup,tableLeft:null,tableRight:null,ramWidth:null,ramBottomOffset:null}},fake);
 assert.equal(omitted.possibleTableContact,false);
 assert.equal(omitted.possibleRamContact,false);
 assert.equal(omitted.unknown.length,4);
});
test('Muestreo del ciclo de doblado nunca certifica separación o seguridad',()=>{
 const profile={...omega,setup:{...omega.setup,dieHeight:60,tableLeft:180,tableRight:180,ramWidth:95,ramBottomOffset:100}};
 const scan=M.sweep(profile,1,{intervals:4});
 assert.equal(scan.frames,5);
 assert.equal(scan.continuousSweep,false);
 assert.equal(scan.cncApproved,false);
 assert.ok(Array.isArray(scan.events));
 assert.throws(()=>M.sweep(profile,0,{intervals:50}),/Muestreo/);
});
test('Los prismas 3D de mesa/trancha sólo aparecen con cotas aportadas',()=>{
 const T=require('../tooling3d.js'),Part=require('../piece3d.js');
 const base=F.scene(omega,0,.5),basic=T.assemble(Part.build(base,100),base);
 assert.equal(basic.groups.table,0);assert.equal(basic.groups.ram,0);
 const p={...omega,setup:{...omega.setup,dieHeight:60,tableLeft:180,tableRight:180,ramWidth:100,ramBottomOffset:100}};
 const sc=F.scene(p,0,.5),drawn=T.assemble(Part.build(sc,100),sc);
 assert.equal(drawn.groups.table,1);assert.equal(drawn.groups.ram,1);
 assert.ok(drawn.faces.some(f=>f.group==='ram'));
 assert.ok(drawn.faces.some(f=>f.group==='table'));
 assert.ok(drawn.vertices.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)));
});

test('No se recomienda aplicar automáticamente ningún candidato con posibles interferencias nominales',()=>{
 const src={...omega,segments:[8,8],angles:[90],sequence:[1]};
 const out=P.suggest(src);
 assert.ok(out.best);
 assert.equal(out.best.riskCodes.includes('SHORT_FLANGE'),true);
 assert.ok(out.best.riskCount>0);
 assert.equal(out.recommended,null,'No aplicar a ciegas un pliegue con ala bajo el apoyo orientativo');
 assert.equal(out.best.status,'POSIBLES INTERFERENCIAS · REVISAR');
 assert.equal(out.best.physicallyValidated,false);
 assert.equal(out.best.cncApproved,false);
});
test('Informe de secuencia identifica el paso y las razones antes de aplicar',()=>{
 const p={...omega,setup:{...omega.setup,dieHeight:60,tableLeft:180,tableRight:180,ramWidth:95,ramBottomOffset:100}};
 const out=P.suggest(p);
 assert.ok(out.current.rows.every(x=>Array.isArray(x.riskCodes)&&typeof x.possibleCollision==='boolean'));
 assert.equal(out.current.riskCount,out.current.rows.reduce((n,row)=>n+row.riskCodes.length,0));
 assert.equal(out.best?.cncApproved,false);
 if(out.recommended)assert.equal(out.recommended.riskCount,0);
});

test('Secuencia automática bloqueada si se desconocen dimensiones de mesa o trancha',()=>{
 const p=S.get('escuadra-l').profile;
 const result=P.suggest(p);
 assert.ok(result.best);
 assert.ok(result.best.missingDimensions.length>=4);
 assert.equal(result.recommended,null,'Una máquina sin cotas no puede autorizar un orden automático');
 assert.equal(result.best.physicallyValidated,false);
 const partial={...p,setup:{...p.setup,dieHeight:60,tableLeft:180,tableRight:180}};
 const q=P.suggest(partial);
 assert.ok(q.best.missingDimensions.includes('Ancho de trancha'));
 assert.ok(q.best.missingDimensions.includes('Distancia punta-pie de trancha'));
 assert.equal(q.recommended,null,'No confundir datos parciales con validación de colisiones');
});
test('No se inventan dimensiones ni se cambian las cotas originales durante el cribado',()=>{
 const p=S.get('canal-u').profile,unchanged=JSON.stringify(p);
 const r=P.suggest(p);
 assert.equal(JSON.stringify(p),unchanged);
 assert.ok(r.current.missingDimensions.length>0);
 assert.ok(r.alternatives.every(x=>Array.isArray(x.missingDimensions)));
 if(r.recommended){
  assert.equal(r.recommended.riskCount,0);
  assert.equal(r.recommended.missingDimensions.length,0);
 }
});
