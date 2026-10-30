/* Plegar Pro Plus v0.7: approximate dimensioned 2D envelopes. Not vendor CAD.
 * Units mm, x right, y down. The punch's tip is at tipY.
 * Its circular nose has tangent contact with generic straight 30/88-degree flanks.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarToolProfiles2D=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rad=n=>n*Math.PI/180;
 const pt=(x,y)=>({x,y});
 function catalogPunch(model){
  const p=model.punchCatalogTool,h=p.height||195,body=p.bodyWidth||30,shank=p.mountingWidth||20,top=model.punchTipY-h;
  const neckTop=top+Math.min(40,h*.22),reach=p.reach||0,shoulder=body/2;
  const alpha=rad(p.angle/2),r=p.nose??.6,centerY=model.punchTipY-r;
  const tx=r*Math.cos(alpha),ty=centerY+r*Math.sin(alpha);
  // El radio es tangente a ambos flancos. La punta toca en (0, tipY),
  // no en una cara plana cuyo ancho dependía de la altura del punzón.
  const flankHeight=Math.max(0,Math.min(42,h*.22,(shoulder-tx)/Math.tan(alpha)));
  const taperY=ty-flankHeight,taperHalf=tx+flankHeight*Math.tan(alpha);
  // Un cuello de cisne / pata de cabra necesita una garganta C cóncava.
  // Las cotas del catálogo transcritas fijan H, R, ángulo y alcance; las
  // transiciones no acotadas son reconstrucción visual, NUNCA CAD certificado.
  const goose=p.profileFamily==='gooseneck';
  const outerReach=Math.max(reach,shoulder+8);
  // La sección de cuello de cisne debe tener una garganta C REALMENTE
  // CÓNCAVA: la versión anterior cruzaba la zona del cuerpo con el lateral
  // del punzón, haciendo desaparecer la silueta de pata de cabra.
  // Posiciones de garganta y hombros no acotadas = reconstrucción visual.
  // Altura, radio y ángulo se conservan sin modificación.
  const throatX=-Math.max(4,Math.min(outerReach*.42,outerReach-4));
  const throatLowerY=model.punchTipY-h*.30;
  const throatUpperY=model.punchTipY-h*.48;
  const outerBackY=model.punchTipY-h*.70;
  const backShoulderY=top+h*.25;
  const outline=goose
   ?[pt(-shank/2,top),pt(shank/2,top),pt(shank/2,neckTop),pt(shoulder,neckTop),
     pt(shoulder,top+h*.43),pt(taperHalf,taperY),pt(tx,ty)]
   :[pt(-shank/2,top),pt(shank/2,top),pt(shank/2,neckTop),pt(shoulder,neckTop),
     pt(shoulder,taperY),pt(taperHalf,taperY),pt(tx,ty)];
  const noseSegments=32;
  for(let i=1;i<=noseSegments;i++){
   const a=alpha+(Math.PI-2*alpha)*i/noseSegments;
   outline.push(pt(r*Math.cos(a),centerY+r*Math.sin(a)));
  }
  outline.push(pt(-taperHalf,taperY));
  if(goose){
   outline.push(pt(throatX,throatLowerY),pt(throatX,throatUpperY),
    pt(-outerReach,outerBackY),pt(-outerReach,backShoulderY),pt(-shoulder,neckTop));
  }else outline.push(pt(-shoulder,taperY),pt(-shoulder,neckTop));
  outline.push(pt(-shank/2,neckTop));
  // Unos modelos WILA tienen ancho de espiga = ancho del hombro.
  // Eliminar vértices contiguos coincidentes evita aristas nulas y falsos cruces
  // del polígono al extruir en 3D; nunca alterar la posición de la punta.
  const compact=outline.filter((p,i)=>i===0||Math.hypot(p.x-outline[i-1].x,p.y-outline[i-1].y)>1e-8);
  // El cuerpo y la transición al cuello siguen siendo aproximados cuando
  // el catálogo no proporciona todas sus cotas. No certificar colisiones.
  return {outline:compact,tipY:model.punchTipY,nose:r,angle:p.angle,
   geometry:goose?'pata de cabra / cuello de cisne con garganta C nominal':'punta circular tangente a flancos; cuerpo reconstruido del catálogo',model:'perfil extruido · sin CAD',verified:false,
   source:p.source,dimensions:{height:p.height,length:p.length,sectionedLength:p.sectionedLength,bodyWidth:p.bodyWidth,
    mountingWidth:p.mountingWidth,angle:p.angle,nose:r,capacityTonPerM:p.capacityTonPerM}};
 }
 function dieDepth(tool){
  const half=tool.opening/2;
  if(tool.profileFamily==='block-v'){
   const flat=Math.min(tool.rootFlatWidth||0,tool.opening*.75);
   return Math.min((tool.height||60)-2,(half-flat/2)/Math.tan(rad(tool.angle/2)));
  }
  return half/Math.tan(rad(tool.angle/2));
 }
 // V se interpreta como intersección teórica de flancos con la cara superior.
 // Solo las matrices de barra con un radio simétrico documentado.
 function shoulders(d){
  if(!['22.804','22.806','22.808','22.810','22.812','22.816','22.820','22.825','22.308','22.310','22.312','22.316','22.320','22.325'].includes(d.code))return null;
  if(d.profileFamily!=='block-v'||!Number.isFinite(d.shoulderRadius)||d.shoulderRadius<=0||d.printedRadii?.length>1)return null;
  const r=d.shoulderRadius,alpha=rad(d.angle/2),sweep=Math.PI/2-alpha;
  const trim=r*Math.tan(sweep/2),half=d.opening/2;
  if(trim>(d.bodyWidth-d.opening)/2||trim*Math.cos(alpha)>dieDepth(d))return null;
  const right={x:half+trim,y:r},left={x:-right.x,y:r};
  const arc=Array.from({length:25},(_,i)=>{const a=-Math.PI/2+sweep*i/24;return pt(left.x+r*Math.cos(a),left.y+r*Math.sin(a));});
  return {radius:r,trim,sweep,left,right,leftArc:arc,rightArc:arc.slice().reverse().map(p=>pt(-p.x,p.y)),openingConvention:'intersección teórica de flancos'};
 }
 function shoulderSupport(d,beta,R,t){
  const s=shoulders(d);if(!s||beta<0||beta>s.sweep+1e-10)return null;
  const right=pt(s.right.x-s.radius*Math.sin(beta),s.right.y-s.radius*Math.cos(beta));
  // Tangencia entre el círculo del hombro y la cara inferior de la chapa.
  const centerX=right.x-t/2*Math.sin(beta);
  if(centerX<R*Math.sin(beta)-1e-9)return null;
  const cy=s.right.y+Math.tan(beta)*s.right.x-(s.radius+t/2)/Math.cos(beta)-R*(1/Math.cos(beta)-1);
  return {cy,left:pt(-right.x,right.y),right,centerX};
 }
 function catalogDie(model){
  const d=model.dieCatalogTool,v=model.dieOpening,depth=model.dieDepth,body=Math.max(d.bodyWidth||v+40,v+2);
  if(d.grooves?.length){
   const height=d.height||46,outline=[pt(-body/2,0)];
   for(const g of d.grooves){
    const cx=-body/2+g.offset,half=g.opening/2,root=Math.min(g.radius||.4,half*.2),grooveDepth=Math.min(height-2,half/Math.tan(rad(g.angle/2)));
    outline.push(pt(cx-half,0),pt(cx-root,grooveDepth-root),pt(cx,grooveDepth),pt(cx+root,grooveDepth-root),pt(cx+half,0));
   }
   outline.push(pt(body/2,0),pt(body/2,height),pt(-body/2,height));
   return {outline,opening:v,depth,shoulderRadius:d.shoulderRadius||null,
    geometry:'doble canal AMADA reconstruido desde cotas de catálogo',model:'sección extruida · sin CAD',verified:false,source:d.source,
    dimensions:{angle:d.angle,height:d.height,length:d.length,availableLengths:d.availableLengths,bodyWidth:d.bodyWidth,
     grooves:d.grooves,capacityTonPerM:d.capacityTonPerM}};
  }
  if(d.baseWidth&&d.stemWidth){
   const h=d.height||80,baseH=d.baseHeight||18,stem=d.stemWidth,opening=v,half=opening/2,root=Math.min(d.vRootRadius||.5,half*.2),cut=Math.min(h-baseH-2,half/Math.tan(rad(d.angle/2)));
   const outline=[pt(-stem/2,0),pt(-half,0),pt(-root,cut-root),pt(0,cut),pt(root,cut-root),pt(half,0),pt(stem/2,0),
    pt(stem/2,h-baseH-4),pt(d.baseWidth/2,h-baseH),pt(d.baseWidth/2,h),pt(-d.baseWidth/2,h),pt(-d.baseWidth/2,h-baseH),pt(-stem/2,h-baseH-4)];
   return {outline,opening:v,depth,shoulderRadius:d.shoulderRadius||null,geometry:'matriz AMADA con base en T reconstruida desde cotas',
    model:'sección extruida · sin CAD',verified:false,source:d.source,
    dimensions:{angle:d.angle,height:d.height,length:d.length,availableLengths:d.availableLengths,bodyWidth:d.bodyWidth,
     stemWidth:d.stemWidth,baseWidth:d.baseWidth,baseHeight:d.baseHeight,vRootRadius:d.vRootRadius,shoulderRadius:d.shoulderRadius,capacityTonPerM:d.capacityTonPerM}};
  }
  if(d.profileFamily==='block-v'){
   const half=v/2,flat=Math.min(d.rootFlatWidth||0,v*.75),cut=dieDepth({...d,opening:v});
   const shoulder=shoulders({...d,opening:v});
   const notch=flat>0?[pt(-half,0),pt(-flat/2,cut),pt(flat/2,cut),pt(half,0)]:[pt(-half,0),pt(0,cut),pt(half,0)];
   const channel=shoulder?[...shoulder.leftArc,...notch.slice(1,-1),...shoulder.rightArc]:notch;
   const outline=[pt(-body/2,0),...channel,pt(body/2,0)];
   if(d.footWidth){const foot=d.footWidth/2,y=Math.max(0,d.height-10);outline.push(pt(body/2,y),pt(foot,y),pt(foot,d.height),pt(-foot,d.height),pt(-foot,y),pt(-body/2,y));}
   else outline.push(pt(body/2,d.height),pt(-body/2,d.height));
   return {outline,opening:v,depth:cut,shoulders:shoulder,shoulderRadius:d.shoulderRadius||null,geometry:'bloque AMADA con canal V reconstruido desde cotas',
    model:'sección extruida · sin CAD',verified:false,source:d.source,
    dimensions:{angle:d.angle,height:d.height,length:d.length,availableLengths:d.availableLengths,bodyWidth:d.bodyWidth,
     shoulderRadius:d.shoulderRadius,vRootRadius:d.vRootRadius,rootFlatWidth:d.rootFlatWidth,footWidth:d.footWidth,capacityTonPerM:d.capacityTonPerM}};
  }
  const half=v/2,total=d.height||120,key=d.keyWidth||13,keyH=d.keyHeight||20,root=Math.max(0,Math.min(d.shoulderRadius||.6,v*.15));
  const rootHalf=Math.min(root,v*.1),bodyBottom=total-keyH;
  const outline=[pt(-body/2,0),pt(-half,0),pt(-rootHalf,depth-root),pt(0,depth),pt(rootHalf,depth-root),pt(half,0),
   pt(body/2,0),pt(body/2,bodyBottom),pt(key/2,bodyBottom),pt(key/2,total),pt(-key/2,total),pt(-key/2,bodyBottom),pt(-body/2,bodyBottom)];
  return {outline,opening:v,depth,shoulderRadius:d.shoulderRadius||null,
   geometry:'sección simétrica reconstruida del catálogo WILA–TRUMPF',model:'perfil extruido · sin CAD',verified:false,
   dimensions:{angle:d.angle,height:d.height,length:d.length,sectionedLength:d.sectionedLength,bodyWidth:d.bodyWidth,
    opening:d.opening,shoulderRadius:d.shoulderRadius,keyWidth:d.keyWidth,keyHeight:d.keyHeight,capacityTonPerM:d.capacityTonPerM}};
 }
 function punch(model){
  if(model.punchCatalogTool?.manufacturer)return catalogPunch(model);
  const {punchAngle,punchNose,punchTipY,dieOpening,punchHeight}=model;
  const alpha=rad(punchAngle/2),r=punchNose;
  const topHeight=Math.max(22,dieOpening*1.7,punchHeight||0);
  const centerY=punchTipY-r;
  const tx=r*Math.cos(alpha),ty=centerY+r*Math.sin(alpha);
  // Un flanco que crece durante toda la altura crea un triángulo enorme.
  // Representar una espiga recta y limitar la zona de flancos próximos a la punta.
  // Longitud SOLO ilustrativa: NO sustituye perfil medido, DXF ni CAD de fabricante.
  const topY=punchTipY-topHeight,flankHeight=Math.min(11,topHeight*.42);
  const shoulderY=ty-flankHeight,shankHalf=tx+flankHeight*Math.tan(alpha);
  const points=[pt(-shankHalf,topY),pt(shankHalf,topY),
   pt(shankHalf,shoulderY),pt(tx,ty)];
  for(let i=1;i<=20;i++){
   // Contacto tangente al flanco recto en a=alpha; el lado izquierdo
   // termina en pi-alpha. Para 30° el arco cubre 150°, para 88° cubre 92°.
   // El intervalo anterior (pi/2 +/- alpha) rompía el enlace, sobre todo en 30°.
   const a=alpha+(Math.PI-2*alpha)*i/20;
   points.push(pt(r*Math.cos(a),centerY+r*Math.sin(a)));
  }
  points.push(pt(-shankHalf,shoulderY));
  return {outline:points,tipY:punchTipY,nose:r,angle:punchAngle,
   geometry:'flancos-rectos-tangentes-a-radio',
   model:'espiga-recta-con-punta-nominal',verified:false};
 }
 function die(model){
  if(model.dieCatalogTool?.manufacturer)return catalogDie(model);
  const {dieOpening,dieDepth,dieHeight}=model;
  const h=dieOpening/2,outer=h+Math.max(14,Math.min(40,dieOpening));
  const bottom=Math.max(dieDepth+22,32,dieHeight||0);
  return {outline:[pt(-outer,0),pt(-h,0),pt(0,dieDepth),pt(h,0),pt(outer,0),pt(outer,bottom),pt(-outer,bottom)],opening:dieOpening,depth:dieDepth};
 }
 function profiles(model){return {punch:punch(model),die:die(model)};}
 return {punch,die,profiles,dieDepth,shoulders,shoulderSupport};
});


