/* Plegar Pro Plus v0.12 — catálogo paramétrico y referencias fotografiadas.
   Los perfiles comerciales se reconstruyen para visualización; no son CAD ni
   utillaje certificado. Las cotas conservan su fuente de catálogo. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarToolLibrary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const OFFICIAL=typeof module==='object'&&module.exports?require('./manufacturer-tooling-data.js'):window.PlegarManufacturerToolData;
 if(!OFFICIAL)throw new Error('Catálogo WILA–TRUMPF no cargado.');
 const source=Object.freeze({type:'internal-parametric',title:'Plegar Pro Plus · modelo geométrico interno',url:null,version:'v0.12',verified:false,note:'Sin planos oficiales, tolerancias ni referencias verificadas.'});
 const punch=(id,angle,nose,height=null)=>Object.freeze({id,kind:'punch',name:'Punzón genérico '+angle+'° · punta R'+nose+(height?' · H'+height+' mm':''),angle,nose,height,manufacturer:null,source});
 const die=(v,angle,height=null)=>Object.freeze({id:'v'+v+'-'+angle,kind:'die',name:'Matriz genérica V'+v+' · '+angle+'°'+(height?' · H'+height+' mm':''),opening:v,angle,height,manufacturer:null,source});
 const GENERIC_PUNCHES=Object.freeze([
  punch('p88-r1',88,1),punch('p88-r2',88,2),punch('p30-r1',30,1),punch('p30-r2',30,2),
  punch('p30-r1-h100',30,1,100),punch('p30-r1-h120',30,1,120),punch('p30-r1-h150',30,1,150),punch('p88-r2-h100',88,2,100)
 ]);
 const GENERIC_DIES=Object.freeze([
  ...[6,8,10,12,16,22,24,32,35,40,50].map(v=>die(v,88)),
  ...[6,10,12,16,22,24,32,35,40,50].map(v=>die(v,30,50))
 ]);
 const PUNCHES=Object.freeze([...GENERIC_PUNCHES,...OFFICIAL.PUNCHES]);
 const DIES=Object.freeze([...GENERIC_DIES,...OFFICIAL.DIES]);
 const ACCESSORIES=OFFICIAL.ACCESSORIES||Object.freeze([]);
 function get(kind,id){const list=kind==='punch'?PUNCHES:kind==='die'?DIES:null;return list?.find(t=>t.id===id)||null;}
 function details(tool){
  if(!tool||!['punch','die','adapter','accessory'].includes(tool.kind))throw new Error('Herramienta no reconocida.');
  if(tool.kind==='adapter')return 'Código '+tool.code+' · carrera '+tool.stroke+' mm · fuerza de bloqueo '+tool.clampingForceKg+' kg a '+tool.clampingPressureBar+' bar · '+tool.installation+' · geometría no acotada para simulación.';
  if(tool.kind==='accessory')return 'Código '+tool.code+(tool.length?' · L '+tool.length+' mm':'')+(tool.heightOptions?' · alturas indicadas '+tool.heightOptions.join(' / ')+' mm':'')+(tool.dimensionsNote?' · '+tool.dimensionsNote:'')+' · geometría no acotada para simulación.';
  const d=tool.kind==='punch'?'Ángulo '+tool.angle+'° · '+(tool.nose?'radio R'+tool.nose+' mm':'radio sin cota'):
   tool.grooves?'Doble canal '+tool.grooves.map(g=>'V'+g.opening+' · '+g.angle+'° · R'+g.radius+' · posición '+g.offset+' mm').join(' / '):'V '+tool.opening+' mm · ángulo '+tool.angle+'° · '+(tool.shoulderRadius?'hombro R'+tool.shoulderRadius+' mm':'');
  const dims=tool.manufacturer?
   ['H '+tool.height+' mm','cota de cuerpo '+(tool.bodyWidth??'sin cota')+' mm',tool.kind==='punch'?'ancho de amarre '+tool.mountingWidth+' mm':null,
    tool.kind==='punch'&&tool.reach?'alcance '+tool.reach+' mm':null,tool.kind==='punch'&&tool.b?'b '+tool.b+' mm':null,
    tool.availableLengths?'longitudes '+tool.availableLengths.join('/ ')+' mm':'L '+tool.length+' mm',tool.sectionedLength&&!tool.availableLengths?'fraccionado L'+tool.sectionedLength+' mm':null,
   tool.capacityTonPerM?tool.capacityTonPerM+' T/m':null,tool.kind==='die'&&tool.keyWidth?'espiga '+tool.keyWidth+'×'+tool.keyHeight+' mm':null].filter(Boolean).join(' · '):
   (tool.height?'altura nominal H'+tool.height+' mm':'altura no documentada');
  return d+' · '+dims+' · '+tool.source.title+' · CONTORNO NO CAD';
 }
 function validate(){
  const records=[...PUNCHES,...DIES],seen=new Set();
  for(const tool of records){
   if(seen.has(tool.id))throw Error('Herramienta duplicada.');seen.add(tool.id);
   if(!tool.source||tool.source.verified!==false||tool.source.url!==null)throw Error('Origen de utillaje inconsistente.');
   if(![null,'WILA / TRUMPF','AMADA / PROMECAM'].includes(tool.manufacturer))throw Error('Fabricante de herramienta desconocido.');
   if(!(tool.angle>0&&tool.angle<180))throw Error('Ángulo inválido.');
   if((tool.kind==='punch'&&!(tool.nose>0))||(tool.kind==='die'&&!(tool.opening>0)))throw Error('Dimensión inválida.');
   if(tool.height!==null&&!(tool.height>0))throw Error('Altura inválida.');
  }
  return {total:records.length,punches:PUNCHES.length,dies:DIES.length,verified:0,officialCatalogEntries:OFFICIAL.PUNCHES.length+OFFICIAL.DIES.length};
 }
 validate();
 return {source,PUNCHES,DIES,ACCESSORIES,get,details,validate};
});
