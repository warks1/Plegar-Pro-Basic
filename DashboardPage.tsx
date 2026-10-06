import {AlertTriangle,CalendarDays,ClipboardList,FolderKanban,Settings,TrendingUp} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useState} from 'react';
import {useActiveProject,useAppStore} from '../../store/useAppStore';
import {ProjectThumbnail} from '../../components/ProjectThumbnail';


export function DashboardPage(){const p=useActiveProject();const savedProjects=useAppStore(s=>s.projects);const setActiveProject=useAppStore(s=>s.setActiveProject);const navigate=useNavigate();const [previewRotation,setPreviewRotation]=useState(0);const [previewZoom,setPreviewZoom]=useState(1);return <div className="approved-dashboard">
  <section className="approved-kpis">
    <article role="button" tabIndex={0} onClick={()=>navigate('/proyectos')} onKeyDown={e=>e.key==='Enter'&&navigate('/proyectos')}><div><small>PROYECTOS ACTIVOS</small><b>12</b><em>+2 hoy</em></div><FolderKanban/></article>
    <article role="button" tabIndex={0} onClick={()=>navigate('/ordenes')} onKeyDown={e=>e.key==='Enter'&&navigate('/ordenes')}><div><small>ÓRDENES DE PRODUCCIÓN</small><b>7</b><span>En curso</span></div><Settings/></article>
    <article role="button" tabIndex={0} onClick={()=>navigate('/produccion')} onKeyDown={e=>e.key==='Enter'&&navigate('/produccion')}><div><small>PIEZAS FABRICADAS</small><b>1.248</b><span>Este mes</span></div><TrendingUp/></article>
    <article className="danger" role="button" tabIndex={0} onClick={()=>navigate('/calidad')} onKeyDown={e=>e.key==='Enter'&&navigate('/calidad')}><div><small>ALARMAS / INCIDENCIAS</small><b>2</b><span>Requieren atención</span></div><AlertTriangle/></article>
    <article role="button" tabIndex={0} onClick={()=>navigate('/agenda')} onKeyDown={e=>e.key==='Enter'&&navigate('/agenda')}><div><small>RECORDATORIOS</small><b>5</b><span>Próximos eventos</span></div><CalendarDays/></article>
  </section>
  <section className="approved-main-grid">
    <div className="approved-hero">
      <img src="/assets/hero-approved.png" alt="Plegar Pro Professional Sheet Metal Bending Suite"/>
      <div className="hero-live"><span>PROYECTO ACTIVO</span><strong>{p.name}</strong><small>{p.material} · {p.thickness} mm · {p.bends.length} plegado(s)</small><div><button onClick={()=>navigate('/desarrollo')}>CONTINUAR PROYECTO</button><button onClick={()=>navigate('/simulacion-3d')}>SIMULAR</button></div></div>
    </div>
    <aside className="approved-right-column">
      <section className="approved-machine" role="button" tabIndex={0} onDoubleClick={()=>navigate('/bibliotecas')}><header>TRUMPF TRUMABEND V85 <i/></header><img src="/assets/machine-trumab-v85.png" alt="TrumaBend V85"/><div className="machine-stats"><span>Fuerza<b>850 kN</b></span><span>Longitud<b>2550 mm</b></span><span>Carrera<b>210 mm</b></span></div><button onClick={()=>navigate('/bibliotecas')}>VER MÁS DETALLES</button></section>
      <section className="materials-favorites"><header>MATERIALES FAVORITOS</header>{[['Acero S235JR','2.00 mm'],['Acero Inox AISI 304','1.50 mm'],['Aluminio 5754','2.50 mm'],['Acero S355JR','3.00 mm'],['Acero Galvanizado','1.20 mm']].map(([a,b])=><div key={a} role="button" tabIndex={0} onClick={()=>navigate('/materiales')}><i/><span>{a}</span><small>{b}</small></div>)}<button onClick={()=>navigate('/materiales')}>VER TODOS</button></section>
    </aside>
  </section>
  <section className="approved-lower-grid">
    <div className="recent-projects"><header>PROYECTOS RECIENTES</header><div className="project-cards">{savedProjects.slice(0,5).map(project=><button key={project.id} onClick={()=>{setActiveProject(project.id);navigate('/programacion-2d')}}><ProjectThumbnail project={project}/><strong>{project.name}</strong><span>{project.material} · {project.thickness.toFixed(2)} mm</span><small>{new Date(project.updatedAt).toLocaleDateString()}</small></button>)}<button className="open-project" onClick={()=>navigate('/proyectos')}><b>＋</b><span>ABRIR PROYECTO</span></button></div></div>
    <div className="preview-card"><header>VISTA PREVIA 3D</header><img src="/assets/piece-preview-approved.png" alt="Vista previa 3D" style={{transform:`scale(${previewZoom}) rotate(${previewRotation}deg)`}}/><div className="preview-tools"><button onClick={()=>setPreviewRotation(v=>v+45)} title="Rotar">↻</button><button onClick={()=>{setPreviewRotation(0);setPreviewZoom(1)}} title="Centrar">⊙</button><button onClick={()=>setPreviewZoom(v=>Math.min(1.8,v+.15))} title="Ampliar">⌕</button><button onClick={()=>navigate('/programacion-3d')} title="Abrir vista 3D">⛶</button></div></div>
  </section>
</div>}
