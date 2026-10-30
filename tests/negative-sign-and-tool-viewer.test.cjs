'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Sign=require('../signed-fold-view.js');
const Viewer=require('../tool-viewer-3d.js');
const L=require('../tool-library.js');
const part={name:'Segundo pliegue negativo',material:'S235',thickness:2,
 segments:[40,50,60],angles:[0,-90],sequence:[1,2],
 setup:{punch:'wila-p-15.700',die:'wila-d-25.407',radius:2,kFactor:.33}};
test('B2 -90 curva realmente ABAJO en el plano y se anima con su signo, no solo en texto',()=>{
 const start=Sign.model(part,1,0),middle=Sign.model(part,1,.5),end=Sign.model(part,1,1);
 assert.equal(start.bend,2);assert.equal(end.target,-90);
 assert.equal(middle.angle,-45);assert.equal(end.angle,-90);
 assert.ok(end.endpoints.right.y>end.pivot.y+1,'ALA B2 negativa debe bajar en coordenadas SVG');
 assert.ok(end.endpoints.right.y>middle.endpoints.right.y);
 const positive={...part,angles:[0,90]};
 assert.ok(Sign.model(positive,1,1).endpoints.right.y<0,'+90 arriba');
 assert.match(Sign.svg(part,1,.5),/data-f2-signed="true"/);
 assert.match(Sign.svg(part,1,.5),/B2 · −90° · ABAJO/);
 assert.match(Sign.svg(part,1,.5),/Ángulo actual: −45°/);
});
test('B2 y B1 con signos opuestos comparten el mismo plano final independientemente del orden de secuencia',()=>{
 const a={...part,angles:[90,-90],sequence:[1,2]};
 const b={...a,sequence:[2,1]};
 const x=Sign.model(a,1,1),y=Sign.model(b,1,1);
 assert.deepEqual(x.points,y.points);
 assert.equal(x.target,-90);assert.equal(y.target,90);
});
test('visor 3D orbital usa la misma sección de catálogo y rota/voltea ambos tipos de útil',()=>{
 const tools=[L.PUNCHES.find(x=>x.code==='15.700'),L.PUNCHES.find(x=>x.code==='15.620'),L.DIES.find(x=>x.code==='25.407')];
 for(const tool of tools){
  assert.ok(tool,'Referencia perdida');
  const m=Viewer.model(tool);
  assert.ok(m.vertices.length>10&&m.faces.length>15);
  assert.ok(m.vertices.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
  const iso=Viewer.graphic(m,{yaw:40,pitch:24,zoom:1});
  const flipped=Viewer.graphic(m,{yaw:220,pitch:-24,zoom:1});
  assert.notEqual(iso,flipped);
  assert.match(iso,/MODELO 3D/);
  assert.match(iso,/NO CAD fabricante/);
  assert.match(flipped,/data-face="cap"/);
 }
 assert.deepEqual(Viewer.camera({yaw:-20,pitch:220,zoom:10}),{yaw:340,pitch:180,zoom:2.8});
 assert.throws(()=>Viewer.camera({yaw:NaN}),/Cámara/);
});
