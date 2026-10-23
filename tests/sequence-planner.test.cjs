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
 assert.ok(result.best.score<=result.current.score);
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
