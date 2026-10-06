import type {TechnicalCatalogPackage} from './catalogPackage';
export interface CatalogSyncState {packageId:string;sourceUrl:string;lastChecked?:string;lastImported?:string;etag?:string;status:'idle'|'current'|'update-available'|'error';message:string}
export interface CatalogDiff {added:string[];removed:string[];changed:string[];unchanged:number}
export function compareCatalogPackages(current:TechnicalCatalogPackage,next:TechnicalCatalogPackage):CatalogDiff{
  const a=new Map(current.items.map(item=>[item.id,item]));const b=new Map(next.items.map(item=>[item.id,item]));const added=[...b.keys()].filter(id=>!a.has(id));const removed=[...a.keys()].filter(id=>!b.has(id));const changed=[...b.keys()].filter(id=>a.has(id)&&JSON.stringify(a.get(id))!==JSON.stringify(b.get(id)));const unchanged=[...b.keys()].filter(id=>a.has(id)&&!changed.includes(id)).length;return {added,removed,changed,unchanged};
}
export function isNewerPackage(current:TechnicalCatalogPackage,next:TechnicalCatalogPackage){return new Date(next.generatedAt).getTime()>new Date(current.generatedAt).getTime()||compareCatalogPackages(current,next).added.length>0||compareCatalogPackages(current,next).changed.length>0}
export function createSyncState(pkg:TechnicalCatalogPackage):CatalogSyncState{return {packageId:pkg.packageId,sourceUrl:pkg.sourceUrl??'',lastImported:new Date().toISOString(),status:'idle',message:pkg.sourceUrl?'Fuente lista para comprobación manual o conector autenticado.':'Sin URL de origen.'}}
