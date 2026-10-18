import {lazy,Suspense} from 'react';
import {createBrowserRouter} from 'react-router-dom';
import {AppShell} from './AppShell';
import {AppErrorPage} from './AppErrorPage';

const pages={
  Dashboard:lazy(()=>import('./DashboardPage').then(m=>({default:m.DashboardPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Projects:lazy(()=>import('./site/assets/ProjectsPage-BaluQiUy.js').then(m=>({default:m.ProjectsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Development:lazy(()=>import('./site/assets/DevelopmentPage-B_Jw04OJ.js').then(m=>({default:m.DevelopmentPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  DevelopmentCalculator:lazy(()=>import('./site/assets/DevelopmentCalculatorPage-CS_-p8RR.js').then(m=>({default:m.DevelopmentCalculatorPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  PartProgrammer:lazy(()=>import('./site/assets/PartProgrammerPage-CQgWPfWM.js').then(m=>({default:m.PartProgrammerPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Programming2D:lazy(()=>import('./site/assets/Programming2DPage-DZQa639B.js').then(m=>({default:m.Programming2DPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Programming3D:lazy(()=>import('./site/assets/Programming3DPage-B-9iLBwM.js').then(m=>({default:m.Programming3DPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Simulation2D:lazy(()=>import('./site/assets/SimulationPage-c1WPp7AU.js').then(m=>({default:m.Simulation2DPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Simulation3D:lazy(()=>import('./site/assets/SimulationPage-c1WPp7AU.js').then(m=>({default:m.Simulation3DPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Tooling:lazy(()=>import('./site/assets/ToolingPage-DGUS0WyL.js').then(m=>({default:m.ToolingPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Libraries:lazy(()=>import('./site/assets/LibrariesPage-BtwSwUwE.js').then(m=>({default:m.LibrariesPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Orders:lazy(()=>import('./site/assets/OrdersPage-D0p7cXnX.js').then(m=>({default:m.OrdersPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Settings:lazy(()=>import('./site/assets/SettingsPage-DgLP2AIk.js').then(m=>({default:m.SettingsPage}))),
  Ai:lazy(()=>import('./AiPage').then(m=>({default:m.AiPage}))),
  Communications:lazy(()=>import('./CommunicationsPage').then(m=>({default:m.CommunicationsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Validation:lazy(()=>import('./site/assets/ValidationPage-B2PeLmUv.js').then(m=>({default:m.ValidationPage}))),
  Agenda:lazy(()=>import('./AgendaPage').then(m=>({default:m.AgendaPage}))),
  Customers:lazy(()=>import('./CustomersPage').then(m=>({default:m.CustomersPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Suppliers:lazy(()=>import('./site/assets/SuppliersPage-13Adfwu4.js').then(m=>({default:m.SuppliersPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Production:lazy(()=>import('./site/assets/ProductionPage-aHrzLsDf.js').then(m=>({default:m.ProductionPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Quality:lazy(()=>import('./site/assets/QualityPage-CYzDckfu.js').then(m=>({default:m.QualityPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Maintenance:lazy(()=>import('./site/assets/MaintenancePage-BoHPAvYG.js').then(m=>({default:m.MaintenancePage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Materials:lazy(()=>import('./site/assets/MaterialsPage-BKpHKhP8.js').then(m=>({default:m.MaterialsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Requirements:lazy(()=>import('./site/assets/RequirementsPage-1gRMFWE6.js').then(m=>({default:m.RequirementsPage}))),
  Curve:lazy(()=>import('./CurvePerfectPage').then(m=>({default:m.CurvePerfectPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  VCompare:lazy(()=>import('./site/assets/VComparePage-B8Kaviti.js').then(m=>({default:m.VComparePage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Welding:lazy(()=>import('./site/assets/WeldingPage-DDiMzKKi.js').then(m=>({default:m.WeldingPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Import:lazy(()=>import('./site/assets/ImportPage-SQakPGm3.js').then(m=>({default:m.ImportPage}))),
  About:lazy(()=>import('./AboutPage').then(m=>({default:m.AboutPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Warehouse:lazy(()=>import('./site/assets/WarehousePage-B-VENc5b.js').then(m=>({default:m.WarehousePage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Quotes:lazy(()=>import('./site/assets/QuotesPage-BOvts-U6.js').then(m=>({default:m.QuotesPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Routes:lazy(()=>import('./site/assets/RoutesPage-mife8W_R.js').then(m=>({default:m.RoutesPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Notifications:lazy(()=>import('./site/assets/NotificationsPage-h-llBQFk.js').then(m=>({default:m.NotificationsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  ProcessTree:lazy(()=>import('./site/assets/ProcessTreePage-CCJU9iO0.js').then(m=>({default:m.ProcessTreePage}))),
  Collisions:lazy(()=>import('./CollisionsPage').then(m=>({default:m.CollisionsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Documents:lazy(()=>import('./site/assets/DocumentsPage-CGV2KSPx.js').then(m=>({default:m.DocumentsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Revisions:lazy(()=>import('./site/assets/RevisionsPage-Dt-mU57u.js').then(m=>({default:m.RevisionsPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Release:lazy(()=>import('./site/assets/ReleasePage-BcIL5ZtI.js').then(m=>({default:m.ReleasePage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  QualityGate:lazy(()=>import('./site/assets/QualityGatePage-CH_-w0H-.js').then(m=>({default:m.QualityGatePage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  OfficialSources:lazy(()=>import('./site/assets/OfficialSourcesPage-D-avNxea.js').then(m=>({default:m.OfficialSourcesPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Integrity:lazy(()=>import('./site/assets/IntegrityPage-DF7GeeBR.js').then(m=>({default:m.IntegrityPage}))),
  CadAssets:lazy(()=>import('./CadAssetsPage').then(m=>({default:m.CadAssetsPage}))),
  CatalogManager:lazy(()=>import('./CatalogManagerPage').then(m=>({default:m.CatalogManagerPage}))),
  CadCam:lazy(()=>import('./CadCamPage').then(m=>({default:m.CadCamPage}))),
  // @ts-expect-error -- restore the existing compiled page module; its original TSX source is absent.
  Updates:lazy(()=>import('./site/assets/UpdatesPage-D05cBLa7.js').then(m=>({default:m.UpdatesPage}))),
};
const wrap=(Component:React.LazyExoticComponent<React.ComponentType>)=><Suspense fallback={<div className="module-loader">Cargando módulo…</div>}><Component/></Suspense>;
export const router=createBrowserRouter([{path:'/',element:<AppShell/>,errorElement:<AppErrorPage/>,children:[
  {index:true,element:wrap(pages.Dashboard)},{path:'proyectos',element:wrap(pages.Projects)},{path:'desarrollo',element:wrap(pages.Development)},{path:'calculadora-desarrollo',element:wrap(pages.DevelopmentCalculator)},{path:'curva-perfecta',element:wrap(pages.Curve)},{path:'comparador-v',element:wrap(pages.VCompare)},{path:'importacion',element:wrap(pages.Import)},{path:'programador-pieza',element:wrap(pages.PartProgrammer)},{path:'programacion-2d',element:wrap(pages.Programming2D)},{path:'programacion-3d',element:wrap(pages.Programming3D)},{path:'cad-cam-3d',element:wrap(pages.CadCam)},{path:'simulacion',element:wrap(pages.Simulation3D)},{path:'simulacion-2d',element:wrap(pages.Simulation2D)},{path:'simulacion-3d',element:wrap(pages.Simulation3D)},{path:'utillaje',element:wrap(pages.Tooling)},{path:'bibliotecas',element:wrap(pages.Libraries)},{path:'ordenes',element:wrap(pages.Orders)},{path:'validacion',element:wrap(pages.Validation)},{path:'arbol-fabricacion',element:wrap(pages.ProcessTree)},{path:'colisiones',element:wrap(pages.Collisions)},{path:'documentos',element:wrap(pages.Documents)},{path:'revisiones',element:wrap(pages.Revisions)},{path:'liberacion',element:wrap(pages.Release)},{path:'agenda',element:wrap(pages.Agenda)},{path:'clientes',element:wrap(pages.Customers)},{path:'proveedores',element:wrap(pages.Suppliers)},{path:'produccion',element:wrap(pages.Production)},{path:'soldadura',element:wrap(pages.Welding)},{path:'calidad',element:wrap(pages.Quality)},{path:'mantenimiento',element:wrap(pages.Maintenance)},{path:'materiales',element:wrap(pages.Materials)},{path:'requisitos',element:wrap(pages.Requirements)},{path:'ajustes',element:wrap(pages.Settings)},{path:'ia',element:wrap(pages.Ai)},{path:'comunicacion',element:wrap(pages.Communications)},{path:'almacen',element:wrap(pages.Warehouse)},{path:'presupuestos',element:wrap(pages.Quotes)},{path:'rutas',element:wrap(pages.Routes)},{path:'notificaciones',element:wrap(pages.Notifications)},{path:'puerta-calidad',element:wrap(pages.QualityGate)},{path:'fuentes-oficiales',element:wrap(pages.OfficialSources)},{path:'registro-cad',element:wrap(pages.CadAssets)},{path:'catalogos-tecnicos',element:wrap(pages.CatalogManager)},{path:'integridad',element:wrap(pages.Integrity)},{path:'actualizaciones',element:wrap(pages.Updates)},{path:'acerca-de',element:wrap(pages.About)}
]}]);
