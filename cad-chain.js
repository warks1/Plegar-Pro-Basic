/* Plegar Pro Plus v0.21 — conectividad nominal de extremos, sólo inspección.
 * No une geometrías, no cierra perfiles, no infiere sólidos y NO aprueba CNC. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCadChain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function requireValid(test,message){if(!test)throw new Error(message);}
function inspect(document,{joinTolerance=0.05,sameLayer=true,topology=null}={}){
 requireValid(document?.verified===false&&document?.activeInSimulation===false&&Array.isArray(document.contours),'DXF de inspección inválido.');
 requireValid(typeof joinTolerance==='number'&&Number.isFinite(joinTolerance)&&joinTolerance>=0&&joinTolerance<=1,'Tolerancia de extremos inválida (0–1 mm).');
 requireValid(typeof sameLayer==='boolean','Filtro de capas inválido.');
 requireValid(document.contours.length<=100,'Demasiados contornos.');
 const open=document.contours.filter(c=>c.closed!==true), endpoints=[];
 for(const c of open){requireValid(c&&c.verified===false&&c.activeInSimulation===false&&Number.isInteger(c.index)&&Array.isArray(c.points)&&c.points.length>=2,'Entidades DXF no verificadas inválidas.');
  for(const [at,p] of [[0,c.points[0]],[1,c.points[c.points.length-1]]]){
   requireValid(p&&Number.isFinite(p.x)&&Number.isFinite(p.y),'Extremo DXF inválido.');
   endpoints.push({contour:c.index,layer:String(c.layer||'0'),which:at?'fin':'inicio',x:p.x,y:p.y});
  }
 }
 requireValid(endpoints.length<=200,'Demasiados extremos.');
 const parent=endpoints.map((_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const union=(i,j)=>{const a=find(i),b=find(j);if(a!==b)parent[Math.max(a,b)]=Math.min(a,b);};
 const matches=[],nearMisses=[];
 for(let i=0;i<endpoints.length;i++)for(let j=i+1;j<endpoints.length;j++){
  const a=endpoints[i],b=endpoints[j];if(sameLayer&&a.layer!==b.layer)continue;
  const d=Math.hypot(a.x-b.x,a.y-b.y);
  if(d<=joinTolerance){union(i,j);if(a.contour!==b.contour)matches.push({from:i,to:j,gap_mm:d});}
  else if(a.contour!==b.contour&&joinTolerance>0&&d<=joinTolerance*2)nearMisses.push({a:a.contour,b:b.contour,gap_mm:d});
 }
 const buckets=new Map();for(let i=0;i<endpoints.length;i++){const root=find(i);if(!buckets.has(root))buckets.set(root,[]);buckets.get(root).push(i);}
 const nodes=Array.from(buckets.values()).map((ids,index)=>({id:index,degree:ids.length,terminals:ids.map(i=>({contour:endpoints[i].contour,extreme:endpoints[i].which,layer:endpoints[i].layer})),x_mm:ids.reduce((s,i)=>s+endpoints[i].x,0)/ids.length,y_mm:ids.reduce((s,i)=>s+endpoints[i].y,0)/ids.length,span_mm:Math.max(0,...ids.flatMap(i=>ids.map(j=>Math.hypot(endpoints[i].x-endpoints[j].x,endpoints[i].y-endpoints[j].y))))}));
 const nodeOf=new Map();for(const n of nodes)for(const t of n.terminals)nodeOf.set(t.contour+'|'+t.extreme,n.id);
 const edges=open.map(c=>({contour:c.index,layer:String(c.layer||'0'),startNode:nodeOf.get(c.index+'|inicio'),endNode:nodeOf.get(c.index+'|fin')}));
 const adjacency=nodes.map(()=>[]);for(const e of edges){adjacency[e.startNode].push(e);if(e.startNode!==e.endNode)adjacency[e.endNode].push(e);}
 const seen=new Set(),components=[];
 for(const e of edges){if(seen.has(e.contour))continue;let frontier=[e.startNode,e.endNode],nodeIds=new Set(),componentEdges=[];
  while(frontier.length){const id=frontier.pop();if(nodeIds.has(id))continue;nodeIds.add(id);for(const edge of adjacency[id]){if(!seen.has(edge.contour)){seen.add(edge.contour);componentEdges.push(edge.contour);}frontier.push(edge.startNode,edge.endNode);}}
  const selected=[...nodeIds].map(id=>nodes[id]),loose=selected.filter(x=>x.degree===1).length,branches=selected.filter(x=>x.degree>2),transitive=selected.filter(x=>x.span_mm>joinTolerance+1e-9);
  const kind=branches.length?'bifurcación ambigua':transitive.length?'grupo de extremos ambiguo':loose===2?'cadena nominal abierta':loose===0?'ciclo nominal NO validado':'conectividad irregular';
  components.push({contours:componentEdges.sort((a,b)=>a-b),type:kind,looseEnds:loose,branchNodes:branches.map(x=>x.id),transitiveNodes:transitive.map(x=>x.id)});
 }
 const t=topology?.summary||null;
 const issues=[...components.filter(c=>c.type!=='ciclo nominal NO validado').map(c=>c.type)];
 if(t?.uncertain)issues.push('relaciones cruzadas o tangentes sin resolver');
 if(t?.open)issues.push('contornos abiertos en el DXF original');
 if(document.contours.some(c=>c.closed===true) && t?.nested)issues.push('contornos anidados: posible hueco NO confirmado');
 const readiness={status:'NO HABILITADO',technicalPrerequisites:['Validar cadenas, huecos y espesor de sólido', 'Verificar cotas y perfil CAD del fabricante', 'Validar amarre mecánico, máquina y colisiones barridas'],openIssues:issues,canGenerateSolid:false,canUseSimulation:false,canUseCNC:false};
 return {version:'0.21',type:'GRAFO DE EXTREMOS PARA INSPECCIÓN',verified:false,approvedForSimulation:false,approvedForCNC:false,geometryModified:false,joinTolerance_mm:joinTolerance,sameLayer,
  summary:{openEntities:open.length,endpoints:endpoints.length,candidatePairs:matches.filter(m=>endpoints[m.from].contour!==endpoints[m.to].contour).length,nodes:nodes.length,components:components.length,branches:nodes.filter(n=>n.degree>2).length,transitiveGroups:nodes.filter(n=>n.span_mm>joinTolerance+1e-9).length,nominalCycles:components.filter(c=>c.type==='ciclo nominal NO validado').length},
  components,nodes:nodes.slice(0,200),nearMisses:nearMisses.slice(0,50),readiness,warnings:['La agrupación es por proximidad: no ensambla segmentos ni demuestra cierre geométrico.','Un ciclo nominal puede contener huecos, solapes o cruces. No representa un sólido.','SIN VERIFICAR / NO CNC; no existe vínculo con el motor 3D industrial.']};
}
return {inspect};
});
