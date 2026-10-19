'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cad=require('../cad-profile.js');
const head=(unit=4)=>`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${unit}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
const end='0\nENDSEC\n0\nEOF\n';
const arc=(angleStart,angleEnd,r=10)=>`0\nARC\n8\nCURVAS\n10\n0\n20\n0\n40\n${r}\n50\n${angleStart}\n51\n${angleEnd}\n`;
const circle=(r=7)=>`0\nCIRCLE\n8\nAGUJEROS\n10\n30\n20\n20\n40\n${r}\n`;
const lw=(bulge,closed=false)=>`0\nLWPOLYLINE\n8\nTANGENTES\n90\n${closed?3:2}\n70\n${closed?1:0}\n10\n0\n20\n0\n42\n${bulge}\n10\n20\n20\n0\n${closed?'10\n20\n20\n20\n':''}`;
const approx=(a,b,tol=0.08)=>assert.ok(Math.abs(a-b)<tol,`Medida ${a}, esperada ${b} (±${tol})`);
test('ARC 0 a 90 tiene medidas XY y longitud analítica correctas',()=>{
 const d=cad.parseDocument(head()+arc(0,90)+end);const e=d.contours[0];
 assert.equal(e.kind,'ARC');assert.equal(e.closed,false);assert.equal(e.arcCount,1);
 approx(e.bounds.width,10);approx(e.bounds.height,10);approx(e.bounds.length,Math.PI*5,1e-10);
 assert.equal(d.activeInSimulation,false);assert.ok(e.points.length>6);
});
test('ARC cruza 0 grados y aplica unidades de pulgadas',()=>{
 const d=cad.parseDocument(head(1)+arc(350,20,1)+end);const e=d.contours[0];
 approx(e.bounds.length,Math.PI*25.4/6,1e-8);
 assert.equal(d.assumedUnits,false);
});
test('CIRCLE cerrado: diámetro y perímetro, no genera entidad CNC',()=>{
 const d=cad.parseDocument(head()+circle(7)+end);const e=d.contours[0];
 assert.equal(e.closed,true);approx(e.bounds.width,14);approx(e.bounds.height,14);
 approx(e.bounds.length,14*Math.PI,1e-8);
 assert.equal(d.verified,false);assert.equal(e.activeInSimulation,false);
});
test('LWPOLYLINE bulge semicircular calcula perímetro analítico',()=>{
 const d=cad.parseDocument(head()+lw(1)+end);const e=d.contours[0];
 assert.equal(e.arcCount,1);approx(e.bounds.length,10*Math.PI,1e-8);
 approx(e.bounds.width,20);approx(e.bounds.height,10);
});
test('LWPOLYLINE bulge negativo produce arco opuesto',()=>{
 const a=cad.parseDocument(head()+lw(1)+end).contours[0];
 const b=cad.parseDocument(head()+lw(-1)+end).contours[0];
 assert.ok(Math.abs(a.bounds.minY+b.bounds.maxY)<1e-7);
 assert.ok(a.bounds.minY<0 && b.bounds.maxY>0);
});
test('DXF ejemplo contiene varias capas, arcos y círculo',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../EJEMPLO_ARCOS_CAPAS.dxf'),'utf8');
 const d=cad.parseDocument(s);assert.deepEqual(d.layers,['PERFIL_BULGE','RADIO_INDEPENDIENTE','TALADRO_REFERENCIA']);
 assert.equal(d.contours.length,3);assert.equal(d.contours[0].closed,true);
});
test('rechaza elevaciones, radios inválidos, barrido nulo y polyline corrupta',()=>{
 assert.throws(()=>cad.parseDocument(head()+arc(0,90,-5)+end),/Arco DXF/);
 assert.throws(()=>cad.parseDocument(head()+arc(35,35)+end),/barrido nulo/);
 assert.throws(()=>cad.parseDocument(head()+arc(0,90).replace('40\n10','30\n2\n40\n10')+end),/plano XY/);
 assert.throws(()=>cad.parseDocument(head()+lw(1).replace('90\n2','90\n3')+end),/vértices no coincide/);
 assert.throws(()=>cad.parseDocument(head()+lw(1)+'42\n1\n'+end),/último vértice/);
});
test('informe exporta cotas, marca no verificado y neutraliza fórmulas en CSV',()=>{
 const d=cad.parseDocument(head()+arc(0,90)+circle()+end);
 const r=cad.report(d,{fileName:'=HYPERLINK("mal")'});
 assert.equal(r.verificado,false);assert.equal(r.activado_en_simulacion,false);assert.equal(r.total_entidades,2);
 approx(r.elementos[0].medidas.longitud_mm,Math.PI*5,1e-8);
 const csv=cad.reportCSV(r);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=HYPERLINK"));
 assert.ok(csv.includes('PROHIBIDO'));assert.ok(csv.includes('SIN VERIFICAR'));
});
