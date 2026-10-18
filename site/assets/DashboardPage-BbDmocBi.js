import{r as interop,t as ReactModule}from"./react-OrosJ8bI.js";
import{a as runtime,f as useNavigate,n as useAppStore,t as useActiveProject}from"./index-BejcmiWV.js";
import{n as machines,t as tools}from"./catalog-DRcBI5Du.js";
const React=interop(ReactModule(),1);
const{jsx,jsxs}=runtime();
const NAV=[
 ["DISEÑO Y PROGRAMACIÓN",[["Inicio","/"],["Programar pieza","/programador-pieza"],["Programación 2D","/programacion-2d"],["Programación 3D","/programacion-3d"],["Diseño CAD/CAM 3D","/cad-cam-3d"]]],
 ["SIMULACIÓN",[["Simulación 2D","/simulacion-2d"],["Simulación 3D","/simulacion-3d"]]],
 ["HERRAMIENTAS",[["Calculadora desarrollo","/calculadora-desarrollo"],["Curva perfecta","/curva-perfecta"]]],
 ["BIBLIOTECAS",[["Máquinas","/bibliotecas"],["Utillaje","/utillaje"],["Materiales","/materiales"],["Proveedores","/proveedores"]]],
 ["AJUSTES",[["Ajustes","/ajustes"],["IA Asistente","/ia"]]]
];
const GLYPHS={"Inicio":"⌂","Programar pieza":"▧","Programación 2D":"▱","Programación 3D":"⬡","Diseño CAD/CAM 3D":"◇","Simulación 2D":"▧","Simulación 3D":"⬡","Calculadora desarrollo":"▦","Curva perfecta":"⌘","Máquinas":"⚙","Utillaje":"♧","Materiales":"⬡","Proveedores":"♙","Ajustes":"⚙","IA Asistente":"✦"};
const MATERIALS=[
 ["Acero S235JR","0.50 - 20.00","235","360 - 510","0.38"],
 ["Acero Inox AISI 304","0.50 - 15.00","205","515 - 750","0.42"],
 ["Aluminio 5754","1.00 - 10.00","90","190 - 240","0.33"]
];
function icon(label){return jsx("span",{className:"pp-icon","aria-hidden":"true",children:GLYPHS[label]||"◇"})}
function piecePath(bends){let pts=[[0,44],[15,44]],y=44;for(let i=0;i<Math.min(bends.length,5);i++){y+=(i%2===0?-1:1)*(10+Math.abs(90-(bends[i]?.angle||90))*.12);pts.push([32+i*12,y],[42+i*12,y]);}pts.push([100,Math.max(20,Math.min(70,y))]);return pts.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" ")}
function DashboardPage(){
 const project=useActiveProject();
 const projects=useAppStore(s=>s.projects);
 const setActiveProject=useAppStore(s=>s.setActiveProject);
 const state=useAppStore();
 const navigate=useNavigate();
 const bends=project.bends||[];
 const machine=machines.find(m=>m.id===state.selectedMachineId)||machines[0];
 const punch=tools.find(t=>t.id===state.selectedPunchId&&t.kind==="punch")||tools.find(t=>t.kind==="punch");
 const die=tools.find(t=>t.id===state.selectedDieId&&t.kind==="die")||tools.find(t=>t.kind==="die");
 const [step,setStep]=React.useState(0);
 const [playing,setPlaying]=React.useState(false); const [pressing,setPressing]=React.useState(false);
 const [saved,setSaved]=React.useState(false);
 const [view,setView]=React.useState("Isométrica");
 const [toolTab,setToolTab]=React.useState("PUNZONES");
 const [toggles,setToggles]=React.useState({Ejes:true,Guías:true,Cotas:true,Malla:true,Restricciones:true});
 const [force,setForce]=React.useState(32.5); const [simSpeed,setSimSpeed]=React.useState(state.simulationSpeed||1); const [calcMaterial,setCalcMaterial]=React.useState(project.material||"Acero S235JR"); const [calcThickness,setCalcThickness]=React.useState(Number(project.thickness||2)); const [calcFactor,setCalcFactor]=React.useState(.38); const [calcQuantity,setCalcQuantity]=React.useState(1); const [yPosition,setYPosition]=React.useState(112.8); const [sectionMode,setSectionMode]=React.useState(2); const [clockNow,setClockNow]=React.useState(Date.now()); const [online,setOnline]=React.useState(navigator.onLine);
 const bend=bends[Math.min(step,Math.max(0,bends.length-1))];
 const [positioning,setPositioning]=React.useState(false);
 const [finished,setFinished]=React.useState(false);
 const angle=bend?.angle||90; const flatPath=bends.reduce((d,_,i)=>{const x=18+(i+1)*(324/(bends.length+1));return d+" L"+x+" 58 L"+x+" 18 L"+(x+14)+" 18 L"+(x+14)+" 58"},"M8 58")+" L352 58"; const materialK=calcFactor; const materialStrength={"Acero S235JR":435,"Acero Inox AISI 304":632,"Aluminio 5754":215}[calcMaterial]||435; const computedForce=Number(bend?.forceKnM||Math.min(machine?.forceT||100,32.5*Math.pow(calcThickness/2,2)*((Number(project.length)||1000)/1000)*materialStrength/435)); const computed=React.useMemo(()=>{const t=Math.max(.1,Number(calcThickness)||2),k=materialK;const rows=bends.map(b=>{const a=Math.max(1,Math.min(179,Number(b.angle)||90))*Math.PI/180,r=Number(b.radius)||t,ba=a*(r+k*t),bd=2*(r+t)*Math.tan(a/2)-ba;return{ba,bd,wingA:Number(b.position)||45,wingB:Number(b.length)||90}});const ba=rows.reduce((n,r)=>n+r.ba,0),bd=rows.reduce((n,r)=>n+r.bd,0),sum=rows.reduce((n,r)=>n+r.wingA+r.wingB,0);return{rows,ba,bd,sum,flat:Math.max(0,sum-bd),total:Math.max(0,sum-bd)*Math.max(1,Number(calcQuantity)||1)}},[bends,calcThickness,calcQuantity,materialK]);
 const sequence=["Posicionar chapa",...bends.map((b,i)=>"Plegado "+(b.order||i+1)),"Pieza terminada"];
 const activeStep=finished?sequence.length-1:positioning?0:Math.min(step+1,sequence.length-2);
 const visibleTools=toolTab==="PUNZONES"?tools.filter(t=>t.kind==="punch"):toolTab==="MATRICES"?tools.filter(t=>t.kind==="die"):tools.filter(t=>/adaptador|adapter|accessory|accesorio/i.test((t.family||"")+" "+t.name));
 React.useEffect(()=>{const tick=window.setInterval(()=>setClockNow(Date.now()),15000);const on=()=>setOnline(navigator.onLine);window.addEventListener("online",on);window.addEventListener("offline",on);return()=>{window.clearInterval(tick);window.removeEventListener("online",on);window.removeEventListener("offline",on)}},[]);
 React.useEffect(()=>{if(!playing){setPressing(false);return}if(step>=Math.max(0,bends.length-1)){setPlaying(false);setFinished(true);setPositioning(false);setPressing(false);return}const duration=1000/Math.max(.25,simSpeed);const down=window.setTimeout(()=>setPressing(true),duration*.2);const up=window.setTimeout(()=>{setPressing(false);setStep(s=>s+1)},duration);return()=>{window.clearTimeout(down);window.clearTimeout(up)}},[playing,step,bends.length,simSpeed]);
 React.useEffect(()=>{if(bends.length)setStep(s=>Math.min(s,bends.length-1));else setStep(0)},[bends.length]);
 const goto=(path)=>navigate(path);
 const next=()=>{setPositioning(false);setFinished(false);setStep(s=>Math.min(Math.max(0,bends.length-1),s+1))};
 const previous=()=>setStep(s=>Math.max(0,s-1));
 const share=async()=>{try{await navigator.clipboard.writeText(window.location.href);window.alert("Enlace del espacio de trabajo copiado.")}catch{window.prompt("Copia el enlace del espacio de trabajo:",window.location.href)}};
 const toggle=k=>setToggles(v=>({...v,[k]:!v[k]}));
 const commitBends=next=>state.updateProject?.(project.id,{bends:next.map((b,i)=>({...b,order:i+1}))});
 const updateBend=(i,key,value)=>commitBends(bends.map((b,j)=>j===i?{...b,[key]:value}:b));
 const addBend=()=>{const next=[...bends,{id:crypto.randomUUID?.()||String(Date.now()),order:bends.length+1,position:Number(project.width||45),length:Number(project.length||90),angle:90,radius:Number(project.thickness||2),direction:"up"}];commitBends(next);setStep(next.length-1)};
 const duplicateBend=()=>{if(!bend)return;const next=[...bends.slice(0,step+1),{...bend,id:crypto.randomUUID?.()||String(Date.now()),order:step+2},...bends.slice(step+1)];commitBends(next);setStep(step+1)};
 const removeBend=()=>{if(!bend)return;const next=bends.filter((_,i)=>i!==step);commitBends(next);setStep(Math.max(0,step-1))};
 const mirrorBend=()=>{if(!bend)return;updateBend(step,"angle",-Number(bend.angle||90))};
 const cards=projects.slice(0,3);
 const machineName=machine?machine.manufacturer+" "+machine.name:"Bystronic Xpert Pro 100";
 return jsxs("div",{className:"pp-workbench",children:[
  jsxs("header",{className:"pp-topbar",children:[
   jsxs("button",{className:"pp-brand",onClick:()=>goto("/"),children:[jsx("span",{className:"pp-logo",children:"P"}),jsxs("span",{children:[jsx("b",{children:"PLEGAR PRO"}),jsx("small",{children:"PROFESSIONAL"})]})]}),
   jsxs("label",{className:"pp-project-select",children:[jsx("span",{className:"pp-project-icon",children:"▧"}),jsxs("span",{children:[jsx("small",{children:"PROYECTO ACTIVO"}),jsx("select",{value:project.id||"",onChange:e=>setActiveProject(e.target.value),children:projects.map(p=>jsx("option",{value:p.id,children:p.name},p.id))})]}),jsx("span",{className:"pp-synced",children:"●  Sincronizado  ▾"})]}),
   jsxs("div",{className:"pp-top-actions",children:[
    jsx("button",{title:"Deshacer",onClick:()=>state.undo?.(),children:jsxs("span",{children:["↶",jsx("small",{children:"Deshacer"})]})}),
    jsx("button",{title:"Rehacer",onClick:()=>state.redo?.(),children:jsxs("span",{children:["↷",jsx("small",{children:"Rehacer"})]})}),
    jsx("button",{title:"Guardar proyecto",onClick:()=>{setSaved(true);window.setTimeout(()=>setSaved(false),1800)},children:jsxs("span",{children:["▣",jsx("small",{children:saved?"Guardado":"Guardar"})]})}),
    jsx("button",{title:"Compartir",onClick:share,children:jsxs("span",{children:["⌘",jsx("small",{children:"Compartir"})]})}),
    jsx("button",{title:"Notificaciones",onClick:()=>goto("/notificaciones"),children:jsxs("span",{children:["♧",jsx("i",{className:"pp-badge",children:"3"}),jsx("small",{children:"Mapa"})]})})
   ]}),
   jsxs("button",{className:"pp-profile",onClick:()=>goto("/ajustes"),children:[jsx("span",{className:"pp-avatar",children:"AM"}),jsxs("span",{children:[jsx("b",{children:"AMS ENGINEERING"}),jsx("small",{children:"Administrador"})]})]}),
   jsxs("div",{className:"pp-utilities",children:[jsx("button",{title:"Ayuda",onClick:()=>goto("/acerca-de"),children:"?"}),jsx("button",{title:"Ajustes",onClick:()=>goto("/ajustes"),children:"⚙"}),jsx("button",{title:"Pantalla completa",onClick:()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.(),children:"⛶"})]})
  ]}),
  jsxs("div",{className:"pp-body",children:[
   jsxs("aside",{className:"pp-sidebar",children:[
    jsx("nav",{className:"pp-side-nav",children:NAV.map(([section,items])=>jsxs("section",{children:[jsx("h2",{children:section}),items.map(([label,path])=>jsx("button",{className:(label==="Programar pieza"?"active-purple ":"")+(label==="Simulación 3D"?"active-blue":""),onClick:()=>goto(path),children:[icon(label),jsx("span",{children:label})]},path))]},section))}),
    jsxs("section",{className:"pp-current-project",children:[jsxs("header",{children:[jsx("small",{children:"PROYECTO ACTUAL"}),jsx("button",{onClick:()=>goto("/proyectos"),children:"×"})]}),jsx("b",{children:project.name}),jsx("small",{children:(project.material||"Acero S235JR")+" · "+Number(project.thickness||2).toFixed(2)+" mm"}),jsx("svg",{viewBox:"0 0 120 82",className:"pp-side-piece",children:[jsx("path",{d:piecePath(bends),fill:"none",stroke:"#dce7f3",strokeWidth:"9",strokeLinejoin:"round",strokeLinecap:"round"}),jsx("path",{d:piecePath(bends),fill:"none",stroke:"#8aa3bd",strokeWidth:"1"})]}),jsx("button",{className:"pp-secondary",onClick:()=>goto("/proyectos"),children:"Cambiar proyecto"})]})
   ]}),
   jsxs("main",{className:"pp-main",children:[
    jsxs("section",{className:"pp-top-grid",children:[
     jsxs("section",{className:"pp-simulation pp-panel",children:[
      jsxs("header",{className:"pp-section-heading",children:[jsxs("div",{children:[jsx("h1",{children:"SIMULACIÓN 3D"}),jsx("p",{children:"Visualización realista de la máquina y la secuencia de plegado"})]}),jsx("button",{title:"Cerrar panel",onClick:()=>goto("/simulacion-3d"),children:"×"})]}),
      jsxs("div",{className:"pp-player",children:[
       jsx("button",{title:playing?"Pausar":"Reproducir",onClick:()=>{setPositioning(false);setFinished(false);setPlaying(v=>!v)},children:playing?"Ⅱ":"▶"}),
       jsx("button",{title:"Reiniciar",onClick:()=>{setPlaying(false);setFinished(false);setPositioning(true);setStep(0)},children:"H"}),
       jsx("button",{title:"Paso anterior",onClick:()=>{setPositioning(false);setFinished(false);previous()},children:"◀◀"}),
       jsx("button",{title:"Plegado anterior",onClick:()=>{setPositioning(false);previous()},children:"↶"}),
       jsx("button",{title:"Plegado siguiente",onClick:()=>{setPositioning(false);next()},children:"▶▶"}),
       jsx("button",{title:"Avance rápido",onClick:()=>{setPositioning(false);setFinished(true);setStep(Math.max(0,bends.length-1))},children:"»"}),
       jsx("b",{children:"Paso "+(step+1)+" / "+Math.max(1,bends.length)}),
       jsx("span",{children:positioning?"Posicionar chapa":bend?"Plegado "+(bend.order||step+1)+" de "+bends.length:"Posicionar chapa"}),
       jsx("label",{children:["Velocidad",jsx("select",{value:simSpeed+"x",onChange:e=>{const v=parseFloat(e.target.value);setSimSpeed(v);state.setSimulationSpeed?.(v)},children:["0.5x","1.0x","1.5x","2.0x"].map(v=>jsx("option",{children:v},v))})]})
      ]}),
      jsxs("div",{className:"pp-sim-content",children:[
       jsxs("div",{className:"pp-machine-stage",children:[
        jsx("div",{className:"pp-stage-grid",style:{display:toggles.Malla?"":"none"}}),jsx("div",{className:"pp-stage-guides",style:{display:toggles.Guías?"":"none"}}),jsx("div",{className:"pp-measure-overlay",style:{display:toggles.Medir?"":"none"},children:["X · "+(project.length||1000)+" mm","Y · "+(project.width||90)+" mm"]}),jsx("div",{className:"pp-stage-dimensions",style:{display:toggles.Cotas?"":"none"},children:(project.width||90)+" mm · "+(project.length||1000)+" mm"}),
        jsxs("div",{className:"pp-machine-art "+(playing?"is-running":"")+(pressing?" is-pressing":""),style:{"--pp-ram-depth":Math.max(0,(90-angle)*.1)+"px",transform:view==="Lateral"?"scaleX(.7) skewY(-3deg)":view==="Superior"?"scale(.82) rotateX(55deg)":view==="Frontal"?"scaleX(1.04)":"",clipPath:sectionMode===4?"inset(0 0 0 48%)":sectionMode===3?"inset(0 15% 0 0)":"",filter:toggles.Aislar?"brightness(1.15) saturate(1.15)":"",transition:"transform .2s ease,clip-path .3s ease,filter .3s ease"},children:[
         jsx("div",{className:"pp-press-header",children:jsx("strong",{children:machineName})}),
         jsx("div",{className:"pp-red-cap pp-red-left"}),
         jsx("div",{className:"pp-red-cap pp-red-right"}),
         jsx("div",{className:"pp-press-ram",style:{transform:"translateY(calc(var(--pp-ram-depth, 0px) + "+(pressing?"28px":"0px")+"))"}}),
         jsx("div",{className:"pp-finger-row",children:Array.from({length:12},(_,i)=>jsx("i",{},i))}),
         jsx("div",{className:"pp-press-table"}),
         jsx("div",{className:"pp-column pp-column-left"}),
         jsx("div",{className:"pp-column pp-column-right"}),
         jsx("div",{className:"pp-workpiece "+(playing?"is-forming":""),style:{"--pp-angle":Math.max(0,90-Math.abs(angle))+"deg",top:(47+(yPosition/300)*4)+"%","--pp-step":step},children:[jsx("i",{}),jsx("i",{}),jsx("i",{})]}),
         jsxs("div",{className:"pp-console",children:[jsx("div",{children:"XPERT"}),jsx("b",{children:"Y1 · Y2"}),jsx("small",{children:computedForce.toFixed(1)+" t"})]})
        ]}),
        jsxs("div",{className:"pp-axis-cube",style:{display:toggles.Ejes?"":"none"},children:[jsx("span",{children:"Z"}),jsx("i",{}),jsx("b",{children:"Y"}),jsx("em",{children:"X"})]}),
        jsxs("div",{className:"pp-sequence",children:[jsx("h2",{children:"SECUENCIA DE PLEGADO"}),jsx("div",{className:"pp-sequence-list",children:sequence.map((label,i)=>jsxs("button",{className:i===activeStep?"active":"",onClick:()=>{setPlaying(false);setPositioning(i===0);setFinished(i===sequence.length-1);setStep(Math.max(0,Math.min(bends.length-1,i-1)))},children:[jsx("b",{children:i+1}),jsx("svg",{viewBox:"0 0 72 38",children:jsx("path",{d:"M4 20h22l9-10h14l8 10h12",fill:"none",stroke:"currentColor",strokeWidth:"4",strokeLinejoin:"round"})}),jsx("span",{children:label})]},i))})]})
       ]}),
       jsxs("aside",{className:"pp-info",children:[
        jsxs("header",{children:[jsx("b",{children:"INFORMACIÓN"}),jsx("button",{onClick:e=>e.currentTarget.closest(".pp-info").classList.toggle("collapsed"),children:"⌄"})]}),
        jsx("dl",{children:[["Máquina",machineName],["Punzón",punch?.name||"88° R1"],["Matriz",die?.name||"V16 68°"],["Material",project.material||"Acero S235JR"],["Espesor",Number(project.thickness||2).toFixed(2)+" mm"],["Longitud",Number(project.length||1000)+" mm"],["Fuerza actual",computedForce.toFixed(1)+" Ton"],["Ángulo actual",angle+"°"],["Estado",positioning?"Posicionando":playing?"Plegando":"Listo"]].map(([k,v])=>jsxs("div",{children:[jsx("dt",{children:k}),jsx("dd",{className:k==="Estado"?"ok":"",children:v})]},k))}),
        jsx("div",{className:"pp-sensors",children:[jsx("h3",{children:"SENSORES EN TIEMPO REAL"}),jsx("div",{className:"pp-gauges",children:[["Fuerza (Ton)",computedForce,""+(machine?.forceT||100)],["Ángulo (°)",angle,"90"]].map(([label,val,max])=>jsxs("div",{className:"pp-gauge",children:[jsx("small",{children:label}),jsx("div",{className:"pp-gauge-ring",style:{"--value":Math.min(100,Number(val)/Number(max)*100)+"%"}}),jsx("b",{children:label.startsWith("Fuerza")?Number(val).toFixed(1).replace(".",","):val+"°"}),jsx("span",{children:"0                 "+max})]},label))})]}),
        jsxs("label",{className:"pp-y-control",children:[jsx("small",{children:"Posición Y (mm)"}),jsx("input",{type:"range",min:"0",max:"300",value:yPosition,onChange:e=>setYPosition(Number(e.target.value))}),jsx("b",{children:yPosition.toFixed(2).replace(".",",")})]})
       ]})
      ]})
     ]}),
     jsxs("aside",{className:"pp-visual-tools pp-panel",children:[
      jsx("h2",{children:"VISTA"}),
      jsx("div",{className:"pp-view-list",children:["Frontal","Lateral","Superior","Isométrica"].map((v,i)=>jsx("button",{className:view===v?"selected":"",onClick:()=>setView(v),children:[jsx("span",{children:["⬡","◇","▱","◈"][i]}),v]},v))}),
      jsx("h2",{className:"pp-subtitle",children:"HERRAMIENTAS VISUALES"}),
      jsx("div",{className:"pp-tool-buttons",children:["Rotar","Medir","Sección","Ejes","Encuadre","Aislar"].map((v,i)=>jsx("button",{title:v,onClick:()=>i===0?setView(view==="Isométrica"?"Frontal":"Isométrica"):i===2?setSectionMode(m=>(m+1)%5):i===4?setView("Isométrica"):toggle(v),children:["⟳","⌖","◉","✣","⌕","▣"][i]},v))}),
      jsx("div",{className:"pp-toggle-grid",children:["Ejes","Guías","Cotas","Malla","Restricciones"].map(v=>jsxs("button",{onClick:()=>toggle(v),children:[v,jsx("i",{className:toggles[v]?"on":""})]},v))}),
      jsx("h2",{className:"pp-subtitle",children:"SECCIÓN"}),
      jsx("div",{className:"pp-sections",children:["▧","▤","▥","⬡","⬢"].map((v,i)=>jsx("button",{className:i===sectionMode?"selected":"",title:"Sección "+(i+1),onClick:()=>setSectionMode(i),children:v},i))})
     ]})
    ]}),
    jsxs("section",{className:"pp-bottom-grid",children:[
     jsxs("section",{className:"pp-programming pp-panel",children:[
      jsxs("header",{className:"pp-card-heading",children:[jsxs("div",{children:[jsx("h2",{children:"PROGRAMACIÓN 2D / 3D"}),jsx("p",{children:"Edición sincronizada de la pieza"})]}),jsx("button",{onClick:()=>goto("/programacion-2d"),children:"Abrir"})]}),
      jsxs("div",{className:"pp-views-2d3d",children:[
       jsxs("button",{className:"pp-mini-cad",onClick:()=>goto("/programacion-2d"),children:[jsx("b",{children:"VISTA 2D"}),jsx("svg",{viewBox:"0 0 240 170",children:[jsx("path",{d:piecePath(bends),fill:"none",stroke:"#d6dfec","stroke-width":Math.max(1,Number(calcThickness))}),jsx("path",{d:"M82 38v100M156 60v77",stroke:"#9b59ff","stroke-dasharray":"6 4"}),jsx("text",{x:"103",y:"31",fill:"#eaf1ff",children:"120,00"}),jsx("text",{x:"17",y:"94",fill:"#eaf1ff",children:"45,00"}),jsx("text",{x:"83",y:"82",fill:"#43e485",children:"P2 -90°"}),jsx("text",{x:"158",y:"82",fill:"#bd7aff",children:"P3 90°"})]})]}),
       jsxs("button",{className:"pp-mini-3d",onClick:()=>goto("/programacion-3d"),children:[jsx("b",{children:"VISTA 3D"}),jsx("svg",{viewBox:"0 0 150 170",children:[jsx("path",{d:"M34 83l50-31 38 23-47 31z",fill:"#8497a9",stroke:"#e2eaf3","stroke-width":"2",style:{transform:"rotate("+(angle-90)+"deg)",transformOrigin:"76px 90px",transition:"transform .4s ease"}}),jsx("path",{d:"M34 83v40l41 25v-42m47-31v41l-47 32",fill:"none",stroke:"#d9e4ef","stroke-width":"2"}),jsx("circle",{cx:"34",cy:"81",r:"9",fill:"#2656df"}),jsx("text",{x:"31",y:"84",fill:"#fff",children:"1"}),jsx("circle",{cx:"122",cy:"73",r:"9",fill:"#2656df"}),jsx("text",{x:"119",y:"76",fill:"#fff",children:"3"})]})]})
      ]}),
      jsxs("div",{className:"pp-bend-table",children:[jsxs("div",{className:"pp-bend-heading",children:[jsx("h3",{children:"TABLA DE PLIEGUES"}),jsx("div",{children:[jsx("button",{onClick:addBend,children:"+ Añadir pliegue"}),jsx("button",{onClick:duplicateBend,disabled:!bend,children:"Duplicar"}),jsx("button",{onClick:mirrorBend,disabled:!bend,children:"Espejo"}),jsx("button",{onClick:removeBend,disabled:!bend,children:"Eliminar"})]})]}),jsx("table",{children:jsxs("tbody",{children:[jsxs("tr",{children:["N°","POSICIÓN X","LONGITUD","ÁNGULO","SENTIDO","RADIO INT.","DIRECCIÓN"].map(v=>jsx("th",{children:v},v))}),bends.map((b,i)=>jsxs("tr",{onClick:()=>{setStep(i);setPositioning(false);setFinished(false)},className:i===step?"is-selected":"",children:[jsx("td",{children:i+1}),jsx("td",{children:jsx("input",{className:"pp-inline-edit",type:"number",value:Number(b.position||45),onClick:e=>e.stopPropagation(),onChange:e=>updateBend(i,"position",Number(e.target.value))})}),jsx("td",{children:jsx("input",{className:"pp-inline-edit",type:"number",value:Number(b.length||project.width||90),onClick:e=>e.stopPropagation(),onChange:e=>updateBend(i,"length",Number(e.target.value))})}),jsx("td",{children:jsxs("span",{className:"pp-angle-edit",children:[jsx("input",{className:"pp-inline-edit",type:"number",value:Number(b.angle||90),onClick:e=>e.stopPropagation(),onChange:e=>updateBend(i,"angle",Number(e.target.value))}),"°"]})}),jsx("td",{className:Number(b.angle)<0?"down":"up",children:Number(b.angle)<0?"↓":"↑"}),jsx("td",{children:jsx("input",{className:"pp-inline-edit",type:"number",value:Number(b.radius||2),onClick:e=>e.stopPropagation(),onChange:e=>updateBend(i,"radius",Number(e.target.value))})}),jsx("td",{children:"Interior"})]},b.id||i))]})})]}),
      ]}),
     jsxs("section",{className:"pp-calculator pp-panel",children:[
      jsxs("header",{className:"pp-card-heading",children:[jsxs("div",{children:[jsx("h2",{children:"CALCULADORA DE DESARROLLO MULTIPLEGADO"}),jsx("p",{children:"Cálculo preciso con apertura V por pliegue"})]}),jsx("button",{onClick:()=>goto("/calculadora-desarrollo"),children:"Exportar informe"})]}),
      jsxs("div",{className:"pp-calc-row",children:[
       jsxs("section",{className:"pp-calc-params",children:[jsx("b",{children:"PARÁMETROS GENERALES"}),jsx("label",{children:["Material",jsx("select",{value:calcMaterial,onChange:e=>{setCalcMaterial(e.target.value);setCalcFactor({"Acero S235JR":.38,"Acero Inox AISI 304":.42,"Aluminio 5754":.33}[e.target.value])},children:["Acero S235JR","Acero Inox AISI 304","Aluminio 5754"].map(v=>jsx("option",{children:v},v))})]}),jsx("label",{children:["Espesor (mm)",jsx("input",{type:"number",min:"0.5",step:"0.1",value:calcThickness,onChange:e=>setCalcThickness(Math.max(.5,Number(e.target.value)||.5))})]}),jsx("label",{children:["Factor K",jsx("select",{value:String(calcFactor),onChange:e=>setCalcFactor(Number(e.target.value)),children:["0.33","0.38","0.42"].map(v=>jsx("option",{children:v},v))})]}),jsx("label",{children:["Cantidad",jsx("input",{type:"number",min:"1",value:calcQuantity,onChange:e=>setCalcQuantity(Math.max(1,Number(e.target.value)||1))})]}),jsx("button",{onClick:()=>{setSaved(true);window.setTimeout(()=>setSaved(false),1200)},children:saved?"Actualizado":"Recalcular"})]}),
       jsxs("div",{className:"pp-calc-table",children:[jsx("table",{children:jsxs("tbody",{children:[jsxs("tr",{children:["N°","ALA ANT.","ÁNGULO","SENTIDO","ALA POST.","V APERTURA","RADIO INT.","BA","BD"].map(v=>jsx("th",{children:v},v))}),bends.map((b,i)=>jsxs("tr",{onClick:()=>{setStep(i);setPositioning(false);setFinished(false)},className:i===step?"is-selected":"",children:[jsx("td",{children:i+1}),jsx("td",{children:Number(b.position||45).toFixed(2)}),jsx("td",{children:(b.angle||90)+"°"}),jsx("td",{className:Number(b.angle)<0?"down":"up",children:Number(b.angle)<0?"↓":"↑"}),jsx("td",{children:Number(b.length||90).toFixed(2)}),jsx("td",{children:i%2?"V16":"V12"}),jsx("td",{children:Number(b.radius||2).toFixed(2)}),jsx("td",{children:computed.rows[i]?.ba.toFixed(2).replace(".",",")||"0,00"}),jsx("td",{children:computed.rows[i]?.bd.toFixed(2).replace(".",",")||"0,00"})]},b.id||i))]})}),jsx("svg",{className:"pp-flat-pattern",viewBox:"0 0 360 76",children:[jsx("path",{d:flatPath,fill:"none",stroke:"#96a9bb","stroke-width":"2"}),Array.from({length:Math.max(1,bends.length)},(_,i)=>{const x=18+i*(324/Math.max(1,bends.length));return jsx("path",{d:"M"+x+" 13v51",stroke:i===step?"#ffffff":i%2?"#b264ff":"#46a8ff","stroke-width":i===step?2:1,"stroke-dasharray":"4 4",className:"pp-flat-fold"},i)}),jsx("text",{x:"176",y:"73",fill:"#54b6ff",children:computed.flat.toFixed(2).replace(".",",")+" mm"})]})]})
      ]}),
      jsx("div",{className:"pp-totals",children:[["Suma tramos",computed.sum.toFixed(2).replace(".",",")+" mm"],["BA total",computed.ba.toFixed(2).replace(".",",")+" mm"],["BD total",computed.bd.toFixed(2).replace(".",",")+" mm"],["Desarrollo por pieza",computed.flat.toFixed(2).replace(".",",")+" mm"],["Desarrollo total",computed.total.toFixed(2).replace(".",",")+" mm"]].map(([k,v],i)=>jsxs("div",{className:i===4?"featured":"",children:[jsx("small",{children:k}),jsx("b",{children:v})]},k))})
     ]}),
     jsxs("section",{className:"pp-libraries",children:[
      jsxs("section",{className:"pp-library-card pp-machines",children:[jsxs("header",{children:[jsx("h2",{children:"BIBLIOTECA DE MÁQUINAS"}),jsx("button",{onClick:()=>goto("/bibliotecas"),children:"Ver todas"})]}),jsx("div",{className:"pp-machine-list",children:machines.slice(0,5).map((m,i)=>jsxs("button",{className:m.id===state.selectedMachineId||(!state.selectedMachineId&&m.id===machine?.id)?"selected":"",onClick:()=>state.setMachine?.(m.id),children:[jsx("div",{className:"pp-machine-thumb",children:jsx("div",{className:"pp-machine-drawing",children:[jsx("i",{}),jsx("b",{}),jsx("span",{})]})}),jsx("small",{children:m.manufacturer+" "+m.name})]},m.id))})]}),
       jsxs("section",{className:"pp-library-card pp-tooling",children:[jsxs("header",{children:[jsx("h2",{children:"UTILLAJE"}),jsx("div",{children:["PUNZONES","MATRICES","ADAPTADORES","ACCESORIOS"].map(v=>jsx("button",{className:toolTab===v?"active":"",onClick:()=>setToolTab(v),children:v},v))})]}),jsx("div",{className:"pp-tool-list",children:visibleTools.length?visibleTools.slice(0,7).map(t=>jsxs("button",{className:(t.id===state.selectedPunchId||t.id===state.selectedDieId)?"selected":"",onClick:()=>{if(t.kind==="punch")state.setPunch?.(t.id);else state.setDie?.(t.id)},children:[jsx("span",{className:"pp-tool-drawing",children:jsx("i",{})}),jsx("small",{children:t.name.split(" ").slice(0,3).join(" ")})]},t.id)):jsx("p",{className:"pp-empty-tool",children:"Sin elementos registrados en el catálogo"})})]}),
       jsxs("section",{className:"pp-library-card pp-materials",children:[jsxs("header",{children:[jsx("h2",{children:"MATERIALES"}),jsx("button",{onClick:()=>goto("/materiales"),children:"Ver todos"})]}),jsxs("table",{children:[jsx("thead",{children:jsx("tr",{children:["MATERIAL","ESPESOR (mm)","LÍMITE ELÁSTICO (MPa)","RESISTENCIA (MPa)","K-FACTOR"].map(v=>jsx("th",{children:v},v))})}),jsx("tbody",{children:MATERIALS.map(row=>jsx("tr",{className:calcMaterial===row[0]?"is-selected":"",onClick:()=>{setCalcMaterial(row[0]);setCalcFactor(Number(row[4]))},children:row.map((v,i)=>jsx("td",{children:v},i))},row[0]))})]})]})
     ]})
    ]})
   ]}),
  ]}),
  jsx("footer",{className:"pp-bottom-bar",children:[...NAV.flatMap(x=>x[1]).slice(0,14).map(([label,path])=>jsx("button",{className:label==="Programar pieza"?"active":"",onClick:()=>goto(path),children:[jsx("span",{children:GLYPHS[label]||"◇"}),jsx("small",{children:label==="Programación 2D"?"Prog. 2D":label==="Programación 3D"?"Prog. 3D":label==="Simulación 2D"?"Simul. 2D":label==="Simulación 3D"?"Simul. 3D":label==="Calculadora desarrollo"?"Calc. desarrollo":label==="Diseño CAD/CAM 3D"?"CAD/CAM 3D":label})]},path)),jsxs("div",{className:"pp-bottom-status",children:[jsx("span",{children:online?"●  Sincronizado":"●  Sin conexión"}),jsx("span",{children:online?"◉  Conectado":"◌  Sin conexión"}),jsx("b",{children:new Date(clockNow).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}),jsx("small",{children:new Date(clockNow).toLocaleDateString("es-ES")})]})]})
 ]});
}
export{DashboardPage};
