export type CadFormat='obj'|'stl-ascii'|'stl-binary'|'step'|'iges'|'gltf'|'glb'|'dxf'|'unknown';
export interface Bounds3D {min:[number,number,number];max:[number,number,number];size:[number,number,number];}
export interface CadInspection {format:CadFormat;vertexCount:number;triangleCount:number;bounds?:Bounds3D;warnings:string[];sha256?:string;previewPoints?:[number,number,number][];}

const ext=(name:string)=>name.toLowerCase().split('.').pop()??'';
export function detectCadFormat(name:string,bytes?:Uint8Array,text?:string):CadFormat{
  const e=ext(name);
  if(e==='obj') return 'obj';
  if(e==='stp'||e==='step') return 'step';
  if(e==='igs'||e==='iges') return 'iges';
  if(e==='gltf') return 'gltf';
  if(e==='glb') return 'glb';
  if(e==='dxf') return 'dxf';
  if(e==='stl'){
    if(text?.trimStart().startsWith('solid') && /facet\s+normal/i.test(text)) return 'stl-ascii';
    if(bytes && bytes.length>=84) return 'stl-binary';
    return 'stl-ascii';
  }
  return 'unknown';
}
function bounds(points:[number,number,number][]):Bounds3D|undefined{
  if(!points.length) return undefined;
  const min:[number,number,number]=[Infinity,Infinity,Infinity];
  const max:[number,number,number]=[-Infinity,-Infinity,-Infinity];
  for(const p of points) for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
  return {min,max,size:[max[0]-min[0],max[1]-min[1],max[2]-min[2]]};
}
export function inspectObj(text:string):CadInspection{
  const points:[number,number,number][]=[];let faces=0;
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(line.startsWith('v ')){
      const n=line.slice(2).trim().split(/\s+/).slice(0,3).map(Number);
      if(n.length===3&&n.every(Number.isFinite)) points.push(n as [number,number,number]);
    } else if(line.startsWith('f ')) faces++;
  }
  return {format:'obj',vertexCount:points.length,triangleCount:faces,bounds:bounds(points),previewPoints:points.slice(0,2500),warnings:points.length?[]:['No se detectaron vértices OBJ válidos.']};
}
export function inspectAsciiStl(text:string):CadInspection{
  const points:[number,number,number][]=[];let triangles=0;
  for(const match of text.matchAll(/vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g)){
    const p=[Number(match[1]),Number(match[2]),Number(match[3])] as [number,number,number];
    if(p.every(Number.isFinite)) points.push(p);
  }
  triangles=Math.floor(points.length/3);
  return {format:'stl-ascii',vertexCount:points.length,triangleCount:triangles,bounds:bounds(points),previewPoints:points.slice(0,2500),warnings:triangles?[]:['No se detectaron triángulos STL válidos.']};
}
export function inspectBinaryStl(bytes:Uint8Array):CadInspection{
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const declared=bytes.length>=84?view.getUint32(80,true):0;
  const max=Math.max(0,Math.floor((bytes.length-84)/50));
  const triangles=Math.min(declared,max);const points:[number,number,number][]=[];
  for(let i=0;i<triangles;i++){
    const offset=84+i*50+12;
    for(let v=0;v<3;v++){
      const o=offset+v*12;
      points.push([view.getFloat32(o,true),view.getFloat32(o+4,true),view.getFloat32(o+8,true)]);
    }
  }
  const warnings:string[]=[];
  if(declared!==triangles) warnings.push(`El archivo declara ${declared} triángulos, pero solo se pudieron leer ${triangles}.`);
  return {format:'stl-binary',vertexCount:points.length,triangleCount:triangles,bounds:bounds(points),previewPoints:points.slice(0,2500),warnings};
}
export async function inspectCadFile(file:File):Promise<CadInspection>{
  const buffer=await file.arrayBuffer();const bytes=new Uint8Array(buffer);
  let text='';
  if(file.size<25_000_000){try{text=new TextDecoder().decode(bytes);}catch{text='';}}
  const format=detectCadFormat(file.name,bytes,text);
  let result:CadInspection;
  if(format==='obj') result=inspectObj(text);
  else if(format==='stl-ascii') result=inspectAsciiStl(text);
  else if(format==='stl-binary') result=inspectBinaryStl(bytes);
  else result={format,vertexCount:0,triangleCount:0,warnings:['Formato reconocido, pero la inspección geométrica completa requiere un traductor CAD específico.']};
  if(globalThis.crypto?.subtle){
    const digest=await crypto.subtle.digest('SHA-256',buffer);
    result.sha256=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  return result;
}
