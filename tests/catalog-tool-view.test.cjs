'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Data=require('../manufacturer-tooling-data'),T=require('../toolprofiles2d'),View=require('../catalog-tool-view');
test('Cada ficha muestra el mismo contorno en mm que usa el simulador',()=>{
 for(const tool of [...Data.PUNCHES,...Data.DIES]){
  const points=View.section(tool);assert.ok(points.length>=3);assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  const profile=tool.kind==='punch'?T.punch({punchCatalogTool:tool,punchTipY:0}):T.die({dieCatalogTool:tool,dieOpening:tool.opening,dieDepth:tool.opening/2/Math.tan(tool.angle*Math.PI/360)});
  assert.deepEqual(points,profile.outline);
  for(const view of ['2d','3d']){const svg=View.svg(tool,view);assert.ok(svg.includes(tool.code));assert.ok(!/NaN|Infinity/.test(svg));}
 }
});
test('Página 41: 22.312 conserva altura 74 y pie 14; no hereda H60 de las otras barras',()=>{
 const a=Data.DIES.find(t=>t.code==='22.312'),b=Data.DIES.find(t=>t.code==='22.310');
 assert.equal(a.height,74);assert.equal(a.footWidth,14);assert.equal(b.height,60);
 assert.equal(Math.max(...View.section(a).map(p=>p.y)),74);
});
test('Página 40: las barras anchas conservan el pie de 14 mm del dibujo',()=>{
 const tool=Data.DIES.find(t=>t.code==='22.825'),points=View.section(tool),foot=points.filter(p=>p.y===60);
 assert.deepEqual(foot.map(p=>p.x),[7,-7]);
});
test('Páginas originales disponibles y códigos 22.312/22.825 enlazados',()=>{
 require('../catalog-pages');assert.equal(global.PlegarCatalogPages.length,36);
 for(const code of ['22.312','22.825']){
  const tool=Data.DIES.find(t=>t.code===code);assert.match(View.cardArt(tool),/Ver dibujo original/);
 }
});

test('Vista individual MECOS con imagen fotografiada y silueta pata de cabra',()=>{
 require('../catalog-pages');
 const tool=Data.PUNCHES.find(t=>t.code==='15.670');
 assert.ok(tool,'Referencia de cuello de cisne 15.670 cargada');
 const art=View.cardArt(tool);
 assert.match(art,/catalog-reference/);
 assert.match(art,/IMG_8969\\.jpg/);
 assert.match(art,/<img[^>]*loading="lazy"/);
 assert.match(art,/PATA DE CABRA/);
 assert.match(art,/Ver dibujo original/);
 assert.match(art,/15\\.670/);
});
