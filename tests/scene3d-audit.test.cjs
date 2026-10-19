const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const M=require('../piece3d.js');
const A=require('../scene3d-audit.js');
const p={name:'Ensayo',material:'S235',thickness:2,segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}};
test('secuencia de malla distingue activos y pendientes',()=>{
 const s=scene(p,0,.5),m=M.build(s);
 assert.equal(m.segmentStatuses.length,m.stations-1);
 assert.ok(m.segmentStatuses.includes('active'));
 assert.ok(m.segmentStatuses.includes('pending'));
 assert.ok(m.faces.some(f=>f.status==='pending'));
});
test('pliegues anteriores llevan estado completado',()=>{
 const s=scene(p,2,1),m=M.build(s);
 assert.ok(m.segmentStatuses.includes('completed'));
 assert.equal(m.segmentStatuses.filter(x=>x==='completed').length,2);
 assert.ok(M.project(m).faces.some(f=>f.status==='completed'));
});
test('ángulo cero elimina puntos coincidentes sin desplazar estado',()=>{
 const s=scene(p,1,0),m=M.build(s);
 assert.ok(m.segmentStatuses.every(x=>['active','pending','completed'].includes(x)));
 assert.equal(m.segmentStatuses.length,m.stations-1);
});
test('informe ordena separaciones nominales y evita prometer seguridad',()=>{
 const s=scene(p,3,.6),m=M.build(s),a=A.inspect(s,m);
 assert.equal(a.counts.completed,m.segmentStatuses.filter(x=>x==='completed').length);
 assert.ok(a.clearances.every((v,i)=>!i||v.gap>=a.clearances[i-1].gap));
 assert.match(a.note,/No son holguras reales 3D/);
 assert.ok(!a.minimum||a.minimum.gap>=0);
});
test('sin pliegues previos no inventa una holgura medida',()=>{
 const s=scene(p,0,.6),a=A.inspect(s,M.build(s));
 assert.equal(a.minimum,null);
 assert.match(a.status,/sin alas previas/);
});
test('umbrales detectan distancias orientativas pequeñas sin afirmar colisión 3D',()=>{
 const s=scene(p,1,.5),m=M.build(s);
 s.interferences.priorBendsEvaluated=[3];
 s.interferences.flangeClearances=[{side:'left',component:'Punzón',gap:5},{side:'right',component:'Matriz',gap:.01}];
 const a=A.inspect(s,m);
 assert.equal(a.minimum.gap,.01);
 assert.match(a.status,/posible solapamiento plano/);
});
test('rechaza entradas incompletas',()=>assert.throws(()=>A.inspect({},{})));
