'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Settings=require('../settings.js');
test('Los ajustes ofrecen valores reales tipados, sin CNC ni módulos ficticios',()=>{
 const d=Settings.DEFAULT;
 assert.equal(d.theme,'dark');assert.equal(d.homeView,'photo');assert.equal(d.repeat,true);
 const html=Settings.html();
 for(const field of ['theme','accent','density','textScale','reducedMotion','homeView',
  'camera','speed','repeat','exportResolution','startupScreen'])
  assert.match(html,new RegExp('data-pp-setting="'+field+'"'));
 assert.ok(!html.includes('data-pp-setting="cncApproved"'));
});
test('Validar importaciones sin inyectar opciones desconocidas o estilos',()=>{
 assert.deepEqual(Settings.normalize({theme:'not-a-theme',camera:'top',repeat:false}).theme,'dark');
 assert.equal(Settings.normalize({camera:'top'}).camera,'top');
 assert.throws(()=>Settings.set('cncApproved',true),/desconocido/);
 assert.throws(()=>Settings.set('theme','<script>'),/admitida/);
 assert.throws(()=>Settings.replace({format:'plegar-pro-settings',version:1,settings:{unexpected:'1'}}),/no reconocido/);
 assert.throws(()=>Settings.replace({format:'plegar-pro-settings',version:1,settings:{theme:'broken'}}),/incorrecto/);
 Settings.replace({format:'plegar-pro-settings',version:1,settings:{theme:'contrast',repeat:false,camera:'profile',exportResolution:'1080'}});
 assert.equal(Settings.get().theme,'contrast');assert.equal(Settings.get().repeat,false);
 assert.equal(Settings.get().exportResolution,'1080');
 assert.equal(JSON.parse(Settings.exportData()).settings.camera,'profile');
 Settings.reset();assert.equal(Settings.get().repeat,true);
});
