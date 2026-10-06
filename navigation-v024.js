const ROUTE_FALLBACKS={
  '/programacion-2d':'/programador-pieza','/programacion-3d':'/programador-pieza','/cad-cam-3d':'/programador-pieza',
  '/simulacion-2d':'/programacion-2d','/simulacion-3d':'/programacion-3d','/calculadora-desarrollo':'/desarrollo'
};
function icon(){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>`}
function goBack(){
  const path=window.location.pathname;
  try{
    const previous=sessionStorage.getItem('pp.previousRoute');
    if(previous&&previous!==path){history.back();return;}
  }catch{}
  window.location.assign(ROUTE_FALLBACKS[path]||'/');
}
function install(){
  const topbar=document.querySelector('.topbar');
  if(topbar&&!topbar.querySelector('.pp-global-back')){
    const button=document.createElement('button');
    button.type='button';button.className='pp-global-back';button.setAttribute('aria-label','Volver a la pantalla anterior');
    button.innerHTML=icon()+'<span>Volver</span>';button.addEventListener('click',goBack);
    const menu=topbar.querySelector('.menu-button');menu?.after(button);
  }
  const version=document.querySelector('.build-version');if(version)version.textContent='v0.24.0 · BOCETO 2 Y NAVEGACIÓN PRO';
  document.querySelectorAll('.content > *').forEach(el=>{if(!el.classList.contains('pp-view-ready')){el.classList.add('pp-view-ready');el.animate?.([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:330,easing:'cubic-bezier(.2,.8,.2,1)'})}});
}
let last=window.location.pathname;
try{sessionStorage.setItem('pp.currentRoute',last)}catch{}
const observer=new MutationObserver(()=>{const current=window.location.pathname;if(current!==last){try{sessionStorage.setItem('pp.previousRoute',last);sessionStorage.setItem('pp.currentRoute',current)}catch{}last=current;}install()});
observer.observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('popstate',install);document.addEventListener('DOMContentLoaded',install);install();
