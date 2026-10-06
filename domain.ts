export type BendDirection='positive'|'negative';
export type BendSide='interior'|'exterior';
export type FixedFace='left'|'right';
export type SimulationSpeed='slow'|'normal'|'fast';
export type CameraView='isometric'|'front'|'side'|'top';

export interface Bend {id:string;position:number;length:number;angle:number;radius:number;direction:BendDirection;side:BendSide;fixedFace:FixedFace;punchId:string;dieId:string;backgaugeX:number;correction:number;order:number;}
export interface Project {id:string;name:string;customer:string;customerContact?:string;customerEmail?:string;customerPhone?:string;customerReference?:string;description?:string;quantity?:number;deliveryDate?:string;priority?:'normal'|'high'|'urgent';drawingReference?:string;revision?:string;finish?:string;tolerances?:string;notes?:string;material:string;thickness:number;width:number;length:number;bends:Bend[];updatedAt:string;}
export interface Tool {id:string;kind:'punch'|'die';manufacturer:string;family:string;name:string;angle:number;radius:number;height:number;width:number;v?:number;loadKnM?:number;clamp:'European'|'American'|'Trumpf'|'Wila'|'Custom';lengths:number[];source:'official'|'reconstructed'|'workshop';verified:boolean;}
export interface Machine {id:string;manufacturer:string;name:string;forceT:number;year?:number;lengthMm:number;strokeMm:number;daylightMm:number;throatMm:number;axes:string[];clamp:string;source:'official'|'reconstructed'|'workshop';verified:boolean;}
export interface ManufacturingOrder {id:string;reference:string;projectId:string;customer?:string;quantity:number;priority:'normal'|'high'|'urgent';status:'draft'|'released'|'in-production'|'completed';steps:string[];dueDate?:string;owner?:string;drawing?:string;notes?:string;updatedAt:string;}
export interface ValidationItem {id:string;label:string;ok:boolean;detail:string;}
export interface Customer {id:string;name:string;contact:string;email:string;phone:string;notes:string;}
export interface Supplier {id:string;name:string;city:string;materials:string[];services:string[];email:string;phone:string;website:string;source:'official'|'workshop'|'pending';sourceLabel?:string;verifiedAt?:string;notes?:string;}
export interface CalendarEvent {id:string;title:string;date:string;type:'delivery'|'production'|'maintenance'|'customer'|'quality';projectId?:string;notes:string;}
export interface ProductionRecord {id:string;orderId:string;machineId:string;operator:string;quantity:number;status:'queued'|'running'|'paused'|'completed';startedAt?:string;updatedAt:string;}
export interface QualityInspection {id:string;projectId:string;result:'pending'|'approved'|'rejected';dimension:string;nominal:number;measured:number;tolerance:number;notes:string;updatedAt:string;}
export interface MaintenanceTask {id:string;machineId:string;title:string;dueDate:string;status:'planned'|'in-progress'|'completed';notes:string;}
export interface MaterialRecord {id:string;name:string;family:string;standard:string;density:number;kFactor:number;minRadius:number;springback:number;verified:boolean;}
export interface RequirementItem {id:string;module:string;label:string;status:'implemented'|'partial'|'pending';detail:string;}

export interface WeldingOperation {id:string;projectId:string;process:'TIG'|'MIG'|'MAG'|'Láser'|'Puntos';joint:string;length:number;passes:number;gas:string;notes:string;status:'planned'|'ready'|'completed';updatedAt:string;}
export interface ImportedDocument {id:string;name:string;format:string;size:number;units:string;scale:number;mode:'editable'|'conversion'|'reference';status:'analyzed'|'converted'|'confirmed';detectedBends:number;confidence:number;createdAt:string;}

export interface StockItem {id:string;kind:'sheet'|'remnant'|'consumable';name:string;material:string;thickness:number;width:number;length:number;quantity:number;location:string;reserved:number;updatedAt:string;}
export interface Quote {id:string;reference:string;projectId:string;customerId:string;quantity:number;materialCost:number;cuttingCost:number;bendingCost:number;weldingCost:number;finishingCost:number;transportCost:number;margin:number;status:'draft'|'sent'|'accepted'|'rejected';updatedAt:string;}
export interface RouteStep {id:string;name:string;machineId?:string;workCenter?:string;notes:string;order:number;}
export interface ManufacturingRoute {id:string;name:string;projectId:string;steps:RouteStep[];status:'draft'|'validated'|'released';updatedAt:string;}
export interface NotificationItem {id:string;title:string;detail:string;type:'info'|'warning'|'critical'|'success';read:boolean;createdAt:string;route?:string;}
export interface TechnicalMessage {id:string;projectId?:string;channel:'Oficina técnica'|'Plegado'|'Producción'|'Calidad';author:string;text:string;priority:'normal'|'high'|'blocking';annotation?:string;createdAt:string;}

export interface ProjectDocument {id:string;projectId:string;name:string;category:'drawing'|'photo'|'certificate'|'manual'|'report'|'other';version:string;status:'draft'|'approved'|'obsolete';notes:string;createdAt:string;}
export interface ProjectRevision {id:string;projectId:string;code:string;reason:string;author:string;createdAt:string;approved:boolean;snapshot:string;}
export interface ReleaseRecord {id:string;projectId:string;status:'blocked'|'ready'|'released';checks:{label:string;ok:boolean;detail:string}[];releasedBy?:string;releasedAt?:string;notes:string;}

export interface QualityIssue {id:string;projectId?:string;module:string;severity:'critical'|'major'|'minor'|'info';title:string;description:string;status:'open'|'in-progress'|'resolved'|'accepted';source:'automatic'|'manual';createdAt:string;resolvedAt?:string;}
