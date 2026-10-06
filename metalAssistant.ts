import type {Project} from '../../types/domain';
import {machines,tools} from '../../data/catalog';
import {calculateProject} from '../bending/calculations';

export interface MetalAssistantAnswer {title:string;summary:string;checks:string[];assumptions:string[];confidence:'alta'|'media'|'baja';}

const includesAny=(q:string,words:string[])=>words.some(w=>q.includes(w));

export function answerMetalQuestion(question:string,project:Project,machineId:string,punchId:string,dieId:string):MetalAssistantAnswer{
  const q=question.toLowerCase();
  const machine=machines.find(x=>x.id===machineId);
  const punch=tools.find(x=>x.id===punchId&&x.kind==='punch');
  const die=tools.find(x=>x.id===dieId&&x.kind==='die');
  const geometry=calculateProject(project);
  const base=[`Proyecto: ${project.name}`,`Material: ${project.material} · ${project.thickness} mm`,`Máquina: ${machine?.manufacturer??'sin seleccionar'} ${machine?.name??''}`,`Utillaje: ${punch?.name??'sin punzón'} / ${die?.name??'sin matriz'}`];

  if(includesAny(q,['matriz','apertura v','qué v','comparador v'])){
    const suggested=Math.max(6,Math.round(project.thickness*8));
    return {title:'Selección orientativa de matriz V',summary:`Como punto de partida para ${project.thickness} mm, compara una V cercana a ${suggested} mm con las matrices disponibles. La elección definitiva depende del material, radio buscado, ala mínima, tonelaje y acabado superficial.`,checks:[...base,`V activa: ${die?.v??'no definida'} mm`,`Radio activo: ${die?.radius??'no definido'} mm`,'Validar marcas, radio resultante y ala mínima antes de fabricar.'],assumptions:['Plegado al aire','Resistencia del material no confirmada por certificado','Regla V≈8×espesor usada solo como preselección'],confidence:'media'};
  }
  if(includesAny(q,['tonelaje','fuerza','toneladas'])){
    const lengthM=Math.max(...project.bends.map(b=>b.length),project.width)/1000;
    const v=die?.v||project.thickness*8;
    const estimate=Math.round((1.42*450*project.thickness*project.thickness*lengthM)/Math.max(v,1)/9.81);
    return {title:'Estimación orientativa de tonelaje',summary:`La estimación inicial es de aproximadamente ${estimate} t para la longitud máxima considerada. No sustituye la tabla del fabricante ni el cálculo con la resistencia real del lote.`,checks:[...base,`Longitud considerada: ${(lengthM*1000).toFixed(0)} mm`,`Apertura V: ${v} mm`,`Capacidad de máquina: ${machine?.forceT??'desconocida'} t`],assumptions:['Resistencia aproximada 450 N/mm²','Plegado al aire','Carga repartida uniformemente'],confidence:'media'};
  }
  if(includesAny(q,['secuencia','colisión','orden de plegado'])){
    return {title:'Revisión de secuencia',summary:`La pieza tiene ${project.bends.length} plegados. Conviene priorizar pliegues interiores y operaciones que puedan quedar encerradas, comprobando después la accesibilidad del tope y del punzón.`,checks:[...base,...project.bends.sort((a,b)=>a.order-b.order).map(b=>`P${b.order}: ${b.angle}° · X ${b.backgaugeX} · ${b.side}`)],assumptions:['No hay mallas CAD oficiales cargadas','La detección actual es preventiva por reglas','Faltan dimensiones completas de alas en algunos casos'],confidence:'baja'};
  }
  if(includesAny(q,['desarrollo','bend allowance','deducción','factor k'])){
    return {title:'Cálculo de desarrollo',summary:`El motor interno estima una longitud plana de ${geometry.estimatedFlatLength.toFixed(2)} mm, BA total ${geometry.totalBendAllowance.toFixed(2)} mm y BD total ${geometry.totalBendDeduction.toFixed(2)} mm.`,checks:[...base,`Factor K usado por pliegue: valores del proyecto/material`,`Peso aproximado: ${geometry.weightKg.toFixed(2)} kg`],assumptions:['Geometría simplificada de chapa rectangular','Sin compensación experimental de máquina','Confirmar tabla de plegado del taller'],confidence:'media'};
  }
  if(includesAny(q,['soldadura','tig','mig','mag','láser'])){
    return {title:'Planificación de soldadura',summary:'Define proceso, tipo de unión, preparación de bordes, longitud, aportación, gas, número de pasadas, orden y control de deformación. La elección TIG/MIG-MAG/láser depende del material, espesor, acabado, productividad y equipo disponible.',checks:[...base,'Revisar compatibilidad metalúrgica','Definir WPS/PQR cuando aplique','Controlar deformación después del plegado'],assumptions:['No se ha aportado norma de soldadura','No se conoce composición exacta del material','La respuesta es de planificación, no un procedimiento homologado'],confidence:'media'};
  }
  if(includesAny(q,['láser','corte'])){
    return {title:'Revisión de corte láser',summary:'Verifica material, espesor, potencia disponible, gas, boquilla, foco, calidad de borde, tolerancia, microjuntas y sentido de fibra. Conserva el plano original y valida el postprocesador de la máquina.',checks:[...base,'Comprobar formato CAD cerrado y sin duplicados','Separar grabado, corte interior y exterior','Aplicar compensación de kerf según máquina'],assumptions:['Sin tabla tecnológica de la máquina','Sin potencia ni gas confirmados','Parámetros finales deben proceder del fabricante o pruebas'],confidence:'media'};
  }
  return {title:'Análisis técnico general',summary:'Puedo analizar plegado, corte láser, soldadura, materiales, utillaje, secuencias, desarrollo y fabricación usando el proyecto activo. Formula la consulta indicando objetivo, material, espesor, longitud y máquina cuando sea posible.',checks:base,assumptions:['La IA local no está conectada todavía a un modelo externo ni a normas licenciadas','Los resultados deben validarse por un técnico'],confidence:'baja'};
}
