const {test}=require('node:test'),assert=require('node:assert/strict');
const CAD=require('../cad-profile.js'),T=require('../cad-tangency.js');
const h='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n',e='0\nENDSEC\n0\nEOF\n';
const parse=s=>CAD.parseDocument(h+s+e);
const line=(x,y,a,b,layer='A')=>`0\nLINE\n8\n${layer}\n10\n${x}\n20\n${y}\n11\n${a}\n21\n${b}\n`;
const arc=(cx,cy,r,st,en,layer='A')=>`0\nARC\n8\n${layer}\n10\n${cx}\n20\n${cy}\n40\n${r}\n50\n${st}\n51\n${en}\n`;
const poly=(bulge)=>`0\nLWPOLYLINE\n8\nA\n90\n3\n70\n0\n10\n-10\n20\n0\n10\n0\n20\n0\n42\n${bulge}\n10\n10\n20\n10\n`;
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} ~= ${b}`);
test('arco circular: centro y radio fuente, límites cardinales analíticos y longitud exacta',()=>{
 const d=parse(arc(0,0,10,20,160));const p=d.contours[0].primitives[0];
 assert.equal(p.kind,'ARC');near(p.radius,10);near(p.center.x,0);near(d.bounds.maxY,10);near(d.bounds.minX,-10*Math.cos(20*Math.PI/180));
 near(d.bounds.length,10*140*Math.PI/180);assert.equal(d.activeInSimulation,false);
});
test('círculo usa envolvente cardinal exacta independientemente del muestreo',()=>{
 const d=parse('0\nCIRCLE\n8\nA\n10\n20\n20\n-5\n40\n3\n');
 near(d.bounds.minX,17);near(d.bounds.maxX,23);near(d.bounds.minY,-8);near(d.bounds.maxY,-2);
 assert.equal(T.inspect(d).summary.externalCandidates,0);
});
test('bulge mantiene primitivas y reconoce tangencia dirigida entre línea y arco',()=>{
 const d=parse(poly(0.4142135623730950));const src=d.contours[0];
 assert.equal(src.primitives.length,2);assert.equal(src.primitives[0].kind,'LINE');assert.equal(src.primitives[1].kind,'ARC');
 const r=T.inspect(d);assert.equal(r.summary.internalJoints,1);assert.equal(r.summary.smoothTangencies,1);assert.equal(r.approvedForCNC,false);
});
test('tangencia dirigida: tramo LINE llega a ARC 0→90 en su punto inicial',()=>{
 // ARC inicia en (10,0), tangente +Y; recta previa termina en (10,0) vertical ascendente.
 const doc={verified:false,activeInSimulation:false,contours:[{
  verified:false,activeInSimulation:false,index:0,layer:'A',closed:false,
  primitives:[{kind:'LINE',start:{x:10,y:-10},end:{x:10,y:0}},
   {kind:'ARC',start:{x:10,y:0},end:{x:0,y:10},center:{x:0,y:0},radius:10,startAngle:0,sweep:Math.PI/2}]
 }]};const snapshot=JSON.stringify(doc),r=T.inspect(doc);
 assert.equal(r.summary.smoothTangencies,1);near(r.examples[0].deviation_deg,0);assert.equal(JSON.stringify(doc),snapshot);
 assert.equal(r.approvedForSimulation,false);assert.equal(r.readiness.canGenerateSolid,false);
});
test('arco independiente y recta: tangencia posible, recorrido no validado',()=>{
 const d=parse(arc(0,0,10,0,90)+line(10,0,10,-7));
 const r=T.inspect(d);assert.equal(r.summary.externalTangentCandidates,1);
 assert.equal(r.examples[0].nominal,false);assert.ok(r.warnings.some(w=>w.includes('POSIBLES')));
});
test('codo no tangente clasificado como encuentro con ángulo',()=>{
 const d=parse(arc(0,0,10,0,90)+line(10,0,17,0));
 const r=T.inspect(d);assert.equal(r.summary.externalCorners,1);assert.equal(r.summary.externalTangentCandidates,0);
});
test('capas distintas no unen curvas a menos que se solicite',()=>{
 const d=parse(arc(0,0,10,0,90,'A')+line(10,0,10,-7,'B'));
 assert.equal(T.inspect(d).summary.externalCandidates,0);
 assert.equal(T.inspect(d,{sameLayer:false}).summary.externalCandidates,1);
});
test('distancia superior a tolerancia no se inventa como tangencia',()=>{
 const d=parse(arc(0,0,10,0,90)+line(10.3,0,10.3,-7));
 assert.equal(T.inspect(d,{joinTolerance:0.05}).summary.externalCandidates,0);
 assert.equal(T.inspect(d,{joinTolerance:0.35}).summary.externalCandidates,1);
});
test('rechaza tolerancias y documentos validados y geometrías sin fuente',()=>{
 const d=parse(arc(0,0,10,0,90));
 for(const x of [-1,1.001,Infinity,'0.1',null])assert.throws(()=>T.inspect(d,{joinTolerance:x}),/Tolerancia lineal/);
 for(const x of [-1,10.001,NaN,'1',null])assert.throws(()=>T.inspect(d,{angleTolerance:x}),/Tolerancia angular/);
 assert.throws(()=>T.inspect(d,{sameLayer:1}),/capas/);
 assert.throws(()=>T.inspect({...d,verified:true}),/DXF sin verificar/);
 assert.throws(()=>T.inspect({...d,contours:[{...d.contours[0],primitives:null}]}),/fuente analítica/);
});
test('conserva bloqueo y no altera el documento para curvas con bulge negativo',()=>{
 const d=parse(poly(-0.4142135623730950)),snapshot=JSON.stringify(d);
 const r=T.inspect(d);assert.equal(r.geometryModified,false);assert.equal(r.readiness.canUseCNC,false);
 assert.equal(JSON.stringify(d),snapshot);assert.equal(r.version,'0.24');
});
