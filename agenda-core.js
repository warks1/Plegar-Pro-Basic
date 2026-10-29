/* Agenda local: fechas de taller sin conversión implícita a UTC. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarAgendaCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const STATUSES=Object.freeze({pending:'Pendiente',working:'En curso',done:'Terminado',cancelled:'Cancelado'}),MAX=2000;
 const text=(v,max)=>String(v??'').trim().slice(0,max);
 function validDate(s){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const [y,m,d]=s.split('-').map(Number);if(y<2000||y>2100)return false;
  const a=new Date(Date.UTC(y,m-1,d));return a.getUTCFullYear()===y&&a.getUTCMonth()===m-1&&a.getUTCDate()===d;
 }
 function validate(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Trabajo de agenda incorrecto.');
  const title=text(value.title,120),date=text(value.date,10),time=text(value.time,5),id=text(value.id,100);
  if(!title)throw Error('Introduce el título del trabajo.');
  if(!validDate(date))throw Error('Introduce una fecha válida entre 2000 y 2100.');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Introduce una hora válida.');
  const duration=Number(value.duration);if(!Number.isInteger(duration)||duration<5||duration>1440)throw Error('Duración entre 5 y 1440 minutos.');
  if(!Object.hasOwn(STATUSES,value.status))throw Error('Estado de trabajo desconocido.');
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('Identificador de trabajo incorrecto.');
  return {id,title,date,time,duration,status:value.status,project:text(value.project,120),operator:text(value.operator,100),notes:text(value.notes,4000)};
 }
 function validateList(rows){if(!Array.isArray(rows)||rows.length>MAX)throw Error('La agenda admite hasta '+MAX+' trabajos.');const clean=rows.map(validate);if(new Set(clean.map(r=>r.id)).size!==clean.length)throw Error('Hay identificadores de trabajo duplicados.');return clean;}
 function order(rows){return [...rows].sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time)||a.title.localeCompare(b.title,'es'));}
 function upsert(rows,value){const task=validate(value),list=validateList(rows),i=list.findIndex(r=>r.id===task.id);if(i<0)list.push(task);else list[i]=task;return order(validateList(list));}
 function dayOffset(date,days){if(!validDate(date))throw Error('Fecha inválida.');const [y,m,d]=date.split('-').map(Number),v=new Date(Date.UTC(y,m-1,d+days));return v.toISOString().slice(0,10);}
 function select(rows,{date='',range='all',status='all',q=''}={}){
  const term=String(q).toLocaleLowerCase('es').trim(),end=range==='week'?dayOffset(date,6):date;
  return order(rows.filter(r=>(range==='all'||r.date>=date&&r.date<=end)&&(status==='all'||r.status===status)&&(!term||[r.title,r.project,r.operator,r.notes].some(v=>v.toLocaleLowerCase('es').includes(term)))));
 }
 function overlaps(rows,task){
  const start=r=>Date.parse(r.date+'T'+r.time+':00Z'),a=start(task),b=a+task.duration*60000;
  if(task.status==='done'||task.status==='cancelled')return [];
  return rows.filter(r=>r.id!==task.id&&!['done','cancelled'].includes(r.status)&&r.operator===task.operator&&start(r)<b&&start(r)+r.duration*60000>a);
 }
 function exportJSON(rows){return JSON.stringify({format:'plegar-agenda',version:1,tasks:validateList(rows)},null,2);}
 function importJSON(raw,current=[]){
  const value=JSON.parse(raw);if(value?.format!=='plegar-agenda'||value.version!==1)throw Error('La copia no es una agenda de Plegar Pro.');
  const incoming=validateList(value.tasks),existing=validateList(current),map=new Map(existing.map(r=>[r.id,r]));
  for(const task of incoming){const old=map.get(task.id);if(old&&JSON.stringify(old)!==JSON.stringify(task))throw Error('La copia contiene una versión distinta de «'+task.title+'». Exporta primero la agenda actual; no se ha sobrescrito ningún trabajo.');map.set(task.id,task);}
  return order(validateList([...map.values()]));
 }
 return {STATUSES,MAX,validate,validateList,order,upsert,select,overlaps,dayOffset,exportJSON,importJSON,validDate};
});
