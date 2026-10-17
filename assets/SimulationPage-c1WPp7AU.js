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
  const [step,setStep]=React.useState(()=>Math.min(1,count-1));
  const [playing,setPlaying]=React.useState(false);
  const [zoom,setZoom]=React.useState(1);
  const [finished,setFinished]=React.useState(false);
  const [positioning,setPositioning]=React.useState(false);
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
  const punchWidth=Math.max(42,Math.min(120,(punch?.width||30)*1.8));
  const punchShoulder=270-Math.max(55,Math.min(120,(punch?.height||120)*.55));
  const punchTipDepth=Math.max(34,Math.min(90,Math.tan(Math.max(15,Math.min(88,(punch?.angle||88)/2))*Math.PI/180)*punchWidth*.72));
  const dieWidth=Math.max(70,Math.min(170,(die?.width||56)*1.65));
  const dieV=Math.max(35,Math.min(130,(die?.v||16)*3.1));
  const foldDepth=Math.max(20,Math.min(92,38+(90-Math.abs(angle))*1.8));
  const scene=is3d
    ? jsx("div",{className:"sim3d-reference",style:{transform:"scale("+zoom+")"},children:jsxs("div",{className:"sim3d-machine",children:[
        jsx("div",{className:"sim3d-wall"}),
        jsx("div",{className:"sim3d-top",children:jsxs(React.Fragment,{children:[jsx("span",{children:machine?.manufacturer||"PLEGAR PRO"}),jsx("b",{children:machine?.name||"Plegadora"})]})}),
        jsx("div",{className:"sim3d-red left"}),
        jsx("div",{className:"sim3d-red right"}),
        jsx("div",{className:"sim3d-column left"}),
        jsx("div",{className:"sim3d-column right"}),
        jsx("div",{className:"sim3d-ram",style:{transform:"translateY("+Math.min(18,Math.max(0,(90-angle)/3))+"px)"}}),
        jsx("div",{className:"sim3d-tool"}),
        jsx("div",{className:"sim3d-table"}),
        jsx("div",{className:"sim3d-console",children:jsx("b",{children:"Y1 · Y2 · X"})}),
        jsx("div",{className:"sim3d-part",style:{"--fold":Math.max(0,90-angle)+"deg"},children:[
          jsx("i",{className:"left"}),jsx("i",{className:"center"}),jsx("i",{className:"right"})
        ]})
      ]})})
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
          jsx("path",{d:"M"+(450-dieWidth/2)+" 375H"+(450-dieV/2)+"L450 426L"+(450+dieV/2)+" 375H"+(450+dieWidth/2)+"V468H"+(450-dieWidth/2)+"Z",fill:"url(#sim2d-die-metal)",stroke:"#81778a",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieWidth/2-12)+" 375H"+(450-dieWidth/2)+"V468H"+(450-dieWidth/2-12)+"Z",fill:"#526e60"}),
          jsx("path",{d:"M"+(450+dieWidth/2)+" 375H"+(450+dieWidth/2+12)+"V468H"+(450+dieWidth/2)+"Z",fill:"#526e60"}),
          jsx("path",{d:"M"+(450-punchWidth/2)+" "+punchShoulder+"H"+(450+punchWidth/2)+"V"+(punchShoulder+48)+"L450 "+(punchShoulder+48+punchTipDepth)+"L"+(450-punchWidth/2)+" "+(punchShoulder+48)+"Z",fill:"url(#sim2d-punch-metal)",stroke:"#e4d7e5",strokeWidth:"2",className:"sim2d-tool-shape"}),
          jsx("path",{d:"M"+(450-punchWidth*.2)+" "+(punchShoulder+48)+"V"+(punchShoulder+118)+"H"+(450+punchWidth*.2)+"V"+(punchShoulder+48),fill:"#a48ead",opacity:".85"}),
          jsx("path",{d:"M450 130V"+(punchShoulder-4),stroke:"#263e3f",strokeWidth:"10",opacity:".9"}),
          jsx("path",{d:"M75 351H400L450 "+(351+foldDepth)+"L500 351H825",fill:"none",stroke:"#e5eff0",strokeWidth:"4",strokeLinecap:"round",strokeLinejoin:"round",className:"sim2d-workpiece"}),
          jsx("circle",{cx:"450",cy:String(351+foldDepth),r:"5",fill:"#e6f5f1",stroke:"#425e5e",strokeWidth:"2"}),
          jsx("path",{d:"M"+(450-dieV/2)+" 441H"+(450+dieV/2),stroke:"#a9e7e0",strokeWidth:"2"}),
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
