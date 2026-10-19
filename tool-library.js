/* Plegar Pro Plus v0.12 — catálogo interno paramétrico.
   Los números de esta biblioteca son MODELOS ILUSTRATIVOS, NO fichas oficiales
   ni utillaje verificado de MECOS, AMADA, Trumpf u otros fabricantes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarToolLibrary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const source=Object.freeze({type:'internal-parametric',title:'Plegar Pro Plus · modelo geométrico interno',url:null,version:'v0.12',verified:false,note:'Sin planos oficiales, tolerancias ni referencias verificadas.'});
 const punch=(id,angle,nose,height=null)=>Object.freeze({id,kind:'punch',name:'Punzón genérico '+angle+'° · punta R'+nose+(height?' · H'+height+' mm':''),angle,nose,height,manufacturer:null,source});
 const die=(v,angle,height=null)=>Object.freeze({id:'v'+v+'-'+angle,kind:'die',name:'Matriz genérica V'+v+' · '+angle+'°'+(height?' · H'+height+' mm':''),opening:v,angle,height,manufacturer:null,source});
 const PUNCHES=Object.freeze([
  punch('p88-r1',88,1),punch('p88-r2',88,2),punch('p30-r1',30,1),punch('p30-r2',30,2),
  punch('p30-r1-h100',30,1,100),punch('p30-r1-h120',30,1,120),punch('p30-r1-h150',30,1,150),punch('p88-r2-h100',88,2,100)
 ]);
 const DIES=Object.freeze([
  ...[6,8,10,12,16,22,24,32,35,40,50].map(v=>die(v,88)),
  ...[6,10,12,16,22,24,32,35,40,50].map(v=>die(v,30,50))
 ]);
 function get(kind,id){const list=kind==='punch'?PUNCHES:kind==='die'?DIES:null;return list?.find(t=>t.id===id)||null;}
 function details(tool){
  if(!tool||!['punch','die'].includes(tool.kind))throw new Error('Herramienta no reconocida.');
  const d=tool.kind==='punch'?'Ángulo '+tool.angle+'° · radio nominal R'+tool.nose+' mm':'V '+tool.opening+' mm · ángulo '+tool.angle+'°';
  return d+' · '+(tool.height?'altura nominal H'+tool.height+' mm':'altura no documentada')+' · '+tool.source.title+' ('+tool.source.version+') · SIN VERIFICAR';
 }
 function validate(){
  const records=[...PUNCHES,...DIES],seen=new Set();
  for(const tool of records){
   if(seen.has(tool.id))throw Error('Herramienta duplicada.');seen.add(tool.id);
   if(!tool.source||tool.source.verified!==false||tool.source.url!==null||tool.manufacturer!==null)throw Error('Origen de utillaje inconsistente.');
   if(!(tool.angle>0&&tool.angle<180))throw Error('Ángulo inválido.');
   if((tool.kind==='punch'&&!(tool.nose>0))||(tool.kind==='die'&&!(tool.opening>0)))throw Error('Dimensión inválida.');
   if(tool.height!==null&&!(tool.height>0))throw Error('Altura inválida.');
  }
  return {total:records.length,punches:PUNCHES.length,dies:DIES.length,verified:0};
 }
 validate();
 return {source,PUNCHES,DIES,get,details,validate};
});
