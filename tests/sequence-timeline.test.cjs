'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),T=require('../sequence-timeline.js');
test('avanza de un pliegue al siguiente sin pausas ni exigir pulsar continuar',()=>{
 let state={step:0,cycle:0},transitions=[];
 for(let i=0;i<1600;i++){
  const next=T.advance(state,33,4);
  if(next.transition)transitions.push(next.step);
  state=next;
  if(next.finished)break;
 }
 assert.deepEqual(transitions,[1,2,3]);
 assert.equal(state.step,3);assert.equal(state.cycle,1);assert.equal(state.finished,true);
});
test('respeta el resto de tiempo del fotograma, el orden y velocidad',()=>{
 const p=T.advance({step:0,cycle:.99},100,4,{speed:2});
 assert.equal(p.step,1);assert.ok(p.cycle>0&&p.cycle<.1);assert.equal(p.transition,true);
 const q=T.advance({step:2,cycle:.9},500,4,{speed:1});
 assert.equal(q.step,3);assert.ok(q.cycle>0&&q.cycle<.1);
});
test('desde el último pliegue solo se detiene al acabar el ciclo; un paso explícito sigue disponible',()=>{
 assert.deepEqual(T.advance({step:3,cycle:.99},200,4),{step:3,cycle:1,transition:false,finished:true});
 const single=T.advance({step:1,cycle:.99},200,4,{single:true});
 assert.equal(single.step,1);assert.equal(single.cycle,1);assert.equal(single.finished,true);
});
test('no permite secuencias vacías ni posiciones o tiempos inválidos',()=>{
 for(const opts of [{step:-1,cycle:0},{step:4,cycle:0},{step:0,cycle:-.01},{step:1,cycle:Infinity}]){
  assert.throws(()=>T.advance(opts,1,4));
 }
 assert.throws(()=>T.advance({step:0,cycle:0},NaN,4));
 assert.throws(()=>T.advance({step:0,cycle:0},20,0));
});
