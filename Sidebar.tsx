import type {ComponentType} from 'react';
import {NavLink} from 'react-router-dom';
import {
  Home,FolderKanban,FileUp,ScanLine,Box,PlaySquare,Radius,Workflow,Scale3D,
  Wrench,Factory,Layers3,ClipboardList,ShieldCheck,Settings,Bot,Users,Truck,
  CalendarDays,Warehouse,Info,Flame,Gauge,CalendarClock,MessagesSquare,Library,DatabaseZap,ListChecks,FileBox,DraftingCompass,RefreshCw
} from 'lucide-react';

type Item=[string,string,ComponentType<{size?:number}>];
const engineering:Item[]=[
  ['/','Inicio',Home],['/proyectos','Proyectos',FolderKanban],['/importacion','Importar',FileUp],['/programador-pieza','Programar pieza',ClipboardList],
  ['/programacion-2d','Programación 2D',ScanLine],['/programacion-3d','Programación 3D',Box],['/cad-cam-3d','Diseño CAD/CAM 3D',DraftingCompass],
  ['/simulacion-2d','Simulación 2D',PlaySquare],['/simulacion-3d','Simulación 3D',Box],['/curva-perfecta','Curva perfecta',Radius],
  ['/desarrollo','Desarrollo',Workflow],['/calculadora-desarrollo','Calculadora de desarrollo',Gauge],['/comparador-v','Comparador V',Scale3D],
  ['/utillaje','Utillaje',Wrench],['/bibliotecas','Máquinas y bibliotecas',Library],['/registro-cad','Registro CAD',FileBox],['/catalogos-tecnicos','Catálogos técnicos',DatabaseZap],['/fuentes-oficiales','Fuentes oficiales',DatabaseZap],['/materiales','Materiales',Layers3]
];
const operations:Item[]=[
  ['/ordenes','Órdenes',ClipboardList],['/produccion','Producción',Factory],['/soldadura','Soldadura',Flame],
  ['/calidad','Calidad',Gauge],['/mantenimiento','Mantenimiento',CalendarClock],['/almacen','Almacén',Warehouse],
  ['/proveedores','Proveedores',Truck],['/clientes','Clientes / CRM',Users],['/agenda','Agenda',CalendarDays]
];
const system:Item[]=[
  ['/validacion','Validación',ShieldCheck],['/integridad','Integridad funcional',ListChecks],['/comunicacion','Chat técnico',MessagesSquare],
  ['/ajustes','Ajustes',Settings],['/actualizaciones','Actualizaciones',RefreshCw],['/ia','IA asistente',Bot],['/acerca-de','Acerca de',Info]
];
function NavGroup({items}:{items:Item[]}){return <>{items.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/' } className={({isActive})=>isActive?'active':''}><span className="nav-icon"><Icon size={19}/></span><span>{label}</span></NavLink>)}</>}
export function Sidebar({collapsed=false}:{collapsed?:boolean}){return <aside className={`sidebar approved-sidebar ${collapsed?'collapsed':''}`}>
  <div className="approved-brand"><img src="/assets/brand-approved.png" alt="Plegar Pro"/></div>
  <nav className="approved-nav"><NavGroup items={engineering}/><div className="nav-separator"/><NavGroup items={operations}/><div className="nav-separator"/><NavGroup items={system}/></nav>
  <footer><span className="online-dot"/> Sistema preparado<br/><small>© Antonio Molina Sánchez</small></footer>
</aside>}
