import {lazy,Suspense} from 'react';
import {createBrowserRouter} from 'react-router-dom';
import {AppShell} from './AppShell';
import {AppErrorPage} from './AppErrorPage';

const pages={
  Dashboard:lazy(()=>import('./DashboardPage').then(m=>({default:m.DashboardPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Projects:lazy(()=>import('./ProjectsPage-BaluQiUy.js').then(m=>({default:m.ProjectsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Development:lazy(()=>import('./DevelopmentPage-B_Jw04OJ.js').then(m=>({default:m.DevelopmentPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  DevelopmentCalculator:lazy(()=>import('./DevelopmentCalculatorPage-CS_-p8RR.js').then(m=>({default:m.DevelopmentCalculatorPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  PartProgrammer:lazy(()=>import('./PartProgrammerPage-CQgWPfWM.js').then(m=>({default:m.PartProgrammerPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Programming2D:lazy(()=>import('./Programming2DPage-DZQa639B.js').then(m=>({default:m.Programming2DPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Programming3D:lazy(()=>import('./Programming3DPage-B-9iLBwM.js').then(m=>({default:m.Programming3DPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Simulation2D:lazy(()=>import('./SimulationPage-c1WPp7AU.js').then(m=>({default:m.Simulation2DPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Simulation3D:lazy(()=>import('./SimulationPage-c1WPp7AU.js').then(m=>({default:m.Simulation3DPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Tooling:lazy(()=>import('./ToolingPage-DGUS0WyL.js').then(m=>({default:m.ToolingPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Libraries:lazy(()=>import('./LibrariesPage-BtwSwUwE.js').then(m=>({default:m.LibrariesPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Orders:lazy(()=>import('./OrdersPage-D0p7cXnX.js').then(m=>({default:m.OrdersPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Settings:lazy(()=>import('./SettingsPage-DgLP2AIk.js').then(m=>({default:m.SettingsPage}))),
  Ai:lazy(()=>import('./AiPage').then(m=>({default:m.AiPage}))),
  Communications:lazy(()=>import('./CommunicationsPage').then(m=>({default:m.CommunicationsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Validation:lazy(()=>import('./ValidationPage-B2PeLmUv.js').then(m=>({default:m.ValidationPage}))),
  Agenda:lazy(()=>import('./AgendaPage').then(m=>({default:m.AgendaPage}))),
  Customers:lazy(()=>import('./CustomersPage').then(m=>({default:m.CustomersPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Suppliers:lazy(()=>import('./SuppliersPage-13Adfwu4.js').then(m=>({default:m.SuppliersPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Production:lazy(()=>import('./ProductionPage-aHrzLsDf.js').then(m=>({default:m.ProductionPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Quality:lazy(()=>import('./QualityPage-CYzDckfu.js').then(m=>({default:m.QualityPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Maintenance:lazy(()=>import('./MaintenancePage-BoHPAvYG.js').then(m=>({default:m.MaintenancePage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Materials:lazy(()=>import('./MaterialsPage-BKpHKhP8.js').then(m=>({default:m.MaterialsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Requirements:lazy(()=>import('./RequirementsPage-1gRMFWE6.js').then(m=>({default:m.RequirementsPage}))),
  Curve:lazy(()=>import('./CurvePerfectPage').then(m=>({default:m.CurvePerfectPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  VCompare:lazy(()=>import('./VComparePage-B8Kaviti.js').then(m=>({default:m.VComparePage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Welding:lazy(()=>import('./WeldingPage-DDiMzKKi.js').then(m=>({default:m.WeldingPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Import:lazy(()=>import('./ImportPage-SQakPGm3.js').then(m=>({default:m.ImportPage}))),
  About:lazy(()=>import('./AboutPage').then(m=>({default:m.AboutPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Warehouse:lazy(()=>import('./WarehousePage-B-VENc5b.js').then(m=>({default:m.WarehousePage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Quotes:lazy(()=>import('./QuotesPage-BOvts-U6.js').then(m=>({default:m.QuotesPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Routes:lazy(()=>import('./RoutesPage-mife8W_R.js').then(m=>({default:m.RoutesPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Notifications:lazy(()=>import('./NotificationsPage-h-llBQFk.js').then(m=>({default:m.NotificationsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  ProcessTree:lazy(()=>import('./ProcessTreePage-CCJU9iO0.js').then(m=>({default:m.ProcessTreePage}))),
  Collisions:lazy(()=>import('./CollisionsPage').then(m=>({default:m.CollisionsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Documents:lazy(()=>import('./DocumentsPage-CGV2KSPx.js').then(m=>({default:m.DocumentsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Revisions:lazy(()=>import('./RevisionsPage-Dt-mU57u.js').then(m=>({default:m.RevisionsPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Release:lazy(()=>import('./ReleasePage-BcIL5ZtI.js').then(m=>({default:m.ReleasePage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  QualityGate:lazy(()=>import('./QualityGatePage-CH_-w0H-.js').then(m=>({default:m.QualityGatePage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  OfficialSources:lazy(()=>import('./OfficialSourcesPage-D-avNxea.js').then(m=>({default:m.OfficialSourcesPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Integrity:lazy(()=>import('./IntegrityPage-DF7GeeBR.js').then(m=>({default:m.IntegrityPage}))),
  CadAssets:lazy(()=>import('./CadAssetsPage').then(m=>({default:m.CadAssetsPage}))),
  CatalogManager:lazy(()=>import('./CatalogManagerPage').then(m=>({default:m.CatalogManagerPage}))),
  CadCam:lazy(()=>import('./CadCamPage').then(m=>({default:m.CadCamPage}))),
  // @ts-expect-error No source declaration exists for this checked-in production bundle.
  Updates:lazy(()=>import('./UpdatesPage-D05cBLa7.js').then(m=>({default:m.UpdatesPage}))),
};
const wrap=(Component:React.LazyExoticComponent<React.ComponentType>)=><Suspense fallback={<div className="module-loader">Cargando módulo…</div>}><Component/></Suspense>;
export const router=createBrowserRouter([{path:'/',element:<AppShell/>,errorElement:<AppErrorPage/>,children:[
  {index:true,element:wrap(pages.Dashboard)},{path:'proyectos',element:wrap(pages.Projects)},{path:'desarrollo',element:wrap(pages.Development)},{path:'calculadora-desarrollo',element:wrap(pages.DevelopmentCalculator)},{path:'curva-perfecta',element:wrap(pages.Curve)},{path:'comparador-v',element:wrap(pages.VCompare)},{path:'importacion',element:wrap(pages.Import)},{path:'programador-pieza',element:wrap(pages.PartProgrammer)},{path:'programacion-2d',element:wrap(pages.Programming2D)},{path:'programacion-3d',element:wrap(pages.Programming3D)},{path:'cad-cam-3d',element:wrap(pages.CadCam)},{path:'simulacion',element:wrap(pages.Simulation3D)},{path:'simulacion-2d',element:wrap(pages.Simulation2D)},{path:'simulacion-3d',element:wrap(pages.Simulation3D)},{path:'utillaje',element:wrap(pages.Tooling)},{path:'bibliotecas',element:wrap(pages.Libraries)},{path:'ordenes',element:wrap(pages.Orders)},{path:'validacion',element:wrap(pages.Validation)},{path:'arbol-fabricacion',element:wrap(pages.ProcessTree)},{path:'colisiones',element:wrap(pages.Collisions)},{path:'documentos',element:wrap(pages.Documents)},{path:'revisiones',element:wrap(pages.Revisions)},{path:'liberacion',element:wrap(pages.Release)},{path:'agenda',element:wrap(pages.Agenda)},{path:'clientes',element:wrap(pages.Customers)},{path:'proveedores',element:wrap(pages.Suppliers)},{path:'produccion',element:wrap(pages.Production)},{path:'soldadura',element:wrap(pages.Welding)},{path:'calidad',element:wrap(pages.Quality)},{path:'mantenimiento',element:wrap(pages.Maintenance)},{path:'materiales',element:wrap(pages.Materials)},{path:'requisitos',element:wrap(pages.Requirements)},{path:'ajustes',element:wrap(pages.Settings)},{path:'ia',element:wrap(pages.Ai)},{path:'comunicacion',element:wrap(pages.Communications)},{path:'almacen',element:wrap(pages.Warehouse)},{path:'presupuestos',element:wrap(pages.Quotes)},{path:'rutas',element:wrap(pages.Routes)},{path:'notificaciones',element:wrap(pages.Notifications)},{path:'puerta-calidad',element:wrap(pages.QualityGate)},{path:'fuentes-oficiales',element:wrap(pages.OfficialSources)},{path:'registro-cad',element:wrap(pages.CadAssets)},{path:'catalogos-tecnicos',element:wrap(pages.CatalogManager)},{path:'integridad',element:wrap(pages.Integrity)},{path:'actualizaciones',element:wrap(pages.Updates)},{path:'acerca-de',element:wrap(pages.About)}
]}]);
