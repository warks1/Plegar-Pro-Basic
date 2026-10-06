import {useEffect,useMemo,useState} from 'react';
import {Outlet,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Bell,Home as HomeIcon,Mail,Menu,Search,Undo2,Redo2} from 'lucide-react';
import {Sidebar} from './Sidebar';
import {ModuleBoundary} from './ModuleBoundary';
import {useActiveProject,useAppStore} from '../store/useAppStore';

const readLocal=(key:string,fallback='')=>{try{return window.localStorage.getItem(key)??fallback}catch{return fallback}};
const writeLocal=(key:string,value:string)=>{try{window.localStorage.setItem(key,value)}catch{/* storage can be unavailable */}};

const searchItems=[['Inicio','/'],['Proyectos','/proyectos'],['Importar CAD/IA','/importacion'],['Desarrollo','/desarrollo'],['Calculadora de desarrollo','/calculadora-desarrollo'],['Programación 2D','/programacion-2d'],['Programación 3D','/programacion-3d'],['Diseño CAD/CAM 3D','/cad-cam-3d'],['Simulación 2D','/simulacion-2d'],['Simulación 3D','/simulacion-3d'],['Curva perfecta','/curva-perfecta'],['Comparador V','/comparador-v'],['Utillaje','/utillaje'],['Bibliotecas','/bibliotecas'],['Fuentes oficiales','/fuentes-oficiales'],['Integridad funcional','/integridad'],['Materiales','/materiales'],['Órdenes','/ordenes'],['Producción','/produccion'],['Calidad','/calidad'],['Mantenimiento','/mantenimiento'],['Proveedores','/proveedores'],['Clientes','/clientes'],['Agenda','/agenda'],['IA asistente','/ia'],['Chat técnico','/comunicacion'],['Ajustes','/ajustes'],['Actualizaciones','/actualizaciones']] as const;

export function AppShell(){
  const navigate=useNavigate();const location=useLocation();const activeProject=useActiveProject();
  const undo=useAppStore(s=>s.undo),redo=useAppStore(s=>s.redo),history=useAppStore(s=>s.history),future=useAppStore(s=>s.future),notifications=useAppStore(s=>s.notifications),addNotification=useAppStore(s=>s.addNotification);
  const [historyMessage,setHistoryMessage]=useState('');
  const [query,setQuery]=useState('');
  const [canForward,setCanForward]=useState(false);
  const [collapsed,setCollapsed]=useState(()=>readLocal('pp-sidebar-collapsed')==='1');
  const [lastSync,setLastSync]=useState(()=>readLocal('pp-last-sync','Sin sincronizar'));const [syncing,setSyncing]=useState(false);
  const results=useMemo(()=>query.trim()?searchItems.filter(([label])=>label.toLowerCase().includes(query.toLowerCase())):[],[query]);
  const unread=notifications.filter(x=>!x.read).length;
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector<HTMLInputElement>('.search input')?.focus();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();if(history.length){undo();setHistoryMessage('Cambio deshecho')}}if((e.ctrlKey||e.metaKey)&&((e.key.toLowerCase()==='y')||(e.key.toLowerCase()==='z'&&e.shiftKey))){e.preventDefault();if(future.length){redo();setHistoryMessage('Cambio rehecho')}}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[history.length,future.length,undo,redo]);
  useEffect(()=>{if(!historyMessage)return;const t=window.setTimeout(()=>setHistoryMessage(''),1800);return()=>window.clearTimeout(t)},[historyMessage]);
  const sync=()=>{setSyncing(true);const now=new Date().toLocaleString();writeLocal('pp-last-sync',now);setLastSync(now);window.setTimeout(()=>setSyncing(false),900);addNotification({id:crypto.randomUUID(),title:'Sincronización local completada',detail:`Datos guardados correctamente · ${now}`,type:'success',read:false,createdAt:new Date().toISOString()});};
  const handleUndo=()=>{if(!history.length)return;undo();setHistoryMessage('Cambio deshecho')};
  const handleRedo=()=>{if(!future.length)return;redo();setHistoryMessage('Cambio rehecho')};
  const flowRoutes=['/programador-pieza','/programacion-2d','/programacion-3d','/cad-cam-3d','/simulacion-2d','/simulacion-3d'];
  const toggleSidebar=()=>setCollapsed(v=>{writeLocal('pp-sidebar-collapsed',v?'0':'1');return !v});
  return <div className={`app-shell approved-shell concept-two-shell ${collapsed?'sidebar-collapsed':''}`}><div className="build-version" title="Versión en ejecución">v0.24.4 · ESTABILIDAD, AJUSTES Y NAVEGACIÓN PRO</div><Sidebar collapsed={collapsed}/><main>
    <header className="topbar approved-topbar">
      <button className="menu-button" aria-label={collapsed?'Expandir menú':'Contraer menú'} onClick={toggleSidebar}><Menu/></button><button type="button" className="pp-global-back" aria-label="Volver a la pantalla anterior" onClick={()=>{if(location.pathname==='/')return;setCanForward(true);navigate(-1)}} disabled={location.pathname==='/'}><ArrowLeft/><span>Volver</span></button><button type="button" className="pp-global-forward" aria-label="Ir a la pantalla siguiente" onClick={()=>{navigate(1);setCanForward(false)}} disabled={!canForward}><ArrowRight/><span>Adelante</span></button><button type="button" className="pp-global-home" aria-label="Ir a Inicio" onClick={()=>navigate('/')}><HomeIcon/><span>Inicio</span></button>
      <div className="history"><button type="button" aria-label="Deshacer último cambio" title="Deshacer último cambio" onClick={handleUndo} disabled={!history.length}><Undo2/><span>Deshacer</span></button><button type="button" aria-label="Rehacer último cambio" title="Rehacer último cambio" onClick={handleRedo} disabled={!future.length}><Redo2/><span>Rehacer</span></button>{historyMessage&&<span className="history-toast">{historyMessage}</span>}</div>
      <div className="search-wrap"><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar en Plegar Pro..."/><kbd>CTRL + K</kbd></label>{results.length>0&&<div className="search-results">{results.map(([label,path])=><button key={path} onClick={()=>{navigate(path);setQuery('')}}>{label}</button>)}</div>}</div>
      <div className="top-actions"><button className="icon-action" aria-label="Notificaciones" onClick={()=>navigate('/notificaciones')}><Bell/>{unread>0&&<span>{unread}</span>}</button><button className="icon-action" aria-label="Mensajes" onClick={()=>navigate('/comunicacion')}><Mail/></button><div className="company"><strong>AMS ENGINEERING</strong><small>Antonio Molina Sánchez</small></div><button className="avatar" aria-label="Perfil" onClick={()=>navigate('/ajustes')}>AM</button></div>
    </header>
    {flowRoutes.includes(location.pathname)&&<nav className="project-flow" aria-label="Flujo sincronizado del proyecto"><strong>Proyecto sincronizado: {activeProject.name}</strong><button onClick={()=>navigate('/programador-pieza')}>Programar</button><button onClick={()=>navigate('/programacion-2d')}>2D</button><button onClick={()=>navigate('/programacion-3d')}>3D</button><button onClick={()=>navigate('/cad-cam-3d')}>CAD/CAM</button><button onClick={()=>navigate('/simulacion-2d')}>Simulación 2D</button><button onClick={()=>navigate('/simulacion-3d')}>Simulación 3D</button></nav>}
    <section className="content"><ModuleBoundary moduleKey={location.pathname}><Outlet/></ModuleBoundary></section>
    <footer className="statusbar"><span><i/> Estado: operativo</span><span>Usuario: Administrador</span><span>Empresa: AMS Engineering Solutions</span><span>Base de datos: Local <i/></span><span>Última copia: {lastSync}</span><button type="button" onClick={sync} disabled={syncing}>{syncing?'SINCRONIZANDO…':'SINCRONIZAR AHORA'}</button></footer>
  </main></div>
}
