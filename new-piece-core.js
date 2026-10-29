/* Plegar Pro Basic v0.50 — creación geométrica compartida para Programación 2D/3D.
 * Longitudes/ángulos nominales, NO instrucciones CNC ni simulación certificada.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./geometry2d.js'):root.PlegarGeometry2D,
 typeof module==='object'&&module.exports?require('./bendcalc.js'):root.PlegarBendCalc);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarNewPieceCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,C){
 'use strict';
 const materials=['Acero S235JR','Acero S355JR','Inox 304','Aluminio 5754'];
 function create(current,width=100){
  const setup=C.validateSetup({...current?.setup,machineId:current?.setup?.machineId||'trumpf-v85'});
  return {name:'Nueva pieza',material:materials.includes(current?.material)?current.material:'Acero S235JR',
   thickness:current?.thickness??2,width:Number.isFinite(width)?width:100,
   segments:[100,100],angles:[90],sequence:[1],setup:(()=>{const s={...setup};delete s.backgaugeByBend;return s;})()};
 }
 function clone(input){
  // Copiar también los parámetros locales: el borrador no debe modificar la pieza abierta.
  return {...input,segments:[...input.segments],angles:[...input.angles],
    sequence:[...input.sequence],setup:{...input.setup,
     ...(input.setup.backgaugeByBend?{backgaugeByBend:[...input.setup.backgaugeByBend]}:{})},
    ...(input.bendOverrides!==undefined?{
      bendOverrides:input.bendOverrides.map(entry=>entry===null?null:{...entry})
    }:{})};
 }
 function add(draft){
  if(draft.segments.length>=G.MAX_SEGMENTS)throw Error('Máximo '+G.MAX_SEGMENTS+' tramos.');
  const p=clone(draft);p.segments.push(100);p.angles.push(90);p.sequence.push(p.angles.length);
  if(p.bendOverrides!==undefined)p.bendOverrides.push({radius:null,kFactor:null});
  if(p.setup.backgaugeByBend)p.setup.backgaugeByBend.push(null);
  return p;
 }
 function remove(draft){
  if(draft.segments.length<=2)throw Error('Una pieza debe tener como mínimo dos tramos.');
  const p=clone(draft);p.segments.pop();p.angles.pop();
  p.sequence=p.sequence.filter(id=>id<=p.angles.length);
  if(p.bendOverrides!==undefined)p.bendOverrides.pop();
  if(p.setup.backgaugeByBend)p.setup.backgaugeByBend.pop();
  return p;
 }
 function reposition(draft,bend,position){
  if(!Number.isInteger(bend)||bend<1||bend>draft.angles.length||
    !Number.isInteger(position)||position<1||position>draft.angles.length)throw Error('Posición de pliegue no válida.');
  const p=clone(draft),old=p.sequence.indexOf(bend);
  p.sequence.splice(old,1);p.sequence.splice(position-1,0,bend);
  return p;
 }
 function touchOrder(draft,picked,id){
  if(!Number.isInteger(id)||id<1||id>draft.angles.length)throw Error('Pliegue inexistente.');
  if(picked.includes(id))throw Error('El pliegue B'+id+' ya está seleccionado. Toca otro.');
  const next=[...picked,id],p=clone(draft);
  p.sequence=[...next,...p.sequence.filter(n=>!next.includes(n))];
  return {draft:p,picked:next.length===p.angles.length?[]:next,finished:next.length===p.angles.length};
 }
 function build(draft){
  const width=Number(draft.width);
  if(!Number.isFinite(width)||width<1||width>5000)throw Error('Ancho de plegado entre 1 y 5000 mm.');
  const p=G.validate(draft),setup=C.validateSetup(draft.setup);
  if(p.angles.some(n=>Math.abs(n)<.001))throw Error('Los pliegues de 0° deben eliminarse o indicar un ángulo distinto de cero.');
  if(!materials.includes(p.material))throw Error('Material no reconocido.');
  return {profile:{...p,setup},width};
 }
 return {materials,create,clone,add,remove,reposition,touchOrder,build};
});