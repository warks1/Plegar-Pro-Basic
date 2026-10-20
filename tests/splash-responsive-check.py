"""Comprueba la pantalla de carga completa en orientación vertical, horizontal y formatos extremos."""
from pathlib import Path
import re,base64,tempfile
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
def as_url(p):return 'data:image/webp;base64,'+base64.b64encode((root/p).read_bytes()).decode()
html=(root/'index.html').read_text()
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
html=re.sub(r'<link rel="stylesheet"[^>]+>','',html)
css=(root/'styles.css').read_text()+'\n'+(root/'splash.css').read_text()
for name in ['splash-plegar-pro.webp','splash-hero-desktop.webp','splash-hero-mobile.webp','splash-composicion-pc.webp','splash-composicion-movil.webp','splash-fondo-movil.webp']:
    css=css.replace('assets/'+name,as_url('assets/'+name))
    html=html.replace('assets/'+name,as_url('assets/'+name))
assert 'Omitir presentación' not in html
assert 'startup-skip' not in (root/'splash.js').read_text()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(1440,900),(1920,1080),(820,1180),(1024,768),(390,844),(320,568),(375,812),(320,700),(844,390),(667,375)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        page.add_style_tag(content=css)
        page.evaluate((root/'splash.js').read_text())
        img=page.locator('.pp-splash-hero')
        assert img.evaluate('(el)=>el.complete && el.naturalWidth>0'),f'Imagen rota {width}'
        assert img.evaluate('(el)=>el.currentSrc.length>1000'),f'Imagen no incorporada {width}'
        boxes={k:page.locator(k).bounding_box() for k in ('.pp-splash','.pp-splash-art','.pp-splash-hero','.pp-splash-copy','.pp-splash-meter','#startup-status')}
        assert all(boxes.values()),(width,boxes)
        for element,rect in boxes.items():
            assert rect['width']>=1 and rect['height']>=1,(width,element,rect)
            assert rect['x']>=-2 and rect['x']+rect['width']<=width+2,(width,element,rect)
            assert rect['y']>=-2 and rect['y']+rect['height']<=height+2,(width,element,rect)
        splash=boxes['.pp-splash']
        assert splash['width']>=width-2 and splash['height']>=height-2,(width,height,splash)
        img_box=boxes['.pp-splash-hero']
        # Both the full-image visual composition and animated progress fit in the visible viewport.
        assert img_box['width']>=min(width*.4,350),(width,'imagen excesivamente pequeña',img_box)
        # v0.35: sin bandas vacías creadas por object-fit: contain. La imagen escala al área disponible.
        art_box=boxes['.pp-splash-art']
        assert img_box['width']>=art_box['width']-2,(width,'imagen no expandida horizontalmente',img_box,art_box)
        assert img_box['height']>=art_box['height']-2,(width,'imagen no expandida verticalmente',img_box,art_box)
        assert img.evaluate('(el)=>getComputedStyle(el).objectFit')=='fill',(width,'la composición no ocupa el área')
        assert page.locator('.pp-splash-emblem').count()==2
        assert page.locator('.pp-splash-skip').count()==0
        assert page.evaluate('document.getElementById("startup-splash").scrollWidth<=document.getElementById("startup-splash").clientWidth+1'),width
        if (width,height) in ((1440,900),(390,844),(320,568),(844,390)):
            page.screenshot(path=str(Path(tempfile.gettempdir())/f'plegar-v35-{width}x{height}.png'))
        page.wait_for_timeout(550)
        assert int(page.locator('#startup-meter').get_attribute('aria-valuenow'))>=5,(width,'barra sin animar')
        assert not errors,(width,errors)
        print(f'OK {width}x{height}, pantalla completa, logo y progreso visibles, sin omitir')
        page.close()
    browser.close()
