import {useState} from 'react';
import {Page} from '../../components/Page';
import {useActiveProject,useAppStore} from '../../store/useAppStore';
import {answerMetalQuestion} from '../../core/ai/metalAssistant';

interface ChatMessage {role:'user'|'assistant';text:string;title?:string;checks?:string[];assumptions?:string[];confidence?:string}
export function AiPage(){
 const p=useActiveProject();
 const {selectedMachineId,selectedPunchId,selectedDieId}=useAppStore();
 const [q,setQ]=useState('');
 const [messages,setMessages]=useState<ChatMessage[]>([]);
 const submit=()=>{const value=q.trim();if(!value)return;const answer=answerMetalQuestion(value,p,selectedMachineId,selectedPunchId,selectedDieId);setMessages(m=>[...m,{role:'user',text:value},{role:'assistant',text:answer.summary,title:answer.title,checks:answer.checks,assumptions:answer.assumptions,confidence:answer.confidence}]);setQ('')};
 return <Page title="IA industrial" subtitle="Asistente contextual para plegado, corte láser, soldadura, materiales y fabricación">
 <div className="ai-context panel"><span>Proyecto <b>{p.name}</b></span><span>{p.material} · {p.thickness} mm</span><span>{p.bends.length} plegados</span><small>Motor local de cálculo y reglas. La conexión a un modelo externo y a documentación licenciada sigue pendiente.</small></div>
 <div className="ai-layout"><section className="panel chat">{messages.length===0&&<div className="ai-empty"><b>Consultas de ejemplo</b><button onClick={()=>setQ('¿Qué matriz V debo usar?')}>¿Qué matriz V debo usar?</button><button onClick={()=>setQ('Calcula el tonelaje orientativo')}>Calcular tonelaje</button><button onClick={()=>setQ('Revisa la secuencia y posibles colisiones')}>Revisar secuencia</button><button onClick={()=>setQ('Calcula el desarrollo y la deducción')}>Calcular desarrollo</button></div>}{messages.map((m,i)=><article className={m.role} key={i}>{m.title&&<strong>{m.title}</strong>}<p>{m.text}</p>{m.checks&&<details open><summary>Comprobaciones</summary>{m.checks.map(x=><small key={x}>{x}</small>)}</details>}{m.assumptions&&<details><summary>Suposiciones · confianza {m.confidence}</summary>{m.assumptions.map(x=><small key={x}>{x}</small>)}</details>}</article>)}</section>
 <form className="panel form" onSubmit={e=>{e.preventDefault();submit()}}><textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Describe el problema, material, espesor, longitud y resultado que buscas…"/><button type="submit">Analizar proyecto</button><p className="form-help">Las recomendaciones son orientativas hasta validar máquina, herramienta, lote de material, manuales y normas aplicables.</p></form></div></Page>
}
