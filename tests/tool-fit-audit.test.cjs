'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../tool-fit-audit.js'),D=require('../tool-dxf-import.js'),M=require('../machine-references.js');
const rect=(w,h)=>[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
const tool=(kind,lengthMm,id,code)=>{
 const record={id,brand:'MECOS',code,name:'Perfil DXF importado',kind,
  points:rect(kind==='punch'?45:100,kind==='punch'?150:72),holes:[],lengthMm,
  sourceFile:'local.dxf',geometryCertified:false,collisionApproved:false,simulatable:false};
 return D.normalizeRecord(record);
};
const punch=tool('punch',300,'local-punch-123456','P88-300');
const die=tool('die',250,'local-die-12345678','V24-250');
test('Audita solo longitudes declaradas y detecta pieza más ancha que útil individual',()=>{
 const report=A.inspect({punch,die,sheetWidthMm:400,machine:M.reference});
 assert.equal(report.nominalPairSpanMm,250);
 assert.equal(report.checks.sheetExceedsSinglePair,true);
 assert.equal(report.checks.sheetExceedsCandidateMachine,false);
 assert.match(report.conclusion,/INCOMPATIBILIDAD NOMINAL/);
 assert.ok(report.warnings.some(x=>/supera la longitud/.test(x)));
 assert.equal(report.approvedForSimulation,false);
 assert.equal(report.approvedForCNC,false);
 assert.equal(report.collisionClearanceVerified,false);
 assert.equal(report.machine.candidate,true);
 assert.ok(report.blockers.some(x=>/amarre/.test(x)));
 assert.ok(report.blockers.some(x=>/placa/.test(x)));
 const json=JSON.parse(A.json(report));
 assert.equal(json.collisionClearanceVerified,false);
 assert.equal(json.machine.lengthMm,3100);
});
test('Separa referencia comercial de máquina real; avisa si se exceden los 3100',()=>{
 const r=A.inspect({punch:tool('punch',4000,'local-punch-876543','P4000'),die:tool('die',4000,'local-die-87654321','V4000'),
  sheetWidthMm:3200,machine:M.reference});
 assert.equal(r.checks.sheetExceedsCandidateMachine,true);
 assert.equal(r.checks.toolExceedsCandidateMachine,true);
 assert.equal(r.checks.sheetExceedsSinglePair,false);
 assert.ok(r.warnings.length>=2);
 assert.equal(r.machine.verifiedOnSpecificMachine,false);
});
test('Falta de medidas no produce aprobación automática ni cotas imaginarias',()=>{
 const r=A.inspect({punch:tool('punch',null,'local-punch-999999','P?'),die:tool('die',null,'local-die-99999999','V?')});
 assert.equal(r.sheetWidthMm,null);
 assert.equal(r.nominalPairSpanMm,null);
 assert.match(r.conclusion,/INDETERMINADO/);
 assert.ok(r.blockers.some(x=>/Largo axial del punzón desconocido/.test(x)));
 assert.ok(r.blockers.some(x=>/matriz desconocido/.test(x)));
 assert.ok(r.blockers.some(x=>/No has elegido una referencia/.test(x)));
 assert.ok(r.blockers.some(x=>/Envolventes de mesa/.test(x)));
 const svg=A.svg(r);
 assert.match(svg,/SIN MEDIDA/);
 assert.doesNotMatch(svg,/undefined mm|NaN|Infinity/);
 assert.match(svg,/NO posiciones de amarre ni topes/);
});
test('Las cotas manuales de mesa y trancha se auditan sin considerarlas homologación',()=>{
 const setup={dieHeight:120,tableLeft:65,tableRight:65,ramWidth:100,ramBottomOffset:155};
 const r=A.inspect({punch,die,sheetWidthMm:200,machine:M.reference,machineSetup:setup});
 assert.equal(r.machineSetup.missing.length,0);
 assert.equal(r.machineSetup.supplied.length,5);
 assert.equal(r.machineSetup.geometryVerified,false);
 assert.equal(r.nominalPairSpanMm,250);
 assert.equal(r.warnings.length,1);
 assert.match(r.conclusion,/INDETERMINADO/);
 assert.equal(r.approvedForCNC,false);
 assert.throws(()=>A.inspect({machineSetup:{ramWidth:-20}}),/fuera de rango/);
 assert.throws(()=>A.inspect({sheetWidthMm:'Infinity'}),/fuera de rango/);
});
test('No permite escoger dos matrices como par, ni aceptar herramientas marcadas como certificadas',()=>{
 assert.throws(()=>A.inspect({punch:die,die}),/tipo correcto/);
 assert.throws(()=>A.inspect({punch:{...punch,collisionApproved:true},die}),/incompatible/);
 assert.throws(()=>A.inspect({punch,die,machine:{...M.reference,id:'inventada'}}),/no reconocido/);
 assert.throws(()=>A.json({...A.inspect(),approvedForCNC:true}),/No se admite/);
});
test('Escapa códigos no confiables en gráfico SVG sin permitir etiquetas inyectadas',()=>{
 const bad=tool('punch',100,'local-punch-123abc','<script>alert(1)</script>');
 const report=A.inspect({punch:bad,die,sheetWidthMm:60,machine:M.reference});
 const svg=A.svg(report);
 assert.doesNotMatch(svg,/<script>/);
 assert.match(svg,/Chapa/);
 assert.ok(!report.approvedForSimulation);
});
