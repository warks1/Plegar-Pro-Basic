/* Plegar Pro Plus v0.13 — referencias dimensionales documentadas por fabricante.
 * Solo consulta: datos parciales de fichas públicas, SIN contorno CAD, amarre
 * contrastado en máquina, tolerancias de montaje ni validación de colisiones.
 * No incorporar aquí perfiles generados o valores extrapolados de otros útiles.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarManufacturerReferences=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const inspected='2026-10-19';
 const official=(title,url,revision=null)=>Object.freeze({title,url,inspected,revision,origin:'publicación del fabricante',cadAvailable:false});
 const SOURCES=Object.freeze([
  Object.freeze({id:'amada-amts',manufacturer:'AMADA',kind:'catalog',source:official('AMTS — catálogo de utillaje','https://www.amada.de/CentralData/Bending/Tools/AMTS/Brochures/EN/AMTS_Catalog.pdf','© 2019')}),
  Object.freeze({id:'amada-afh',manufacturer:'AMADA',kind:'catalog',source:official('AFH — catálogo de herramientas','https://www.amada.de/CentralData/Bending/Tools/AFH/Brochures/EN/AFH_Catalog.pdf','© 2018')}),
  Object.freeze({id:'amada-standard',manufacturer:'AMADA',kind:'catalog',source:official('STANDARD — catálogo de herramientas','https://www.amada.de/CentralData/Bending/Tools/STANDARD/Brochures/EN/STANDARD_Catalog.pdf','© 2018')}),
  Object.freeze({id:'trumpf-tools',manufacturer:'TRUMPF',kind:'catalog',source:official('TRUMPF — biblioteca de herramientas de plegado','https://www.trumpf.com/en_INT/products/services/services-machines-systems-and-lasers/tools/bending-tools/','revisión no especificada')})
 ]);
 // sku y las medidas pertenecen a esta variante concreta, NO a la familia completa.
 const RECORDS=Object.freeze([
  Object.freeze({id:'amada-mt508-v8-30-415',manufacturer:'AMADA',kind:'die',family:'AMTS',model:'MT 508 · matriz 1V V8/30°',orderNumber:'50838E',length:415,opening:8,angle:30,shoulderRadius:1,height:116,width:18,capacity:200,source:official('AMADA AMTS · matriz MT508 V8/30°','https://www.amada.de/en/tools/bending-tools/amts/dies/1v-die-623.html'),mounting:'Sistema AMTS (confirmar amarre y compatibilidad)',note:'Longitud de variante Long. Radio de hombro, no radio interior resultante.'}),
  Object.freeze({id:'amada-202-p88-r06-835',manufacturer:'AMADA',kind:'punch',family:'STANDARD',model:'Punzón recto 202 · 88° · R0,6',orderNumber:'DX602061',length:835,angle:88,nose:0.6,height:100,capacity:300,source:official('AMADA STANDARD · punzón 202','https://m.amada.de/en/tools/bending-tools/standard/punches/standard-punch-202-79.html'),mounting:'STANDARD (confirmar amarre y compatibilidad)',note:'La página incluye otra variante R0,2; esta referencia es exclusivamente la R0,6.'}),
  Object.freeze({id:'amada-846-p88-r06-835',manufacturer:'AMADA',kind:'punch',family:'NEW AFH STANDARD',model:'Punzón cuello de cisne 846 · 88° · R0,6',orderNumber:'ES8467061',length:835,angle:88,nose:0.6,height:120,capacity:450,source:official('AMADA New AFH · punzón cuello de cisne 846','https://m.amada.de/en/tools/bending-tools/new-afh/punches/gooseneck-punch-846-827.html'),mounting:'New AFH Standard (confirmar amarre y compatibilidad)',note:'El cuello de cisne requiere perfil completo CAD para cribado de interferencias.'}),
  Object.freeze({id:'amada-a13-p30-r06-835',manufacturer:'AMADA',kind:'punch',family:'AFH',model:'Punzón agudo A13 · 30° · R0,6',orderNumber:'AGA13061',length:835,angle:30,nose:0.6,height:120,capacity:450,source:official('AMADA AFH · 30° Acute Punch A13','https://www.amada.de/CentralData/Bending/Tools/AFH/Brochures/EN/AFH_Catalog.pdf','© 2018'),mounting:'AFH (confirmar amarre y compatibilidad)',note:'Medidas y referencia extraídas del catálogo AFH del fabricante.'}),
  Object.freeze({id:'amada-newafh-v16-88-835',manufacturer:'AMADA',kind:'die',family:'NEW AFH STANDARD',model:'Matriz 1V V16/88° · hombro R2,5',orderNumber:'ED0777251',length:835,opening:16,angle:88,shoulderRadius:2.5,height:60,width:20,capacity:1000,source:official('AMADA New AFH Standard · 1V Die V16/88°','https://www.amada.de/CentralData/Bending/Tools/NEWAFHStandard/Brochures/EN/NEWAFHStandard_Catalog.pdf','© 2018'),mounting:'Sistema plug-in (confirmar equipo específico)',note:'La geometría de los hombros y alojamiento no puede reconstruirse solo con estas cotas.'})
 ]);
 const get=id=>RECORDS.find(r=>r.id===id)||null;
 const list=kind=>kind==='all'||!kind?RECORDS.slice():RECORDS.filter(r=>r.kind===kind);
 const summary=r=>{
  if(!r)throw new Error('Referencia inexistente.');
  const dimensions=[`Ángulo ${r.angle}°`,r.kind==='punch'?`Radio de punta R${r.nose} mm`:`Apertura V${r.opening} mm · radio de hombro R${r.shoulderRadius} mm`,`Altura ${r.height} mm`,`Largo ${r.length} mm`];
  if(r.width!==undefined)dimensions.push(`Ancho ${r.width} mm`);
  dimensions.push(`Carga nominal publicada ${r.capacity} kN/m`);
  return dimensions.join(' · ');
 };
 function validate(){
  const ids=new Set();
  for(const r of RECORDS){
   if(ids.has(r.id))throw new Error('Referencia duplicada.');ids.add(r.id);
   if(r.manufacturer!=='AMADA'||!['punch','die'].includes(r.kind)||!r.orderNumber||!r.model||!r.family||!r.mounting)throw new Error('Ficha de fabricante incompleta.');
   if(![r.angle,r.height,r.length,r.capacity].every(v=>Number.isFinite(v)&&v>0)||r.angle>=180)throw new Error('Dimensión oficial inválida.');
   if(r.kind==='die'&&![r.opening,r.shoulderRadius,r.width].every(v=>Number.isFinite(v)&&v>0))throw new Error('Dimensión de matriz inválida.');
   if(r.kind==='punch'&&!(r.nose>0))throw new Error('Radio de punzón inválido.');
   if(r.source.origin!=='publicación del fabricante'||r.source.cadAvailable!==false||r.source.inspected!==inspected)throw new Error('Estado de validación incorrecto.');
   if(!/^https:\/\/(?:(?:www|m)\.)?amada\.de\//.test(r.source.url))throw new Error('URL oficial no reconocida.');
  }
  for(const s of SOURCES){if(!s.source.url.startsWith('https://')||!s.source.title||!s.manufacturer)throw new Error('Fuente incompleta.');}
  return Object.freeze({records:RECORDS.length,punches:list('punch').length,dies:list('die').length,catalogs:SOURCES.length,cadValidated:0});
 }
 validate();
 return {RECORDS,SOURCES,get,list,summary,validate};
});
