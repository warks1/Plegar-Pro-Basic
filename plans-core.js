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
return {pdfWithJpeg,makeZip,safeName,availableFormats,extension,formats,crc32};
});