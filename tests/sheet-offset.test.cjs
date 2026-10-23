'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Offset=require('../sheet-offset.js'),Draw=require('../plan-drawing.js'),G=require('../geometry2d.js');
const eps=1e-9;
function approx(a,b){assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);}
test('miter 90°: la distancia normal a cada tramo mantiene el espesor introducido',()=>{
 const pts=[{x:0,y:0},{x:50,y:0},{x:50,y:50}],off=Offset.normals(pts,2);
 approx(off[0].x,0);approx(off[0].y,1);
 approx(off[1].x,-1);approx(off[1].y,1);
 approx(off[2].x,-1);approx(off[2].y,0);
});
test('caras 3D y plano documental utilizan exactamente los mismos offsets geométricos',()=>{
 const profile={name:'Pieza L',material:'Acero S235JR',thickness:2,segments:[50,50],angles:[90],sequence:[1]};
 const m=Draw.meshFromProfile(G.vertices(profile),profile.thickness,100);
 const off=Offset.normals(G.vertices(profile),2);
 const apex=G.vertices(profile)[1],corner=m.vertices[4];
 approx(corner.x,apex.x+off[1].x);
 approx(corner.y,apex.y+off[1].y);
 assert.equal(m.width,100);
});
test('ángulos muy agudos se limitan sin infinito y sin generar coordenadas NaN',()=>{
 const pts=[{x:0,y:0},{x:30,y:0},{x:30-30*Math.cos(.001),y:30*Math.sin(.001)}];
 const x=Offset.normals(pts,4);
 assert.ok(x.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
 assert.ok(x.every(v=>Math.hypot(v.x,v.y)<=16+1e-7));
 assert.throws(()=>Offset.normals([pts[0],pts[0]],2),/degenerado/);
});
