'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const V=require('../tool-dxf-3d.js');
const D=require('../tool-dxf-import.js');
const rows=a=>a.map(([k,v])=>k+'\n'+v).join('\n')+'\n';
const outlines=(loops)=>{
 const out=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,4],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES']];
 for(const points of loops){
  out.push([0,'LWPOLYLINE'],[90,points.length],[70,1]);
  for(const [x,y] of points)out.push([10,x],[20,y]);
 }
 out.push([0,'ENDSEC'],[0,'EOF']);return rows(out);
};
const outer=[[0,0],[100,0],[100,120],[0,120]],hole=[[25,25],[45,25],[45,50],[25,50]];
function record({lengthMm=835,code='V24',holes=true}={}){
 const p=D.parseDXF(outlines(holes?[outer,hole]:[outer]));
 return {id:'local-abcdefghijkl',brand:'MECOS',code,kind:'die',name:'Matriz de ensayo',
  lengthMm,points:p.points,holes:p.holes,bounds:p.bounds,areaMm2:p.areaMm2,
  geometryCertified:false,collisionApproved:false,simulatable:false};
}
test('Visor 3D mantiene el largo axial medido como profundidad geométrica',()=>{
 const r=record(),m=V.data(r);
 assert.equal(m.lengthKnown,true);
 assert.equal(m.zLength,835);
 assert.equal(m.holeCount,1);
 assert.equal(m.vertexCount,16);
 assert.equal(m.approvedForCNC,false);
 const p=V.projection(m,{yaw:32,pitch:22,zoom:1});
 assert.ok(p.scale>0,'Escala '+String(p.scale)+'; envolvente='+JSON.stringify(p.extrema)+'; bounds='+JSON.stringify(m.bounds)+'; z='+m.zLength+'; camera='+JSON.stringify(p.camera)+'; vertices='+JSON.stringify(m.loops.slice(0,2)));
 assert.ok(p.faces.some(x=>x.kind==='cap-front'));
 assert.ok(p.faces.some(x=>x.kind==='outer-wall'));
 assert.ok(p.faces.some(x=>x.kind==='hole-wall'));
 const image=V.render(r,{yaw:32,pitch:22,zoom:1});
 assert.match(image,/L axial 835 mm/);
 assert.match(image,/data-3d-face="hole-wall"/);
 assert.match(image,/fill-rule="evenodd"/);
 assert.match(image,/SIN VERIFICAR/);
});
test('Con largo axial desconocido utiliza referencia visual sin inventar medidas documentadas',()=>{
 const r=record({lengthMm:null}),m=V.data(r);
 assert.equal(m.lengthKnown,false);
 assert.ok(m.zLength>0);
 const image=V.render(r,{yaw:20,pitch:25});
 assert.match(image,/LONGITUD AXIAL DESCONOCIDA/);
 assert.doesNotMatch(image,/L axial [0-9]+ mm \(declarada/);
});
test('Cámara interactiva es determinista y acota zoom, giro y elevación',()=>{
 const r=record(),a=V.render(r,{yaw:32,pitch:22,zoom:1});
 const b=V.render(r,{yaw:80,pitch:5,zoom:1});
 assert.notEqual(a,b);
 assert.deepEqual(V.options({yaw:-10,pitch:95,zoom:100}),{yaw:350,pitch:80,zoom:3.5});
 assert.deepEqual(V.options({yaw:360,pitch:-99,zoom:.01}),{yaw:0,pitch:-80,zoom:.35});
 assert.throws(()=>V.options({yaw:NaN}),/cámara/);
 assert.throws(()=>V.options({zoom:Infinity}),/cámara/);
});
test('Vista vectorial 3D escapa códigos y no añade geometría inexistente',()=>{
 const r=record({code:'<script>inesperado</script>',holes:false});
 const svg=V.render(r);
 assert.doesNotMatch(svg,/<script>/);
 assert.match(svg,/&lt;script&gt;/);
 assert.doesNotMatch(svg,/data-3d-face="hole-wall"/);
 assert.throws(()=>V.data({...r,bounds:{...r.bounds,width:-2}}),/Cotas/);
 assert.throws(()=>V.data({...r,holes:null}),/incompleta/);
});
