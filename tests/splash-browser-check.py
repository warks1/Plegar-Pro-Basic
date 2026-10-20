"""Prueba de carga real: no muestra botón para omitir y deja paso a Inicio al acabar."""
from pathlib import Path
import re,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
html=re.sub(r'<link rel="stylesheet"[^>]+>','',html)
css=(root/'styles.css').read_text()+'\n'+(root/'splash.css').read_text()
for a in ['splash-plegar-pro.webp','splash-composicion-pc.webp','splash-composicion-movil.webp','splash-fondo-movil.webp']:
 data='data:image/webp;base64,'+base64.b64encode((root/'assets'/a).read_bytes()).decode()
 html=html.replace('assets/'+a,data);css=css.replace('assets/'+a,data)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 page.add_style_tag(content=css)
 page.evaluate((root/'splash.js').read_text())
 assert page.locator('#startup-splash').is_visible()
 assert page.locator('#startup-skip').count()==0
 page.wait_for_timeout(650)
 assert int(page.locator('#startup-meter').get_attribute('aria-valuenow'))>5
 page.wait_for_timeout(4700)
 assert page.locator('#startup-splash').count()==0,'El splash no desapareció al terminar'
 assert page.locator('#brand-home').is_visible()
 assert not errors,errors
 print('OK: progreso animado, sin botón omitir, apertura automática tras ~5 segundos')
 browser.close()
