"""PlegadoX TITANIUM: la pantalla se retira únicamente cuando el arranque realmente termina."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
html=re.sub(r'<link rel="stylesheet"[^>]+>','',html)
css=(root/'styles.css').read_text(encoding='utf-8')+'\n'+(root/'titanium-splash.css').read_text(encoding='utf-8')
script=(root/'titanium-splash.js').read_text(encoding='utf-8')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load');page.add_style_tag(content=css);page.evaluate(script)
 assert page.locator('#startup-splash').is_visible()
 # Sin módulos listos nunca se falsea 100 %, se muestra Reintentar.
 page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
 assert page.locator('#ti-retry').is_visible()
 assert int(page.locator('#startup-meter').get_attribute('aria-valuenow'))<100
 assert page.locator('#startup-splash').count()==1
 assert not errors,errors
 page.close()
 # Interfaz y módulos listos: llega a 100% y desaparece sin espera artificial.
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load');page.add_style_tag(content=css)
 page.evaluate("""() => {
   window.PlegarApp={switchScreen(){}};
   window.PlegarHomeDashboard={init(){}};
   document.getElementById('menu-nav').appendChild(document.createElement('div'));
   document.getElementById('projects').appendChild(document.createElement('div'));
 }""")
 page.evaluate(script)
 page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
 assert page.locator('#startup-meter').get_attribute('aria-valuenow')=='100'
 page.wait_for_timeout(550)
 assert page.locator('#startup-splash').count()==0
 assert page.locator('#brand-home').is_visible()
 assert not errors,errors
 print('OK TITANIUM: estado real, error recuperable y paso automático al inicio')
 browser.close()
