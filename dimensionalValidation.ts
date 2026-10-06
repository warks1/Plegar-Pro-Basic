export interface Dimensions3D {x:number;y:number;z:number}
export interface DimensionCheck {axis:keyof Dimensions3D;expected:number;measured:number;difference:number;percent:number;withinTolerance:boolean}
export interface DimensionalValidation {valid:boolean;tolerance:number;checks:DimensionCheck[];maxDeviation:number;summary:string}
export function validateDimensions(measured:Dimensions3D,expected:Dimensions3D,tolerance=0.5):DimensionalValidation{
  const checks=(['x','y','z'] as const).map(axis=>{const difference=Math.abs(measured[axis]-expected[axis]);const percent=expected[axis]===0?(difference===0?0:100):(difference/Math.abs(expected[axis]))*100;return {axis,expected:expected[axis],measured:measured[axis],difference,percent,withinTolerance:difference<=tolerance}});
  const maxDeviation=Math.max(...checks.map(c=>c.difference));const valid=checks.every(c=>c.withinTolerance);
  return {valid,tolerance,checks,maxDeviation,summary:valid?`Dimensiones dentro de ±${tolerance} mm.`:`Desviación máxima ${maxDeviation.toFixed(3)} mm; revisar el modelo.`};
}
export function canClaimOfficialCad(input:{source:string;license:string;sha256?:string;validation?:DimensionalValidation}){
  return Boolean(input.source.trim()&&input.license.trim()&&input.sha256&&input.validation?.valid);
}
