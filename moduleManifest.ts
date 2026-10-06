export type ModuleMaturity='functional'|'partial'|'blocked';
export interface ModuleContract {
  id:string;
  label:string;
  route:string;
  form:string;
  actions:string[];
  maturity:ModuleMaturity;
  missing:string[];
}

export const moduleContracts:ModuleContract[]=[
{id:'projects',label:'Proyectos',route:'/proyectos',form:'Proyecto industrial',actions:['Crear','Editar','Duplicar','Activar'],maturity:'functional',missing:['Archivado y recuperación avanzada']},
{id:'import',label:'Importación CAD/IA',route:'/importacion',form:'Importación y diagnóstico',actions:['Seleccionar archivo','Analizar','Conservar original'],maturity:'partial',missing:['Traductores STEP/IGES/DWG autorizados','Reconstrucción geométrica real desde foto']},
{id:'development',label:'Desarrollo',route:'/desarrollo',form:'Geometría y plegados',actions:['Añadir plegado','Editar','Eliminar','Reordenar'],maturity:'functional',missing:['Editor de taladros, ranuras y rebajes']},
{id:'program2d',label:'Programación 2D',route:'/programacion-2d',form:'Parámetros de pliegue y secuencia',actions:['Seleccionar pliegue','Editar cotas','Asignar herramienta'],maturity:'functional',missing:['Arrastre gráfico de cotas y líneas']},
{id:'program3d',label:'Programación 3D',route:'/programacion-3d',form:'Vista, cámara y plegados',actions:['Isométrica','Frontal','Superior','Centrar','Cotas','Zoom'],maturity:'partial',missing:['Geometría B-Rep real','Selección de caras y aristas CAD']},
{id:'cad-cam-3d',label:'Diseño CAD/CAM 3D',route:'/cad-cam-3d',form:'Boceto, modelo paramétrico y plan CAM',actions:['Crear geometría','Añadir taladros','Añadir pliegues','Guardar en proyecto','Exportar DXF','Exportar NC'],maturity:'partial',missing:['Kernel B-Rep profesional','Postprocesadores CNC específicos por máquina']},
{id:'simulation-2d',label:'Simulación 2D',route:'/simulacion-2d',form:'Máquina, herramienta, velocidad y secuencia',actions:['Acercar','Alejar','Voltear','Reproducir','Pausar','Anterior','Siguiente','Reiniciar'],maturity:'partial',missing:['Cinemática CAD exacta']},
{id:'simulation-3d',label:'Simulación 3D',route:'/simulacion-3d',form:'Máquina, herramienta, cámara, velocidad y secuencia',actions:['Girar','Mover','Acercar','Alejar','Voltear','Reproducir','Pausar','Anterior','Siguiente','Reiniciar'],maturity:'partial',missing:['Colisión malla contra malla','CAD oficial de máquina']},
{id:'tooling',label:'Utillaje',route:'/utillaje',form:'Selección y ficha técnica',actions:['Filtrar','Seleccionar','Cambiar vista','Asignar montaje'],maturity:'partial',missing:['CAD oficial de todas las referencias','Vistas de sección y explosión completas']},
{id:'cad-assets',label:'Registro CAD',route:'/registro-cad',form:'Archivo, fabricante, referencia, fuente y validación',actions:['Seleccionar archivo','Inspeccionar geometría','Registrar','Descargar','Eliminar'],maturity:'partial',missing:['Persistencia compartida en backend','Traductores STEP/IGES/DXF completos','Visor WebGL malla real']},
{id:'catalog-manager',label:'Catálogos técnicos',route:'/catalogos-tecnicos',form:'Paquete JSON versionado y trazable',actions:['Importar','Validar','Exportar','Eliminar'],maturity:'partial',missing:['Conectores automáticos autenticados con fabricantes']},
{id:'libraries',label:'Bibliotecas',route:'/bibliotecas',form:'Catálogo, filtro y trazabilidad',actions:['Buscar','Filtrar','Abrir fuente','Exportar'],maturity:'partial',missing:['Conectores autenticados y actualización automática']},
{id:'orders',label:'Órdenes',route:'/ordenes',form:'Orden y ruta de fabricación',actions:['Crear','Editar','Liberar'],maturity:'functional',missing:['Firma digital y planificación avanzada']},
{id:'suppliers',label:'Proveedores',route:'/proveedores',form:'Ficha completa de proveedor',actions:['Buscar','Filtrar','Llamar','Email','Web','Guardar'],maturity:'functional',missing:['Google Places con clave propia','Actualización programada']},
{id:'ai',label:'IA industrial',route:'/ia',form:'Consulta con contexto técnico',actions:['Analizar contexto','Calcular V','Calcular tonelaje','Revisar secuencia'],maturity:'partial',missing:['API de modelo externo','RAG con manuales y normas licenciadas','Citas automáticas en tiempo real']},
{id:'settings',label:'Ajustes',route:'/ajustes',form:'Configuración por categorías',actions:['Guardar','Exportar','Restablecer'],maturity:'functional',missing:['Políticas empresariales remotas']},
];

export function summarizeContracts(items=moduleContracts){
  return items.reduce((acc,item)=>{acc[item.maturity]+=1;return acc},{functional:0,partial:0,blocked:0} as Record<ModuleMaturity,number>);
}
