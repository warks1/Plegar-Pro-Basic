/* Plegar Pro Plus v0.27 · Planos: PDF local y archivo ZIP. Sin conversión CAD ficticia. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarPlansCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const utf8=s=>new TextEncoder().encode(String(s));
const ascii=s=>Uint8Array.from([...String(s)].map(c=>c.charCodeAt(0)&255));
const join=parts=>{let size=0;for(const x of parts)size+=x.length;const out=new Uint8Array(size);let p=0;for(const x of parts){out.set(x,p);p+=x.length;}return out;};
const pad=n=>String(n).padStart(10,'0');
function pdfWithJpeg(jpeg,width,height){
 if(!(jpeg instanceof Uint8Array)||jpeg.length<4||jpeg[0]!==255||jpeg[1]!==216||!Number.isFinite(width)||width<=0||height<=0)throw Error('Imagen JPEG no válida');
 const landscape=width>height,pageW=landscape?842:595,pageH=landscape?595:842,margin=24;
 const fit=Math.min((pageW-2*margin)/width,(pageH-2*margin)/height);
 const w=width*fit,h=height*fit,x=(pageW-w)/2,y=(pageH-h)/2;
 const content=`q\n${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im0 Do\nQ\n`;
 const objects=[null,
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  null,null];
 const bytes=[ascii('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')],offset=[0];
 function appendObject(i,chunks){offset[i]=bytes.reduce((a,x)=>a+x.length,0);bytes.push(ascii(`${i} 0 obj\n`),...chunks,ascii('\nendobj\n'));}
 for(let i=1;i<=5;i++){
  if(i===4)appendObject(i,[ascii(`<< /Type /XObject /Subtype /Image /Width ${Math.floor(width)} /Height ${Math.floor(height)} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),jpeg,ascii('\nendstream')]);
  else if(i===5)appendObject(i,[ascii(`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`)]);
  else appendObject(i,[ascii(objects[i])]);
 }
 const begin=bytes.reduce((a,x)=>a+x.length,0);
 bytes.push(ascii(`xref\n0 6\n0000000000 65535 f \n${[1,2,3,4,5].map(i=>pad(offset[i])+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${begin}\n%%EOF\n`));
 return new Blob([join(bytes)],{type:'application/pdf'});
}
const extension=name=>{const m=String(name||'').toLowerCase().match(/\.([a-z0-9]{1,8})$/);return m?m[1]:'';};
const formats=[
 {ext:'pdf',label:'PDF · intercambio y archivo',category:'Documento'},
 {ext:'dxf',label:'DXF · geometría 2D CAD/CAM',category:'CAD 2D'},
 {ext:'dwg',label:'DWG · planos CAD editables',category:'CAD 2D'},
 {ext:'step',label:'STEP / STP · sólidos 3D',category:'CAD 3D',also:['stp']},
 {ext:'iges',label:'IGES / IGS · intercambio CAD',category:'CAD 3D',also:['igs']},
 {ext:'sldprt',label:'SLDPRT · pieza SolidWorks',category:'Nativo SolidWorks'},
 {ext:'sldasm',label:'SLDASM · conjunto SolidWorks',category:'Nativo SolidWorks'},
 {ext:'slddrw',label:'SLDDRW · plano SolidWorks',category:'Nativo SolidWorks'},
 {ext:'stl',label:'STL · malla para prototipos',category:'Malla 3D'},
 {ext:'3mf',label:'3MF · fabricación aditiva',category:'Malla 3D'},
 {ext:'svg',label:'SVG · vector 2D',category:'Vector'},
 {ext:'nc',label:'NC / G-code · CAM específico de máquina',category:'CAM',also:['tap','gcode']}
];
function availableFormats(original){const ext=extension(original);return formats.map(f=>({...f,available:f.ext==='pdf'||f.ext===ext||f.also?.includes(ext)||false}));}
function safeName(s){return String(s??'').replace(/[\\/\0-\x1f<>:"|?*]/g,'_').trim().slice(0,128)||'plano';}
const hex=(n,w)=>Number(n).toString(16).padStart(w,'0');
const crcTable=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc32(buffer){let crc=0xffffffff;for(const b of buffer)crc=(crc>>>8)^crcTable[(crc^b)&255];return (crc^0xffffffff)>>>0;}
function le16(v){return Uint8Array.of(v&255,(v>>>8)&255);}
function le32(v){return Uint8Array.of(v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255);}
async function makeZip(files){
 const entries=[],local=[],central=[];let cursor=0;
 for(const file of files){const name=utf8(safeName(file.name)),payload=file.data instanceof Uint8Array?file.data:new Uint8Array(await file.data.arrayBuffer());
  if(name.length>65535||payload.length>200*1024*1024)throw Error('Archivo demasiado grande');
  const crc=crc32(payload);const flags=0x800;
  const localHeader=join([le32(0x04034b50),le16(20),le16(flags),le16(0),le16(0),le16(0),le32(crc),le32(payload.length),le32(payload.length),le16(name.length),le16(0),name]);
  local.push(localHeader,payload);
  const centralHeader=join([le32(0x02014b50),le16(20),le16(20),le16(flags),le16(0),le16(0),le16(0),le32(crc),le32(payload.length),le32(payload.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(cursor),name]);
  central.push(centralHeader);cursor+=localHeader.length+payload.length;entries.push(name);
 }
 const indexSize=central.reduce((sum,a)=>sum+a.length,0);
 return new Blob([...local,...central,join([le32(0x06054b50),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(indexSize),le32(cursor),le16(0)])],{type:'application/zip'});
}

/* ZIP privado sin compresión; importación local: no se publica contenido de clientes. */
const u16=(b,i)=>b[i]|b[i+1]<<8;
const u32=(b,i)=>(b[i]|b[i+1]<<8|b[i+2]<<16|b[i+3]<<24)>>>0;
function safeArchivePath(p){return typeof p==='string'&&p.length<=240&&!/[\\\x00-\x1f:]/.test(p)&&p.split('/').every(t=>t&&t!=='.'&&t!=='..')&&!p.startsWith('/');}
function readStoredZip(input){
 const b=input instanceof Uint8Array?input:new Uint8Array(input);
 if(b.length>100*1024*1024)throw Error('Límite de paquete ZIP: 100 MB');
 const decoder=new TextDecoder('utf-8',{fatal:true}),files=new Map();let pos=0,bytes=0;
 while(pos+4<=b.length&&u32(b,pos)===0x04034b50){
  if(pos+30>b.length)throw Error('Cabecera ZIP incompleta');
  const flag=u16(b,pos+6),method=u16(b,pos+8),crc=u32(b,pos+14),packed=u32(b,pos+18),unpacked=u32(b,pos+22),nameLen=u16(b,pos+26),extraLen=u16(b,pos+28);
  if((flag&9)!==0||method!==0)throw Error('El ZIP debe estar sin comprimir, sin cifrar y sin descriptores de datos');
  if(packed!==unpacked||packed>22*1024*1024)throw Error('Tamaño no permitido en el ZIP');
  const begin=pos+30+nameLen+extraLen,end=begin+packed;
  if(end>b.length)throw Error('Entrada ZIP incompleta');
  const name=decoder.decode(b.subarray(pos+30,pos+30+nameLen));
  if(!safeArchivePath(name)||files.has(name))throw Error('Nombre duplicado o ruta no válida en ZIP');
  const data=b.subarray(begin,end);
  if(crc32(data)!==crc)throw Error('Fallo de integridad CRC en ZIP: '+name);
  files.set(name,data);bytes+=packed;
  if(files.size>160||bytes>100*1024*1024)throw Error('Demasiados archivos para importar');
  pos=end;
 }
 if(!files.size||pos+4>b.length||u32(b,pos)!==0x02014b50)throw Error('ZIP incompleto o formato no admitido');
 const eocd=b.length-22;
 if(eocd<pos||u32(b,eocd)!==0x06054b50||u16(b,eocd+10)!==files.size)throw Error('Directorio ZIP no válido');
 return files;
}
function readPlanBundle(input){
 const files=readStoredZip(input),indexes=[...files.keys()].filter(n=>n.endsWith('/indice-planos.json'));
 if(indexes.length!==1)throw Error('El ZIP necesita exactamente un índice de carpeta');
 const indexPath=indexes[0],prefix=indexPath.slice(0,-'indice-planos.json'.length);
 let manifest;try{manifest=JSON.parse(new TextDecoder().decode(files.get(indexPath)));}catch{throw Error('Índice JSON ilegible');}
 const folder=manifest?.folder;
 if(manifest?.type!=='plans-import-v1'||manifest.version!==1||!folder||folder.length>60||folder.trim()!==folder||prefix!==folder+'/'||!Array.isArray(manifest.documents)||manifest.documents.length<1||manifest.documents.length>50)throw Error('Índice de planos inválido');
 const seen=new Set(),documents=[];
 for(const doc of manifest.documents){
  const pdfPath=prefix+doc.pdf,originalPath=prefix+doc.original,thumbPath=prefix+doc.thumbnail;
  if(![doc.name,doc.pdf,doc.original,doc.thumbnail,doc.originalName].every(x=>typeof x==='string'&&x.length<=240)||!safeArchivePath(pdfPath)||!safeArchivePath(originalPath)||!safeArchivePath(thumbPath)||seen.has(doc.pdf))throw Error('Documento duplicado o rutas incorrectas');
  seen.add(doc.pdf);
  const pdf=files.get(pdfPath),original=files.get(originalPath),thumbnail=files.get(thumbPath);
  if(!pdf||!original||!thumbnail||pdf.length<5||String.fromCharCode(...pdf.subarray(0,5))!=='%PDF-'||original.length<4||original[0]!==255||original[1]!==216||thumbnail.length<4||thumbnail[0]!==255||thumbnail[1]!==216)throw Error('Faltan PDF, foto original o miniatura válidos: '+doc.pdf);
  if(!doc.name.toLowerCase().endsWith('.pdf')||!doc.pdf.toLowerCase().endsWith('.pdf')||(!doc.original.toLowerCase().endsWith('.jpeg')&&!doc.original.toLowerCase().endsWith('.jpg'))||!doc.thumbnail.toLowerCase().endsWith('.jpg'))throw Error('Formato inesperado en el paquete');
  documents.push({name:safeName(doc.name),sourceId:doc.pdf,originalName:safeName(doc.originalName),pdf,original,thumbnail,note:String(doc.note||'Plano fotográfico importado con su PDF original').slice(0,300)});
 }
 return {folder,documents};
}

return {pdfWithJpeg,makeZip,safeName,availableFormats,extension,formats,crc32,readPlanBundle};
});