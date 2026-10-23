'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Draw=require('../plan-drawing.js');
const shape={
 name:'Pieza Omega & <ensayo>',material:'Acero S235JR',thickness:2,
 segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2],
 setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120}
};
test('Planos: el mismo perfil produce dibujo 2D y proyección 3D acotada nominalmente',()=>{
 const d=Draw.create(shape,{width:180});
 assert.equal(d.width,180);
 assert.match(d.svg2d,/PLANO 2D/);
 assert.match(d.svg2d,/60 mm/);
 assert.match(d.svg2d,/B1/);
 assert.match(d.svg2d,/B4/);
 assert.match(d.svg3d,/180 mm/);
 assert.match(d.svg3d,/VISTA AXONOMÉTRICA 3D/);
 assert.match(d.svg3d,/<polygon/);
 assert.match(d.sheet,/viewBox="0 0 1800 600"/);
 assert.deepEqual(d.profile.sequence,shape.sequence);
 assert.deepEqual(d.profile.setup,shape.setup);
});
test('Planos: malla geométrica tiene espesor y ancho, vértices finitos',()=>{
 const d=Draw.create(shape,{width:234});
 assert.equal(d.mesh.vertices.length,(shape.segments.length+1)*4);
 assert.equal(d.mesh.faces.length,shape.segments.length*4+2);
 assert.equal(Math.max(...d.mesh.vertices.map(v=>v.z)),234);
 assert.equal(Math.min(...d.mesh.vertices.map(v=>v.z)),0);
 assert.ok(d.mesh.vertices.every(v=>Object.values(v).every(Number.isFinite)));
});
test('Planos: texto visible se codifica para SVG, no se inyectan etiquetas de la pieza',()=>{
 const d=Draw.create(shape,{width:100});
 assert.ok(!d.svg2d.includes('<ensayo>'));
 assert.ok(d.svg2d.includes('&amp; &lt;ensayo&gt;'));
});
test('Planos: rechaza ancho, segmentos o ángulos no válidos',()=>{
 for(const width of [-1,0,5001,NaN,Infinity])assert.throws(()=>Draw.create(shape,{width}),/Ancho 3D/);
 assert.throws(()=>Draw.create({...shape,segments:[10]},{}));
 assert.throws(()=>Draw.create({...shape,angles:[-190,90,90,-90]},{}));
});
