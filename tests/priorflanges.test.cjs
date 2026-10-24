const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scene}=require('../forming2d.js');
const D=require('../clearance2d.js');
const T=require('../toolprofiles2d.js');
const p={name:'Pieza de ensayo',material:'S235',thickness:2,segments:[40,50,40],angles:[90,90],sequence:[1,2],setup:{radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:150}};
test('punzón 88º tiene radio de punta tangente, no vértice agudo',()=>{
 const poly=T.punch({punchAngle:88,punchNose:2,punchTipY:-1,dieOpening:16});
 assert.equal(poly.outline.length,25);
 const end=poly.outline.slice(2),maxY=Math.max(...end.map(x=>x.y));
 assert.ok(Math.abs(maxY-(-1))<.01); // sampled circular nose
 assert.ok(poly.outline.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
});
test('ángulo y punta generan contornos diferenciados',()=>{
 const a=T.punch({punchAngle:30,punchNose:1,punchTipY:0,dieOpening:16});
 const b=T.punch({punchAngle:88,punchNose:1,punchTipY:0,dieOpening:16});
 assert.ok(a.outline[1].x < b.outline[1].x);
});
test('cribado por segmentos detecta cruce interior y separación',()=>{
 const square=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
 assert.equal(D.segmentPolygon({x:-3,y:5},{x:12,y:5},square),0);
 assert.equal(D.segmentPolygon({x:2,y:2},{x:8,y:8},square),0);
 assert.ok(Math.abs(D.segmentPolygon({x:-5,y:-5},{x:-5,y:15},square)-5)<.00001);
 assert.ok(D.segmentPolygon({x:12,y:11},{x:20,y:15},square)>=Math.sqrt(5)-1e-6);
});
test('no se inventan alas anteriores antes del primer pliegue',()=>{
 const m=scene(p,0,.5);
 assert.deepEqual(m.previous.completed,[]);assert.deepEqual(m.previous.paths,[]);
 assert.deepEqual(m.interferences.flangeClearances,[]);
});
test('pliegues anteriores son solo los de la secuencia ya completados',()=>{
 const m=scene(p,1,.6);assert.deepEqual(m.previous.completed,[1]);
 assert.deepEqual(m.previous.paths[0].bends,[1]);
 assert.ok(m.previous.paths[0].points.length===2);
 assert.ok(m.interferences.flangeClearances.every(c=>c.gap>=0));
});
test('orden diferente puede no tener un ala previa contigua representable',()=>{
 const model={...p,sequence:[2,1]};const m=scene(model,1,.5);
 assert.deepEqual(m.previous.completed,[2]);
 assert.equal(m.previous.paths.length,1);
 assert.deepEqual(m.previous.paths[0].bends,[2]);
});
test('el grosor nominal interviene en la holgura de alas anteriores',()=>{
 const a=scene(p,1,.5),b=scene({...p,thickness:4},1,.5);
 assert.ok(b.interferences.flangeClearances.every(c=>Number.isFinite(c.gap)));
 assert.match(b.interferences.disclosure,/NO demuestra seguridad/);
 assert.ok(a.toolProfiles.punch.outline.length>10);
});
test('los pliegues negativos no se presentan como orientación física validada',()=>{
 const m=scene({...p,angles:[-90,90]},1,.5);
 assert.ok(m.previous.paths.length>0);
 assert.match(m.previous.note,/sin recolocar/);
});

test('una trayectoria sintética que atraviesa el punzón genera aviso específico',()=>{
 const I=require('../interference2d.js');
 const m=scene(p,1,.6);
 const original=m.toolProfiles.punch.outline;
 const mid=original[8];
 m.previous.paths=[{side:'left',bends:[1],points:[{x:mid.x-10,y:mid.y},{x:mid.x+10,y:mid.y}]}];
 const inspected=I.inspect(m);
 assert.ok(inspected.problems.some(v=>v.code==='PRIOR_FLANGE_NEAR_TOOL'&&v.component==='Punzón'));
});

test('Punzón genérico 88° usa espiga recta, no triángulo desde toda su altura',()=>{
 const narrow=T.punch({punchAngle:88,punchNose:1,punchTipY:0,dieOpening:16,punchHeight:150});
 const shorter=T.punch({punchAngle:88,punchNose:1,punchTipY:0,dieOpening:16,punchHeight:100});
 assert.equal(narrow.outline.length,25);
 assert.equal(narrow.outline[1].x,narrow.outline[2].x,'Espiga vertical');
 assert.equal(narrow.outline[0].x,-narrow.outline[1].x);
 assert.ok(narrow.outline[2].y>narrow.outline[1].y);
 assert.ok(Math.abs(narrow.outline[1].x-shorter.outline[1].x)<1e-8,'Mayor altura no ensancha el punzón sin límite');
 assert.equal(narrow.verified,false);
});
