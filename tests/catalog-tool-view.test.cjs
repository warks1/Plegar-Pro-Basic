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
 assert.match(art,/IMG_8969\.jpg/);
 assert.match(art,/<img[^>]*loading="lazy"/);
 assert.match(art,/PATA DE CABRA/);
 assert.match(art,/Ver dibujo original/);
 assert.match(art,/15\.670/);
});

test('La sección de pata de cabra tiene garganta cóncava y respeta H/R/ángulo',()=>{
 const punch=Data.PUNCHES.find(x=>x.code==='15.670');
 const model={punchCatalogTool:punch,punchTipY:0};
 const g=T.punch(model),points=g.outline;
 assert.equal(g.angle,86);
 assert.equal(g.nose,.8);
 assert.equal(Math.min(...points.map(p=>p.y)),-punch.height);
 assert.equal(Math.max(...points.map(p=>p.y)),0);
 assert.ok(points.length>35);
 assert.match(g.geometry,/pata de cabra/);
 // Desde el radio de la punta hasta el hombro se reproduce una garganta
 // interna distinta del lomo exterior; ninguna arista se cruza.
 const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const intersects=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8 && orient(c,d,a)*orient(c,d,b)<-1e-8;
 for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
  if(i===0&&j===points.length-1)continue;
  assert.equal(intersects(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]),false,
   'Contorno auto-intersectado '+punch.code+' en segmentos '+i+'/'+j);
 }
 const xs=points.map(p=>p.x),left=Math.min(...xs);
 assert.ok(left< -punch.bodyWidth/2,'La pata de cabra debe tener lomo exterior');
 assert.ok(points.some(p=>p.x>left+10&&p.x<0&&p.y< -punch.height*.3&&p.y> -punch.height*.7),
   'El perfil debe tener relieve cóncavo en su garganta');
});

test('Biblioteca de 237 referencias: render inicial paginado, ampliar y buscar sin perder fichas',()=>{
 const cards=[...Data.PUNCHES,...Data.DIES].map(tool=>({textContent:tool.name+' '+tool.code+' '+tool.height,hidden:false}));
 const input={value:'',listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}};
 const counter={textContent:''};
 let more=null;
 const grid={insertAdjacentElement(_position,btn){more=btn;}};
 const host={
  querySelector(selector){return selector.includes('data-catalog-search')?input:selector.includes('data-catalog-count')?counter:grid;},
  querySelectorAll(){return cards;}
 };
 const prior=global.document;
 try{
  global.document={createElement:()=>({hidden:false,listeners:{},addEventListener(event,fn){this.listeners[event]=fn;}})};
  View.mount(host);
  assert.equal(cards.filter(card=>!card.hidden).length,36);
  assert.ok(more&&!more.hidden);
  more.listeners.click();
  assert.equal(cards.filter(card=>!card.hidden).length,72);
  input.value='15.670';input.listeners.input();
  assert.equal(cards.filter(card=>!card.hidden).length,1);
  assert.match(counter.textContent,/237 referencias/);
  assert.equal(more.hidden,true);
 }finally{global.document=prior;}
});
