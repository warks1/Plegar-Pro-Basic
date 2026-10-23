const {test}=require('node:test');
const assert=require('node:assert/strict');
const Lib=require('../piece-library.js');
const G=require('../geometry2d.js');
const C=require('../bendcalc.js');
function memory(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};}
const sample={name:'Mi omega',material:'Acero S235JR',thickness:2,segments:[60,85,120,85,60],
 angles:[-90,90,90,-90],sequence:[2,3,1,4],setup:C.validateSetup({dieHeight:60,die:'v16-88'})};
test('Guardar dos piezas, recuperar sin perder geometría, utillaje o ancho 3D',()=>{
 const store=memory(),db=Lib.create(store);
 const first=db.save(sample,320);
 const second=db.save({...sample,name:'Zeta',segments:[40,80],angles:[-110],sequence:[1]},220);
 assert.equal(db.list().length,2);
 assert.notEqual(first.id,second.id);
 assert.deepEqual(db.get(first.id).profile.angles,sample.angles);
 assert.deepEqual(db.get(first.id).profile.sequence,[2,3,1,4]);
 assert.equal(db.get(first.id).profile.setup.dieHeight,60);
 assert.equal(db.get(first.id).width,320);
 const next=db.save({...sample,name:'Omega revisada',segments:[70,85,120,85,70]},400,{id:first.id});
 assert.equal(next.id,first.id);
 assert.equal(db.list().length,2);
 assert.equal(db.get(first.id).profile.name,'Omega revisada');
 assert.deepEqual(db.get(second.id).profile.segments,[40,80]);
 assert.equal(db.get(first.id).width,400);
});
test('Copias de seguridad: exportar e importar sin duplicar piezas',()=>{
 const storage=memory(),db=Lib.create(storage);
 const a=db.save(sample,310);
 const json=db.exportBackup(),other=Lib.create(memory());
 let result=other.importBackup(json);
 assert.deepEqual(result,{added:1,skipped:0,total:1});
 result=other.importBackup(json);
 assert.deepEqual(result,{added:0,skipped:1,total:1});
 assert.deepEqual(other.get(a.id).profile,db.get(a.id).profile);
 assert.equal(other.get(a.id).width,310);
});
test('Biblioteca no destruye datos ante JSON corrupto ni acepta perfiles irreales',()=>{
 const s=memory(),db=Lib.create(s);
 const saved=db.save(sample,300),before=s.getItem(Lib.KEY);
 assert.throws(()=>db.save({...sample,segments:[0,120,85,60,60]},300),/tramo/);
 assert.throws(()=>db.save(sample,6000),/Ancho/);
 assert.throws(()=>db.save(sample,300,{id:'pieza-inexistente'}),/no existe/);
 assert.equal(s.getItem(Lib.KEY),before);
 s.setItem(Lib.KEY,'{datos malos');
 assert.throws(()=>db.list(),/dañados/);
 assert.throws(()=>db.save(sample,310),/dañados/);
 assert.equal(s.getItem(Lib.KEY),'{datos malos');
});
test('Biblioteca: borrado solo por ID y modelos validados tras recuperar',()=>{
 const db=Lib.create(memory()),one=db.save(sample,320),two=db.save({...sample,name:'Mi U'},200);
 assert.equal(db.remove('pieza-desconocida'),false);
 assert.equal(db.remove(one.id),true);
 assert.equal(db.list().length,1);
 assert.equal(db.list()[0].id,two.id);
 assert.equal(db.get(one.id),null);
 assert.deepEqual(G.validate(db.get(two.id).profile).angles,sample.angles);
});
test('Copia incompatible, IDs duplicados y registros inválidos no sobrescriben la biblioteca',()=>{
 const db=Lib.create(memory()),row=db.save(sample,330);
 const invalid={format:Lib.FORMAT,version:Lib.VERSION,pieces:[row,row]};
 const state=db.exportBackup();
 assert.throws(()=>db.importBackup(invalid),/duplicados/);
 assert.throws(()=>db.importBackup({format:Lib.FORMAT,version:999,pieces:[]}),/incompatible/);
 assert.throws(()=>db.importBackup({format:Lib.FORMAT,version:Lib.VERSION,pieces:[{id:'x'}]}),/Identificador/);
 assert.equal(db.exportBackup().includes(row.id),true);
 assert.equal(JSON.parse(db.exportBackup()).pieces.length,1);
});
