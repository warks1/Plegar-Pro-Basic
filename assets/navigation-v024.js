const ROUTE_FALLBACKS={
  '/programacion-2d':'/programador-pieza','/programacion-3d':'/programador-pieza','/cad-cam-3d':'/programador-pieza',
  '/simulacion-2d':'/programacion-2d','/simulacion-3d':'/programacion-3d','/calculadora-desarrollo':'/desarrollo'
};
function icon(){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>`}
function appBasePath(){
  const value=document.querySelector('base')?.getAttribute('href')||'/';
  return value.endsWith('/')?value:value+'/';
}
function goBack(){
  const path=window.location.pathname;
  try{
    const previous=sessionStorage.getItem('pp.previousRoute');
    if(previous&&previous!==path){history.back();return;}
  }catch{}
  const base=appBasePath();
  const relativePath=path.startsWith(base)?'/'+path.slice(base.length):path;
  const destination=ROUTE_FALLBACKS[relativePath]||'/';
  const segment=destination.startsWith('/')?destination.slice(1):destination;
  window.location.assign(base+segment);
}
function install(){
  const topbar=document.querySelector('.topbar');
  if(topbar&&!topbar.querySelector('.pp-global-back')){
    const button=document.createElement('button');
    button.type='button';button.className='pp-global-back';button.setAttribute('aria-label','Volver a la pantalla anterior');
    button.innerHTML=icon()+'<span>Volver</span>';button.addEventListener('click',goBack);
    const menu=topbar.querySelector('.menu-button');menu?.after(button);
  }
  const version=document.querySelector('.build-version');
  const versionLabel='v0.24.4 · ESTABILIDAD, AJUSTES Y NAVEGACIÓN PRO';
  if(version&&version.textContent!==versionLabel)version.textContent=versionLabel;
  document.querySelectorAll('.content > *').forEach(el=>{if(!el.classList.contains('pp-view-ready')){el.classList.add('pp-view-ready');el.animate?.([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:330,easing:'cubic-bezier(.2,.8,.2,1)'})}});
}
let last=window.location.pathname;
try{sessionStorage.setItem('pp.currentRoute',last)}catch{}
const observer=new MutationObserver(()=>{const current=window.location.pathname;if(current!==last){try{sessionStorage.setItem('pp.previousRoute',last);sessionStorage.setItem('pp.currentRoute',current)}catch{}last=current;}install()});
observer.observe(document.documentElement,{subtree:true,childList:true});
/* En móvil el menú lateral funciona como panel superpuesto y se cierra al navegar. */
document.addEventListener('click',event=>{
  if(window.matchMedia('(max-width: 700px)').matches&&event.target instanceof Element){
    const link=event.target.closest('.approved-nav a,.sidebar a');
    if(link){
      const button=document.querySelector('.menu-button');
      /* Deja que React confirme la navegación antes de consultar el estado del botón; evita un doble clic durante el mismo evento. */
      window.setTimeout(()=>{if(button&&button.getAttribute('aria-label')==='Contraer menú')button.click()},0);
    }
  }
});
window.addEventListener('popstate',install);document.addEventListener('DOMContentLoaded',install);install();
