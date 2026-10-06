import type {Bend,Project} from '../../types/domain';

export interface SimulationFrame {
  index:number;
  progress:number;
  bend?:Bend;
  ramY:number;
  backgaugeX:number;
  achievedAngle:number;
  completedBendIds:string[];
  status:'idle'|'positioning'|'bending'|'complete';
}

export function createSimulationFrames(project:Project):SimulationFrame[] {
  const frames:SimulationFrame[]=[{index:0,progress:0,ramY:0,backgaugeX:0,achievedAngle:180,completedBendIds:[],status:'idle'}];
  project.bends.slice().sort((a,b)=>a.order-b.order).forEach((bend,bendIndex)=>{
    const base=frames.length;
    const completed=project.bends.filter(x=>x.order<bend.order).map(x=>x.id);
    frames.push({index:base,progress:(bendIndex+.2)/Math.max(1,project.bends.length),bend,ramY:12,backgaugeX:bend.backgaugeX,achievedAngle:180,completedBendIds:completed,status:'positioning'});
    frames.push({index:base+1,progress:(bendIndex+.65)/Math.max(1,project.bends.length),bend,ramY:38,backgaugeX:bend.backgaugeX,achievedAngle:Math.round((180+bend.angle)/2),completedBendIds:completed,status:'bending'});
    frames.push({index:base+2,progress:(bendIndex+1)/Math.max(1,project.bends.length),bend,ramY:52,backgaugeX:bend.backgaugeX,achievedAngle:bend.angle,completedBendIds:[...completed,bend.id],status:bendIndex===project.bends.length-1?'complete':'bending'});
  });
  return frames;
}

export function frameForStep(project:Project,step:number):SimulationFrame {
  const frames=createSimulationFrames(project);
  const normalized=Math.max(0,Math.min(frames.length-1,step));
  return frames[normalized];
}
