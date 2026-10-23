/* Ficha de referencia para la Bystronic EP II 31-100 (2006).
 * Procedencia: anuncio de equipo usado, NO documentación del fabricante.
 * La coincidencia año/tonelaje/longitud NO identifica automáticamente la máquina del usuario.
 * No trasladar dimensiones exteriores o cinemáticas al volumen de colisión de mesa/trancha.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarMachineReferences=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const reference=Object.freeze({
  id:'bystronic-ep-ii-31-100-2006',manufacturer:'Bystronic',model:'EP II 31-100',year:2006,
  matchingStatus:'CANDIDATO: confirmar placa de modelo y número de serie',
  bendingLengthMm:3100,forceTonnes:100,betweenUprightsMm:2550,throatDepthMm:400,
  tableTopHeightFromFloorMm:925,ramStrokeMm:200,
  footprintMm:{length:5200,width:2100,height:2900},
  control:'Cybelec DNC 8805',
  geometry:{
   // Coordenadas locales relativas a la V; NO equivalen a longitud total / altura al suelo.
   tableLeft:null,tableRight:null,ramWidth:null,ramBottomOffset:null,
   tableSectionWidth:null,ramSectionDepth:null
  },
  source:{
   type:'Anuncio de maquinaria usada; ficha NO oficial',name:'Kitmondo / Exapro, anuncio P250930038',
   url:'https://www.kitmondo.com/es/bystronic-ep-ii-31-100-p250930038/',checkedOn:'2026-10-23'
  }
 });
 function validateMachineRef(x){
  if(!x||x.id!==reference.id)throw new Error('Ficha de máquina desconocida.');
  if(x.geometry.tableLeft!==null||x.geometry.tableRight!==null||
     x.geometry.ramWidth!==null||x.geometry.ramBottomOffset!==null)
    throw new Error('No utilizar dimensiones de mesa/trancha no medidas.');
  return x;
 }
 function html(){
  const r=validateMachineRef(reference);
  return '<section class="machine-reference" aria-label="Datos de plegadora Bystronic de 2006">'+
   '<h2>Bystronic EP II 31-100 · Año 2006</h2>'+
   '<p class="machine-reference-warning">REFERENCIA DE MODELO CANDIDATO, NO IDENTIFICACIÓN DE TU MÁQUINA. Confirmar placa. Los datos proceden de un anuncio, no de planos de fabricante.</p>'+
   '<div class="machine-reference-grid">'+
   [['Fuerza','100 toneladas'],['Longitud de plegado','3.100 mm'],['Distancia entre columnas','2.550 mm'],
    ['Profundidad garganta','400 mm'],['Altura superior de mesa al suelo','925 mm'],
    ['Carrera vertical de la trancha','200 mm'],['Control de la unidad anunciada','Cybelec DNC 8805'],
    ['Dimensiones exteriores','5.200 × 2.100 × 2.900 mm']].map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join('')+
   '</div>'+
   '<h3>Sección y envolventes de colisión: pendientes</h3>'+
   '<p><b>Mesa:</b> anchura de sección transversal, extensión real delante/detrás de la V y altura de soporte de matriz no localizadas en la ficha.</p>'+
   '<p><b>Trancha:</b> anchura/espesor inferior, perfil real y distancia desde punta del punzón a la cara inferior de la trancha no publicados. Los <strong>200 mm son carrera</strong>, no anchura ni altura de la trancha.</p>'+
   '<p>Los 925 mm NO son la altura de matriz y los 400 mm NO son el ancho de mesa ni de trancha. No se aplican como cotas de colisión.</p>'+
   '<p><a href="'+r.source.url+'" target="_blank" rel="noopener noreferrer">Consultar fuente del anuncio de 2006 ↗</a> · Revisado el '+r.source.checkedOn+'.</p>'+
   '<p class="machine-reference-warning">No utilizar esta ficha para autorizar pliegues, calcular trayectorias CNC ni garantizar ausencia de choques. Faltan planos y cotas calibradas de tu unidad.</p>'+
   '</section>';
 }
 return {reference,validateMachineRef,html};
});
