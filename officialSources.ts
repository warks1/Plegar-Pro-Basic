export type SourceAccess='public'|'account'|'manual-request';
export type SourceKind='tooling'|'machines'|'software'|'catalog'|'supplier';

export interface OfficialSource {
  id:string;
  organization:string;
  title:string;
  kind:SourceKind;
  url:string;
  access:SourceAccess;
  formats:string[];
  scope:string;
  verifiedAt:string;
  notes:string;
}

export const officialSources:OfficialSource[]=[
  {id:'trumpf-bending-tools',organization:'TRUMPF',title:'Bending tools',kind:'tooling',url:'https://www.trumpf.com/en_INT/products/services/services-machines-systems-and-lasers/tools/bending-tools/',access:'public',formats:['PDF','catalog data'],scope:'Catálogo oficial de herramientas de plegado y familias de producto.',verifiedAt:'2026-08-01',notes:'Los datos de programación y algunas descargas requieren MyTRUMPF.'},
  {id:'trumpf-download-center',organization:'TRUMPF',title:'MyTRUMPF Download Center',kind:'software',url:'https://www.trumpf.com/en_US/mytrumpf/public-pages/mytrumpf-download-center/',access:'account',formats:['programming data','software updates'],scope:'Datos de programación para herramientas de punzonado y plegado.',verifiedAt:'2026-08-01',notes:'Requiere cuenta de cliente y permisos del fabricante.'},
  {id:'trumpf-catalog-pdf',organization:'TRUMPF',title:'TRUMPF bending tools catalog',kind:'catalog',url:'https://www.trumpf.com/filestorage/TRUMPF_Master/Products/Services/01_brochures/TRUMPF-bending-tools-catalog-EN.pdf',access:'public',formats:['PDF'],scope:'Catálogo técnico oficial de herramientas.',verifiedAt:'2026-08-01',notes:'Útil para reconstrucción paramétrica validada cuando no exista CAD público.'},
  {id:'amada-tooling',organization:'AMADA',title:'AMADA Tooling',kind:'tooling',url:'https://www.amada.eu/uk-en/products/tooling/',access:'public',formats:['web catalog','PDF'],scope:'Información oficial de herramientas de plegado AMADA.',verifiedAt:'2026-08-01',notes:'Los modelos CAD completos no aparecen como descarga pública universal.'},
  {id:'amada-tool-catalog',organization:'AMADA',title:'Bending tools catalogue',kind:'catalog',url:'https://cdn.amada.eu/fileadmin/Repository/Products/Brochures/Catalog_AFH_EN_2021.pdf',access:'public',formats:['PDF'],scope:'Dimensiones, referencias, radios, ángulos, longitudes y capacidades.',verifiedAt:'2026-08-01',notes:'Fuente primaria para validar fichas de utillaje.'},
  {id:'amada-cross-section',organization:'AMADA',title:'AMADA bending machines software',kind:'software',url:'https://www.amada.eu/uk-en/products/software/bending-machines-software/',access:'public',formats:['CSV','3D database'],scope:'Conversión de datos de sección AMADA a componentes 3D.',verifiedAt:'2026-08-01',notes:'La interoperabilidad completa depende del software AMADA y sus licencias.'},
  {id:'bystronic-tooling',organization:'Bystronic',title:'Press brake tools',kind:'tooling',url:'https://www.bystronic.com/int/en/b/press-brake-tools',access:'public',formats:['web catalog'],scope:'Paquetes oficiales de utillaje y compatibilidades Bystronic.',verifiedAt:'2026-08-01',notes:'La descarga de geometría detallada puede requerir contacto comercial.'},
  {id:'korpleg-machines',organization:'KORPLEG',title:'Hydraulic press brakes',kind:'machines',url:'https://korpleg.com/press-brake/?lang=en',access:'public',formats:['web catalog','PDF'],scope:'Gamas y características de plegadoras hidráulicas KORPLEG.',verifiedAt:'2026-08-01',notes:'Usar documentación oficial para reconstrucciones, no inventar medidas.'},
  {id:'korpleg-pcn-pdf',organization:'KORPLEG',title:'PCN hydraulic press brakes catalog',kind:'catalog',url:'https://korpleg.com/wp-content/uploads/2021/09/catalogo-plegadoras-eng.pdf',access:'public',formats:['PDF'],scope:'Catálogo oficial de plegadoras PCN de 30 a 550 toneladas.',verifiedAt:'2026-08-01',notes:'Permite validar configuración general por potencia y longitud.'},
];

export const verifiedSupplierSources=[
  {id:'sup-metalcar',name:'Metalcar',city:'Barcelona',materials:['Acero','Aluminio','Inoxidable'],services:['Corte láser','Piezas a medida','Entrega'],email:'',phone:'',website:'https://metal-car.eu/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-inoxcreix',name:'Inox Creix',city:'Barcelona',materials:['Chapa inoxidable','Bobina inoxidable','Fleje inoxidable'],services:['Distribución','Comercialización'],email:'',phone:'',website:'https://www.inoxcreix.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-alustock',name:'Alu-Stock',city:'España',materials:['Aluminio','Productos laminados','Perfiles'],services:['Distribución industrial','Arquitectura'],email:'',phone:'',website:'https://www.alu-stock.es/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-steelmed',name:'SteelMed',city:'España',materials:['Chapa de acero','Bobinas de acero','Fleje'],services:['Corte longitudinal','Corte transversal','Centro de servicios'],email:'',phone:'',website:'https://www.steelmed.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-cdl',name:'Comercial de Laminados',city:'España',materials:['Acero','Hierro','Aluminio','Chapa','Bobina'],services:['Distribución local','Distribución nacional'],email:'',phone:'',website:'https://www.cdl.es/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-casider',name:'CASIDER',city:'Barcelona',materials:['Chapa de acero','Planchas de acero','Aceros especiales'],services:['Distribución','Recipientes a presión','Calderería'],email:'casidersa@casider.com',phone:'935730745',website:'https://www.casider.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-maresminox',name:'MaresminoX',city:'Mataró',materials:['Acero inoxidable'],services:['Distribución','Almacén'],email:'',phone:'',website:'https://www.maresminox.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},
  {id:'sup-grupolapuente',name:'Grupo Lapuente',city:'Barcelona',materials:['Chapa inoxidable','Productos planos'],services:['Stock','Suministro'],email:'contact@grupolapuente.com',phone:'937722334',website:'https://www.grupolapuente.com/productos-planos/chapa/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-01'},

  {id:'sup-montal',name:'Montal i Fills',city:'Catalunya',materials:['Acero inoxidable','Aluminio'],services:['Almacén','Distribución diaria'],email:'',phone:'',website:'https://www.montalifills.com/es/inicio',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-alacermas',name:'Alacer Mas',city:'Barcelona',materials:['Acero inoxidable','Aluminio','Metales no férricos'],services:['Distribución','Aplanado','Corte de chapa'],email:'',phone:'',website:'https://www.alacermas.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-cimarlaser',name:'Cimar Laser',city:'Terrassa',materials:['Acero','Inoxidable','Aluminio','Galvanizado','Latón'],services:['Corte láser','Plegado','Servicios auxiliares'],email:'info@cimarlaser.com',phone:'937369231',website:'https://cimarlaser.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-dexlaser',name:'Dexlaser',city:'Catalunya',materials:['Metales'],services:['Corte láser','Plegado','Corte de tubo','Tratamientos superficiales'],email:'',phone:'',website:'https://dexlaser.cat/default_es.html',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-metalgama',name:'Metalgama',city:'Sant Feliu de Llobregat',materials:['Metales','Aceros'],services:['Corte láser'],email:'comercial@metalgama.com',phone:'936851406',website:'https://www.metalgama.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-llorcasa',name:'Llorcasa',city:'Mollet del Vallès',materials:['Aceros inoxidables','Aceros especiales'],services:['Almacén','Corte','Distribución'],email:'',phone:'',website:'https://llorcasa.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
  {id:'sup-laserpenta',name:'Laser Penta',city:'Catalunya',materials:['Acero','Inoxidable','Aluminio'],services:['Corte láser','Planchistería industrial'],email:'',phone:'',website:'https://laserpenta.com/',source:'official' as const,sourceLabel:'Web oficial',verifiedAt:'2026-08-02'},
];
