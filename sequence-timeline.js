/* Plegar Pro Plus v0.39 · motor de reproducción temporal compartido 2D/3D.
 * Ciclos consecutivos sin paradas. No calcula recolocación física de pieza.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarSequenceTimeline=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function advance({step=0,cycle=0},deltaMs,steps,{duration=4000,speed=1,single=false}={}){
  if(!Number.isInteger(step)||step<0||!Number.isInteger(steps)||steps<1||step>=steps
     ||!Number.isFinite(cycle)||cycle<0||cycle>1||!Number.isFinite(deltaMs)||deltaMs<0
     ||!Number.isFinite(duration)||duration<=0||!Number.isFinite(speed)||speed<=0)
    throw Error('Parámetros de reproducción inválidos.');
  let fraction=cycle+deltaMs*speed/duration;
  const previous=step;
  if(single){return {step,cycle:Math.min(1,fraction),transition:false,finished:fraction>=1};}
  // Conservar el tiempo sobrante; no insertar paradas artificiales entre pliegues.
  while(fraction>=1&&step<steps-1){step++;fraction-=1;}
  if(step===steps-1&&fraction>=1)return {step,cycle:1,transition:step!==previous,finished:true};
  return {step,cycle:Math.min(1,fraction),transition:step!==previous,finished:false};
 }
 return {advance};
});