'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('../machine-v85'),F=require('../fold-kinematics'),S=require('../machine-section2d'),T=require('../tooling3d'),Touch=require('../touch-view');
const profile={name:'Montaje',material:'Acero S235JR',thickness:2,segments:[60,85,120],angles:[90,90],sequence:[1,2],setup:{machineId:'trumpf-v85',punch:'p30-r1-h100',die:'v16-30',radius:2}};
test('El portaútil conecta trancha y espiga en todo el ciclo y existe en 2D/3D',()=>{
 for(const t of [0,.12,.22,.5,.78,1]){
  const scene=F.frame(profile,0,t).scene,g=V.geometry(scene),top=Math.min(...scene.toolProfiles.punch.outline.map(p=>p.y));
  assert.equal(Math.min(...g.upperHolder.map(p=>p.y)),Math.min(g.bottom,top));
  assert.ok(Math.max(...g.upperHolder.map(p=>p.y))>=top);
  assert.deepEqual(S.build(scene).upperHolder,g.upperHolder);
  assert.ok(T.prisms({width:100,thickness:2},scene).some(p=>JSON.stringify(p.outline)===JSON.stringify(g.upperHolder)));
 }
});
test('El cuerpo Stop queda detrás de X; el saliente Support queda debajo de la chapa',()=>{
 for(const mode of ['stop','support']){
  const scene=F.frame({...profile,setup:{...profile.setup,backgaugeMode:mode}},0,0).scene,g=V.geometry(scene);
  for(const p of g.finger)if(p.x<scene.stop.x)assert.ok(p.y>=0,'el apoyo no puede invadir el espesor de chapa');
  assert.ok(g.finger.some(p=>p.x===scene.stop.x&&p.y<scene.stop.y));
 }
});
test('Inicio mantiene centro fijo al arrastrar y ampliar',()=>{
 const listeners=new Map(),surface={dataset:{},clientWidth:400,clientHeight:300,addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k),getBoundingClientRect:()=>({left:0,top:0,width:400,height:300})};
 const api=Touch.attach(surface,{style:{}},{allowPan:false});
 for(const pointerType of ['mouse','touch'])for(const type of ['pointerdown','pointermove'])listeners.get(type)({pointerType,button:0,pointerId:1,clientX:350,clientY:250});
 assert.deepEqual(api.getState(),{scale:1,x:0,y:0});api.zoomBy(2,350,250);
 assert.deepEqual(api.getState(),{scale:2,x:0,y:0});
});

test('el pellizco amplía la cámara centrada, y doble toque restaura el zoom',()=>{
 const handlers=new Map();
 const surface={dataset:{},clientWidth:400,clientHeight:300,
  addEventListener:(k,v)=>handlers.set(k,v),removeEventListener:k=>handlers.delete(k),
  getBoundingClientRect:()=>({left:0,top:0,width:400,height:300})};
 const api=Touch.attach(surface,{style:{}},{allowPan:false});
 const fire=(type,id,x)=>handlers.get(type)({pointerType:'touch',pointerId:id,button:0,clientX:x,clientY:150,cancelable:true,preventDefault:()=>{}});
 fire('pointerdown',1,100);fire('pointerdown',2,200);fire('pointermove',2,260);
 assert.ok(api.getState().scale>1,'Dos dedos deben poder ampliar incluso sin pan');
 assert.equal(api.getState().x,0);assert.equal(api.getState().y,0);
 handlers.get('dblclick')({cancelable:true,preventDefault:()=>{}});
 assert.deepEqual(api.getState(),{scale:1,x:0,y:0});api.destroy();
});
