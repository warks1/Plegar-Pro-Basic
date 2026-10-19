/* Plegar Pro Plus v0.9: shared-data projected 3D sheet + GENERIC tool envelopes. */
(function(){
 'use strict';
 const S=window.PlegarFormingGeometry,M=window.PlegarPiece3D,T=window.PlegarTooling3D;
 let active=null;
 const palette={sheet:{upper:'#479fc4',lower:'#225576',edge:'#9bd9f1'},punch:{cap:'#bccbd8',side:'#778e9e'},die:{cap:'#8599aa',side:'#354b5d'},gauge:{cap:'#d9ae68',side:'#926735'}};
 function render(){
  const c=active;if(!c||!c.host.isConnected)return;
  const p=c.getData(),s=S.scene(p,c.step,c.progress),sheet=M.build(s,c.width);
  const combined=T.assemble(sheet,s,c.visible);
  const projection=M.project(combined,c.yaw,c.elevation,c.zoom);
  const polys=projection.faces.map(f=>{
   const colors=palette[f.group]||palette.sheet;
   const fill=colors[f.kind]||colors.side||colors.edge;
   return `<polygon data-group="${f.group}" points="${f.points.map(v=>v.x.toFixed(2)+','+v.y.toFixed(2)).join(' ')}" fill="${fill}" stroke="${f.group==='sheet'?'#b4ecff':'#bdcbd4'}" stroke-width=".8" stroke-linejoin="round"/>`;
  }).join('');
  c.host.querySelector('.p3-stage').innerHTML=`<svg viewBox="0 0 900 480" class="p3-svg" role="img" aria-label="Vista 3D de chapa, punzón, matriz y tope nominales: esquema sin colisiones verificadas"><rect width="900" height="480" fill="#071a29"/><path d="M0 405H900M0 205H900" stroke="#14344b" stroke-width="1"/>${polys}<text x="16" y="30" fill="#a1d9f1" font-size="13">PIEZA + UTILLAJE NOMINAL · PASO ${s.step}/${s.steps} · GIRO ${Math.round(s.currentAngle*10)/10}°</text><text x="16" y="454" fill="#eec48c" font-size="12">Ancho ${c.width} mm ILUSTRATIVO · geometría genérica, sin simulación física ni CNC</text></svg>`;
  const names={punch:'Punzón',die:'Matriz',gauge:'Tope'};
  for(const key of Object.keys(names)){
   const button=c.host.querySelector(`[data-p3-toggle="${key}"]`);
   button.setAttribute('aria-pressed',String(c.visible[key]));
   button.textContent=`${c.visible[key]?'☑':'☐'} ${names[key]}`;
  }
  c.host.querySelector('.p3-state').textContent=`Pliegue ${s.bend} · ${c.progress===1?'fin del paso':'avance '+Math.round(c.progress*100)+' %'} · espesor ${s.thickness} mm · V${s.dieOpening} · punzón ${s.punchAngle}° · tope X ${s.stop.x} mm · ${combined.faces.length} caras ilustrativas`;
  c.host.querySelector('.p3-width').value=String(c.width);c.host.querySelector('.p3-progress').value=String(Math.round(c.progress*100));
  c.host.querySelector('.p3-step').textContent=`Paso ${s.step} / ${s.steps}`;
  c.host.querySelector('[data-p3="prev"]').disabled=c.step===0;
  c.host.querySelector('[data-p3="next"]').disabled=c.step===p.sequence.length-1;
 }
 function destroy(){if(active?.host){active.host.onclick=null;active.host.oninput=null;}active=null;}
 function mount(host,getData,getSelection=()=>1,onSelect=()=>{}){
  destroy();if(!host)return;
  const p=getData();active={host,getData,getSelection,onSelect,step:Math.max(0,p.sequence.indexOf(getSelection())),progress:1,width:100,yaw:38,elevation:24,zoom:1,visible:{punch:true,die:true,gauge:true}};
  host.innerHTML=`<section class="p3-view" aria-label="Previsualización tridimensional de pieza y utillaje"><div class="p3-heading"><div><strong>MODELO GEOMÉTRICO 3D · CHAPA Y UTILLAJE</strong><small>Conectado a Programación 2D · perfiles paramétricos genéricos</small></div><span>PREVISUALIZACIÓN v0.9</span></div><div class="p3-stage"></div><div class="p3-state" role="status"></div><div class="p3-tool-switch" role="group" aria-label="Elementos 3D visibles"><strong>VISIBILIDAD</strong><button data-p3-toggle="punch" type="button" aria-pressed="true">☑ Punzón</button><button data-p3-toggle="die" type="button" aria-pressed="true">☑ Matriz</button><button data-p3-toggle="gauge" type="button" aria-pressed="true">☑ Tope</button></div><div class="p3-controls"><button data-p3="prev" type="button">← Pliegue</button><span class="p3-step"></span><button data-p3="next" type="button">Siguiente →</button><button data-p3="left" type="button">↶ Girar</button><button data-p3="right" type="button">↷ Girar</button><button data-p3="zin" type="button">+ Zoom</button><button data-p3="zout" type="button">− Zoom</button><button data-p3="reset" type="button">Restablecer vista</button></div><div class="p3-values"><label>Avance de pliegue <input class="p3-progress" aria-label="Avance geométrico" type="range" min="0" max="100" step="1" value="100"/></label><label>Ancho de previsualización (mm) <input class="p3-width" type="number" min="1" max="5000" step="1" value="100"/></label></div><p class="p3-disclosure">Los contornos del punzón y de la matriz se extruyen desde perfiles 2D GENÉRICOS, no procedentes de planos certificados del fabricante. El tope X es un bloque nominal fijo, sin eje controlado. La chapa tiene espesor y ancho ilustrativo, y los pliegues anteriores son bisagras aproximadas. No existen detección de colisiones CAD, trayectorias barridas, contacto, fuerzas, recuperación elástica, control CNC ni validación de seguridad. No utilizar esta vista para fabricar o asegurar una secuencia.</p></section>`;
  host.onclick=e=>{
   if(!active||active.host!==host)return;
   const toggle=e.target.closest('[data-p3-toggle]')?.dataset.p3Toggle;
   if(toggle){if(toggle in active.visible){active.visible[toggle]=!active.visible[toggle];render();}return;}
   const k=e.target.closest('[data-p3]')?.dataset.p3;if(!k)return;
   const c=active,p=c.getData();
   if(k==='prev'||k==='next'){c.step=Math.max(0,Math.min(p.sequence.length-1,c.step+(k==='next'?1:-1)));c.onSelect(p.sequence[c.step]);}
   if(k==='left')c.yaw-=15;if(k==='right')c.yaw+=15;
   if(k==='zin')c.zoom=Math.min(2.5,c.zoom+.1);if(k==='zout')c.zoom=Math.max(.5,c.zoom-.1);
   if(k==='reset'){c.yaw=38;c.elevation=24;c.zoom=1;}
   render();
  };
  host.oninput=e=>{
   if(!active||active.host!==host)return;
   if(e.target.matches('.p3-progress'))active.progress=Number(e.target.value)/100;
   else if(e.target.matches('.p3-width')){const value=Number(e.target.value);if(!Number.isFinite(value)||value<=0||value>5000)return;active.width=value;}
   else return;
   render();
  };
  render();
 }
 window.PlegarPiece3DView={mount,destroy};
})();
