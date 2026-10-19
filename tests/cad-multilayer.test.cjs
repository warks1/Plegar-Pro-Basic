const {test}=require('node:test');
const assert=require('node:assert/strict');
const CAD=require('../cad-profile.js');
const head=(u=4)=>`0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n${u}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
const end='0\nENDSEC\n0\nEOF\n';
const lw=(layer,ps,closed=true)=>`0\nLWPOLYLINE\n8\n${layer}\n90\n${ps.length}\n70\n${closed?1:0}\n${ps.map(p=>`10\n${p[0]}\n20\n${p[1]}\n`).join('')}`;
const line=(layer,x1,y1,x2,y2)=>`0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
test('varios contornos en distintas capas, orden intacto y total de cotas',()=>{
 const d=CAD.parseDocument(head()+lw('PUNZON',[[0,0],[30,0],[30,120],[0,120]])+lw('MATRIZ',[[50,0],[90,0],[90,60],[50,60]])+end);
 assert.equal(d.contours.length,2);assert.deepEqual(d.layers,['PUNZON','MATRIZ']);
 assert.deepEqual([d.bounds.width,d.bounds.height],[90,120]);assert.equal(d.points,8);
 assert.equal(d.contours[0].bounds.width,30);assert.equal(d.contours[1].layer,'MATRIZ');
 assert.equal(d.verified,false);assert.equal(d.activeInSimulation,false);
});
test('admite LINE en capas y respeta cotas de pulgadas',()=>{
 const d=CAD.parseDocument(head(1)+line('A',0,0,2,0)+line('B',1,1,1,3)+end);
 assert.equal(d.contours[0].kind,'LINE');assert.ok(Math.abs(d.bounds.width-50.8)<1e-9);
 assert.equal(d.contours[1].closed,false);assert.equal(d.layers.length,2);
});
test('la API antigua sigue rechazando varios contornos',()=>{
 const d=head()+line('A',0,0,1,0)+line('B',0,0,0,1)+end;
 assert.throws(()=>CAD.parse(d),/exactamente una/);
});
test('rechaza INSERT y ARC en vez de saltarlos silenciosamente',()=>{
 assert.throws(()=>CAD.parseDocument(head()+line('A',0,0,1,0)+'0\nINSERT\n2\nA\n'+end),/INSERT/);
 assert.throws(()=>CAD.parseDocument(head()+lw('A',[[0,0],[1,0],[1,1]])+'0\nARC\n'+end),/ARC/);
});
test('rechaza entidades con elevación fuera de plano y líneas sin extremo',()=>{
 assert.throws(()=>CAD.parseDocument(head()+line('A',0,0,1,0).replace('11\n1','30\n3\n11\n1')+end),/elevación/);
 assert.throws(()=>CAD.parseDocument(head()+'0\nLINE\n10\n0\n20\n0\n'+end),/fin X/);
});
test('unidades requeridas y override manual se aplican a todos los contornos',()=>{
 const missing='0\nSECTION\n2\nENTITIES\n'+lw('A',[[0,0],[2,0],[2,2]])+end;
 assert.throws(()=>CAD.parseDocument(missing),/INSUNITS/);
 const d=CAD.parseDocument(missing,{unitsOverride:5});assert.equal(d.bounds.width,20);assert.equal(d.assumedUnits,true);
});
test('rechaza demasiados elementos y nombre de capa malformado',()=>{
 const many=head()+line('A',0,0,1,0).repeat(101)+end;
 assert.throws(()=>CAD.parseDocument(many),/100/);
 assert.throws(()=>CAD.parseDocument(head()+line('A\tBAD',0,0,1,0)+end),/capa/);
});
test('no permite puntos degenerados ni varios polígonos que se corten? Aislados son visibles',()=>{
 const d=CAD.parseDocument(head()+lw('1',[[0,0],[3,0],[3,3]])+lw('2',[[0,0],[4,0],[4,4]])+end);
 assert.equal(d.contours.length,2);assert.equal(d.contours[0].verified,false);
});
test('DXF de ejemplo se lee con tres capas e importación inactiva',()=>{
 const fs=require('node:fs');const path=require('node:path');
 const raw=fs.readFileSync(path.join(__dirname,'..','EJEMPLO_PERFIL_MULTICAPA.dxf'),'utf8');
 const d=CAD.parseDocument(raw);
 assert.equal(d.layers.length,3);assert.equal(d.contours.length,3);
 assert.equal(d.contours[0].bounds.height,120);
 assert.equal(d.contours[2].kind,'LINE');
 assert.equal(d.activeInSimulation,false);
});
