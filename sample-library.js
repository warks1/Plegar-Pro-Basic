/* Plegar Pro Plus v0.41 · biblioteca pedagógica de piezas COMPLETAS.
 * Cada pieza contiene sus propias cotas 2D, perfil 3D y orden. Son modelos de ejemplo,
 * NO planos originales de clientes ni utillajes verificados.
 */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
  typeof module==='object'&&module.exports?require('./plan-drawing.js'):root.PlegarPlanDrawing,
  typeof module==='object'&&module.exports?require('./home3d.js'):root.PlegarHome3D);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarSampleLibrary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,D,Home){
 'use strict';
 const sampleData=[
  ['soporte-motor','Soporte motor S235',2,'Acero S235JR',145,[40,75,55,120,55,75,40],[90,-90,90,90,-90,-90]],
  ['cubierta-lateral','Cubierta lateral Inox 304',1.5,'Inox 304',250,[30,65,130,75,90,28],[90,-90,90,-90,90]],
  ['bandeja-electrica','Bandeja eléctrica',2.1,'Acero S235JR',320,[36,85,160,85,36],[90,90,-90,-90]],
  ['caja-proteccion','Caja protección',2.55,'Acero S235JR',180,[48,85,110,48],[90,-90,90]],
  ['escuadra-l','Escuadra en L',2,'Acero S235JR',100,[80,60],[90]],
  ['canal-u','Canal en U',1.5,'Inox 304',150,[55,120,55],[90,90]],
  ['perfil-z','Perfil en Z',2.5,'Aluminio 5754',135,[70,75,70],[90,-90]],
  ['perfil-omega','Perfil Omega',2,'Acero S235JR',140,[60,85,120,85,60],[-90,90,90,-90]],
  ['sombrerete','Sombrerete con retornos',1.5,'Acero S235JR',210,[30,35,100,35,30],[-90,90,90,-90]],
  ['perfil-escalonado','Perfil escalonado',2,'Acero S355JR',200,[80,35,85,35,80],[90,-90,-90,90]],
  ['soporte-lateral','Soporte lateral',3,'Acero S355JR',120,[55,95,125,55],[90,90,-90]],
  ['bandeja-retornos','Bandeja con retornos',1.2,'Acero S235JR',290,[22,45,150,45,22],[-90,90,90,-90]]
 ];
 const valid=(s)=>{const [id,name,thickness,material,width,segments,angles]=s;
  const profile=G.validate({name,material,thickness,segments,angles,sequence:angles.map((_,i)=>i+1)});
  const die=thickness<=1.5?'v12-88':thickness<=2.1?'v16-88':'v24-88';
  return {id,name,width,thickness,material,profile:{...profile,setup:{radius:Math.max(1,thickness),kFactor:.33,punch:'p88-r1',die,backgaugeX:120}},kind:'example',note:'Plano geométrico de ejemplo, no documentación original ni plano CNC.'};
 };
 function list(){return sampleData.map(valid);}
 function get(id){return list().find(p=>p.id===id)||null;}
 function byName(name){return list().find(s=>s.name.trim().toLocaleLowerCase('es-ES')===String(name||'').trim().toLocaleLowerCase('es-ES'))||null;}
 function drawing(id){const sample=get(id);if(!sample)throw Error('Pieza de ejemplo no encontrada.');return D.create(sample.profile,{width:sample.width});}
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function paired(profile,width){
  const d=D.create(profile,{width});
  const planar=d.svg2d,volume=Home.preview(profile,{width});
  return '<span class="sample-plan-pair" role="group" aria-label="Plano 2D y pieza 3D">'
    +'<span class="sample-plan-view" title="Plano 2D">'+planar+'</span>'
    +'<span class="sample-part-view" title="Forma 3D">'+volume+'</span></span>';
 }
 function projectCard(sample){
  return '<article class="sample-catalog-card" data-sample-id="'+escape(sample.id)+'"><div class="sample-catalog-images">'+paired(sample.profile,sample.width)+'</div><strong>'+escape(sample.name)+'</strong>'
   +'<small>'+sample.profile.angles.length+' pliegues · '+sample.thickness.toFixed(2)+' mm · ancho '+sample.width+' mm</small>'
   +'<p>Modelo geométrico de demostración, editable y con sus propias cotas.</p>'
   +'<div class="sample-catalog-buttons"><button type="button" data-action="sample-program" data-sample-program="'+escape(sample.id)+'">Programar 2D</button><button type="button" data-action="sample-save" data-sample-save="'+escape(sample.id)+'">Guardar planos 2D/3D</button></div></article>';
 }
 return {list,get,byName,drawing,paired,projectCard};
});