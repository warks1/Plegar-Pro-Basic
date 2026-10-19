const {test}=require('node:test'),assert=require('node:assert/strict');
const CAD=require('../cad-profile.js'),Core=require('../cad-crossings.js');
const begin='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n',end='0\nENDSEC\n0\nEOF\n';
const line=(layer,a,b)=>['0','LINE','8',layer,'10',a[0],'20',a[1],'11',b[0],'21',b[1],''].join('\n');
const parse=s=>CAD.parseDocument(begin+s+end);
const inspect=(s,options)=>Core.inspect(parse(s),options);
test('cruce interior-interior y geometría sin modificar',()=>{const d=parse(line('A',[0,0],[10,10])+line('A',[0,10],[10,0])),old=JSON.stringify(d),r=Core.inspect(d);
 assert.equal(r.summary.crossings,1);assert.equal(r.complete,true);assert.equal(r.approvedForCNC,false);assert.equal(r.readiness.canGenerateSolid,false);assert.equal(JSON.stringify(d),old);});
test('unión T de extremo sobre segmento',()=>{const r=inspect(line('A',[0,0],[10,0])+line('A',[5,-4],[5,0]));assert.equal(r.summary.tJunctions,1);assert.equal(r.summary.crossings,0);});
test('solape colineal de longitud positiva',()=>{const r=inspect(line('A',[0,0],[10,0])+line('A',[4,0],[15,0]));assert.equal(r.summary.overlaps,1);});
test('extremos coincidentes no generan falsos cruces ni proximidades',()=>{const r=inspect(line('A',[0,0],[5,0])+line('A',[5,0],[10,0]));assert.equal(r.summary.crossings+r.summary.tJunctions+r.summary.overlaps+r.summary.nearGaps,0);});
test('proximidad positiva no inventa intersección exacta',()=>{const d=line('A',[0,0],[10,0])+line('A',[5,0.02],[5,3]);assert.equal(inspect(d).summary.nearGaps,1);assert.equal(inspect(d,{joinTolerance:0.01}).summary.nearGaps,0);});
test('respeta pertenencia a capa por defecto',()=>{const d=line('A',[0,0],[10,10])+line('B',[0,10],[10,0]);assert.equal(inspect(d).summary.crossings,0);assert.equal(inspect(d,{sameLayer:false}).summary.crossings,1);});
test('cruce de partes no adyacentes de un contorno',()=>{const p=[[0,0],[10,10],[0,10],[10,0]].map(([x,y])=>({x,y}));const d={verified:false,activeInSimulation:false,contours:[{index:0,verified:false,activeInSimulation:false,layer:'X',closed:false,points:p}]};assert.equal(Core.inspect(d).summary.crossings,1);});
test('aristas separadas no tienen cruces',()=>{assert.equal(inspect(line('A',[0,0],[5,0])+line('A',[15,0],[20,0])).summary.crossings,0);});
test('rechaza tolerancias no numéricas o fuera de rango',()=>{const d=parse(line('A',[0,0],[3,0]));for(const x of [-1,1.1,Infinity,NaN,null,'0.05'])assert.throws(()=>Core.inspect(d,{joinTolerance:x}),/Tolerancia/);});
test('rechaza cambio de filtro no booleano o entrada activada',()=>{const d=parse(line('A',[0,0],[3,0]));assert.throws(()=>Core.inspect(d,{sameLayer:0}),/capas/);assert.throws(()=>Core.inspect({...d,activeInSimulation:true}),/inspección/);});
test('presupuesto agotado informa de parcial sin declarar seguro',()=>{const points=Array.from({length:390},(_,i)=>({x:i,y:i%2}));const d={verified:false,activeInSimulation:false,contours:[{index:0,layer:'X',verified:false,activeInSimulation:false,closed:false,points}]};const r=Core.inspect(d,{joinTolerance:0});assert.equal(r.summary.limited,true);assert.equal(r.complete,false);assert.equal(r.readiness.canUseCNC,false);});
test('geometría degenerada y valores infinitos se rechazan',()=>{const d={verified:false,activeInSimulation:false,contours:[{index:0,layer:'A',verified:false,activeInSimulation:false,closed:false,points:[{x:0,y:0},{x:0,y:0}]}]};assert.throws(()=>Core.inspect(d),/degenerado/);d.contours[0].points[1]={x:Infinity,y:0};assert.throws(()=>Core.inspect(d),/Coordenadas/);});

test('v0.23: dos tramos adyacentes que retroceden por la misma recta se consideran solape',()=>{
 const doc={verified:false,activeInSimulation:false,contours:[{verified:false,activeInSimulation:false,index:0,layer:'M',closed:false,points:[{x:0,y:0},{x:10,y:0},{x:5,y:0}]}]};
 const original=JSON.stringify(doc),r=Core.inspect(doc);
 assert.equal(r.summary.overlaps,1);assert.equal(r.examples[0].type,'solape');
 assert.deepEqual(r.examples[0].point_mm,{x:7.5,y:0});
 assert.equal(r.approvedForCNC,false);assert.equal(JSON.stringify(doc),original);
});
test('v0.23: un codo o contorno cerrado correcto no genera falsos solapes',()=>{
 const doc={verified:false,activeInSimulation:false,contours:[{verified:false,activeInSimulation:false,index:0,layer:'M',closed:true,points:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}]}]};
 const r=Core.inspect(doc);assert.equal(r.summary.overlaps,0);assert.equal(r.summary.crossings,0);assert.equal(r.summary.nearGaps,0);
});
test('v0.23: localiza coordenadas de un cruce entre dos líneas y deja informe bloqueado',()=>{
 const r=check(line('A',[0,0],[10,10])+line('A',[0,10],[10,0]));
 assert.equal(r.version,'0.23');assert.deepEqual(r.examples[0].point_mm,{x:5,y:5});
 assert.equal(r.readiness.canGenerateSolid,false);
});
test('v0.23: calcula un punto aproximado de la distancia mínima sin confundir proximidad y contacto',()=>{
 const r=check(line('A',[0,0],[10,0])+line('A',[5,0.04],[5,3]),{joinTolerance:0.1});
 assert.equal(r.summary.nearGaps,1);
 assert.equal(r.examples[0].gap_mm,0.04);
 assert.deepEqual(r.examples[0].point_mm,{x:5,y:0.02});
});
test('v0.23: la unión en T registra la ubicación del contacto',()=>{
 const r=check(line('A',[0,0],[10,0])+line('A',[4,-3],[4,0]));
 assert.equal(r.summary.tJunctions,1);assert.deepEqual(r.examples[0].point_mm,{x:4,y:0});
});
