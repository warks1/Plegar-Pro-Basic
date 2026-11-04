'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const CAD=require('../tool-cad.js'),UI=require('../tool-cad-ui.js'),L=require('../tool-library.js');
test('v127f: catálogo activo completo puede generar fichas CAD sin certificar herramientas',()=>{
 const all=CAD.all();
 assert.equal(all.length,L.PUNCHES.length+L.DIES.length);
 assert.ok(all.length>=237);
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 for(const item of all){
  assert.equal(item.verified,false);
  assert.equal(item.approvedForCNC,false);
  assert.match(item.status,/PENDIENTE DE VERIFICACIÓN/);
  assert.ok(item.dimensions.length>0);
  assert.ok(item.dimensions.every(x=>['impresa','supuesto'].includes(x.origin)));
  assert.equal(item.checks.some(x=>x.id==='vértices-finitos'),true);
  assert.ok(item.points.length>=3);
  assert.ok(item.points.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
 }
});
test('DXF ASCII usa mm, perfil cerrado y aviso de no fabricación',()=>{
 const rec=CAD.build(L.get('punch','wila-p-15.700'));
 const txt=CAD.dxf(rec),lines=txt.trim().split('\n');
 assert.equal(lines.at(-1),'EOF');
 assert.ok(txt.includes('LWPOLYLINE'));
 assert.ok(txt.includes('$INSUNITS'));
 assert.ok(txt.includes('NO CNC'));
 assert.ok(txt.includes('PERFIL'));
 assert.ok(!/[^\x00-\x7f]/.test(txt));
 assert.ok(rec.assumedCount>0,'No ocultar transiciones aproximadas');
});
test('SVG acotado y ficha JSON distinguen cotas supuestas y fuentes',()=>{
 const rec=CAD.build(L.get('die','wila-d-25.407'));
 const svg=CAD.svg(rec);
 assert.match(svg,/<svg/);assert.match(svg,/NO CNC/);
 assert.match(svg,/PENDIENTE DE VERIFICACIÓN/);
 assert.match(svg,/mm/);assert.match(svg,/supuesto/);
 const out=UI.contents(rec,'json');
 assert.equal(out.mime,'application/json;charset=utf-8');
 const json=JSON.parse(out.body);
 assert.equal(json.verified,false);assert.equal(json.approvedForCNC,false);
 assert.ok(json.dimensions.some(x=>x.origin==='supuesto'));
 assert.equal(UI.filename(rec,'dxf'),'wila-d-25.407_RECONSTRUIDO_NO_CNC.dxf');
 assert.throws(()=>UI.contents(rec,'exe'),/Formato/);
});
test('los perfiles autocruzados, inválidos y ajenos al catálogo no se certifican',()=>{
 assert.ok(CAD.selfIntersections([{x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}]).length>0);
 assert.throws(()=>CAD.build({kind:'punch',id:'no-registro'}));
 const csv=CAD.indexCsv(CAD.all());
 assert.equal(csv.trim().split('\n').length,L.PUNCHES.length+L.DIES.length+1);
});
