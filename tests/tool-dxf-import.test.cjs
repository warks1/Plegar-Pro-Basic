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
 assert.throws(()=>D.parseDXF(dxf({bulge:true})),/arcos\/bulges/);
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
 assert.match(D.html(),/una sola polilínea LWPOLYLINE cerrada/);
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
