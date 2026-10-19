const {test}=require('node:test');
const assert=require('node:assert/strict');
const CAD=require('../cad-profile.js');
const REF=require('../manufacturer-references.js');
const make=({unit=4,vertices=[[0,0],[20,0],[20,60],[0,60]],closed=true,extra='',entity='LWPOLYLINE',extraEntity='',header=true}={})=>{
 const head=header?`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${unit}\n0\nENDSEC\n`:'';
 const points=vertices.map(([x,y])=>`10\n${x}\n20\n${y}\n`).join('');
 return `${head}0\nSECTION\n2\nENTITIES\n0\n${entity}\n90\n${vertices.length}\n70\n${closed?1:0}\n${extraEntity}${points}${extra}0\nENDSEC\n0\nEOF\n`;
};
test('DXF mm cerrado: cotas, longitud, sin incorporación en simulación',()=>{
 const p=CAD.parse(make());assert.equal(p.units,'milímetros');assert.equal(p.bounds.width,20);assert.equal(p.bounds.height,60);
 assert.equal(p.bounds.length,160);assert.equal(p.closed,true);assert.equal(p.verified,false);assert.equal(p.activeInSimulation,false);
});
test('DXF en pulgadas reescala las cotas a milímetros',()=>{
 const p=CAD.parse(make({unit:1,vertices:[[0,0],[1,0],[1,2],[0,2]]}));
 assert.ok(Math.abs(p.bounds.width-25.4)<1e-9);assert.ok(Math.abs(p.bounds.height-50.8)<1e-9);
});
test('DXF sin unidades exige selección manual explícita',()=>{
 assert.throws(()=>CAD.parse(make({header:false})),/\$INSUNITS/);
 const p=CAD.parse(make({header:false}),{unitsOverride:4});assert.equal(p.assumedUnits,true);
});
test('Rechaza arcos bulge y ancho de polilínea',()=>{
 assert.throws(()=>CAD.parse(make({extraEntity:'42\n0.3\n'})),/bulges/);
 assert.throws(()=>CAD.parse(make({extra:'43\n1\n'})),/anchos/);
});
test('Rechaza doble contorno, spline y otros DXF complejos',()=>{
 const base=make();assert.throws(()=>CAD.parse(base.replace('0\nENDSEC\n0\nEOF','0\nCIRCLE\n10\n0\n20\n0\n40\n3\n0\nENDSEC\n0\nEOF')),/CIRCLE/);
 assert.throws(()=>CAD.parse(base.replace('0\nENDSEC\n0\nEOF',`0\nLWPOLYLINE\n90\n2\n10\n0\n20\n0\n10\n10\n20\n0\n0\nENDSEC\n0\nEOF`)),/exactamente una/);
});
test('Rechaza autointersecciones, puntos repetidos y cantidad declarada incorrecta',()=>{
 assert.throws(()=>CAD.parse(make({vertices:[[0,0],[20,20],[0,20],[20,0]]})),/Autointersección/);
 assert.throws(()=>CAD.parse(make({vertices:[[0,0],[0,0],[20,5],[10,20]]})),/longitud cero/);
 assert.throws(()=>CAD.parse(make().replace('90\n4','90\n5')),/no coincide/);
});
test('Unidades no compatibles, binarios y archivos grandes dan error',()=>{
 assert.throws(()=>CAD.parse(make({unit:0})),/\$INSUNITS/);
 assert.throws(()=>CAD.parse('AutoCAD Binary DXF\u0000'),/DXF ASCII/);
 assert.throws(()=>CAD.parse('z'.repeat(CAD.MAX_BYTES+1)),/demasiado grande/);
});
test('DXF abierto válido y cerrados con vértice repetido',()=>{
 const open=CAD.parse(make({closed:false,vertices:[[0,0],[5,0],[10,10]]}));assert.equal(open.closed,false);
 const closed=CAD.parse(make({vertices:[[0,0],[20,0],[20,60],[0,60],[0,0]]}));assert.equal(closed.points.length,4);
});
test('Comparación dimensional AMADA nunca marca una herramienta como validada',()=>{
 const p=CAD.parse(make());const r=REF.get('amada-newafh-v16-88-835');
 const c=CAD.compareBounds(p,r);assert.equal(c.heightMatch,true);assert.equal(c.widthMatch,true);assert.equal(c.verified,false);
 const other=CAD.compareBounds(p,REF.get('amada-mt508-v8-30-415'));assert.equal(other.heightMatch,false);
 assert.throws(()=>CAD.compareBounds(p,r,{tolerance:-1}),/no válidos/);
});
