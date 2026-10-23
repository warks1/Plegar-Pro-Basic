"""Prueba real de navegador: cuatro tarjetas 3D, orden editable y ciclo continuo."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)" defer></script>',raw)
html=re.sub(r'<script src="[^"]+" defer></script>','',raw)
links=re.findall(r'<link rel="stylesheet" href="([^"]+)">',html)
html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
css='\n'.join((ROOT/path).read_text() for path in links)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(1280,860),(390,844)]:
  context=browser.new_context(viewport={'width':w,'height':h})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("document.getElementById('startup-splash')?.remove()")
  for source in scripts:
   if source=='splash.js':continue
   page.evaluate((ROOT/source).read_text())
  # Se acelera exclusivamente el reloj de ensayo; el motor real sigue a velocidad 1x.
  page.evaluate("""() => {
   const raw=PlegarSequenceTimeline.advance;
   PlegarSequenceTimeline.advance=(state,dt,steps,options)=>raw(state,dt*120,steps,options);
  }""")
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  assert page.locator('#ed-example-gallery [data-example-id]').count()==4
  svg_views=page.locator('#ed-example-gallery .example-gadget svg').all_inner_htmls()
  assert len(set(svg_views))==4,'Cuatro piezas no tienen cuatro geometrías diferentes'
  page.locator('#ed-example-gallery [data-example-id="u"]').click()
  assert page.evaluate('PlegarEditor2D.getData().segments')==[55,100,55]
  page.locator('[data-ed-position="2"]').select_option('1')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[2,1]
  page.locator('#ed-order-reset').click()
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2]
  page.locator('#ed-order-pick').click()
  page.locator('[data-ed-bend="2"]').click()
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[2,1]
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 2D"]').click()
  page.locator('[data-f2-action="play"]').click()
  page.wait_for_function("""() => document.querySelector('.f2-step-label')?.textContent.includes('Paso 2 de 2') &&
   document.querySelector('.f2-progress')?.textContent.includes('100 %')""",timeout=12000)
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 3D"]').click()
  assert page.locator('.p3-example-gallery [data-example-id]').count()==4
  assert page.locator('.p3-order-list select').count()==2
  page.locator('[data-p3-order="0"]').select_option('1')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2]
  page.locator('[data-p3="play"]').click()
  page.wait_for_function("""() => document.querySelector('.p3-step')?.textContent.includes('Paso 2 / 2') &&
   document.querySelector('.p3-progress')?.value==='100'""",timeout=12000)
  page.locator('.p3-example-gallery [data-example-id="omega"]').click()
  assert len(page.evaluate('PlegarEditor2D.getData().segments'))==5
  assert page.locator('.p3-svg polygon[data-group="sheet"]').count()>0
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),"Desbordamiento horizontal"
  assert not errors,(w,errors)
  print(f'Cinemática continua y 4 piezas 3D · {w} px OK',flush=True)
  context.close()
 browser.close()
