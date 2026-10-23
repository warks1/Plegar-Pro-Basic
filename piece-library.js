/* v0.51 · Biblioteca LOCAL de programas 2D/3D. Nada se sube a servidores.
 * Validación de perfiles y copia portable JSON; no se guardan archivos CAD/CNC.
 */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
  typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else {
  // Algunos navegadores en modo privado o vistas sin origen bloquean incluso
  // la lectura de window.localStorage. Mostrar fallo al guardar, no bloquear toda la app.
  let storage;
  try{storage=root.localStorage;}catch{storage=null;}
  if(!storage){
   const unavailable=()=>{throw Error('Almacenamiento local bloqueado. Abre la app por HTTPS y permite guardar datos para utilizar Mis piezas.');};
   storage={getItem:unavailable,setItem:unavailable};
  }
  root.PlegarPieceLibrary=api.create(storage);
 }
})(typeof globalThis!=='undefined'?globalThis:this,function(G,C){
 'use strict';
 const KEY='plegarpro-my-pieces-v1',MAX=80,FORMAT='plegarpro-my-pieces',VERSION=1;
 function validate(profile,width){
  const p={...G.validate(profile),setup:C.validateSetup(profile.setup)};
  const w=Number(width);
  if(!Number.isFinite(w)||w<1||w>5000)throw Error('Ancho de pieza entre 1 y 5000 mm.');
  return {profile:p,width:w};
 }
 function checkRow(x){
  if(!x||typeof x.id!=='string'||!/^pieza-[a-z0-9-]{5,80}$/.test(x.id))throw Error('Identificador de pieza incorrecto.');
  const v=validate(x.profile,x.width);
  const date=x.createdAt,updated=x.updatedAt;
  if(typeof date!=='string'||Number.isNaN(Date.parse(date))||typeof updated!=='string'||Number.isNaN(Date.parse(updated)))throw Error('Fechas de pieza incorrectas.');
  return {id:x.id,...v,name:v.profile.name,createdAt:date,updatedAt:updated};
 }
 function create(storage){
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('Almacenamiento local no disponible.');
  function read(){
   let raw;
   try{raw=storage.getItem(KEY);}catch(e){throw Error('No se pudo leer Mis piezas: '+e.message);}
   if(!raw)return [];
   let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('Mis piezas contiene datos dañados. No se sobrescribirán automáticamente.');}
   if(parsed?.format!==FORMAT||parsed?.version!==VERSION||!Array.isArray(parsed.pieces)||parsed.pieces.length>MAX)throw Error('Versión o índice de Mis piezas no válido. No se sobrescribirá.');
   const entries=parsed.pieces.map(checkRow),ids=new Set(entries.map(x=>x.id));
   if(ids.size!==entries.length)throw Error('Mis piezas contiene identificadores duplicados.');
   return entries;
  }
  function write(pieces){
   if(pieces.length>MAX)throw Error('Máximo '+MAX+' piezas locales. Exporta una copia de seguridad.');
   storage.setItem(KEY,JSON.stringify({format:FORMAT,version:VERSION,pieces}));
  }
  function list(){return read().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  function get(id){return read().find(x=>x.id===id)||null;}
  function save(profile,width,{id=null}={}){
   const data=validate(profile,width),rows=read();
   const at=id===null?-1:rows.findIndex(x=>x.id===id);
   if(id!==null&&at<0)throw Error('La pieza guardada ya no existe. Recupérala desde Mis piezas.');
   const now=new Date().toISOString();
   const row=at>=0?{...rows[at],...data,name:data.profile.name,updatedAt:now}:
    {id:'pieza-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12),...data,name:data.profile.name,createdAt:now,updatedAt:now};
   if(at>=0)rows[at]=row;else rows.push(row);
   write(rows);
   return row;
  }
  function remove(id){
   const rows=read(),next=rows.filter(x=>x.id!==id);
   if(next.length===rows.length)return false;
   write(next);return true;
  }
  function exportBackup(){
   return JSON.stringify({format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),pieces:read()},null,2);
  }
  function importBackup(input){
   const parsed=typeof input==='string'?JSON.parse(input):input;
   if(!parsed||parsed.format!==FORMAT||parsed.version!==VERSION||!Array.isArray(parsed.pieces)||parsed.pieces.length>MAX)throw Error('Formato o versión de copia incompatible.');
   const incoming=parsed.pieces.map(checkRow),ids=new Set(incoming.map(x=>x.id));
   if(ids.size!==incoming.length)throw Error('La copia contiene identificadores duplicados.');
   const existing=read(),seen=new Set(existing.map(x=>x.id));
   const merged=[...existing];let added=0,skipped=0;
   for(const row of incoming){
    if(seen.has(row.id)){skipped++;continue;}
    if(merged.length>=MAX)throw Error('La importación excede las '+MAX+' piezas admitidas. No se ha guardado.');
    merged.push(row);seen.add(row.id);added++;
   }
   if(added)write(merged);
   return {added,skipped,total:merged.length};
  }
  return {KEY,MAX,list,get,save,remove,exportBackup,importBackup};
 }
 return {KEY,MAX,FORMAT,VERSION,validate,create};
});