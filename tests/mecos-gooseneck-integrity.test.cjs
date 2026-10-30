'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Library=require('../tool-library.js');
const Tool=require('../toolprofiles2d.js');
const View=require('../catalog-tool-view.js');
const near=(a,b,eps=1e-6)=>Math.abs(a-b)<eps;
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const overlap=(a,b,c,d)=>Math.max(Math.min(a,b),Math.min(c,d))<=Math.min(Math.max(a,b),Math.max(c,d))+1e-8;
function intersects(a,b,c,d) {
 if(!overlap(a.x,b.x,c.x,d.x)||!overlap(a.y,b.y,c.y,d.y))return false;
 const [p,q,r,s]=[cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)];
 // Colineales o puntos compartidos no adyacentes también invalidan el sólido.
 if(near(p,0)&&near(q,0)&&near(r,0)&&near(s,0))return true;
 return p*q<=0&&r*s<=0;
}
function integrity(points){
 assert.ok(points.length>=4);
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>1e-7,'Arista de longitud cero: '+i);
  for(let j=i+1;j<points.length;j++){
   if(j===i+1||(i===0&&j===points.length-1))continue;
   const c=points[j],d=points[(j+1)%points.length];
   assert.ok(!intersects(a,b,c,d),'Contorno autocruzado entre aristas '+i+' y '+j);
  }
 }
 const area=points.reduce((v,a,i)=>{const b=points[(i+1)%points.length];return v+a.x*b.y-b.x*a.y;},0)/2;
 assert.ok(Number.isFinite(area)&&Math.abs(area)>10,'Área degenerada');
}
test('los punzones MECOS pata de cabra mantienen garganta no autointersectada para extrusión',()=>{
 const punches=Library.PUNCHES.filter(p=>p.profileFamily==='gooseneck');
 assert.ok(punches.length>20);
 for(const punch of punches){
  const profile=Tool.punch({punchCatalogTool:punch,punchTipY:20});
  assert.doesNotThrow(()=>integrity(profile.outline),'Punzón '+punch.code);
  assert.equal(profile.verified,false);
 }
});
test('referencias distintas 15.700 y 15.710 muestran alcances distintos en 2D y 3D',()=>{
 const a=Library.PUNCHES.find(p=>p.code==='15.700'),b=Library.PUNCHES.find(p=>p.code==='15.710');
 assert.ok(a&&b);assert.equal(a.height,b.height);assert.ok(a.reach>b.reach);
 const pa=View.section(a),pb=View.section(b);
 const width=pts=>Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x));
 assert.ok(width(pa)>width(pb),'La pata de cabra 15.700 debe alcanzar más que 15.710');
 assert.notDeepEqual(pa,pb);
 const profiles=[a,b].map(t=>Tool.punch({punchCatalogTool:t,punchTipY:0}));
 assert.deepEqual(pa,profiles[0].outline);
 assert.deepEqual(pb,profiles[1].outline);
 assert.match(View.svg(a,'3d'),/15\.700/);
 assert.match(View.svg(b,'3d'),/15\.710/);
});
