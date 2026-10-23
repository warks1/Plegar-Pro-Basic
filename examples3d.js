/* Plegar Pro Plus v0.39 · 4 perfiles de ejemplo con gadgets SVG 3D
 * Las miniaturas se generan directamente desde los tramos y ángulos de cada pieza.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
 typeof module==='object'&&module.exports?require('./plan-drawing.js'):root.PlegarPlanDrawing,
 typeof module==='object'&&module.exports?require('./piece3d.js'):root.PlegarPiece3D,
 typeof module==='object'&&module.exports?require('./metal-render.js'):root.PlegarMetalRender);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarExamples3D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,D,M,R){
 'use strict';
 const setup={radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120};
 const shapes=[
  {id:'l',label:'Escuadra L',width:100,segments:[80,60],angles:[90]},
  {id:'u',label:'Canal U',width:130,segments:[55,100,55],angles:[90,90]},
  {id:'z',label:'Perfil Z',width:110,segments:[70,65,70],angles:[90,-90]},
  {id:'omega',label:'Perfil Omega',width:140,segments:[60,85,120,85,60],angles:[-90,90,90,-90]}
 ];
 function list(){return shapes.map(s=>({id:s.id,label:s.label,width:s.width,profile:{
  name:s.label+' (ejemplo)',material:'Acero S235JR',thickness:2,
  segments:[...s.segments],angles:[...s.angles],
  sequence:s.angles.map((_,i)=>i+1),setup:{...setup}
 }}));}
 function get(id){return list().find(s=>s.id===id)||null;}
 function thumb(item){
  const p=G.validate(item.profile),mesh=D.meshFromProfile(G.vertices(p),p.thickness,item.width);
  const proj=M.project(mesh,38,28,1),prefix='pp-gallery-metal';
  return '<svg viewBox="0 0 900 480" role="img" aria-label="Vista metálica ilustrativa 3D '+item.label+'">'+
   R.defs(prefix)+R.background(prefix)+R.polys(mesh,proj,prefix,{material:p.material})+'</svg>';
 }
 function cards(selectedName=''){
  return list().map(item=>'<button type="button" class="example-gadget'+(item.profile.name===selectedName?' selected':'')+'" data-example-id="'+item.id+'" aria-label="Cargar pieza '+item.label+'">'+
   '<span class="example-gadget-visual example-gadget-paired"><span class="example-gadget-plan" title="Plano 2D con cotas">'+D.create(item.profile,{width:item.width}).svg2d+'</span><span class="example-gadget-volume" title="Forma 3D">'+thumb(item)+'</span></span><span class="example-gadget-name">'+item.label+'</span><small>'+item.profile.angles.length+' pliegues · '+item.width+' mm de ancho ilustrativo</small></button>').join('');
 }
 return {list,get,thumb,cards};
});