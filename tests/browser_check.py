from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,re
root=Path(__file__).resolve().parents[1]
html=re.sub(r'<script src="[^"]+" defer></script>', '', (root/'index.html').read_text())
html=re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
css='\n'.join((root/x).read_text() for x in ('styles.css','editor2d.css','forming2d.css'))
issues=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for tag,w,h in [('pc',1440,900),('tablet',820,1180),('phone',390,844),('compact-phone',320,720)]:
  print('start',tag,flush=True)
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  page.set_default_timeout(2500)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  print('loading',tag,flush=True)
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {window.__testStorage=window.__testStorage||new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorage.get(k)??null,setItem:(k,v)=>window.__testStorage.set(k,String(v)),removeItem:k=>window.__testStorage.delete(k)}})}""")
  for script in ('geometry2d.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','forming2d.js','forming2d-view.js','editor2d.js','app.js'):
   page.evaluate((root/script).read_text())
  assert page.locator('#project-name').inner_text()=='Soporte motor S235'
  print('navigating',tag,flush=True)
  if w<=1120: page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  page.locator('#ed-svg').wait_for()
  assert page.locator('[data-ed-segment]').count()==5
  assert page.locator('#ed-flat').inner_text().endswith('mm')
  assert page.locator('#ed-bend-table tr').count()==4
  assert page.locator('#ed-vratio').inner_text().startswith('8')
  assert page.locator('.ed-bend-point').count()==4
  assert page.locator('#ed-forming .f2d-svg').count()==1
  assert page.locator('.f2-prior-summary').count()==1
  # v0.5: the drawing uses a sampled circular arc, not two straight legs.
  page.locator('#f2-range').fill('100')
  arc_path=page.locator('.f2d-svg path[stroke="url(#f2d-sheet)"]').get_attribute('d')
  assert arc_path.count('L')>=20
  assert 'Radio interior supuesto' in page.locator('.f2-stage').inner_text()
  page.locator('#f2-range').fill('0')
  assert page.locator('.f2-step-label').inner_text().startswith('Paso 1')
  page.locator('[data-f2-action="next"]').click()
  assert 'pliegue 2' in page.locator('.f2-step-label').inner_text()
  page.locator('#f2-range').fill('60')
  assert page.locator('.f2-progress').inner_text()=='60 %'
  page.locator('[data-f2-action="reset"]').click()
  assert page.locator('.f2-progress').inner_text()=='0 %'
  print('editing',tag,flush=True)
  page.locator('input[data-ed-segment="1"]').fill('91')
  page.locator('input[data-ed-segment="1"]').evaluate('(el)=>el.blur()')
  assert page.locator('#ed-total').inner_text().startswith('416 mm')
  page.locator('#ed-undo').click()
  assert page.locator('#ed-total').inner_text().startswith('410 mm')
  page.locator('#ed-redo').click()
  assert page.locator('#ed-total').inner_text().startswith('416 mm')
  page.locator('button[data-ed-select="3"]').click()
  page.locator('#ed-up').click()
  assert page.locator('[data-ed-select]').nth(1).get_attribute('data-ed-select')=='3'
  page.locator('#ed-radius').fill('3')
  page.locator('#ed-radius').evaluate('(el)=>el.blur()')
  assert page.locator('#ed-radius').input_value()=='3'
  assert page.locator('#ed-deduction').inner_text().endswith('mm')
  page.locator('#ed-backgauge').fill('30')
  page.locator('#ed-backgauge').evaluate('(el)=>el.blur()')
  assert page.locator('#ed-backgauge').input_value()=='30'
  assert 'Tope X 30' in page.locator('#ed-forming .f2-nominal').inner_text()
  assert 'Tope:' in page.locator('#ed-forming .f2-notes').inner_text()
  page.locator('#ed-die').select_option('v6-88')
  assert 'V/e' in page.locator('#ed-calc-warnings').inner_text()
  page.locator('#ed-undo').click()
  assert page.locator('#ed-die').input_value()=='v16-88'
  page.locator('#ed-redo').click()
  assert page.locator('#ed-die').input_value()=='v6-88'
  print('steps',tag,flush=True)
  page.locator('#ed-add').click()
  assert page.locator('[data-ed-segment]').count()==6
  print('loading',tag,flush=True)
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {window.__testStorage=window.__testStorage||new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorage.get(k)??null,setItem:(k,v)=>window.__testStorage.set(k,String(v)),removeItem:k=>window.__testStorage.delete(k)}})}""")
  for script in ('geometry2d.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','forming2d.js','forming2d-view.js','editor2d.js','app.js'):
   page.evaluate((root/script).read_text())
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  assert page.locator('[data-ed-segment]').count()==6
  assert page.locator('#ed-total').inner_text().startswith('476 mm')
  assert page.locator('#ed-radius').input_value()=='3'
  assert page.locator('#ed-die').input_value()=='v6-88'
  assert page.locator('#ed-backgauge').input_value()=='30'
  assert page.locator('.f2-step').count()==5
  overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth+2')
  if overflow:
   out=page.evaluate('''() => [...document.querySelectorAll("body *")].filter(x=>x.getBoundingClientRect().right>innerWidth+4).slice(0,14).map(x=>({name:x.tagName,cl:x.className?.baseVal??x.className,id:x.id,right:Math.round(x.getBoundingClientRect().right)}))''')
   print(tag,'overflow elements',out,flush=True)
   issues.append((tag,'horizontal scroll',page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')))
  if errors:issues.append((tag,'page errors',errors))
  # Independent view consumes the same saved 2D profile without altering Home.
  if w<=1120: page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 2D"]').click()
  assert page.locator('.module-forming .f2d-svg').count()==1
  assert page.locator('.f2-step').count()==5
  page.locator('[data-f2-step="4"]').click()
  assert 'pliegue 5' in page.locator('.f2-step-label').inner_text()
  assert page.locator('.f2-notes').inner_text()
  page.locator('[data-f2-action="previous"]').click()
  assert 'pliegue 4' in page.locator('.f2-step-label').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2')
  page.locator('#brand-home').click()
  assert not page.locator('#module-view').is_visible()
  assert page.locator('#machine-panel').is_visible()
  # Screenshot omitted on restricted navigation environment
  print(tag,'OK',w,'x',h,'scroll?',overflow,'errors',errors)
  page.close()
 browser.close()

if issues:
 print(issues)
 sys.exit(2)
