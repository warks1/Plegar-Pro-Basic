'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const storage=new Map();
global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const D=require('../tool-dxf-import.js');
const pairs=(list)=>list.map(([code,value])=>code+'\n'+value).join('\n')+'\n';
const rect=[[0,0],[100,0],[100,150],[0,150]];
function dxf({units=4,points=rect,closed=true,bulge=false,extra=[]}={}){
 const rows=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,units],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES'],[0,'LWPOLYLINE'],[90,points.length],[70,closed?1:0]];
 for(const [x,y] of points){rows.push([10,x],[20,y]);if(bulge)rows.push([42,.4142]);}
 rows.push(...extra,[0,'ENDSEC'],[0,'EOF']);
 return pairs(rows);
}
test('Lee DXF cerrado en mm y mantiene dimensiones métricas y contorno sin reescalar',()=>{
 const model=D.parseDXF(dxf());
 assert.equal(model.bounds.width,100);
 assert.equal(model.bounds.height,150);
 assert.equal(model.areaMm2,15000);
 assert.equal(model.points.length,4);
 assert.equal(model.unitsDeclared,true);
 assert.equal(model.geometryCertified,false);
 assert.equal(model.collisionApproved,false);
});
test('Rechaza cotas no declaradas, pulgadas y curvas sin linealización',()=>{
 assert.throws(()=>D.parseDXF(dxf({units:0})),/sin unidades/i);
 assert.equal(D.parseDXF(dxf({units:0}),{confirmUnitlessMm:true}).unitsDeclared,false);
 assert.throws(()=>D.parseDXF(dxf({units:1})),/milímetros/);
 const rounded=D.parseDXF(dxf({bulge:true}));
 assert.equal(rounded.arcCount,4);
 assert.equal(rounded.chordErrorMm,.05);
 assert.ok(rounded.points.length>4,'Los arcos DXF generan vértices de precisión controlada');
 assert.equal(rounded.collisionApproved,false);
 assert.throws(()=>D.parseDXF(dxf({closed:false})),/cerrada/);
 assert.throws(()=>D.parseDXF(dxf({extra:[[0,'CIRCLE'],[10,0],[20,0],[40,2]]})),/entidades geométricas no soportadas/);
 assert.throws(()=>D.parseDXF(dxf({points:[[0,0],[10,10],[0,10],[10,0]]})),/autointersecado/);
 assert.throws(()=>D.parseDXF(dxf({points:[[0,0],[1000000,0],[1000000,3],[0,3]]})),/fuera de rango/);
});
test('Almacena perfiles propios localmente sin atribuir certificado CAD ni habilitar colisiones',()=>{
 const record=D.add({brand:'AMADA',kind:'punch',code:'PT-TEST-2026',name:'Punzón recto importado',lengthMm:835,sourceFile:'perfil.dxf'},dxf());
 assert.ok(record.id.startsWith('local-'));
 assert.equal(record.lengthMm,835);
 assert.equal(record.bounds.width,100);
 assert.equal(record.geometryCertified,false);
 assert.equal(record.simulatable,false);
 assert.equal(D.read().length,1);
 const view=D.render(record,'2d'),solid=D.render(record,'3d');
 assert.match(view,/Sección: 100 × 150 mm/);
 assert.match(view,/ESCALA MÉTRICA/);
 assert.match(solid,/EXTRUSIÓN VISUAL/);
 assert.notEqual(view,solid);
 assert.match(D.html(),/LWPOLYLINE o POLYLINE\/VERTEX/);
 assert.ok(D.remove(record.id));
 assert.equal(D.read().length,0);
});
test('No permite inyectar HTML ni registrar marcas ajenas, datos corruptos o cargas de riesgo',()=>{
 assert.throws(()=>D.add({brand:'XYZ',kind:'die',code:'V10',name:'<script>'},dxf()),/Marca/);
 assert.throws(()=>D.add({brand:'Bystronic',kind:'die',code:'V10',name:'matriz',lengthMm:-5},dxf()),/Longitud/);
 const r=D.add({brand:'MECOS',kind:'die',code:'<script>',name:'V de prueba'},dxf());
 assert.doesNotMatch(D.render(r,'2d'),/<script>/);
 assert.throws(()=>D.render(r,'interactive'),/Vista incorrecta/);
 assert.ok(D.remove(r.id));
});

test('Importa un semicírculo DXF con bulge=1 sin convertirlo en una recta',()=>{
 const outline=dxf({points:[[0,0],[40,0],[40,40],[0,40]]});
 // Añadir el bulge al primer vértice justo después del par (10,20).
 const needle='10\n0\n20\n0\n10\n40';
 assert.ok(outline.includes(needle));
 const curved=outline.replace(needle,'10\n0\n20\n0\n42\n1\n10\n40');
 const model=D.parseDXF(curved);
 assert.equal(model.arcCount,1);
 assert.equal(model.bounds.width,40);
 assert.ok(Math.abs(model.bounds.height-60)<.1,'Semicírculo aporta profundidad de 20 mm en lugar de lado recto');
 assert.ok(model.points.length>15);
 assert.ok(model.points.length<=400);
 assert.equal(model.geometryCertified,false);
});
test('Se detiene ante bulges no finitos y curvas desmesuradas, sin dibujar geometría incorrecta',()=>{
 const d=dxf({points:[[0,0],[40,0],[40,40],[0,40]]});
 assert.throws(()=>D.parseDXF(d.replace('10\n0\n20\n0','10\n0\n20\n0\n42\nno-es-numero')),/Bulge DXF no válido/);
 assert.throws(()=>D.parseDXF(d.replace('10\n0\n20\n0','10\n0\n20\n0\n42\n999999')),/Bulge DXF no válido/);
});

function classic({flags=1,points=rect,bulge=0,z=0,vertexFlag=0,ending=true,extra=[]}={}){
 const rows=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,4],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES'],[0,'POLYLINE'],[66,1],[70,flags],[10,0],[20,0],[30,0]];
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i];
  rows.push([0,'VERTEX'],[10,x],[20,y],[30,z],[70,vertexFlag]);
  if(i===0&&bulge)rows.push([42,bulge]);
 }
 if(ending)rows.push([0,'SEQEND']);
 rows.push(...extra,[0,'ENDSEC'],[0,'EOF']);
 return pairs(rows);
}
test('Importa POLYLINE clásica en mm y dibuja el mismo perfil que LWPOLYLINE',()=>{
 const old=D.parseDXF(classic()),modern=D.parseDXF(dxf());
 assert.equal(old.sourceFormat,'DXF ASCII POLYLINE');
 assert.equal(old.bounds.width,100);
 assert.equal(old.bounds.height,150);
 assert.deepEqual(old.points,modern.points);
 assert.equal(old.geometryCertified,false);
 const record=D.add({brand:'MECOS',kind:'die',code:'V-CLASICO',name:'Sección clásica'},classic());
 assert.equal(record.sourceFormat,'DXF ASCII POLYLINE');
 assert.equal(D.read()[0].sourceFormat,'DXF ASCII POLYLINE');
 assert.match(D.render(record,'2d'),/Sección: 100 × 150 mm/);
 assert.ok(D.remove(record.id));
});
test('POLYLINE clásica con arco circular conserva radio sin sustituirlo por línea recta',()=>{
 const r=D.parseDXF(classic({points:[[0,0],[40,0],[40,40],[0,40]],bulge:1}));
 assert.equal(r.arcCount,1);
 assert.equal(r.chordErrorMm,.05);
 assert.ok(r.points.length>15);
 assert.ok(Math.abs(r.bounds.height-60)<.1);
 assert.equal(r.collisionApproved,false);
});
test('POLYLINE clásica rechaza mallas, elevaciones, vertices spline o seqend ausente',()=>{
 assert.throws(()=>D.parseDXF(classic({flags:8})),/3D, malla/);
 assert.throws(()=>D.parseDXF(classic({vertexFlag:32})),/VERTEX 3D/);
 assert.throws(()=>D.parseDXF(classic({z:2})),/fuera del plano/);
 assert.throws(()=>D.parseDXF(classic({ending:false})),/sin SEQEND/);
 assert.throws(()=>D.parseDXF(classic({flags:0,points:rect})),/cerrada/);
 assert.throws(()=>D.parseDXF(classic({extra:[[0,'INSERT'],[2,'extra']]})),/entidades geométricas no soportadas/);
 const bad=classic().replace('0\nPOLYLINE\n66','0\nPOLYLINE\n230\n-1\n66');
 assert.throws(()=>D.parseDXF(bad),/inclinada/);
});

test('Copia JSON guarda y recupera perfiles locales sin activar colisiones',()=>{
 const first=D.add({brand:'AMADA',kind:'punch',code:'COPIA-P',name:'Punzón de prueba'},dxf());
 const second=D.add({brand:'MECOS',kind:'die',code:'COPIA-V',name:'Matriz de prueba'},dxf({points:[[0,0],[24,0],[24,80],[0,80]]}));
 const saved=D.exportBackup(),source=JSON.parse(saved);
 assert.equal(source.format,'plegar-pro-tool-profiles');
 assert.equal(source.version,1);
 assert.equal(source.profiles.length,2);
 assert.equal(source.profiles[0].collisionApproved,false);
 D.remove(first.id);D.remove(second.id);
 assert.equal(D.read().length,0);
 const restored=D.importBackup(saved);
 assert.deepEqual(restored,{added:2,total:2});
 assert.equal(D.read().find(r=>r.id===first.id).bounds.height,150);
 assert.equal(D.read().find(r=>r.id===second.id).bounds.width,24);
 assert.ok(D.read().every(r=>!r.geometryCertified&&!r.collisionApproved&&!r.simulatable));
 assert.deepEqual(D.importBackup(saved),{added:0,total:2},'Una copia repetida no duplica perfiles');
 D.remove(first.id);D.remove(second.id);
});
test('Copia corrupta o colisionada se rechaza por completo sin perder los perfiles actuales',()=>{
 const base=D.add({brand:'EUROSTAMP',kind:'punch',code:'C001',name:'Prueba'},dxf());
 const previous=D.read().map(r=>r.id);
 const backup=JSON.parse(D.exportBackup());
 assert.throws(()=>D.importBackup('{broken'),/JSON/);
 assert.throws(()=>D.importBackup(JSON.stringify({...backup,format:'otro'})),/Formato/);
 const altered=structuredClone(backup);
 altered.profiles[0].points[1].x+=10;
 assert.throws(()=>D.importBackup(JSON.stringify(altered)),/identificador ya existente/);
 assert.deepEqual(D.read().map(r=>r.id),previous);
 const corrupted=structuredClone(backup);
 corrupted.profiles[0].points[2].x=1000000;
 assert.throws(()=>D.importBackup(JSON.stringify(corrupted)),/Coordenada/);
 assert.deepEqual(D.read().map(r=>r.id),previous);
 const duplicated=structuredClone(backup);
 duplicated.profiles.push(duplicated.profiles[0]);
 assert.throws(()=>D.importBackup(JSON.stringify(duplicated)),/duplicados/);
 assert.deepEqual(D.read().map(r=>r.id),previous);
 D.remove(base.id);
});
test('La importación de copias anula certificaciones falsas y respeta el formato DXF',()=>{
 const record=D.add({brand:'Bystronic',kind:'die',code:'TEST',name:'Local'},dxf());
 const backup=JSON.parse(D.exportBackup());
 backup.profiles[0].geometryCertified=true;
 backup.profiles[0].collisionApproved=true;
 backup.profiles[0].simulatable=true;
 D.remove(record.id);
 const restored=D.importBackup(JSON.stringify(backup));
 assert.equal(restored.added,1);
 assert.equal(D.read()[0].geometryCertified,false);
 assert.equal(D.read()[0].collisionApproved,false);
 assert.equal(D.read()[0].simulatable,false);
 assert.equal(D.read()[0].sourceFormat,'DXF ASCII LWPOLYLINE');
 D.remove(record.id);
});


const outerSection=[[0,0],[100,0],[100,120],[0,120]];
function multi(loops,{mixed=false}={}){
 const rows=[[0,'SECTION'],[2,'HEADER'],[9,'$INSUNITS'],[70,4],[0,'ENDSEC'],
  [0,'SECTION'],[2,'ENTITIES']];
 for(let k=0;k<loops.length;k++){
  const {points,bulge=0}=loops[k];
  if(mixed&&k%2===1){
   rows.push([0,'POLYLINE'],[66,1],[70,1],[30,0]);
   for(let i=0;i<points.length;i++){
    const [x,y]=points[i];rows.push([0,'VERTEX'],[10,x],[20,y],[30,0]);
    if(i===0&&bulge)rows.push([42,bulge]);
   }
   rows.push([0,'SEQEND']);
  }else{
   rows.push([0,'LWPOLYLINE'],[90,points.length],[70,1]);
   for(let i=0;i<points.length;i++){
    const [x,y]=points[i];rows.push([10,x],[20,y]);
    if(i===0&&bulge)rows.push([42,bulge]);
   }
  }
 }
 rows.push([0,'ENDSEC'],[0,'EOF']);
 return pairs(rows);
}
test('Dos contornos DXF se reconocen como exterior y hueco sin sumar materia ficticia',()=>{
 const hole=[[25,25],[45,25],[45,50],[25,50]];
 const file=multi([{points:hole},{points:outerSection}]);
 const r=D.parseDXF(file);
 assert.equal(r.holeCount,1);
 assert.equal(r.holes.length,1);
 assert.equal(r.areaMm2,11500);
 assert.equal(r.bounds.width,100);
 assert.equal(r.bounds.height,120);
 assert.equal(r.collisionApproved,false);
 const imported=D.add({brand:'Bystronic',kind:'die',code:'M-RECT-HUECO',name:'Matriz con vacío de prueba'},file);
 assert.equal(imported.holeCount,1);
 assert.match(D.render(imported,'2d'),/fill-rule="evenodd"/);
 assert.match(D.render(imported,'2d'),/Huecos: 1/);
 assert.match(D.render(imported,'3d'),/Huecos: 1/);
 const path=D.render(imported,'2d').match(/data-dxf-profile="[^"]+" d="([^"]+)"/)[1];
 assert.equal((path.match(/M/g)||[]).length,2,'Dos subtrayectorias SVG para una pieza hueca');
 assert.equal(D.read()[0].holes[0][0].x,25);
 assert.ok(D.remove(imported.id));
});
test('Contornos mixtos DXF R12 y LWPOLYLINE admiten dos huecos sin islas ficticias',()=>{
 const inside1=[[12,12],[30,12],[30,25],[12,25]];
 const inside2=[[60,70],[78,70],[78,85],[60,85]];
 const r=D.parseDXF(multi([{points:inside1},{points:outerSection},{points:inside2}],{mixed:true}));
 assert.equal(r.holeCount,2);
 assert.equal(r.areaMm2,12000-234-270);
 assert.match(r.sourceFormat,/POLYLINE/);
 assert.ok(r.holes.every(c=>c.length===4));
});
test('Rechaza disjuntos, huecos salientes, solapados y anidados sin guardar',()=>{
 const outside=[[150,150],[180,150],[180,170],[150,170]];
 const inside=[[25,25],[45,25],[45,50],[25,50]];
 const overlap=[[38,35],[55,35],[55,60],[38,60]];
 const nested=[[29,29],[34,29],[34,32],[29,32]];
 const protrude=[[95,95],[110,95],[110,110],[95,110]];
 for(const second of [outside,protrude]){
  assert.throws(()=>D.parseDXF(multi([{points:outerSection},{points:second}])),/hueco/i);
 }
 for(const second of [overlap,nested]){
  assert.throws(()=>D.parseDXF(multi([{points:outerSection},{points:inside},{points:second}])),/Huecos/);
 }
 assert.throws(()=>D.parseDXF(multi(new Array(10).fill(null).map((_,i)=>({
  points:i===0?outerSection:[[2+i*6,2],[4+i*6,2],[4+i*6,4],[2+i*6,4]]
 })))),/Máximo/);
});
test('Copia JSON conserva huecos y rehúsa reutilizar ID con cavidad diferente',()=>{
 const file=multi([{points:outerSection},{points:[[25,25],[45,25],[45,50],[25,50]]}]);
 const added=D.add({brand:'MECOS',kind:'die',code:'TEST-HUECO',name:'Sección con cavidad'},file);
 const original=D.exportBackup();
 const broken=JSON.parse(original);
 broken.profiles[0].holes[0][0].x=26;
 assert.throws(()=>D.importBackup(JSON.stringify(broken)),/identificador ya existente/);
 assert.deepEqual(D.importBackup(original),{added:0,total:1});
 assert.equal(D.read()[0].areaMm2,11500);
 D.remove(added.id);
 assert.deepEqual(D.importBackup(original),{added:1,total:1});
 assert.equal(D.read()[0].holes.length,1);
 assert.equal(D.read()[0].collisionApproved,false);
 D.remove(added.id);
});
test('Perfiles heredados sin holes se normalizan sin cambiar su forma',()=>{
 const r=D.add({brand:'AMADA',kind:'punch',code:'HEREDADO',name:'Punzón de ejemplo'},dxf());
 const raw=JSON.parse(global.localStorage.getItem(D.KEY));
 delete raw[0].holes;
 global.localStorage.setItem(D.KEY,JSON.stringify(raw));
 assert.equal(D.read()[0].holeCount,0);
 assert.deepEqual(D.read()[0].holes,[]);
 D.remove(r.id);
});


test('Exportación DXF en mm conserva una sección con huecos y la reimporta sin pérdidas',()=>{
 const outer=[[0,0],[100,0],[100,120],[0,120]],hole=[[25,25],[45,25],[45,50],[25,50]];
 const file=multi([{points:outer},{points:hole}]);
 const record=D.add({brand:'MECOS',kind:'die',code:'V24-HUECO',name:'Matriz perfil hueco'},file);
 const exported=D.exportSectionDXF(record);
 assert.match(exported,/\$INSUNITS\n70\n4/);
 assert.equal((exported.match(/0\nLWPOLYLINE/g)||[]).length,2);
 const round=D.parseDXF(exported);
 assert.equal(round.holeCount,1);
 assert.equal(round.areaMm2,record.areaMm2);
 assert.deepEqual(round.points,record.points);
 assert.deepEqual(round.holes,record.holes);
 assert.equal(round.collisionApproved,false);
 const svg=D.exportSectionSVG(record);
 assert.match(svg,/<svg[^>]+mm"[^>]+mm"/);
 assert.match(svg,/fill-rule="evenodd"/);
 assert.match(svg,/mm²/);
 assert.doesNotMatch(svg,/<script>/);
 assert.ok(D.remove(record.id));
});
test('Exportación DXF discretiza arcos sin aprobar CNC ni crear radios falsos',()=>{
 const curved=D.add({brand:'AMADA',kind:'punch',code:'P-CURVO',name:'Punzón de perfil curvo'},
  dxf({points:[[0,0],[40,0],[40,40],[0,40]],bulge:true}));
 const dx=D.exportSectionDXF(curved),imported=D.parseDXF(dx);
 assert.equal(imported.arcCount,0,'El DXF exportado contiene los puntos muestreados, no arcos originales');
 assert.ok(Math.abs(imported.areaMm2-curved.areaMm2)<.05);
 assert.equal(imported.geometryCertified,false);
 assert.ok(D.exportSectionSVG(curved).includes('DXF'));
 D.remove(curved.id);
});
test('SVG de referencia maliciosa escapa título, no permite modificar puntos del origen',()=>{
 const record=D.add({brand:'EUROSTAMP',kind:'die',code:'<script>x</script>',name:'V de prueba'},dxf());
 const original=structuredClone(D.read()[0].points);
 const svg=D.exportSectionSVG(record);
 assert.doesNotMatch(svg,/<script>/);
 assert.match(svg,/&lt;script&gt;/);
 assert.match(svg,/width="136mm"/);
 assert.deepEqual(D.read()[0].points,original);
 D.remove(record.id);
});


test('LWPOLYLINE rechaza elevación Z, grosor CAD y normal invertida o inclinada',()=>{
 const section=dxf(),front=section.includes('0\nLWPOLYLINE\n');
 assert.equal(front,true);
 const altered=part=>section.replace('0\nLWPOLYLINE\n','0\nLWPOLYLINE\n'+part);
 for(const values of ['38\n3\n','39\n2\n','230\n-1\n','210\n0.3\n','220\n-0.5\n']){
  assert.throws(()=>D.parseDXF(altered(values)),/elevada|espesor|XY/);
 }
 assert.throws(()=>D.parseDXF(altered('70\n16\n')),/banderas/);
 assert.throws(()=>D.parseDXF(altered('43\nno-es-numero\n')),/anchura variable/);
});
test('DXF incompleto, EOF ausente o código de grupo sin valor se rechaza',()=>{
 const text=dxf();
 assert.throws(()=>D.parseDXF(text.replace('0\nEOF\n','')),/EOF/);
 assert.throws(()=>D.parseDXF(text+'10'),/truncado/);
 assert.throws(()=>D.parseDXF(text.replace('0\nLWPOLYLINE\n','0\nLWPOLYLINE\n38\nno-es-numero\n')),/elevada/);
});
