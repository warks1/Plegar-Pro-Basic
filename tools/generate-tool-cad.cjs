'use strict';
/* Generación reproducible de 265 fichas reconstruidas: NO CNC.
   Sólo genera archivos en el workspace; no escribe en la máquina. */
const fs=require('node:fs'),path=require('node:path');
const CAD=require('../tool-cad.js');
const out=path.resolve(__dirname,'..','herramientas-cad');
const records=CAD.all(),seen=new Set();
for(const rec of records){
 if(!rec.geometryChecksPassed)throw Error('No exportar perfiles con geometría incorrecta: '+rec.id);
 if(rec.verified!==false||rec.approvedForCNC!==false)throw Error('Perfil no debe figurar como CAD certificado: '+rec.id);
 if(seen.has(rec.id))throw Error('Referencia duplicada: '+rec.id);seen.add(rec.id);
 const dir=path.join(out,rec.kind==='punch'?'punzones':'matrices');
 fs.mkdirSync(dir,{recursive:true});
 const basename=path.join(dir,rec.id.replace(/[^a-z0-9._-]/gi,'_'));
 fs.writeFileSync(basename+'.dxf',CAD.dxf(rec),'utf8');
 fs.writeFileSync(basename+'.svg',CAD.svg(rec),'utf8');
 fs.writeFileSync(basename+'.json',JSON.stringify(CAD.sheet(rec),null,2),'utf8');
}
fs.writeFileSync(path.join(out,'INDICE.csv'),CAD.indexCsv(records),'utf8');
fs.writeFileSync(path.join(out,'LEEME.md'),[
 '# Perfiles de utillaje reconstruidos · Plegar Pro Plus',
 '',
 'DXF, SVG y fichas JSON de referencias de catálogo con cotas y supuestos diferenciados.',
 '',
 'Todas las piezas están pendientes de verificación contra el plano de fabricante o la herramienta física.',
 '**NO SON CAD OFICIALES · NO CNC · NO VALIDAN COLISIONES NI SEGURIDAD.**',
 '',
 'Generado con node tools/generate-tool-cad.cjs.'
].join('\n')+'\n','utf8');
console.log(records.length+' perfiles generados: '+records.filter(x=>x.kind==='punch').length+
 ' punzones y '+records.filter(x=>x.kind==='die').length+' matrices. Ninguno certificado.');
