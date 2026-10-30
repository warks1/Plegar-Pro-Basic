'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {extrude}=require('../tooling3d.js');
const {PUNCHES,DIES}=require('../manufacturer-tooling-data.js');
const T=require('../toolprofiles2d.js');
const C=require('../catalog-tool-view.js');
const P=require('../piece3d.js');
const area=ps=>ps.reduce((s,p,i)=>{const q=ps[(i+1)%ps.length];return s+p.x*q.y-q.x*p.y;},0)/2;
const inside=(p,outline)=>{
 let result=false;
 for(let i=0,j=outline.length-1;i<outline.length;j=i++){
  const a=outline[i],b=outline[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
 }
 return result;
};
test('las tapas 3D MECOS están trianguladas y mantienen el área de la sección 2D',()=>{
 for(const tool of [...PUNCHES,...DIES]){
  const outline=C.section(tool);
  let mesh;
  try{mesh=extrude(outline,0,tool.kind==='punch'?500:835,tool.kind);}
  catch(error){throw Error('Referencia '+tool.code+' / '+tool.kind+': '+error.message,{cause:error});}
  const caps=mesh.faces.filter(f=>f.kind==='cap');
  assert.ok(caps.length>=2,tool.code);
  assert.ok(caps.every(f=>f.ids.length===3),'Las tapas deben ser triángulos: '+tool.code);
  const front=caps.filter(f=>f.ids.every(id=>mesh.vertices[id].z===0));
  const back=caps.filter(f=>f.ids.every(id=>mesh.vertices[id].z!==0));
  assert.equal(front.length,back.length,tool.code);
  const frontArea=front.reduce((total,f)=>total+Math.abs(area(f.ids.map(id=>mesh.vertices[id]))),0);
  const expected=Math.abs(area(outline));
  assert.ok(Math.abs(frontArea-expected)<Math.max(.001,expected*1e-7),
   tool.code+' área tapa '+frontArea+' != '+expected);
  // No dibujar triángulos en el hueco de una pata de cabra.
  for(const f of front){
   const v=f.ids.map(id=>mesh.vertices[id]);
   const center={x:(v[0].x+v[1].x+v[2].x)/3,y:(v[0].y+v[1].y+v[2].y)/3};
   assert.ok(inside(center,outline),'Triángulo fuera del cuerpo: '+tool.code);
  }
  assert.equal(mesh.faces.filter(f=>f.kind==='side').length,outline.length,tool.code);
 }
});
test('pata de cabra 15.700: área de tapas, renderizado de cámara y garganta cóncava coherentes',()=>{
 const tool=PUNCHES.find(x=>x.code==='15.700'),profile=T.punch({punchCatalogTool:tool,punchTipY:0});
 const solid=extrude(profile.outline,-20,120,'punch');
 const cap=solid.faces.filter(x=>x.kind==='cap'&&x.ids.every(i=>solid.vertices[i].z===-20));
 assert.ok(cap.length>20);
 const mesh={...solid,width:140,thickness:2};
 const view=P.project(mesh,45,20);
 assert.equal(view.faces.length,mesh.faces.length);
 assert.ok(view.faces.every(f=>f.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
});
test('matriz AMADA 20.380: boca V80 dentro del cuerpo H145, alma y base 60 sin autocruce',()=>{
 const tool=DIES.find(x=>x.code==='20.380');
 assert.ok(tool);
 const points=C.section(tool),xs=points.map(x=>x.x);
 const width=Math.max(...xs)-Math.min(...xs);
 assert.ok(Math.abs(width-145)<1e-7);
 assert.ok(points.some(p=>p.x===40&&p.y===0));
 assert.ok(points.some(p=>p.x===-40&&p.y===0));
 assert.ok(points.some(p=>p.x===30&&p.y===tool.height));
 assert.ok(points.some(p=>p.x===-30&&p.y===tool.height));
 const model=T.die({dieCatalogTool:tool,dieOpening:tool.opening,dieDepth:T.dieDepth(tool)});
 assert.deepEqual(model.outline,points);
 const solid=extrude(points,0,835,'die');
 assert.ok(solid.faces.some(x=>x.kind==='cap'&&x.ids.length===3));
 assert.equal(model.verified,false);
});
test('una silueta cruzada no genera una falsa tapa 3D sólida',()=>{
 assert.throws(()=>extrude([{x:0,y:0},{x:100,y:100},{x:0,y:100},{x:100,y:0}],0,100,'punch'),/Contorno/);
});
