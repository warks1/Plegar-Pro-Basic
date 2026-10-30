"""Regresión: los visores 2D NO pueden quedarse en blanco en móvil/PC."""
from pathlib import Path
import re, json, shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'index.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script src="([^"]+)" defer></script>',raw)
html=re.sub(r'<script src="[^"]+" defer></script>','',raw)
links=re.findall(r'<link rel="stylesheet" href="([^"]+)">',html)
html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
css='\n'.join((ROOT/path).read_text(encoding='utf-8') for path in links)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**({'channel':'chrome'} if shutil.which('google-chrome') else {}))
 for w,h in [(390,844),(1280,860)]:
  context=browser.new_context(viewport={'width':w,'height':h})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda error: errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()}});}""")
  page.evaluate("document.getElementById('startup-splash')?.remove()")
  for path in scripts:
   if path!='splash.js':page.evaluate((ROOT/path).read_text(encoding='utf-8'))
  page.evaluate("PlegarApp.switchScreen('Programación 2D')")
  editor=page.evaluate("""() => {const el=document.querySelector('#ed-svg'),r=el.getBoundingClientRect();return {polyline:el.querySelectorAll('polyline').length,markup:el.innerHTML.length,width:r.width,height:r.height,visible:!!(r.width&&r.height),error:document.querySelector('#editor-status')?.textContent,inline:!!document.querySelector('#ed-forming .f2d-svg')}}""")
  assert page.locator('#ed-tool-drawings svg.catalog-section').count()>=2,'No se muestran secciones de utillaje 2D/3D'
  assert 'pata de cabra' in page.locator('#ed-tool-drawings').inner_text().lower(),'Falta nombre de pata de cabra'
  page.evaluate("PlegarApp.switchScreen('Simulación 2D')")
  simulation=page.evaluate("""() => {const el=document.querySelector('.f2-camera-content'),stage=document.querySelector('.f2-stage'),svg=el?.querySelector('svg'),r=stage?.getBoundingClientRect();return {svg:!!svg,svgLength:svg?.outerHTML.length||0,width:r?.width||0,height:r?.height||0,datum:document.querySelector('.f2-data-values')?.textContent||'',controls:document.querySelectorAll('[data-f2-action]').length}}""")
  print('AUDITORÍA VISOR 2D',w,json.dumps({'editor':editor,'sim':simulation,'errors':errors[-10:]},ensure_ascii=False),flush=True)
  assert editor['visible'] and editor['polyline']>=2 and editor['markup']>100, 'Editor sin dibujo'
  assert simulation['svg'] and simulation['width']>50 and simulation['height']>50 and simulation['datum'], 'Simulación 2D en blanco'
  # El punzón elegido cambia tanto el perfil físico dibujado como el programa guardado.
  assert page.locator('[data-f2-punch] option').count()>=50
  initial_punch=page.locator('.f2d-svg [data-component="punzon"]').get_attribute('d')
  page.locator('[data-f2-punch]').select_option('wila-p-15.700')
  assert page.evaluate('PlegarEditor2D.getData().setup.punch')=='wila-p-15.700'
  assert 'PATA DE CABRA' in page.locator('.f2-tool-preview').inner_text()
  assert page.locator('.f2-tool-preview svg.catalog-section').count()==1
  assert page.locator('[data-f2-source]').get_attribute('href').endswith('.jpg')
  goose=page.locator('.f2d-svg [data-component="punzon"]').get_attribute('d')
  assert goose!=initial_punch,'Cambiar el modelo de punzón debe cambiar también la silueta'
  page.locator('[data-f2-punch]').select_option('wila-p-15.620')
  assert 'PUNZÓN RECTO' in page.locator('.f2-tool-preview').inner_text()
  assert page.locator('.f2d-svg [data-component="punzon"]').get_attribute('d')!=goose
  page.locator('[data-f2-die]').select_option('wila-d-25.407')
  assert page.evaluate('PlegarEditor2D.getData().setup.die')=='wila-d-25.407'
  assert not errors,errors[-5:]
  before=page.locator('.f2d-svg [data-component="punzon"]').get_attribute('d')
  page.locator('.f2-range').evaluate("(el)=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));}")
  after=page.locator('.f2d-svg [data-component="punzon"]').get_attribute('d')
  assert before!=after,'El punzón no se mueve al avanzar la simulación 2D'
  page.locator('[data-f2-action="reset"]').click()
  page.locator('[data-f2-action="play"]').click()
  assert 'Pausar' in page.locator('[data-f2-action="play"]').inner_text(),'El reproductor 2D no se inicia'
  page.locator('[data-f2-action="play"]').click()
  assert not errors,errors[-5:]
  context.close()
 browser.close()
