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
 function inputRows(setup={}){
  // Sólo se muestran medidas aportadas al programa; nunca se precargan desde la ficha de venta.
  const fields=[
   ['dieHeight','Altura H de matriz','Desde apoyo inferior de matriz hasta hombros de la V',5,400],
   ['tableLeft','Mesa hacia X−','Desde el eje de la V hasta el borde del volumen de mesa en el perfil (lado X−)',20,2000],
   ['tableRight','Mesa hacia X+','Desde el eje de la V hasta el borde del volumen de mesa en el perfil (lado X+)',20,2000],
   ['ramWidth','Anchura local de trancha','Anchura de la parte inferior de trancha que pueda interferir con la chapa',20,2000],
   ['ramBottomOffset','Separación punta-trancha','Distancia vertical desde punta de punzón a cara inferior de trancha',10,500]
  ];
  return fields.map(([id,label,detail,min,max])=>{
   const val=setup?.[id],value=val===null||val===undefined||val===''?'':Number(val);
   const printable=value===''||!Number.isFinite(value)?'':String(value);
   return '<label class="machine-measurement-field"><span>'+label+' (mm)</span>'+
    '<small>'+detail+'</small>'+
    '<input type="number" step="0.1" inputmode="decimal" min="'+min+'" max="'+max+'" '+
    'data-machine-measure="'+id+'" value="'+printable+'" placeholder="Sin medir" aria-label="'+label+' (mm)"></label>';
  }).join('');
 }
 function html(setup={}){
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
   '<div class="machine-measurement-editor" role="group" aria-label="Introducir medidas reales de máquina y utillaje">'+
   '<h3>Medidas locales para simular colisiones (introducción manual)</h3>'+
   '<p>Introduce únicamente cotas medidas en tu máquina o copiadas de un plano oficial de la unidad. Estas cifras pertenecen al programa activo y se muestran en Programación 2D y Simulación 3D. Deja vacíos los campos desconocidos.</p>'+
   '<div class="machine-measurement-fields">'+inputRows(setup)+'</div>'+
   '<button type="button" data-machine-save>Guardar medidas en el programa activo</button>'+
   '<p class="machine-reference-warning">Estos datos permiten un cribado geométrico nominal, pero NO prueban que una trayectoria sea segura. No utilizar altura de mesa 925 mm ni carrera 200 mm para rellenar esta sección.</p>'+
   '</div>'+
   '<p><a href="'+r.source.url+'" target="_blank" rel="noopener noreferrer">Consultar fuente del anuncio de 2006 ↗</a> · Revisado el '+r.source.checkedOn+'.</p>'+
   '<p class="machine-reference-warning">No utilizar esta ficha para autorizar pliegues, calcular trayectorias CNC ni garantizar ausencia de choques. Faltan planos y cotas calibradas de tu unidad.</p>'+
   '</section>';
 }
 return {reference,validateMachineRef,html,inputRows};
});
