/* Cotas transcritas de las páginas 45–55 del catálogo WILA–TRUMPF fotografiado
 * por el propietario. Dimensiones en mm, salvo capacidad (T/m).
 * El contorno exterior no está acotado por completo en todas las referencias;
 * los modelos 2D/3D reproducen la sección publicada y dejan esa limitación visible.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarManufacturerToolData=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const source=Object.freeze({type:'catalog-photo',title:'Catálogo WILA–TRUMPF · páginas 45–55 aportadas por Toni',url:null,version:'páginas 45–55',verified:false,note:'Cotas copiadas de las fotografías del catálogo. Los contornos no acotados por completo son reconstrucciones de la silueta impresa, no CAD del fabricante.'});
 const amadaSource=Object.freeze({type:'catalog-photo',title:'Catálogo AMADA–PROMECAM · páginas 13–20 aportadas por Toni',url:null,version:'páginas 13–20',verified:false,note:'Cotas copiadas de las fotografías del catálogo. Las siluetas no acotadas por completo son reconstrucciones de la sección impresa, no CAD del fabricante.'});
 const accessorySource=Object.freeze({type:'catalog-photo',title:'Catálogo de utillaje · páginas 4 y 82 aportadas por Toni',url:null,version:'páginas 4 y 82',verified:false,note:'Ficha documental. Las páginas no aportan sección y cotas suficientes para generar una geometría 3D fiable.'});
 const punch=(code,angle,nose,height,capacity,bodyWidth,reach=0,b= null)=>Object.freeze({
  id:'wila-p-'+code+(b?'-b'+b:''),kind:'punch',brand:'WILA / TRUMPF',manufacturer:'WILA / TRUMPF',
  name:'WILA / TRUMPF · punzón '+code+(b?' · b '+b+' mm':''),code,angle,nose,height,length:500,sectionedLength:550,
  capacityTonPerM:capacity,mountingWidth:20,bodyWidth,reach,b,profileFamily:reach?'gooseneck':'straight',source,
  geometryCertified:false,dimensionsNote:'Longitud publicada: 500 mm; versión fraccionada: 550 mm.'});
 const punches=[
  punch('15.670',86,.8,195,40,20,57),punch('15.635',86,.2,195,30,30),punch('15.630',86,.8,195,100,30),
  punch('15.680',60,.8,195,40,20,57),punch('15.620',28,1,195,80,24),punch('15.610',28,3,195,100,20),
  punch('15.700',86,1,256,80,33,85),punch('15.710',86,1,256,80,28,60),punch('15.720',28,1,256,60,28,30),
  punch('15.730',60,4,256,100,25,60),punch('15.750',28,1,276,40,24,60),
  punch('15.902',24,.6,195,80,25,0,8),punch('15.904',24,.6,195,80,25,0,10),punch('15.905',24,.6,195,80,25,0,12)
 ];
 function die(code,opening,angle,height,bodyWidth,shoulderRadius,capacity=100,sectioned=false,style='v'){
  return Object.freeze({id:'wila-d-'+code,kind:'die',brand:'WILA / TRUMPF',manufacturer:'WILA / TRUMPF',
   name:'WILA / TRUMPF · matriz '+code+' · '+(style==='hemming'?'aplastado b':'V')+opening+(style==='hemming'?' mm':' · '+angle+'°'),
   code,opening,angle,height,length:500,sectionedLength:sectioned?550:null,bodyWidth,shoulderRadius,
   keyWidth:13,keyHeight:20,capacityTonPerM:capacity,profileFamily:style,source,geometryCertified:false,
   dimensionsNote:(height-20)+' mm cuerpo + 20 mm espiga · ancho espiga 13 mm · L500 mm'+(sectioned?' / fraccionada 550 mm':'')});
 }
 const dies=[];
 const variants=[
  [6,86,120,20,.6],[8,86,120,20,.8],[10,86,120,20,1],[12,86,120,25,1],
  [16,86,120,30,1.6],[20,86,120,30,2],[24,86,120,35,2.5],
  [30,86,120,45,3],[40,86,120,55,3],[50,86,120,75,3],
  [60,80,120,75,5],[70,80,120,85,5],[80,80,120,100,5],[90,80,140,110,5],
  [100,80,140,120,8],[120,60,140,145,5]
 ];
 for(let i=0;i<variants.length;i++){
  const [v,a,h,w,r]=variants[i];
  const code='25.'+String(101+i).padStart(3,'0');dies.push(die(code,v,a,h,w,r,100,false));
  if(i<=6){
   const segCode='25.'+String(601+i).padStart(3,'0');
   dies.push(die(segCode,v,a,h+50,w,r,100,true));
  }
 }
 // La página 54 identifica expresamente la familia 30° y sus longitudes 500/550.
 // Reemplazar los IDs convencionales de esa familia por los códigos impresos.
 dies.push(die('25.401',6,30,120,20,.6,50,false),die('25.901',6,30,170,20,.6,50,true));
 dies.push(die('25.402',8,30,120,20,1,40,false),die('25.902',8,30,170,20,1,40,true));
 dies.push(die('25.403',10,30,120,20,1,40,false),die('25.903',10,30,170,20,1,40,true));
 dies.push(die('25.404',12,30,120,25,1,40,false),die('25.904',12,30,170,25,1,40,true));
 // Plegar y aplastar: los códigos aparecen emparejados con b=8/10/12.
 dies.push(die('25.992',8,28,100,50,1,50,false,'hemming'),
  die('25.994',10,28,100,50,1,50,false,'hemming'),die('25.995',12,28,100,50,1,50,false,'hemming'));
 // Matrices WILA–TRUMPF V16/V20/V24 a 30°, página 55.
 dies.push(die('25.405',16,30,120,30,1.6,45,false),die('25.406',20,30,120,35,2,50,false),
  die('25.407',24,30,120,40,2.5,50,false),die('25.408',30,30,120,55,3,60,false),
  die('25.905',16,30,170,30,1.6,45,true),die('25.906',20,30,170,35,2,50,true),die('25.907',24,30,170,40,2.5,50,true));

 // AMADA–PROMECAM: perfiles normalizados, radios, alturas y capacidades
 // leídos de las tablas fotografiadas. La cota transversal es sólo una guía
 // de reconstrucción cuando el dibujo no define todos los vértices.
 const amadaPunches=[];
 function amadaPunch(code,angle,nose,height,capacity,profileReach=26,profileFamily='gooseneck'){
  const lengths=[835,415,805];
  amadaPunches.push(Object.freeze({id:'amada-p-'+code,kind:'punch',brand:'AMADA / PROMECAM',manufacturer:'AMADA / PROMECAM',
   name:'AMADA / PROMECAM · punzón '+code,code,angle,nose,height,length:835,availableLengths:lengths,sectionedLength:805,
   capacityTonPerM:capacity,mountingWidth:13,bodyWidth:profileReach,reach:profileReach,profileFamily,source:amadaSource,
   geometryCertified:false,dimensionsNote:'Longitudes de catálogo: 835 mm, 415 mm y fraccionado estándar 805 mm.'}));
 }
 const amadaRows=[
  // Página 15, perfil de cuello de cisne, cota transversal 26 mm.
  ['10.152',90,.25,66.60,100,26],['11.100',90,.8,66.60,100,26],['10.153',88,.25,66.50,100,26],['11.145',88,.8,66.50,100,26],['11.101',88,3,65.45,100,26],['11.200',85,.8,66.50,100,26],['11.201',85,3,65.45,100,26],
  ['10.263',90,.25,100,50,26],['10.264',88,.25,100,50,26],['10.261',90,.6,100,50,26],['10.262',88,.6,100,50,26],
  ['11.228',88,.8,105,100,26],['11.230',88,3,105,100,26],
  ['10.150',90,.6,84.13,20,37],['10.512',88,.6,84.13,20,37],
  ['10.173',90,.25,66.70,35,26],['10.174',88,.25,66.70,35,26],['10.175',90,.6,66.75,35,26],['10.176',88,.6,66.74,35,26],
  ['10.503',90,.2,104.70,50,56],['10.504',88,.2,104.50,50,56],
  // Página 16.
  ['10.156',90,.25,104.50,50,53],['11.107',90,.8,104.50,50,53],['10.157',88,.25,104.50,50,53],['11.147',88,.8,104.50,50,53],['11.108',88,3,104.50,50,53],['11.151',85,.8,104.50,50,53],
  ['10.501',90,.2,90,50,53],['10.502',88,.2,89.70,50,53],
  ['10.154',90,.25,89.60,60,56],['11.105',90,.8,89.60,60,56],['10.155',88,.25,89.60,60,56],['11.146',88,.8,89.58,60,56],['11.106',88,3,88.50,60,56],
  ['10.505',88,.8,120,50,56],['11.233',88,.8,105,45,68],['11.240',88,.8,66.50,80,68],['11.241',90,.8,66.50,80,68],
  // Página 17.
  ['11.149',88,.8,165,60,75],['11.148',88,.8,145,80,75],['11.800',85,1,200,70,115],
  ['10.256',90,.25,95,50,27],['10.257',88,.25,95,50,27],['10.259',90,.6,95,50,27],['10.260',88,.6,95,50,27],
  // Página 18, ángulo 60°.
  ['10.520',60,.8,115,50,26],['10.506',60,.8,130,40,56],['10.516',60,.8,85,40,37],['10.510',60,.8,115,60,32],['10.500',60,.8,115,40,52],['10.142',60,.8,67,60,26],['10.143',60,2,65.8,60,26],
  // Página 19.
  ['10.136',60,6,65,100,36],['10.517',60,.8,80,25,26],['11.710',60,5,115,100,32],['11.720',60,10,115,100,32],['11.750',60,.8,135,70,26],['11.134',45,.6,66.3,80,26],['11.102',45,1,65.2,80,26],
  // Página 20, ángulos 35° y 30°.
  ['11.103',35,.6,86,70,26],['11.104',35,1.5,86,70,26],['11.600',35,.8,90,70,26],['10.514',30,.6,80,50,26],['10.515',30,.6,140,50,26],['10.511',30,3,80,100,27],['11.528',30,3,104,100,27],['11.530',30,5,104,100,27]
 ];
 for(const row of amadaRows)amadaPunch(...row);

 const accessories=Object.freeze([
  Object.freeze({id:'clark-single-50.650',kind:'adapter',manufacturer:'CLARK / WILA',code:'50.650',name:'Adaptador neumático CLARK · simple',stroke:4,clampingPressureBar:10,clampingForceKg:700,installation:'frontal / vertical',source:accessorySource}),
  Object.freeze({id:'clark-double-50.651',kind:'adapter',manufacturer:'CLARK / WILA',code:'50.651',name:'Adaptador neumático CLARK · doble',stroke:4,clampingPressureBar:10,clampingForceKg:700,installation:'frontal / vertical',source:accessorySource}),
  Object.freeze({id:'punch-800.000',kind:'accessory',manufacturer:'WILA / TRUMPF',code:'800.000',name:'Punzón de plegado/aplastado · conjunto 800.000',length:150,heightOptions:[59,67,100],profileDocumented:true,source:accessorySource}),
  ...['60.680','60.681','60.682','60.683'].map(code=>Object.freeze({id:'holder-'+code,kind:'accessory',manufacturer:'WILA / TRUMPF',code,name:'Soporte inferior para conjunto 800.000 · '+code,source:accessorySource}))
 ]);
 return {source,PUNCHES:Object.freeze([...punches,...amadaPunches]),DIES:Object.freeze(dies),ACCESSORIES:accessories};
});
