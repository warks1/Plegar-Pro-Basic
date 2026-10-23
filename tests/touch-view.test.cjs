'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Touch=require('../touch-view.js');
test('pellizcar mantiene el punto de enfoque y limita escala',()=>{
 const rect={left:100,top:50,width:400,height:300};
 const s=Touch.zoomAt({scale:1,x:0,y:0},2,{x:350,y:250},rect);
 assert.deepEqual(s,{scale:2,x:-50,y:-50});
 const lower=Touch.zoomAt(s,0.01,{x:300,y:200},rect);
 assert.equal(lower.scale,.7);
 assert.equal(Touch.zoomAt(s,500,{x:300,y:200},rect).scale,4);
});
test('arrastre y zoom de 2 dedos sobre capa persistente, doble clic centra sin alterar geometría',()=>{
 const listeners=new Map();
 const surface={
  dataset:{},clientWidth:400,clientHeight:300,
  addEventListener(name,fn){listeners.set(name,fn);},
  removeEventListener(name){listeners.delete(name);},
  getBoundingClientRect(){return {left:100,top:50,width:400,height:300};},
  setPointerCapture(){}
 };
 const content={style:{}},api=Touch.attach(surface,content);
 const fire=(type,id,x,y)=>listeners.get(type)?.({pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,cancelable:true,preventDefault(){}});
 fire('pointerdown',1,200,200);
 fire('pointermove',1,260,225);
 assert.equal(api.getState().x,60);assert.equal(api.getState().y,25);
 fire('pointerdown',2,300,225);
 fire('pointermove',2,400,225);
 assert.ok(api.getState().scale>1);
 assert.match(content.style.transform,/translate3d/);
 assert.ok(Number(surface.dataset.touchScale)>1);
 fire('pointerup',1,260,225);fire('pointerup',2,400,225);
 listeners.get('dblclick')({cancelable:true,preventDefault(){}});
 assert.deepEqual(api.getState(),{scale:1,x:0,y:0});
 api.zoomBy(1.3);assert.ok(api.getState().scale>1);
 api.reset();assert.equal(api.getState().scale,1);
 api.destroy();assert.equal(listeners.size,0);
});
