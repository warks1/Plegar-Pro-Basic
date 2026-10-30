/* Pliegue firmado del plano: signo real en pantalla, sin inventar volteo físico.
 * Esta vista no es la escena de prensado; distingue el objetivo de pieza del
 * golpe en V, que requiere reorientación no resuelta para ángulos negativos. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarSignedFoldView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(1,v));
 const fmt=n=>Math.round(n*100)/100;
 function model(profile,step,progress){
  const p=G.validate(profile);
  if(!Number.isInteger(step)||step<0||step>=p.sequence.length||!Number.isFinite(progress)||progress<0||progress>1)
   throw Error('Paso/avance de pliegue firmado inválido');
  const bend=p.sequence[step],done=new Set(p.sequence.slice(0,step));
  const angles=p.angles.map((a,i)=>done.has(i+1)?a:(i+1===bend?a*progress:0));
  const points=G.vertices({...p,angles});
  const before=G.vertices({...p,angles:angles.map((a,i)=>i+1===bend?0:a)});
  const pivot=points[bend],dx=pivot.x,dy=pivot.y;
  const located=points.map(v=>({x:v.x-dx,y:v.y-dy}));
  const earlier=before.map(v=>({x:v.x-before[bend].x,y:v.y-before[bend].y}));
  const target=p.angles[bend-1],signed=target*progress;
  const left=located[bend-1],right=located[bend+1];
  return {bend,step,angle:signed,target,points:located,before:earlier,active:located.slice(bend-1,bend+2),down:target<0,
   pathDirection:target<0?'abajo':'arriba',pivot:{x:0,y:0},endpoints:{left,right},verified:false};
 }
 function svg(profile,step,progress){
  const m=model(profile,step,progress),all=[...m.points,...m.before];
  const minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x));
  const minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
  const width=Math.max(75,maxX-minX),height=Math.max(70,maxY-minY);
  const scale=Math.min(760/width,300/height,5);
  const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  const map=p=>[450+(p.x-cx)*scale,244+(p.y-cy)*scale];
  const path=ps=>ps.map((p,i)=>{const [x,y]=map(p);return(i?'L':'M')+fmt(x)+' '+fmt(y)}).join(' ');
  const [px,py]=map({x:0,y:0}),sign=m.target<0?'−':'+';
  return '<svg class="f2d-svg f2d-signed" data-f2-signed="true" viewBox="0 0 900 480" role="img" aria-label="Pliegue B'+m.bend+' '+sign+Math.abs(m.target)+' grados, giro firmado del plano '+m.pathDirection.toUpperCase()+'">'+
   '<rect width="900" height="480" fill="#061726"/>'+
   '<path d="'+path(m.before)+'" fill="none" stroke="#4d6980" stroke-width="3" stroke-dasharray="7 6"/>'+
   '<path data-component="chapa-firmada" d="'+path(m.points)+'" fill="none" stroke="#62d5f6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'+
   '<path data-component="pliegue-firmado" d="'+path(m.active)+'" fill="none" stroke="'+(m.down?'#ffae67':'#8cf2d1')+'" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'+
   '<circle cx="'+fmt(px)+'" cy="'+fmt(py)+'" r="8" fill="#fff" stroke="#ffc37f" stroke-width="3"/>'+
   '<text x="25" y="38" fill="#d2efff" font-size="21" font-weight="bold">B'+m.bend+' · '+sign+Math.abs(m.target)+'° · '+(m.down?'ABAJO':'ARRIBA')+'</text>'+
   '<text x="25" y="67" fill="#ffda99" font-size="16">Ángulo actual: '+(m.angle<0?'−':'+')+Math.abs(fmt(m.angle))+'° · SECUENCIA DE PLANO</text>'+
   '<text x="25" y="96" fill="#b6ccdb" font-size="13">Línea gris: posición anterior · línea azul: pieza nominal · naranja/verde: pliegue activo</text>'+
   '<text data-component="aviso-volteo" x="25" y="435" fill="#ffd29a" font-size="13">Vista FIRMADA, no montaje físico en la matriz V. El volteo de la chapa NO está calculado.</text>'+
   '<text x="25" y="456" fill="#ffd29a" font-size="13">NO CNC · Colisiones y contacto no certificados</text></svg>';
 }
 return {model,svg};
});