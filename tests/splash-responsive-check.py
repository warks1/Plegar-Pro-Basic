"""Prueba visual aislada del splash: imágenes reales como data URLs, sin acceso HTTP local."""
from pathlib import Path
import re, base64, tempfile
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def url(p): return 'data:image/webp;base64,'+base64.b64encode((ROOT/p).read_bytes()).decode('ascii')
html=(ROOT/'index.html').read_text()
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
html=re.sub(r'<link rel="stylesheet"[^>]+>','',html)
css=(ROOT/'styles.css').read_text()+'\n'+(ROOT/'splash.css').read_text()
for asset in ['splash-plegar-pro.webp','splash-hero-desktop.webp','splash-hero-mobile.webp']:
    css=css.replace('assets/'+asset,url('assets/'+asset))
    html=html.replace('assets/'+asset,url('assets/'+asset))
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1440,900),(820,1180),(390,844),(320,700),(844,390),(667,375)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.set_content(html,wait_until='load')
        page.add_style_tag(content=css)
        page.evaluate((ROOT/'splash.js').read_text())
        img=page.locator('.pp-splash-hero')
        assert img.evaluate('(el)=>el.complete && el.naturalWidth>0'),f'Imagen sin cargar {width}'
        assert img.evaluate('(el)=>el.currentSrc.length>1000')
        art=page.locator('.pp-splash-art').bounding_box()
        meter=page.locator('.pp-splash-meter').bounding_box()
        skip=page.locator('.pp-splash-skip').bounding_box()
        for item,name in [(art,'imagen'),(meter,'barra'),(skip,'omitir')]:
            assert item is not None, f'{name} no visible {width}'
            assert item['x']>=-1 and item['x']+item['width']<=width+1, (width,name,item)
            assert item['y']>=-1 and item['y']+item['height']<=height+1,(width,name,item)
        
        vw=page.evaluate('({doc:document.documentElement.scrollWidth, viewport:innerWidth, splash:document.getElementById("startup-splash").scrollWidth, splashClient:document.getElementById("startup-splash").clientWidth})')
        print('Sizes',width,vw)
        assert vw['splash']<=vw['splashClient']+1,f'Desbordamiento en splash {width} {vw}'
        assert page.locator('.pp-splash-emblem').count()==2
        if width in (390,320,844,1440): page.screenshot(path=str(Path(tempfile.gettempdir()) / f'plegar-v31-splash-{width}.png'))
        page.wait_for_timeout(600)
        assert int(page.locator('#startup-meter').get_attribute('aria-valuenow'))>=5,f'Barra no progresa {width}'
        page.locator('#startup-skip').click(timeout=2000)
        assert page.locator('#startup-splash').get_attribute('class').find('pp-splash-done')>=0
        assert page.locator('#brand-home').is_visible(), f'Interfaz no visible {width}'
        assert not errors,(width,errors)
        print(f'OK {width}×{height}: logotipo y barra visibles, animación, sin desbordamiento, omitir funciona')
        page.close()
    browser.close()
