import type {Machine,Tool} from '../types/domain';
export const machines:Machine[]=[
{id:'truma-v85',manufacturer:'TRUMPF',name:'TrumaBend V85',forceT:85,lengthMm:2550,strokeMm:215,daylightMm:385,throatMm:410,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'TRUMPF',source:'reconstructed',verified:false},
{id:'by-100-2006',manufacturer:'Bystronic',name:'100 T (2006) · modelo por confirmar',forceT:100,year:2006,lengthMm:3100,strokeMm:200,daylightMm:410,throatMm:400,axes:['Y1','Y2','X','R'],clamp:'European',source:'reconstructed',verified:false},
{id:'amada-hfe',manufacturer:'AMADA',name:'HFE configurable',forceT:100,lengthMm:3110,strokeMm:200,daylightMm:470,throatMm:420,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'European',source:'reconstructed',verified:false},
{id:'by-xpert',manufacturer:'Bystronic',name:'Xpert configurable',forceT:150,lengthMm:3100,strokeMm:250,daylightMm:550,throatMm:500,axes:['Y1','Y2','X','R','Z1','Z2','X1'],clamp:'Wila',source:'reconstructed',verified:false},
{id:'korpleg',manufacturer:'KORPLEG',name:'Plegadora configurable',forceT:100,lengthMm:3100,strokeMm:220,daylightMm:450,throatMm:410,axes:['Y1','Y2','X','R'],clamp:'European',source:'reconstructed',verified:false}
,{id:'truma-5230',manufacturer:'TRUMPF',name:'TruBend 5230 configurable',forceT:230,lengthMm:3230,strokeMm:445,daylightMm:615,throatMm:420,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'TRUMPF',source:'reconstructed',verified:false}
,{id:'amada-hg1303',manufacturer:'AMADA',name:'HG 1303 configurable',forceT:130,lengthMm:3110,strokeMm:250,daylightMm:520,throatMm:420,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'European',source:'reconstructed',verified:false}
,{id:'lvd-toolcell',manufacturer:'LVD',name:'ToolCell configurable',forceT:135,lengthMm:3050,strokeMm:250,daylightMm:570,throatMm:400,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'Wila',source:'reconstructed',verified:false}
,{id:'saf-darley-e-brake',manufacturer:'SafanDarley',name:'E-Brake configurable',forceT:100,lengthMm:3100,strokeMm:300,daylightMm:590,throatMm:300,axes:['Y1','Y2','X','R','Z1','Z2'],clamp:'European',source:'reconstructed',verified:false}

];
export const tools:Tool[]=[
{id:'p-tr-88-r1',kind:'punch',manufacturer:'TRUMPF',family:'Recto',name:'Punzón 88° R1',angle:88,radius:1,height:120,width:30,loadKnM:1000,clamp:'Trumpf',lengths:[25,50,100,200,500,835],source:'reconstructed',verified:false},
{id:'p-tr-goose',kind:'punch',manufacturer:'TRUMPF',family:'Cuello de cisne',name:'Cuello de cisne 86° R1.5',angle:86,radius:1.5,height:165,width:45,loadKnM:800,clamp:'Trumpf',lengths:[25,50,100,200,500],source:'reconstructed',verified:false},
{id:'p-am-30-r2',kind:'punch',manufacturer:'AMADA',family:'Agudo',name:'Punzón agudo 30° R2',angle:30,radius:2,height:145,width:32,loadKnM:700,clamp:'European',lengths:[10,15,20,40,50,100,200,415,835],source:'reconstructed',verified:false},
{id:'p-am-88-r1',kind:'punch',manufacturer:'AMADA',family:'Recto',name:'Punzón 88° R1',angle:88,radius:1,height:120,width:30,loadKnM:1000,clamp:'European',lengths:[10,15,20,40,50,100,200,415,835],source:'reconstructed',verified:false},
{id:'p-by-goose',kind:'punch',manufacturer:'Bystronic',family:'Cuello de cisne',name:'Cuello de cisne 86°',angle:86,radius:1.5,height:160,width:40,loadKnM:800,clamp:'Wila',lengths:[25,50,100,200,500,835],source:'reconstructed',verified:false},
{id:'p-ko-radius',kind:'punch',manufacturer:'KORPLEG',family:'Radio',name:'Punzón de radio R5',angle:90,radius:5,height:135,width:38,loadKnM:900,clamp:'European',lengths:[25,50,100,200,500],source:'reconstructed',verified:false},
{id:'d-tr-v8',kind:'die',manufacturer:'TRUMPF',family:'V simple',name:'Matriz V8 88°',angle:88,radius:1.2,height:60,width:45,v:8,loadKnM:1200,clamp:'Trumpf',lengths:[25,50,100,200,500,835],source:'reconstructed',verified:false},
{id:'d-tr-v12',kind:'die',manufacturer:'TRUMPF',family:'V simple',name:'Matriz V12 88°',angle:88,radius:1.8,height:60,width:50,v:12,loadKnM:1200,clamp:'Trumpf',lengths:[25,50,100,200,500,835],source:'reconstructed',verified:false},
{id:'d-am-v16',kind:'die',manufacturer:'AMADA',family:'V simple',name:'Matriz V16 85°',angle:85,radius:2,height:70,width:55,v:16,loadKnM:1400,clamp:'European',lengths:[10,15,20,40,50,100,200,415,835],source:'reconstructed',verified:false},
{id:'d-am-v20',kind:'die',manufacturer:'AMADA',family:'V simple',name:'Matriz V20 85°',angle:85,radius:2.5,height:70,width:60,v:20,loadKnM:1500,clamp:'European',lengths:[10,15,20,40,50,100,200,415,835],source:'reconstructed',verified:false},
{id:'d-by-v24',kind:'die',manufacturer:'Bystronic',family:'V simple',name:'Matriz V24 86°',angle:86,radius:3,height:78,width:70,v:24,loadKnM:1600,clamp:'Wila',lengths:[25,50,100,200,500,835],source:'reconstructed',verified:false},
{id:'d-ko-v32',kind:'die',manufacturer:'KORPLEG',family:'V simple',name:'Matriz V32 90°',angle:90,radius:4,height:85,width:85,v:32,loadKnM:1800,clamp:'European',lengths:[25,50,100,200,500],source:'reconstructed',verified:false}
,{id:'p-wila-acute',kind:'punch',manufacturer:'WILA',family:'Agudo',name:'Punzón 28° R1',angle:28,radius:1,height:150,width:32,loadKnM:650,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'p-rolla-radius',kind:'punch',manufacturer:'ROLLERI',family:'Radio',name:'Punzón radio R8',angle:90,radius:8,height:140,width:42,loadKnM:850,clamp:'European',lengths:[20,50,100,200,500],source:'reconstructed',verified:false}
,{id:'d-wila-v10',kind:'die',manufacturer:'WILA',family:'V simple',name:'Matriz V10 85°',angle:85,radius:1.5,height:68,width:48,v:10,loadKnM:1300,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'d-rolla-v40',kind:'die',manufacturer:'ROLLERI',family:'V simple',name:'Matriz V40 85°',angle:85,radius:5,height:90,width:95,v:40,loadKnM:1900,clamp:'European',lengths:[20,50,100,200,500],source:'reconstructed',verified:false}

,{id:'p-by-rect-88-r1',kind:'punch',manufacturer:'Bystronic',family:'Recto',name:'Punzón recto 88° R1',angle:88,radius:1,height:120,width:30,loadKnM:1000,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'p-by-acute-30-r2',kind:'punch',manufacturer:'Bystronic',family:'Agudo',name:'Punzón agudo 30° R2',angle:30,radius:2,height:145,width:34,loadKnM:700,clamp:'Wila',lengths:[20,50,100,200,500],source:'reconstructed',verified:false}
,{id:'p-by-radius-r5',kind:'punch',manufacturer:'Bystronic',family:'Radio',name:'Punzón radio R5',angle:90,radius:5,height:136,width:40,loadKnM:900,clamp:'Wila',lengths:[20,50,100,200,500],source:'reconstructed',verified:false}
,{id:'p-by-goose-deep',kind:'punch',manufacturer:'Bystronic',family:'Cuello de cisne',name:'Cuello de cisne profundo 86° R1.5',angle:86,radius:1.5,height:190,width:58,loadKnM:720,clamp:'Wila',lengths:[20,50,100,200,500],source:'reconstructed',verified:false}
,{id:'d-by-v8',kind:'die',manufacturer:'Bystronic',family:'V simple',name:'Matriz V8 86°',angle:86,radius:1.2,height:62,width:46,v:8,loadKnM:1200,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'d-by-v12',kind:'die',manufacturer:'Bystronic',family:'V simple',name:'Matriz V12 86°',angle:86,radius:1.8,height:65,width:50,v:12,loadKnM:1300,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'d-by-v16',kind:'die',manufacturer:'Bystronic',family:'V simple',name:'Matriz V16 86°',angle:86,radius:2,height:70,width:56,v:16,loadKnM:1400,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}
,{id:'d-by-v32',kind:'die',manufacturer:'Bystronic',family:'V simple',name:'Matriz V32 86°',angle:86,radius:4,height:84,width:86,v:32,loadKnM:1800,clamp:'Wila',lengths:[20,50,100,200,500,835],source:'reconstructed',verified:false}

];
