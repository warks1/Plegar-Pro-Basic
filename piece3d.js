/* Plegar Pro Plus v0.8: dimensional 3D strip mesh of the idealized 2D chain.
 * Projection-only geometry. Width is a DEMONSTRATION dimension, not project data.
 * No press brake, tool solids, material physics or verified collisions.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarPiece3D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rad=d=>d*Math.PI/180;
 function build(scene,width=100){
  if(!Number.isFinite(width)||width<=0||width>5000)throw new Error('Ancho ilustrativo inválido (0–5000 mm).');
  const contour=scene.assembly?.contour,t=scene.thickness;
  if(!Array.isArray(contour)||contour.length<2||!Number.isFinite(t)||t<=0)throw new Error('Perfil geométrico 2D requerido.');
  // Track original contour stations, otherwise coincident arc samples at zero
  // progress cause the visual status to shift to the wrong flange.
  const stations=[];
  contour.forEach((v,i)=>{if(!stations.length||Math.hypot(v.x-stations.at(-1).point.x,v.y-stations.at(-1).point.y)>1e-7)stations.push({point:v,index:i});});
  const points=stations.map(s=>s.point);
  const left=scene.assembly.left.items.slice().reverse().map(s=>s.status==='realizado'?'completed':'pending');
  const right=scene.assembly.right.items.map(s=>s.status==='realizado'?'completed':'pending');
  const activeEdges=contour.length-1-left.length-right.length;
  if(activeEdges<1)throw new Error('Secuencia de perfil inconsistente.');
  const rawStatuses=[...left,...Array(activeEdges).fill('active'),...right];
  const segmentStatuses=stations.slice(1).map((st,i)=>{
   const slice=rawStatuses.slice(stations[i].index,st.index);
   return slice.includes('active')?'active':slice.at(-1)||'pending';
  });
  if(points.length<2)throw new Error('Perfil degenerado.');
  const vertices=[];
  for(let i=0;i<points.length;i++){
   const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
   let dx=after.x-before.x,dy=after.y-before.y,L=Math.hypot(dx,dy);
   if(L<1e-9){dx=1;dy=0;L=1;}
   const nx=-dy/L*t/2,ny=dx/L*t/2,p=points[i];
   vertices.push({x:p.x+nx,y:p.y+ny,z:0},{x:p.x-nx,y:p.y-ny,z:0},{x:p.x+nx,y:p.y+ny,z:width},{x:p.x-nx,y:p.y-ny,z:width});
  }
  const faces=[];
  for(let i=0;i<points.length-1;i++){
   const a=i*4,b=a+4,status=segmentStatuses[i];
   faces.push({ids:[a,b,b+2,a+2],kind:'upper',status}, {ids:[a+1,a+3,b+3,b+1],kind:'lower',status},
              {ids:[a,a+1,b+1,b],kind:'edge',status}, {ids:[a+2,b+2,b+3,a+3],kind:'edge',status});
  }
  faces.push({ids:[0,2,3,1],kind:'edge'},{ids:[vertices.length-4,vertices.length-3,vertices.length-1,vertices.length-2],kind:'edge'});
  return {vertices,faces,segmentStatuses,stations:points.length,width,thickness:t,source:'Hipótesis geométrica con ancho de demostración: no representa el programa CNC.'};
 }
 function project(mesh,yaw=38,elevation=24,zoom=1){
  if(![yaw,elevation,zoom].every(Number.isFinite)||zoom<=0||zoom>3)throw new Error('Vista 3D inválida.');
  const a=rad(yaw),e=rad(elevation),ca=Math.cos(a),sa=Math.sin(a),ce=Math.cos(e),se=Math.sin(e);
  const raw=mesh.vertices.map(p=>{const xx=p.x*ca+p.z*sa,deep=-p.x*sa+p.z*ca;return {x:xx,y:p.y*ce-deep*se,depth:deep*ce+p.y*se};});
  const minX=Math.min(...raw.map(p=>p.x)),maxX=Math.max(...raw.map(p=>p.x));
  const minY=Math.min(...raw.map(p=>p.y)),maxY=Math.max(...raw.map(p=>p.y));
  const fit=Math.min(720/Math.max(1,maxX-minX),360/Math.max(1,maxY-minY),7)*zoom;
  const midX=(minX+maxX)/2,midY=(minY+maxY)/2;
  const vertices=raw.map(p=>({x:450+(p.x-midX)*fit,y:238+(p.y-midY)*fit,depth:p.depth}));
  const faces=mesh.faces.map((f,i)=>({kind:f.kind,status:f.status||null,group:f.group||'sheet',points:f.ids.map(id=>vertices[id]),depth:f.ids.reduce((s,id)=>s+vertices[id].depth,0)/f.ids.length,index:i}));
  faces.sort((a,b)=>b.depth-a.depth);
  return {vertices,faces,fit};
 }
 return {build,project};
});
