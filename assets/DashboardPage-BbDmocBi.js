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
 const [playing,setPlaying]=React.useState(false);
 const [saved,setSaved]=React.useState(false);
 const [view,setView]=React.useState("Isométrica");
 const [toolTab,setToolTab]=React.useState("PUNZONES");
 const [toggles,setToggles]=React.useState({Ejes:true,Guías:true,Cotas:true,Malla:true,Restricciones:true});
 const [force,setForce]=React.useState(32.5);
 const bend=bends[Math.min(step,Math.max(0,bends.length-1))];
 const [positioning,setPositioning]=React.useState(false);
 const [finished,setFinished]=React.useState(false);
 const angle=bend?.angle||90;
 const sequence=["Posicionar chapa",...bends.map((b,i)=>"Plegado "+(b.order||i+1)),"Pieza terminada"];
 const activeStep=finished?sequence.length-1:positioning?0:Math.min(step+1,sequence.length-2);
 const visibleTools=toolTab==="PUNZONES"?tools.filter(t=>t.kind==="punch"):toolTab==="MATRICES"?tools.filter(t=>t.kind==="die"):tools.slice(0,7);
 React.useEffect(()=>{if(!playing)return;if(step>=Math.max(0,bends.length-1)){setPlaying(false);setFinished(true);setPositioning(false);return}const timer=window.setTimeout(()=>setStep(s=>s+1),1000);return()=>window.clearTimeout(timer)},[playing,step,bends.length]);
 React.useEffect(()=>{if(bends.length)setStep(s=>Math.min(s,bends.length-1));else setStep(0)},[bends.length]);
 const goto=(path)=>navigate(path);
 const next=()=>{setPositioning(false);setFinished(false);setStep(s=>Math.min(Math.max(0,bends.length-1),s+1))};
 const previous=()=>setStep(s=>Math.max(0,s-1));
 const share=async()=>{try{await navigator.clipboard.writeText(window.location.href);window.alert("Enlace del espacio de trabajo copiado.")}catch{window.prompt("Copia el enlace del espacio de trabajo:",window.location.href)}};
 const toggle=k=>setToggles(v=>({...v,[k]:!v[k]}));
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
       jsx("label",{children:["Velocidad",jsx("select",{defaultValue:"1.0x",children:["0.5x","1.0x","1.5x","2.0x"].map(v=>jsx("option",{children:v},v))})]})
      ]}),
      jsxs("div",{className:"pp-sim-content",children:[
       jsxs("div",{className:"pp-machine-stage",children:[
        jsx("div",{className:"pp-stage-grid",style:{display:toggles.Malla?"":"none"}}),
        jsxs("div",{className:"pp-machine-art",style:{transform:view==="Lateral"?"scaleX(.7) skewY(-3deg)":view==="Superior"?"scale(.82) rotateX(55deg)":view==="Frontal"?"scaleX(1.04)":"",transition:"transform .2s ease"},children:[
         jsx("div",{className:"pp-press-header",children:jsx("strong",{children:machineName})}),
         jsx("div",{className:"pp-red-cap pp-red-left"}),
         jsx("div",{className:"pp-red-cap pp-red-right"}),
         jsx("div",{className:"pp-press-ram",style:{transform:"translateY("+Math.max(0,(90-angle)*.1)+"px)"}}),
         jsx("div",{className:"pp-finger-row",children:Array.from({length:12},(_,i)=>jsx("i",{},i))}),
         jsx("div",{className:"pp-press-table"}),
         jsx("div",{className:"pp-column pp-column-left"}),
         jsx("div",{className:"pp-column pp-column-right"}),
         jsx("div",{className:"pp-workpiece",style:{"--pp-angle":Math.max(0,90-angle)+"deg"},children:[jsx("i",{}),jsx("i",{}),jsx("i",{})]}),
         jsxs("div",{className:"pp-console",children:[jsx("div",{children:"XPERT"}),jsx("b",{children:"Y1 · Y2"}),jsx("small",{children:"32.5 t"})]})
        ]}),
        jsxs("div",{className:"pp-axis-cube",style:{display:toggles.Ejes?"":"none"},children:[jsx("span",{children:"Z"}),jsx("i",{}),jsx("b",{children:"Y"}),jsx("em",{children:"X"})]}),
        jsxs("div",{className:"pp-sequence",children:[jsx("h2",{children:"SECUENCIA DE PLEGADO"}),jsx("div",{className:"pp-sequence-list",children:sequence.map((label,i)=>jsxs("button",{className:i===activeStep?"active":"",onClick:()=>{setPlaying(false);setPositioning(i===0);setFinished(i===sequence.length-1);setStep(Math.max(0,Math.min(bends.length-1,i-1)))},children:[jsx("b",{children:i+1}),jsx("svg",{viewBox:"0 0 72 38",children:jsx("path",{d:"M4 20h22l9-10h14l8 10h12",fill:"none",stroke:"currentColor",strokeWidth:"4",strokeLinejoin:"round"})}),jsx("span",{children:label})]},i))})]})
       ]}),
       jsxs("aside",{className:"pp-info",children:[
        jsxs("header",{children:[jsx("b",{children:"INFORMACIÓN"}),jsx("button",{onClick:e=>e.currentTarget.closest(".pp-info").classList.toggle("collapsed"),children:"⌄"})]}),
        jsx("dl",{children:[["Máquina",machineName],["Punzón",punch?.name||"88° R1"],["Matriz",die?.name||"V16 68°"],["Material",project.material||"Acero S235JR"],["Espesor",Number(project.thickness||2).toFixed(2)+" mm"],["Longitud",Number(project.length||1000)+" mm"],["Fuerza actual",(bend?.forceKnM||force)+" Ton"],["Ángulo actual",angle+"°"],["Estado",positioning?"Posicionando":playing?"Plegando":"Listo"]].map(([k,v])=>jsxs("div",{children:[jsx("dt",{children:k}),jsx("dd",{className:k==="Estado"?"ok":"",children:v})]},k))}),
        jsx("div",{className:"pp-sensors",children:[jsx("h3",{children:"SENSORES EN TIEMPO REAL"}),jsx("div",{className:"pp-gauges",children:[["Fuerza (Ton)",force,"100"],["Ángulo (°)",angle,"90"]].map(([label,val,max])=>jsxs("div",{className:"pp-gauge",children:[jsx("small",{children:label}),jsx("div",{className:"pp-gauge-ring",style:{"--value":Math.min(100,Number(val)/Number(max)*100)+"%"}}),jsx("b",{children:label.startsWith("Fuerza")?Number(val).toFixed(1).replace(".",","):val+"°"}),jsx("span",{children:"0                 "+max})]},label))})]}),
        jsxs("label",{className:"pp-y-control",children:[jsx("small",{children:"Posición Y (mm)"}),jsx("input",{type:"range",min:"0",max:"300",defaultValue:"112.8",onChange:e=>e.currentTarget.nextSibling.textContent=Number(e.target.value).toFixed(2)}),jsx("b",{children:"112,80"})]})
       ]})
      ]})
     ]}),
     jsxs("aside",{className:"pp-visual-tools pp-panel",children:[
      jsx("h2",{children:"VISTA"}),
      jsx("div",{className:"pp-view-list",children:["Frontal","Lateral","Superior","Isométrica"].map((v,i)=>jsx("button",{className:view===v?"selected":"",onClick:()=>setView(v),children:[jsx("span",{children:["⬡","◇","▱","◈"][i]}),v]},v))}),
      jsx("h2",{className:"pp-subtitle",children:"HERRAMIENTAS VISUALES"}),
      jsx("div",{className:"pp-tool-buttons",children:["Rotar","Medir","Sección","Ejes","Encuadre","Aislar"].map((v,i)=>jsx("button",{title:v,onClick:()=>i===0?setView(view==="Isométrica"?"Frontal":"Isométrica"):toggle(v),children:["⟳","⌖","◉","✣","⌕","▣"][i]},v))}),
      jsx("div",{className:"pp-toggle-grid",children:["Ejes","Guías","Cotas","Malla","Restricciones"].map(v=>jsxs("button",{onClick:()=>toggle(v),children:[v,jsx("i",{className:toggles[v]?"on":""})]},v))}),
      jsx("h2",{className:"pp-subtitle",children:"SECCIÓN"}),
      jsx("div",{className:"pp-sections",children:["▧","▤","▥","⬡","⬢"].map((v,i)=>jsx("button",{className:i===2?"selected":"",title:"Sección "+(i+1),onClick:e=>{e.currentTarget.parentElement.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));e.currentTarget.classList.add("selected")},children:v},i))})
     ]})
    ]}),
    jsxs("section",{className:"pp-bottom-grid",children:[
     jsxs("section",{className:"pp-programming pp-panel",children:[
      jsxs("header",{className:"pp-card-heading",children:[jsxs("div",{children:[jsx("h2",{children:"PROGRAMACIÓN 2D / 3D"}),jsx("p",{children:"Edición sincronizada de la pieza"})]}),jsx("button",{onClick:()=>goto("/programacion-2d"),children:"Abrir"})]}),
      jsxs("div",{className:"pp-views-2d3d",children:[
       jsxs("button",{className:"pp-mini-cad",onClick:()=>goto("/programacion-2d"),children:[jsx("b",{children:"VISTA 2D"}),jsx("svg",{viewBox:"0 0 240 170",children:[jsx("path",{d:"M36 42h166v23h-46v70h-74V65H36z",fill:"none",stroke:"#d6dfec","stroke-width":"2"}),jsx("path",{d:"M82 38v100M156 60v77",stroke:"#9b59ff","stroke-dasharray":"6 4"}),jsx("text",{x:"103",y:"31",fill:"#eaf1ff",children:"120,00"}),jsx("text",{x:"17",y:"94",fill:"#eaf1ff",children:"45,00"}),jsx("text",{x:"83",y:"82",fill:"#43e485",children:"P2 -90°"}),jsx("text",{x:"158",y:"82",fill:"#bd7aff",children:"P3 90°"})]})]}),
       jsxs("button",{className:"pp-mini-3d",onClick:()=>goto("/programacion-3d"),children:[jsx("b",{children:"VISTA 3D"}),jsx("svg",{viewBox:"0 0 150 170",children:[jsx("path",{d:"M34 83l50-31 38 23-47 31z",fill:"#8497a9",stroke:"#e2eaf3","stroke-width":"2"}),jsx("path",{d:"M34 83v40l41 25v-42m47-31v41l-47 32",fill:"none",stroke:"#d9e4ef","stroke-width":"2"}),jsx("circle",{cx:"34",cy:"81",r:"9",fill:"#2656df"}),jsx("text",{x:"31",y:"84",fill:"#fff",children:"1"}),jsx("circle",{cx:"122",cy:"73",r:"9",fill:"#2656df"}),jsx("text",{x:"119",y:"76",fill:"#fff",children:"3"})]})]})
      ]}),
      jsxs("div",{className:"pp-bend-table",children:[jsx("h3",{children:"TABLA DE PLIEGUES"}),jsx("table",{children:jsxs("tbody",{children:[jsxs("tr",{children:["N°","POSICIÓN X","LONGITUD","ÁNGULO","SENTIDO","RADIO INT.","DIRECCIÓN"].map(v=>jsx("th",{children:v},v))}),bends.slice(0,3).map((b,i)=>jsxs("tr",{children:[jsx("td",{children:i+1}),jsx("td",{children:Number(b.position||45).toFixed(2)}),jsx("td",{children:Number(b.length||project.width||90).toFixed(2)}),jsx("td",{children:(b.angle||90)+"°"}),jsx("td",{className:i%2?"down":"up",children:i%2?"↓":"↑"}),jsx("td",{children:Number(b.radius||2).toFixed(2)}),jsx("td",{children:"Interior"})]},b.id||i))]})})]}),
      ]}),
     jsxs("section",{className:"pp-calculator pp-panel",children:[
      jsxs("header",{className:"pp-card-heading",children:[jsxs("div",{children:[jsx("h2",{children:"CALCULADORA DE DESARROLLO MULTIPLEGADO"}),jsx("p",{children:"Cálculo preciso con apertura V por pliegue"})]}),jsx("button",{onClick:()=>goto("/calculadora-desarrollo"),children:"Exportar informe"})]}),
      jsxs("div",{className:"pp-calc-row",children:[
       jsxs("section",{className:"pp-calc-params",children:[jsx("b",{children:"PARÁMETROS GENERALES"}),jsx("label",{children:["Material",jsx("select",{defaultValue:project.material||"Acero S235JR",children:["Acero S235JR","Acero Inox AISI 304","Aluminio 5754"].map(v=>jsx("option",{children:v},v))})]}),jsx("label",{children:["Espesor (mm)",jsx("input",{type:"number",min:"0.5",step:"0.1",defaultValue:project.thickness||2})]}),jsx("label",{children:["Factor K",jsx("select",{defaultValue:"0.38",children:["0.33","0.38","0.42"].map(v=>jsx("option",{children:v},v))})]}),jsx("label",{children:["Cantidad",jsx("input",{type:"number",min:"1",defaultValue:"1"})]}),jsx("button",{onClick:()=>goto("/calculadora-desarrollo"),children:"Recalcular"})]}),
       jsxs("div",{className:"pp-calc-table",children:[jsx("table",{children:jsxs("tbody",{children:[jsxs("tr",{children:["N°","ALA ANT.","ÁNGULO","SENTIDO","ALA POST.","V APERTURA","RADIO INT.","BA","BD"].map(v=>jsx("th",{children:v},v))}),bends.slice(0,3).map((b,i)=>jsxs("tr",{children:[jsx("td",{children:i+1}),jsx("td",{children:Number(b.position||45).toFixed(2)}),jsx("td",{children:(b.angle||90)+"°"}),jsx("td",{className:i%2?"down":"up",children:i%2?"↓":"↑"}),jsx("td",{children:Number(b.length||90).toFixed(2)}),jsx("td",{children:i%2?"V16":"V12"}),jsx("td",{children:Number(b.radius||2).toFixed(2)}),jsx("td",{children:"2,24"}),jsx("td",{children:"3,08"})]},b.id||i))]})}),jsx("svg",{className:"pp-flat-pattern",viewBox:"0 0 360 76",children:[jsx("path",{d:"M8 58V20h65v38h68V20h68v38h68V20h74",fill:"none",stroke:"#96a9bb","stroke-width":"2"}),[73,141,209,277].map((x,i)=>jsx("path",{d:"M"+x+" 13v51",stroke:i%2?"#b264ff":"#46a8ff","stroke-dasharray":"4 4"},x)),jsx("text",{x:"176",y:"73",fill:"#54b6ff",children:"289,28 mm"})]})]})
      ]}),
      jsx("div",{className:"pp-totals",children:[["Suma tramos","300,00 mm"],["BA total","7,84 mm"],["BD total","10,72 mm"],["Desarrollo por pieza","289,28 mm"],["Desarrollo total","289,28 mm"]].map(([k,v],i)=>jsxs("div",{className:i===4?"featured":"",children:[jsx("small",{children:k}),jsx("b",{children:v})]},k))})
     ]}),
     jsxs("section",{className:"pp-libraries",children:[
      jsxs("section",{className:"pp-library-card pp-machines",children:[jsxs("header",{children:[jsx("h2",{children:"BIBLIOTECA DE MÁQUINAS"}),jsx("button",{onClick:()=>goto("/bibliotecas"),children:"Ver todas"})]}),jsx("div",{className:"pp-machine-list",children:machines.slice(0,5).map((m,i)=>jsxs("button",{className:i===0?"selected":"",onClick:()=>goto("/bibliotecas"),children:[jsx("div",{className:"pp-machine-thumb",children:jsx("div",{className:"pp-machine-drawing",children:[jsx("i",{}),jsx("b",{}),jsx("span",{})]})}),jsx("small",{children:m.manufacturer+" "+m.name})]},m.id))})]}),
       jsxs("section",{className:"pp-library-card pp-tooling",children:[jsxs("header",{children:[jsx("h2",{children:"UTILLAJE"}),jsx("div",{children:["PUNZONES","MATRICES","ADAPTADORES","ACCESORIOS"].map(v=>jsx("button",{className:toolTab===v?"active":"",onClick:()=>setToolTab(v),children:v},v))})]}),jsx("div",{className:"pp-tool-list",children:visibleTools.slice(0,7).map(t=>jsxs("button",{onClick:()=>goto("/utillaje"),children:[jsx("span",{className:"pp-tool-drawing",children:jsx("i",{})}),jsx("small",{children:t.name.split(" ").slice(0,3).join(" ")})]},t.id))})]}),
       jsxs("section",{className:"pp-library-card pp-materials",children:[jsxs("header",{children:[jsx("h2",{children:"MATERIALES"}),jsx("button",{onClick:()=>goto("/materiales"),children:"Ver todos"})]}),jsxs("table",{children:[jsx("thead",{children:jsx("tr",{children:["MATERIAL","ESPESOR (mm)","LÍMITE ELÁSTICO (MPa)","RESISTENCIA (MPa)","K-FACTOR"].map(v=>jsx("th",{children:v},v))})}),jsx("tbody",{children:MATERIALS.map(row=>jsx("tr",{children:row.map((v,i)=>jsx("td",{children:v},i))},row[0]))})]})]})
     ]})
    ]})
   ]}),
  ]}),
  jsx("footer",{className:"pp-bottom-bar",children:[...NAV.flatMap(x=>x[1]).slice(0,14).map(([label,path])=>jsx("button",{className:label==="Programar pieza"?"active":"",onClick:()=>goto(path),children:[jsx("span",{children:GLYPHS[label]||"◇"}),jsx("small",{children:label==="Programación 2D"?"Prog. 2D":label==="Programación 3D"?"Prog. 3D":label==="Simulación 2D"?"Simul. 2D":label==="Simulación 3D"?"Simul. 3D":label==="Calculadora desarrollo"?"Calc. desarrollo":label==="Diseño CAD/CAM 3D"?"CAD/CAM 3D":label})]},path)),jsxs("div",{className:"pp-bottom-status",children:[jsx("span",{children:"●  Sincronizado"}),jsx("span",{children:"◉  Conectado"}),jsx("b",{children:new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}),jsx("small",{children:new Date().toLocaleDateString("es-ES")})]})]})
 ]});
}
export{DashboardPage};
