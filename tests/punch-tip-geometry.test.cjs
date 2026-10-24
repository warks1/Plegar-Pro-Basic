'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const T=require('../toolprofiles2d.js');
const C=require('../tool-library.js');
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`Esperado ${b}, obtenido ${a}`);
for(const angle of [30,88])for(const nose of [1,2])for(const height of [null,100,120,150]){
 test(`Punzón ${angle}° R${nose} H${height??'nominal'}: flancos tangentes al arco, punta alineada`,()=>{
  const tipY=-12.5,opening=16;
  const p=T.punch({punchAngle:angle,punchNose:nose,punchTipY:tipY,dieOpening:opening,punchHeight:height});
  const arcStart=p.outline[3],arcEnd=p.outline[23],tip=p.outline[13];
  const alpha=angle*Math.PI/360,centerY=tipY-nose;
  near(arcStart.x,nose*Math.cos(alpha));
  near(arcStart.y,centerY+nose*Math.sin(alpha));
  near(arcEnd.x,-arcStart.x);
  near(arcEnd.y,arcStart.y);
  near(tip.x,0);near(tip.y,tipY);
  // Derivada de la curva circular al unirse al flanco en su primer punto.
  const topFlank=p.outline[2];
  near((arcStart.x-topFlank.x)/(arcStart.y-topFlank.y),-Math.tan(alpha),1e-5);
  // El cuerpo crece en altura, no en anchura al aumentar H.
  assert.ok(p.outline[1].y<p.outline[2].y);
  near(p.outline[0].x,-p.outline[1].x);
  assert.equal(p.verified,false);
 });
}
test('Cada punzón del catálogo interno conserva radio y altura al generar su sección nominal',()=>{
 for(const tool of C.PUNCHES){
  const x=T.punch({punchAngle:tool.angle,punchNose:tool.nose,punchTipY:0,dieOpening:16,punchHeight:tool.height});
  near(x.nose,tool.nose);near(x.angle,tool.angle);
  if(tool.height)near(x.outline[0].y,-tool.height);
  assert.equal(x.outline.length,25);
 }
});
test('El perfil de punta es idéntico en H100/H150 si se conservan R y ángulo',()=>{
 const cfg={punchAngle:30,punchNose:1,punchTipY:0,dieOpening:16};
 const a=T.punch({...cfg,punchHeight:100}),b=T.punch({...cfg,punchHeight:150});
 assert.deepEqual(a.outline.slice(2,24),b.outline.slice(2,24));
 near(a.outline[0].x,b.outline[0].x);
 assert.notEqual(a.outline[0].y,b.outline[0].y);
});
