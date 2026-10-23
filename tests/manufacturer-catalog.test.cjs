const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../manufacturer-catalog.js');

test('Fichas de cuatro marcas proceden de enlaces de origen trazables',()=>{
 const x=C.validate();
 assert.equal(x.brands,4);
 assert.ok(x.total>=20);
 assert.equal(x.exactProfiles,0,'No declarar CAD real sin un perfil métrico');
 for(const brand of ['MECOS','Bystronic','AMADA','EUROSTAMP'])
  assert.ok(C.ENTRIES.some(t=>t.brand===brand));
 assert.ok(C.ENTRIES.every(t=>t.source.url.startsWith('https://')));
});

test('Medidas verificadas permanecen separadas de geometría ilustrativa',()=>{
 const d=C.find('eurostamp-d-v10');
 assert.equal(d.kind,'die');
 assert.equal(d.brand,'EUROSTAMP');
 assert.equal(d.angle,88);
 assert.equal(d.opening,10);
 assert.equal(d.height,55);
 assert.equal(d.simulatable,false);
 assert.equal(d.geometryCertified,false);
 assert.equal(C.find('eurostamp-d-v24').opening,24);
 assert.equal(C.find('eurostamp-d-v60').height,65);
 const missing=C.find('bystronic-rfa-punch');
 assert.equal(missing.height,null);
 assert.equal(missing.angle,null);
 assert.equal(missing.opening,null);
 assert.equal(missing.simulatable,false);
});

test('Cada ficha tiene dibujos distintos 2D y 3D con advertencia',()=>{
 for(const tool of C.ENTRIES){
  const front=C.art(tool,'2d'),vol=C.art(tool,'3d');
  assert.ok(front.includes('<svg'));
  assert.ok(vol.includes('<svg'));
  assert.notEqual(front,vol);
  const card=C.card(tool);
  assert.ok(card.includes('Perfil ilustrativo'));
  assert.ok(card.includes('NO VÁLIDO PARA COLISIONES'));
  assert.ok(card.includes(tool.source.url));
  assert.ok(!card.includes('data-tool-set'), 'No instalar marcas sin CAD en el simulador');
 }
});

test('Filtros de marca, tipo y código funcionan sin mezclar marcas',()=>{
 const all=C.list();
 assert.equal(all.length,C.validate().total);
 assert.ok(C.list({brand:'AMADA'}).every(x=>x.brand==='AMADA'));
 assert.ok(C.list({kind:'die'}).every(x=>x.kind==='die'));
 assert.equal(C.list({q:'V24'}).length,1);
 assert.equal(C.list({brand:'EUROSTAMP',kind:'die',q:'V24'})[0].id,'eurostamp-d-v24');
 assert.equal(C.list({brand:'MECOS',q:'m80'}).length,0);
});

test('Vista documental no incluye metadatos de colisión falsos',()=>{
 const html=C.html();
 assert.ok(html.includes('data-mfg-filter="brand"'));
 assert.ok(html.includes('data-mfg-filter="kind"'));
 assert.ok(html.includes('data-mfg-filter="q"'));
 assert.ok(html.includes('data-mfg-results'));
 assert.ok(html.includes('no ofrecen para simulación'));
 assert.equal(C.validate().exactProfiles,0);
 assert.ok(!html.includes('data-tool-set'));
});
