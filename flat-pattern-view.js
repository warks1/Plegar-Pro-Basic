/* v0.45 · vista desplegada basada en tramos rectos + arco neutro.
 * La posición de las líneas de pliegue se calcula desde el inicio del desarrollo.
 * Documentación nominal: NO DXF de corte certificado.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarFlatPatternView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=x=>Number(x).toFixed(2);
 function svg(result,{width=1100,height=210}={}){
  if(!result||result.flat===null||!Number.isFinite(result.flat)||result.flat<=0)
   return '<p class="ed-flat-error">Desarrollo no representable: revisar tramos y radio antes de generar el desplegado.</p>';
  const pad=48,usable=width-2*pad,scale=usable/result.flat;
  const x=v=>pad+v*scale;
  const lines=result.flatBends.map((b,i)=>{
   const a=x(b.start),c=x(b.end),mid=x(b.center);
   return '<rect x="'+fmt(a)+'" y="75" width="'+fmt(Math.max(0,c-a))+'" height="55" fill="#e8a444" opacity=".95"/>'+
   '<line x1="'+fmt(mid)+'" x2="'+fmt(mid)+'" y1="60" y2="147" stroke="#5d2a04" stroke-width="1.2" stroke-dasharray="4 3"/>'+
   '<title>B'+b.bend+': '+fmt(b.center)+' mm desde el origen, BA '+fmt(b.allowance)+' mm</title>';
  }).join('');
  const straight=result.flatSegments.map(s=>'<rect x="'+fmt(x(s.start))+'" y="75" width="'+fmt(Math.max(0,(s.end-s.start)*scale))+'" height="55" fill="#2c9cd2"/>').join('');
  const dots=result.flatBends.map((b,i)=>{
   const mid=x(b.center);
   const y=21+(i%3)*15;
   return '<line x1="'+fmt(mid)+'" y1="'+(y+4)+'" x2="'+fmt(mid)+'" y2="62" stroke="#6991ac" stroke-width=".8"/>'+
    '<text x="'+fmt(mid)+'" y="'+y+'" font-size="10" text-anchor="middle" fill="#dceef8">B'+b.bend+'</text>';
  }).join('');
  return '<svg class="ed-flat-svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Desplegado geométrico nominal con zonas de pliegue en naranja y tramos rectos en azul">'+
    '<rect width="'+width+'" height="'+height+'" rx="8" fill="#0d273a"/>'+
    '<g>'+straight+lines+'</g>'+dots+
    '<path d="M'+pad+' 158 V172 H'+fmt(x(result.flat))+' V158" stroke="#8ecde6" fill="none" stroke-width="1"/>'+
    '<text x="'+width/2+'" y="193" text-anchor="middle" fill="#d8f1ff" font-size="13">DESARROLLO NOMINAL '+fmt(result.flat)+' mm · '+esc(result.measurementReference)+'</text>'+
    '<text x="'+pad+'" y="150" fill="#c7edff" font-size="10">0</text>'+
    '<text x="'+fmt(x(result.flat))+'" y="150" text-anchor="end" fill="#c7edff" font-size="10">'+fmt(result.flat)+' mm</text>'+
    '</svg>';
 }
 function html(result){
  const picture=svg(result);
  const rows=result.flatBends?.map(b=>
   '<tr><td>B'+b.bend+'</td><td>'+fmt(b.start)+'</td><td>'+fmt(b.center)+'</td><td>'+fmt(b.end)+'</td><td>'+fmt(b.allowance)+'</td></tr>'
  ).join('')||'';
  return '<div class="ed-flat-pattern"><strong>DESARROLLO DESPLEGADO · COORDENADAS EN MM</strong>'+
   '<p>Azul: tramos rectos · Naranja: arco de la fibra neutra · Línea: posición central nominal del pliegue.</p>'+
   picture+(result.flat===null?'':'<div class="ed-flat-table-wrap"><table><thead><tr><th>Pliegue</th><th>Inicio zona</th><th>Centro</th><th>Fin zona</th><th>BA</th></tr></thead><tbody>'+rows+'</tbody></table></div>')+
   '<small>Cotas y posiciones calculadas con la referencia elegida y K supuesto. Esta banda no es un patrón de corte validado ni incorpora alivios, agujeros o tolerancias.</small></div>';
 }
 return {svg,html};
});