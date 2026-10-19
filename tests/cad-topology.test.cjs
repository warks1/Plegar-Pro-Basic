const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../cad-topology.js');
const CAD=require('../cad-profile.js');
const begin='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n',end='0\nENDSEC\n0\nEOF\n';
const lw=(layer,pts,closed)=>`0\nLWPOLYLINE\n8\n${layer}\n90\n${pts.length}\n70\n${closed?1:0}\n${pts.map(p=>`10\n${p[0]}\n20\n${p[1]}\n`).join('')}`;
const line=(layer,a,b)=>`0\nLINE\n8\n${layer}\n10\n${a[0]}\n20\n${a[1]}\n11\n${b[0]}\n21\n${b[1]}\n`;
const parse=items=>CAD.parseDocument(begin+items+end);
test('un único contorno cerrado queda independiente y no se activa en CNC',()=>{
 const d=parse(lw('PUNZON',[[0,0],[20,0],[20,40],[0,40]],true));const r=T.inspect(d);
 assert.deepEqual(r.summary,{entities:1,closed:1,open:0,endpointMatches:0,nested:0,uncertain:0});
 assert.equal(r.approvedForCNC,false);assert.equal(r.approvedForSimulation,false);
 assert.equal(r.rings[0].area_mm2,800);
});
test('LINE abiertos cercanos, candidatos sin unión ni mutación',()=>{
 const d=parse(line('A',[0,0],[2,0])+line('A',[2.02,0],[4,0]));
 const original=d.contours[0].points[1].x,r=T.inspect(d,{joinTolerance:0.05});
 assert.equal(r.summary.open,2);assert.equal(r.summary.endpointMatches,1);assert.ok(Math.abs(r.endpointCandidates[0].gap_mm-0.02)<1e-6);
 assert.equal(d.contours[0].points[1].x,original);assert.equal(d.contours[0].closed,false);
 assert.equal(T.inspect(d,{joinTolerance:0.01}).summary.endpointMatches,0);
});
test('las capas independientes no se unen de manera implícita',()=>{
 const d=parse(line('A',[0,0],[2,0])+line('B',[2,0],[4,0]));
 assert.equal(T.inspect(d).summary.endpointMatches,0);
 assert.equal(T.inspect(d,{sameLayer:false}).summary.endpointMatches,1);
});
test('dos anillos anidados se etiquetan posible hueco no verificado',()=>{
 const d=parse(lw('MATRIZ',[[0,0],[20,0],[20,20],[0,20]],true)+lw('MATRIZ',[[5,5],[15,5],[15,15],[5,15]],true));
 const r=T.inspect(d);assert.deepEqual(r.nestedContours,[{outer:0,inner:1}]);
 assert.equal(r.rings[1].relation,'contenido (posible hueco no validado)');
 assert.equal(r.approvedForCNC,false);
});
test('anillos separados no se declaran anidados',()=>{
 const d=parse(lw('A',[[0,0],[4,0],[4,4],[0,4]],true)+lw('A',[[8,0],[12,0],[12,4],[8,4]],true));
 assert.equal(T.inspect(d).summary.nested,0);assert.equal(T.inspect(d).summary.uncertain,0);
});
test('anillos cruzados se dejan ambiguos, no se inventan huecos',()=>{
 const d=parse(lw('A',[[0,0],[6,0],[6,6],[0,6]],true)+lw('A',[[4,4],[10,4],[10,10],[4,10]],true));
 const r=T.inspect(d);assert.equal(r.summary.nested,0);assert.equal(r.summary.uncertain,1);
});
test('si comparten borde no se considera hueco automáticamente',()=>{
 const d=parse(lw('A',[[0,0],[10,0],[10,10],[0,10]],true)+lw('A',[[2,0],[5,0],[5,2],[2,2]],true));
 const r=T.inspect(d);assert.equal(r.summary.nested,0);assert.ok(r.summary.uncertain>0);
});
test('validaciones de tolerancia y documentos activos',()=>{
 const d=parse(line('A',[0,0],[2,0]));
 for(const v of [-0.1,1.1,NaN,Infinity,'0.1',null])assert.throws(()=>T.inspect(d,{joinTolerance:v}),/Tolerancia/);
 assert.throws(()=>T.inspect({...d,activeInSimulation:true}),/no verificado/);
 assert.throws(()=>T.inspect(d,{sameLayer:'false'}),/capa/);
});
test('marcas A-B nominales siguen la orientación, no son puntos reales de amarre',()=>{
 const o={verified:false,activeInSimulation:false,bounds:{minX:-20,maxX:40,minY:-5,maxY:10}};
 const marks=T.mountingMarks(o,{datum:'superior',offset:-2});
 assert.deepEqual(marks.marks,[{id:'A',x_mm:-20,y_mm:8},{id:'B',x_mm:40,y_mm:8}]);
 assert.equal(marks.distance_mm,60);assert.equal(marks.approvedForCNC,false);
 assert.throws(()=>T.mountingMarks(o,{datum:'desconocido'}));
 assert.throws(()=>T.mountingMarks(o,{offset:1000}));
 assert.throws(()=>T.mountingMarks({...o,verified:true}));
});
test('se admiten arcos muestreados solo como topología de inspección',()=>{
 const d=parse('0\nCIRCLE\n8\nCIRCULOS\n10\n0\n20\n0\n40\n5\n');
 const r=T.inspect(d);assert.equal(r.summary.closed,1);
 assert.ok(r.rings[0].area_mm2>75&&r.rings[0].area_mm2<79);
 assert.equal(r.approvedForSimulation,false);
});
