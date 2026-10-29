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
 const amadaSource=Object.freeze({type:'catalog-photo',title:'Catálogo AMADA–PROMECAM · páginas 13–39 aportadas por Toni',url:null,version:'páginas 13–39',verified:false,note:'Cotas copiadas de las fotografías del catálogo. Las siluetas no acotadas por completo son reconstrucciones de la sección impresa, no CAD del fabricante.'});
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
  ['11.103',35,.6,86,70,26],['11.104',35,1.5,86,70,26],['11.600',35,.8,90,70,26],['10.514',30,.6,80,50,26],['10.515',30,.6,140,50,26],['10.511',30,3,80,100,27],['11.528',30,3,104,100,27],['11.530',30,5,104,100,27],
  // Página 21.
  ['11.158',30,.6,80,100,26],['11.258',30,.6,104,100,26],['11.810',30,1,200,50,26],['11.514',30,.6,104,50,26],['11.780',30,.5,135,80,26],['11.540',26,.8,117,100,26]
 ];
 for(const row of amadaRows)amadaPunch(...row);

 const amadaDies=[];
 function amadaDie(code,width,height,angle,openings,radii,offsets,capacity=100){
  const grooves=openings.map((opening,i)=>Object.freeze({opening,angle,radius:radii[i],offset:offsets[i]}));
  amadaDies.push(Object.freeze({id:'amada-d-'+code,kind:'die',brand:'AMADA / PROMECAM',manufacturer:'AMADA / PROMECAM',
   name:'AMADA / PROMECAM · matriz multicanal '+code,code,opening:openings[0],angle,height,length:835,availableLengths:[835,415,805],
   bodyWidth:width,shoulderRadius:radii[0],capacityTonPerM:capacity,grooves:Object.freeze(grooves),keyWidth:null,keyHeight:null,
   profileFamily:'multi-v',source:amadaSource,geometryCertified:false,
   dimensionsNote:'Sección de doble canal · longitudes de catálogo 835/415 mm y fraccionado estándar 805 mm.'}));
 }
 // Páginas 24–26: dos canales en una misma sección, cotas de posición desde el extremo izquierdo.
 const multiRows=[
  ['20.295',55,26,90,[4,7],[.3,.5],[4,48],100],['20.202',55,26,90,[6,10],[.4,.6],[6,45],100],['20.203',55,26,90,[8,12],[.5,.8],[8,45],100],
  ['21.202',55,26,88,[6,10],[.8,1.2],[6,45],100],['20.338',55,26,88,[8,12],[1,1.5],[8,45],100],['20.204',55,26,88,[12,20],[2.75,3],[10,40],100],
  ['20.296',55,26,88,[14,18],[2.75,3],[11,42],100],['20.205',55,26,88,[16,25],[2.75,3],[12,38.5],100],['20.235',55,26,60,[6,10],[.4,.6],[6,45],60],
  ['20.229',55,26,60,[8,12],[.5,.8],[8,45],60],['20.230',55,26,60,[12,20],[.8,1.5],[10,40],60],['20.267',55,26,60,[16,20],[1.6,2],[12,40],60],
  ['20.418',50,46,30,[8,12],[.8,1.5],[9.5,35.5],40],
  ['20.275',34.5,46,90,[4,7],[.3,.5],[3.5,29.5],80],['20.276',37,46,90,[6,10],[.4,.6],[4.5,30.5],80],['20.277',39,46,90,[8,12],[.5,.8],[5.5,31.5],80],
  ['21.276',37,46,88,[6,10],[.8,1.2],[4.5,30.5],80],['20.339',39,46,88,[8,12],[1,1.5],[5.5,31.5],80],['20.278',45,46,88,[14,18],[1.25,1.5],[8.5,34.5],80],
  ['20.279',45.5,46,88,[12,20],[.8,1.75],[7.5,33.5],80],['20.280',50,46,88,[16,25],[1.5,1.75],[9.5,35.5],80],['20.478',50,46,30,[8,12],[.8,1.5],[9.5,35.5],40]
 ];
 for(const row of multiRows)amadaDie(...row);

 const amadaStandardDies=[];
 function amadaStandardDie(code,opening,angle,height,stemWidth,outerRadius,rootRadius,capacity=100,extra={}){
  const codeLabel=code==='P31-V6-90-CODIGO-ILEGIBLE'?'código ilegible en foto · p31 V6/90°':code==='P32-V12-88-CODIGO-ILEGIBLE'?'código ilegible en foto · p32 V12/88°':code;
  amadaStandardDies.push(Object.freeze({id:'amada-d-'+code,kind:'die',brand:'AMADA / PROMECAM',manufacturer:'AMADA / PROMECAM',
   name:'AMADA / PROMECAM · matriz V'+opening+' · '+angle+'° · H'+height+' · '+codeLabel,code:codeLabel,opening,angle,height,
   length:835,availableLengths:[835,415,805],bodyWidth:extra.bodyWidth||60,stemWidth,baseWidth:extra.baseWidth||60,baseHeight:extra.baseHeight||18,
   shoulderRadius:outerRadius,vRootRadius:rootRadius,capacityTonPerM:capacity,keyWidth:null,keyHeight:null,
   profileFamily:extra.profileFamily||'t-base',source:amadaSource,geometryCertified:false,
   dimensionsNote:'Perfil de matriz AMADA con longitudes 835/415 mm y fraccionado 805 mm.'}));
 }
 function amadaBlockDie(code,opening,angle,height,width,outerRadius,rootRadius,capacity=100){
  amadaStandardDies.push(Object.freeze({id:'amada-d-'+code,kind:'die',brand:'AMADA / PROMECAM',manufacturer:'AMADA / PROMECAM',
   name:'AMADA / PROMECAM · matriz V'+opening+' · '+angle+'° · H'+height+' · '+code,code,opening,angle,height,
   length:835,availableLengths:[835,415,805],bodyWidth:width,shoulderRadius:outerRadius,vRootRadius:rootRadius,
   capacityTonPerM:capacity,keyWidth:null,keyHeight:null,profileFamily:'block-v',source:amadaSource,geometryCertified:false,
   dimensionsNote:'Bloque de matriz · longitudes 835/415 mm y fraccionado 805 mm.'}));
 }
 // Página 30: matrices de bloque y grandes aperturas.
 amadaBlockDie('20.680',80,60,115,115,6,6,100);
 amadaBlockDie('20.484',32,45,80,60,4,4,100);
 amadaStandardDie('20.440',40,45,75,60,4,4,100,{bodyWidth:75,baseWidth:60,baseHeight:20});
 amadaStandardDie('20.380',80,45,145,60,6,6,100,{bodyWidth:145,baseWidth:60,baseHeight:20});
 amadaBlockDie('20.494',18,30,60,60,2,2,100);
 amadaBlockDie('20.325',25,30,60,60,3,3,100);
 // Páginas 31–39: familia AMADA de base 60×18 mm, alturas H80 y H120.
 const standardRows=[
  // H80, 90°.
  ['P31-V6-90-CODIGO-ILEGIBLE',6,90,80,14,.4,.5,100],['20.258',8,90,80,14,.5,.5,100],['20.244',10,90,80,18,.6,.5,100],['20.245',12,90,80,18,.8,.5,100],['20.246',16,90,80,24,1,.5,100],
  // H80, 88°.
  ['20.806',6,88,80,14,.8,.5,100],['20.808',8,88,80,14,1,.5,100],['20.810',10,88,80,18,1.2,.5,100],['P32-V12-88-CODIGO-ILEGIBLE',12,88,80,18,1.5,.5,100],['20.327',16,88,80,24,2,1.5,100],['20.310',20,88,80,30,2.5,1,100],['20.309',25,88,80,35,3,1,100],
  // H80, 60°.
  ['20.297',6,60,80,14,.4,.5,60],['20.298',8,60,80,14,.5,.5,60],['20.299',10,60,80,18,.6,.5,60],['20.300',12,60,80,18,.8,.5,60],['20.301',16,60,80,24,1.6,.5,60],['20.308',20,60,80,30,2,1,60],['20.311',25,60,80,35,3,1,60],
  // H80, 45°.
  ['20.328',6,45,80,14,.6,.8,50],['20.329',8,45,80,18,.8,.8,50],['20.330',10,45,80,18,1,.8,50],['20.331',12,45,80,24,1.5,.8,40],['20.332',16,45,80,24,2,1.5,50],['20.333',20,45,80,30,2.5,1.5,50],['20.334',25,45,80,35,3,1.5,50],
  // H80, 30°.
  ['20.317',6,30,80,14,.6,1,35],['20.318',8,30,80,18,.8,1,35],['20.319',10,30,80,24,1,1,50],['20.320',12,30,80,24,1.5,1,40],['20.321',16,30,80,30,2,1.5,45],['20.322',20,30,80,35,2.5,1.5,50],['20.323',25,30,80,40,3,1.5,50],
  // H120, 90°.
  ['20.361',6,90,120,14,.4,.5,100],['20.362',8,90,120,14,.5,.5,100],['20.363',10,90,120,18,.6,.5,100],['20.364',12,90,120,18,.8,.5,100],['20.381',16,90,120,24,1,.5,100],
  // H120, 88°.
  ['21.806',6,88,120,14,.8,.5,100],['21.808',8,88,120,14,1,.5,100],['21.810',10,88,120,18,1.2,.5,100],['20.382',12,88,120,18,1.5,.5,100],['20.383',16,88,120,24,2,1.5,100],['20.384',20,88,120,30,2.5,1,100],['20.385',25,88,120,35,3,1,100],
  // H120, 60°.
  ['20.386',6,60,120,14,.4,.5,60],['20.387',8,60,120,14,.5,.5,60],['20.388',10,60,120,18,.6,.5,60],['20.389',12,60,120,18,.8,.5,60],['20.390',16,60,120,24,1.6,.7,60],['20.391',20,60,120,30,2,1,60],['20.392',25,60,120,35,3,1,60],
  // H120, 45°.
  ['20.393',6,45,120,14,.6,1,35],['20.394',8,45,120,18,.8,.8,50],['20.395',10,45,120,18,1,.8,50],['20.396',12,45,120,24,1.5,.8,50],['20.397',16,45,120,24,2,1.5,50],['20.398',20,45,120,30,2.5,1.5,50],['20.399',25,45,120,35,3,1.5,50],
  // H120, 30°.
  ['20.351',6,30,120,18,.6,1,35],['20.352',8,30,120,18,.8,1,35],['20.353',10,30,120,24,1,1,50],['20.354',12,30,120,24,1.5,1,40],['20.401',16,30,120,30,2,1.5,45],['20.402',20,30,120,35,2.5,1.5,50],['20.403',25,30,120,40,3,1.5,50]
 ];
 for(const row of standardRows)amadaStandardDie(...row);

 const accessories=Object.freeze([
  Object.freeze({id:'clark-single-50.650',kind:'adapter',manufacturer:'CLARK / WILA',code:'50.650',name:'Adaptador neumático CLARK · simple',stroke:4,clampingPressureBar:10,clampingForceKg:700,installation:'frontal / vertical',source:accessorySource}),
  Object.freeze({id:'clark-double-50.651',kind:'adapter',manufacturer:'CLARK / WILA',code:'50.651',name:'Adaptador neumático CLARK · doble',stroke:4,clampingPressureBar:10,clampingForceKg:700,installation:'frontal / vertical',source:accessorySource}),
  Object.freeze({id:'punch-800.000',kind:'accessory',manufacturer:'WILA / TRUMPF',code:'800.000',name:'Punzón de plegado/aplastado · conjunto 800.000',length:150,heightOptions:[59,67,100],profileDocumented:true,source:accessorySource}),
  ...['60.680','60.681','60.682','60.683'].map(code=>Object.freeze({id:'holder-'+code,kind:'accessory',manufacturer:'WILA / TRUMPF',code,name:'Soporte inferior para conjunto 800.000 · '+code,source:accessorySource})),
  ...[
   ['20.200','Soporte AMADA para matriz · 20.200','ancho 60 mm · altura 34 mm · asiento 20 mm'],
   ['20.201','Soporte AMADA para matriz · 20.201','ancho 60 mm · altura 55 mm · asiento 35 mm'],
   ['20.306','Soporte AMADA para matriz · 20.306','ancho 60 mm · altura 75 mm · asiento 55 mm'],
   ['20.316','Soporte AMADA para matriz · 20.316','ancho 60 mm · altura 39 mm · asiento 20 mm']
  ].map(([code,name,dimensionsNote])=>Object.freeze({id:'amada-support-'+code,kind:'accessory',manufacturer:'AMADA / PROMECAM',code,name,dimensionsNote,source:amadaSource}))
 ]);
 return {source,PUNCHES:Object.freeze([...punches,...amadaPunches]),DIES:Object.freeze([...dies,...amadaDies,...amadaStandardDies]),ACCESSORIES:accessories};
});
