from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,re,tempfile
root=Path(__file__).resolve().parents[1]
html=re.sub(r'<script src="[^"]+" defer></script>', '', (root/'index.html').read_text())
html=re.sub(r'<link rel="stylesheet"[^>]+>', '', html)
css='\n'.join((root/x).read_text() for x in ('styles.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css'))
issues=[]
artifacts=Path(tempfile.mkdtemp(prefix="plegar-v21-browser-"))
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
  for script in ('geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','tooling3d.js','scene3d-audit.js','proximity3d.js','piece3d-view.js','editor2d.js','app.js'):
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
  assert 'SIN VERIFICAR' in page.locator('#ed-tool-punch').inner_text()
  assert 'SIN VERIFICAR' in page.locator('#ed-tool-die').inner_text()
  assert page.locator('#cad-file-input').count()==1
  assert page.locator('#cad-mount-datum').count()==1
  assert page.locator('#cad-topo-summary').count()==1
  assert page.locator('#cad-chain-summary').count()==1
  assert page.locator('#cad-chain-export').is_disabled()
  assert page.locator('#cad-mount-export').is_disabled()
  assert 'SIN VERIFICAR' in page.locator('.cad-import-panel > .cad-danger').inner_text()
  assert page.locator('#ed-ref-item option').count()==5
  assert '50838E' in page.locator('#ed-ref-item').inner_text()
  assert 'CAD' in page.locator('.ed-ref-warning').inner_text()
  page.locator('#ed-ref-filter').select_option('punch')
  assert page.locator('#ed-ref-item option').count()==3
  page.locator('#ed-ref-item').select_option('amada-a13-p30-r06-835')
  assert '120 mm' in page.locator('#ed-ref-dimensions').inner_text()
  assert 'AGA13061' in page.locator('#ed-ref-family').inner_text()
  assert page.locator('#ed-ref-link').get_attribute('href').startswith('https://www.amada.de/')
  assert page.locator('#ed-punch').input_value()=='p88-r1'
  page.locator('#ed-ref-filter').select_option('die')
  assert page.locator('#ed-ref-item option').count()==2
  assert 'AMADA' in page.locator('#ed-ref-family').inner_text()
  # CAD 2D inspection does not mutate the active punch/die selection.
  sample='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n4\n70\n1\n10\n0\n20\n0\n10\n20\n20\n0\n10\n20\n20\n60\n10\n0\n20\n60\n0\nENDSEC\n0\nEOF\n'
  page.locator('#cad-file-input').set_input_files({'name':'modelo.dxf','mimeType':'application/dxf','buffer':sample.encode()})
  page.wait_for_function("document.querySelector('#cad-status').textContent.includes('DXF leído') || document.querySelector('#cad-status').textContent.includes('rechazada')")
  print('CAD:',page.locator('#cad-status').inner_text(),flush=True)
  assert 'DXF leído' in page.locator('#cad-status').inner_text()
  assert '1 entidades; 1 cerradas' in page.locator('#cad-topo-summary').inner_text()
  assert '0 entidades abiertas' in page.locator('#cad-chain-summary').inner_text()
  assert 'NO HABILITADO' in page.locator('#cad-chain-summary').inner_text()
  assert page.locator('#cad-chain-export').is_enabled()
  assert page.locator('#cad-topo-export').is_enabled()
  page.locator('#cad-topo-tolerance').fill('2')
  page.locator('#cad-topo-tolerance').press('Tab')
  assert 'Auditoría no disponible' in page.locator('#cad-topo-summary').inner_text()
  assert page.locator('#cad-topo-export').is_disabled()
  assert page.locator('#cad-chain-export').is_disabled()
  page.locator('#cad-topo-tolerance').fill('0.05')
  page.locator('#cad-topo-tolerance').press('Tab')
  assert page.locator('#cad-topo-export').is_enabled()
  assert page.locator('#cad-chain-export').is_enabled()
  if tag=='pc':
   with page.expect_download() as topo_download: page.locator('#cad-topo-export').click()
   topo_path=artifacts/'v20_topology_report.json'
   topo_download.value.save_as(topo_path)
   topo=json.loads(topo_path.read_text())
   assert topo['report']['summary']['closed']==1
   assert topo['mounting']['approvedForCNC'] is False
   assert topo['approvedForSimulation'] is False
  if tag=='pc':
   with page.expect_download() as chain_download: page.locator('#cad-chain-export').click()
   chain_path=artifacts/'v21_chain_report.json'
   chain_download.value.save_as(chain_path)
   graph=json.loads(chain_path.read_text())
   assert graph['readiness']['canUseCNC'] is False
   assert graph['geometryModified'] is False
   assert graph['version']=='0.21'
  # v0.19: SHA-256 de bytes originales y registro voluntario SOLO METADATOS.
  assert page.locator('#cad-trace-save').is_enabled()
  assert 'SIN VERIFICAR' in page.locator('.cad-trace-panel').inner_text()
  digest=page.evaluate('window.PlegarCadImport.getSourceMeta().sha256')
  assert len(digest)==64
  assert page.evaluate('window.PlegarCadImport.getSourceMeta().bytes')==len(sample.encode())
  page.locator('#cad-trace-save').click()
  assert page.locator('.cad-trace-entry').count()==1
  assert page.evaluate('JSON.parse(localStorage.getItem("plegar-pro-cad-trace-v19"))[0].approvedForCNC===false')
  assert 'coincide con un archivo registrado' in page.locator('#cad-trace-current').inner_text()
  if tag=='pc': page.locator('.cad-trace-panel').screenshot(path=str(artifacts/'Plegar_Pro_Plus_v019_Registro_DXF.png'))
  if tag=='pc':
   with page.expect_download() as trace_download: page.locator('#cad-trace-export').click()
   trace_path=artifacts/'v19_trace_report.json'
   trace_download.value.save_as(trace_path)
   trace_report=json.loads(trace_path.read_text())
   assert trace_report['approvedForCNC'] is False
   assert trace_report['records'][0]['source']['sha256']==digest
   assert '0\nSECTION' not in trace_path.read_text()
  assert '20 × 60 mm' in page.locator('#cad-metrics').inner_text()
  assert page.locator('#cad-preview polyline').count()==1
  assert page.locator('#cad-layer option').count()==2
  assert page.locator('#cad-contour option').count()==1
  multi=sample.replace('0\nENDSEC\n0\nEOF', '0\nLWPOLYLINE\n8\nCAPA-2\n90\n3\n70\n0\n10\n40\n20\n0\n10\n60\n20\n0\n10\n60\n20\n30\n0\nENDSEC\n0\nEOF')
  page.locator('#cad-file-input').set_input_files({'name':'capas.dxf','mimeType':'application/dxf','buffer':multi.encode()})
  page.wait_for_function("document.querySelector('#cad-status').textContent.includes('2 elementos')")
  assert 'Archivo cargado:' in page.locator('#cad-trace-current').inner_text()
  assert '2 entidades' in page.locator('#cad-topo-summary').inner_text()
  assert '1 entidades abiertas' in page.locator('#cad-chain-summary').inner_text()
  assert page.locator('.cad-trace-entry').count()==1
  assert page.locator('#cad-preview polyline').count()==2
  assert page.locator('#cad-layer option').count()==3
  page.locator('#cad-layer').select_option('CAPA-2')
  assert page.locator('#cad-preview polyline').count()==1
  assert page.locator('#cad-contour').input_value()=='1'
  assert page.evaluate('window.PlegarCadImport.getCurrent().activeInSimulation===false')
  page.locator('#cad-layer').select_option('*')
  page.locator('#cad-contour').select_option('0')
  assert page.locator('#cad-preview polyline').count()==2
  # v0.16: curvas ARC y CIRCLE; informe local sin alterar utillaje activo.
  arcdxf=(root/'EJEMPLO_ARCOS_CAPAS.dxf').read_bytes()
  page.locator('#cad-file-input').set_input_files({'name':'arcos.dxf','mimeType':'application/dxf','buffer':arcdxf})
  page.wait_for_function("document.querySelector('#cad-status').textContent.includes('3 elementos')")
  assert page.locator('#cad-preview polyline').count()==3
  assert page.locator('#cad-layer option').count()==4
  # v0.17: orientación independiente con origen y tolerancia sin impacto en máquina.
  page.locator('#cad-layer').select_option('*')
  page.locator('#cad-contour').select_option('0')
  page.locator('#cad-rotation').select_option('90')
  page.locator('#cad-origin').select_option('center')
  page.locator('#cad-mirror').check()
  page.locator('#cad-tolerance').fill('0.7')
  page.locator('#cad-tolerance').press('Tab')
  assert 'origen DXF' in page.locator('#cad-orientation-metrics').inner_text()
  assert page.locator('#cad-oriented-preview polyline').count()==1
  assert page.evaluate('window.PlegarCadImport.getCurrent().activeInSimulation===false')
  page.locator('#cad-mount-datum').select_option('superior')
  page.locator('#cad-mount-offset').fill('-2')
  page.locator('#cad-mount-offset').press('Tab')
  assert 'BLOQUEADO' in page.locator('#cad-mount-result').inner_text()
  assert page.locator('#cad-mount-export').is_enabled()
  if tag=='pc':
   with page.expect_download() as mount_dl: page.locator('#cad-mount-export').click()
   audit_path=artifacts/'v18_mount_report.json'
   mount_dl.value.save_as(audit_path)
   audit_report=json.loads(audit_path.read_text())
   assert audit_report['approvedForCNC'] is False
   assert audit_report['mountingVerified'] is False
  page.locator('#cad-mount-offset').fill('999')
  page.locator('#cad-mount-offset').press('Tab')
  assert 'Auditoría no disponible' in page.locator('#cad-mount-result').inner_text()
  assert page.locator('#cad-mount-export').is_disabled()
  page.locator('#cad-mount-offset').fill('0')
  page.locator('#cad-mount-offset').press('Tab')
  page.locator('#cad-tolerance').fill('22')
  page.locator('#cad-tolerance').press('Tab')
  assert 'Orientación no válida' in page.locator('#cad-orientation-metrics').inner_text()
  page.locator('#cad-tolerance').fill('0.7')
  page.locator('#cad-tolerance').press('Tab')
  assert page.locator('#cad-oriented-preview polyline').count()==1
  assert page.locator('#cad-report-json').is_enabled()
  assert page.locator('#cad-report-csv').is_enabled()
  assert page.evaluate('window.PlegarCadImport.getCurrent().contours[0].arcCount')==1
  assert page.evaluate('window.PlegarCadImport.getCurrent().contours[2].closed') is True
  assert 'SIN VERIFICAR' in page.locator('.cad-import-panel > .cad-danger').inner_text()
  if tag=='pc':
   with page.expect_download() as dl: page.locator('#cad-report-json').click()
   downloaded=dl.value
   assert downloaded.suggested_filename=='plegar-pro-informe-dxf.json'
   report_path=artifacts/'v17_download_report.json'
   downloaded.save_as(report_path)
   assert json.loads(report_path.read_text())['inspeccion_orientacion']['amarre_validado'] is False
   with page.expect_download() as dl: page.locator('#cad-report-csv').click()
   assert dl.value.suggested_filename.endswith('.csv')
  if tag=='pc':
   page.locator('.cad-import-panel').scroll_into_view_if_needed()
   page.screenshot(path=str(artifacts/'Plegar_Pro_Plus_v016_DXF.png'),full_page=False)
  assert page.locator('#ed-die').input_value()=='v16-88'
  assert 'NO validada' in page.locator('#cad-comparison').inner_text() or 'Dimensiones nominales diferentes' in page.locator('#cad-comparison').inner_text()
  assert page.evaluate('window.PlegarCadImport.getCurrent().activeInSimulation===false')
  page.locator('#cad-file-input').set_input_files({'name':'modelo.dxf','mimeType':'application/dxf','buffer':sample.replace('0\nENDSEC\n0\nEOF','0\nSPLINE\n0\nENDSEC\n0\nEOF').encode()})
  page.wait_for_function("document.querySelector('#cad-status')?.getAttribute('data-error')==='true'")
  assert 'SPLINE' in page.locator('#cad-status').inner_text()


  assert page.locator('.ed-bend-point').count()==4
  assert page.locator('#ed-forming .f2d-svg').count()==1
  assert page.locator('.f2-prior-summary').count()==1
  assert 'Perfil completo:' in page.locator('.f2-prior-summary').inner_text()
  assert page.locator('.f2d-svg line[stroke="#71b5ed"]').count()>=1
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
  page.locator('#ed-punch').select_option('p30-r1-h120')
  assert 'H120 mm' in page.locator('#ed-tool-punch').inner_text()
  page.locator('#ed-die').select_option('v6-88')
  assert 'V/e' in page.locator('#ed-calc-warnings').inner_text()
  page.locator('#ed-undo').click()
  assert page.locator('#ed-die').input_value()=='v16-88'
  page.locator('#ed-redo').click()
  assert page.locator('#ed-die').input_value()=='v6-88'
  assert page.locator('#ed-punch').input_value()=='p30-r1-h120'
  assert 'SIN VERIFICAR' in page.locator('#ed-tool-punch').inner_text()
  print('steps',tag,flush=True)
  page.locator('#ed-add').click()
  assert page.locator('[data-ed-segment]').count()==6
  print('loading',tag,flush=True)
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=css)
  page.evaluate("""() => {window.__testStorage=window.__testStorage||new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorage.get(k)??null,setItem:(k,v)=>window.__testStorage.set(k,String(v)),removeItem:k=>window.__testStorage.delete(k)}})}""")
  for script in ('geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','tooling3d.js','scene3d-audit.js','proximity3d.js','piece3d-view.js','editor2d.js','app.js'):
   page.evaluate((root/script).read_text())
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Programación 2D"]').click()
  assert page.locator('[data-ed-segment]').count()==6
  assert page.locator('#ed-total').inner_text().startswith('476 mm')
  assert page.locator('#ed-radius').input_value()=='3'
  assert page.locator('#ed-die').input_value()=='v6-88'
  assert page.locator('#ed-punch').input_value()=='p30-r1-h120'
  assert 'SIN VERIFICAR' in page.locator('#ed-tool-punch').inner_text()
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
  # The separate 3D module consumes the same editable project and is rotatable.
  if w<=1120:page.locator('#open-menu').click()
  page.locator('button.nav-item[data-screen="Simulación 3D"]').click()
  assert page.locator('.p3-view .p3-svg').count()==1
  assert 'caras ilustrativas' in page.locator('.p3-state').inner_text()
  assert page.locator('.p3-svg polygon[data-group="punch"]').count()>0
  assert page.locator('.p3-svg polygon[data-group="die"]').count()>0
  assert page.locator('.p3-svg polygon[data-group="gauge"]').count()>0
  assert page.locator('.p3-clearance').count()==1
  assert page.locator('.p3-proximity3d').count()==1
  assert 'CRIBADO DE PRISMAS 3D' in page.locator('.p3-proximity3d').inner_text()
  assert 'NO acredita ausencia' in page.locator('.p3-proximity3d').inner_text()
  assert 'NO valida colisiones 3D' in page.locator('.p3-clearance').inner_text()
  assert page.locator('.p3-svg polygon[data-status="pending"]').count()>0
  page.locator('[data-p3-sheet="pending"]').click()
  assert page.locator('[data-p3-sheet="pending"]').get_attribute('aria-pressed')=='false'
  assert page.locator('.p3-svg polygon[data-status="pending"]').count()==0
  page.locator('[data-p3-sheet="pending"]').click()
  assert page.locator('.p3-svg polygon[data-status="pending"]').count()>0
  page.locator('[data-p3-sheet="highlight"]').click()
  assert page.locator('[data-p3-sheet="highlight"]').get_attribute('aria-pressed')=='false'
  page.locator('[data-p3-sheet="highlight"]').click()
  before=page.locator('.p3-svg polygon').count()
  page.locator('[data-p3-toggle="punch"]').click()
  assert page.locator('[data-p3-toggle="punch"]').get_attribute('aria-pressed')=='false'
  assert page.locator('.p3-svg polygon[data-group="punch"]').count()==0
  assert page.locator('.p3-svg polygon').count()<before
  page.locator('[data-p3-toggle="punch"]').click()
  assert page.locator('.p3-svg polygon[data-group="punch"]').count()>0
  assert page.locator('.p3-disclosure').inner_text().find('sin')>=0 or page.locator('.p3-disclosure').count()==1
  prior=page.locator('.p3-svg').inner_html()
  page.locator('[data-p3="right"]').click()
  assert page.locator('.p3-svg').inner_html()!=prior
  page.locator('.p3-width').fill('140')
  assert '140 mm ILUSTRATIVO' in page.locator('.p3-stage').inner_text()
  page.locator('[data-p3="next"]').click()
  assert 'Paso' in page.locator('.p3-step').inner_text()
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
