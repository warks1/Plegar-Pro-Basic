/* Plegar Pro Plus 0.18: auditoría de DATOS NOMINALES de utillaje CAD.
 * Lectura exclusivamente. Nunca certifica montaje, compatibilidad o seguridad. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadMountAudit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DATUMS=Object.freeze(['inferior','superior']);
function assert(ok,message){if(!ok)throw new Error(message);}
function params(input={}){
 assert(input&&typeof input==='object'&&!Array.isArray(input),'Parámetros de auditoría incorrectos.');
 const datum=input.datum??'inferior',offset=Number(input.offset??0);
 assert(DATUMS.includes(datum),'Plano nominal no reconocido.');
 assert(input.offset===undefined||input.offset!=='' ,'Indica un desplazamiento numérico.');
 assert(Number.isFinite(offset)&&Math.abs(offset)<=500,'Desplazamiento nominal fuera del rango ±500 mm.');
 return Object.freeze({datum,offset});
}
function audit(document,shape,oriented,reference,raw={}){
 const setup=params(raw);
 assert(document?.verified===false&&document.activeInSimulation===false,'DXF no apto para una auditoría de solo lectura.');
 assert(shape?.verified===false&&shape.activeInSimulation===false,'Contorno de inspección inválido.');
 assert(oriented?.verified===false&&oriented.activeInSimulation===false,'Orientación de inspección inválida.');
 const b=oriented.bounds;
 assert(b&&['minX','maxX','minY','maxY','width','height'].every(k=>Number.isFinite(b[k]))&&b.width>=0&&b.height>=0,'Envolvente orientada incorrecta.');
 const y=(setup.datum==='inferior'?b.minY:b.maxY)+setup.offset;
 assert(Number.isFinite(y)&&Math.abs(y)<=1e6,'Plano de referencia fuera de rango.');
 const sourceValid=!!(reference&&typeof reference.source?.url==='string'&&reference.source.url.startsWith('https://')&&reference.orderNumber);
 const refHeight=Number(reference?.height);
 const refWidth=Number(reference?.width);
 const tolerance=Number(oriented.options?.tolerance);
 assert(Number.isFinite(tolerance)&&tolerance>=0&&tolerance<=10,'Tolerancia de cotejo no admitida.');
 const heightDelta=sourceValid&&Number.isFinite(refHeight)&&refHeight>0?Math.abs(refHeight-b.height):null;
 const widthDelta=sourceValid&&Number.isFinite(refWidth)&&refWidth>0?Math.abs(refWidth-b.width):null;
 const blockers=[
  'Contorno CAD y solidez 3D del útil no verificados.',
  'Plano de montaje, geometría de amarre y apoyos reales no documentados.',
  'Compatibilidad del sistema de sujeción y la máquina no comprobada.',
  'Tolerancias reales y secuencia de colisiones no verificadas.'
 ];
 if(!shape.closed)blockers.push('El perfil DXF seleccionado está abierto.');
 if(document.assumedUnits)blockers.push('Las unidades del DXF se indicaron manualmente, sin cabecera verificable.');
 if(!sourceValid)blockers.push('No hay una referencia documental trazable de fabricante seleccionada.');
 if(heightDelta!==null&&heightDelta>tolerance)blockers.push('La altura orientada difiere de la cota publicada más que la tolerancia visual.');
 if(widthDelta!==null&&widthDelta>tolerance)blockers.push('El ancho orientado difiere de la cota publicada más que la tolerancia visual.');
 const check=Object.freeze({compared:sourceValid,heightDelta,widthDelta,withinVisualTolerance:heightDelta===null?null:heightDelta<=tolerance&&(widthDelta===null||widthDelta<=tolerance),tolerance});
 return {
  version:'0.18',scope:'INSPECCIÓN DIMENSIONAL, NO SEGURIDAD',verified:false,approvedForSimulation:false,approvedForCNC:false,mountingVerified:false,
  contour:{index:shape.index??null,layer:shape.layer||'0',closed:shape.closed===true,arcCount:shape.arcCount||0},
  orientation:{...oriented.options},envelope:{width:b.width,height:b.height,minY:b.minY,maxY:b.maxY},
  nominalMountingPlane:{type:setup.datum,y_mm:y,offset_mm:setup.offset,distanceFromLowerEdge_mm:y-b.minY,distanceFromUpperEdge_mm:b.maxY-y,insideEnvelope:y>b.minY&&y<b.maxY},
  manufacturer:sourceValid?{name:String(reference.manufacturer||''),orderNumber:String(reference.orderNumber),sourceUrl:reference.source.url,mountingDescription:String(reference.mounting||'No publicada').slice(0,250),mountingGeometryVerified:false}:null,
  comparison:check,blockers,
  warning:'BLOQUEADO: la línea de montaje es una referencia nominal del dibujo, NO una superficie física ni una autorización CNC.'
 };
}
function csv(report){
 assert(report?.version==='0.18'&&report.approvedForCNC===false,'Informe de auditoría inválido.');
 const rows=[['campo','valor'],['estado','SIN VERIFICAR - NO CNC'],['capa',report.contour.layer],['referencia_de_plano',report.nominalMountingPlane.type],['desplazamiento_mm',report.nominalMountingPlane.offset_mm],['cota_y_nominal_mm',report.nominalMountingPlane.y_mm],['distancia_al_borde_inferior_mm',report.nominalMountingPlane.distanceFromLowerEdge_mm],['distancia_al_borde_superior_mm',report.nominalMountingPlane.distanceFromUpperEdge_mm],['ancho_dx_mm',report.envelope.width],['alto_dx_mm',report.envelope.height],['referencia_fabricante',report.manufacturer?.orderNumber||'Sin referencia'],['amarre_verificado','NO'],['simulacion_aprobada','NO'],['cnc_aprobado','NO'],...report.blockers.map((b,i)=>['bloqueo_'+(i+1),b])];
 const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
 return '\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n')+'\r\n';
}
return Object.freeze({DATUMS,params,audit,csv});
});
