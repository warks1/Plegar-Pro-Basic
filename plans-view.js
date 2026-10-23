/* Plegar Pro Plus v0.28 - Planos: importación privada de carpetas ZIP PDF. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarPlans=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const C=()=>root.PlegarPlansCore,D=()=>root.PlegarPlanDrawing;
const DB='plegar-pro-planos-v1',MAX_FILE=22*1024*1024,MAX_COUNT=150;
let listenerController=null,dbPromise=null,host=null,selectedFolder='all',selectedPlan=null,search='',busy=false,previewURL=null,folderCache=[],plansCache=[];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const waitReq=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
function openDb(){
 if(!root.indexedDB)return Promise.reject(Error('Este navegador no permite guardar documentos locales (IndexedDB).'));
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  const req=root.indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('folders',{keyPath:'id'});const docs=db.createObjectStore('plans',{keyPath:'id'});docs.createIndex('folderId','folderId');};
  req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result);
 }).catch(err=>{dbPromise=null;throw err;});return dbPromise;
}
async function all(name){const db=await openDb();return waitReq(db.transaction(name,'readonly').objectStore(name).getAll());}
async function get(name,id){const db=await openDb();return waitReq(db.transaction(name,'readonly').objectStore(name).get(id));}
async function change(name,op,data){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(name,'readwrite');tx.objectStore(name)[op](data);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
const identity=()=>typeof root.crypto?.randomUUID==='function'?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const repositoryFolderId='repo-trenirtrade';
function repoRows(){return (root.PlegarRepoPlans?.docs||[]).map(d=>({...d,folderId:folderCache.find(f=>f.name.toLowerCase()==='trenirtrade')?.id||repositoryFolderId,repository:true}));}
function revokePreview(){if(previewURL){URL.revokeObjectURL(previewURL);previewURL=null;}}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=C().safeName(name);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function tell(message,error=false){if(!host)return;const output=host.querySelector('#pl-message');if(!output)return;output.textContent=message;output.dataset.kind=error?'error':'ok';}
function canvas(w,h){const element=document.createElement('canvas');element.width=w;element.height=h;return element;}
function drawContained(ctx,source,x,y,w,h){const s=Math.min(w/source.width,h/source.height);ctx.drawImage(source,x+(w-source.width*s)/2,y+(h-source.height*s)/2,source.width*s,source.height*s);}
async function jpegPdf(picture){const data=await new Promise((resolve,reject)=>picture.toBlob(blob=>blob?resolve(blob):reject(Error('No se pudo codificar la imagen.')),'image/jpeg',0.84));return C().pdfWithJpeg(new Uint8Array(await data.arrayBuffer()),picture.width,picture.height);}
const drawingSrc=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
async function drawingPdf(svg){
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=await new Promise((resolve,reject)=>{
   const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('No se pudo convertir el plano SVG a PDF.'));img.src=url;
  });
  const c=canvas(1800,600),ctx=c.getContext('2d');
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0,1800,600);
  return await jpegPdf(c);
 }finally{URL.revokeObjectURL(url);}
}
async function saveProgram(profile,{width=100,name=null,folderId=null,sourcePlanId=null}={}){
 if(busy)throw Error('Otra importación está en curso.');
 if(!D())throw Error('Motor de planos 2D/3D no disponible.');
 const named={...profile,name:(name||profile.name||'').trim()};
 const drawing=D().create(named,{width});
 const saved=await all('plans');
 if(saved.length>=MAX_COUNT)throw Error('Límite local de 150 planos. Exporta una copia ZIP.');
 let folders=await all('folders');
 if(!folders.length){const initial={id:'default',name:'Sin cliente'};await change('folders','put',initial);folders=[initial];}
 const chosen=folderId||host?.querySelector('#pl-target')?.value;
 const folder=folders.find(f=>f.id===chosen&&!f.repository)||folders.find(f=>f.id==='default')||folders.find(f=>!f.repository);
 if(!folder)throw Error('No hay carpeta local para guardar.');
 const basename=C().safeName(drawing.profile.name).replace(/\.(pdf|json|svg)$/i,'').slice(0,90);
 const editable={format:'plegar-pro-profile2d',version:2,...drawing.profile};
 const row={
  id:identity(),folderId:folder.id,name:basename+'.pdf',originalName:basename+'.json',
  created:new Date().toISOString(),original:new Blob([JSON.stringify(editable,null,2)],{type:'application/json'}),
  pdf:await drawingPdf(drawing.sheet),
  thumbnail:drawingSrc(drawing.svg2d),svg2d:drawing.svg2d,svg3d:drawing.svg3d,
  profile:drawing.profile,width:drawing.width,sourcePlanId,
  pdfKind:'generated-2d-3d',
  note:'Plano 2D acotado y vista 3D derivados del programa. Geometría nominal, no apta para CNC.',
  mime:'application/json'
 };
 await change('plans','put',row);
 if(host){await refresh();tell('Planos 2D y 3D guardados en '+folder.name+'. Exporta una copia ZIP de seguridad.');}
 return {id:row.id,name:row.name,folderId:row.folderId};
}
function thumb(picture){const c=canvas(176,124),ctx=c.getContext('2d');ctx.fillStyle='#f4f8fc';ctx.fillRect(0,0,176,124);drawContained(ctx,picture,4,4,168,116);return c.toDataURL('image/jpeg',0.72);}
async function fromImage(file){let bitmap=null;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw Error('La foto no puede abrirse en este dispositivo. Convierte HEIC/RAW a JPG o PNG y reintenta.');}
 try{const scale=Math.min(1,1700/Math.max(bitmap.width,bitmap.height));const c=canvas(Math.max(1,Math.round(bitmap.width*scale)),Math.max(1,Math.round(bitmap.height*scale)));const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0,c.width,c.height);return {pdf:await jpegPdf(c),thumbnail:thumb(c),note:'PDF con la fotografía de la pieza.',type:'image'};}
 finally{bitmap.close?.();}
}
function dxfdrawing(doc){const c=canvas(1500,1050),ctx=c.getContext('2d');ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,1500,1050);ctx.fillStyle='#0c3454';ctx.font='bold 27px sans-serif';ctx.fillText('VISTA DXF 2D · NO A ESCALA PARA FABRICACIÓN',55,55);
 const bounds=doc.bounds;const w=Math.max(bounds.width,.01),h=Math.max(bounds.height,.01),s=Math.min(1320/w,840/h);const offsetX=90+(1320-w*s)/2,offsetY=100+(840-h*s)/2;
 ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';for(const shape of doc.contours){const pts=shape.points;if(!pts?.length)continue;ctx.strokeStyle='#1273bf';ctx.beginPath();pts.forEach((p,i)=>{const x=offsetX+(p.x-bounds.minX)*s,y=offsetY+(bounds.maxY-p.y)*s;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});if(shape.closed)ctx.closePath();ctx.stroke();}
 ctx.fillStyle='#40576b';ctx.font='21px sans-serif';ctx.fillText(`${doc.contours.length} entidades · ${w.toFixed(2)} × ${h.toFixed(2)} mm · INSPECCIÓN`,55,1012);
 return c;
}
async function coverPdf(filename,ext){const c=canvas(1190,1684),ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#0a4064';ctx.fillRect(0,0,1190,155);ctx.fillStyle='#ffffff';ctx.font='bold 56px sans-serif';ctx.fillText('PLEGAR PRO PLUS · PLANOS',70,105);ctx.fillStyle='#103b58';ctx.font='bold 35px sans-serif';ctx.fillText('Ficha PDF del archivo original',75,260);
 ctx.font='26px sans-serif';ctx.fillText('Nombre:',75,390);ctx.font='bold 27px sans-serif';ctx.fillText(filename.slice(0,61),75,445);ctx.font='26px sans-serif';ctx.fillText(`Formato original: ${ext.toUpperCase()||'desconocido'}`,75,550);ctx.fillText('El original se conserva en la biblioteca.',75,645);
 ctx.fillStyle='#a03423';ctx.font='bold 30px sans-serif';ctx.fillText('ATENCIÓN: NO ES UN PLANO CAD CONVERTIDO',75,820);ctx.fillStyle='#334b61';ctx.font='25px sans-serif';ctx.fillText('Este PDF es una ficha de archivo, no una conversion',75,885);ctx.fillText('del sólido ni de sus cotas. Exporta el archivo original',75,935);ctx.fillText('para abrirlo en un programa CAD compatible.',75,985);ctx.fillText('NO APTO PARA FABRICACIÓN, CAM NI CNC.',75,1100);
 return {pdf:await jpegPdf(c),thumbnail:null,note:'Ficha PDF. Geometría no convertible sin CAD especializado.',type:'cover'};}
async function convertFile(file){const ext=C().extension(file.name);if(ext==='pdf'||file.type==='application/pdf'){
 const magic=new Uint8Array(await file.slice(0,5).arrayBuffer());if(String.fromCharCode(...magic)!=='%PDF-')throw Error('El archivo no contiene una cabecera PDF válida.');
 return {pdf:file,thumbnail:null,note:'PDF original conservado sin cambios.',type:'pdf'};
 }
 if(['jpg','jpeg','png','webp','bmp','gif','heic','heif'].includes(ext)||(!ext&&file.type.startsWith('image/'))){
  try{return await fromImage(file);}catch(err){if(['jpg','jpeg','png','webp'].includes(ext))throw err;return {...await coverPdf(file.name,ext),note:`Foto no decodificable: ${err.message}`};}
 }
 if(ext==='dxf'){
  try{const text=await file.text();const doc=root.PlegarCadProfile.parseDocument(text);const c=dxfdrawing(doc);return {pdf:await jpegPdf(c),thumbnail:thumb(c),note:'Representación DXF 2D orientativa; copia PDF rasterizada, sin cotas certificadas.',type:'dxf'};}
  catch(e){return {...await coverPdf(file.name,ext),note:`DXF sin representación compatible: ${e.message}`};}
 }
 return await coverPdf(file.name,ext);
}
async function refresh(){folderCache=(await all('folders')).sort((a,b)=>a.name.localeCompare(b.name,'es'));if(root.PlegarRepoPlans?.docs?.length&&!folderCache.some(f=>f.name.toLowerCase()==='trenirtrade'))folderCache.push({id:repositoryFolderId,name:'Trenirtrade',repository:true});const locals=(await all('plans')).sort((a,b)=>b.created.localeCompare(a.created));plansCache=[...locals,...repoRows().filter(r=>!locals.some(l=>l.name===r.name&&l.folderId===r.folderId))];if(selectedFolder!=='all'&&!folderCache.some(f=>f.id===selectedFolder))selectedFolder='all';render();}
function folderName(id){return folderCache.find(f=>f.id===id)?.name||'Sin cliente';}
function tile(p){return `<article class="pl-item" data-id="${escape(p.id)}"><div class="pl-thumb">${p.thumbnail?`<img src="${p.thumbnail}" alt="Miniatura del plano"/>`:`<span class="pl-no-preview">${escape((C().extension(p.name)||'PDF').toUpperCase())}<small>Sin vista de geometría</small></span>`}</div><div class="pl-item-copy"><strong>${escape(p.name)}</strong><span>${escape(folderName(p.folderId))} · ${escape(new Date(p.created).toLocaleDateString('es-ES'))}</span><small>${escape(p.note)}</small></div><div class="pl-item-actions"><button type="button" data-action="program" data-id="${escape(p.id)}">Abrir en Programación</button><button type="button" data-action="preview" data-id="${escape(p.id)}">Ver</button><button type="button" data-action="pdf" data-id="${escape(p.id)}">PDF</button><button type="button" data-action="share" data-id="${escape(p.id)}">Enviar</button><button type="button" data-action="more" data-id="${escape(p.id)}">Formatos</button>${p.svg2d?`<button type="button" data-action="svg2d" data-id="${escape(p.id)}">↓ SVG 2D</button><button type="button" data-action="svg3d" data-id="${escape(p.id)}">↓ SVG 3D</button>`:''}</div></article>`;}
function render(){if(!host)return;const filtered=plansCache.filter(p=>(selectedFolder==='all'||p.folderId===selectedFolder)&&(!search||`${p.name} ${folderName(p.folderId)}`.toLowerCase().includes(search.toLowerCase())));
 host.innerHTML=`<section class="pl-layout"><div class="pl-toolbar"><div><h2>Biblioteca de planos</h2><p>Importa fotos, capturas y planos. Desde Programación 2D puedes guardar PDF combinado, SVG 2D/3D y JSON editable. Las capturas requieren medidas confirmadas para generar geometría.</p></div><div class="pl-tools"><button data-action="open-files">＋ Importar archivos</button><button data-action="open-camera">📷 Hacer foto</button><button data-action="open-screenshot">▣ Importar captura</button><button data-action="open-bundle">📁 Importar carpeta ZIP</button><button data-action="backup">↓ Copia ZIP</button></div></div>
 <div class="pl-area"><aside class="pl-folders"><h3>Clientes / carpetas</h3><button data-action="folder" data-folder="all" class="${selectedFolder==='all'?'active':''}">▣ Todos los planos <span>${plansCache.length}</span></button>${folderCache.map(f=>`<button data-action="folder" data-folder="${escape(f.id)}" class="${selectedFolder===f.id?'active':''}">▸ ${escape(f.name)} <span>${plansCache.filter(p=>p.folderId===f.id).length}</span></button>`).join('')}<form id="pl-folder-form"><label for="pl-folder-name">Nueva carpeta de cliente</label><input id="pl-folder-name" maxlength="60" required placeholder="Nombre del cliente" autocomplete="off"/><button type="submit">Crear carpeta</button></form></aside>
 <div class="pl-content"><div class="pl-create-from-editor"><strong>Crear plano desde Programación 2D</strong><label>Nombre del archivo<input id="pl-program-name" maxlength="70" placeholder="Nombre actual de la pieza"/></label><label>Ancho 3D (mm)<input id="pl-program-width" type="number" min="1" max="5000" step="1" value="100"/></label><button data-action="save-program" type="button">Guardar plano 2D + 3D</button><small>Utiliza los tramos, ángulos, material y espesor del programa. El ancho 3D se introduce manualmente.</small></div><div class="pl-filter"><label>Buscar<input id="pl-search" value="${escape(search)}" placeholder="Buscar por plano o cliente"/></label><label>Guardar importaciones en<select id="pl-target">${folderCache.map(f=>`<option value="${escape(f.id)}" ${selectedFolder===f.id?'selected':''}>${escape(f.name)}</option>`).join('')}</select></label></div><p class="pl-summary">${filtered.length} plano${filtered.length===1?'':'s'} · PDFs disponibles para descarga y compartición</p><div id="pl-message" role="status" aria-live="polite"></div><div class="pl-items">${filtered.length?filtered.map(tile).join(''):'<p class="pl-empty">Aquí aparecerán los planos importados y una miniatura de cada pieza cuando pueda obtenerse.</p>'}</div></div></div>
 <div class="pl-policy"><strong>Formatos recomendados:</strong> PDF para consulta, DXF/DWG para planos CAD 2D, STEP/IGES para sólidos, SLDPRT/SLDDRW para SolidWorks, STL/3MF para mallas y NC/G-code solo con posprocesador específico. <strong>No se generan estos formatos a partir de fotos o PDFs:</strong> solo se descargan cuando el original importado coincide con ellos.</div>
 <input id="pl-files" type="file" hidden multiple accept="image/*,.pdf,.dxf,.dwg,.step,.stp,.iges,.igs,.sldprt,.sldasm,.slddrw,.stl,.3mf,.svg,.nc,.gcode,.tap,.heic,.heif"/><input id="pl-camera" type="file" hidden accept="image/*" capture="environment"/><input id="pl-screenshot" type="file" hidden accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"/><input id="pl-bundle" type="file" hidden accept=".zip,application/zip"/></section><div class="pl-modal" id="pl-modal" hidden></div>`;
}
async function importFiles(fileList){if(busy)return;const files=[...fileList];if(!files.length)return;if(!folderCache.length){tell('Primero crea una carpeta de cliente para guardar los planos.',true);return;}
 const target=host.querySelector('#pl-target').value;if(!folderCache.some(f=>f.id===target)){tell('Selecciona una carpeta de cliente válida.',true);return;}
 busy=true;let ok=0,failed=[];for(const file of files){try{
 if(file.size>MAX_FILE)throw Error('Límite: 22 MB por archivo');if(!file.size)throw Error('Archivo vacío');if(plansCache.length+ok>=MAX_COUNT)throw Error('Límite local de 150 planos');
 const converted=await convertFile(file);const row={id:identity(),folderId:target,name:C().safeName(file.name),created:new Date().toISOString(),original:file,pdf:converted.pdf,thumbnail:converted.thumbnail,pdfKind:converted.type,note:converted.note,bytes:file.size,mime:file.type};await change('plans','put',row);ok++;
 }catch(e){failed.push(`${file.name}: ${e.message||e}`);}}
 busy=false;await refresh();tell(`${ok} plano(s) importado(s)${failed.length?'. Errores: '+failed.join(' · '):' y guardados en PDF.'}`,!!failed.length);
}
function dataURL(bytes){let result='';for(let i=0;i<bytes.length;i+=0x8000)result+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return 'data:image/jpeg;base64,'+btoa(result);}
async function importFolderZip(file){
 if(busy)throw Error('Ya hay una importación en curso');
 if(!file||!file.size||file.size>100*1024*1024)throw Error('ZIP vacío o superior a 100 MB');
 busy=true;
 try{
  const bundle=C().readPlanBundle(await file.arrayBuffer());
  const existing=await all('folders');let folder=existing.find(f=>f.name.toLocaleLowerCase('es')===bundle.folder.toLocaleLowerCase('es'));
  const saved=await all('plans');
  const incoming=bundle.documents.filter(d=>!saved.some(p=>p.sourceId===d.sourceId&&p.folderId===folder?.id&&p.importFolder===bundle.folder));
  if(saved.length+incoming.length>MAX_COUNT)throw Error('No caben más planos en esta biblioteca (máximo 150)');
  if(!folder){folder={id:identity(),name:bundle.folder};await change('folders','put',folder);}
  let added=0;
  for(const d of incoming){
   await change('plans','put',{
    id:identity(),folderId:folder.id,name:d.name,sourceId:d.sourceId,importFolder:bundle.folder,created:new Date().toISOString(),
    original:new Blob([d.original],{type:'image/jpeg'}),pdf:new Blob([d.pdf],{type:'application/pdf'}),
    thumbnail:dataURL(d.thumbnail),pdfKind:'image',note:d.note,bytes:d.original.length,mime:'image/jpeg'
   });added++;
  }
  selectedFolder=folder.id;await refresh();
  tell(`${bundle.folder}: ${added} plano(s) PDF guardados con miniatura y foto original.${bundle.documents.length-added?' Omitidos duplicados: '+(bundle.documents.length-added)+'.':''}`);
 }finally{busy=false;}
}
async function makeBackup(){let list=plansCache.filter(p=>!p.repository&&(selectedFolder==='all'||p.folderId===selectedFolder));if(!list.length){tell('La carpeta seleccionada está vacía.',true);return;}
 const objects=[],manifest={app:'Plegar Pro Plus',module:'Planos',date:new Date().toISOString(),warning:'Los CAD se conservan en formato original; el PDF de cobertura no implica conversión geométrica.',plans:[]};
 for(const p of list){const prefix=p.id.slice(0,10)+'_';objects.push({name:prefix+'PDF_'+C().safeName(p.name).replace(/\.\w+$/,'')+'.pdf',data:p.pdf});objects.push({name:prefix+'ORIGINAL_'+C().safeName(p.originalName||p.name),data:p.original});
  if(p.svg2d)objects.push({name:prefix+'PLANO_2D.svg',data:new Blob([p.svg2d],{type:'image/svg+xml'})});
  if(p.svg3d)objects.push({name:prefix+'PLANO_3D.svg',data:new Blob([p.svg3d],{type:'image/svg+xml'})});
  manifest.plans.push({id:p.id,client:folderName(p.folderId),name:p.name,pdfKind:p.pdfKind,date:p.created,note:p.note,hasProfile:!!p.profile,width:p.width||null});}
 objects.push({name:'indice-planos.json',data:new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})});const zip=await C().makeZip(objects);download(zip,`Planos_${selectedFolder==='all'?'todos':C().safeName(folderName(selectedFolder))}.zip`);tell('Copia ZIP descargada. Guárdala fuera del navegador para evitar pérdidas.');
}
async function getPdf(p){if(p.repository){const res=await fetch(p.pdf);if(!res.ok)throw Error('PDF no disponible en GitHub.');return res.blob();}return p.pdf;}
async function share(p){const pdfName=p.name.replace(/\.[^/.]+$/,'')+'.pdf',blob=await getPdf(p);const file=new File([blob],pdfName,{type:'application/pdf'});
 if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Plano '+p.name});return;}catch(e){if(e.name==='AbortError')return;}}
 download(blob,pdfName);const mail=`mailto:?subject=${encodeURIComponent('Plano: '+p.name)}&body=${encodeURIComponent('Adjunto el plano '+p.name+'. El PDF se ha descargado en mi dispositivo: hay que adjuntarlo manualmente a este correo.')}`;
 tell('PDF descargado. El correo no admite adjuntos automáticos aquí; adjúntalo manualmente.');root.location.href=mail;
}
function showDetails(p){revokePreview();const modal=host.querySelector('#pl-modal');const format=C().availableFormats(p.name);modal.hidden=false;
 const selected=folderCache.map(f=>`<option value="${escape(f.id)}" ${f.id===p.folderId?'selected':''}>${escape(f.name)}</option>`).join('');
 modal.innerHTML=`<div class="pl-dialog" role="dialog" aria-modal="true" aria-label="Detalle del plano"><div class="pl-dialog-head"><strong>${escape(p.name)}</strong><button data-action="close" aria-label="Cerrar ventana">✕</button></div><div class="pl-document">${p.svg2d?`<div class="pl-generated-pair"><figure><img src="${drawingSrc(p.svg2d)}" alt="Plano 2D generado"/><figcaption>Plano 2D nominal</figcaption></figure><figure><img src="${drawingSrc(p.svg3d)}" alt="Vista axonométrica 3D"/><figcaption>Vista 3D nominal</figcaption></figure></div>`:p.thumbnail?`<img src="${p.thumbnail}" alt="Vista previa de la pieza"/>`:`<div class="pl-no-detail-preview">${escape(C().extension(p.name).toUpperCase())} · Geometría no previsualizable con este lector</div>`}</div><p>${escape(p.note)}</p><div class="pl-dialog-actions"><button data-action="pdf" data-id="${escape(p.id)}">↓ PDF</button>${p.repository?'':`${p.repository?"":`<button data-action="original" data-id="${escape(p.id)}">↓ Original editable</button>`}`}<button data-action="share" data-id="${escape(p.id)}">Enviar por correo / compartir</button></div>${p.svg2d?`<div class="pl-dialog-actions"><button data-action="svg2d" data-id="${escape(p.id)}">↓ SVG 2D</button><button data-action="svg3d" data-id="${escape(p.id)}">↓ SVG 3D</button></div>`:''}<h3>Formatos de exportación aconsejados</h3><p>Los formatos CAD/CAM solo son descargables si se importó el archivo en ese formato. No existen conversiones automáticas entre formatos.</p><div class="pl-formats">${format.map(f=>`<div><span>${escape(f.label)}</span><small>${f.available?'Disponible': 'Requiere CAD/CAM externo'}</small></div>`).join('')}</div>${p.repository?'<p>Plano del repositorio (solo lectura).</p>':`<div class="pl-edit"><label>Cambiar cliente<select id="pl-move">${selected}</select></label><button data-action="move" data-id="${escape(p.id)}">Mover</button><button data-action="delete" data-id="${escape(p.id)}">Eliminar plano</button></div>`}</div>`;
}
function closeDetails(){if(!host)return;revokePreview();const modal=host.querySelector('#pl-modal');if(modal){modal.hidden=true;modal.replaceChildren();}}
async function onAction(action,id,button){if(action==='close'){closeDetails();return;}if(action==='open-files'){host.querySelector('#pl-files').click();return;}if(action==='open-camera'){host.querySelector('#pl-camera').click();return;}
  if(action==='open-screenshot'){host.querySelector('#pl-screenshot').click();return;}
  if(action==='save-program'){
   const data=root.PlegarEditor2D?.getData();if(!data)throw Error('No hay un programa 2D disponible.');
   const widthInput=host.querySelector('#pl-program-width'),width=Number(widthInput?.value);
   if(!widthInput?.value.trim()||!Number.isFinite(width)||width<1||width>5000)throw Error('El ancho 3D debe estar entre 1 y 5000 mm.');
   await saveProgram(data,{name:host.querySelector('#pl-program-name')?.value.trim()||data.name,width,folderId:host.querySelector('#pl-target')?.value});return;
  }
  if(action==='open-bundle'){host.querySelector('#pl-bundle').click();return;}if(action==='folder'){selectedFolder=button.dataset.folder;render();return;}if(action==='backup'){await makeBackup();return;}
 const p=plansCache.find(x=>x.id===id);if(!p)return;
 if(action==='program'&&p.profile){root.PlegarEditor2D?.loadProfile(p.profile);closeDetails();root.PlegarApp?.switchScreen('Programación 2D');return;}
  if(action==='program'){root.PlegarEditor2D?.setPlanReference({id:p.id,name:p.name,thumbnail:p.thumbnail||'',preview:p.preview||p.thumbnail||'',pdfUrl:p.repository?p.pdf:null,source:p.repository?'GitHub / Trenirtrade':folderName(p.folderId)});closeDetails();root.PlegarApp?.switchScreen('Programación 2D');return;}
 if(action==='preview'||action==='more'){selectedPlan=id;showDetails(p);return;}
 if(action==='pdf'){download(await getPdf(p),p.name.replace(/\.[^/.]+$/,'')+'.pdf');return;}
 if(action==='original'){if(p.repository)throw Error('El repositorio conserva el PDF, no la fotografía original.');download(p.original,p.originalName||p.name);return;}
  if(action==='svg2d'||action==='svg3d'){
   const svg=action==='svg2d'?p.svg2d:p.svg3d;if(!svg)throw Error('Vista no disponible para este archivo.');
   download(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),C().safeName(p.name.replace(/\.pdf$/i,'')+(action==='svg2d'?'_2D.svg':'_3D.svg')));return;
  }
 if(action==='share'){await share(p);return;}
 if(action==='move'){if(p.repository)throw Error('El plano público es de solo lectura.');const dest=host.querySelector('#pl-move')?.value;if(!folderCache.some(f=>f.id===dest))throw Error('Cliente no encontrado');await change('plans','put',{...p,folderId:dest});closeDetails();await refresh();tell('Plano movido a su carpeta.');return;}
 if(action==='delete'){if(p.repository)throw Error('Los planos de GitHub son de solo lectura.');if(!root.confirm('¿Eliminar este plano y sus copias guardadas en este dispositivo?'))return;await change('plans','delete',p.id);closeDetails();await refresh();tell('Plano eliminado.');}
}
async function mount(container){destroy();host=container;listenerController=new AbortController();const signal=listenerController.signal;container.classList.add('pl-host');selectedFolder='all';try{await openDb();folderCache=await all('folders');plansCache=await all('plans');if(!folderCache.length){await change('folders','put',{id:'default',name:'Sin cliente'});}await refresh();}catch(e){host.innerHTML=`<p class="pl-error">No se puede abrir la biblioteca local: ${escape(e.message)}. Comprueba los permisos de almacenamiento del navegador.</p>`;return;}
 container.addEventListener('click',async e=>{const button=e.target.closest('[data-action]');if(!button||!container.contains(button))return;try{await onAction(button.dataset.action,button.dataset.id,button);}catch(err){tell(err.message||String(err),true);}},{signal});
 container.addEventListener('submit',async e=>{if(e.target.id!=='pl-folder-form')return;e.preventDefault();const name=container.querySelector('#pl-folder-name').value.trim();if(!name||name.length>60){tell('Nombre de cliente no válido.',true);return;}if(folderCache.some(f=>f.name.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){tell('Esta carpeta ya existe.',true);return;}try{const id=identity();await change('folders','put',{id,name});selectedFolder=id;await refresh();tell('Carpeta creada. Ya puedes importar documentos.');}catch(err){tell(err.message,true);}},{signal});
 container.addEventListener('change',async e=>{if(!['pl-files','pl-camera','pl-screenshot','pl-bundle'].includes(e.target.id))return;const type=e.target.id;const picked=[...e.target.files];e.target.value='';try{if(type==='pl-bundle'){if(picked.length)await importFolderZip(picked[0]);}else await importFiles(picked);}catch(err){tell(err.message||String(err),true);}},{signal});
 container.addEventListener('input',e=>{if(e.target.id!=='pl-search')return;search=e.target.value;const position=e.target.selectionStart;render();const fld=host.querySelector('#pl-search');fld.focus();fld.setSelectionRange(position,position);},{signal});
}
function destroy(){listenerController?.abort();listenerController=null;revokePreview();host=null;selectedPlan=null;}
return {mount,destroy,openDb,convertFile,importFolderZip,saveProgram,dbName:DB};
});
