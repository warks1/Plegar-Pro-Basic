import{r as interop,t as ReactModule}from"./react-OrosJ8bI.js";
import{a as runtime,n as useAppStore,t as useActiveProject}from"./index-BejcmiWV.js";
import{t as Page}from"./Page-CANi1eAD.js";
import{n as machines,t as tools}from"./catalog-DRcBI5Du.js";
const React=interop(ReactModule(),1);
const {jsx,jsxs}=runtime();

function DataRows({rows}){
  return jsx("dl",{children:rows.map(([label,value])=>jsxs("div",{children:[jsx("dt",{children:label}),jsx("dd",{children:value})]},label))});
}

function SimulationPage({mode}){
  const project=useActiveProject();
  const state=useAppStore();
  const is3d=mode==="3d";
  const bends=project.bends||[];
  const count=Math.max(1,bends.length);
  const [step,setStep]=React.useState(()=>{try{const raw=window.localStorage.getItem("plegarpro-simulation-step:"+project.id);if(raw===null)return Math.min(1,count-1);const saved=Number(raw);return Number.isFinite(saved)?Math.max(0,Math.min(count-1,saved)):Math.min(1,count-1)}catch{return Math.min(1,count-1)}});
  const [playing,setPlaying]=React.useState(()=>{try{return window.sessionStorage.getItem("plegarpro-simulation-playing:"+project.id)==="true"}catch{return false}});
  const [zoom,setZoom]=React.useState(1);
  const [finished,setFinished]=React.useState(false);
  const [positioning,setPositioning]=React.useState(false);
  React.useEffect(()=>{
    try{window.sessionStorage.setItem("plegarpro-simulation-playing:"+project.id,String(playing))}catch{}
  },[project.id,playing]);
  React.useEffect(()=>{
    try{window.localStorage.setItem("plegarpro-simulation-step:"+project.id,String(step))}catch{}
    window.dispatchEvent(new CustomEvent("plegarpro:simulation-step",{detail:{projectId:project.id,step}}));
  },[project.id,step]);
  React.useEffect(()=>{
    const sync=event=>{if(event.detail?.projectId===project.id&&Number.isFinite(event.detail.step))setStep(Math.max(0,Math.min(count-1,event.detail.step)))};
    const storage=event=>{if(event.key==="plegarpro-simulation-step:"+project.id&&event.newValue!==null){const value=Number(event.newValue);if(Number.isFinite(value))setStep(Math.max(0,Math.min(count-1,value)))}};
    window.addEventListener("plegarpro:simulation-step",sync);
    window.addEventListener("storage",storage);
    return()=>{window.removeEventListener("plegarpro:simulation-step",sync);window.removeEventListener("storage",storage)};
  },[project.id,count]);
  React.useEffect(()=>{
    if(!playing)return;
    const timer=window.setInterval(()=>setStep(current=>Math.min(count-1,current+1)),900);
    return()=>window.clearInterval(timer);
  },[playing,count]);
  React.useEffect(()=>{
    if(playing&&step>=count-1){setPlaying(false);setFinished(true)}
  },[playing,step,count]);
  const machine=machines.find(item=>item.id===state.selectedMachineId)||machines[0];
  const punch=tools.find(item=>item.id===state.selectedPunchId&&item.kind==="punch")||tools.find(item=>item.kind==="punch");
  const die=tools.find(item=>item.id===state.selectedDieId&&item.kind==="die")||tools.find(item=>item.kind==="die");
  const bend=bends[step];
  const angle=bend?.angle??90;
  const sequence=["Posicionar chapa",...bends.map(item=>"Plegado "+item.order),"Pieza terminada"];
  const activeSequence=finished?sequence.length-1:(positioning||!bends.length)?0:step+1;
  const changeStep=next=>{setPlaying(false);setFinished(false);setPositioning(false);setStep(Math.max(0,Math.min(count-1,next)))};
  const rows=[
    ["Máquina",machine?.name||"Sin máquina"],
    ["Punzón",punch?.name||"Sin punzón"],
    ["Matriz",die?.name||"Sin matriz"],
    ["Espesor",project.thickness+" mm"],
    ["Material",project.material||"—"],
    ["Fuerza actual",bend?.forceKnM?bend.forceKnM+" kN":"—"],
    ["Ángulo actual",angle+"°"],
    ["Y actual",(bend?.backgaugeY??bend?.position??"—")+" mm"]
  ];
  const punchWidth=Math.max(42,Math.min(120,(punch?.headWidth||punch?.width||30)*1.8));
  const punchTipWidth=Math.max(0,Math.min(punchWidth*.55,(Number(punch?.tipWidth)||0)*1.8));
  const punchShoulder=270-Math.max(55,Math.min(120,(punch?.height||120)*.55));
  const punchTipDepth=Math.max(34,Math.min(90,Math.tan(Math.max(15,Math.min(88,(punch?.angle||88)/2))*Math.PI/180)*punchWidth*.72));
  const dieWidth=Math.max(70,Math.min(170,(die?.width||56)*1.65));
  const dieBaseWidth=Math.max(40,Math.min(170,(die?.baseWidth||die?.width||56)*1.65));
  const dieV=Math.max(35,Math.min(130,(die?.v||16)*3.1));
  const diePocketDepth=Math.max(20,Math.min(70,(Number(die?.depthMm)||16)*2.7));
  const diePocketDepth3d=Math.max(10,Math.min(36,(Number(die?.depthMm)||12)*2.35));
  const dieInsertPx=Math.max(12,Math.min(dieV,(Number(die?.dieInsertWidth)||0)*2.1));
  const foldDepth=Math.max(20,Math.min(92,38+(90-Math.abs(angle))*1.8));
  const ramTravel=Math.min(32,Math.max(0,(90-Math.abs(angle))*.7));
  const machineName=machine?.name||"TrumaBend V85";
  const machineBrand=machine?.manufacturer||"TRUMPF";
  const scene=is3d
    ? jsxs("div",{className:"sim3d-reference",style:{transform:"scale("+zoom+")"},children:[
        jsxs("svg",{className:"sim3d-machine-svg"+(playing?" is-playing":""),viewBox:"0 0 900 560",role:"img","aria-label":machineBrand+" "+machineName+" en simulación de plegado 3D",children:[
          jsx("defs",{children:[
            jsx("linearGradient",{id:"machine-front",x1:"0",x2:"0",y1:"0",y2:"1",children:[jsx("stop",{offset:"0%",stopColor:"#dce5e9"}),jsx("stop",{offset:"45%",stopColor:"#9caeb8"}),jsx("stop",{offset:"100%",stopColor:"#465b6a"})]}),
            jsx("linearGradient",{id:"machine-side",x1:"0",x2:"1",y1:"0",y2:"0",children:[jsx("stop",{offset:"0%",stopColor:"#30475b"}),jsx("stop",{offset:"55%",stopColor:"#172b3b"}),jsx("stop",{offset:"100%",stopColor:"#0b1723"})]}),
            jsx("linearGradient",{id:"machine-blue",x1:"0",x2:"0",y1:"0",y2:"1",children:[jsx("stop",{offset:"0%",stopColor:"#315a79"}),jsx("stop",{offset:"100%",stopColor:"#102537"})]}),
            jsx("linearGradient",{id:"machine-metal",x1:"0",x2:"0",y1:"0",y2:"1",children:[jsx("stop",{offset:"0%",stopColor:"#f0f4f5"}),jsx("stop",{offset:"45%",stopColor:"#8c9ca4"}),jsx("stop",{offset:"100%",stopColor:"#39464e"})]}),
            jsx("linearGradient",{id:"machine-screen",x1:"0",x2:"1",y1:"0",y2:"1",children:[jsx("stop",{offset:"0%",stopColor:"#0b2941"}),jsx("stop",{offset:"100%",stopColor:"#2aa4cf"})]})
          ]}),
          jsx("ellipse",{cx:"462",cy:"444",rx:"350",ry:"46",fill:"#0009"}),
          jsx("path",{d:"M90 410L180 374L760 371L825 405L730 450L145 452Z",fill:"#111c26",stroke:"#526573",strokeWidth:"2"}),
          jsx("path",{d:"M150 106L735 86L810 121L810 365L748 402L150 389Z",fill:"url(#machine-side)",stroke:"#7b909c",strokeWidth:"3"}),
          jsx("path",{d:"M150 106L735 86L735 350L150 370Z",fill:"url(#machine-front)",stroke:"#e1eaee",strokeWidth:"3"}),
          jsx("path",{d:"M735 86L810 121L810 365L748 402L735 350Z",fill:"url(#machine-side)",stroke:"#6c8190",strokeWidth:"2"}),
          jsx("path",{d:"M168 122L712 104L712 187L168 202Z",fill:"#b9c8ce",stroke:"#eef3f5",strokeWidth:"2"}),
          jsx("path",{d:"M171 199L712 185L712 225L171 239Z",fill:"#203645",stroke:"#536d7c",strokeWidth:"2"}),
          jsx("path",{d:"M187 209L696 196L696 221L187 234Z",fill:"#111a20"}),
          jsx("path",{d:"M160 239L730 224L730 353L160 369Z",fill:"#203b50",stroke:"#8195a1",strokeWidth:"2"}),
          jsx("path",{d:"M163 244L727 230L727 253L163 267Z",fill:"#142737"}),
          jsx("path",{d:"M180 257L707 244L707 269L180 283Z",fill:"url(#machine-metal)",stroke:"#e1e8eb",strokeWidth:"2"}),
          jsx("path",{d:"M180 283L707 269L707 296L180 311Z",fill:"#253746"}),
          jsx("path",{d:"M183 297L705 284L705 307L183 321Z",fill:"url(#machine-metal)",stroke:"#9eacb2",strokeWidth:"2"}),
          jsx("path",{d:"M196 308L680 296L680 342L196 355Z",fill:"#111c25",stroke:"#8998a0",strokeWidth:"2"}),
          jsx("path",{d:"M205 320L674 308L674 332L205 344Z",fill:"#304653"}),
          jsx("path",{d:"M194 350L690 337L735 353L226 372Z",fill:"url(#machine-metal)",stroke:"#f1f4f4",strokeWidth:"2"}),
          jsx("path",{d:"M226 371L735 353L735 379L232 401Z",fill:"url(#machine-side)",stroke:"#758791",strokeWidth:"2"}),
          jsx("path",{d:"M180 372L232 371L232 403L181 406Z",fill:"#31495a"}),
          jsx("path",{d:"M690 337L735 353L735 379L690 376Z",fill:"#182a37"}),
          jsx("path",{d:"M242 367L257 367L257 405L242 406Z",fill:"#0d1922"}),
          jsx("path",{d:"M655 355L670 354L670 394L655 395Z",fill:"#0d1922"}),
          jsxs("g",{className:"sim3d-moving-ram",style:{transform:"translateY("+ramTravel+"px)"},children:[
            jsx("path",{d:"M206 249L681 237L681 267L206 280Z",fill:"url(#machine-metal)",stroke:"#f3f6f7",strokeWidth:"2"}),
            jsx("path",{d:"M218 279L668 267L668 289L218 301Z",fill:"#53646d",stroke:"#a9b6bc",strokeWidth:"2"}),
            jsx("path",{d:"M416 295L487 293L478 328L450 348L426 327Z",fill:"url(#machine-front)",stroke:"#ecf1f2",strokeWidth:"2"})
          ]}),
          jsx("path",{d:"M238 343L668 332L699 345L267 360Z",fill:"#8f9da4",stroke:"#dce4e7",strokeWidth:"2"}),
          jsx("path",{d:"M267 360L699 345L699 359L267 375Z",fill:"#3b4b54",stroke:"#73828a",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieWidth/2)+" 350L"+(450-dieV/2)+" 350L450 "+(350+diePocketDepth3d)+"L"+(450+dieV/2)+" 350L"+(450+dieWidth/2)+" 350L"+(450+dieBaseWidth/2)+" 363L"+(450-dieBaseWidth/2)+" 363Z",fill:"#75848b",stroke:"#d7e0e3",strokeWidth:"2"}),
          jsx("path",{d:"M306 339L450 "+(339+foldDepth*.42)+"L594 339",fill:"none",stroke:"#c8e8f4",strokeWidth:"5","stroke-linecap":"round","stroke-linejoin":"round",className:"sim3d-workpiece",key:"3d-part-"+step+"-"+angle,children:jsx("animate",{attributeName:"d",from:"M306 339L450 339L594 339",to:"M306 339L450 "+(339+foldDepth*.42)+"L594 339",dur:"450ms",fill:"freeze"})}),
          jsx("path",{d:"M"+(450-punchWidth/2)+" 303H"+(450+punchWidth/2)+"L"+(450+punchTipWidth/2)+" 340H"+(450-punchTipWidth/2)+"Z",fill:"url(#machine-metal)",stroke:"#edf2f4",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieInsertPx/2)+" "+(363+diePocketDepth3d*.35)+"H"+(450+dieInsertPx/2),stroke:"#44c5ee",strokeWidth:"2",opacity:".9"}),
          jsx("path",{d:"M120 108L150 107L150 386L120 392Z",fill:"#193247",stroke:"#6f8795",strokeWidth:"2"}),
          jsx("path",{d:"M132 128L143 128L143 153L132 154Z",fill:"#8fc8ec"}),
          jsx("path",{d:"M" +(machineBrand==="TRUMPF"?184:181)+" 137h60v25h-60z",fill:"#1b3c59"}),
          jsx("text",{x:"214",y:"154",textAnchor:"middle",fill:"#f1f5f7",fontSize:"12",fontWeight:"700",children:machineBrand}),
          jsx("text",{x:"440",y:"157",textAnchor:"middle",fill:"#263e4d",fontSize:"14",fontWeight:"700",letterSpacing:"2",children:machineName.toUpperCase()}),
          jsx("path",{d:"M739 143L789 151L789 295L739 286Z",fill:"#0a1520",stroke:"#8596a0",strokeWidth:"2"}),
          jsx("path",{d:"M745 152L783 158L783 231L745 225Z",fill:"url(#machine-screen)",stroke:"#b7c9d2",strokeWidth:"2"}),
          jsx("path",{d:"M750 161L778 165M750 171L778 175M750 181L769 184",stroke:"#79e0ff",strokeWidth:"2"}),
          jsx("circle",{cx:"754",cy:"248",r:"5",fill:"#50db90"}),jsx("circle",{cx:"773",cy:"251",r:"5",fill:"#ffbe50"}),
          jsx("path",{d:"M730 290L786 300L786 311L730 302Z",fill:"#657781"}),
          jsx("path",{d:"M275 191h26v7h-26zM320 190h4v7h-4zM342 189h4v7h-4zM364 188h4v7h-4zM386 187h4v7h-4zM408 186h4v7h-4zM430 185h4v7h-4zM452 184h4v7h-4zM474 183h4v7h-4zM496 182h4v7h-4zM518 181h4v7h-4zM540 180h4v7h-4zM562 179h4v7h-4zM584 178h4v7h-4zM606 177h4v7h-4zM628 176h4v7h-4z",fill:"#162938"}),
          jsx("path",{d:"M157 392H735",stroke:"#9aaab1",strokeWidth:"2",opacity:".6"}),
          jsx("text",{x:"450",y:"470",textAnchor:"middle",fill:"#c5d9e1",fontSize:"13",letterSpacing:"1.5",children:machineBrand+" · "+machineName}),
          jsx("text",{x:"450",y:"493",textAnchor:"middle",fill:"#67d8ff",fontSize:"12",children:"PUNZÓN "+(punch?.name||"—")+"   ·   MATRIZ V"+(die?.v||"—")+"   ·   "+angle+"°"}),
          jsx("path",{d:"M215 421H700",stroke:"#2ac3ff",strokeWidth:"1",strokeDasharray:"5 8",opacity:".25"})
        ]})
      ]})
    : jsxs("div",{className:"sim2d-reference",style:{transform:"scale("+zoom+")"},children:[
        jsx("div",{className:"sim2d-step-tabs",children:sequence.slice(0,9).map((label,index)=>jsx("button",{
          type:"button",className:index===activeSequence?"active":"",
          "aria-label":"Ir a "+label,
          onClick:()=>{setPlaying(false);if(index===0){setFinished(false);setPositioning(true);setStep(0)}else if(index===sequence.length-1){setPositioning(false);setFinished(true);setStep(count-1)}else{setPositioning(false);setFinished(false);setStep(index-1)}},
          children:index+1
        },label))}),
        jsxs("svg",{className:"sim2d-drawing",viewBox:"0 0 900 560",role:"img","aria-label":"Simulación 2D del punzón y la matriz V seleccionados",children:[
          jsx("defs",{children:[
            jsx("pattern",{id:"sim2d-grid",width:"40",height:"40",patternUnits:"userSpaceOnUse",children:jsx("path",{d:"M40 0H0V40",fill:"none",stroke:"#3d696d",strokeWidth:"1",opacity:".3"})}),
            jsx("linearGradient",{id:"sim2d-punch-metal",x1:"0",x2:"1",y1:"0",y2:"1",children:[
              jsx("stop",{offset:"0%",stopColor:"#d8c4dc"}),jsx("stop",{offset:"50%",stopColor:"#b7a0bf"}),jsx("stop",{offset:"100%",stopColor:"#8a7895"})
            ]}),
            jsx("linearGradient",{id:"sim2d-die-metal",x1:"0",x2:"0",y1:"0",y2:"1",children:[
              jsx("stop",{offset:"0%",stopColor:"#bba7c0"}),jsx("stop",{offset:"100%",stopColor:"#776881"})
            ]})
          ]}),
          jsx("rect",{width:"900",height:"560",fill:"#628b91"}),
          jsx("rect",{x:"0",y:"0",width:"900",height:"560",fill:"url(#sim2d-grid)"}),
          jsx("path",{d:"M45 352H398",stroke:"#b8d9dd",strokeWidth:"1",strokeDasharray:"5 8",opacity:".35"}),
          jsx("path",{d:"M502 352H855",stroke:"#b8d9dd",strokeWidth:"1",strokeDasharray:"5 8",opacity:".35"}),
          jsx("path",{d:"M450 110V445",stroke:"#c2dfe0",strokeWidth:"1",strokeDasharray:"5 7",opacity:".45"}),
          jsx("path",{d:"M450 "+(351+foldDepth)+"L450 440",stroke:"#eaf5f4",strokeWidth:"1.5",strokeDasharray:"4 5",opacity:".6"}),
          jsx("path",{d:"M"+(450-dieWidth/2)+" 375H"+(450-dieV/2)+"L450 "+(375+diePocketDepth)+"L"+(450+dieV/2)+" 375H"+(450+dieWidth/2)+"L"+(450+dieBaseWidth/2)+" 468H"+(450-dieBaseWidth/2)+"Z",fill:"url(#sim2d-die-metal)",stroke:"#81778a",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieWidth/2-12)+" 375H"+(450-dieWidth/2)+"V468H"+(450-dieWidth/2-12)+"Z",fill:"#526e60"}),
          jsx("path",{d:"M"+(450+dieWidth/2)+" 375H"+(450+dieWidth/2+12)+"V468H"+(450+dieWidth/2)+"Z",fill:"#526e60"}),
          jsx("path",{d:"M"+(450-punchWidth/2)+" "+punchShoulder+"H"+(450+punchWidth/2)+"V"+(punchShoulder+48)+"L"+(450+punchTipWidth/2)+" "+(punchShoulder+48+punchTipDepth)+"H"+(450-punchTipWidth/2)+"L"+(450-punchWidth/2)+" "+(punchShoulder+48)+"Z",fill:"url(#sim2d-punch-metal)",stroke:"#e4d7e5",strokeWidth:"2",className:"sim2d-tool-shape"}),
          jsx("path",{d:"M"+(450-punchWidth*.2)+" "+(punchShoulder+48)+"V"+(punchShoulder+118)+"H"+(450+punchWidth*.2)+"V"+(punchShoulder+48),fill:"#a48ead",opacity:".85"}),
          jsx("path",{d:"M450 130V"+(punchShoulder-4),stroke:"#263e3f",strokeWidth:"10",opacity:".9"}),
          jsx("path",{key:"sheet-"+step+"-"+angle,d:"M75 351H400L450 "+(351+foldDepth)+"L500 351H825",fill:"none",stroke:"#e5eff0",strokeWidth:"4",strokeLinecap:"round",strokeLinejoin:"round",className:"sim2d-workpiece",children:jsx("animate",{attributeName:"d",from:"M75 351H400L450 351L500 351H825",to:"M75 351H400L450 "+(351+foldDepth)+"L500 351H825",dur:"450ms",fill:"freeze"})}),
          jsx("circle",{cx:"450",cy:String(351+foldDepth),r:"5",fill:"#e6f5f1",stroke:"#425e5e",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieInsertPx/2)+" 447H"+(450+dieInsertPx/2),stroke:"#a9e7e0",strokeWidth:"2"}),
          jsx("text",{x:"450",y:"500",textAnchor:"middle",className:"sim2d-die-label",children:"MATRIZ V"+(die?.v||"—")+" · "+(die?.angle||"—")+"°"}),
          jsx("text",{x:"450",y:"80",textAnchor:"middle",className:"sim2d-punch-label",children:(punch?.name||"Punzón")+" · "+(punch?.angle||"—")+"°"}),
          jsx("text",{x:"535",y:String(343+foldDepth/2),className:"sim2d-angle",children:angle+"°"}),
          jsx("path",{d:"M517 "+(349+foldDepth/2)+"l-11 12 14 2",fill:"none",stroke:"#b6f47a",strokeWidth:"2"}),
          jsx("path",{d:"M80 328v-13m0 0-5 6m5-6 5 6M820 328v-13m0 0-5 6m5-6 5 6",stroke:"#d6e7e4",strokeWidth:"1.5",fill:"none",opacity:".75"})
        ]}),
        jsxs("div",{className:"sim2d-selection",children:[
          jsxs("label",{children:[jsx("span",{children:"Punzón seleccionado"}),jsx("select",{value:punch?.id||"",onChange:event=>state.setPunch?.(event.target.value),children:tools.filter(item=>item.kind==="punch").map(item=>jsx("option",{value:item.id,children:item.name},item.id))})]}),
          jsxs("label",{children:[jsx("span",{children:"Matriz V seleccionada"}),jsx("select",{value:die?.id||"",onChange:event=>state.setDie?.(event.target.value),children:tools.filter(item=>item.kind==="die").map(item=>jsx("option",{value:item.id,children:item.name},item.id))})]}),
          jsxs("div",{className:"sim2d-angle-readout",children:[jsx("small",{children:"ÁNGULO"}),jsx("strong",{children:angle+"°"})]})
        ]})
      ]});
  const toolsRail=jsx("div",{className:"sim-ref-tools","aria-label":"Herramientas de vista",children:[
    jsx("button",{type:"button","aria-label":"Acercar",onClick:()=>setZoom(value=>Math.min(1.5,value+.1)),children:"＋"}),
    jsx("button",{type:"button","aria-label":"Alejar",onClick:()=>setZoom(value=>Math.max(.7,value-.1)),children:"−"}),
    jsx("button",{type:"button","aria-label":"Centrar vista",onClick:()=>setZoom(1),children:"⌕"}),
    jsx("button",{type:"button","aria-label":"Paso anterior",onClick:()=>changeStep(step-1),children:"‹"}),
    jsx("button",{type:"button","aria-label":"Paso siguiente",onClick:()=>changeStep(step+1),children:"›"})
  ]});
  return jsx(Page,{title:is3d?"Simulación 3D":"Simulación 2D",subtitle:is3d?"Visualización realista de la máquina y la secuencia de plegado":"Secuencia de plegado en vista plana",children:jsx("div",{className:is3d?"sim-ref-shell":"sim-ref-shell sim-ref-2d",children:[
    jsxs("div",{className:"sim-ref-player",children:[
      jsxs("div",{className:"sim-ref-controls",children:[
        jsx("button",{type:"button","aria-label":playing?"Pausar":"Reproducir",onClick:()=>setPlaying(value=>{if(!value){setPositioning(false);setFinished(false)}return !value}),children:playing?"Ⅱ":"▶"}),
        jsx("button",{type:"button","aria-label":"Reiniciar",onClick:()=>{setPlaying(false);setFinished(false);setPositioning(true);setStep(0)},children:"↺"}),
        jsx("button",{type:"button","aria-label":"Paso anterior",onClick:()=>changeStep(step-1),children:"◀"}),
        jsx("button",{type:"button","aria-label":"Paso siguiente",onClick:()=>changeStep(step+1),children:"▶▶"})
      ]}),
      jsx("strong",{children:"Paso "+(step+1)+" / "+count}),
      jsx("span",{children:positioning?"Posicionar chapa":finished?"Pieza terminada":bend?"Plegado "+bend.order+" de "+count:"Sin plegados"}),
      jsx("div",{className:"sim-ref-progress","aria-label":"Progreso de la simulación",children:jsx("i",{style:{width:(finished?100:positioning?0:(step+1)/count*100)+"%"}})})
    ]}),
    jsxs("div",{className:"sim-ref-body",children:[
      toolsRail,
      jsx("div",{className:"sim-ref-stage",children:[scene,jsx("div",{className:"sim-ref-overlay",children:[
        jsx("span",{children:project.length+" × "+project.width+" mm"}),
        jsx("span",{children:"e "+project.thickness+" mm"}),
        jsx("span",{children:project.material||"Material"})
      ]})]}),
      jsxs("aside",{className:"sim-ref-data",children:[
        jsx("h3",{children:"DATOS"}),
        jsx(DataRows,{rows}),
        jsx("small",{className:"sim-ref-note",children:"Vista de proceso · unidades en mm"})
      ]})
    ]}),
    jsxs("section",{className:"sim-ref-sequence",children:[
      jsx("h3",{children:"SECUENCIA DE PLEGADO"}),
      jsx("div",{children:sequence.map((label,index)=>jsxs("button",{type:"button",className:index===activeSequence?"active":"",onClick:()=>{
        setPlaying(false);
        if(index===0){setFinished(false);setPositioning(true);setStep(0)}
        else if(index===sequence.length-1){setPositioning(false);setFinished(true);setStep(count-1)}
        else {setPositioning(false);setFinished(false);setStep(index-1)}
      },children:[
        jsx("span",{children:index+1}),
        jsx("div",{className:"mini-part stage-"+Math.min(index,3),children:[jsx("i",{}),jsx("b",{})]}),
        jsx("strong",{children:label})
       ]},label))})
    ]})
  ]})});
}

export function Simulation2DPage(){return jsx(SimulationPage,{mode:"2d"});}
export function Simulation3DPage(){return jsx(SimulationPage,{mode:"3d"});}
