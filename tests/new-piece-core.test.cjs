const {test}=require('node:test');
const assert=require('node:assert/strict');
const New=require('../new-piece-core.js');
const C=require('../bendcalc.js');
const G=require('../geometry2d.js');
const source={name:'Omega',material:'Inox 304',thickness:1.5,
 segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[1,2,3,4],
 setup:{radius:2,kFactor:.42,punch:'p88-r1',die:'v16-88',backgaugeX:120,dimensionBasis:'outer'}};
test('Crear nueva pieza NO reutiliza geometría de perfil anterior; sí conserva elección general de herramientas',()=>{
 const p=New.create(source,250);
 assert.equal(p.name,'Nueva pieza');
 assert.deepEqual(p.segments,[100,100]);
 assert.deepEqual(p.angles,[90]);
 assert.deepEqual(p.sequence,[1]);
 assert.equal(p.material,'Inox 304');
 assert.equal(p.thickness,1.5);
 assert.equal(p.width,250);
 assert.equal(p.setup.kFactor,.42);
 assert.equal(p.setup.die,'v16-88');
 assert.deepEqual(source.segments,[60,85,120,85,60]);
});
test('Crear hasta 24 tramos y mantener secuencia como permutación sin perder pliegues',()=>{
 let p=New.create(source);
 for(let i=2;i<24;i++)p=New.add(p);
 assert.equal(p.segments.length,24);
 assert.equal(p.angles.length,23);
 assert.equal(p.sequence.length,23);
 assert.deepEqual(p.sequence,Array.from({length:23},(_,i)=>i+1));
 assert.throws(()=>New.add(p),/Máximo/);
 p=New.remove(p);
 assert.equal(p.segments.length,23);
 assert.equal(p.sequence.length,22);
 while(p.segments.length>2)p=New.remove(p);
 assert.throws(()=>New.remove(p),/mínimo/);
});
test('Orden por tocar pliegues y selector de paso sincronizados',()=>{
 let p=New.add(New.add(New.create(source)));
 // 3 pliegues: B3, B1, B2
 const a=New.touchOrder(p,[],3);assert.deepEqual(a.draft.sequence,[3,1,2]);
 const b=New.touchOrder(a.draft,a.picked,1);assert.deepEqual(b.draft.sequence,[3,1,2]);
 assert.throws(()=>New.touchOrder(b.draft,b.picked,1),/ya está seleccionado/);
 const c=New.touchOrder(b.draft,b.picked,2);
 assert.equal(c.finished,true);
 assert.deepEqual(c.picked,[]);
 assert.deepEqual(c.draft.sequence,[3,1,2]);
 p=New.reposition(c.draft,2,1);
 assert.deepEqual(p.sequence,[2,3,1]);
 assert.throws(()=>New.reposition(p,5,1),/no válida/);
});
test('Pieza creada conserva sentido arriba/abajo con signos y parámetros físicos',()=>{
 let p=New.add(New.create(source,230));
 p.name='Soporte a medida';p.material='Acero S235JR';p.thickness=3;
 p.segments=[45,85,60];p.angles=[-90,135];p.sequence=[2,1];
 p.setup.dieHeight=60;p.setup.radius=3;
 const result=New.build(p);
 assert.equal(result.width,230);
 assert.deepEqual(result.profile.segments,[45,85,60]);
 assert.deepEqual(result.profile.angles,[-90,135]);
 assert.deepEqual(result.profile.sequence,[2,1]);
 assert.equal(result.profile.setup.dieHeight,60);
 assert.equal(result.profile.setup.die,C.validateSetup(p.setup).die);
 assert.equal(G.vertices(result.profile).length,4);
});
test('Validaciones previenen medidas imposibles antes de guardar',()=>{
 const base=New.create(source);
 assert.throws(()=>New.build({...base,width:0}),/Ancho/);
 assert.throws(()=>New.build({...base,segments:[0,100]}),/tramo/);
 assert.throws(()=>New.build({...base,angles:[0]}),/0°/);
 assert.throws(()=>New.build({...base,sequence:[2]}),/secuencia/);
 assert.throws(()=>New.build({...base,thickness:0}),/Espesor/);
 assert.throws(()=>New.build({...base,material:'Material desconocido'}),/Material/);
 assert.throws(()=>New.build({...base,setup:{...base.setup,die:'inventado'}}),/Matriz/);
});
