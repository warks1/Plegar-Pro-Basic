/* Plegar Pro Plus v0.44 · gestos táctiles independientes de la reproducción.
 * Arrastrar con un dedo/ratón, pellizcar con dos dedos, doble toque para centrar.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PlegarTouchView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 function zoomAt(state,ratio,focal,rect,min=.7,max=4){
  if(!Number.isFinite(ratio)||ratio<=0)return {...state};
  const scale=clamp(state.scale*ratio,min,max);
  const q=scale/state.scale,centre={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  return {scale,x:focal.x-centre.x-q*(focal.x-centre.x-state.x),
   y:focal.y-centre.y-q*(focal.y-centre.y-state.y)};
 }
 function attach(surface,content,{minZoom=.7,maxZoom=4,allowPan=true}={}){
  if(!surface||!content)throw Error('Se necesita la superficie y la capa del visor.');
  const pointers=new Map();let state={scale:1,x:0,y:0},gesture=null,lastTap=0,lastTapPoint=null,hadMotion=false,hadMultiple=false,origin=null;
  const bound=s=>({...s,x:!allowPan?0:clamp(s.x,-surface.clientWidth*Math.max(1,s.scale),surface.clientWidth*Math.max(1,s.scale)),
   y:!allowPan?0:clamp(s.y,-surface.clientHeight*Math.max(1,s.scale),surface.clientHeight*Math.max(1,s.scale))});
  function render(){
   content.style.transform='translate3d('+state.x.toFixed(2)+'px,'+state.y.toFixed(2)+'px,0) scale('+state.scale.toFixed(4)+')';
   content.style.transformOrigin='center center';
   surface.dataset.touchScale=state.scale.toFixed(3);
   surface.dataset.touchX=state.x.toFixed(1);surface.dataset.touchY=state.y.toFixed(1);
  }
  function rect(){return surface.getBoundingClientRect();}
  function begin(){
   const values=[...pointers.values()];
   if(values.length>=2){
    gesture={kind:'pinch',points:mid(values[0],values[1]),dist:Math.max(1,distance(values[0],values[1])),start:{...state}};
   }else if(values.length===1)gesture={kind:'pan',point:values[0],start:{...state}};
   else gesture=null;
  }
  function down(e){
   // Pan puede quedar bloqueado, pero el registro de dedos es necesario para pellizcar.

   if(e.pointerType==='mouse'&&e.button!==0)return;
   const p={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,p);
   if(pointers.size===1){origin=p;hadMotion=false;hadMultiple=false;}else hadMultiple=true;
   try{surface.setPointerCapture(e.pointerId);}catch{/* Eventos simulados no requieren captura. */}
   begin();if(e.cancelable)e.preventDefault();
  }
  function move(e){
   if(!pointers.has(e.pointerId))return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(origin&&distance(origin,{x:e.clientX,y:e.clientY})>9)hadMotion=true;
   const values=[...pointers.values()];
   if(!gesture)return;
   if(values.length>=2&&gesture.kind==='pinch'){
    const middle=mid(values[0],values[1]),current=Math.max(1,distance(values[0],values[1]));
    state=bound(zoomAt(gesture.start,current/gesture.dist,gesture.points,rect(),minZoom,maxZoom));
    state=bound({...state,x:state.x+middle.x-gesture.points.x,y:state.y+middle.y-gesture.points.y});
   }else if(values.length===1&&gesture.kind==='pan'){
    state=bound({...gesture.start,x:gesture.start.x+values[0].x-gesture.point.x,y:gesture.start.y+values[0].y-gesture.point.y});
   }else{begin();return;}
   render();if(e.cancelable)e.preventDefault();
  }
  function up(e){
   if(!pointers.has(e.pointerId))return;
   const last=pointers.size===1,position=pointers.get(e.pointerId);
   pointers.delete(e.pointerId);
   if(last&&!hadMotion&&!hadMultiple&&e.pointerType==='touch'){
    const now=Date.now();
    if(lastTap&&now-lastTap<=340&&lastTapPoint&&distance(position,lastTapPoint)<30){
     reset();lastTap=0;lastTapPoint=null;
    }else{lastTap=now;lastTapPoint=position;}
   }
   begin();
  }
  function doubleTap(e){if(e.cancelable)e.preventDefault();reset();}
  function zoomBy(factor,x=null,y=null){
   const r=rect();state=bound(zoomAt(state,factor,{x:x??r.left+r.width/2,y:y??r.top+r.height/2},r,minZoom,maxZoom));
   render();return {...state};
  }
  function reset(){state={scale:1,x:0,y:0};render();return {...state};}
  function wheel(e){
   if(!e.ctrlKey&&!e.metaKey)return;
   zoomBy(Math.exp(-e.deltaY*.004),e.clientX,e.clientY);
   if(e.cancelable)e.preventDefault();
  }
  function end(){for(const [name,cb,opts] of listeners)surface.removeEventListener(name,cb,opts);pointers.clear();}
  const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['dblclick',doubleTap],['wheel',wheel,{passive:false}]];
  listeners.forEach(([event,cb,options])=>surface.addEventListener(event,cb,options));
  render();
  return {getState:()=>({...state}),zoomBy,reset,destroy:end};
 }
 return {attach,zoomAt,clamp};
});
