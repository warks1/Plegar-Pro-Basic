"""Comprobación responsive de Inicio, Planos, Programación 2D y Simulación 3D."""
from pathlib import Path
import ast,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ref=ast.parse((ROOT/'tests/plans-programming.test.py').read_text())
values={}
for statement in ref.body:
 if isinstance(statement,ast.Assign) and len(statement.targets)==1 and isinstance(statement.targets[0],ast.Name):
  try:values[statement.targets[0].id]=ast.literal_eval(statement.value)
  except (ValueError,TypeError):pass
HTML=re.sub(r'<script src="[^"]+" defer></script>','',(ROOT/'index.html').read_text())
HTML=re.sub(r'<link rel="stylesheet"[^>]+>','',HTML)
STYLES=['styles.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css','cad-crossings.css','cad-tangency.css','plans.css','responsive-v32.css']
CSS='\n'.join((ROOT/x).read_text() for x in STYLES)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in ((320,700),(390,844),(667,375),(820,1180),(1440,900)):
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(HTML,wait_until='domcontentloaded')
  page.add_style_tag(content=CSS)
  page.evaluate("document.getElementById('startup-splash')?.remove()")
  page.evaluate(values['FAKE_IDB'])
  for name in values['SCRIPTS']:page.evaluate((ROOT/name).read_text())
  for name in ('Inicio','Planos','Programación 2D','Simulación 3D','Inicio'):
   if name!='Inicio':
    if width<=1120:page.locator('#open-menu').click()
    page.locator(f'button.nav-item[data-screen="{name}"]').click()
   else:page.locator('#brand-home').click()
   page.wait_for_timeout(220)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),(width,name)
   assert page.evaluate('document.querySelector(".module-view").getBoundingClientRect().width <= innerWidth+2'),(width,name)
   assert not errors,(width,name,errors)
   if name=='Planos':assert page.locator('.pl-item').count()==10
   if name=='Programación 2D' and width<=700:
    assert page.locator('.ed-table-hint').is_visible()
    if width<=390:assert page.locator('.ed-table-wrap').evaluate('(el)=>el.scrollWidth>el.clientWidth')
  print(f'OK {width}x{height} — Inicio, Planos, Programación 2D y Simulación 3D',flush=True)
  page.close()
 browser.close()
