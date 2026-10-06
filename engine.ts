import type {Machine,Project,Tool} from '../../types/domain';
export type CollisionSeverity='blocking'|'warning'|'info';
export interface CollisionFinding{id:string;bendId?:string;severity:CollisionSeverity;title:string;detail:string;recommendation:string;}
export function evaluateBendCollisions(project:Project,machine:Machine,punch:Tool,die:Tool):CollisionFinding[]{
 const out:CollisionFinding[]=[]; const stack=punch.height+die.height+project.thickness;
 if(stack>machine.daylightMm) out.push({id:'stack',severity:'blocking',title:'Altura de montaje incompatible',detail:`Montaje ${stack.toFixed(1)} mm > apertura ${machine.daylightMm} mm.`,recommendation:'Seleccione una máquina con mayor apertura o herramientas más bajas.'});
 project.bends.forEach((b,i)=>{
  if(b.length>machine.lengthMm) out.push({id:`length-${b.id}`,bendId:b.id,severity:'blocking',title:`P${b.order}: longitud fuera de máquina`,detail:`El pliegue requiere ${b.length} mm y la máquina admite ${machine.lengthMm} mm.`,recommendation:'Cambie de máquina o divida la operación.'});
  if(b.backgaugeX<Math.max(8,project.thickness*3)) out.push({id:`gauge-${b.id}`,bendId:b.id,severity:'warning',title:`P${b.order}: apoyo de tope reducido`,detail:`Tope X ${b.backgaugeX} mm con espesor ${project.thickness} mm.`,recommendation:'Revise estabilidad y considere apoyo alternativo.'});
  const minV=Math.max(project.thickness*6,4);
  if((die.v??0)<minV) out.push({id:`die-${b.id}`,bendId:b.id,severity:'warning',title:`P${b.order}: apertura V muy cerrada`,detail:`V${die.v??0} frente a recomendación mínima V${minV.toFixed(0)}.`,recommendation:'Compruebe tonelaje, radio y riesgo de marcado.'});
  if(b.angle<35 && punch.angle>=b.angle) out.push({id:`angle-${b.id}`,bendId:b.id,severity:'blocking',title:`P${b.order}: punzón sin holgura angular`,detail:`Punzón ${punch.angle}° para ángulo objetivo ${b.angle}°.`,recommendation:'Use un punzón más agudo.'});
  if(i>0){const prev=project.bends[i-1];const gap=Math.abs(b.position-prev.position);const flange=Math.min(gap,b.position,project.length-b.position);if(flange<stack*.35)out.push({id:`flange-${b.id}`,bendId:b.id,severity:'warning',title:`P${b.order}: posible colisión de ala`,detail:`Ala estimada ${flange.toFixed(1)} mm; montaje ${stack.toFixed(1)} mm.`,recommendation:'Revise la orientación y cambie la secuencia si es necesario.'});}
 });
 if(!project.bends.length)out.push({id:'no-bends',severity:'info',title:'Sin pliegues para analizar',detail:'La pieza todavía no contiene operaciones de plegado.',recommendation:'Añada pliegues en Desarrollo o Programación 2D.'});
 return out;
}
export function collisionSummary(items:CollisionFinding[]){return{blocking:items.filter(x=>x.severity==='blocking').length,warnings:items.filter(x=>x.severity==='warning').length,info:items.filter(x=>x.severity==='info').length,ready:!items.some(x=>x.severity==='blocking')}}
