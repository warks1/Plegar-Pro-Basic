'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Metal=require('../metal-render.js');
const Drawing=require('../plan-drawing.js');
const Home=require('../home3d.js');
const Examples=require('../examples3d.js');
const Piece=require('../piece3d.js');
const shape=Examples.get('omega').profile;
test('Metal: gradientes, contorno de chapa e iluminación geométrica',()=>{
 const mesh=Drawing.meshFromProfile(require('../geometry2d.js').vertices(shape),shape.thickness,140);
 const proj=Piece.project(mesh,38,24,1);
 const output=Metal.defs('pp-test')+Metal.background('pp-test')+Metal.polys(mesh,proj,'pp-test',{material:'Inox 304'});
 assert.match(output,/linearGradient/);
 assert.match(output,/radialGradient/);
 assert.match(output,/metal/);
 assert.match(output,/data-group="sheet"/);
 assert.equal((output.match(/data-group="sheet"/g)||[]).length,mesh.faces.length);
 assert.equal(output.includes('<circle'),false,'No inventar taladros si no existen en el modelo.');
 assert.deepEqual(mesh,Drawing.meshFromProfile(require('../geometry2d.js').vertices(shape),shape.thickness,140),'El render no debe modificar la malla de origen.');
});
test('Metal: 3D del plano, miniatura, portada y ciclo usan material satinado',()=>{
 const file=Drawing.create(shape,{width:140});
 assert.match(file.svg2d,/PLANO 2D/);
 assert.match(file.svg3d,/METAL SATINADO/);
 assert.match(file.svg3d,/pp-plan-metal-metal/);
 assert.match(Home.preview(shape,{width:140}),/pp-preview-metal-metal/);
 assert.match(Home.machine(shape,{width:140}).svg,/pp-machine-metal-metal/);
 assert.match(Examples.thumb(Examples.get('omega')),/pp-gallery-metal-metal/);
});
test('Metal: no modifica estados físicos ni identifica el render como verificación',()=>{
 const model=Home.preview(shape,{width:140});
 assert.match(model,/Vista nominal/);
 const normal=Metal.normal({vertices:[{x:0,y:0,z:0},{x:2,y:0,z:0},{x:0,y:2,z:0}]},{ids:[0,1,2]});
 assert.ok(Math.abs(normal.z-1)<1e-8);
});

test('La chapa, punzón, matriz y topes usan acabados industriales claramente diferenciados',()=>{
 const svg=Home.machine(shape,{stage:2,progress:.4}).svg;
 for(const group of ['punch','die','gauge','table','ram']){
  assert.match(svg,new RegExp('id="pp-machine-metal-'+group+'"'));
  assert.match(svg,new RegExp('data-group="'+group+'"'));
  assert.match(svg,new RegExp('url\\(#pp-machine-metal-'+group+'\\)'));
 }
 assert.match(svg,/url\(#pp-machine-metal-metal\)/,'la chapa sigue usando su acabado acero');
 assert.match(svg,/data-group="sheet"/);
 assert.match(svg,/role="img"/);
});
