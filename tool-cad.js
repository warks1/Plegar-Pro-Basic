/* Plegar Pro Plus · v127f · planos CAD reconstruidos de utillaje.
   Perfil de catálogo + cotas con procedencia; nunca CAD oficial ni válido para CNC.
   Genera DXF, SVG y JSON bajo demanda, sin descargar librerías externas. */
(function(root,factory){
 const deps=typeof module==='object'&&module.exports?
  {T:require('./toolprofiles2d.js'),L:require('./tool-library.js')}:
  {T:root.PlegarToolProfiles2D,L:root.PlegarToolLibrary};
 const api=factory(deps);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarToolCAD=api;
})(typeof globalThis!=='undefined'?globalThis:this,function({T,L}){
 'use strict';
 const EPS=1e-7,OK='GEOMETRÍA OK · PENDIENTE DE VERIFICACIÓN',REVIEW='REVISAR GEOMETRÍA · PENDIENTE DE VERIFICACIÓN';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ascii=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'-');
 const fmt=x=>Number(x).toFixed(3).replace(/\.?0+$/,'');
 const addDim=(dims,name,value,origin,note)=>dims.push({name,value:value??null,origin,note:note||null});
 function effectiveHeight(tool){
  if(tool.manufacturer)return tool.height;
  return tool.height&&tool.height>=T.dieDepth(tool)+22?tool.height:Math.max(32,Math.ceil(T.dieDepth(tool)+22));
 }
 function profile(tool){
  if(!tool||!['punch','die'].includes(tool.kind))throw Error('Solo punzones y matrices conocidos.');
  if(tool.kind==='punch')return T.punch({punchCatalogTool:tool.manufacturer?tool:null,
   punchTipY:0,punchHeight:tool.height,punchAngle:tool.angle,punchNose:tool.nose||.6,dieOpening:16});
  return T.die({dieCatalogTool:tool.manufacturer?tool:null,
   dieOpening:tool.opening,dieDepth:T.dieDepth(tool),dieHeight:effectiveHeight(tool)});
 }
 function points(tool){
  // Y CAD hacia arriba, el perfil original usa Y creciente hacia abajo.
  return profile(tool).outline.map(p=>({x:p.x,y:-p.y}));
 }
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 function crosses(a,b,c,d){
  const [x,y,z,w]=[cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)];
  return ((x>EPS&&y<-EPS)||(x<-EPS&&y>EPS))&&((z>EPS&&w<-EPS)||(z<-EPS&&w>EPS));
 }
 function selfIntersections(v){
  const found=[];
  for(let i=0;i<v.length;i++)for(let j=i+1;j<v.length;j++){
   if(j===i+1||(i===0&&j===v.length-1))continue;
   if(crosses(v[i],v[(i+1)%v.length],v[j],v[(j+1)%v.length]))found.push([i,j]);
  }
  return found;
 }
 const area=v=>v.reduce((s,p,i)=>{const q=v[(i+1)%v.length];return s+p.x*q.y-p.y*q.x;},0)/2;
 const bounds=v=>({minX:Math.min(...v.map(p=>p.x)),maxX:Math.max(...v.map(p=>p.x)),
  minY:Math.min(...v.map(p=>p.y)),maxY:Math.max(...v.map(p=>p.y))});
 function dimensions(tool){
  const v=[],cat=!!tool.manufacturer;
  const val=(name,n,fallback,note)=>addDim(v,name,n??fallback,(cat&&n!=null)?'impresa':'supuesto',n==null?note:'');
  if(tool.kind==='punch'){
   val('Altura H',tool.height,195,'altura ilustrativa');val('Ángulo punta °',tool.angle,88);
   val('Radio punta R',tool.nose,.6);val('Ancho cuerpo',tool.bodyWidth,30);
   val('Ancho amarre',tool.mountingWidth,20,'amarre no acotado');
   if(tool.profileFamily==='gooseneck')val('Alcance pata de cabra',tool.reach,30,'alcance sin confirmar');
   addDim(v,'Perfil de transición y garganta',null,'supuesto','reconstrucción geométrica sin plano CAD fabricante');
  }else{
   val('Apertura V',tool.opening,null);val('Ángulo V °',tool.angle,88);
   val('Altura H',tool.height,effectiveHeight(tool),'valor ilustrativo');
   val('Ancho de cuerpo',tool.bodyWidth,null,'puede carecer de cota');
   if(tool.stemWidth)val('Alma',tool.stemWidth,null);
   if(tool.baseWidth)val('Base',tool.baseWidth,null);
   if(tool.keyWidth)val('Espiga ancho',tool.keyWidth,null);
   if(tool.keyHeight)val('Espiga alto',tool.keyHeight,null);
   if(tool.grooves)tool.grooves.forEach((g,i)=>addDim(v,'V secundaria '+(i+1),
    [g.opening,g.angle,g.radius,g.offset].join(' / '),'impresa'));
   addDim(v,'Radios y transiciones sin acotar',null,'supuesto','contorno reconstruido sin garantía de montaje');
  }
  return v;
 }
 function check(tool,v){
  const results=[],add=(id,ok,detail)=>results.push({id,ok:!!ok,detail:String(detail||'')});
  add('vértices-finitos',v.length>=3&&v.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),v.length+' puntos');
  const blanks=v.filter((p,i)=>Math.hypot(p.x-v[(i+1)%v.length].x,p.y-v[(i+1)%v.length].y)<1e-8).length;
  add('sin-aristas-nulas',blanks===0,blanks+' aristas nulas');
  const si=selfIntersections(v);add('sin-autocruces',si.length===0,si.length+' cruces');
  const a=area(v);add('área',Number.isFinite(a)&&Math.abs(a)>1,'área '+fmt(Math.abs(a))+' mm2');
  const b=bounds(v),w=b.maxX-b.minX,h=b.maxY-b.minY,H=tool.kind==='punch'?tool.height:effectiveHeight(tool);
  if(Number.isFinite(H))add('altura',Math.abs(h-H)<Math.max(.02,H*.001),'H dibujo '+fmt(h)+' / catálogo '+fmt(H));
  if(tool.kind==='punch'){
   add('punta',Math.abs(b.minY)<1e-6,'punta CAD y=0');
   if(tool.profileFamily==='gooseneck'&&tool.reach)
    add('alcance',-b.minX+1e-6>=tool.reach,'alcance real '+fmt(-b.minX)+' ≥ '+fmt(tool.reach));
   else if(tool.bodyWidth)add('ancho-cuerpo',w+1e-6>=tool.bodyWidth,'ancho '+fmt(w));
  }else{
   add('cara-superior',Math.abs(b.maxY)<1e-6,'cara superior CAD y=0');
   add('simetría',Math.abs((b.minX+b.maxX)/2)<1e-6,'centro '+fmt((b.minX+b.maxX)/2));
   const depth=T.dieDepth(tool);
   add('cavidad-v',depth<effectiveHeight(tool)-1e-6,'profundidad '+fmt(depth));
  }
  return results;
 }
 function build(tool){
  if(!L.get(tool?.kind,tool?.id))throw Error('Referencia no incluida en catálogo activo.');
  const v=points(tool),checks=check(tool,v),dims=dimensions(tool),b=bounds(v);
  const ok=checks.every(x=>x.ok);
  return {id:tool.id,kind:tool.kind,name:tool.name,code:tool.code??null,
   manufacturer:tool.manufacturer??null,source:tool.source?{title:tool.source.title,url:tool.source.url,type:tool.source.type}:null,
   status:ok?OK:REVIEW,geometryChecksPassed:ok,verified:false,approvedForCNC:false,
   points:v,bounds:b,area:Math.abs(area(v)),checks,dimensions:dims,assumedCount:dims.filter(x=>x.origin==='supuesto').length,
   warning:'Sección reconstruida desde cotas de catálogo; las no acotadas son supuestos. NO ES CAD DE FABRICANTE. NO CNC / NO VALIDA SEGURIDAD NI FABRICACIÓN.'};
 }
 function sheet(r){
  const {points:v,...rest}=r;
  return {...rest,vertices:v.length,units:'mm',generatedBy:'Plegar Pro Plus · tool-cad.js · v127f'};
 }
 function dxf(rec){
  if(!rec?.points?.length)throw Error('No hay contorno');
  const rows=[],p=(a,b)=>{rows.push(String(a),String(b));},b=rec.bounds;
  const w=b.maxX-b.minX,h=b.maxY-b.minY,off=Math.max(7,Math.min(w,h)*.12);
  p(0,'SECTION');p(2,'HEADER');p(9,'$ACADVER');p(1,'AC1015');p(9,'$INSUNITS');p(70,4);p(0,'ENDSEC');
  p(0,'SECTION');p(2,'TABLES');p(0,'TABLE');p(2,'LAYER');p(70,3);
  for(const [name,color] of [['PERFIL',7],['COTAS',3],['TEXTO',2]]){
   p(0,'LAYER');p(2,name);p(70,0);p(62,color);p(6,'CONTINUOUS');
  }
  p(0,'ENDTAB');p(0,'ENDSEC');p(0,'SECTION');p(2,'ENTITIES');
  p(0,'LWPOLYLINE');p(100,'AcDbEntity');p(8,'PERFIL');p(100,'AcDbPolyline');p(90,rec.points.length);p(70,1);
  for(const q of rec.points){p(10,q.x.toFixed(5));p(20,q.y.toFixed(5));}
  const line=(x1,y1,x2,y2)=>{p(0,'LINE');p(8,'COTAS');p(10,x1.toFixed(4));p(20,y1.toFixed(4));p(30,0);p(11,x2.toFixed(4));p(21,y2.toFixed(4));p(31,0);};
  const text=(x,y,z)=>{p(0,'TEXT');p(8,'TEXTO');p(10,x.toFixed(4));p(20,y.toFixed(4));p(30,0);p(40,3);p(1,ascii(z));};
  line(b.minX,b.minY-off,b.maxX,b.minY-off);
  line(b.minX-off,b.minY,b.minX-off,b.maxY);
  text(b.minX,b.maxY+off,rec.name+' | '+rec.status);
  text(b.minX,b.maxY+off+5,'NO CNC - NO CAD DE FABRICANTE - VERIFICAR');
  text((b.minX+b.maxX)/2,b.minY-off-6,'ANCHO '+fmt(w)+' mm');
  text(b.minX-off-12,(b.minY+b.maxY)/2,'H '+fmt(h)+' mm');
  p(0,'ENDSEC');p(0,'EOF');
  return rows.join('\n')+'\n';
 }
 function svg(rec){
  const b=rec.bounds,w=b.maxX-b.minX,h=b.maxY-b.minY;
  const scale=Math.min(330/Math.max(1,w),325/Math.max(1,h));
  const X=x=>40+(x-b.minX)*scale,Y=y=>55+(b.maxY-y)*scale;
  const line=rec.points.map((p,i)=>(i?'L':'M')+X(p.x).toFixed(2)+','+Y(p.y).toFixed(2)).join(' ')+' Z';
  const assumed=rec.dimensions.filter(v=>v.origin==='supuesto');
  const box=rec.dimensions.slice(0,14).map((d,i)=>
   '<text x="408" y="'+(100+i*21)+'" font-size="10" fill="'+(d.origin==='supuesto'?'#9b441d':'#253b4b')+'">'+
   esc(d.name+': '+(d.value??'sin cota')+' ['+d.origin+']')+'</text>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="680" height="540" viewBox="0 0 680 540">'+
   '<rect width="680" height="540" fill="#f5f8fa"/><path d="'+line+'" fill="#dee8f0" stroke="#192e3d" stroke-width="1.6" fill-rule="evenodd"/>'+
   '<text x="20" y="28" fill="#152e3d" font-size="16" font-weight="bold">'+esc(rec.name)+'</text>'+
   '<text x="408" y="69" fill="#223b4c" font-size="13">Cotas [impresa / supuesto]</text>'+box+
   '<text x="20" y="460" font-size="15" fill="#245679">H '+fmt(h)+' mm · Ancho '+fmt(w)+' mm</text>'+
   '<text x="20" y="488" font-size="13" fill="'+(rec.geometryChecksPassed?'#246d37':'#a12626')+'">'+esc(rec.status)+'</text>'+
   '<text x="20" y="511" font-size="13" fill="#b02a2a">NO CNC · NO ES PLANO DE FABRICANTE · VERIFICAR</text>'+
   '<text x="20" y="530" font-size="10" fill="#243a4e">Cotas supuestas: '+assumed.length+' · '+esc(rec.code||rec.id)+'</text></svg>';
 }
 function all(){return [...L.PUNCHES,...L.DIES].map(build);}
 function indexCsv(records){
  const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  return ['id,tipo,código,fabricante,estado,comprobaciones_ok,cotas_impresas,cotas_supuestas,ancho_mm,alto_mm,fuente',
   ...records.map(r=>[r.id,r.kind,r.code,r.manufacturer,r.status,
    r.checks.filter(v=>v.ok).length,r.dimensions.length-r.assumedCount,r.assumedCount,
    fmt(r.bounds.maxX-r.bounds.minX),fmt(r.bounds.maxY-r.bounds.minY),r.source?.url||''].map(q).join(','))].join('\n')+'\n';
 }
 return {STATUS_OK:OK,STATUS_REVIEW:REVIEW,profile,points,build,check,dimensions,dxf,svg,sheet,all,indexCsv,selfIntersections};
});