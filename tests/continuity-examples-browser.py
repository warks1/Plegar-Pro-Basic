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
  # Comprobar gestos sintéticos Pointer Events con la misma lógica de captura táctil.
  def gesture(selector):
   return page.evaluate("""selector => {
    const el=document.querySelector(selector),r=el.getBoundingClientRect(),
      x=r.left+r.width/2,y=r.top+r.height/2;
    const send=(type,id,dx,dy)=>el.dispatchEvent(new PointerEvent(type,{
     pointerId:id,pointerType:'touch',clientX:x+dx,clientY:y+dy,bubbles:true,cancelable:true}));
    send('pointerdown',51,-60,0);send('pointerdown',52,60,0);
    send('pointermove',52,125,0);
    const zoom=Number(el.dataset.touchScale);
    send('pointerup',51,-60,0);send('pointerup',52,125,0);
    el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));
    return {zoom,reset:Number(el.dataset.touchScale),hasCamera:!!el.querySelector('.touch-camera-content,.p3-camera-content,.f2-camera-content')};
   }""",selector)
  assert page.locator('.home-machine-photo').is_visible()
  assert 'nominal NO CNC' in page.locator('.calc-output strong').inner_text()
  assert page.locator('.calc-fields input[readonly]').count()==4
  assert page.locator('#realistic-option').get_attribute('aria-pressed')=='true'
  assert page.locator('#home-machine-cad').is_hidden()
  main_gesture=gesture('#home-machine-3d')
  assert main_gesture['zoom']>1 and main_gesture['reset']==1 and main_gesture['hasCamera']
  prev_gesture=gesture('#home-preview-3d')
  assert prev_gesture['zoom']>1 and prev_gesture['reset']==1 and prev_gesture['hasCamera']
  page.locator('#home-view-model').click()
  assert page.locator('#home-machine-cad').is_visible()
  assert page.locator('.home-machine-photo').is_hidden()
  page.locator('#realistic-option').click()
  assert page.locator('.home-machine-photo').is_visible()
  # Inicio: visor geométrico animado y cuatro miniaturas de distinta geometría.
  assert page.locator('#home-machine-3d svg.home-simulation-svg').count()==1
  assert page.locator('#home-machine-3d polygon[data-group="punch"]').count()>0
  assert page.locator('#home-machine-3d polygon[data-group="sheet"]').count()>0
  assert page.locator('.machine-stage > img').count()==0
  assert page.locator('#home-preview-3d svg.home-preview-svg').count()==1
  assert page.locator('.preview-image > img').count()==0
  cards=page.locator('#projects .home-project-thumb svg').evaluate_all('(els)=>els.map(el=>el.innerHTML)')
  assert len(cards)==8 and len(set(cards))==8,'Cada proyecto reciente debe tener su plano 2D y una pieza 3D diferentes'
  previous=page.locator('#home-preview-3d').inner_html()
  page.locator('#projects [data-project="1"]').click()
  assert page.locator('#project-name').inner_text()=='Cubierta lateral Inox 304'
  assert page.locator('#home-preview-3d').inner_html()!=previous
  page.locator('#play').click()
  assert page.locator('#home-machine-cad').is_visible(), 'Reproducir debe usar el modelo geométrico'
  page.wait_for_function("""() => document.querySelector('#step-description')?.textContent==='Pieza terminada' &&
   document.querySelector('#home-machine-3d polygon[data-group="punch"]')""",timeout=10000)
  print('Inicio animado, vista previa y cuatro miniaturas verificadas',w,flush=True)
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Proyectos"]').click()
  assert page.locator('.project-work-buttons').count()>=12
  assert page.locator('[data-project-action="plan"]').count()>=12
  page.locator('[data-project-action="plan"]').first.click()
  assert page.locator('#dialog[open] .project-plan-dialog svg').count()==2
  assert 'NO ES PLANO DE FABRICACIÓN' in page.locator('#dialog-body').inner_text()
  page.locator('#dialog-close').click()
  page.locator('[data-project-action="program2d"]').first.click()
  assert page.locator('#ed-workplan table').count()==1
  assert page.locator('#ed-export-workplan').count()==1
  # Los módulos de cálculo ya no deben ser pantallas provisionales.
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Calculadora de plegado"]').click()
  assert page.locator('.development-tools .development-kpi').count()==1
  assert page.locator('.development-tools .ed-flat-svg').count()==1
  assert page.locator('.development-tools [data-dev-open-editor]').is_visible()
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Comparador de V"]').click()
  assert page.locator('.development-tools [data-dev-die]').count()>=10
  ratio=page.locator('.development-table-scroll tr').count()
  assert ratio>=11
  page.locator('.development-tools [data-dev-die]').first.click()
  assert page.locator('#ed-die').count()==1
  assert page.evaluate('PlegarEditor2D.getData().setup.die') is not None
  assert page.locator('#ed-basis').count()==1 and page.locator('#ed-quick-basis').count()==1
  assert page.locator('#ed-flat-pattern .ed-flat-svg').count()==1
  outside=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),PlegarEditor2D.getData().setup).flat')
  page.locator('#ed-quick-basis').select_option('inner')
  assert page.evaluate('PlegarEditor2D.getData().setup.dimensionBasis')=='inner'
  inside=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),PlegarEditor2D.getData().setup).flat')
  assert abs(outside-inside)>0.01
  page.locator('#ed-basis').select_option('outer')
  assert page.evaluate('PlegarEditor2D.getData().setup.dimensionBasis')=='outer'
  assert page.locator('#ed-flat-pattern .ed-flat-table-wrap tr').count()>1
  measured=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),{...PlegarEditor2D.getData().setup,kFactor:0.42}).flat')
  page.locator('#ed-trial-flat').fill(str(measured))
  page.locator('#ed-calibrate-k').click()
  assert abs(page.evaluate('PlegarEditor2D.getData().setup.kFactor')-0.42)<0.0001
  assert page.locator('#ed-example-gallery [data-example-id]').count()==4
  svg_views=page.locator('#ed-example-gallery .example-gadget svg').evaluate_all('(els)=>els.map(el=>el.innerHTML)')
  assert len(svg_views)==8 and len(set(svg_views))==8,'Cada tarjeta debe mostrar un plano 2D y una geometría 3D propios'
  assert page.locator('#ed-quick-material').count()==1 and page.locator('#ed-quick-punch').count()==1
  assert page.locator('#ed-quick-die').count()==1
  page.locator('#ed-quick-material').select_option('Inox 304')
  assert page.evaluate('PlegarEditor2D.getData().material')=='Inox 304'
  page.locator('#ed-quick-thickness').fill('1.5')
  page.locator('#ed-quick-thickness').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().thickness')==1.5
  page.locator('#ed-quick-v').click()
  assert page.evaluate('PlegarEditor2D.getData().setup.die')=='v12-88'
  page.locator('#ed-example-gallery [data-example-id="omega"]').click()
  page.locator('#ed-quick-height').fill('60')
  page.locator('#ed-quick-height').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().setup.dieHeight')==60
  assert 'Perfil omega' in page.locator('#ed-auto-plan').inner_text()
  assert 'H matriz 60 mm' in page.locator('#ed-auto-plan').inner_text()
  assert page.locator('#ed-apply-auto').count()==1
  page.locator('#ed-apply-auto').click()
  assert sorted(page.evaluate('PlegarEditor2D.getData().sequence'))==[1,2,3,4]
  assert 'NO VERIFICADO' in page.locator('#ed-auto-plan').inner_text()
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
  assert gesture('.f2-stage')['zoom']>1
  page.locator('[data-f2-action="play"]').click()
  page.wait_for_function("""() => document.querySelector('.f2-step-label')?.textContent.includes('Paso 2 de 2') &&
   document.querySelector('.f2-progress')?.textContent.includes('100 %')""",timeout=12000)
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 3D"]').click()
  assert page.locator('.p3-example-gallery [data-example-id]').count()==4
  assert page.locator('.p3-order-list select').count()==2
  page.locator('[data-p3-order="0"]').select_option('1')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2]
  assert gesture('.p3-stage')['zoom']>1
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
