const {test}=require('node:test'),assert=require('node:assert/strict');
const CAD=require('../cad-profile.js'),Core=require('../cad-chain.js'),T=require('../cad-topology.js');
const start='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n',end='0\nENDSEC\n0\nEOF\n';
const line=(layer,a,b)=>`0\nLINE\n8\n${layer}\n10\n${a[0]}\n20\n${a[1]}\n11\n${b[0]}\n21\n${b[1]}\n`;
const parse=parts=>CAD.parseDocument(start+parts+end);
const audit=(d,o={})=>Core.inspect(d,{...o,topology:T.inspect(d,{joinTolerance:o.joinTolerance??0.05,sameLayer:o.sameLayer??true})});
test('dos líneas unidas por tolerancia son cadena nominal abierta, sin modificar el DXF',()=>{
 const d=parse(line('A',[0,0],[5,0])+line('A',[5.03,0],[10,0]));const r=audit(d);
 assert.equal(r.summary.components,1);assert.equal(r.summary.candidatePairs,1);
 assert.equal(r.components[0].type,'cadena nominal abierta');assert.equal(r.components[0].looseEnds,2);
 assert.equal(r.geometryModified,false);assert.equal(r.approvedForCNC,false);assert.equal(r.readiness.canUseSimulation,false);
 assert.equal(d.contours[1].points[0].x,5.03);
});
test('bifurcación de tres entidades nunca es cadena segura',()=>{
 const d=parse(line('A',[0,0],[5,0])+line('A',[5,0],[10,0])+line('A',[5,0],[5,5]));const r=audit(d);
 assert.equal(r.summary.branches,1);assert.equal(r.components[0].type,'bifurcación ambigua');
});
test('un cuadrado compuesto por LINE forma solo un ciclo nominal',()=>{
 const d=parse(line('A',[0,0],[4,0])+line('A',[4,0],[4,4])+line('A',[4,4],[0,4])+line('A',[0,4],[0,0]));const r=audit(d);
 assert.equal(r.summary.nominalCycles,1);assert.equal(r.readiness.status,'NO HABILITADO');
 assert.equal(d.contours.every(c=>!c.closed),true);
});
test('cadenas de capas distintas permanecen separadas por defecto',()=>{
 const d=parse(line('A',[0,0],[5,0])+line('B',[5,0],[10,0]));
 assert.equal(audit(d).summary.components,2);assert.equal(audit(d,{sameLayer:false}).summary.components,1);
});
test('tolerancia evita unir extremos demasiado separados',()=>{
 const d=parse(line('A',[0,0],[4,0])+line('A',[4.5,0],[9,0]));
 assert.equal(audit(d).summary.components,2);assert.equal(audit(d).summary.candidatePairs,0);
});
test('la agrupación transitiva denuncia una distancia entre extremos superior a la tolerancia',()=>{
 const d=parse(line('A',[0,0],[5,0])+line('A',[5.04,0],[10,0])+line('A',[5.08,0],[5.08,5]));const r=audit(d);
 assert.equal(r.summary.transitiveGroups,1);assert.equal(r.components[0].type,'bifurcación ambigua');
});
test('informa incluso cuando no hay entidades abiertas',()=>{
 const d=parse('0\nCIRCLE\n8\nA\n10\n0\n20\n0\n40\n5\n');const r=audit(d);
 assert.equal(r.summary.components,0);assert.equal(r.summary.openEntities,0);assert.equal(r.readiness.canGenerateSolid,false);
});
test('entradas inválidas y documentos activos se rechazan',()=>{
 const d=parse(line('A',[0,0],[5,0]));
 for(const x of [-1,1.1,Infinity,NaN,'0.05',null])assert.throws(()=>Core.inspect(d,{joinTolerance:x}),/Tolerancia/);
 assert.throws(()=>Core.inspect({...d,activeInSimulation:true}),/inspección/);
 assert.throws(()=>Core.inspect(d,{sameLayer:0}),/capas/);
});
