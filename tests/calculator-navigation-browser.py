"""Regresión de Inicio: tres pestañas y alta local de proyectos; PC y smartphone."""
from pathlib import Path
import re, shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'index.html').read_text(encoding='utf-8')
scripts=re.findall(r'<script src="([^"]+)" defer></script>',raw)
html=re.sub(r'<script src="[^"]+" defer></script>','',raw)
styles=re.findall(r'<link rel="stylesheet" href="([^"]+)">',html)
html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
css='\n'.join((ROOT/path).read_text(encoding='utf-8') for path in styles)

with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],
  **({'channel':'chrome'} if shutil.which('google-chrome') else {}))
 for w,h in [(390,844),(1280,860)]:
  context=browser.new_context(viewport={'width':w,'height':h})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {
    const map=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:k=>map.has(k)?map.get(k):null,
      setItem:(k,v)=>map.set(k,String(v)),
      removeItem:k=>map.delete(k),
      clear:()=>map.clear()
    }});
  }""")
  page.evaluate("document.getElementById('startup-splash')?.remove()")
  for path in scripts:
   if path!='splash.js':
    page.evaluate((ROOT/path).read_text(encoding='utf-8'))

  for tab,screen in [('Desarrollo','Calculadora de plegado'),
                     ('Fuerza','Calculadora de plegado'),
                     ('Curva perfecta','Curva perfecta')]:
   page.evaluate("PlegarApp.switchScreen('Inicio')")
   button=page.locator(f'#calc-tabs [data-calc="{tab}"]')
   assert button.count()==1,tab
   button.click()
   assert page.locator('#module-title').inner_text()==screen, f'{tab}: no navega a {screen}'
   assert page.locator('#module-view').is_visible(),tab
   assert 'selected' in button.get_attribute('class'),f'{tab} no queda seleccionada'
   assert not errors,f'Pestaña {tab}: {errors[-5:]}'

  page.evaluate("PlegarApp.switchScreen('Proyectos')")
  count_before=page.evaluate('PlegarApp.getProjects().length')
  page.locator('#new-project').click()
  assert page.locator('#dialog').is_visible()
  page.locator('#new-project-name').fill('Soporte nuevo v130')

  # Simular cuota llena / acceso restringido al almacenamiento del navegador.
  page.evaluate("""() => {
    window.__savedStorageSet=localStorage.setItem;
    localStorage.setItem=(key,value)=>{
      if(key==='plegarpro-demo-projects')throw new Error('QuotaExceededError');
      return window.__savedStorageSet(key,value);
    };
  }""")
  page.locator('#confirm-project').click()
  assert page.evaluate('PlegarApp.getProjects().length')==count_before,'Un fallo de guardado mutó la lista local'
  assert page.locator('#dialog').is_visible(),'El diálogo debe permitir reintentar'
  assert 'No se ha guardado' in page.locator('#toast').inner_text()
  assert not errors,errors[-5:]

  page.evaluate("localStorage.setItem=window.__savedStorageSet")
  page.locator('#confirm-project').click()
  assert not page.locator('#dialog').is_visible()
  assert page.evaluate('PlegarApp.getProjects().length')==count_before+1
  result=page.evaluate("""() => {
    const p=PlegarApp.getProjects()[0];
    const stored=JSON.parse(localStorage.getItem('plegarpro-demo-projects'));
    return {p,stored,parse:Date.parse(p.time)};
  }""")
  assert result['p']['name']=='Soporte nuevo v130'
  assert re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z',result['p']['time']),result
  assert result['stored'][0]['time']==result['p']['time']
  assert result['parse']>0
  assert not errors,errors[-5:]
  print(f'Calculadora Desarrollo/Fuerza/Curva y proyectos ISO/offline OK: {w}x{h}',flush=True)
  context.close()
 browser.close()
