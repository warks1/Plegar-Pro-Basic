import fs from 'node:fs';
import path from 'node:path';
const roots=['src','index.html'];
const replacements=new Map([
 ['ProgramaciÃ³n','Programación'],['SimulaciÃ³n','Simulación'],['DiseÃ±o','Diseño'],['MÃ¡quinas','Máquinas'],['CatÃ¡logos','Catálogos'],['Órdenes','Órdenes'],['ProducciÃ³n','Producción'],['ValidaciÃ³n','Validación'],['ConfiguraciÃ³n','Configuración'],['AÃ±adir','Añadir'],['Ã¡','á'],['Ã©','é'],['Ã­','í'],['Ã³','ó'],['Ãº','ú'],['Ã±','ñ'],['Â°','°'],['Â·','·'],['Â©','©']
]);
function repair(file){let text=fs.readFileSync(file,'utf8'),next=text;for(const [bad,good] of replacements)next=next.split(bad).join(good);if(next!==text){fs.writeFileSync(file,next,'utf8');console.log('UTF-8 reparado:',file)}}
function walk(target){if(!fs.existsSync(target))return;const st=fs.statSync(target);if(st.isFile()){repair(target);return}for(const name of fs.readdirSync(target)){const p=path.join(target,name);const s=fs.statSync(p);if(s.isDirectory())walk(p);else if(/\.(tsx?|css|html|json|md)$/.test(name))repair(p)}}
for(const target of roots)walk(target);
