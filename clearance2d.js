/* Reusable purely geometric segment-to-polygon gap in mm. Zero means overlap.
 * Used only for generic planar envelopes of the prior-flange model. */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarClearance2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const EPS=1e-9;
 const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
 const dot=(a,b)=>a.x*b.x+a.y*b.y;
 const cross=(a,b)=>a.x*b.y-a.y*b.x;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function pointSegment(p,a,b){const v=sub(b,a),d=dot(v,v);if(d<EPS)return distance(p,a);
  const t=Math.max(0,Math.min(1,dot(sub(p,a),v)/d));return distance(p,{x:a.x+t*v.x,y:a.y+t*v.y});}
 function intersects(a,b,c,d){const r=sub(b,a),s=sub(d,c),den=cross(r,s),q=sub(c,a);
  if(Math.abs(den)<EPS){if(Math.abs(cross(q,r))>=EPS)return false;
   return Math.min(a.x,b.x)<=Math.max(c.x,d.x)+EPS&&Math.min(c.x,d.x)<=Math.max(a.x,b.x)+EPS&&
     Math.min(a.y,b.y)<=Math.max(c.y,d.y)+EPS&&Math.min(c.y,d.y)<=Math.max(a.y,b.y)+EPS;}
  const t=cross(q,s)/den,u=cross(q,r)/den;return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS;
 }
 function inPolygon(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if(pointSegment(p,a,b)<EPS)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }return inside;}
 function segmentPolygon(a,b,poly){if(inPolygon(a,poly)||inPolygon(b,poly))return 0;
  let gap=Infinity;for(let i=0;i<poly.length;i++){
   const c=poly[i],d=poly[(i+1)%poly.length];if(intersects(a,b,c,d))return 0;
   gap=Math.min(gap,pointSegment(a,c,d),pointSegment(b,c,d),pointSegment(c,a,b),pointSegment(d,a,b));
  }return gap;
 }
 function polylinePolygon(points,poly){let gap=Infinity;
  for(let i=1;i<points.length;i++)gap=Math.min(gap,segmentPolygon(points[i-1],points[i],poly));return gap;
 }
 // Interior estricto: una arista compartida es apoyo, no penetración.
 function strictInside(p,poly){
  if(!inPolygon(p,poly))return false;
  return poly.every((a,i)=>pointSegment(p,a,poly[(i+1)%poly.length])>EPS);
 }
 function polygonsOverlap(a,b){
  if(a.some(p=>strictInside(p,b))||b.some(p=>strictInside(p,a)))return true;
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
   const p=a[i],r=sub(a[(i+1)%a.length],p),q=b[j],s=sub(b[(j+1)%b.length],q),den=cross(r,s);
   if(Math.abs(den)<=EPS)continue;
   const t=cross(sub(q,p),s)/den,u=cross(sub(q,p),r)/den;
   if(t>EPS&&t<1-EPS&&u>EPS&&u<1-EPS)return true;
  }
  // Colineales superpuestos pueden tener todos sus vértices en el borde.
  for(const [poly,other] of [[a,b],[b,a]])for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length];
   if(strictInside({x:(p.x+q.x)/2,y:(p.y+q.y)/2},other))return true;
  }
  // Caso idéntico/contención con todos los bordes coincidentes (a es convexo).
  const center={x:a.reduce((s,p)=>s+p.x,0)/a.length,y:a.reduce((s,p)=>s+p.y,0)/a.length};
  return strictInside(center,a)&&strictInside(center,b);
 }
 function sheetPolygonOverlaps(line,thickness,polygon,tolerance=.05){
  if(!Array.isArray(line)||line.length<2||!polygon||polygon.length<3)return [];
  if(!Number.isFinite(thickness)||thickness<=0||!Number.isFinite(tolerance)||tolerance<0)throw Error('Espesor o tolerancia incorrectos.');
  const inset=Math.min(tolerance,thickness/4),r=thickness/2-inset,hits=[];
  for(let i=1;i<line.length;i++){
   const a=line[i-1],b=line[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1e-9)continue;
   const ux=dx/len,uy=dy/len,cap=Math.min(inset,len/4),nx=-uy*r,ny=ux*r;
   const p={x:a.x+ux*cap,y:a.y+uy*cap},q={x:b.x-ux*cap,y:b.y-uy*cap};
   const strip=[{x:p.x+nx,y:p.y+ny},{x:q.x+nx,y:q.y+ny},{x:q.x-nx,y:q.y-ny},{x:p.x-nx,y:p.y-ny}];
   if(polygonsOverlap(strip,polygon))hits.push(i-1);
  }
  return hits;
 }
 return {pointSegment,segmentPolygon,polylinePolygon,inPolygon,sheetPolygonOverlaps};
});

