'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../machine-references.js');

test('Ficha 2006: se registran solamente medidas publicadas y trazables',()=>{
 const r=M.reference;
 assert.equal(r.manufacturer,'Bystronic');
 assert.equal(r.model,'EP II 31-100');
 assert.equal(r.year,2006);
 assert.equal(r.forceTonnes,100);
 assert.equal(r.bendingLengthMm,3100);
 assert.equal(r.betweenUprightsMm,2550);
 assert.equal(r.throatDepthMm,400);
 assert.equal(r.tableTopHeightFromFloorMm,925);
 assert.equal(r.ramStrokeMm,200);
 assert.equal(r.geometry.tableLeft,null);
 assert.equal(r.geometry.tableRight,null);
 assert.equal(r.geometry.ramWidth,null);
 assert.equal(r.geometry.ramBottomOffset,null);
 assert.equal(r.geometry.tableSectionWidth,null);
 assert.equal(r.geometry.ramSectionDepth,null);
 assert.match(r.source.url,/bystronic-ep-ii-31-100/);
 assert.match(r.source.type,/NO oficial/);
});

test('Mesa 925 mm y carrera 200 mm nunca se convierten en anchura de colisión',()=>{
 const r=M.reference;
 assert.notEqual(r.tableTopHeightFromFloorMm,r.geometry.tableLeft);
 assert.notEqual(r.ramStrokeMm,r.geometry.ramWidth);
 assert.ok(M.html().includes('200 mm son carrera'));
 assert.ok(M.html().includes('NO son la altura de matriz'));
 assert.ok(M.html().includes('Confirmar placa'));
 assert.throws(()=>M.validateMachineRef({...r,geometry:{...r.geometry,ramWidth:200}}),/no medidas/i);
});

test('Ficha de fábrica sigue sin cotas inferidas aunque se muestren medidas introducidas',()=>{
 const setup={dieHeight:60,tableLeft:180,tableRight:160,ramWidth:95,ramBottomOffset:110};
 const html=M.html(setup);
 for(const [key,value] of Object.entries(setup)){
  assert.match(html,new RegExp('data-machine-measure="'+key+'" value="'+value+'"'));
 }
 assert.equal(M.reference.geometry.ramWidth,null);
 assert.equal(M.reference.geometry.tableLeft,null);
 assert.ok(M.html().includes('placeholder="Sin medir"'));
 assert.ok(M.html().includes('no se validan')||M.html().includes('NO prueban'));
 assert.ok(html.includes('Guardar medidas en el programa activo'));
});
test('Los campos no muestran cotas malformadas ni valores no finitos',()=>{
 const html=M.html({tableLeft:'<script>',ramWidth:Infinity,dieHeight:NaN});
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/data-machine-measure="tableLeft" value=""/);
 assert.match(html,/data-machine-measure="ramWidth" value=""/);
 assert.match(html,/data-machine-measure="dieHeight" value=""/);
});
