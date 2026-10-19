/* Plegar Pro Plus v0.17 — orientación nominal DXF. SOLO INSPECCIÓN; NO CNC. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadOrientation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ROTATIONS=[0,90,180,270],ANCHORS=['center','min-min','min-max','max-min','max-max'];
function fail(message){throw Error(message);}
function normalizeOptions(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('Opciones de orientación inválidas.');
 const rotation=Number(raw.rotation??0),mirror=raw.mirror??false,anchor=raw.anchor??'min-min',tolerance=Number(raw.tolerance??0.5);
 if(!ROTATIONS.includes(rotation))fail('Rotación admitida: 0, 90, 180 o 270 grados.');
 if(typeof mirror!=='boolean')fail('El espejo debe ser verdadero o falso.');
 if(!ANCHORS.includes(anchor))fail('Referencia nominal no válida.');
 if(!Number.isFinite(tolerance)||tolerance<0||tolerance>10)fail('Tolerancia de comparación debe estar entre 0 y 10 mm.');
 return Object.freeze({rotation,mirror,anchor,tolerance});
}
function referencePoint(b,anchor){
 if(anchor==='center')return{x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2};
 const a=anchor.split('-');return{x:a[0]==='min'?b.minX:b.maxX,y:a[1]==='min'?b.minY:b.maxY};
}
function inspect(profile,raw={}){
 const options=normalizeOptions(raw);
 if(!profile||!Array.isArray(profile.points)||profile.points.length<2||profile.points.length>1500||!profile.bounds||profile.verified!==false||profile.activeInSimulation!==false)fail('Perfil DXF de inspección inválido.');
 const b=profile.bounds;
 if(!['minX','maxX','minY','maxY','length'].every(k=>Number.isFinite(b[k])))fail('Contorno sin dimensiones válidas.');
 const origin=referencePoint(b,options.anchor),angle=options.rotation*Math.PI/180,co=Math.round(Math.cos(angle)),si=Math.round(Math.sin(angle));
 const points=profile.points.map(p=>{
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))fail('Coordenadas DXF inválidas.');
  const dx=(options.mirror?-1:1)*(p.x-origin.x),dy=p.y-origin.y,x=co*dx-si*dy,y=si*dx+co*dy;
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.max(Math.abs(x),Math.abs(y))>1e6)fail('Geometría fuera de rango.');
  return{x:Object.is(x,-0)?0:x,y:Object.is(y,-0)?0:y};
 });
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 const bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),length:b.length};
 return{points,bounds,origin,options,closed:profile.closed===true,layer:profile.layer||'0',index:profile.index??0,verified:false,activeInSimulation:false,source:'DXF con origen nominal, no amarre verificado'};
}
function checkDimensions(result,reference){
 if(!result||result.verified!==false||!result.bounds||!Number.isFinite(result.bounds.width)||!Number.isFinite(result.bounds.height))fail('Inspección de perfil ausente.');
 if(!reference)return{compared:false,verified:false,notice:'Selecciona una ficha dimensional de referencia.'};
 if(!Number.isFinite(reference.height)||reference.height<=0)fail('La referencia no tiene altura nominal.');
 const hdelta=Math.abs(result.bounds.height-reference.height),wdelta=Number.isFinite(reference.width)&&reference.width>0?Math.abs(result.bounds.width-reference.width):null,tol=result.options.tolerance;
 return{compared:true,verified:false,manufacturer:String(reference.manufacturer||'Fabricante sin indicar').slice(0,80),orderNumber:String(reference.orderNumber||'').slice(0,80),heightDelta:hdelta,widthDelta:wdelta,heightMatch:hdelta<=tol,widthMatch:wdelta===null?null:wdelta<=tol,tolerance:tol,notice:'Cotejo de envolvente NO VALIDADO: el origen es nominal, no identifica amarre ni compatibilidad.'};
}
function inspectionRecord(result,reference){
 const comp=checkDimensions(result,reference),b=result.bounds;
 return{contorno_numero:result.index+1,capa:result.layer,rotacion_grados:result.options.rotation,espejo_horizontal:result.options.mirror,referencia_nominal:result.options.anchor,origen_dxf_mm:result.origin,tolerancia_cotejo_mm:result.options.tolerance,envolvente_orientada_mm:{min_x:b.minX,max_x:b.maxX,min_y:b.minY,max_y:b.maxY,ancho:b.width,alto:b.height,longitud:b.length},cotejo:comp,verificado:false,activado_en_simulacion:false,amarre_validado:false,advertencia:'Origen calculado para inspección, SIN datos mecánicos de fijación ni seguridad CNC.'};
}
function extendReport(report,result,reference){
 if(!report||report.verificado!==false||!Array.isArray(report.elementos))fail('Informe DXF inválido.');
 return{...report,version:'0.17',inspeccion_orientacion:inspectionRecord(result,reference),advertencias:[...report.advertencias,'Orientación y referencia de amarre NOMINALES; montaje no validado.']};
}
function csvAppend(r){
 if(!r||r.verificado!==false||r.amarre_validado!==false)fail('Informe de orientación inválido.');
 const x=r.envolvente_orientada_mm;
 const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lines=[['ORIENTACIÓN NOMINAL (NO VALIDADA)','valor'],['contorno_numero',r.contorno_numero],['rotacion_grados',r.rotacion_grados],['espejo_horizontal',r.espejo_horizontal],['referencia_nominal',r.referencia_nominal],['origen_x_dxf_mm',r.origen_dxf_mm.x],['origen_y_dxf_mm',r.origen_dxf_mm.y],['ancho_orientado_mm',x.ancho],['alto_orientado_mm',x.alto],['min_x_relativa_mm',x.min_x],['min_y_relativa_mm',x.min_y],['tolerancia_cotejo_mm',r.tolerancia_cotejo_mm],['amarre_validado','NO'],['utilizable_cnc','NO']];
 return lines.map(row=>row.map(esc).join(';')).join('\r\n')+'\r\n';
}
return Object.freeze({ROTATIONS,ANCHORS,normalizeOptions,referencePoint,inspect,checkDimensions,inspectionRecord,extendReport,csvAppend});
});