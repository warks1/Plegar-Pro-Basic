/* Núcleo geométrico 2D: representación de ejes, NO cálculo de desarrollo de chapa. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlegarGeometry2D = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_SEGMENTS = 24;
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  function validate(source) {
    if (!source || typeof source !== 'object') throw new Error('Proyecto 2D incorrecto.');
    const data = {
      name: typeof source.name === 'string' ? source.name.trim().slice(0, 70) : '',
      material: typeof source.material === 'string' ? source.material.slice(0, 70) : '',
      thickness: Number(source.thickness),
      segments: source.segments,
      angles: source.angles,
      sequence: source.sequence
    };
    if (!data.name) throw new Error('Introduce un nombre de pieza.');
    if (!finite(data.thickness) || data.thickness < 0.1 || data.thickness > 100) throw new Error('Espesor entre 0,1 y 100 mm.');
    if (!Array.isArray(data.segments) || data.segments.length < 2 || data.segments.length > MAX_SEGMENTS || !data.segments.every(v => finite(v) && v >= 0.1 && v <= 100000)) throw new Error('Cada tramo debe medir entre 0,1 y 100000 mm (2-24 tramos).');
    if (!Array.isArray(data.angles) || data.angles.length !== data.segments.length - 1 || !data.angles.every(v => finite(v) && v >= -179 && v <= 179)) throw new Error('Los ángulos firmados deben estar entre -179° y +179°.');
    const count = data.angles.length;
    // Cada pliegue puede tener Ri/K propios. null = heredar valor general.
    // Se guarda una copia independiente para deshacer, bibliotecas y exportación.
    let bendOverrides;
    if(source.bendOverrides!==undefined){
      if(!Array.isArray(source.bendOverrides)||source.bendOverrides.length!==count)
       throw new Error('Los parámetros individuales deben corresponder exactamente a cada pliegue.');
      bendOverrides=source.bendOverrides.map((entry,i)=>{
       if(entry===null)return {radius:null,kFactor:null};
       if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('Parámetros inválidos del pliegue '+(i+1)+'.');
       const read=(key,min,max)=>{
        const value=entry[key]===undefined||entry[key]===null?null:entry[key];
        if(value!==null&&(!finite(value)||value<min||value>max))
         throw new Error('Parámetro '+key+' inválido en pliegue '+(i+1)+'.');
        return value;
       };
       return {radius:read('radius',.1,500),kFactor:read('kFactor',.2,.6)};
      });
    }
    if (!Array.isArray(data.sequence) || data.sequence.length !== count || new Set(data.sequence).size !== count || !data.sequence.every(v => Number.isInteger(v) && v >= 1 && v <= count)) throw new Error('La secuencia de pliegues debe incluir cada pliegue exactamente una vez.');
    return {name:data.name, material:data.material, thickness:data.thickness, segments:[...data.segments], angles:[...data.angles], sequence:[...data.sequence],...(bendOverrides?{bendOverrides}:{})};
  }
  function vertices(data) {
    const model = validate(data);
    let x = 0, y = 0, direction = 0;
    const points = [{x,y}];
    model.segments.forEach((length,i) => {
      if (i > 0) direction += model.angles[i-1] * Math.PI / 180;
      x += Math.cos(direction) * length;
      y += Math.sin(direction) * length;
      points.push({x,y});
    });
    return points;
  }
  function totalLength(data) { return validate(data).segments.reduce((sum, v) => sum+v, 0); }
  return {validate, vertices, totalLength, MAX_SEGMENTS};
});
