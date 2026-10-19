/* Plegar Pro Plus v0.19 — trazabilidad local optativa de inspecciones DXF.
 * SOLO METADATOS. Nunca activa CNC, máquina ni sólido de utillaje. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadTrace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='plegar-pro-cad-trace-v19',MAX=20;
function assert(condition,message){if(!condition)throw new Error(message);}
// SHA-256 estándar implementado sin dependencias para que funcione también sin WebCrypto (p. ej. vista previa local).
const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
const ROT=(x,n)=>(x>>>n)|(x<<(32-n));
function sha256(bytes){
 assert(bytes instanceof Uint8Array,'Se requieren bytes originales del archivo.');
 assert(bytes.length<=2*1024*1024,'Archivo mayor de 2 MB.');
 const n=bytes.length,pad=(64-((n+9)%64))%64,buf=new Uint8Array(n+9+pad);buf.set(bytes);buf[n]=0x80;
 const len=BigInt(n)*8n;for(let i=0;i<8;i++)buf[buf.length-1-i]=Number((len>>BigInt(i*8))&255n);
 const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);const w=new Uint32Array(64);
 for(let pos=0;pos<buf.length;pos+=64){
  for(let i=0;i<16;i++){let p=pos+i*4;w[i]=((buf[p]<<24)|(buf[p+1]<<16)|(buf[p+2]<<8)|buf[p+3])>>>0;}
  for(let i=16;i<64;i++){let a=w[i-15],b=w[i-2];let s0=ROT(a,7)^ROT(a,18)^(a>>>3),s1=ROT(b,17)^ROT(b,19)^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}
  let [a,b,c,d,e,f,g,z]=h;
  for(let i=0;i<64;i++){let s1=ROT(e,6)^ROT(e,11)^ROT(e,25),ch=(e&f)^(~e&g),t1=(z+s1+ch+K[i]+w[i])>>>0,s0=ROT(a,2)^ROT(a,13)^ROT(a,22),maj=(a&b)^(a&c)^(b&c),t2=(s0+maj)>>>0;z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  for(let i=0;i<8;i++)h[i]=(h[i]+[a,b,c,d,e,f,g,z][i])>>>0;
 }
 return [...h].map(n=>n.toString(16).padStart(8,'0')).join('');
}
function validRecord(r){return !!(r&&r.schema==='plegar-pro-cad-trace-1'&&r.verified===false&&r.activeInSimulation===false&&r.approvedForCNC===false&&/^[a-f0-9]{64}$/.test(r.source?.sha256)&&Number.isInteger(r.contour?.index)&&r.contour.index>=0&&typeof r.id==='string'&&r.id.length<=150&&Number.isFinite(r.envelope?.width_mm)&&Number.isFinite(r.envelope?.height_mm));}
function makeRecord({source,document,shape,oriented,reference,when}={}){
 assert(document?.verified===false&&document.activeInSimulation===false,'DXF verificado o activo: operación rechazada.');
 assert(shape?.verified===false&&shape.activeInSimulation===false,'Contorno no apto para inspección.');
 assert(oriented?.verified===false&&oriented.activeInSimulation===false,'Orientación no apta.');
 assert(source&&/^[a-f0-9]{64}$/.test(source.sha256)&&Number.isInteger(source.bytes)&&source.bytes>=0&&source.bytes<=2097152,'Huella SHA-256 o tamaño de origen inválidos.');
 const name=String(source.name||'sin-nombre.dxf').slice(0,128),b=oriented.bounds;
 assert(b&&Number.isFinite(b.width)&&Number.isFinite(b.height)&&b.width>=0&&b.height>=0,'Dimensiones inválidas.');
 assert(Number.isInteger(shape.index)&&shape.index>=0,'Índice de contorno inválido.');
 const opts=oriented.options||{},orientation={rotation:opts.rotation,mirror:opts.mirror===true,anchor:String(opts.anchor||'min-min'),tolerance_mm:opts.tolerance};
 assert([0,90,180,270].includes(orientation.rotation)&&Number.isFinite(orientation.tolerance_mm)&&orientation.tolerance_mm>=0&&orientation.tolerance_mm<=10,'Orientación inválida.');
 const at=when===undefined?new Date().toISOString():when;assert(!Number.isNaN(Date.parse(at))&&typeof at==='string'&&at.length<=40,'Fecha inválida.');
 const ref=reference?.orderNumber?String(reference.orderNumber).slice(0,80):null;
 const id=`${source.sha256}:${shape.index}:${orientation.rotation}:${Number(orientation.mirror)}:${orientation.anchor}`;
 return Object.freeze({schema:'plegar-pro-cad-trace-1',id,recordedAt:at,
  source:{name,bytes:source.bytes,sha256:source.sha256,units:String(document.units||''),assumedUnits:document.assumedUnits===true},
  contour:{index:shape.index,layer:String(shape.layer||'0').slice(0,80),kind:String(shape.kind||'').slice(0,48),closed:shape.closed===true},
  orientation,envelope:{width_mm:b.width,height_mm:b.height},reference:{orderNumber:ref},
  verified:false,activeInSimulation:false,approvedForCNC:false,
  notice:'SOLO METADATOS LOCALES, SIN CAD COMPLETO. Huella del archivo no valida la autenticidad del fabricante, el amarre ni las colisiones.'});
}
function list(store){const raw=store.getItem(KEY);if(!raw)return [];assert(raw.length<=65000,'Registro local demasiado grande.');let items;try{items=JSON.parse(raw);}catch(_){throw new Error('El registro local no es un JSON válido.');}assert(Array.isArray(items)&&items.length<=MAX,'Registro local no reconocido.');return items.filter(validRecord);}
function save(store,record){assert(validRecord(record),'Registro sin trazabilidad suficiente.');const items=list(store).filter(r=>r.id!==record.id);items.unshift(record);store.setItem(KEY,JSON.stringify(items.slice(0,MAX)));return items.slice(0,MAX);}
function remove(store,id){const items=list(store).filter(x=>x.id!==id);store.setItem(KEY,JSON.stringify(items));return items;}
function clear(store){store.removeItem(KEY);return [];}
function exportRecords(store){return JSON.stringify({schema:'plegar-pro-cad-trace-export-1',generatedAt:new Date().toISOString(),records:list(store),verified:false,approvedForCNC:false},null,2);}
function sameSource(record,digest){return validRecord(record)&&record.source.sha256===digest;}
return Object.freeze({KEY,MAX,sha256,validRecord,makeRecord,list,save,remove,clear,exportRecords,sameSource});
});
