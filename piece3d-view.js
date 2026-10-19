/* Browser viewer for the editable project's idealized 3D sheet geometry. */
(function(){
 'use strict';
 const S=window.PlegarFormingGeometry,M=window.PlegarPiece3D;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active=null;
 function render(){
  const c=active;if(!c||!c.host.isConnected)return;
  const p=c.getData(),s=S.scene(p,c.step,c.progress),mesh=M.build(s,c.width),projection=M.project(mesh,c.yaw,c.elevation,c.zoom);
  const polys=projection.faces.map(f=>`<polygon points="${f.points.map(v=>v.x.toFixed(2)+','+v.y.toFixed(2)).join(' ')}" fill="${f.kind==='upper'?'#479fc4':f.kind==='lower'?'#225576':'#9bd9f1'}" stroke="#b4ecff" stroke-width=".8" stroke-linejoin="round"/>`).join('');
  c.host.querySelector('.p3-stage').innerHTML=`<svg viewBox="0 0 900 480" class="p3-svg" role="img" aria-label="Chapa tridimensional geométrica aproximada, sin modelo físico ni colisiones verificadas"><rect width="900" height="480" fill="#071a29"/><path d="M0 405H900M0 205H900" stroke="#14344b" stroke-width="1"/>${polys}<text x="16" y="30" fill="#a1d9f1" font-size="13">PIEZA NOMINAL · PASO ${s.step}/${s.steps} · GIRO ${Math.round(s.currentAngle*10)/10}°</text><text x="16" y="454" fill="#eec48c" font-size="12">Ancho ${c.width} mm ILUSTRATIVO · sin orientación CNC ni físicas</text></svg>`;
  c.host.querySelector('.p3-state').textContent=`Pliegue ${s.bend} · ${c.progress===1?'fin del paso':'avance '+Math.round(c.progress*100)+' %'} · espesor ${s.thickness} mm · malla ${mesh.vertices.length} vértices, ${mesh.faces.length} caras`;
  c.host.querySelector('.p3-width').value=String(c.width);c.host.querySelector('.p3-progress').value=String(Math.round(c.progress*100));
  c.host.querySelector('.p3-step').textContent=`Paso ${s.step} / ${s.steps}`;
  c.host.querySelector('[data-p3="prev"]').disabled=c.step===0;
  c.host.querySelector('[data-p3="next"]').disabled=c.step===p.sequence.length-1;
 }
 function destroy(){active=null;}
 function mount(host,getData,getSelection=()=>1,onSelect=()=>{}){
  destroy();if(!host)return;
  const p=getData();active={host,getData,getSelection,onSelect,step:Math.max(0,p.sequence.indexOf(getSelection())),progress:1,width:100,yaw:38,elevation:24,zoom:1};
  host.innerHTML=`<section class="p3-view" aria-label="Modelo tridimensional geométrico de la pieza"><div class="p3-heading"><div><strong>MODELO GEOMÉTRICO 3D · CHAPA</strong><small>Derivado de Programación 2D · sin plegadora CAD</small></div><span>PREVISUALIZACIÓN v0.8</span></div><div class="p3-stage"></div><div class="p3-state" role="status"></div><div class="p3-controls"><button data-p3="prev" type="button">← Pliegue</button><span class="p3-step"></span><button data-p3="next" type="button">Siguiente →</button><button data-p3="left" type="button">↶ Girar</button><button data-p3="right" type="button">↷ Girar</button><button data-p3="zin" type="button">+ Zoom</button><button data-p3="zout" type="button">− Zoom</button><button data-p3="reset" type="button">Restablecer vista</button></div><div class="p3-values"><label>Avance de pliegue <input class="p3-progress" aria-label="Avance geométrico" type="range" min="0" max="100" step="1" value="100"/></label><label>Ancho de previsualización (mm) <input class="p3-width" type="number" min="1" max="5000" step="1" value="100"/></label></div><p class="p3-disclosure">Esta malla extruye el perfil 2D calculado con un ancho de demostración, no guardado en el proyecto. Los pliegues anteriores se aproximan mediante bisagras agudas en un plano. No incorpora máquina, ejes, punzón, matriz, contacto real, deformación, auto-colisión 3D o verificación de seguridad.</p></section>`;
  host.onclick=e=>{
   if(!active||active.host!==host)return;
   const k=e.target.closest('[data-p3]')?.dataset.p3;if(!k)return;
   const c=active,p=c.getData();
   if(k==='prev'||k==='next'){c.step=Math.max(0,Math.min(p.sequence.length-1,c.step+(k==='next'?1:-1)));c.onSelect(p.sequence[c.step]);}
   if(k==='left')c.yaw-=15;if(k==='right')c.yaw+=15;
   if(k==='zin')c.zoom=Math.min(2.5,c.zoom+.1);if(k==='zout')c.zoom=Math.max(.5,c.zoom-.1);
   if(k==='reset'){c.yaw=38;c.elevation=24;c.zoom=1;}
   render();
  };
  host.oninput=e=>{if(!active||active.host!==host)return;
   if(e.target.matches('.p3-progress'))active.progress=Number(e.target.value)/100;
   else if(e.target.matches('.p3-width')){
    const value=Number(e.target.value);if(!Number.isFinite(value)||value<=0||value>5000)return;
    active.width=value;
   }else return;
   render();
  };
  render();
 }
 window.PlegarPiece3DView={mount,destroy};
})();
