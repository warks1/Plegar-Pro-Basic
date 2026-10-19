"""Prueba de enlace de un PDF del repositorio con Programación 2D y Simulación 3D."""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=re.sub(r'<script src="[^"]+" defer></script>', '', (ROOT/'index.html').read_text())
HTML=re.sub(r'<link rel="stylesheet"[^>]+>', '', HTML)
CSS='\n'.join((ROOT/f).read_text() for f in ('styles.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css','cad-crossings.css','cad-tangency.css','plans.css'))
SCRIPTS=['geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','cad-crossings.js','cad-crossings-view.js','cad-tangency.js','cad-tangency-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','fold-kinematics.js','tooling3d.js','scene3d-audit.js','proximity3d.js','sweep3d.js','piece3d-view.js','editor2d.js','plans-core.js','repo-plans.js','plans-view.js','app.js']
FAKE_IDB=r'''() => {const stores={folders:new Map(),plans:new Map()};const copy=x=>structuredClone(x);function req(d){const r={result:null,onsuccess:null,onerror:null};setTimeout(()=>{r.result=copy(d);r.onsuccess?.();},0);return r;}const db={createObjectStore(name){return {createIndex(){}}},transaction(name){const t={oncomplete:null,onerror:null};t.objectStore=()=>({getAll:()=>req([...stores[name].values()]),get:id=>req(stores[name].get(id)),put:row=>{stores[name].set(row.id,copy(row));setTimeout(()=>t.oncomplete?.(),0)},delete:id=>{stores[name].delete(id);setTimeout(()=>t.oncomplete?.(),0)}});return t;}};Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(){const r={result:db,onupgradeneeded:null,onsuccess:null};setTimeout(()=>{r.onupgradeneeded?.();setTimeout(()=>r.onsuccess?.(),0)},0);return r}}});const storage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))}}); }'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1440,900),(820,1180),(390,844),(320,720)]:
  context=browser.new_context(viewport={'width':width,'height':height});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML,wait_until='domcontentloaded');page.add_style_tag(content=CSS);page.evaluate(FAKE_IDB)
  for source in SCRIPTS:page.evaluate((ROOT/source).read_text())
  if width<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Planos"]').click()
  page.wait_for_selector('.pl-item')
  assert page.locator('.pl-item').count()==10,page.locator('.pl-item').count()
  assert page.locator('.pl-item img').count()==10
  page.locator('.pl-item [data-action="program"]').first.click()
  page.wait_for_selector('#ed-plan-reference:not([hidden])')
  assert 'Geometría pendiente' in page.locator('#ed-plan-reference').inner_text()
  assert not page.locator('#ed-plan-sim3d').is_enabled()
  # Programación no puede fabricar ni simular sin medidas introducidas.
  page.locator('#ed-plan-create').click()
  assert page.locator('#ed-plan-sim3d').is_disabled()
  assert 'Introduce dos tramos' in page.locator('#editor-status').inner_text()
  page.locator('#ed-plan-length1').fill('30')
  page.locator('#ed-plan-length2').fill('30')
  page.locator('#ed-plan-angle').fill('90')
  page.locator('#ed-plan-thickness').fill('1.5')
  page.locator('#ed-plan-create').click()
  assert page.locator('#ed-plan-sim3d').is_enabled()
  assert page.evaluate('PlegarEditor2D.getData().name').startswith('IV6-')
  page.locator('#ed-plan-sim3d').click()
  page.wait_for_selector('.p3-player') if page.locator('.p3-player').count() else page.wait_for_selector('.p3-viewer') if page.locator('.p3-viewer').count() else None
  assert page.locator('#module-title').inner_text()=='Simulación 3D'
  assert page.evaluate('PlegarEditor2D.getData().segments')==[30,30]
  assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+2')
  assert not errors,errors
  print('Planos → Programación → Simulación 3D',width,'OK',flush=True)
  context.close()
 browser.close()