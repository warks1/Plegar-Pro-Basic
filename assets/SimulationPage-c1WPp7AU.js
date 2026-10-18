import{r as interop,t as loadReact}from"./react-OrosJ8bI.js";
import{a as jsxFactory,n as useStore,t as useProject}from"./index-BejcmiWV.js";
import{t as Page}from"./Page-CANi1eAD.js";
import{n as catalog}from"./catalog-DRcBI5Du.js";
const React=interop(loadReact(),1),h=React.createElement,jsx=jsxFactory();
let bus={progress:0,playing:false};const listeners=new Set();
function publish(patch){bus={...bus,...patch};listeners.forEach(fn=>fn(bus))}
function useTimeline(){const[state,setState]=React.useState(bus);React.useEffect(()=>{const fn=value=>setState(value);listeners.add(fn);return()=>listeners.delete(fn)},[]);return[state,publish]}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const styles={workspace:{display:"grid",gridTemplateColumns:"minmax(0,1fr) 310px",gap:14,alignItems:"start"},main:{display:"grid",gap:14,minWidth:0},viewport:{position:"relative",overflow:"hidden",minHeight:460,padding:0,background:"linear-gradient(180deg,#f1f1ec,#d4d8d7)",border:"1px solid #557181",borderRadius:14,boxShadow:"0 16px 42px #0008"},svg:{display:"block",width:"100%",height:"auto",minHeight:420},overlay:{position:"absolute",top:12,left:14,display:"flex",gap:8,alignItems:"center",color:"#0b2633",fontSize:12,fontWeight:800,background:"#eff7f2dc",border:"1px solid #64808b",borderRadius:8,padding:"7px 10px"},live:{width:8,height:8,borderRadius:20,background:"#31d89b",boxShadow:"0 0 10px #31d89b"},topControls:{position:"absolute",top:10,right:12,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"end",maxWidth:"62%"},button:{border:"1px solid #4a7184",borderRadius:8,background:"#0b1b29e8",color:"#d9f7ff",padding:"7px 10px",cursor:"pointer",fontSize:11,fontWeight:700},buttonActive:{borderColor:"#36dcff",background:"linear-gradient(135deg,#0e5877,#253b76)",boxShadow:"0 0 12px #1acfff44"},canvasFooter:{position:"absolute",left:12,right:12,bottom:12,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"space-between",alignItems:"end",pointerEvents:"none"},badge:{background:"#07131ddf",color:"#d9f6ff",border:"1px solid #1c7895",borderRadius:8,padding:"7px 10px",fontSize:11},sectionGrid:{display:"grid",gridTemplateColumns:"minmax(0,1.35fr) minmax(250px,.65fr)",gap:14},panel:{padding:16},aside:{display:"grid",gap:12},smallLabel:{fontSize:10,letterSpacing:".12em",color:"#85a7ba"},progress:{width:"100%",accentColor:"#19c9ee"},toolbar:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"12px 14px",background:"#081725",border:"1px solid #21465e",borderRadius:11},steps:{display:"flex",gap:8,overflowX:"auto",padding:"10px 0 2px"},step:{minWidth:105,display:"grid",gap:5,justifyItems:"start",border:"1px solid #1b3a50",borderRadius:9,padding:9,background:"#091724",color:"#cfecfa",cursor:"pointer",textAlign:"left"},stepOn:{borderColor:"#26d8fa",boxShadow:"0 0 14px #25cfff33",background:"#0b2d40"},stat:{display:"flex",justifyContent:"space-between",gap:8,padding:"9px 0",borderBottom:"1px solid #18384b",fontSize:12},help:{color:"#8daabd",fontSize:11,lineHeight:1.5},secondaryView:{background:"linear-gradient(145deg,#0a2938,#06131c)",border:"1px solid #28566b",borderRadius:10,overflow:"hidden",minHeight:205},rangeRow:{display:"grid",gridTemplateColumns:"auto minmax(120px,1fr) auto",gap:10,alignItems:"center",width:"100%"}};
function polygon(points,fill,stroke="#526974",extra={}){return h("polygon",{points:points.map(p=>p.join(",")).join(" "),fill,stroke,strokeWidth:2,...extra})}
function PressBrakeScene({bend,angleFactor,ramDrop,view="isometric",compact=false}){const sign=bend?.direction==="negative"?-1:1,theta=(180-clamp(bend?.angle??90,1,179))/2*Math.PI/180*clamp(angleFactor,0,1),cx=620,base=compact?140:370,arm=compact?86:190,left=[cx-arm*Math.cos(theta),base-sign*arm*Math.sin(theta)],mid=[cx,base],right=[cx+arm*Math.cos(theta),base-sign*arm*Math.sin(theta)],profile=[left,mid,right],dx=compact?30:78,dy=compact?-15:-38,extruded=[...profile,...profile.slice().reverse().map(([x,y])=>[x+dx,y+dy])],p=(arr)=>arr.map(v=>v.join(",")).join(" "),toolY=compact?82:278+ramDrop,dieTop=compact?153:432;
const parts=[];
parts.push(h("defs",{key:"defs"},h("linearGradient",{id:compact?"steelMini":"steelMain",x1:"0",x2:"1",y1:"0",y2:"1"},h("stop",{offset:"0",stopColor:"#e2e7e7"}),h("stop",{offset:".52",stopColor:"#8f9c9f"}),h("stop",{offset:"1",stopColor:"#59676d"})),h("linearGradient",{id:compact?"orangeMini":"orangeMain",x1:"0",x2:"0",y1:"0",y2:"1"},h("stop",{offset:"0",stopColor:"#ffd147"}),h("stop",{offset:"1",stopColor:"#dd7900"})),h("pattern",{id:compact?"gridMini":"gridMain",width:32,height:32,patternUnits:"userSpaceOnUse"},h("path",{d:"M 32 0 L 0 0 0 32",fill:"none",stroke:"#0d3647",strokeOpacity:.12,strokeWidth:1}))));
parts.push(h("rect",{key:"bg",width:1200,height:compact?220:650,fill:compact?"#4f7e86":"#e4e7e4"}),h("rect",{key:"grid",width:1200,height:compact?220:650,fill:`url(#${compact?"gridMini":"gridMain"})`}));
if(!compact){parts.push(h("ellipse",{key:"shadow",cx:620,cy:548,rx:470,ry:40,fill:"#354047",opacity:.22}));
// Bed, side frames, beam and guide rails of the press brake.
parts.push(polygon([[95,422],[970,422],[1080,478],[205,478]],"#aab4b6"),polygon([[205,478],[1080,478],[1080,533],[205,533]],"#707c80"),polygon([[95,422],[205,478],[205,533],[95,477]],"#879396"));
parts.push(polygon([[145,148],[230,148],[260,465],[178,465]],"url(#steelMain)"),polygon([[178,465],[260,465],[284,493],[202,493]],"#65767c"),polygon([[945,148],[1030,148],[1000,465],[918,465]],"url(#steelMain)"),polygon([[918,465],[1000,465],[976,493],[894,493]],"#65767c"));
parts.push(polygon([[172,118],[953,118],[1037,166],[256,166]],"#879296"),polygon([[256,166],[1037,166],[1037,256],[256,256]],"url(#steelMain)"),polygon([[172,118],[256,166],[256,256],[172,208]],"#778589"));
parts.push(h("path",{key:"beamline",d:"M256 248 H1037",stroke:"#303b40",strokeWidth:12}),h("path",{key:"beamlight",d:"M270 241 H1024",stroke:"#d2dcdd",strokeWidth:3}));
for(let x=282;x<1020;x+=42)parts.push(h("rect",{key:`seg${x}`,x,y:254,width:30,height:28,rx:3,fill:"#59666b",stroke:"#b4c0c3",strokeWidth:2}));
// Workpiece surface and its extruded 3D edge.
parts.push(polygon(extruded,"#22c8d0", "#135c65",{opacity:.92}),h("polyline",{key:"profile",points:p(profile),fill:"none",stroke:"#19f0ed",strokeWidth:8,strokeLinejoin:"round",strokeLinecap:"round",filter:"drop-shadow(0 0 5px #00eaff)"}),h("polyline",{key:"backprofile",points:p(profile.map(([x,y])=>[x+dx,y+dy])),fill:"none",stroke:"#31aeb6",strokeWidth:3}));
// Reference holes and the active bend station.
const holeX=(left[0]+mid[0])/2;parts.push(h("ellipse",{key:"hole",cx:holeX+24,cy:(left[1]+base)/2-18,rx:22,ry:10,fill:"#e0e4df",stroke:"#2a939a",strokeWidth:4,transform:`rotate(-8 ${holeX+24} ${(left[1]+base)/2-18})`}),h("circle",{key:"hole2",cx:right[0]-34,cy:(right[1]+base)/2-16,r:8,fill:"#e3e7e5",stroke:"#278b91",strokeWidth:3}));
// Lower V die with orange relief.
parts.push(polygon([[500,dieTop],[570,dieTop],[620,dieTop+54],[670,dieTop],[740,dieTop],[740,dieTop+70],[500,dieTop+70]],"url(#orangeMain)","#8b4c08"),h("path",{key:"vline",d:`M570 ${dieTop} L620 ${dieTop+54} L670 ${dieTop}`,fill:"none",stroke:"#ffe68c",strokeWidth:4}));
// Moving ram and orange upper punch follow the press cycle.
parts.push(h("g",{key:"ram",transform:`translate(0 ${ramDrop})`},polygon([[505,toolY],[735,toolY],[777,toolY+22],[547,toolY+22]],"#ffbd26","#8f5205"),polygon([[547,toolY+22],[777,toolY+22],[777,toolY+76],[547,toolY+76]],"url(#orangeMain)","#8f5205"),polygon([[505,toolY],[547,toolY+22],[547,toolY+76],[505,toolY+54]],"#dc8508","#8f5205"),polygon([[547,toolY+76],[777,toolY+76],[700,toolY+112],[620,toolY+112]],"#e9930a","#8f5205"),h("path",{d:`M620 ${toolY+112} L700 ${toolY+112}`,stroke:"#ffe48a",strokeWidth:3}))); 
// Linear guides, bolts and coordinate labels make the CAD view legible.
for(let x=220;x<1060;x+=56){parts.push(h("circle",{key:`bolt${x}`,cx:x,cy:500,r:5,fill:"#d5dcdb",stroke:"#546269",strokeWidth:2}))}
parts.push(h("path",{key:"gauge",d:"M290 390 L885 390 M330 382 V402 M420 382 V402 M510 382 V402 M600 382 V402 M690 382 V402 M780 382 V402",stroke:"#4c626b",strokeWidth:2,opacity:.75}));
parts.push(h("text",{key:"model",x:610,y:206,textAnchor:"middle",fill:"#edf4f4",fontSize:18,fontWeight:800,letterSpacing:2},"PLEGADORA CNC · SIMULACIÓN DINÁMICA"),h("text",{key:"pmark",x:cx,y:compact?40:325,textAnchor:"middle",fill:compact?"#b5f8ff":"#155065",fontSize:compact?13:18,fontWeight:800},`P${bend?.order??1} · ${Math.round((bend?.angle??90)*clamp(angleFactor,0,1))}°`));
}else{
// Synchronized 2D section: the punch, V die and sheet use the same bend angle.
const midX=620, baseY=dieTop, a=Math.max(0,theta), reach=compact?82:180, yL=baseY-sign*reach*Math.sin(a), xL=midX-reach*Math.cos(a), yR=baseY-sign*reach*Math.sin(a), xR=midX+reach*Math.cos(a);
parts.push(h("rect",{key:"miniBg",x:0,y:0,width:1200,height:220,fill:"#4f7e86"}),h("g",{key:"2dtools",stroke:"#425c4a",strokeWidth:5},h("rect",{x:midX-54,y:24,width:108,height:45,rx:3,fill:"#f0a51e",stroke:"#6f571d"}),h("path",{d:`M${midX-75} 153 L${midX-32} 153 L${midX} 192 L${midX+32} 153 L${midX+75} 153 L${midX+75} 210 L${midX-75} 210Z`,fill:"#e89a17",stroke:"#755b26",strokeWidth:4})),h("polyline",{key:"2dsheet",points:`${xL},${yL} ${midX},${baseY-1} ${xR},${yR}`,fill:"none",stroke:"#c7ffff",strokeWidth:8,strokeLinejoin:"round",filter:"drop-shadow(0 0 5px #00efff)"}),h("path",{key:"guide",d:`M${midX-235} ${baseY} H${midX+235}`,stroke:"#d4e2df",strokeWidth:2,strokeDasharray:"8 8",opacity:.65}),h("text",{key:"angle",x:midX+104,y:baseY-33,fill:"#a8ffcb",fontSize:30,fontWeight:800},`${Math.round((bend?.angle??90)*clamp(angleFactor,0,1))}°`),h("text",{key:"step",x:30,y:34,fill:"#ecfbff",fontSize:17,fontWeight:700},`P${bend?.order??1} · punzón ${bend?.punchId??"—"} · matriz V ${bend?.dieId??"—"}`));
}
const cameraTransform=compact||view==="front"?undefined:view==="side"?"translate(150 0) scale(.75 1)":"skewX(-3) skewY(1)";return h("svg",{viewBox:`0 0 1200 ${compact?220:650}`,role:"img","aria-label":compact?"Sección 2D sincronizada del plegado":"Simulación 3D de plegadora CNC",className:compact?"simulation-2d-svg":"simulation-3d-svg",style:{...styles.svg,minHeight:compact?205:420}},h("g",{transform:cameraTransform},...parts))}
function Controls({timeline,count,speed,setSpeed}){const[state,send]=timeline;const progress=clamp(state.progress,0,count);return h("div",{style:styles.toolbar},h("button",{style:styles.button,onClick:()=>send({progress:0,playing:false}),title:"Reiniciar"},"⟲"),h("button",{style:{...styles.button,...(state.playing?styles.buttonActive:{})},onClick:()=>send({playing:!state.playing,progress:progress>=count?0:progress}),title:state.playing?"Pausar":"Reproducir"},state.playing?"❚❚":"▶ Reproducir"),h("button",{style:styles.button,onClick:()=>send({progress:clamp(Math.floor(progress)-1,0,count),playing:false}),title:"Paso anterior"},"◀ Paso"),h("button",{style:styles.button,onClick:()=>send({progress:clamp(Math.floor(progress)+1,0,count),playing:false}),title:"Paso siguiente"},"Paso ▶"),h("label",{style:{...styles.smallLabel,marginLeft:6}},"VELOCIDAD"),h("select",{value:speed,onChange:e=>setSpeed(e.target.value),style:{background:"#071521",color:"#dff8ff",border:"1px solid #31566b",borderRadius:7,padding:"7px 9px"}},h("option",{value:"slow"},"0,5×"),h("option",{value:"normal"},"1×"),h("option",{value:"fast"},"2×")),h("div",{style:styles.rangeRow},h("span",{style:styles.smallLabel},`P${Math.min(count,Math.floor(progress)+1)} / ${count||0}`),h("input",{type:"range",min:0,max:Math.max(1,count),step:.01,value:progress,onChange:e=>send({progress:Number(e.target.value),playing:false}),style:styles.progress,"aria-label":"Progreso de simulación"}),h("span",{style:{...styles.badge,minWidth:62,textAlign:"center"}},`${Math.round(progress/Math.max(1,count)*100)}%`)))}
function usePlayback(timeline,count,speed){const[state,send]=timeline;React.useEffect(()=>{if(!state.playing||count<1)return;let last=0,raf=0;const duration=speed==="slow"?5000:speed==="fast"?1500:2800;const tick=now=>{if(!last)last=now;const next=bus.progress+(now-last)/duration;last=now;if(next>=count){send({progress:count,playing:false});return}send({progress:next});raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[state.playing,count,speed])}
function sequence(project,bend,index,progress,send){const list=project.bends.length?project.bends:[bend];return h("div",{style:styles.steps},...list.map((item,i)=>h("button",{key:item.id||i,type:"button",style:{...styles.step,...(Math.floor(progress)===i?styles.stepOn:{})},onClick:()=>send({progress:i,playing:false})},h("b",{style:{width:27,height:27,display:"grid",placeItems:"center",borderRadius:50,background:"#15526a",color:"#bdf6ff"}},`P${item.order??i+1}`),h("span",null,`${item.angle}° · ${item.direction==="negative"?"−":"+"}`),h("small",{style:{color:"#80a5b8"}},`X ${item.position} mm`))))}
function baseData(){const project=useProject(),speed=useStore(s=>s.simulationSpeed),setSpeed=useStore(s=>s.setSimulationSpeed),selectedMachine=useStore(s=>s.selectedMachineId),selectedPunch=useStore(s=>s.selectedPunchId),selectedDie=useStore(s=>s.selectedDieId),defaultPunch=catalog.find(x=>x.id===selectedPunch)||catalog.find(x=>x.kind==="punch"),defaultDie=catalog.find(x=>x.id===selectedDie)||catalog.find(x=>x.kind==="die"),bends=project.bends||[],timeline=useTimeline(),count=bends.length;usePlayback(timeline,count,speed);const[state]=timeline,progress=clamp(state.progress,0,Math.max(1,count)),index=count?Math.min(count-1,Math.floor(Math.min(progress,count-.0001))):0,bend=bends[index]||{id:"demo",order:1,angle:90,direction:"positive",position:project.length/2,length:project.width,radius:project.thickness,punchId:selectedPunch,dieId:selectedDie},punch=catalog.find(x=>x.id===bend.punchId)||defaultPunch,die=catalog.find(x=>x.id===bend.dieId)||defaultDie,phase=count?progress-index:0,blend=progress>=index+1?1:phase<.18?0:clamp((phase-.18)/.42,0,1),ram=phase<.18?0:phase<.46?((phase-.18)/.28)*72:phase<.68?72:phase<.86?72*(1-(phase-.68)/.18):0;return{project,speed,setSpeed,selectedMachine,punch,die,bends,timeline,count,state,progress,index,bend,blend,ram}}
function Simulation3DPage(){
 const d=baseData();
 const [view,setView]=React.useState('isometric');
 const pct=Math.round(d.progress/Math.max(1,d.count)*100);
 const machineName=d.selectedMachine?.toLowerCase().includes('truma')?'TRUMPF TruBend V85':'Plegadora CNC';
 const viewportChildren=[
  h(PressBrakeScene,{bend:d.bend,angleFactor:d.blend,ramDrop:d.ram,view}),
  h('div',{style:styles.overlay},h('i',{style:styles.live}),machineName,h('span',{style:{opacity:.58}},'·'),`${d.project.name||'Pieza activa'}`),
  h('div',{style:styles.topControls},...['isometric','front','side'].map(v=>h('button',{key:v,type:'button',style:{...styles.button,...(view===v?styles.buttonActive:{})},onClick:()=>setView(v)},v==='isometric'?'Isométrica':v==='front'?'Frontal':'Lateral'))),
  h('div',{style:styles.canvasFooter},h('span',{style:styles.badge},`P${d.bend.order} · ${Math.round(d.bend.angle*d.blend)}° · ${d.bend.direction==='negative'?'Plegado negativo':'Plegado positivo'}`),h('span',{style:styles.badge},`Carrera del punzón · ${Math.round(d.ram)} mm`))
 ];
 const viewport=h('section',{className:'panel',style:styles.viewport},...viewportChildren);
 const sequencePanel=h('section',{className:'panel',style:styles.panel},h('h3',null,'Secuencia de plegado'),h('p',{style:styles.help},'Selecciona un paso P para posicionar la chapa; la carrera del punzón se sincroniza con la sección 2D.'),sequence(d.project,d.bend,d.index,d.progress,d.timeline[1]));
 const crossPanel=h('section',{className:'panel',style:styles.panel},h('h3',null,'Sección 2D sincronizada'),h('div',{style:styles.secondaryView},h(PressBrakeScene,{bend:d.bend,angleFactor:d.blend,ramDrop:d.ram,compact:true})));
 const main=h('div',{style:styles.main},viewport,h(Controls,{timeline:d.timeline,count:d.count,speed:d.speed,setSpeed:d.setSpeed}),h('div',{style:styles.sectionGrid},sequencePanel,crossPanel));
 const info=h('aside',{className:'panel',style:{...styles.aside,...styles.panel}},h('h3',null,'Parámetros de simulación'),
  h('div',{style:styles.stat},h('span',null,'Máquina'),h('b',null,machineName)),
  h('div',{style:styles.stat},h('span',null,'Punzón seleccionado'),h('b',null,d.punch?.name||d.bend.punchId||'—')),
  h('div',{style:styles.stat},h('span',null,'Matriz V seleccionada'),h('b',null,d.die?.name||d.bend.dieId||'—')),
  h('div',{style:styles.stat},h('span',null,'Material'),h('b',null,d.project.material||'Acero')),
  h('div',{style:styles.stat},h('span',null,'Espesor'),h('b',null,`${d.project.thickness} mm`)),
  h('div',{style:styles.stat},h('span',null,'Ángulo objetivo'),h('b',null,`${d.bend.angle}°`)),
  h('div',{style:styles.stat},h('span',null,'Avance'),h('b',null,`${pct}%`)),
  h('p',{style:styles.help},'Arrastra el progreso o avanza paso a paso. La pieza, el punzón móvil y la vista 2D comparten el mismo estado.'));
 return h(Page,{title:'Simulación 3D',subtitle:'Plegado dinámico de chapa · máquina, utillaje y pieza sincronizados',actions:h('span',{style:{color:'#4ae5a5',fontSize:12}},'●  Motor activo'),children:h('div',{style:styles.workspace},main,info)});
}
function Reference2DCanvas({d}) {
 const activeAngle=Math.round(d.bend.angle*d.blend), ramOffset=d.ram/72*18;
 const punchLabel=d.punch?.name||d.bend.punchId||"Punzón";
 const dieLabel=d.die?.name||d.bend.dieId||"Matriz V";
 const sheetLeftY=100+(143-100)*(1-d.blend*.12);
 const sheetTipY=50+(143-50)*(1-d.blend);
 const sheetRightY=143+(d.bend.direction==="negative"?-Math.min(activeAngle,90)*.18:0);
 const toolHue=(d.bend.order||1)%2===0?"#927e9a":"#9b879f";
 return h("div",{className:"ref2d-shell"},
  h("div",{className:"ref2d-top"},
   h("div",{className:"ref2d-tabs"},...[1,2,3].map(n=>h("button",{key:n,className:"ref2d-tab "+((n===Math.min(3,d.bend.order||1))?"on":""),onClick:()=>d.timeline[1]({progress:clamp(n-1,0,Math.max(0,d.count-1)),playing:false}),title:`Seleccionar paso P${n}`},n))),
   h("div",{className:"ref2d-machine"},h("span",{className:"ref2d-live"}),"SECCIÓN · ",d.selectedMachine||"PLEGADORA CNC"),
   h("div",{className:"ref2d-tools"},
    h("span",{title:"Punzón activo"},h("i",{className:"ref2d-punch-icon"}),punchLabel),
    h("span",{title:"Matriz V activa"},h("i",{className:"ref2d-die-icon"}),dieLabel))),
  h("div",{className:"ref2d-work"},
   h("div",{className:"ref2d-leftbar"},
    h("button",{onClick:()=>d.timeline[1]({playing:!d.state.playing,progress:d.progress>=d.count?0:d.progress}),title:d.state.playing?"Pausar":"Reproducir"},d.state.playing?"Ⅱ":"▶"),
    h("button",{onClick:()=>d.timeline[1]({progress:clamp(Math.floor(d.progress)-1,0,d.count),playing:false}),title:"Paso anterior"},"◀"),
    h("button",{onClick:()=>d.timeline[1]({progress:clamp(Math.floor(d.progress)+1,0,d.count),playing:false}),title:"Paso siguiente"},"⏭"),
    h("button",{onClick:()=>d.timeline[1]({progress:0,playing:false}),title:"Reiniciar vista"},"↔")),
   h("svg",{viewBox:"0 0 361 207",className:"ref2d-svg",role:"img","aria-label":`Simulación 2D de plegado, paso ${d.bend.order}, ${activeAngle} grados`},
    h("defs",null,
     h("linearGradient",{id:"refPunch",x1:"0",x2:"1"},h("stop",{offset:"0","stopColor":"#8f7c98"}),h("stop",{offset:"1","stopColor":toolHue})),
     h("filter",{id:"refGlow",x:"-40%",y:"-40%",width:"180%",height:"180%"},h("feGaussianBlur",{stdDeviation:"2",result:"blur"}),h("feMerge",null,h("feMergeNode",{in:"blur"}),h("feMergeNode",{in:"SourceGraphic"}))),
     h("pattern",{id:"refGrid",width:"36",height:"36",patternUnits:"userSpaceOnUse"},h("path",{d:"M36 0H0V36",fill:"none",stroke:"#a9d8d4","stroke-opacity":".07","stroke-width":".7"}))),
    h("rect",{width:361,height:207,fill:"#648f95"}),
    h("rect",{width:361,height:207,fill:"url(#refGrid)"}),
    h("path",{d:"M29 0V207",stroke:"#b8d1d0","stroke-opacity":".65","stroke-width":"1"}),
    h("g",{className:"ref2d-frame"},
     h("g",{className:"ref2d-stop"},h("rect",{x:78,y:137,width:39,height:17,fill:"#587952"}),h("rect",{x:78,y:137,width:24,height:4,fill:"#75966b"}),h("path",{d:"M104 143H119",stroke:"#354c39","stroke-width":"4"})),
     h("g",{className:"ref2d-ram",style:{transform:`translateY(${ramOffset}px)`}},
      h("rect",{x:146,y:17,width:47,height:55,rx:2,fill:"url(#refPunch)",stroke:"#697a7b","stroke-width":"1.3"}),
      h("rect",{x:159,y:71,width:20,height:65,fill:"#526f51"}),
      h("path",{d:"M159 132H179L174 144H164Z",fill:"#3d5d45"})),
     h("g",{className:"ref2d-die"},
      h("path",{d:"M150 145H158L166 157L174 145H182V178H150Z",fill:"#647d60",stroke:"#516b53","stroke-width":"1"}),
      h("path",{d:"M158 145L166 157L174 145",fill:"none",stroke:"#a2b5a0","stroke-width":"2"}),
      h("rect",{x:151,y:179,width:30,height:15,rx:1,fill:"url(#refPunch)",stroke:"#647477","stroke-width":"1"})),
     h("path",{d:`M122 ${sheetLeftY} L166 143 L263 ${sheetTipY}`,fill:"none",stroke:"#ddf5eb","stroke-width":"1.5","stroke-linejoin":"round",filter:"url(#refGlow)"}),
     h("path",{d:`M263 ${sheetTipY} l20 19`,fill:"none",stroke:"#8bd897","stroke-width":"2"}),
     h("path",{d:`M166 143 H303 V${sheetRightY+31}`,fill:"none",stroke:"#d6f4e8","stroke-width":"1.4","stroke-linejoin":"round"}),
     h("path",{d:`M303 ${sheetRightY+23} V${sheetRightY+32}`,fill:"none",stroke:"#82d28b","stroke-width":"2"}),
     h("circle",{cx:166,cy:143,r:2.4,fill:"#f4fff7"}),
     h("path",{d:"M120 101L164 142",stroke:"#edf7f3","stroke-opacity":".4","stroke-width":".8"}),
     h("g",{className:"ref2d-angle",transform:"translate(204 114)"},
      h("path",{d:"M0 0 A25 25 0 0 1 18 -17",fill:"none",stroke:"#a4e3ae","stroke-width":"1.3"}),
      h("text",{x:20,y:-20,fill:"#c7f2c5","font-size":"9","font-weight":"700"},`${activeAngle}°`)),
     h("g",{className:"ref2d-top-right"},
      h("circle",{cx:343,cy:15,r:5,fill:"#f0f8f4"}),h("circle",{cx:356,cy:15,r:5,fill:"#f0f8f4"}),
      h("path",{d:"M335 31Q343 20 351 31M348 31Q356 20 364 31",fill:"none",stroke:"#eff8f4","stroke-width":"5"}),
      h("rect",{x:335,y:61,width:21,height:5,rx:1,fill:"#e9f5f2"}),h("path",{d:"M357 61l4 0 3 4",fill:"none",stroke:"#e9f5f2","stroke-width":"2"}),
      h("rect",{x:335,y:94,width:20,height:5,rx:1,fill:"#e9f5f2"}),h("path",{d:"M357 94l4 0 3 4",fill:"none",stroke:"#e9f5f2","stroke-width":"2"})),
     h("text",{x:91,y:12,fill:"#c4e3df","font-size":"6",opacity:".75"},`P${d.bend.order} · ${d.bend.position} mm`))),
   h("div",{className:"ref2d-readout"},h("b",null,`P${d.bend.order} · ${activeAngle}°`),h("span",null,`V ${d.die?.width||d.bend.dieId||"—"} · ${punchLabel}`))),
  h("div",{className:"ref2d-progress"},
   h("span",null,`P${Math.min(d.count,Math.floor(d.progress)+1)} / ${d.count||1}`),
   h("input",{type:"range",min:0,max:Math.max(1,d.count),step:.01,value:d.progress,onChange:e=>d.timeline[1]({progress:Number(e.target.value),playing:false}),"aria-label":"Progreso del plegado"}),
   h("span",null,`${Math.round(d.progress/Math.max(1,d.count)*100)}%`)),
  h("style",null,`.ref2d-shell{width:100%;color:#e8f3f1;background:#17262d;border:1px solid #738e93;border-radius:7px;overflow:hidden;box-shadow:0 12px 32px #0005;font:11px/1.25 Inter,Segoe UI,sans-serif}.ref2d-top{height:34px;background:#304c54;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 7px;border-bottom:1px solid #9ab2b3}.ref2d-tabs{display:flex;align-self:stretch;align-items:flex-start;gap:2px}.ref2d-tab{width:25px;height:17px;border:0;border-radius:0 0 3px 3px;background:#52747a;color:#d9eeeb;font-size:9px;cursor:pointer}.ref2d-tab.on{background:#e1d5e2;color:#263c42}.ref2d-machine{font-size:8px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref2d-live{display:inline-block;width:6px;height:6px;border-radius:50%;background:#63e59c;margin-right:5px;box-shadow:0 0 7px #63e59c}.ref2d-tools{max-width:36%;display:grid;gap:3px;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ref2d-tools span{display:flex;align-items:center;gap:4px}.ref2d-punch-icon{width:7px;height:10px;background:#a68ca7;display:inline-block}.ref2d-die-icon{width:9px;height:6px;background:#718d69;display:inline-block;clip-path:polygon(0 0,30% 0,50% 65%,70% 0,100% 0,100% 100%,0 100%)}.ref2d-work{position:relative;display:grid;grid-template-columns:28px minmax(0,1fr);background:#648f95}.ref2d-leftbar{position:absolute;z-index:2;left:0;top:0;bottom:0;width:28px;background:#5a8188;border-right:1px solid #aac3c1;display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:9px}.ref2d-leftbar button{width:22px;height:22px;border:0;background:transparent;color:#eff9f6;font-size:15px;cursor:pointer;border-radius:3px}.ref2d-leftbar button:hover{background:#9fc6c7;color:#183840}.ref2d-svg{display:block;grid-column:1/3;width:100%;height:auto;aspect-ratio:361/207}.ref2d-frame{transform:translateX(0)}.ref2d-ram{transform-box:fill-box;transform-origin:top center;transition:transform .18s ease-out}.ref2d-readout{position:absolute;left:35px;bottom:7px;display:flex;gap:8px;align-items:center;background:#284750d9;border:1px solid #a8c4c1;border-radius:3px;padding:4px 7px;font-size:8px;pointer-events:none}.ref2d-readout span{opacity:.85;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ref2d-progress{display:grid;grid-template-columns:auto minmax(60px,1fr) auto;gap:8px;align-items:center;padding:7px 9px;background:#233b43;font-size:9px}.ref2d-progress input{width:100%;accent-color:#51d3df}.ref2d-shell button:focus-visible,.ref2d-shell input:focus-visible{outline:2px solid #e7e0ee;outline-offset:1px}@media(max-width:560px){.ref2d-machine{display:none}.ref2d-tools{max-width:60%}.ref2d-top{height:30px}.ref2d-readout{font-size:7px;max-width:85%}}`));
}
function Simulation2DPage(){
 const d=baseData();
 const pct=Math.round(d.progress/Math.max(1,d.count)*100);
 const sequencePanel=h('section',{className:'panel',style:{...styles.panel,background:'#09151b'}},h('h3',null,'Secuencia de plegado'),h('p',{style:styles.help},'Cada paso actualiza el ángulo, el punzón y la matriz de la sección.'),sequence(d.project,d.bend,d.index,d.progress,d.timeline[1]));
 const info=h('div',{style:{display:'flex',flexWrap:'wrap',gap:9,alignItems:'center'}},...[[`P${d.bend.order}`,`${Math.round(d.bend.angle*d.blend)}°`],[`Punzón`,d.punch?.name||d.bend.punchId||'—'],[`Matriz V`,d.die?.name||d.bend.dieId||'—'],[`Avance`,`${pct}%`]].map(([label,value])=>h('div',{key:label,style:{...styles.badge,display:'grid',gap:4,minWidth:120,flex:'1 1 120px'}},h('small',{style:styles.smallLabel},label),h('b',null,value))));
 const content=h('div',{style:{...styles.main,maxWidth:1180,margin:'0 auto'}},h(Reference2DCanvas,{d}),h(Controls,{timeline:d.timeline,count:d.count,speed:d.speed,setSpeed:d.setSpeed}),sequencePanel,info);
 return h(Page,{title:'Simulación 2D',subtitle:'Sección de plegado · punzón y matriz seleccionados por paso',actions:h('span',{style:{color:'#4ae5a5',fontSize:12}},'●  Motor activo'),children:content});
}
export{Simulation2DPage,Simulation3DPage};

