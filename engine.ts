import type {Project} from '../../types/domain';
export function evaluateQualityGate(e:any){const p:Project=e.project;const checks=[
{id:'geometry',label:'Geometría definida',ok:p.bends.length>0&&p.width>0&&p.length>0&&p.thickness>0,detail:`${p.bends.length} plegados · ${p.width} × ${p.length} × ${p.thickness} mm`,severity:'critical'},
{id:'tooling',label:'Máquina y utillaje seleccionados',ok:!!(e.selectedMachineId&&e.selectedPunchId&&e.selectedDieId),detail:`${e.selectedMachineId} · ${e.selectedPunchId} · ${e.selectedDieId}`,severity:'critical'},
{id:'drawing',label:'Plano aprobado',ok:e.documents.some((x:any)=>x.projectId===p.id&&x.category==='drawing'&&x.status==='approved'),detail:'Comprobación documental',severity:'critical'},
{id:'revision',label:'Revisión aprobada',ok:e.revisions.some((x:any)=>x.projectId===p.id&&x.approved),detail:'Línea base técnica',severity:'major'},
{id:'route',label:'Ruta validada',ok:e.routes.some((x:any)=>x.projectId===p.id&&x.status!=='draft'),detail:'Ruta de fabricación',severity:'major'},
{id:'order',label:'Orden de fabricación',ok:e.orders.some((x:any)=>x.projectId===p.id),detail:'Orden asociada',severity:'major'},
{id:'quality',label:'Plan de calidad',ok:e.quality.some((x:any)=>x.projectId===p.id),detail:'Control dimensional',severity:'major'},
{id:'release',label:'Liberación registrada',ok:e.releases.some((x:any)=>x.projectId===p.id&&x.status==='released'),detail:'Liberación',severity:'major'},
];const blocking=checks.filter(x=>!x.ok&&x.severity==='critical').length;const score=Math.round(checks.reduce((s,x)=>s+(x.ok?(x.severity==='critical'?3:2):0),0)/checks.reduce((s,x)=>s+(x.severity==='critical'?3:2),0)*100);return{checks,score,blocking,openIssues:0,readyForRc:blocking===0&&checks.every(x=>x.ok)}}
