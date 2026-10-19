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
 return {pointSegment,segmentPolygon,polylinePolygon,inPolygon};
});
