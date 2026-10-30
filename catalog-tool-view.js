/* Las fichas usan el mismo contorno en mm que la simulación.
 * La foto del catálogo permite contrastar detalles aún no acotados. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./toolprofiles2d.js'):root.PlegarToolProfiles2D);if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarCatalogToolView=api;})(typeof globalThis!=='undefined'?globalThis:this,function(T){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function section(tool){
  if(tool.kind==='punch')return T.punch({punchCatalogTool:tool,punchTipY:0,punchHeight:tool.height,punchAngle:tool.angle,punchNose:tool.nose,dieOpening:16}).outline;
  if(tool.kind==='die')return T.die({dieCatalogTool:tool,dieOpening:tool.opening,dieDepth:T.dieDepth(tool),dieHeight:tool.height}).outline;
  return null;
 }
 const path=ps=>ps.map((p,i)=>(i?'L':'M')+p.x.toFixed(3)+' '+p.y.toFixed(3)).join(' ')+' Z';
 function svg(tool,view='2d'){
  const points=section(tool);if(!points)return '';
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const scale=Math.min(130/Math.max(1,maxX-minX),115/Math.max(1,maxY-minY));
  const ps=points.map(p=>({x:90+(p.x-(minX+maxX)/2)*scale,y:25+(p.y-minY)*scale}));
  const front=path(ps),dx=view==='3d'?26:0,dy=view==='3d'?-12:0;
  let shape='';
  if(view==='3d'){
   shape+='<path d="'+front+'" transform="translate('+dx+','+dy+')" fill="#537990" stroke="#a7d7ed"/>';
   for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];shape+='<path d="M'+a.x+' '+a.y+'L'+b.x+' '+b.y+'L'+(b.x+dx)+' '+(b.y+dy)+'L'+(a.x+dx)+' '+(a.y+dy)+'Z" fill="#46677d" stroke="#8cb5c9" stroke-width=".4"/>';}
  }
  shape+='<path d="'+front+'" fill="'+(tool.kind==='punch'?'#b2c7d6':'#81aebe')+'" stroke="#e0f3ff" stroke-width="1"/>';
  if(view==='2d'){
   const left=90-(maxX-minX)*scale/2,right=90+(maxX-minX)*scale/2,bottom=25+(maxY-minY)*scale;
   shape+='<g stroke="#6ed5ff" stroke-width=".7" fill="none"><path d="M'+(left-8)+' 25 H'+(left-17)+' V'+bottom+' H'+(left-8)+' M'+left+' '+(bottom+5)+' V'+(bottom+12)+' H'+right+' V'+(bottom+5)+'"/></g>';
   shape+='<text x="90" y="'+(bottom+22)+'" text-anchor="middle" fill="#bfeaff" font-size="9">Envolvente aproximada '+esc((maxX-minX).toFixed(2))+'</text>';
  }
  return '<svg class="catalog-section" viewBox="0 0 240 195" role="img" aria-label="'+esc(tool.code||tool.id)+' '+view.toUpperCase()+' · sección de simulación"><rect width="240" height="195" rx="8" fill="#061a29"/><text x="10" y="14" fill="#92d7ff" font-size="10">'+view.toUpperCase()+' · '+esc(tool.code||tool.id)+'</text>'+shape+'<text x="172" y="72" fill="#d5efff" font-size="10">H '+esc(tool.height??'—')+'</text><text x="172" y="89" fill="#d5efff" font-size="10">'+(tool.kind==='die'?'V '+tool.opening:'R '+tool.nose)+'</text><text x="172" y="106" fill="#d5efff" font-size="10">'+tool.angle+'°</text><text x="172" y="123" fill="#d5efff" font-size="9">'+(tool.kind==='die'?'R hombro '+esc(tool.shoulderRadius??'—'):'B '+esc(tool.bodyWidth??'—'))+'</text><text x="172" y="140" fill="#d5efff" font-size="9">'+(tool.footWidth?'Pie '+esc(tool.footWidth):'')+'</text><text x="10" y="178"  fill="#b3cbdc" font-size="9">Cotas en mm · '+esc(tool.profileFamily==='gooseneck'?'PATA DE CABRA · cuello de cisne':(tool.profileFamily||'paramétrico'))+'</text><text x="10" y="190" fill="#edc991" font-size="8">'+(tool.kind==='die'?(T.shoulders(tool)?'Hombros redondeados · V teórica':'Radios de hombro pendientes de modelar'):'Cuerpo provisional · punta nominal')+'</text></svg>';
 }
 function images(tool){
  // Mostrar la fotografía de catálogo correspondiente al código concreto.
  // Las láminas agrupan referencias: el enlace abre la página completa.
  const pages=rootPages().filter(p=>p.codes.includes(tool.code));
  return pages.map(p=>'<figure class="catalog-reference">'+
   '<a class="catalog-original" href="'+esc(p.src)+'" target="_blank" rel="noopener noreferrer" aria-label="Ver dibujo original del código '+esc(tool.code)+' en '+esc(p.label)+'">'+
   '<img src="'+esc(p.src)+'" loading="lazy" decoding="async" alt="Página original del catálogo MECOS correspondiente a '+esc(tool.code)+'">'+
   '<span>Ver dibujo original · ampliar lámina</span></a>'+
   '<figcaption>Fuente MECOS · '+esc(p.label)+' · referencia '+esc(tool.code)+'</figcaption></figure>').join('');
 }
 function rootPages(){return typeof globalThis!=='undefined'?globalThis.PlegarCatalogPages||[]:[];}
 function cardArt(tool){return section(tool)?'<div class="mfg-dual">'+svg(tool)+svg(tool,'3d')+'</div>'+images(tool):images(tool);}
 function gallery(){return '<details class="catalog-originals" open><summary>Fotografías originales de tus catálogos ('+rootPages().length+' páginas) · abrir / cerrar</summary><div class="catalog-pages">'+rootPages().map(p=>'<a href="'+esc(p.src)+'" target="_blank" rel="noopener"><img src="'+esc(p.src)+'" loading="lazy" alt="'+esc(p.label)+'"><span>'+esc(p.label)+'</span></a>').join('')+'</div></details>';}
 function mount(host){
  const input=host.querySelector('[data-catalog-search]'),count=host.querySelector('[data-catalog-count]'),cards=[...host.querySelectorAll('[data-catalog-tool]')];
  if(!input)return;
  const normalize=s=>s.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const index=cards.map(card=>({card,text:normalize(card.textContent)}));
  const paint=()=>{const tokens=normalize(input.value).trim().split(/\s+/).filter(Boolean);let visible=0;for(const {card,text} of index){card.hidden=!tokens.every(t=>text.includes(t));if(!card.hidden)visible++;}count.textContent=visible+' referencias de '+cards.length;};
  input.addEventListener('input',paint);paint();
 }
 return {section,svg,cardArt,gallery,mount};
});

