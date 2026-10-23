"""Prueba Zoom, desplazamiento, anotaciones y confirmación obligatoria en Programación 2D."""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=re.sub(r'<script src="[^"]+" defer></script>', '', (ROOT/'index.html').read_text())
HTML=re.sub(r'<link rel="stylesheet"[^>]+>', '', HTML)
CSS='\n'.join((ROOT/f).read_text() for f in ('styles.css','responsive-v32.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css','cad-crossings.css','cad-tangency.css','plans.css'))
SCRIPTS=['geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','cad-crossings.js','cad-crossings-view.js','cad-tangency.js','cad-tangency-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','metal-render.js','plan-drawing.js','examples3d.js','sequence-timeline.js','fold-kinematics.js','tooling3d.js','scene3d-audit.js','proximity3d.js','sweep3d.js','piece3d-view.js','plan-trace.js','editor2d.js','plans-core.js','repo-plans.js','plans-view.js','app.js']
FAKE_IDB=r'''()=>{const stores={folders:new Map(),plans:new Map()};function req(v){const r={onsuccess:null,onerror:null,result:undefined};setTimeout(()=>{r.result=structuredClone(v);r.onsuccess?.()},0);return r}const db={createObjectStore(){return {createIndex(){}}},transaction(name){const tx={oncomplete:null};tx.objectStore=()=>({getAll:()=>req([...stores[name].values()]),get:id=>req(stores[name].get(id)),put:row=>{stores[name].set(row.id,structuredClone(row));setTimeout(()=>tx.oncomplete?.(),0)},delete:id=>{stores[name].delete(id);setTimeout(()=>tx.oncomplete?.(),0)}});return tx;}};Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){const r={result:db,onupgradeneeded:null,onsuccess:null};setTimeout(()=>{r.onupgradeneeded?.();setTimeout(()=>r.onsuccess?.(),0)},0);return r}}});const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))}});}'''
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(1440,900),(820,1180),(390,844),(320,720)]:
  ctx=browser.new_context(viewport={'width':w,'height':h});p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(HTML,wait_until='domcontentloaded');p.add_style_tag(content=CSS);p.evaluate(FAKE_IDB)
  for js in SCRIPTS:p.evaluate((ROOT/js).read_text())
  if w<=1120:p.locator('#open-menu').click()
  p.locator('button.nav-item[data-screen="Planos"]').click();p.locator('.pl-item [data-action="program"]').first.click();p.wait_for_selector('#ed-plan-viewer')
  assert not p.locator('#ed-plan-sim3d').is_enabled()
  assert '/vistas/' in p.locator('#ed-plan-viewer img').get_attribute('src')
  p.locator('#ed-plan-length1').fill('30')
  p.locator('#ed-plan-zoom-in').click();assert '130' in p.locator('#ed-plan-zoom-label').inner_text()
  assert p.locator('#ed-plan-length1').input_value()=='30'
  view=p.locator('#ed-plan-viewer');box=view.bounding_box();p.locator('#ed-plan-mark-mode').click()
  p.mouse.click(box['x']+box['width']*.35,box['y']+box['height']*.35)
  p.mouse.click(box['x']+box['width']*.6,box['y']+box['height']*.6)
  assert p.locator('.ed-plan-traced').count()==1
  assert p.locator('#ed-plan-sim3d').is_disabled()
  assert 'SIN VERIFICAR' in p.locator('#ed-plan-reference').inner_text()
  p.locator('#ed-plan-mark-mode').click()
  p.locator('#ed-plan-length2').fill('30');p.locator('#ed-plan-angle').fill('90');p.locator('#ed-plan-thickness').fill('1.5');p.locator('#ed-plan-create').click()
  assert p.locator('#ed-plan-sim3d').is_enabled()
  p.locator('#ed-plan-length1').fill('32')
  p.locator('#ed-plan-length1').blur()
  assert p.locator('#ed-plan-sim3d').is_disabled(), 'Cambiar cotas debe revocar perfil anterior'
  p.locator('#ed-plan-create').click()
  assert p.locator('#ed-plan-sim3d').is_enabled()
  assert p.locator('.ed-plan-traced').count()==1
  assert not p.evaluate('document.documentElement.scrollWidth > innerWidth+2')
  assert not errors,(w,errors)
  p.locator('#ed-plan-sim3d').click();assert p.locator('#module-title').inner_text()=='Simulación 3D'
  print('Visor Planos → Programación → Simulación 3D:',w,'OK',flush=True);ctx.close()
 browser.close()
