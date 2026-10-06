import type {LucideIcon} from 'lucide-react';
export function StatCard({title,value,subtitle,icon:Icon,tone='cyan'}:{title:string;value:string|number;subtitle:string;icon:LucideIcon;tone?:string}){return <article className={`stat ${tone}`}><div><span>{title}</span><strong>{value}</strong><small>{subtitle}</small></div><Icon/></article>}
