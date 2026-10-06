import {lazy,Suspense} from 'react';
import {createBrowserRouter} from 'react-router-dom';
import {AppShell} from '../components/AppShell';
import {AppErrorPage} from '../components/AppErrorPage';

const pages={
  Dashboard:lazy(()=>import('../features/dashboard/DashboardPage').then(m=>({default:m.DashboardPage}))),
  Projects:lazy(()=>import('../features/projects/ProjectsPage').then(m=>({default:m.ProjectsPage}))),
  Development:lazy(()=>import('../features/development/DevelopmentPage').then(m=>({default:m.DevelopmentPage}))),
  DevelopmentCalculator:lazy(()=>import('../features/development-calculator/DevelopmentCalculatorPage').then(m=>({default:m.DevelopmentCalculatorPage}))),
  PartProgrammer:lazy(()=>import('../features/programming/PartProgrammerPage').then(m=>({default:m.PartProgrammerPage}))),
  Programming2D:lazy(()=>import('../features/programming/Programming2DPage').then(m=>({default:m.Programming2DPage}))),
  Programming3D:lazy(()=>import('../features/programming/Programming3DPage').then(m=>({default:m.Programming3DPage}))),
  Simulation2D:lazy(()=>import('../features/simulation/SimulationPage').then(m=>({default:m.Simulation2DPage}))),
  Simulation3D:lazy(()=>import('../features/simulation/SimulationPage').then(m=>({default:m.Simulation3DPage}))),
  Tooling:lazy(()=>import('../features/tooling/ToolingPage').then(m=>({default:m.ToolingPage}))),
  Libraries:lazy(()=>import('../features/libraries/LibrariesPage').then(m=>({default:m.LibrariesPage}))),
  Orders:lazy(()=>import('../features/orders/OrdersPage').then(m=>({default:m.OrdersPage}))),
  Settings:lazy(()=>import('../features/settings/SettingsPage').then(m=>({default:m.SettingsPage}))),
  Ai:lazy(()=>import('../features/ai/AiPage').then(m=>({default:m.AiPage}))),
  Communications:lazy(()=>import('../features/communications/CommunicationsPage').then(m=>({default:m.CommunicationsPage}))),
  Validation:lazy(()=>import('../features/validation/ValidationPage').then(m=>({default:m.ValidationPage}))),
  Agenda:lazy(()=>import('../features/agenda/AgendaPage').then(m=>({default:m.AgendaPage}))),
  Customers:lazy(()=>import('../features/customers/CustomersPage').then(m=>({default:m.CustomersPage}))),
  Suppliers:lazy(()=>import('../features/suppliers/SuppliersPage').then(m=>({default:m.SuppliersPage}))),
  Production:lazy(()=>import('../features/production/ProductionPage').then(m=>({default:m.ProductionPage}))),
  Quality:lazy(()=>import('../features/quality/QualityPage').then(m=>({default:m.QualityPage}))),
  Maintenance:lazy(()=>import('../features/maintenance/MaintenancePage').then(m=>({default:m.MaintenancePage}))),
  Materials:lazy(()=>import('../features/materials/MaterialsPage').then(m=>({default:m.MaterialsPage}))),
  Requirements:lazy(()=>import('../features/requirements/RequirementsPage').then(m=>({default:m.RequirementsPage}))),
  Curve:lazy(()=>import('../features/curve/CurvePerfectPage').then(m=>({default:m.CurvePerfectPage}))),
  VCompare:lazy(()=>import('../features/vcompare/VComparePage').then(m=>({default:m.VComparePage}))),
  Welding:lazy(()=>import('../features/welding/WeldingPage').then(m=>({default:m.WeldingPage}))),
  Import:lazy(()=>import('../features/importer/ImportPage').then(m=>({default:m.ImportPage}))),
  About:lazy(()=>import('../features/about/AboutPage').then(m=>({default:m.AboutPage}))),
  Warehouse:lazy(()=>import('../features/warehouse/WarehousePage').then(m=>({default:m.WarehousePage}))),
  Quotes:lazy(()=>import('../features/quotes/QuotesPage').then(m=>({default:m.QuotesPage}))),
  Routes:lazy(()=>import('../features/routes/RoutesPage').then(m=>({default:m.RoutesPage}))),
  Notifications:lazy(()=>import('../features/notifications/NotificationsPage').then(m=>({default:m.NotificationsPage}))),
  ProcessTree:lazy(()=>import('../features/process-tree/ProcessTreePage').then(m=>({default:m.ProcessTreePage}))),
  Collisions:lazy(()=>import('../features/collisions/CollisionsPage').then(m=>({default:m.CollisionsPage}))),
  Documents:lazy(()=>import('../features/documents/DocumentsPage').then(m=>({default:m.DocumentsPage}))),
  Revisions:lazy(()=>import('../features/revisions/RevisionsPage').then(m=>({default:m.RevisionsPage}))),
  Release:lazy(()=>import('../features/release/ReleasePage').then(m=>({default:m.ReleasePage}))),
  QualityGate:lazy(()=>import('../features/quality-gate/QualityGatePage').then(m=>({default:m.QualityGatePage}))),
  OfficialSources:lazy(()=>import('../features/official-sources/OfficialSourcesPage').then(m=>({default:m.OfficialSourcesPage}))),
  Integrity:lazy(()=>import('../features/integrity/IntegrityPage').then(m=>({default:m.IntegrityPage}))),
  CadAssets:lazy(()=>import('../features/cad-assets/CadAssetsPage').then(m=>({default:m.CadAssetsPage}))),
  CatalogManager:lazy(()=>import('../features/catalog-manager/CatalogManagerPage').then(m=>({default:m.CatalogManagerPage}))),
  CadCam:lazy(()=>import('../features/cad-cam/CadCamPage').then(m=>({default:m.CadCamPage}))),
  Updates:lazy(()=>import('../features/updates/UpdatesPage').then(m=>({default:m.UpdatesPage}))),
};
const wrap=(Component:React.LazyExoticComponent<React.ComponentType>)=><Suspense fallback={<div className="module-loader">Cargando módulo…</div>}><Component/></Suspense>;
export const router=createBrowserRouter([{path:'/',element:<AppShell/>,errorElement:<AppErrorPage/>,children:[
  {index:true,element:wrap(pages.Dashboard)},{path:'proyectos',element:wrap(pages.Projects)},{path:'desarrollo',element:wrap(pages.Development)},{path:'calculadora-desarrollo',element:wrap(pages.DevelopmentCalculator)},{path:'curva-perfecta',element:wrap(pages.Curve)},{path:'comparador-v',element:wrap(pages.VCompare)},{path:'importacion',element:wrap(pages.Import)},{path:'programador-pieza',element:wrap(pages.PartProgrammer)},{path:'programacion-2d',element:wrap(pages.Programming2D)},{path:'programacion-3d',element:wrap(pages.Programming3D)},{path:'cad-cam-3d',element:wrap(pages.CadCam)},{path:'simulacion',element:wrap(pages.Simulation3D)},{path:'simulacion-2d',element:wrap(pages.Simulation2D)},{path:'simulacion-3d',element:wrap(pages.Simulation3D)},{path:'utillaje',element:wrap(pages.Tooling)},{path:'bibliotecas',element:wrap(pages.Libraries)},{path:'ordenes',element:wrap(pages.Orders)},{path:'validacion',element:wrap(pages.Validation)},{path:'arbol-fabricacion',element:wrap(pages.ProcessTree)},{path:'colisiones',element:wrap(pages.Collisions)},{path:'documentos',element:wrap(pages.Documents)},{path:'revisiones',element:wrap(pages.Revisions)},{path:'liberacion',element:wrap(pages.Release)},{path:'agenda',element:wrap(pages.Agenda)},{path:'clientes',element:wrap(pages.Customers)},{path:'proveedores',element:wrap(pages.Suppliers)},{path:'produccion',element:wrap(pages.Production)},{path:'soldadura',element:wrap(pages.Welding)},{path:'calidad',element:wrap(pages.Quality)},{path:'mantenimiento',element:wrap(pages.Maintenance)},{path:'materiales',element:wrap(pages.Materials)},{path:'requisitos',element:wrap(pages.Requirements)},{path:'ajustes',element:wrap(pages.Settings)},{path:'ia',element:wrap(pages.Ai)},{path:'comunicacion',element:wrap(pages.Communications)},{path:'almacen',element:wrap(pages.Warehouse)},{path:'presupuestos',element:wrap(pages.Quotes)},{path:'rutas',element:wrap(pages.Routes)},{path:'notificaciones',element:wrap(pages.Notifications)},{path:'puerta-calidad',element:wrap(pages.QualityGate)},{path:'fuentes-oficiales',element:wrap(pages.OfficialSources)},{path:'registro-cad',element:wrap(pages.CadAssets)},{path:'catalogos-tecnicos',element:wrap(pages.CatalogManager)},{path:'integridad',element:wrap(pages.Integrity)},{path:'actualizaciones',element:wrap(pages.Updates)},{path:'acerca-de',element:wrap(pages.About)}
]}]);
