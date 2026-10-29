"""Prueba real de navegador: cuatro tarjetas 3D, orden editable y ciclo continuo."""
from pathlib import Path
import re, shutil, base64
from xml.etree import ElementTree
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
raw=(ROOT/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)" defer></script>',raw)
html=re.sub(r'<script src="[^"]+" defer></script>','',raw)
links=re.findall(r'<link rel="stylesheet" href="([^"]+)">',html)
html=re.sub(r'<link rel="stylesheet"[^>]*>','',html)
css='\n'.join((ROOT/path).read_text() for path in links)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],**({'channel':'chrome'} if shutil.which('google-chrome') else {}))
 for w,h in [(1280,860),(390,844)]:
  context=browser.new_context(viewport={'width':w,'height':h})
  page=context.new_page()
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  # La página de pruebas se inyecta en about:blank (origen opaco): no dispone de
  # localStorage real. Simular su contrato en memoria para probar el flujo UI.
  page.evaluate("""() => {
    const data=new Map();
    Object.defineProperty(window,'localStorage',{configurable:true,value:{
      getItem:key=>data.has(key)?data.get(key):null,
      setItem:(key,value)=>data.set(key,String(value)),
      removeItem:key=>data.delete(key),
      clear:()=>data.clear()
    }});
  }""")
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
  page.locator('#home-view-model').click()
  assert page.locator('.home-machine-photo').is_hidden()
  assert page.locator('#home-machine-cad').is_visible()
  main_gesture=gesture('#home-machine-3d')
  assert main_gesture['zoom']>1 and main_gesture['reset']==1 and main_gesture['hasCamera']
  prev_gesture=gesture('#home-preview-3d')
  assert prev_gesture['zoom']>1 and prev_gesture['reset']==1 and prev_gesture['hasCamera']
  page.locator('#home-view-model').click()
  assert page.locator('#home-machine-cad').is_visible()
  # Comprobar controles que parecían no tener acción en móvil y escritorio.
  before_view=page.locator('#home-machine-cad').inner_html()
  page.locator('#views').click()
  assert page.locator('#home-view-menu').is_visible()
  assert page.locator('#views').get_attribute('aria-expanded')=='true'
  page.locator('[data-home-view="iso"]').click()
  assert page.locator('#home-view-menu').is_hidden()
  assert page.locator('#home-machine-cad').inner_html()!=before_view
  assert page.locator('#home-stage-readout').is_visible()
  page.locator('#maximize').click()
  assert page.locator('#machine-panel').evaluate('(el)=>getComputedStyle(el).position')=='fixed'
  page.locator('#maximize').click()
  assert page.locator('#machine-panel').evaluate('(el)=>getComputedStyle(el).position')!='fixed'

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
  assert page.locator('#home-loop').is_checked()
  page.wait_for_function("""() => document.querySelector('#step-description')?.textContent==='Pieza terminada' &&
   document.querySelector('#home-machine-3d polygon[data-group="punch"]')""",timeout=10000)
  # Una vez completado el ciclo se reinicia automáticamente, sin segundo toque en Play.
  page.wait_for_function("""() => document.querySelector('#step-description')?.textContent.startsWith('Pliegue') &&
    document.querySelector('#play')?.getAttribute('aria-label')?.includes('Pausar')""",timeout=7000)
  page.locator('#play').click()
  assert 'Reproducir' in page.locator('#play').get_attribute('aria-label')

  print('Inicio animado, vista previa y cuatro miniaturas verificadas',w,flush=True)
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Máquinas"]').click()
  assert page.locator('.machine-reference').is_visible()
  assert 'TRUMPF TrumaBend V85' in page.locator('.machine-reference').inner_text()
  assert '2040 mm' in page.locator('.machine-reference').inner_text()
  assert '3900 mm' in page.locator('.machine-reference').inner_text()
  assert page.evaluate('PlegarEditor2D.getData().setup.machineId')=='trumpf-v85'
  page.locator('[data-v85-stop]').select_option('support')
  page.locator('[data-machine-v85]').click()
  assert page.evaluate('PlegarEditor2D.getData().setup.backgaugeMode')=='support'
  page.locator('[data-v85-stop]').select_option('stop')
  page.locator('[data-machine-v85]').click()
  # Ajustar el montaje sin alterar las cotas copiadas de la pantalla.
  for key,value in [('dieHeight','60'),('ramBottomOffset','110')]:
   page.locator(f'[data-machine-measure="{key}"]').fill(value)
  page.locator('[data-machine-save]').click()
  assert page.evaluate('PlegarEditor2D.getData().setup.dieHeight')==60
  assert page.evaluate('PlegarEditor2D.getData().setup.ramBottomOffset')==110
  assert page.evaluate('PlegarMachineV85.data.table.L3')==25.25
  for key in ['dieHeight','ramBottomOffset']:
   page.locator(f'[data-machine-measure="{key}"]').fill('')
  page.locator('[data-machine-save]').click()
  assert page.evaluate('PlegarEditor2D.getData().setup.ramWidth') is None
  assert page.evaluate('PlegarEditor2D.getData().setup.tableLeft') is None
  assert page.evaluate('PlegarEditor2D.getData().setup.dieHeight') is None
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Utillaje"]').click()
  # Importación métrica desde un contorno cerrado real del archivo, sin convertirlo en útil homologado.
  page.locator('.tool-dxf-importer > details > summary').click()
  dxf_rows=[
   '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
   '0','SECTION','2','ENTITIES','0','LWPOLYLINE','90','4','70','1',
   '10','0','20','0','10','40','20','0','10','40','20','65','10','0','20','65',
   '0','ENDSEC','0','EOF'
  ]
  page.locator('.tool-dxf-form [name="brand"]').select_option('MECOS')
  page.locator('.tool-dxf-form [name="kind"]').select_option('die')
  page.locator('.tool-dxf-form [name="code"]').fill('V-LOCAL-PRUEBA')
  page.locator('.tool-dxf-form [name="description"]').fill('Sección DXF real de prueba')
  page.locator('.tool-dxf-form [name="lengthMm"]').fill('835')
  page.locator('.tool-dxf-form [name="file"]').set_input_files({
   "name":"perfil-de-prueba.dxf","mimeType":"text/plain","buffer":('\n'.join(dxf_rows)+'\n').encode('utf-8')
  })
  page.locator('.tool-dxf-form button[type="submit"]').click()
  page.wait_for_function("""() => document.querySelectorAll('.tool-dxf-card').length===1 ||
   document.querySelector('.tool-dxf-feedback')?.textContent.includes('No se pudo importar')""",timeout=8000)
  assert page.locator('.tool-dxf-card').count()==1, f"Importador: {page.locator('.tool-dxf-feedback').inner_text()} errores={errors[-3:]}"
  assert page.locator('.tool-dxf-art').count()==2
  assert '40 × 65 mm' in page.locator('.tool-dxf-card').inner_text()
  assert 'NO COLISIONES/CNC' in page.locator('.tool-dxf-card').inner_text()
  assert page.evaluate("JSON.parse(localStorage.getItem('plegarpro-tool-dxf-v1'))[0].collisionApproved")==False
  backup=page.evaluate('PlegarToolDXF.exportBackup()')
  assert 'plegar-pro-tool-profiles' in backup
  page.locator('[data-dxf-remove]').click()
  assert page.locator('.tool-dxf-card').count()==0
  page.locator('[data-dxf-backup-file]').set_input_files({
   "name":"mis-perfiles.json","mimeType":"application/json","buffer":backup.encode('utf-8')})
  page.wait_for_function("() => document.querySelectorAll('.tool-dxf-card').length===1",timeout=8000)
  assert '40 × 65 mm' in page.locator('.tool-dxf-card').inner_text()
  assert 'NO COLISIONES/CNC' in page.locator('.tool-dxf-card').inner_text()
  page.locator('[data-dxf-remove]').click()
  assert page.locator('.tool-dxf-card').count()==0
  # DXF clásico VERTEX/SEQEND (común en controles y CAD anteriores).
  classic_rows=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
   '0','SECTION','2','ENTITIES','0','POLYLINE','66','1','70','1',
   '10','0','20','0','30','0']
  for x,y in [(0,0),(25,0),(25,90),(0,90)]:
   classic_rows+=['0','VERTEX','10',str(x),'20',str(y),'30','0']
  classic_rows+=['0','SEQEND','0','ENDSEC','0','EOF']
  page.locator('.tool-dxf-form [name="brand"]').select_option('Bystronic')
  page.locator('.tool-dxf-form [name="kind"]').select_option('punch')
  page.locator('.tool-dxf-form [name="code"]').fill('P-CLASICO-R12')
  page.locator('.tool-dxf-form [name="description"]').fill('Perfil clásico DXF en mm')
  page.locator('.tool-dxf-form [name="file"]').set_input_files({
   "name":"punzon-r12.dxf","mimeType":"text/plain","buffer":('\n'.join(classic_rows)+'\n').encode('utf-8')})
  page.locator('.tool-dxf-form button[type="submit"]').click()
  page.wait_for_function("() => document.querySelectorAll('.tool-dxf-card').length===1",timeout=8000)
  assert '25 × 90 mm' in page.locator('.tool-dxf-card').inner_text()
  assert 'DXF ASCII POLYLINE' in page.locator('.tool-dxf-card').inner_text()
  assert page.locator('.tool-dxf-art').count()==2
  page.locator('[data-dxf-remove]').click()
  assert page.locator('.tool-dxf-card').count()==0
  # DXF con dos polilíneas: sección exterior + hueco interior auténtico, sin macizo falso.
  loops=[
   [(0,0),(100,0),(100,120),(0,120)],
   [(25,25),(45,25),(45,50),(25,50)]
  ]
  cavity_rows=['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
   '0','SECTION','2','ENTITIES']
  for contour in loops:
   cavity_rows+=['0','LWPOLYLINE','90',str(len(contour)),'70','1']
   for x,y in contour:cavity_rows+=['10',str(x),'20',str(y)]
  cavity_rows+=['0','ENDSEC','0','EOF']
  page.locator('.tool-dxf-form [name="brand"]').select_option('EUROSTAMP')
  page.locator('.tool-dxf-form [name="kind"]').select_option('die')
  page.locator('.tool-dxf-form [name="code"]').fill('V-HUECO-TEST')
  page.locator('.tool-dxf-form [name="description"]').fill('Matriz con cavidad exterior validada')
  page.locator('.tool-dxf-form [name="file"]').set_input_files({
   "name":"matriz-con-hueco.dxf","mimeType":"text/plain",
   "buffer":('\n'.join(cavity_rows)+'\n').encode('utf-8')})
  page.locator('.tool-dxf-form button[type="submit"]').click()
  page.wait_for_function("() => document.querySelectorAll('.tool-dxf-card').length===1",timeout=8000)
  assert '1 hueco(s)' in page.locator('.tool-dxf-card').inner_text()
  assert '11.500 mm²' in page.locator('.tool-dxf-card').inner_text()
  assert page.locator('.tool-dxf-card .tool-dxf-art').count()==2
  assert page.locator('.tool-dxf-card .tool-dxf-art [fill-rule="evenodd"]').count()==3
  assert page.evaluate("JSON.parse(localStorage.getItem('plegarpro-tool-dxf-v1'))[0].holes.length")==1
  assert page.evaluate("JSON.parse(localStorage.getItem('plegarpro-tool-dxf-v1'))[0].collisionApproved")==False
  # El visor 3D se construye desde el DXF, no una imagen repetida por marca.
  page.locator('.tool-dxf-card [data-dxf-3d-open]').click()
  assert page.locator('.tool-dxf-3d-viewer').is_visible()
  assert page.locator('.tool-dxf-3d-canvas').count()==1
  assert page.locator('.tool-dxf-3d-canvas [data-3d-face="hole-wall"]').count()>0
  assert 'NaN' not in page.locator('.tool-dxf-3d-canvas').evaluate('(el)=>el.outerHTML')
  assert 'LONGITUD AXIAL DESCONOCIDA' in page.locator('.tool-dxf-3d-canvas').text_content()
  first_svg=page.locator('.tool-dxf-3d-canvas').evaluate('(el)=>el.outerHTML')
  page.locator('[data-dxf-3d-action="right"]').click()
  assert page.locator('.tool-dxf-3d-canvas').evaluate('(el)=>el.outerHTML')!=first_svg
  page.locator('[data-dxf-3d-action="profile"]').click()
  assert 'Giro 0°' in page.locator('.tool-dxf-3d-canvas').text_content()
  page.locator('[data-dxf-3d-action="zoom-in"]').click()
  assert 'zoom 1.20×' in page.locator('.tool-dxf-3d-canvas').text_content()
  page.locator('[data-dxf-3d-action="close"]').click()
  assert page.locator('.tool-dxf-3d-viewer').is_hidden()
  # El usuario puede añadir o corregir el largo más tarde; no altera la sección.
  before_section=page.evaluate("JSON.stringify(PlegarToolDXF.read()[0].points)")
  page.locator('.tool-dxf-card [data-dxf-length-input]').fill('835')
  page.locator('.tool-dxf-card [data-dxf-length-save]').click()
  assert page.evaluate('PlegarToolDXF.read()[0].lengthMm')==835
  assert page.evaluate("JSON.stringify(PlegarToolDXF.read()[0].points)")==before_section
  page.locator('.tool-dxf-card [data-dxf-3d-open]').click()
  assert 'L axial 835 mm' in page.locator('.tool-dxf-3d-canvas').text_content()
  page.locator('[data-dxf-3d-action="close"]').click()
  page.locator('.tool-dxf-card [data-dxf-length-input]').fill('')
  page.locator('.tool-dxf-card [data-dxf-length-save]').click()
  assert page.evaluate('PlegarToolDXF.read()[0].lengthMm') is None
  # Exportación CAD de la sección importada: los huecos siguen siendo vacíos en DXF y SVG.
  assert page.locator('[data-dxf-section]').count()==2
  result=page.evaluate("""() => {
   const r=PlegarToolDXF.read()[0],d=PlegarToolDXF.exportSectionDXF(r),
    s=PlegarToolDXF.exportSectionSVG(r),parsed=PlegarToolDXF.parseDXF(d);
   return {holes:parsed.holeCount,area:parsed.areaMm2,svg:s.includes('fill-rule="evenodd"'),
    millimeters:s.includes('mm"'),approved:parsed.collisionApproved};
  }""")
  assert result=={'holes':1,'area':11500,'svg':True,'millimeters':True,'approved':False}
  with page.expect_download(timeout=10000) as dxf_download:
   page.locator('[data-dxf-section="dxf"]').click()
  assert dxf_download.value.suggested_filename.endswith('.dxf')
  with page.expect_download(timeout=10000) as svg_download:
   page.locator('[data-dxf-section="svg"]').click()
  assert svg_download.value.suggested_filename.endswith('.svg')
  # Cotejo nominal de herramientas locales: advertir medidas y no prometer colisiones seguras.
  page.locator('.tool-dxf-card [data-dxf-length-input]').fill('250')
  page.locator('.tool-dxf-card [data-dxf-length-save]').click()
  punch_id=page.evaluate("""() => {
   const pts=[[0,0],[45,0],[45,150],[0,150]],lines=[
    '0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC',
    '0','SECTION','2','ENTITIES','0','LWPOLYLINE','90','4','70','1'];
   for(const [x,y] of pts)lines.push('10',String(x),'20',String(y));
   lines.push('0','ENDSEC','0','EOF');
   const punch=PlegarToolDXF.add({brand:'MECOS',kind:'punch',code:'P300-TEST',
    name:'Punzón local',lengthMm:300},lines.join('\\n')+'\\n');
   PlegarToolFitAudit.refresh();
   return punch.id;
  }""")
  die_id=page.evaluate("PlegarToolDXF.read().find(x=>x.kind==='die').id")
  page.locator('.tool-fit-panel summary').click()
  page.locator('[data-tool-fit="punch"]').select_option(punch_id)
  page.locator('[data-tool-fit="die"]').select_option(die_id)
  page.locator('[data-tool-fit="sheet"]').fill('400')
  page.locator('[data-tool-fit="machine"]').select_option('bystronic-ep-ii-31-100-2006')
  page.locator('[data-tool-fit-action="inspect"]').click()
  assert 'INCOMPATIBILIDAD NOMINAL' in page.locator('[data-tool-fit-result]').inner_text()
  assert page.locator('.tool-fit-graph').count()==1
  assert page.evaluate("""() => {
   const r=PlegarToolFitAudit.inspect({
    punch:PlegarToolDXF.read().find(x=>x.kind==='punch'),
    die:PlegarToolDXF.read().find(x=>x.kind==='die'),
    sheetWidthMm:400,machine:PlegarMachineReferences.reference});
   return r.checks.sheetExceedsSinglePair && !r.approvedForCNC && !r.collisionClearanceVerified;
  }""")
  with page.expect_download(timeout=10000) as audit_download:
   page.locator('[data-tool-fit-action="export"]').click()
  assert audit_download.value.suggested_filename.endswith('SIN-VALIDAR.json')
  page.evaluate("(id) => {PlegarToolDXF.remove(id);PlegarToolFitAudit.refresh();}",punch_id)
  assert page.locator('[data-tool-fit="punch"] option').count()==1
  page.locator('[data-dxf-remove]').click()
  assert page.locator('.tool-dxf-card').count()==0
  assert page.locator('.mfg-card').count()>=20
  assert page.locator('.mfg-card .mfg-art').count()>=80
  assert page.locator('.mfg-card').count()>=40
  assert page.locator('.mfg-card .mfg-warning').count()>=20
  assert page.locator('.mfg-card [data-tool-set]').count()==0
  # Las familias genéricas se guardan en un desplegable para dar prioridad a las fichas originales.
  if not page.locator('[data-mfg-filter="brand"]').is_visible():
   page.locator('details:has(#manufacturer-catalog) > summary').click()
  page.locator('[data-mfg-filter="brand"]').select_option('Bystronic')
  assert page.locator('.mfg-card').count()>=4
  assert page.locator('.mfg-card').first.locator('strong').inner_text().startswith('Bystronic')
  page.locator('[data-mfg-filter="brand"]').select_option('AMADA')
  page.locator('[data-mfg-filter="q"]').fill('846')
  assert page.locator('.mfg-card').count()==1
  assert page.locator('.mfg-card [data-profile="cuello-cisne"]').count()==2
  assert 'H 120 mm' in page.locator('.mfg-card').inner_text()
  assert 'Radio R0.6 mm' in page.locator('.mfg-card').inner_text()
  assert page.locator('.mfg-card [data-tool-set]').count()==0
  page.locator('[data-mfg-filter="q"]').fill('')
  page.locator('[data-mfg-filter="brand"]').select_option('EUROSTAMP')
  page.locator('[data-mfg-filter="kind"]').select_option('die')
  page.locator('[data-mfg-filter="q"]').fill('V24')
  assert page.locator('.mfg-card').count()==1
  assert 'V 24 mm' in page.locator('.mfg-card').inner_text()
  assert 'H 55 mm' in page.locator('.mfg-card').inner_text()
  assert page.locator('.mfg-card a[href^="https://"]').count()==1
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
  # Crear desde Programación 2D: cancelar no altera el perfil anterior.
  old=page.evaluate('JSON.stringify(PlegarEditor2D.getData())')
  page.locator('#ed-create-piece').click()
  assert page.locator('#new-piece-dialog').is_visible()
  page.locator('[data-np-field="name"]').fill('Borrador cancelado')
  page.locator('[data-np-action="cancel"]').last.click()
  assert page.evaluate('JSON.stringify(PlegarEditor2D.getData())')==old
  # Alta completa de una pieza nueva desde 2D.
  page.locator('#ed-create-piece').click()
  def sheet_y(selector):
   pts=page.locator(selector).first.get_attribute('points').split()
   return [float(pair.split(',')[1]) for pair in pts]
  assert sheet_y('#np-drawing polyline[stroke="#65cfff"]')[2]<sheet_y('#np-drawing polyline[stroke="#65cfff"]')[1],'+90 debe subir'
  page.locator('[data-np-direction="0"]').select_option('down')
  assert sheet_y('#np-drawing polyline[stroke="#65cfff"]')[2]>sheet_y('#np-drawing polyline[stroke="#65cfff"]')[1],'-90 debe bajar'
  page.locator('[data-np-direction="0"]').select_option('up')
  page.locator('[data-np-field="name"]').fill('Soporte nuevo desde 2D')
  page.locator('[data-np-field="name"]').dispatch_event('change')
  page.locator('[data-np-field="width"]').fill('250')
  page.locator('[data-np-field="width"]').dispatch_event('change')
  page.locator('[data-np-field="thickness"]').fill('1.5')
  page.locator('[data-np-field="thickness"]').dispatch_event('change')
  page.locator('[data-np-action="add"]').click()
  assert page.locator('#np-rows .np-row').count()==3
  for i,measure in enumerate(['40','85','60']):
   row=page.locator(f'[data-np-length="{i}"]')
   row.fill(measure)
   row.dispatch_event('change')
  page.locator('[data-np-angle="0"]').fill('90')
  page.locator('[data-np-angle="0"]').dispatch_event('change')
  page.locator('[data-np-direction="0"]').select_option('down')
  page.locator('[data-np-angle="1"]').fill('90')
  page.locator('[data-np-angle="1"]').dispatch_event('change')
  page.locator('[data-np-touch="2"]').click()
  page.locator('[data-np-touch="1"]').click()
  assert 'B2 → B1' in page.locator('#np-sequence').inner_text()
  assert page.locator('#np-volume svg').count()==1
  page.locator('[data-np-action="create"]').click()
  assert page.locator('#new-piece-dialog').is_hidden()
  assert page.evaluate('PlegarEditor2D.getData().name')=='Soporte nuevo desde 2D'
  assert page.evaluate('PlegarEditor2D.getData().segments')==[40,85,60]
  assert page.evaluate('PlegarEditor2D.getData().angles')==[-90,90]
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[2,1]
  assert sheet_y('#ed-svg polyline[stroke="#5bc8ff"]')[2]>sheet_y('#ed-svg polyline[stroke="#5bc8ff"]')[1], 'Editor 2D ha invertido B1 negativo'
  assert page.evaluate('PlegarEditor2D.getWidth()')==250
  assert page.locator('#ed-dimensions-body tr').count()==3
  assert page.evaluate('PlegarPieceLibrary.list().length')==1
  assert page.evaluate('PlegarPieceLibrary.list()[0].width')==250
  assert page.locator('#ed-my-pieces').is_visible()
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
  start_flat=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),PlegarEditor2D.getData().setup).flat')
  page.locator('[data-ed-bend-radius="0"]').fill('3.4')
  page.locator('[data-ed-bend-radius="0"]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().bendOverrides[0].radius')==3.4
  adjusted=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),PlegarEditor2D.getData().setup).flat')
  assert abs(start_flat-adjusted)>0.01
  page.locator('[data-ed-bend-k="1"]').fill('0.4')
  page.locator('[data-ed-bend-k="1"]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().bendOverrides[1].kFactor')==0.4
  page.locator('[data-ed-bend-k="1"]').fill('')
  page.locator('[data-ed-bend-k="1"]').dispatch_event('change')
  page.locator('[data-ed-bend-radius="0"]').fill('')
  page.locator('[data-ed-bend-radius="0"]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().bendOverrides[0].radius') is None
  assert page.evaluate('PlegarEditor2D.getData().bendOverrides[1].kFactor') is None
  measured=page.evaluate('PlegarBendCalc.estimate(PlegarEditor2D.getData(),{...PlegarEditor2D.getData().setup,kFactor:0.42}).flat')
  page.locator('#ed-trial-flat').fill(str(measured))
  page.locator('#ed-calibrate-k').click()
  assert abs(page.evaluate('PlegarEditor2D.getData().setup.kFactor')-0.42)<0.0001
  assert page.locator('#ed-example-gallery [data-example-id]').count()==4
  svg_views=page.locator('#ed-example-gallery .example-gadget svg').evaluate_all('(els)=>els.map(el=>el.innerHTML)')
  assert len(svg_views)==8 and len(set(svg_views))==8,'Cada tarjeta debe mostrar un plano 2D y una geometría 3D propios'
  assert page.locator('#ed-quick-material').count()==1 and page.locator('#ed-quick-punch').count()==1
  assert page.locator('#ed-quick-die').count()==1
  # Tabla de programación prioritaria con cotas editables y sincronizadas.
  assert page.locator('#ed-dimensions-body tr').count()==page.evaluate('PlegarEditor2D.getData().segments.length')
  assert page.locator('.ed-dimensions-panel').is_visible()
  assert page.locator('.ed-dimensions-panel').evaluate('(el)=>el.compareDocumentPosition(document.querySelector(".ed-quick-setup")) & Node.DOCUMENT_POSITION_FOLLOWING')!=0
  first=page.locator('#ed-dimensions-body [data-ed-program-segment="0"]')
  original=first.input_value()
  first.fill('72')
  first.dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().segments[0]')==72
  assert page.locator('#ed-dimensions-body [data-ed-program-segment="0"]').input_value()=='72'
  # Teclado móvil: escribir 83 sin signo y escoger flecha abajo guarda -83.
  page.locator('#ed-dimensions-body [data-ed-program-angle="0"]').fill('83')
  page.locator('#ed-dimensions-body [data-ed-program-angle="0"]').dispatch_event('change')
  page.locator('#ed-dimensions-body [data-ed-program-direction="0"]').select_option('down')
  assert page.evaluate('PlegarEditor2D.getData().angles[0]')==-83
  assert page.locator('#ed-dimensions-body [data-ed-program-angle="0"]').input_value()=='83'
  assert page.locator('#ed-angles [data-ed-direction="0"]').input_value()=='down'
  page.locator('#ed-angles [data-ed-direction="0"]').select_option('up')
  assert page.evaluate('PlegarEditor2D.getData().angles[0]')==83
  page.locator('#ed-dimensions-body [data-ed-program-direction="0"]').select_option('down')
  assert page.evaluate('PlegarEditor2D.getData().angles[0]')==-83
  assert page.locator('#ed-svg .ed-bend-point').count()==page.evaluate('PlegarEditor2D.getData().angles.length')
  page.locator('#ed-dimensions-body [data-ed-program-segment="0"]').fill(original)
  page.locator('#ed-dimensions-body [data-ed-program-segment="0"]').dispatch_event('change')
  # Un toast puede estar activo tras navegar; solo el aviso vacío debe desaparecer.
  page.evaluate("document.querySelector('#toast').textContent=''")
  assert page.locator('#toast').evaluate('(el)=>getComputedStyle(el).visibility')=='hidden'
  assert page.locator('#toast').evaluate('(el)=>getComputedStyle(el).pointerEvents')=='none'
  page.locator('#ed-quick-material').select_option('Inox 304')
  assert page.evaluate('PlegarEditor2D.getData().material')=='Inox 304'
  page.locator('#ed-quick-thickness').fill('1.5')
  page.locator('#ed-quick-thickness').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().thickness')==1.5
  page.locator('#ed-quick-v').click()
  assert page.evaluate('PlegarEditor2D.getData().setup.die')=='v12-88'
  # Restaurar una Omega de muestra antigua sin cambiar programas del usuario.
  check=page.evaluate("""() => {
   const base={name:'Perfil omega (ejemplo)',material:'Acero S235JR',thickness:2,
    segments:[60,85,120,85,60],angles:[-90,90,90,-90],
    sequence:[1,2,3,4],setup:PlegarBendCalc.validateSetup()};
   const demo=PlegarEditor2D.migrateLegacyDemo(base);
   const customised=PlegarEditor2D.migrateLegacyDemo({...base,name:'Mi proyecto Omega'});
   const repositioned=PlegarEditor2D.migrateLegacyDemo({...base,setup:{...base.setup,backgaugeX:135}});
   return {demo:demo.sequence,customised:customised.sequence,repositioned:repositioned.sequence};
  }""")
  assert check['demo']==[1,2,4,3],check
  assert check['customised']==[1,2,3,4],check
  assert check['repositioned']==[1,2,3,4],check
  page.locator('#ed-example-gallery [data-example-id="omega"]').click()
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2,4,3]
  # Signos independientes del teclado. La pieza mantiene B1/B2/B4/B3.
  page.locator('[data-ed-program-direction="2"]').select_option('down')
  assert page.evaluate('PlegarEditor2D.getData().angles[2]')==-90
  assert page.locator('[data-ed-program-angle="2"]').input_value()=='90'
  assert page.locator('[data-ed-direction="2"]').input_value()=='down'
  assert page.evaluate('PlegarFormingGeometry.scene(PlegarEditor2D.getData(),3,.5).turn')==-90
  page.locator('[data-ed-angle="2"]').fill('120')
  page.locator('[data-ed-angle="2"]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().angles[2]')==-120
  page.locator('[data-ed-direction="2"]').select_option('up')
  assert page.evaluate('PlegarEditor2D.getData().angles[2]')==120
  page.locator('[data-ed-angle="2"]').fill('90')
  page.locator('[data-ed-angle="2"]').dispatch_event('change')
  page.locator('#ed-order-reset').click()
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2,4,3], 'Restablecer no debe volver al orden antiguo de Omega'
  page.locator('[data-ed-bend-gauge="3"]').fill('70')
  page.locator('[data-ed-bend-gauge="3"]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().setup.backgaugeByBend[3]')==70
  assert page.evaluate('PlegarFormingGeometry.scene(PlegarEditor2D.getData(),2,.5).stop.x')==70
  page.locator('[data-ed-bend-gauge="1"]').fill('95')
  page.locator('[data-ed-bend-gauge="1"]').dispatch_event('change')
  assert page.evaluate('PlegarFormingGeometry.scene(PlegarEditor2D.getData(),1,.5).stop.x')==95
  position=page.evaluate("""() => {const p=PlegarEditor2D.getData(),id=p.sequence[3],g=PlegarBendCalc.backgaugeTarget(p,id,p.setup),m=PlegarFormingGeometry.scene(p,3,.5);return {bend:id,thickness:p.thickness,nominal:g,actual:m.stop,sequence:p.sequence};}""")
  assert position['bend']==3 and position['nominal']['x']==85
  # El tope real de dibujo usa la cara exterior de chapa, no el eje central: 85 + e/2.
  assert abs(position['actual']['x']-(position['nominal']['x']+position['thickness']/2))<.05,position
  page.locator('#ed-quick-height').fill('60')
  page.locator('#ed-quick-height').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().setup.dieHeight')==60

  for selector,number in [('#ed-quick-table-left','180'),('#ed-quick-table-right','180'),
                          ('#ed-quick-ram-width','110'),('#ed-quick-ram-offset','100')]:
   page.locator(selector).fill(number)
   page.locator(selector).dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().setup.tableLeft')==180
  assert page.evaluate('PlegarEditor2D.getData().setup.ramWidth')==110
  groups=page.evaluate("""() => {
    const p=PlegarEditor2D.getData(),s=PlegarFormingGeometry.scene(p,1,.5);
    return PlegarTooling3D.assemble(PlegarPiece3D.build(s,100),s).groups;
  }""")
  assert groups['ram']==1 and groups['table']==1,groups
  assert 'Perfil omega' in page.locator('#ed-auto-plan').inner_text()
  assert 'H matriz 60 mm' in page.locator('#ed-auto-plan').inner_text()
  assert page.locator('#ed-apply-auto').count()==1
  assert page.locator('#ed-omega-proposal').count()==1
  page.locator('#ed-omega-proposal').click()
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2,4,3]
  if page.locator('#ed-apply-auto').is_enabled():
   page.locator('#ed-apply-auto').click()
   assert sorted(page.evaluate('PlegarEditor2D.getData().sequence'))==[1,2,3,4]
  else:
   assert 'BLOQUEADA' in page.locator('#ed-auto-plan').inner_text()
   assert sorted(page.evaluate('PlegarEditor2D.getData().sequence'))==[1,2,3,4]
  assert 'NO CNC' in page.locator('#ed-auto-plan').inner_text()
  page.evaluate("""() => {
   window.__ppClicks=[];
   const gallery=document.querySelector('#ed-example-gallery');
   window.__ppGalleryStatus={gallery:!!gallery,parent:gallery?.parentElement?.id,
    targetConnected:!!document.querySelector('[data-example-id="u"]')?.isConnected,
    handler:typeof document.querySelector('#module-sample')?.onclick,
    example:!!window.PlegarExamples3D?.get('u')};
   document.addEventListener('click',e=>{
    window.__ppClicks.push({tag:e.target.tagName,button:e.target.closest?.('[data-example-id]')?.dataset.exampleId,
     path:e.composedPath().slice(0,5).map(el=>el.id||el.tagName)});
   },true);
  }""")
  page.locator('#ed-example-gallery [data-example-id="u"]').click()
  assert page.evaluate('PlegarEditor2D.getData().segments')==[55,100,55], f"Canal U no se cargó: {page.evaluate('PlegarEditor2D.getData()')} errores={errors[-3:]} clicks={page.evaluate('window.__ppClicks')} gallery={page.evaluate('window.__ppGalleryStatus')}"
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
  scene_before=page.locator('.f2-camera-content').inner_html()
  page.locator('[data-f2-action="focus"]').click()
  assert page.locator('[data-f2-action="focus"]').get_attribute('aria-pressed')=='true'
  assert page.locator('.f2-camera-content').inner_html()!=scene_before
  page.locator('[data-f2-action="focus"]').click()
  assert page.locator('[data-f2-action="focus"]').get_attribute('aria-pressed')=='false'
  # Cambiar sentido y paso desde Simulación 2D, no solo desde Programación.
  assert page.locator('[data-f2-angle]').count()==1
  assert page.locator('[data-f2-direction]').count()==1
  assert 'Orden ejecutado:' in page.locator('.f2-order-live').inner_text()
  assert 'B2' in page.locator('.f2-step-label').inner_text()
  page.locator('[data-f2-direction]').select_option('down')
  assert page.evaluate('PlegarEditor2D.getData().angles[1]')==-90
  assert '-90' in page.locator('.f2-step-label').inner_text()
  assert page.evaluate('PlegarFoldKinematics.frame(PlegarEditor2D.getData(),0,.7).scene.turn')==-90
  assert page.evaluate('PlegarFoldKinematics.frame(PlegarEditor2D.getData(),0,.78).scene.wingLeft.y < PlegarFoldKinematics.frame(PlegarEditor2D.getData(),0,.78).scene.center.y')
  assert page.locator('.f2d-svg [data-component="aviso-volteo"]').count()==1
  page.locator('[data-f2-angle]').fill('110')
  page.locator('[data-f2-angle]').dispatch_event('change')
  assert page.evaluate('PlegarEditor2D.getData().angles[1]')==-110
  page.locator('[data-f2-angle]').fill('90')
  page.locator('[data-f2-angle]').dispatch_event('change')
  page.locator('[data-f2-direction]').select_option('up')
  assert page.evaluate('PlegarEditor2D.getData().angles[1]')==90
  page.locator('[data-f2-position]').select_option('2')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2]
  assert 'B2' in page.locator('.f2-step-label').inner_text()
  assert 'Paso 2 de 2' in page.locator('.f2-step-label').inner_text()
  page.locator('[data-f2-position]').select_option('1')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[2,1]
  assert 'Paso 1 de 2' in page.locator('.f2-step-label').inner_text()
  assert page.locator('.f2-data-panel').is_visible()
  assert 'Ángulo' in page.locator('.f2-data-panel').inner_text()
  assert 'NO CALCULADA' in page.locator('.f2-data-panel').inner_text()
  # La vista de perfil debe mostrar las seis piezas con colores y movimiento real del carro nominal.
  for component in ['trancha','punzon','chapa','matriz','mesa','topes','amarre-punzon','mordaza','portamatriz','estructura-inferior','tope-carro','tope-brazo']:
   assert page.locator('.f2d-svg [data-component="'+component+'"]').count()==1,component
  assert 'TRUMPF V85' in page.locator('.f2-machine-zones').inner_text()
  assert 'Tope B' in page.locator('.f2-data-panel').inner_text()
  # V85 contiene cuatro secciones de máquina más los dos útiles; no usar un número antiguo fijo.
  expected_zones=page.evaluate("""() => PlegarMachineSection2D.inspect(PlegarFormingGeometry.scene(PlegarEditor2D.getData(),0,0)).checked.length""")
  assert page.locator('.f2-zone-grid .f2-zone').count()==expected_zones
  assert page.locator('.f2d-svg [data-component="indicador-tope"]').count()==1
  assert '21 posiciones' in page.locator('.f2-machine-zones').inner_text()
  assert page.locator('.f2d-svg [data-component="separacion-tope"]').count()==1
  assert 'contacto nominal' in page.locator('.f2-nominal').inner_text().lower()
  mesa_antes=page.locator('.f2d-svg [data-component="mesa"]').get_attribute('d')
  trancha_antes=page.locator('.f2d-svg [data-component="trancha"]').get_attribute('d')
  page.locator('.f2-range').evaluate("(el)=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));}")
  assert page.locator('.f2d-svg [data-component="mesa"]').get_attribute('d')==mesa_antes
  assert page.locator('.f2d-svg [data-component="trancha"]').get_attribute('d')!=trancha_antes
  assert 'sección reconstruida' in page.locator('.f2d-svg').text_content()
  page.locator('[data-f2-action="reset"]').click()
  assert page.locator('.f2-tile svg').count()==4
  assert page.locator('.f2-tile[data-f2-step="start"]').count()==1
  assert page.locator('.f2-tile[data-f2-step="final"]').count()==1
  assert page.locator('.f2-loop').is_checked()
  # El último botón debe enseñar el perfil nominal final del plano, no la
  # posición local del último golpe bajo la trancha.
  page.locator('.f2-tile[data-f2-step="final"]').click()
  assert page.locator('.f2d-svg[data-f2-final="true"]').count()==1
  actual=page.locator('.f2d-svg[data-f2-final] [data-component="chapa-final"]').get_attribute('points').split()
  expected=page.evaluate("""() => PlegarGeometry2D.vertices(PlegarEditor2D.getData()).map(p=>[p.x,p.y])""")
  assert len(actual)==len(expected)
  for pair,point in zip(actual,expected):
   xx,yy=map(float,pair.split(','))
   assert abs(xx-point[0])<.0001 and abs(yy-point[1])<.0001
  assert page.locator('.f2d-svg [data-component="punzon"]').count()==0
  page.locator('.f2-tile[data-f2-step="start"]').click()
  assert page.locator('.f2d-svg[data-f2-final="true"]').count()==0
  page.locator('[data-f2-action="play"]').click()
  page.wait_for_function("""() => document.querySelector('.f2-step-label')?.textContent.includes('Paso 2 de 2') &&
   document.querySelector('.f2-progress')?.textContent.includes('100 %')""",timeout=12000)
  page.wait_for_function("""() => document.querySelector('.f2-step-label')?.textContent.includes('Paso 1 de 2') &&
   document.querySelector('[data-f2-action="play"]')?.textContent.includes('Pausar')""",timeout=7000)
  page.locator('[data-f2-action="play"]').click()
  assert 'Reproducir' in page.locator('[data-f2-action="play"]').inner_text()
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 3D"]').click()
  assert page.locator('.p3-example-gallery [data-example-id]').count()==4
  assert page.locator('.p3-order-list select').count()==2
  page.locator('[data-p3-order="0"]').select_option('1')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2]
  assert gesture('.p3-stage')['zoom']>1
  assert page.locator('.p3-loop').is_checked()
  page.locator('[data-p3="play"]').click()
  page.wait_for_function("""() => document.querySelector('.p3-step')?.textContent.includes('Paso 2 / 2') &&
   document.querySelector('.p3-progress')?.value==='100'""",timeout=12000)
  page.wait_for_function("""() => document.querySelector('.p3-step')?.textContent.includes('Paso 1 / 2') &&
    document.querySelector('[data-p3="play"]')?.getAttribute('aria-pressed')==='true'""",timeout=7000)
  page.locator('[data-p3="play"]').click()
  assert page.locator('[data-p3="play"]').get_attribute('aria-pressed')=='false'

  page.locator('.p3-example-gallery [data-example-id="omega"]').click()
  assert len(page.evaluate('PlegarEditor2D.getData().segments'))==5
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[1,2,4,3]
  assert 'B4 -90°' in page.locator('[data-p3-step="2"]').inner_text()
  # Reordenar a B3 primero debe DESPLAZAR B1,B2,B4, no intercambiar con B1.
  page.locator('[data-p3-order="0"]').select_option('3')
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[3,1,2,4]
  assert [tuple(row) for row in page.evaluate("""() => {
    const p=PlegarEditor2D.getData();
    return p.sequence.map((_,i)=>{const s=PlegarFoldKinematics.frame(p,i,.78).scene;return [s.bend,s.turn]});
   }""")]==[(3,90),(1,-90),(2,90),(4,-90)]
  assert 'B3 +90°' in page.locator('[data-p3-step="0"]').inner_text()
  assert page.locator('[data-p3-step="0"]').get_attribute('aria-current')=='step'
  assert page.locator('.p3-svg polygon[data-group="sheet"]').count()>0
  # Crear desde Programación 3D con el mismo formulario, conservando la geometría real.
  assert page.locator('.p3-new-piece').is_visible()
  page.locator('.p3-new-piece').click()
  assert 'PROGRAMACIÓN 3D' in page.locator('#np-title').inner_text()
  page.locator('[data-np-field="name"]').fill('Perfil creado desde 3D')
  page.locator('[data-np-field="name"]').dispatch_event('change')
  page.locator('[data-np-field="width"]').fill('220')
  page.locator('[data-np-field="width"]').dispatch_event('change')
  page.locator('[data-np-length="0"]').fill('35')
  page.locator('[data-np-length="0"]').dispatch_event('change')
  page.locator('[data-np-length="1"]').fill('75')
  page.locator('[data-np-length="1"]').dispatch_event('change')
  page.locator('[data-np-angle="0"]').fill('120')
  page.locator('[data-np-angle="0"]').dispatch_event('change')
  page.locator('[data-np-direction="0"]').select_option('down')
  assert page.locator('[data-np-field="width"]').input_value()=='220', 'Las cotas han contaminado el campo ancho.'
  assert page.locator('[data-np-length="0"]').input_value()=='35'
  assert page.locator('[data-np-length="1"]').input_value()=='75'
  assert page.locator('[data-np-angle="0"]').input_value()=='120'
  page.locator('[data-np-action="create"]').click()
  assert page.locator('#module-title').inner_text()=='Programación 3D', {'actual':page.locator('#module-title').inner_text(),'dialogOpen':page.locator('#new-piece-dialog').evaluate('(e)=>e.open'),'wizardStatus':page.locator('#np-status').inner_text(),'name':page.evaluate('PlegarEditor2D.getData().name')}
  assert page.evaluate('PlegarEditor2D.getData().name')=='Perfil creado desde 3D'
  assert page.evaluate('PlegarEditor2D.getData().segments')==[35,75]
  assert page.evaluate('PlegarEditor2D.getData().angles')==[-120]
  assert page.evaluate('PlegarEditor2D.getWidth()')==220
  assert page.evaluate('PlegarPieceLibrary.list().length')==2
  assert page.locator('.p3-svg polygon[data-group="sheet"]').count()>0
  # Editar desde Programación 3D: se actualiza la pieza activa sin crear un duplicado.
  page.locator('[data-p3="edit"]').click()
  assert 'EDITAR PIEZA' in page.locator('#np-title').inner_text()
  assert page.locator('[data-np-length="0"]').input_value()=='35'
  page.locator('[data-np-length="0"]').fill('50')
  page.locator('[data-np-length="0"]').dispatch_event('change')
  page.locator('[data-np-action="create"]').click()
  assert page.evaluate('PlegarEditor2D.getData().segments')==[50,75]
  assert page.evaluate('PlegarPieceLibrary.list().length')==2
  # Abrir desde Mis piezas en 2D recupera medidas, ancho y secuencia.
  page.locator('[data-p3="library"]').click()
  assert page.locator('#pieces-dialog').is_visible()
  assert page.locator('.ps-item').count()==2
  target=page.locator('.ps-item').filter(has=page.locator('h3',has_text='Soporte nuevo desde 2D'))
  target.locator('[data-ps-action="open2d"]').click()
  assert page.locator('#module-title').inner_text()=='Programación 2D'
  assert page.evaluate('PlegarEditor2D.getData().name')=='Soporte nuevo desde 2D'
  assert page.evaluate('PlegarEditor2D.getData().segments')==[40,85,60]
  assert page.evaluate('PlegarEditor2D.getData().sequence')==[2,1]
  assert page.evaluate('PlegarEditor2D.getWidth()')==250
  page.locator('#ed-my-pieces').click()
  assert page.locator('.ps-item').count()==2
  page.locator('[data-ps-action="close"]').last.click()

  # Preferencias, accesibilidad y rutas reales del menú (PC y smartphone).
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Ajustes"]').click()
  assert page.locator('.pp-settings [data-pp-setting]').count()==11
  page.locator('[data-pp-setting="theme"]').select_option('light')
  assert page.evaluate('document.documentElement.dataset.ppTheme')=='light'
  page.locator('[data-pp-setting="accent"]').select_option('amber')
  assert page.evaluate('document.documentElement.dataset.ppAccent')=='amber'
  page.locator('[data-pp-setting="reducedMotion"]').check()
  assert page.evaluate('document.documentElement.dataset.ppMotion')=='reduced'
  for key,value in [('camera','profile'),('homeView','photo'),('speed','2'),('exportResolution','1080')]:
   page.locator('[data-pp-setting="'+key+'"]').select_option(value)
  page.locator('[data-pp-setting="repeat"]').uncheck()
  assert page.evaluate("JSON.parse(localStorage.getItem('plegarpro-settings-v1')).repeat")==False
  page.locator('#module-view .module-top [data-screen="Inicio"]').click()
  assert page.locator('.home-machine-photo').is_visible()
  assert page.locator('#home-machine-cad').is_hidden()
  assert not page.locator('#home-loop').is_checked()
  assert page.locator('#speed').input_value()=='550'
  page.locator('#calc-close').click()
  assert page.locator('.calculator-panel').evaluate("(el)=>el.classList.contains('calculator-collapsed')")
  page.locator('#calc-close').click()
  assert not page.locator('.calculator-panel').evaluate("(el)=>el.classList.contains('calculator-collapsed')")
  page.locator('#tool-tabs [data-tab="Punzones"]').click()
  page.locator('#tool-select').select_option('punch:p30-r1')
  assert page.evaluate('PlegarEditor2D.getData().setup.punch')=='p30-r1'
  page.locator('#tool-tabs [data-tab="Matrices"]').click()
  page.locator('#tool-select').select_option('die:v24-88')
  assert page.evaluate('PlegarEditor2D.getData().setup.die')=='v24-88'
  screens=page.locator('#menu-nav button.nav-item[data-screen]').evaluate_all(
   "(els)=>els.map(el=>el.dataset.screen)")
  assert len(screens)>=17
  for target in screens:
   if w<=1120:page.locator('#open-menu').click()
   page.locator('#menu-nav button.nav-item[data-screen="'+target+'"]').click()
   if target=='Inicio':assert page.locator('#summary-cards').is_visible()
   else:
    assert page.locator('#module-title').inner_text()==target,target
    assert page.locator('#module-sample').is_visible(),target
  page.locator('[data-app-back]').click()
  assert page.locator('#module-title').inner_text()==screens[-2]
  page.locator('#avatar').evaluate("(el)=>el.click()")
  assert page.locator('#module-title').inner_text()=='Ajustes'
  page.locator('[data-pp-settings-action="reset"]').click()
  assert page.evaluate('PlegarSettings.get().theme')=='dark'
  assert page.evaluate('PlegarSettings.get().repeat')==True
  assert page.evaluate('PlegarSettings.get().exportResolution')=='2160'

  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),"Desbordamiento horizontal"
  assert not errors,(w,errors)
  print(f'Cinemática continua y 4 piezas 3D · {w} px OK',flush=True)
  context.close()
 browser.close()
