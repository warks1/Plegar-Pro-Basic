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
  const neckTop=top+Math.min(40,h*.22),taperTop=model.punchTipY-Math.min(42,h*.22),reach=p.reach||0;
  const tipHalf=Math.max(p.nose||.6,Math.min(18,(taperTop-model.punchTipY)*Math.tan(rad(p.angle/2)))),shoulder=body/2;
  const outline=p.profileFamily==='gooseneck'?
   // The catalog reach is dimensioned from the tool centreline toward one side;
   // it is not an offset of the whole tool. Keep the asymmetric swan-neck form.
   [pt(-shank/2,top),pt(shank/2,top),pt(shank/2,neckTop),pt(shoulder,neckTop),
    pt(shoulder,taperTop),pt(tipHalf,model.punchTipY),pt(-tipHalf,model.punchTipY),
    pt(-reach,taperTop+Math.min(18,h*.08)),pt(-reach,neckTop),pt(-shoulder,neckTop)]:
   [pt(-shank/2,top),pt(shank/2,top),pt(shank/2,neckTop),pt(shoulder,neckTop),pt(shoulder,taperTop),
    pt(tipHalf,model.punchTipY),pt(-tipHalf,model.punchTipY),pt(-shoulder,taperTop),pt(-shoulder,neckTop),pt(-shank/2,neckTop)];
  return {outline,tipY:model.punchTipY,nose:p.nose||.6,angle:p.angle,
   geometry:'silueta reconstruida del catálogo WILA–TRUMPF',model:'perfil extruido · sin CAD',verified:false,
   source:p.source,dimensions:{height:p.height,length:p.length,sectionedLength:p.sectionedLength,bodyWidth:p.bodyWidth,
    mountingWidth:p.mountingWidth,angle:p.angle,nose:p.nose,capacityTonPerM:p.capacityTonPerM}};
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
   const half=v/2,flat=Math.min(d.rootFlatWidth||0,v*.75),root=Math.min(d.vRootRadius||.5,half*.2),cut=Math.min((d.height||60)-2,(half-flat/2)/Math.tan(rad(d.angle/2)));
   const notch=flat>0?[pt(-half,0),pt(-flat/2,cut),pt(flat/2,cut),pt(half,0)]:[pt(-half,0),pt(-root,cut-root),pt(0,cut),pt(root,cut-root),pt(half,0)];
   const outline=[pt(-body/2,0),...notch,pt(body/2,0)];
   if(d.footWidth){const foot=d.footWidth/2,y=Math.max(0,d.height-10);outline.push(pt(body/2,y),pt(foot,y),pt(foot,d.height),pt(-foot,d.height),pt(-foot,y),pt(-body/2,y));}
   else outline.push(pt(body/2,d.height),pt(-body/2,d.height));
   return {outline,opening:v,depth,shoulderRadius:d.shoulderRadius||null,geometry:'bloque AMADA con canal V reconstruido desde cotas',
    model:'sección extruida · sin CAD',verified:false,source:d.source,
    dimensions:{angle:d.angle,height:d.height,length:d.length,availableLengths:d.availableLengths,bodyWidth:d.bodyWidth,
     vRootRadius:d.vRootRadius,rootFlatWidth:d.rootFlatWidth,footWidth:d.footWidth,capacityTonPerM:d.capacityTonPerM}};
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
 return {punch,die,profiles};
});
