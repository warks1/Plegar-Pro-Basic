import {readFileSync,writeFileSync} from 'node:fs';
const checks=[
  ['Historial táctil','src/components/AppShell.tsx',['handleUndo','handleRedo','disabled={!history.length}','disabled={!future.length}']],
  ['Programador multiparámetro','src/features/programming/PartProgrammerPage.tsx',['Añadir pliegue','Matriz / AV','Ala fija','Corrección','onPointerMove={moveDrag}','reorderBend']],
  ['Programación 3D táctil','src/features/programming/Programming3DPage.tsx',['touches.current','pinch.current','onWheel','Mostrar cotas']],
  ['Simulación según referencia','src/features/simulation/SimulationPage.tsx',['sim-ref-player','sim-ref-tools','sim-ref-data','sim-ref-sequence','sim2d-reference','sim3d-machine','showDimensions']],
  ['Sincronización central','src/store/useAppStore.ts',['addBend','updateBend','removeBend','reorderBend','useActiveProject']],
];
const results=checks.map(([name,file,needles])=>{const text=readFileSync(file,'utf8');const missing=needles.filter(n=>!text.includes(n));return{name,file,ok:missing.length===0,missing}});
writeFileSync('FUNCTIONAL_CONTRACT_AUDIT.json',JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));
for(const r of results)console.log(`${r.ok?'OK':'FAIL'} ${r.name}${r.missing.length?`: ${r.missing.join(', ')}`:''}`);
if(results.some(r=>!r.ok))process.exit(1);
