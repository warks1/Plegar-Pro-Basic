import type {Bend,Project} from '../../types/domain';

export interface BendCalculation {
  bendId:string;
  includedAngle:number;
  bendAngleRad:number;
  neutralRadius:number;
  bendAllowance:number;
  outsideSetback:number;
  bendDeduction:number;
  developedLength:number;
  insideRadius:number;
  outsideRadius:number;
}

export interface ProjectCalculation {
  bends:BendCalculation[];
  totalBendAllowance:number;
  totalBendDeduction:number;
  estimatedFlatLength:number;
  weightKg:number;
  areaM2:number;
}

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function calculateBend(bend:Bend, thickness:number, kFactor=.38):BendCalculation {
  const includedAngle=clamp(bend.angle,1,179);
  const bendAngleRad=(180-includedAngle)*Math.PI/180;
  const insideRadius=Math.max(0,bend.radius);
  const neutralRadius=insideRadius+clamp(kFactor,.2,.6)*Math.max(.01,thickness);
  const bendAllowance=bendAngleRad*neutralRadius;
  const outsideSetback=Math.tan(bendAngleRad/2)*(insideRadius+Math.max(.01,thickness));
  const bendDeduction=Math.max(0,2*outsideSetback-bendAllowance);
  const developedLength=Math.max(0,bend.length-bendDeduction);
  return {bendId:bend.id,includedAngle,bendAngleRad,neutralRadius,bendAllowance,outsideSetback,bendDeduction,developedLength,insideRadius,outsideRadius:insideRadius+Math.max(0,thickness)};
}

export function materialDensityKgM3(material:string):number {
  const normalized=material.toLowerCase();
  if(normalized.includes('alumin'))return 2700;
  if(normalized.includes('cobre'))return 8960;
  if(normalized.includes('latón')||normalized.includes('laton'))return 8500;
  if(normalized.includes('inox')||normalized.includes('aisi'))return 7930;
  return 7850;
}

export function calculateProject(project:Project,kFactor=.38):ProjectCalculation {
  const bends=project.bends.map(b=>calculateBend(b,project.thickness,kFactor));
  const totalBendAllowance=bends.reduce((sum,b)=>sum+b.bendAllowance,0);
  const totalBendDeduction=bends.reduce((sum,b)=>sum+b.bendDeduction,0);
  const estimatedFlatLength=Math.max(0,project.length-totalBendDeduction);
  const areaM2=Math.max(0,project.length)*Math.max(0,project.width)/1_000_000;
  const weightKg=areaM2*(Math.max(0,project.thickness)/1000)*materialDensityKgM3(project.material);
  return {bends,totalBendAllowance,totalBendDeduction,estimatedFlatLength,weightKg,areaM2};
}

export function validateBendGeometry(bend:Bend,project:Project):string[] {
  const errors:string[]=[];
  if(!(bend.position>0&&bend.position<project.length))errors.push('La posición debe quedar dentro de la longitud de la chapa.');
  if(!(bend.length>0&&bend.length<=project.width))errors.push('La longitud de plegado supera la anchura disponible.');
  if(!(bend.angle>0&&bend.angle<180))errors.push('El ángulo debe estar entre 1° y 179°.');
  if(bend.radius<0)errors.push('El radio interior no puede ser negativo.');
  if(bend.backgaugeX<0)errors.push('El tope X no puede ser negativo.');
  return errors;
}
