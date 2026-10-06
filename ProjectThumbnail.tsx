import type {Project} from '../types/domain';

export function ProjectThumbnail({project,className=''}:{project:Project;className?:string}){
  const bends=[...project.bends].sort((a,b)=>a.order-b.order);
  const seed=[...project.name].reduce((n,c)=>n+c.charCodeAt(0),0);
  const baseY=70;
  const points:string[]=[[12,baseY].join(',')];
  let x=12,y=baseY,dir=-1;
  const segments=Math.max(2,bends.length+1);
  for(let i=0;i<segments;i++){
    x+=96/segments;
    const bend=bends[i];
    if(bend){
      const rise=Math.min(38,12+Math.abs(180-bend.angle)*.22+(seed%9));
      y=Math.max(18,Math.min(78,y+dir*rise));
      dir*=-1;
    }
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return <svg className={`project-thumbnail ${className}`} viewBox="0 0 120 92" role="img" aria-label={`Vista de ${project.name}`}>
    <defs><linearGradient id={`g-${project.id}`} x1="0" x2="1"><stop stopColor="#d9e3ec"/><stop offset=".48" stopColor="#7f98aa"/><stop offset="1" stopColor="#edf7ff"/></linearGradient></defs>
    <path d="M8 82H112" stroke="#1a4964" strokeWidth="1" opacity=".5"/>
    <polyline points={points.join(' ')} fill="none" stroke={`url(#g-${project.id})`} strokeWidth={Math.max(5,Math.min(10,project.thickness*2.2))} strokeLinejoin="round" strokeLinecap="round"/>
    {bends.map((b,i)=>{const px=12+(i+1)*(96/segments);return <g key={b.id}><circle cx={px} cy={points[i+1].split(',')[1]} r="2.4" fill="#20d5ff"/><text x={px} y="88" textAnchor="middle" fontSize="7" fill="#75dfff">P{i+1}</text></g>})}
  </svg>
}
