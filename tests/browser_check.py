from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,re
root=Path(__file__).resolve().parents[1]
html=re.sub(r'<script src="[^"]+" defer></script>', '', (root/'index.html').read_text())
html=re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
css='\n'.join((root/x).read_text() for x in ('styles.css','editor2d.css'))
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
  for script in ('geometry2d.js','editor2d.js','app.js'):
   page.evaluate((root/script).read_text())
  assert page.locator('#project-name').inner_text()=='Soporte motor S235'
  print('navigating',tag,flush=True)
  if w<=1120: page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  page.locator('#ed-svg').wait_for()
  assert page.locator('[data-ed-segment]').count()==5
  assert page.locator('.ed-bend-point').count()==4
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
  print('steps',tag,flush=True)
  page.locator('#ed-add').click()
  assert page.locator('[data-ed-segment]').count()==6
  print('loading',tag,flush=True)
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {window.__testStorage=window.__testStorage||new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorage.get(k)??null,setItem:(k,v)=>window.__testStorage.set(k,String(v)),removeItem:k=>window.__testStorage.delete(k)}})}""")
  for script in ('geometry2d.js','editor2d.js','app.js'):
   page.evaluate((root/script).read_text())
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  assert page.locator('[data-ed-segment]').count()==6
  assert page.locator('#ed-total').inner_text().startswith('476 mm')
  overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth+2')
  if overflow:
   out=page.evaluate('''() => [...document.querySelectorAll("body *")].filter(x=>x.getBoundingClientRect().right>innerWidth+4).slice(0,14).map(x=>({name:x.tagName,cl:x.className?.baseVal??x.className,id:x.id,right:Math.round(x.getBoundingClientRect().right)}))''')
   print(tag,'overflow elements',out,flush=True)
   issues.append((tag,'horizontal scroll',page.evaluate('({scroll:document.documentElement.scrollWidth,inner:innerWidth})')))
  if errors:issues.append((tag,'page errors',errors))
  # Screenshot omitted on restricted navigation environment
  print(tag,'OK',w,'x',h,'scroll?',overflow,'errors',errors)
  page.close()
 browser.close()

if issues:
 print(issues)
 sys.exit(2)
