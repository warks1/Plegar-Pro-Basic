import {lazy,Suspense} from 'react';
import {createBrowserRouter} from 'react-router-dom';
import {AppShell} from './AppShell';
import {AppErrorPage} from './AppErrorPage';

const modulePage=(title:string,route:string)=>lazy(()=>import('./ModulePage').then(m=>({default:()=> <m.ModulePage title={title} route={route}/> })));

const pages={
  Dashboard:lazy(()=>import('./DashboardPage').then(m=>({default:m.DashboardPage}))),
  Projects:modulePage("Proyectos","/proyectos"),
  Development:modulePage("Desarrollo","/desarrollo"),
  DevelopmentCalculator:modulePage("Calculadora de desarrollo","/calculadora-desarrollo"),
  PartProgrammer:modulePage("Programador de pieza","/programador-pieza"),
  Programming2D:modulePage("Programación 2D","/programacion-2d"),
  Programming3D:modulePage("Programación 3D","/programacion-3d"),
  Simulation2D:modulePage("Simulación 2D","/simulacion-2d"),
  Simulation3D:modulePage("Simulación 3D","/simulacion-3d"),
  Tooling:modulePage("Utillaje","/utillaje"),
  Libraries:modulePage("Bibliotecas","/bibliotecas"),
  Orders:modulePage("Órdenes","/ordenes"),
  Settings:modulePage("Ajustes","/ajustes"),
  Ai:lazy(()=>import('./AiPage').then(m=>({default:m.AiPage}))),
  Communications:lazy(()=>import('./CommunicationsPage').then(m=>({default:m.CommunicationsPage}))),
  Validation:modulePage("Validación","/validacion"),
  Agenda:lazy(()=>import('./AgendaPage').then(m=>({default:m.AgendaPage}))),
  Customers:lazy(()=>import('./CustomersPage').then(m=>({default:m.CustomersPage}))),
  Suppliers:modulePage("Proveedores","/proveedores"),
  Production:modulePage("Producción","/produccion"),
  Quality:modulePage("Calidad","/calidad"),
  Maintenance:modulePage("Mantenimiento","/mantenimiento"),
  Materials:modulePage("Materiales","/materiales"),
  Requirements:modulePage("Requisitos","/requisitos"),
  Curve:lazy(()=>import('./CurvePerfectPage').then(m=>({default:m.CurvePerfectPage}))),
  VCompare:modulePage("Comparador V","/comparador-v"),
  Welding:modulePage("Soldadura","/soldadura"),
  Import:modulePage("Importación CAD/IA","/importacion"),
  About:lazy(()=>import('./AboutPage').then(m=>({default:m.AboutPage}))),
  Warehouse:modulePage("Almacén","/almacen"),
  Quotes:modulePage("Presupuestos","/presupuestos"),
  Routes:modulePage("Rutas de fabricación","/rutas"),
  Notifications:modulePage("Notificaciones","/notificaciones"),
  ProcessTree:modulePage("Árbol de fabricación","/arbol-fabricacion"),
  Collisions:lazy(()=>import('./CollisionsPage').then(m=>({default:m.CollisionsPage}))),
  Documents:modulePage("Documentos","/documentos"),
  Revisions:modulePage("Revisiones","/revisiones"),
  Release:modulePage("Liberación","/liberacion"),
  QualityGate:modulePage("Puerta de calidad","/puerta-calidad"),
  OfficialSources:modulePage("Fuentes oficiales","/fuentes-oficiales"),
  Integrity:modulePage("Integridad funcional","/integridad"),
  CadAssets:lazy(()=>import('./CadAssetsPage').then(m=>({default:m.CadAssetsPage}))),
  CatalogManager:lazy(()=>import('./CatalogManagerPage').then(m=>({default:m.CatalogManagerPage}))),
  CadCam:lazy(()=>import('./CadCamPage').then(m=>({default:m.CadCamPage}))),
  Updates:modulePage("Actualizaciones","/actualizaciones"),
};
const wrap=(Component:React.LazyExoticComponent<React.ComponentType>)=><Suspense fallback={<div className="module-loader">Cargando módulo…</div>}><Component/></Suspense>;
export const router=createBrowserRouter([{path:'/',element:<AppShell/>,errorElement:<AppErrorPage/>,children:[
  {index:true,element:wrap(pages.Dashboard)},{path:'proyectos',element:wrap(pages.Projects)},{path:'desarrollo',element:wrap(pages.Development)},{path:'calculadora-desarrollo',element:wrap(pages.DevelopmentCalculator)},{path:'curva-perfecta',element:wrap(pages.Curve)},{path:'comparador-v',element:wrap(pages.VCompare)},{path:'importacion',element:wrap(pages.Import)},{path:'programador-pieza',element:wrap(pages.PartProgrammer)},{path:'programacion-2d',element:wrap(pages.Programming2D)},{path:'programacion-3d',element:wrap(pages.Programming3D)},{path:'cad-cam-3d',element:wrap(pages.CadCam)},{path:'simulacion',element:wrap(pages.Simulation3D)},{path:'simulacion-2d',element:wrap(pages.Simulation2D)},{path:'simulacion-3d',element:wrap(pages.Simulation3D)},{path:'utillaje',element:wrap(pages.Tooling)},{path:'bibliotecas',element:wrap(pages.Libraries)},{path:'ordenes',element:wrap(pages.Orders)},{path:'validacion',element:wrap(pages.Validation)},{path:'arbol-fabricacion',element:wrap(pages.ProcessTree)},{path:'colisiones',element:wrap(pages.Collisions)},{path:'documentos',element:wrap(pages.Documents)},{path:'revisiones',element:wrap(pages.Revisions)},{path:'liberacion',element:wrap(pages.Release)},{path:'agenda',element:wrap(pages.Agenda)},{path:'clientes',element:wrap(pages.Customers)},{path:'proveedores',element:wrap(pages.Suppliers)},{path:'produccion',element:wrap(pages.Production)},{path:'soldadura',element:wrap(pages.Welding)},{path:'calidad',element:wrap(pages.Quality)},{path:'mantenimiento',element:wrap(pages.Maintenance)},{path:'materiales',element:wrap(pages.Materials)},{path:'requisitos',element:wrap(pages.Requirements)},{path:'ajustes',element:wrap(pages.Settings)},{path:'ia',element:wrap(pages.Ai)},{path:'comunicacion',element:wrap(pages.Communications)},{path:'almacen',element:wrap(pages.Warehouse)},{path:'presupuestos',element:wrap(pages.Quotes)},{path:'rutas',element:wrap(pages.Routes)},{path:'notificaciones',element:wrap(pages.Notifications)},{path:'puerta-calidad',element:wrap(pages.QualityGate)},{path:'fuentes-oficiales',element:wrap(pages.OfficialSources)},{path:'registro-cad',element:wrap(pages.CadAssets)},{path:'catalogos-tecnicos',element:wrap(pages.CatalogManager)},{path:'integridad',element:wrap(pages.Integrity)},{path:'actualizaciones',element:wrap(pages.Updates)},{path:'acerca-de',element:wrap(pages.About)}
]}]);
