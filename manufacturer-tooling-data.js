/* Cotas transcritas de las páginas 45–54 del catálogo WILA–TRUMPF fotografiado
 * por el propietario. Dimensiones en mm, salvo capacidad (T/m).
 * El contorno exterior no está acotado por completo en todas las referencias;
 * los modelos 2D/3D reproducen la sección publicada y dejan esa limitación visible.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarManufacturerToolData=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const source=Object.freeze({type:'catalog-photo',title:'Catálogo WILA–TRUMPF · páginas 45–54 aportadas por Toni',url:null,version:'páginas 45–54',verified:false,note:'Cotas copiadas de las fotografías del catálogo. Los contornos no acotados por completo son reconstrucciones de la silueta impresa, no CAD del fabricante.'});
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
 return {source,PUNCHES:Object.freeze(punches),DIES:Object.freeze(dies)};
});
