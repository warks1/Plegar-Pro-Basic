'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const storage=new Map();
global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const D=require('../tool-dxf-import.js');
const pairs=(list)=>list.map(([code,value])=>code+'\n'+value).join('\n')+'\n';
const rect=[[0,0],[100,0],[100,150],[0,150]];
function dxf({units=4,points=rect,closed=true,bulge=false,extra=[]}={}){
 const rows=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,units],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES'],[0,'LWPOLYLINE'],[90,points.length],[70,closed?1:0]];
 for(const [x,y] of points){rows.push([10,x],[20,y]);if(bulge)rows.push([42,.4142]);}
 rows.push(...extra,[0,'ENDSEC'],[0,'EOF']);
 return pairs(rows);
}
test('Lee DXF cerrado en mm y mantiene dimensiones métricas y contorno sin reescalar',()=>{
 const model=D.parseDXF(dxf());
 assert.equal(model.bounds.width,100);
 assert.equal(model.bounds.height,150);
 assert.equal(model.areaMm2,15000);
 assert.equal(model.points.length,4);
 assert.equal(model.unitsDeclared,true);
 assert.equal(model.geometryCertified,false);
 assert.equal(model.collisionApproved,false);
});
test('Rechaza cotas no declaradas, pulgadas y curvas sin linealización',()=>{
 assert.throws(()=>D.parseDXF(dxf({units:0})),/sin unidades/i);
 assert.equal(D.parseDXF(dxf({units:0}),{confirmUnitlessMm:true}).unitsDeclared,false);
 assert.throws(()=>D.parseDXF(dxf({units:1})),/milímetros/);
 const rounded=D.parseDXF(dxf({bulge:true}));
 assert.equal(rounded.arcCount,4);
 assert.equal(rounded.chordErrorMm,.05);
 assert.ok(rounded.points.length>4,'Los arcos DXF generan vértices de precisión controlada');
 assert.equal(rounded.collisionApproved,false);
 assert.throws(()=>D.parseDXF(dxf({closed:false})),/cerrada/);
 assert.throws(()=>D.parseDXF(dxf({extra:[[0,'CIRCLE'],[10,0],[20,0],[40,2]]})),/varios perfiles o entidades/);
 assert.throws(()=>D.parseDXF(dxf({points:[[0,0],[10,10],[0,10],[10,0]]})),/autointersecado/);
 assert.throws(()=>D.parseDXF(dxf({points:[[0,0],[1000000,0],[1000000,3],[0,3]]})),/fuera de rango/);
});
test('Almacena perfiles propios localmente sin atribuir certificado CAD ni habilitar colisiones',()=>{
 const record=D.add({brand:'AMADA',kind:'punch',code:'PT-TEST-2026',name:'Punzón recto importado',lengthMm:835,sourceFile:'perfil.dxf'},dxf());
 assert.ok(record.id.startsWith('local-'));
 assert.equal(record.lengthMm,835);
 assert.equal(record.bounds.width,100);
 assert.equal(record.geometryCertified,false);
 assert.equal(record.simulatable,false);
 assert.equal(D.read().length,1);
 const view=D.render(record,'2d'),solid=D.render(record,'3d');
 assert.match(view,/Sección: 100 × 150 mm/);
 assert.match(view,/ESCALA MÉTRICA/);
 assert.match(solid,/EXTRUSIÓN VISUAL/);
 assert.notEqual(view,solid);
 assert.match(D.html(),/LWPOLYLINE o POLYLINE\/VERTEX/);
 assert.ok(D.remove(record.id));
 assert.equal(D.read().length,0);
});
test('No permite inyectar HTML ni registrar marcas ajenas, datos corruptos o cargas de riesgo',()=>{
 assert.throws(()=>D.add({brand:'XYZ',kind:'die',code:'V10',name:'<script>'},dxf()),/Marca/);
 assert.throws(()=>D.add({brand:'Bystronic',kind:'die',code:'V10',name:'matriz',lengthMm:-5},dxf()),/Longitud/);
 const r=D.add({brand:'MECOS',kind:'die',code:'<script>',name:'V de prueba'},dxf());
 assert.doesNotMatch(D.render(r,'2d'),/<script>/);
 assert.throws(()=>D.render(r,'interactive'),/Vista incorrecta/);
 assert.ok(D.remove(r.id));
});

test('Importa un semicírculo DXF con bulge=1 sin convertirlo en una recta',()=>{
 const outline=dxf({points:[[0,0],[40,0],[40,40],[0,40]]});
 // Añadir el bulge al primer vértice justo después del par (10,20).
 const needle='10\n0\n20\n0\n10\n40';
 assert.ok(outline.includes(needle));
 const curved=outline.replace(needle,'10\n0\n20\n0\n42\n1\n10\n40');
 const model=D.parseDXF(curved);
 assert.equal(model.arcCount,1);
 assert.equal(model.bounds.width,40);
 assert.ok(Math.abs(model.bounds.height-60)<.1,'Semicírculo aporta profundidad de 20 mm en lugar de lado recto');
 assert.ok(model.points.length>15);
 assert.ok(model.points.length<=400);
 assert.equal(model.geometryCertified,false);
});
test('Se detiene ante bulges no finitos y curvas desmesuradas, sin dibujar geometría incorrecta',()=>{
 const d=dxf({points:[[0,0],[40,0],[40,40],[0,40]]});
 assert.throws(()=>D.parseDXF(d.replace('10\n0\n20\n0','10\n0\n20\n0\n42\nno-es-numero')),/Bulge DXF no válido/);
 assert.throws(()=>D.parseDXF(d.replace('10\n0\n20\n0','10\n0\n20\n0\n42\n999999')),/Bulge DXF no válido/);
});

function classic({flags=1,points=rect,bulge=0,z=0,vertexFlag=0,ending=true,extra=[]}={}){
 const rows=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,4],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES'],[0,'POLYLINE'],[66,1],[70,flags],[10,0],[20,0],[30,0]];
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i];
  rows.push([0,'VERTEX'],[10,x],[20,y],[30,z],[70,vertexFlag]);
  if(i===0&&bulge)rows.push([42,bulge]);
 }
 if(ending)rows.push([0,'SEQEND']);
 rows.push(...extra,[0,'ENDSEC'],[0,'EOF']);
 return pairs(rows);
}
test('Importa POLYLINE clásica en mm y dibuja el mismo perfil que LWPOLYLINE',()=>{
 const old=D.parseDXF(classic()),modern=D.parseDXF(dxf());
 assert.equal(old.sourceFormat,'DXF ASCII POLYLINE');
 assert.equal(old.bounds.width,100);
 assert.equal(old.bounds.height,150);
 assert.deepEqual(old.points,modern.points);
 assert.equal(old.geometryCertified,false);
 const record=D.add({brand:'MECOS',kind:'die',code:'V-CLASICO',name:'Sección clásica'},classic());
 assert.equal(record.sourceFormat,'DXF ASCII POLYLINE');
 assert.equal(D.read()[0].sourceFormat,'DXF ASCII POLYLINE');
 assert.match(D.render(record,'2d'),/Sección: 100 × 150 mm/);
 assert.ok(D.remove(record.id));
});
test('POLYLINE clásica con arco circular conserva radio sin sustituirlo por línea recta',()=>{
 const r=D.parseDXF(classic({points:[[0,0],[40,0],[40,40],[0,40]],bulge:1}));
 assert.equal(r.arcCount,1);
 assert.equal(r.chordErrorMm,.05);
 assert.ok(r.points.length>15);
 assert.ok(Math.abs(r.bounds.height-60)<.1);
 assert.equal(r.collisionApproved,false);
});
test('POLYLINE clásica rechaza mallas, elevaciones, vertices spline o seqend ausente',()=>{
 assert.throws(()=>D.parseDXF(classic({flags:8})),/3D, malla/);
 assert.throws(()=>D.parseDXF(classic({vertexFlag:32})),/VERTEX 3D/);
 assert.throws(()=>D.parseDXF(classic({z:2})),/fuera del plano/);
 assert.throws(()=>D.parseDXF(classic({ending:false})),/sin SEQEND/);
 assert.throws(()=>D.parseDXF(classic({flags:0,points:rect})),/cerrada/);
 assert.throws(()=>D.parseDXF(classic({extra:[[0,'INSERT'],[2,'extra']]})),/entidades geométricas no soportadas/);
 const bad=classic().replace('0\nPOLYLINE\n66','0\nPOLYLINE\n230\n-1\n66');
 assert.throws(()=>D.parseDXF(bad),/inclinada/);
});
