"""PlegadoX TITANIUM: escenario SVG y barra accesibles en pantallas comunes."""
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
  for width,height in [(1440,900),(1920,1080),(820,1180),(1024,768),(390,844),(320,568),(375,812),(320,700),(844,390),(667,375)]:
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.add_style_tag(content=css)
    page.evaluate(script)
    assert page.locator('#startup-splash').is_visible(), (width,height,'pantalla de carga')
    assert page.locator('.ti-machine').count()==1,(width,'sin máquina SVG')
    assert page.locator('#ti-punch').count()==1,(width,'sin punzón')
    assert page.locator('#ti-sheet').count()==1,(width,'sin chapa')
    assert ''.join(page.locator('.ti-name').inner_text().split())=='PLEGADOX'
    assert page.locator('#startup-meter').get_attribute('aria-valuenow') is not None
    for selector in ['.ti-top','.ti-title','.ti-stage','.ti-bottom','.ti-footer']:
      box=page.locator(selector).bounding_box()
      assert box and box['width']>20 and box['height']>5,(width,height,selector,box)
      assert box['x']>=-2 and box['x']+box['width']<=width+3,(width,height,selector,box)
      assert box['y']>=-3 and box['y']+box['height']<=height+4,(width,height,selector,box)
    assert not errors,(width,height,errors)
    print(f'OK TITANIUM {width}x{height}')
    page.close()

  # Valida también la composición real incrustada, no solo el fallback.
  embedded=(root/'titanium-loading.html').read_text(encoding='utf-8')
  for width,height in [(320,568),(390,844),(844,390),(1440,900)]:
    page=browser.new_page(viewport={'width':width,'height':height})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(embedded,wait_until='load')
    assert page.locator('svg.machine').count()==1
    assert page.locator('.brand').is_visible()
    assert page.locator('#progressArea').is_visible()
    assert page.locator('.copyright').is_visible()
    overflow=page.evaluate('({width:document.body.scrollWidth,height:document.body.scrollHeight})')
    assert overflow['width']<=width+1 and overflow['height']<=height+1,(width,height,overflow)
    assert not errors,(width,height,errors)
    print(f'OK TITANIUM incrustado {width}x{height}')
    page.close()
  browser.close()
