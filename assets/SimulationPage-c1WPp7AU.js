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
  React.useEffect(()=>{
    if(!playing)return;
    const timer=window.setInterval(()=>setStep(current=>current>=count-1?0:current+1),900);
    return()=>window.clearInterval(timer);
  },[playing,count]);
  const machine=machines.find(item=>item.id===state.selectedMachineId)||machines[0];
  const punch=tools.find(item=>item.id===state.selectedPunchId&&item.kind==="punch")||tools.find(item=>item.kind==="punch");
  const die=tools.find(item=>item.id===state.selectedDieId&&item.kind==="die")||tools.find(item=>item.kind==="die");
  const bend=bends[step];
  const angle=bend?.angle??90;
  const sequence=["Posicionar chapa",...bends.map(item=>"Plegado "+item.order),"Pieza terminada"];
  const activeSequence=finished?sequence.length-1:step+1;
  const changeStep=next=>{setPlaying(false);setFinished(false);setStep(Math.max(0,Math.min(count-1,next)))};
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
    : jsx("div",{className:"sim2d-reference stage-"+Math.min(step+1,3),style:{transform:"scale("+zoom+")"},children:[
        jsx("div",{className:"sim2d-punch",children:jsx("i",{})}),
        jsx("div",{className:"sim2d-centerline"}),
        jsx("div",{className:"sim2d-sheet",style:{transform:"rotate(-"+Math.max(0,90-angle)+"deg)"}}),
        jsx("div",{className:"sim2d-sheet right",style:{transform:"rotate("+Math.max(0,90-angle)+"deg)"}}),
        jsx("div",{className:"sim2d-die"}),
        jsx("div",{className:"sim2d-angle",children:angle+"°"})
      ]});
  const toolsRail=jsx("div",{className:"sim-ref-tools","aria-label":"Herramientas de vista",children:[
    jsx("button",{type:"button","aria-label":"Acercar",onClick:()=>setZoom(value=>Math.min(1.5,value+.1)),children:"＋"}),
    jsx("button",{type:"button","aria-label":"Alejar",onClick:()=>setZoom(value=>Math.max(.7,value-.1)),children:"−"}),
    jsx("button",{type:"button","aria-label":"Centrar vista",onClick:()=>setZoom(1),children:"⌕"}),
    jsx("button",{type:"button","aria-label":"Paso anterior",onClick:()=>changeStep(step-1),children:"‹"}),
    jsx("button",{type:"button","aria-label":"Paso siguiente",onClick:()=>changeStep(step+1),children:"›"})
  ]});
  return jsx(Page,{title:is3d?"Simulación 3D":"Simulación 2D",subtitle:is3d?"Visualización realista de la máquina y la secuencia de plegado":"Secuencia de plegado en vista plana",children:jsx("div",{className:"sim-ref-shell",children:[
    jsxs("div",{className:"sim-ref-player",children:[
      jsxs("div",{className:"sim-ref-controls",children:[
        jsx("button",{type:"button","aria-label":playing?"Pausar":"Reproducir",onClick:()=>setPlaying(value=>!value),children:playing?"Ⅱ":"▶"}),
        jsx("button",{type:"button","aria-label":"Reiniciar",onClick:()=>{setPlaying(false);setFinished(false);setStep(0)},children:"↺"}),
        jsx("button",{type:"button","aria-label":"Paso anterior",onClick:()=>changeStep(step-1),children:"◀"}),
        jsx("button",{type:"button","aria-label":"Paso siguiente",onClick:()=>changeStep(step+1),children:"▶▶"})
      ]}),
      jsx("strong",{children:"Paso "+(step+1)+" / "+count}),
      jsx("span",{children:bend?"Plegado "+bend.order+" de "+count:finished?"Pieza terminada":"Sin plegados"}),
      jsx("div",{className:"sim-ref-progress","aria-label":"Progreso de la simulación",children:jsx("i",{style:{width:((step+1)/count*100)+"%"}})})
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
        if(index===0){setFinished(false);setStep(0)}
        else if(index===sequence.length-1){setFinished(true);setStep(count-1)}
        else {setFinished(false);setStep(index-1)}
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
