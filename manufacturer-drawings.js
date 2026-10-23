/* Esquemas técnicos de utillaje 2D y sólidos esquemáticos 3D a partir de cotas
 * publicadas. NO equivale a contorno CAD de fábrica ni sirve para colisiones.
 * La ausencia de geometría no se convierte en una dimensión imaginaria.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarManufacturerDrawings=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>Number(x).toLocaleString('es-ES',{maximumFractionDigits:2});
 const finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
 const round=n=>Math.round(n*100)/100;
 // Coordenadas de PANTALLA. Los perfiles son paramétricos didácticos.
 function outline(entry){
  if(!entry||!['punch','die'].includes(entry.kind))throw Error('Tipo de herramienta no admitido.');
  const known=finite(entry.angle);
  const angle=known?entry.angle:(entry.kind==='punch'?88:88);
  const height=finite(entry.height)?entry.height:null;
  const acute=angle<=45;
  const gooseneck=/cisne|gooseneck|846/i.test(entry.name);
  const flatten=/hemming|aplastado/i.test(entry.name);
  const yTop=30,yBase=119;
  if(entry.kind==='punch'){
   const topWidth=33,shoulder=acute?15:20;
   const flank=acute?9:16;
   if(flatten)return {family:'aplastado',measured:false,points:[[86,yTop],[154,yTop],[154,97],[143,97],[143,112],[97,112],[97,97],[86,97]]};
   if(gooseneck){
    // Apertura del cuello ESQUEMÁTICA, sin alcance/retranqueo validado.
    return {family:'cuello-cisne',measured:false,points:[[89,yTop],[151,yTop],[151,53],[143,53],[143,67],[151,79],[142,89],[133,89],[123,yBase],[114,100],[103,92],[113,80],[120,70],[103,70],[103,55],[89,55]]};
   }
   const inset=Math.max(3,Math.min(18,round((90-angle)/3.6+8)));
   return {family:acute?'agudo':'recto',measured:known,points:[[87,yTop],[153,yTop],[153,49],[140,49],[140,70],[120+flank,77],[120+inset,yBase-10],[120,yBase],[120-inset,yBase-10],[120-flank,77],[100,70],[100,49],[87,49]]};
  }
  const open=finite(entry.opening)?entry.opening:null;
  const vHalf=open===null?26:Math.max(8,Math.min(52,round(open*1.4)));
  const vDepth=round(Math.min(42,Math.max(12,vHalf/Math.tan(angle*Math.PI/360))));
  const bottom=148,top=64,centre=120;
  const tShape=/\bT\b|T 1V/i.test(entry.name);
  if(tShape)return {family:'matriz-T',measured:open!==null&&known,points:[[79,top],[centre-vHalf,top],[centre,top+vDepth],[centre+vHalf,top],[161,top],[161,92],[147,92],[147,bottom],[93,bottom],[93,92],[79,92]]};
  return {family:'matriz-1V',measured:open!==null&&known,points:[[65,top],[centre-vHalf,top],[centre,top+vDepth],[centre+vHalf,top],[175,top],[175,bottom],[65,bottom]]};
 }
 function shape(points){return points.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')+' Z';}
 function outlineSVG(entry,view='2d'){
  if(!['2d','3d'].includes(view))throw Error('Vista inválida.');
  const profile=outline(entry),points=profile.points,front=shape(points),col=entry.kind==='punch';
  const grad='pp-mfg-'+entry.id+'-'+view,outlineColor=col?'#b7e6ff':'#d8a3a0';
  const fill=col?['#f3f8fc','#748da3','#283e54']:['#c97b75','#7b464b','#3a2536'];
  const defs='<defs><linearGradient id="'+esc(grad)+'" x1="0" y1="0" x2="1" y2="1">'+
   '<stop stop-color="'+fill[0]+'"/><stop offset=".48" stop-color="'+fill[1]+'"/><stop offset="1" stop-color="'+fill[2]+'"/></linearGradient>'+
   '<marker id="'+esc(grad)+'-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'+
   '<path d="M0 0L10 5L0 10" fill="#69ccff"/></marker></defs>';
  const frontPath='<path data-profile="'+profile.family+'" d="'+front+'" fill="url(#'+esc(grad)+')" stroke="'+outlineColor+'" stroke-width="1.5" stroke-linejoin="round"/>';
  const vector=view==='3d'?(()=>{
   const lateral=points.map((a,i)=>{
    const b=points[(i+1)%points.length];
    if(i%2===1)return '';
    return '<path d="M'+a[0]+' '+a[1]+'L'+b[0]+' '+b[1]+'L'+(b[0]+18)+' '+(b[1]-13)+'L'+(a[0]+18)+' '+(a[1]-13)+'Z" fill="'+(col?'#4e6d86':'#714547')+'" stroke="#b1c6d7" stroke-width=".4"/>';
   }).join('');
   return '<path d="'+front+'" transform="translate(18,-13)" fill="#233948" stroke="#9cbacc" stroke-width=".8"/>'+lateral+frontPath;
  })():frontPath;
  const dim=(x1,y1,x2,y2,label,textX,textY)=>'<g stroke="#69ccff" stroke-width="1" fill="none">'+
   '<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" marker-start="url(#'+esc(grad)+'-ar)" marker-end="url(#'+esc(grad)+'-ar)"/></g>'+
   '<text x="'+textX+'" y="'+textY+'" fill="#dff5ff" text-anchor="middle" font-size="10">'+esc(label)+'</text>';
  let measures='';
  if(finite(entry.height))measures+=dim(192,entry.kind==='punch'?30:64,192,entry.kind==='punch'?119:148,'H '+fmt(entry.height)+' mm',208,94);
  if(entry.kind==='die'&&finite(entry.opening))measures+=dim(120-Math.min(52,entry.opening*1.4),55,120+Math.min(52,entry.opening*1.4),55,'V '+fmt(entry.opening)+' mm',120,49);
  if(entry.kind==='punch'&&finite(entry.nose))measures+='<text x="120" y="141" fill="#b4e6ff" font-size="10" text-anchor="middle">R'+fmt(entry.nose)+' mm</text>';
  if(entry.kind==='punch'&&finite(entry.radius))measures+='<text x="120" y="141" fill="#b4e6ff" font-size="10" text-anchor="middle">R'+fmt(entry.radius)+' mm</text>';
  if(finite(entry.angle))measures+='<text x="25" y="52" fill="#e6f5fc" font-size="10">α '+fmt(entry.angle)+'°</text>';
  const noCAD=!profile.measured||entry.geometryCertified!==true;
  const labels='<text x="12" y="16" fill="#a9dcfa" font-size="10">'+(col?'PUNZÓN':'MATRIZ')+' · '+view.toUpperCase()+'</text>'+
   '<text x="12" y="161" fill="#eaf7ff" font-size="10">'+esc(entry.code)+'</text>'+
   '<text x="229" y="161" text-anchor="end" fill="#ffc18e" font-size="8">'+(noCAD?'NO CAD · ESQUEMA':'CAD')+'</text>';
  return '<svg viewBox="0 0 242 174" class="mfg-art" role="img" aria-label="'+esc(view.toUpperCase()+' esquemático '+entry.brand+' '+entry.code+'; no es un perfil CAD')+'">'+
   defs+'<rect width="242" height="174" rx="7" fill="#071b2b"/>'+
   '<path d="M120 20V146M12 145H230" stroke="#264558" stroke-width=".6" stroke-dasharray="3 3"/>'+
   vector+measures+labels+'</svg>';
 }
 return {outline,outlineSVG};
});
