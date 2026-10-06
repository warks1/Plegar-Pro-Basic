export interface StoredCadBinary {
  id:string;
  fileName:string;
  mimeType:string;
  size:number;
  sha256?:string;
  blob:Blob;
  storedAt:string;
}

const DB_NAME='plegar-pro-cad-v1';
const STORE='cad-files';
const DB_VERSION=1;

function openDb():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in globalThis)){reject(new Error('IndexedDB no está disponible en este navegador.'));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??new Error('No se pudo abrir IndexedDB.'));
  });
}

async function withStore<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode);const store=tx.objectStore(STORE);const request=operation(store);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error??new Error('Operación IndexedDB fallida.'));
    tx.oncomplete=()=>db.close();tx.onerror=()=>{db.close();reject(tx.error??new Error('Transacción IndexedDB fallida.'));};
  });
}

export async function saveCadBinary(input:Omit<StoredCadBinary,'storedAt'>):Promise<void>{
  await withStore('readwrite',store=>store.put({...input,storedAt:new Date().toISOString()}));
}
export async function getCadBinary(id:string):Promise<StoredCadBinary|undefined>{return withStore('readonly',store=>store.get(id));}
export async function deleteCadBinary(id:string):Promise<void>{await withStore('readwrite',store=>store.delete(id));}
export async function listCadBinaries():Promise<StoredCadBinary[]>{return withStore('readonly',store=>store.getAll());}
export async function cadStorageUsage():Promise<{files:number;bytes:number}>{
  const items=await listCadBinaries();return {files:items.length,bytes:items.reduce((sum,item)=>sum+item.size,0)};
}
