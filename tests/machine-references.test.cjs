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
