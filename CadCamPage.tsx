import {useMemo,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent,WheelEvent as ReactWheelEvent} from 'react';
import {Download,FileJson,Plus,RotateCcw,Save,Trash2} from 'lucide-react';
import {Page} from '../../components/Page';
import {useActiveProject,useAppStore} from '../../store/useAppStore';

type Workspace='sketch'|'model'|'cam';
type Profile='sheet'|'tray'|'u';
type Hole={id:string;x:number;y:number;diameter:number};
type BendLine={id:string;x:number;length:number;angle:number;radius:number;side:'interior'|'exterior';direction:'positive'|'negative'};
type CamOperation={id:string;kind:'contour'|'holes'|'engrave'|'bend';label:string;feed:number;enabled:boolean};

const download=(name:string,content:string,type='text/plain')=>{
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download=name;link.click();URL.revokeObjectURL(url);
};

export function CadCamPage(){
  const project=useActiveProject();
  const updateProject=useAppStore(s=>s.updateProject);
  const [workspace,setWorkspace]=useState<Workspace>('sketch');
  const modelDrag=useRef<{x:number;y:number}|null>(null);
  const [profile,setProfile]=useState<Profile>('sheet');
  const [length,setLength]=useState(project.length);
  const [width,setWidth]=useState(project.width);
  const [thickness,setThickness]=useState(project.thickness);
  const [flange,setFlange]=useState(Math.min(80,Math.round(project.width/4)));
  const [zoom,setZoom]=useState(1);
  const [turn,setTurn]=useState(-28);
  const [tilt,setTilt]=useState(58);
  const [holes,setHoles]=useState<Hole[]>([]);
  const [bends,setBends]=useState<BendLine[]>(project.bends.map(b=>({id:b.id,x:b.position,length:b.length,angle:b.angle,radius:b.radius,side:b.side,direction:b.direction})));
  const [modelPan,setModelPan]=useState({x:0,y:0});
  const [holeX,setHoleX]=useState(Math.round(project.length/2));
  const [holeY,setHoleY]=useState(Math.round(project.width/2));
  const [holeD,setHoleD]=useState(12);
  const [bendX,setBendX]=useState(Math.round(project.length/2));
  const [bendLength,setBendLength]=useState(project.width);
  const [bendAngle,setBendAngle]=useState(90);
  const [bendRadius,setBendRadius]=useState(Math.max(1,project.thickness));
  const [bendSide,setBendSide]=useState<'interior'|'exterior'>('interior');
  const [bendDirection,setBendDirection]=useState<'positive'|'negative'>('positive');
  const [message,setMessage]=useState('');
  const [operations,setOperations]=useState<CamOperation[]>([
    {id:'contour',kind:'contour',label:'Corte de contorno exterior',feed:3200,enabled:true},
    {id:'holes',kind:'holes',label:'Corte de taladros',feed:2200,enabled:true},
    {id:'engrave',kind:'engrave',label:'Marcado de líneas de pliegue',feed:4800,enabled:true},
    {id:'bend',kind:'bend',label:'Secuencia de plegado',feed:0,enabled:true},
  ]);

  const sx=760/Math.max(1,length),sy=420/Math.max(1,width);
  const scale=Math.min(sx,sy);
  const drawW=length*scale,drawH=width*scale,offsetX=(820-drawW)/2,offsetY=(480-drawH)/2;
  const pathLength=useMemo(()=>{
    const perimeter=2*(length+width);
    const holesLength=holes.reduce((sum,h)=>sum+Math.PI*h.diameter,0);
    return Math.round((perimeter+holesLength+bends.length*width)*10)/10;
  },[length,width,holes,bends]);
  const estimatedSeconds=useMemo(()=>{
    const cut=(2*(length+width)+holes.reduce((s,h)=>s+Math.PI*h.diameter,0))/Math.max(1,operations.find(o=>o.kind==='contour')?.feed??3200)*60;
    const mark=bends.length*width/Math.max(1,operations.find(o=>o.kind==='engrave')?.feed??4800)*60;
    return Math.max(1,Math.round(cut+mark+holes.length*1.4+bends.length*3.2));
  },[length,width,holes,bends,operations]);

  const addHole=()=>{if(holeD<=0||holeX<0||holeX>length||holeY<0||holeY>width)return;setHoles(v=>[...v,{id:crypto.randomUUID(),x:holeX,y:holeY,diameter:holeD}])};
  const addBend=()=>{if(bendX<=0||bendX>=length||bendLength<=0)return;setBends(v=>[...v,{id:crypto.randomUUID(),x:bendX,length:Math.min(width,bendLength),angle:bendAngle,radius:bendRadius,side:bendSide,direction:bendDirection}].sort((a,b)=>a.x-b.x))};
  const saveToProject=()=>{
    updateProject(project.id,{length,width,thickness,bends:bends.map((b,i)=>({id:b.id,position:b.x,length:b.length,angle:b.angle,radius:b.radius,direction:b.direction,side:b.side,fixedFace:'left',punchId:'p-tr-88-r1',dieId:'d-am-v16',backgaugeX:b.x,correction:0,order:i+1}))});
    setMessage('Plano CAD/CAM guardado en el proyecto activo.');window.setTimeout(()=>setMessage(''),2500);
  };

  const onModelPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{modelDrag.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId)};
  const onModelPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{if(!modelDrag.current)return;const dx=event.clientX-modelDrag.current.x,dy=event.clientY-modelDrag.current.y;if(event.shiftKey||event.buttons===4)setModelPan(v=>({x:v.x+dx,y:v.y+dy}));else{setTurn(v=>v+dx*.45);setTilt(v=>Math.max(-10,Math.min(95,v-dy*.35)))};modelDrag.current={x:event.clientX,y:event.clientY}};
  const onModelPointerUp=(event:ReactPointerEvent<HTMLDivElement>)=>{modelDrag.current=null;try{event.currentTarget.releasePointerCapture(event.pointerId)}catch{/* released */}};
  const onModelWheel=(event:ReactWheelEvent<HTMLDivElement>)=>{event.preventDefault();setZoom(v=>Math.max(.45,Math.min(2.2,v*(event.deltaY<0?1.12:.88))))};
  const reset=()=>{setLength(project.length);setWidth(project.width);setThickness(project.thickness);setHoles([]);setBends(project.bends.map(b=>({id:b.id,x:b.position,length:b.length,angle:b.angle,radius:b.radius,side:b.side,direction:b.direction})));setZoom(1);setTurn(-28);setTilt(58);setModelPan({x:0,y:0})};
  const exportDxf=()=>{
    let dxf='0\nSECTION\n2\nENTITIES\n';
    const line=(x1:number,y1:number,x2:number,y2:number)=>`0\nLINE\n8\nCUT\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
    dxf+=line(0,0,length,0)+line(length,0,length,width)+line(length,width,0,width)+line(0,width,0,0);
    for(const h of holes)dxf+=`0\nCIRCLE\n8\nHOLES\n10\n${h.x}\n20\n${h.y}\n40\n${h.diameter/2}\n`;
    for(const b of bends)dxf+=`0\nLINE\n8\nBEND\n10\n${b.x}\n20\n0\n11\n${b.x}\n21\n${width}\n`;
    dxf+='0\nENDSEC\n0\nEOF\n';download(`${project.name.replace(/\s+/g,'_')}.dxf`,dxf,'application/dxf');
  };
  const exportCam=()=>{
    const enabled=operations.filter(o=>o.enabled);
    const lines=['; PLEGAR PRO CAM','G21','G90',`G0 X0 Y0`];
    if(enabled.some(o=>o.kind==='contour'))lines.push(`; CONTOUR ${length}x${width}`,`G1 X${length} Y0 F3200`,`G1 X${length} Y${width}`,`G1 X0 Y${width}`,`G1 X0 Y0`);
    if(enabled.some(o=>o.kind==='holes'))holes.forEach((h,i)=>lines.push(`; HOLE ${i+1} D${h.diameter}`,`G0 X${h.x} Y${h.y}`,`M03`,`G4 P0.2`,`M05`));
    if(enabled.some(o=>o.kind==='engrave'))bends.forEach((b,i)=>lines.push(`; BEND MARK P${i+1} ${b.angle}deg`,`G0 X${b.x} Y0`,`G1 X${b.x} Y${width} F4800`));
    lines.push('G0 X0 Y0','M30');download(`${project.name.replace(/\s+/g,'_')}.nc`,lines.join('\n'),'text/plain');
  };
  const exportJson=()=>download(`${project.name.replace(/\s+/g,'_')}_cadcam.json`,JSON.stringify({schema:'plegar-pro.cadcam.v1',projectId:project.id,profile,length,width,thickness,flange,holes,bends,operations,pathLength,estimatedSeconds},null,2),'application/json');

  return <Page title="Diseño CAD/CAM 3D" subtitle="Crear planos paramétricos, geometría 3D y operaciones CAM vinculadas al proyecto activo" actions={<div className="cadcam-actions"><button type="button" onClick={reset}><RotateCcw size={16}/>Restablecer</button><button type="button" onClick={saveToProject}><Save size={16}/>Guardar en proyecto</button></div>}>
    {message&&<div className="cadcam-message">{message}</div>}
    <div className="cadcam-tabs"><button type="button" className={workspace==='sketch'?'active':''} onClick={()=>setWorkspace('sketch')}>Boceto 2D</button><button type="button" className={workspace==='model'?'active':''} onClick={()=>setWorkspace('model')}>Modelo 3D</button><button type="button" className={workspace==='cam'?'active':''} onClick={()=>setWorkspace('cam')}>CAM y trayectorias</button></div>
    <div className="cadcam-layout">
      <section className="panel cadcam-workspace">
        {workspace==='sketch'&&<>
          <div className="cadcam-canvas-title"><strong>Plano paramétrico</strong><span>Unidades: mm · Escala automática</span></div>
          <svg className="cadcam-sketch" viewBox="0 0 820 480" role="img" aria-label="Boceto CAD 2D">
            <defs><pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#14374f" strokeWidth="1"/></pattern></defs><rect width="820" height="480" fill="url(#cadGrid)"/>
            <rect x={offsetX} y={offsetY} width={drawW} height={drawH} rx="2" className="cadcam-part"/>
            {holes.map(h=><g key={h.id}><circle cx={offsetX+h.x*scale} cy={offsetY+h.y*scale} r={Math.max(4,h.diameter*scale/2)} className="cadcam-hole"/><text x={offsetX+h.x*scale+8} y={offsetY+h.y*scale-8}>Ø{h.diameter}</text></g>)}
            {bends.map((b,i)=><g key={b.id}><line x1={offsetX+b.x*scale} y1={offsetY} x2={offsetX+b.x*scale} y2={offsetY+drawH} className={`cadcam-bend ${b.direction}`}/><text x={offsetX+b.x*scale+6} y={offsetY+22}>P{i+1} · {b.angle}°</text></g>)}
            <line x1={offsetX} y1={offsetY+drawH+28} x2={offsetX+drawW} y2={offsetY+drawH+28} className="cadcam-dimline"/><text x={offsetX+drawW/2-34} y={offsetY+drawH+52}>L {length}</text>
            <line x1={offsetX-28} y1={offsetY} x2={offsetX-28} y2={offsetY+drawH} className="cadcam-dimline"/><text x={offsetX-82} y={offsetY+drawH/2}>A {width}</text>
          </svg>
        </>}
        {workspace==='model'&&<>
          <div className="cadcam-canvas-title"><strong>Modelo 3D paramétrico</strong><span>Arrastra los controles o usa los botones de vista</span></div>
          <div className="cadcam-3d-stage interactive-cadcam" onPointerDown={onModelPointerDown} onPointerMove={onModelPointerMove} onPointerUp={onModelPointerUp} onPointerCancel={onModelPointerUp} onWheel={onModelWheel}>
            <div className={`cadcam-model profile-${profile}`} style={{'--cad-zoom':zoom,'--cad-turn':`${turn}deg`,'--cad-tilt':`${tilt}deg`,'--cad-pan-x':`${modelPan.x}px`,'--cad-pan-y':`${modelPan.y}px`,'--cad-flange':`${Math.max(28,Math.min(95,flange))}px`} as React.CSSProperties}>
              <div className="cad-face cad-base">{holes.map(h=><i key={h.id} className="cad-hole-3d" style={{left:`${h.x/length*100}%`,top:`${h.y/width*100}%`,width:`${Math.max(8,h.diameter/2)}px`,height:`${Math.max(8,h.diameter/2)}px`}}/>)}{bends.map(b=><i key={b.id} className="cad-bend-3d" style={{left:`${b.x/length*100}%`}}/>)}</div>
              {profile!=='sheet'&&<><div className="cad-face cad-flange cad-left"/><div className="cad-face cad-flange cad-right"/></>}
              {profile==='u'&&<div className="cad-face cad-flange cad-back"/>}
            </div>
            <div className="cadcam-touch-hint">Arrastra para girar · Mayús + arrastrar para mover · rueda o gesto para zoom</div><div className="cadcam-view-buttons"><button type="button" onClick={()=>{setTurn(-28);setTilt(58)}}>Isométrica</button><button type="button" onClick={()=>{setTurn(0);setTilt(0)}}>Frontal</button><button type="button" onClick={()=>{setTurn(-90);setTilt(8)}}>Lateral</button><button type="button" onClick={()=>{setTurn(0);setTilt(90)}}>Superior</button><button type="button" onClick={()=>setZoom(z=>Math.min(1.9,z+.1))}>Acercar</button><button type="button" onClick={()=>setZoom(z=>Math.max(.5,z-.1))}>Alejar</button><button type="button" onClick={()=>setTurn(v=>v+180)}>Voltear</button><button type="button" onClick={()=>{setModelPan({x:0,y:0});setZoom(1)}}>Centrar</button></div>
          </div>
        </>}
        {workspace==='cam'&&<>
          <div className="cadcam-canvas-title"><strong>Plan CAM</strong><span>Trayectoria estimada y secuencia de operaciones</span></div>
          <div className="cam-summary"><article><span>Recorrido</span><strong>{pathLength} mm</strong></article><article><span>Tiempo estimado</span><strong>{estimatedSeconds} s</strong></article><article><span>Taladros</span><strong>{holes.length}</strong></article><article><span>Plegados</span><strong>{bends.length}</strong></article></div>
          <div className="cam-operations">{operations.map((o,i)=><article key={o.id}><label><input type="checkbox" checked={o.enabled} onChange={e=>setOperations(v=>v.map(x=>x.id===o.id?{...x,enabled:e.target.checked}:x))}/><b>{i+1}. {o.label}</b></label><span>{o.feed?`F ${o.feed} mm/min`:'Secuencia CNC'}</span></article>)}</div>
          <div className="cam-code"><code>{`; Proyecto: ${project.name}\nG21 ; milímetros\nG90 ; coordenadas absolutas\n; Contorno ${length} x ${width}\n; ${holes.length} taladros · ${bends.length} líneas de pliegue\n; Tiempo estimado ${estimatedSeconds} s`}</code></div>
        </>}
      </section>
      <aside className="panel cadcam-inspector">
        <h3>Geometría</h3>
        <div className="form-grid"><label>Perfil<select value={profile} onChange={e=>setProfile(e.target.value as Profile)}><option value="sheet">Chapa plana</option><option value="tray">Bandeja</option><option value="u">Perfil U</option></select></label><label>Espesor<input type="number" min="0.5" step="0.1" value={thickness} onChange={e=>setThickness(Number(e.target.value))}/></label><label>Largo<input type="number" min="10" value={length} onChange={e=>setLength(Number(e.target.value))}/></label><label>Ancho<input type="number" min="10" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label><label>Altura de ala<input type="number" min="0" value={flange} onChange={e=>setFlange(Number(e.target.value))}/></label><label>Material<input value={project.material} readOnly/></label></div>
        <h3>Taladro</h3><div className="form-grid"><label>X<input type="number" value={holeX} onChange={e=>setHoleX(Number(e.target.value))}/></label><label>Y<input type="number" value={holeY} onChange={e=>setHoleY(Number(e.target.value))}/></label><label>Diámetro<input type="number" min="1" value={holeD} onChange={e=>setHoleD(Number(e.target.value))}/></label><button type="button" className="cadcam-add" onClick={addHole}><Plus size={16}/>Añadir taladro</button></div>
        <div className="cadcam-items">{holes.map((h,i)=><div key={h.id}><span>H{i+1} · X{h.x} Y{h.y} · Ø{h.diameter}</span><button type="button" aria-label={`Eliminar taladro ${i+1}`} onClick={()=>setHoles(v=>v.filter(x=>x.id!==h.id))}><Trash2 size={15}/></button></div>)}</div>
        <h3>Línea de pliegue</h3><div className="form-grid"><label>Posición X<input type="number" min="1" max={length-1} value={bendX} onChange={e=>setBendX(Number(e.target.value))}/></label><label>Longitud de pliegue<input type="number" min="1" max={width} value={bendLength} onChange={e=>setBendLength(Number(e.target.value))}/></label><label>Ángulo<input type="number" min="1" max="179" value={bendAngle} onChange={e=>setBendAngle(Number(e.target.value))}/></label><label>Radio interior<input type="number" min="0" step="0.1" value={bendRadius} onChange={e=>setBendRadius(Number(e.target.value))}/></label><label>Tipo<select value={bendSide} onChange={e=>setBendSide(e.target.value as typeof bendSide)}><option value="interior">Interior</option><option value="exterior">Exterior</option></select></label><label>Sentido<select value={bendDirection} onChange={e=>setBendDirection(e.target.value as typeof bendDirection)}><option value="positive">Positivo</option><option value="negative">Negativo</option></select></label><button type="button" className="cadcam-add" onClick={addBend}><Plus size={16}/>Añadir pliegue</button></div>
        <div className="cadcam-items">{bends.map((b,i)=><div key={b.id}><span>P{i+1} · X{b.x} · L{b.length} · {b.angle}° · R{b.radius}</span><button type="button" aria-label={`Eliminar pliegue ${i+1}`} onClick={()=>setBends(v=>v.filter(x=>x.id!==b.id))}><Trash2 size={15}/></button></div>)}</div>
        <h3>Exportación</h3><div className="cadcam-export"><button type="button" onClick={exportDxf}><Download size={16}/>DXF</button><button type="button" onClick={exportCam}><Download size={16}/>CAM / NC</button><button type="button" onClick={exportJson}><FileJson size={16}/>Proyecto JSON</button></div>
      </aside>
    </div>
  </Page>;
}
