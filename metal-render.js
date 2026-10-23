/* v0.49 · Acabado metal satinado en mallas nominales de chapa.
 * SVG industrial con normales y varias luces de estudio. NO es ray-tracing
 * ni permite inventar taladros, radios o detalles que no existan en el perfil.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarMetalRender=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const point=p=>p.x.toFixed(2)+','+p.y.toFixed(2);
 const rgb=c=>'rgb('+c.map(v=>Math.round(clamp(v,0,255))).join(',')+')';
 const lights=[{x:-.43,y:-.61,z:.66,s:1.15},{x:.65,y:-.22,z:-.72,s:.32}];
 function defs(prefix){
  return '<defs>'+
   '<linearGradient id="'+prefix+'-metal" x1="0%" y1="8%" x2="95%" y2="100%">'+
    '<stop offset="0%" stop-color="#73838f"/><stop offset="11%" stop-color="#d9e0e5"/>'+
    '<stop offset="28%" stop-color="#a0adb7"/><stop offset="48%" stop-color="#f5f8fa"/>'+
    '<stop offset="66%" stop-color="#91a0ad"/><stop offset="85%" stop-color="#c2cdd4"/><stop offset="100%" stop-color="#617380"/></linearGradient>'+
   // Metales técnicos con acabados distintos: no reutilizar el gris de la chapa para todo.
   '<linearGradient id="'+prefix+'-punch" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#a7e6ff"/><stop offset=".27" stop-color="#328dcc"/><stop offset=".61" stop-color="#07558f"/><stop offset="1" stop-color="#04375e"/></linearGradient>'+
   '<linearGradient id="'+prefix+'-die" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#a2b1bc"/><stop offset=".3" stop-color="#576876"/><stop offset=".64" stop-color="#293844"/><stop offset="1" stop-color="#15212a"/></linearGradient>'+
   '<linearGradient id="'+prefix+'-gauge" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#d2f5b3"/><stop offset=".3" stop-color="#58b982"/><stop offset=".66" stop-color="#18765d"/><stop offset="1" stop-color="#0e4f42"/></linearGradient>'+
   '<linearGradient id="'+prefix+'-table" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#a2acb9"/><stop offset=".5" stop-color="#596d80"/><stop offset="1" stop-color="#344657"/></linearGradient>'+
   '<linearGradient id="'+prefix+'-ram" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#c7daed"/><stop offset=".45" stop-color="#687f9e"/><stop offset="1" stop-color="#3d506e"/></linearGradient>'+
   '<linearGradient id="'+prefix+'-edge" x1="0%" x2="100%" y1="0%" y2="0%">'+
    '<stop stop-color="#53616b"/><stop offset=".48" stop-color="#f1f6fa"/><stop offset="1" stop-color="#6b7883"/></linearGradient>'+
   '<radialGradient id="'+prefix+'-back" cx="45%" cy="36%" r="75%"><stop stop-color="#284153"/><stop offset=".68" stop-color="#0a1926"/><stop offset="1" stop-color="#06111a"/></radialGradient>'+
   '<radialGradient id="'+prefix+'-shadow"><stop stop-color="#000" stop-opacity=".57"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>'+
   '<pattern id="'+prefix+'-brush" width="6" height="6" patternUnits="userSpaceOnUse">'+
    '<path d="M0 1H6M0 4H6" stroke="#fff" stroke-opacity=".07" stroke-width=".35"/></pattern>'+
   '</defs>';
 }
 function background(prefix){
  return '<rect width="900" height="480" fill="url(#'+prefix+'-back)"/>'+
   '<ellipse cx="455" cy="385" rx="290" ry="57" fill="url(#'+prefix+'-shadow)"/>';
 }
 function normal(mesh,face){
  const p=face.ids.slice(0,3).map(i=>mesh.vertices[i]);if(p.length!==3||p.some(v=>!v))return {x:0,y:0,z:1};
  const a={x:p[1].x-p[0].x,y:p[1].y-p[0].y,z:p[1].z-p[0].z};
  const b={x:p[2].x-p[0].x,y:p[2].y-p[0].y,z:p[2].z-p[0].z};
  const n={x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};
  const length=Math.hypot(n.x,n.y,n.z)||1;
  return {x:n.x/length,y:n.y/length,z:n.z/length};
 }
 function polygon(mesh,f,prefix,{material='',highlightPrior=false}={}){
  const group=f.group||'sheet',face=mesh.faces[f.index],n=normal(mesh,face);
  const main=lights.reduce((acc,l)=>acc+Math.max(0,n.x*l.x+n.y*l.y+n.z*l.z)*l.s,0);
  const brightness=clamp(.43+main*.38,.34,1.22);
  let tint=group==='sheet'?[192,201,209]:group==='punch'?[35,133,199]:
   group==='die'?[53,68,81]:group==='ram'?[108,131,166]:
   group==='table'?[86,104,120]:[48,163,112];
  if(group==='sheet'&&/aluminio/i.test(material))tint=[207,216,222];
  if(group==='sheet'&&/inox/i.test(material))tint=[203,207,212];
  const shaded=rgb(tint.map(v=>v*brightness));
  const kind=f.kind,status=f.status||'';
  const thin=group==='sheet'&&kind==='edge';
  const edge={sheet:'#f0f6fa',punch:'#8cdbff',die:'#9aabba',gauge:'#a0e9ad',ram:'#bfd2e8',table:'#a2b5c7'}[group]||'#8393a0';
  const points=f.points.map(point).join(' ');
  const attr=' data-group="'+group+'" data-status="'+status+'" points="'+points+'"';
  const base=thin?'url(#'+prefix+'-edge)':group==='sheet'?'url(#'+prefix+'-metal)':'url(#'+prefix+'-'+group+')';
  const selected=highlightPrior&&status==='completed';
  return '<polygon'+attr+' fill="'+base+'" stroke="'+edge+'" stroke-width="'+(thin?'1.2':'.8')+'" stroke-opacity=".8" stroke-linejoin="round"/>'+
   '<polygon points="'+points+'" fill="'+(selected?'#c88c54':shaded)+'" fill-opacity="'+(selected?'.34':group==='sheet'?'.22':'.16')+'"/>'+
   (group==='sheet'&&!thin?'<polygon points="'+points+'" fill="url(#'+prefix+'-brush)" stroke="#fff" stroke-opacity=".20" stroke-width=".55"/>':'');
 }
 function polys(mesh,projection,prefix,options={}){
  if(!mesh?.faces||!projection?.faces)throw Error('Malla y cámara nominales requeridas.');
  return projection.faces.map(f=>polygon(mesh,f,prefix,options)).join('');
 }
 return {defs,background,normal,polygon,polys};
});