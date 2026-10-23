from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=re.sub(r'<script src="[^"]+" defer></script>','',(root/'index.html').read_text())
html=re.sub(r'<link rel="stylesheet"[^>]+>','',html)
styles=('styles.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css','cad-crossings.css','cad-tangency.css')
scripts=('geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','cad-crossings.js','cad-crossings-view.js','cad-tangency.js','cad-tangency-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','plan-drawing.js','examples3d.js','sequence-timeline.js','fold-kinematics.js','tooling3d.js','scene3d-audit.js','proximity3d.js','sweep3d.js','piece3d-view.js','plan-trace.js','editor2d.js','app.js')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
 page.set_content(html,wait_until='domcontentloaded');page.add_style_tag(content='\n'.join((root/x).read_text() for x in styles))
 page.evaluate("""() => {window.__testStorage=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorage.get(k)??null,setItem:(k,v)=>window.__testStorage.set(k,String(v)),removeItem:k=>window.__testStorage.delete(k)}})}""")
 for f in scripts:page.evaluate((root/f).read_text())
 page.locator('button.nav-item[data-screen="Simulación 3D"]').click()
 page.locator('[data-p3="next"]').click();page.locator('[data-p3="next"]').click()
 page.locator('.p3-progress').fill('60')
 page.locator('.p3-view').screenshot(path='/mnt/data/Plegar_Pro_Plus_v026_Cinematica_3D.png')
 print('Captured',page.locator('.p3-sweep').inner_text()[:600])
 browser.close()
