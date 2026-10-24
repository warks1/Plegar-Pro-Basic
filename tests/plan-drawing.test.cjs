'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Draw=require('../plan-drawing.js');
const G=require('../geometry2d.js');
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
test('El plano exportado respeta el sentido de pliegue de la pieza geométrica',()=>{
 const pointsFromSvg=svg=>{
  const match=svg.match(/<polyline points="([^"]+)"/);
  assert.ok(match,'Sin polilínea del perfil');
  return match[1].split(' ').map(pair=>pair.split(',').map(Number));
 };
 for(const angle of [90,-90,45,-45]){
  const p={...shape,segments:[45,80],angles:[angle],sequence:[1]};
  const original=G.vertices(p),rendered=pointsFromSvg(Draw.create(p,{width:100}).svg2d);
  const dir=(a,b)=>Math.atan2(-(b[1]-a[1]),b[0]-a[0]);
  for(let i=0;i<p.segments.length;i++){
   const src=dir([original[i].x,original[i].y],[original[i+1].x,original[i+1].y]);
   const shown=dir(rendered[i],rendered[i+1]);
   assert.ok(Math.abs(src-shown)<1e-3,`Pliegue ${angle} invertido en el SVG`);
  }
  assert.equal(Math.sign(rendered[2][1]-rendered[1][1]),-Math.sign(angle));
 }
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

test('Planos: guardado completo en IndexedDB conserva PDF, vistas SVG y perfil editable',async()=>{
 const Core=require('../plans-core.js');
 globalThis.PlegarPlansCore=Core;globalThis.PlegarPlanDrawing=Draw;
 const stores={folders:new Map(),plans:new Map()};
 const request=value=>{const r={onsuccess:null,onerror:null,result:undefined};queueMicrotask(()=>{r.result=value;r.onsuccess?.();});return r;};
 const db={
  createObjectStore(name){stores[name]=new Map();return {createIndex(){}};},
  transaction(name){const tx={oncomplete:null,onerror:null,onabort:null};const map=stores[name];
   tx.objectStore=()=>({
    getAll:()=>request([...map.values()]),
    get:id=>request(map.get(id)),
    put:row=>{map.set(row.id,row);queueMicrotask(()=>tx.oncomplete?.());},
    delete:id=>{map.delete(id);queueMicrotask(()=>tx.oncomplete?.());}
   });return tx;}
 };
 globalThis.indexedDB={open(){const r={result:db,onupgradeneeded:null,onsuccess:null,onerror:null};queueMicrotask(()=>{r.onupgradeneeded?.();r.onsuccess?.();});return r;}};
 globalThis.Image=class{set src(value){this.source=value;queueMicrotask(()=>this.onload?.());}};
 globalThis.document={createElement(name){assert.equal(name,'canvas');return {
  width:0,height:0,getContext(){return {fillRect(){},drawImage(){},set fillStyle(v){}};},
  toBlob(callback){callback(new Blob([Uint8Array.of(255,216,255,217)],{type:'image/jpeg'}));}
 };}};
 const Plans=require('../plans-view.js');
 const saved=await Plans.saveProgram(shape,{width:175,name:'Soporte generado'});
 assert.match(saved.name,/Soporte generado.pdf/);
 const record=stores.plans.get(saved.id);
 assert.equal(record.width,175);
 assert.equal(record.profile.segments.length,5);
 assert.match(record.svg2d,/PLANO 2D/);
 assert.match(record.svg3d,/VISTA AXONOMÉTRICA 3D/);
 assert.equal(record.originalName,'Soporte generado.json');
 assert.ok((await record.original.text()).includes('plegar-pro-profile2d'));
 assert.ok(Buffer.from(await record.pdf.arrayBuffer()).toString('latin1').startsWith('%PDF-1.4'));
 assert.ok(stores.folders.size===1);
 await assert.rejects(()=>Plans.saveProgram(shape,{width:5001}),/Ancho 3D/);
});
