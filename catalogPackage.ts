export type CatalogAssetKind='machine'|'punch'|'die'|'assembly'|'material';
export type CatalogVerification='official'|'validated'|'parametric'|'pending';
export interface TechnicalCatalogItem {
  id:string;
  kind:CatalogAssetKind;
  manufacturer:string;
  reference:string;
  name:string;
  source:string;
  sourceVersion?:string;
  verifiedAt?:string;
  verification:CatalogVerification;
  cadFileName?:string;
  cadSha256?:string;
  dimensions?:Record<string,number>;
  metadata?:Record<string,string|number|boolean>;
}
export interface TechnicalCatalogPackage {
  schema:'plegar-pro.catalog.v1';
  packageId:string;
  title:string;
  publisher:string;
  generatedAt:string;
  sourceUrl?:string;
  items:TechnicalCatalogItem[];
}
export interface CatalogValidation {valid:boolean;errors:string[];warnings:string[];itemCount:number;}
const kinds=new Set<CatalogAssetKind>(['machine','punch','die','assembly','material']);
const states=new Set<CatalogVerification>(['official','validated','parametric','pending']);
export function validateCatalogPackage(value:unknown):CatalogValidation{
  const errors:string[]=[];const warnings:string[]=[];
  if(!value||typeof value!=='object') return {valid:false,errors:['El paquete no es un objeto JSON.'],warnings,itemCount:0};
  const pkg=value as Partial<TechnicalCatalogPackage>;
  if(pkg.schema!=='plegar-pro.catalog.v1') errors.push('Esquema no compatible.');
  if(!pkg.packageId?.trim()) errors.push('Falta packageId.');
  if(!pkg.title?.trim()) errors.push('Falta título.');
  if(!pkg.publisher?.trim()) errors.push('Falta editor o fabricante.');
  if(!Array.isArray(pkg.items)) errors.push('Falta la lista items.');
  const ids=new Set<string>();
  for(const [index,item] of (pkg.items??[]).entries()){
    if(!item||typeof item!=='object'){errors.push(`Elemento ${index+1}: formato inválido.`);continue;}
    if(!item.id?.trim()) errors.push(`Elemento ${index+1}: falta id.`); else if(ids.has(item.id)) errors.push(`Elemento ${index+1}: id duplicado ${item.id}.`); else ids.add(item.id);
    if(!kinds.has(item.kind)) errors.push(`Elemento ${index+1}: tipo no válido.`);
    if(!item.manufacturer?.trim()) errors.push(`Elemento ${index+1}: falta fabricante.`);
    if(!item.reference?.trim()) errors.push(`Elemento ${index+1}: falta referencia.`);
    if(!item.name?.trim()) errors.push(`Elemento ${index+1}: falta nombre.`);
    if(!states.has(item.verification)) errors.push(`Elemento ${index+1}: estado no válido.`);
    if(item.verification==='official'&&!item.source?.trim()) errors.push(`Elemento ${index+1}: un registro oficial necesita fuente.`);
    if(item.verification==='official'&&!item.verifiedAt) warnings.push(`Elemento ${index+1}: CAD oficial sin fecha de verificación.`);
    if(item.cadFileName&&!item.cadSha256) warnings.push(`Elemento ${index+1}: archivo CAD sin huella SHA-256.`);
  }
  return {valid:errors.length===0,errors,warnings,itemCount:pkg.items?.length??0};
}
export function createEmptyCatalogPackage(title='Catálogo técnico'):TechnicalCatalogPackage{return {schema:'plegar-pro.catalog.v1',packageId:crypto.randomUUID(),title,publisher:'Plegar Pro',generatedAt:new Date().toISOString(),items:[]};}
export function downloadCatalogPackage(pkg:TechnicalCatalogPackage){
  const blob=new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${pkg.title.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}.ppcatalog.json`;link.click();URL.revokeObjectURL(url);
}
