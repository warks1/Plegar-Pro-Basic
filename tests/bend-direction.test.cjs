'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../geometry2d.js');
const {scene}=require('../forming2d.js');
const {build}=require('../piece3d.js');
const near=(a,b,tol=1e-3)=>assert.ok(Math.abs(a-b)<tol,`Esperado ${b}°, calculado ${a}°`);
const heading=(a,b)=>Math.atan2(-(b.y-a.y),b.x-a.x)*180/Math.PI;
const delta=(a,b)=>((b-a+540)%360)-180;
const setups={radius:2,kFactor:.33,punch:'p88-r1',die:'v16-88',backgaugeX:120};
const shapes=[
 {name:'Escuadra L',segments:[80,60],angles:[90]},
 {name:'Canal U',segments:[55,100,55],angles:[90,90]},
 {name:'Perfil Z',segments:[70,65,70],angles:[90,-90]},
 {name:'Perfil Omega',segments:[60,85,120,85,60],angles:[-90,90,90,-90]},
 {name:'Omega orden mixto',segments:[60,85,120,85,60],angles:[-90,90,90,-90],sequence:[3,1,4,2]}
];
function model(sample){
 return {...sample,material:'Acero S235JR',thickness:2,
  sequence:sample.sequence||sample.angles.map((_,i)=>i+1),setup:setups};
}
// Direcciones de las alas rectas, en el orden original de corte de la pieza.
// El arco activo se representa por sus dos tramos tangentes; los anteriores
// son bisagras nominales y los pendientes permanecen rectos.
function straightDirections(s){
 const left=s.assembly.left.items.slice().reverse().map(e=>heading(e.to,e.from));
 const activeLeft=heading(s.wingLeft,s.tangentLeft);
 const activeRight=heading(s.tangentRight,s.wingRight);
 const right=s.assembly.right.items.map(e=>heading(e.from,e.to));
 return [...left,activeLeft,activeRight,...right];
}
function verify(m,step,progress){
 const s=scene(m,step,progress),vectors=straightDirections(s);
 const active=m.sequence[step],completed=new Set(m.sequence.slice(0,step));
 assert.equal(vectors.length,m.segments.length,m.name);
 for(let i=0;i<m.angles.length;i++){
  const expected=i+1===active?m.angles[i]*progress:completed.has(i+1)?m.angles[i]:0;
  // La vista de máquina necesita la orientación local tras el volteo supuesto.
  near(delta(vectors[i],vectors[i+1]),expected*s.mountSign);
 }
 near(s.signedAngle,m.angles[active-1]*progress);
 assert.ok(build(s,140).vertices.every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
 return s;
}
test('geometría estática usa +arriba y −abajo en coordenadas SVG',()=>{
 const up=G.vertices(model(shapes[0]));
 assert.ok(up.at(-1).y<up[1].y,'+90 debe subir en la vista 2D');
 const down=G.vertices({...model(shapes[0]),angles:[-90]});
 assert.ok(down.at(-1).y>down[1].y,'−90 debe bajar en la vista 2D');
});
test('toda la secuencia reproduce los giros programados, incluso con orden de plegado distinto',()=>{
 for(const sample of shapes){
  const m=model(sample);
  for(let step=0;step<m.sequence.length;step++)
   for(const progress of [0,.25,.5,.75,1]) verify(m,step,progress);
 }
});
test('los cuatro perfiles acaban con la misma orientación relativa de alas que sus planos 2D',()=>{
 for(const sample of shapes){
  const m=model(sample),s=verify(m,m.sequence.length-1,1);
  const directions=straightDirections(s);
  const points=G.vertices(m),planned=points.slice(1).map((p,i)=>heading(points[i],p));
  assert.equal(directions.length,planned.length);
  const installedDirections=planned.map(angle=>angle*s.mountSign);
  const offset=delta(installedDirections[0],directions[0]);
  for(let i=0;i<directions.length;i++) near(delta(installedDirections[i],directions[i]),offset);
 }
});
test('pliegue negativo cambia curvatura pero mantiene aviso de recolocación física pendiente',()=>{
 const up=scene(model(shapes[0]),0,1);
 const down=scene({...model(shapes[0]),angles:[-90]},0,1);
 assert.ok(up.wingRight.y<up.center.y);
 assert.ok(down.wingRight.y<down.center.y,'La chapa no atraviesa la V cuando el ángulo es -90°');
 assert.equal(down.mountSign,-1);
 assert.equal(down.requiresTurnover,true);
 assert.ok(down.warnings.some(w=>w.includes('VOLTEO')));
 assert.equal(down.signedAngle,-90);
});
