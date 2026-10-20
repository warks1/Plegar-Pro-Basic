"""Integración Planos: almacenamiento local, foto -> PDF, miniaturas y exportaciones."""
from pathlib import Path
from tempfile import TemporaryDirectory
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw
import subprocess,zipfile,re,json
ROOT=Path(__file__).resolve().parents[1]
HTML=re.sub(r'<script src="[^"]+" defer></script>', '', (ROOT/'index.html').read_text())
HTML=re.sub(r'<link rel="stylesheet"[^>]+>', '', HTML)
CSS='\n'.join((ROOT/f).read_text() for f in ('styles.css','editor2d.css','forming2d.css','piece3d.css','cad-mounting.css','cad-trace.css','cad-topology.css','cad-chain.css','cad-crossings.css','cad-tangency.css','plans.css'))
FAKE_IDB=r"""() => {
 const stores={folders:new Map(),plans:new Map()};
 const copy=x=>structuredClone(x);
 function response(data){const req={result:undefined,error:null,onsuccess:null,onerror:null};setTimeout(()=>{req.result=copy(data);req.onsuccess?.();},0);return req;}
 const db={createObjectStore(name){return {createIndex(){}};},transaction(name){const tx={oncomplete:null,onerror:null,onabort:null};tx.objectStore=()=>({
    getAll:()=>response([...stores[name].values()]),get:key=>response(stores[name].get(key)),
    put:item=>{stores[name].set(item.id,copy(item));setTimeout(()=>tx.oncomplete?.(),0);},
    delete:key=>{stores[name].delete(key);setTimeout(()=>tx.oncomplete?.(),0);}
   });return tx;}};
 Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(name,version){const req={result:db,error:null,onupgradeneeded:null,onerror:null,onsuccess:null};setTimeout(()=>{req.onupgradeneeded?.();setTimeout(()=>req.onsuccess?.(),0);},0);return req;}}});
 const data=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}});
 }"""
SCRIPTS=['geometry2d.js','tool-library.js','manufacturer-references.js','cad-profile.js','cad-orientation.js','cad-trace.js','cad-profile-view.js','cad-mounting-audit.js','cad-mounting-view.js','cad-trace-view.js','cad-topology.js','cad-topology-view.js','cad-chain.js','cad-chain-view.js','cad-crossings.js','cad-crossings-view.js','cad-tangency.js','cad-tangency-view.js','bendcalc.js','clearance2d.js','toolprofiles2d.js','previousbends2d.js','interference2d.js','assembly2d.js','forming2d.js','forming2d-view.js','piece3d.js','fold-kinematics.js','tooling3d.js','scene3d-audit.js','proximity3d.js','sweep3d.js','piece3d-view.js','plan-trace.js','editor2d.js','plans-core.js','plans-view.js','app.js']
with TemporaryDirectory() as temp:
 tmp=Path(temp)
 jpg=tmp/'soporte.jpeg';img=Image.new('RGB',(800,480),'white');d=ImageDraw.Draw(img);d.polygon([(110,280),(250,280),(420,120),(540,120),(710,290)],outline='#16467d',width=22);img.save(jpg,'JPEG')
 with sync_playwright() as play:
  browser=play.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for size,w,h in [('pc',1440,900),('tablet',820,1180),('mobile',390,844),('small',320,720)]:
   context=browser.new_context(accept_downloads=True,viewport={'width':w,'height':h})
   page=context.new_page();errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
   page.set_content(HTML,wait_until='domcontentloaded');page.add_style_tag(content=CSS);page.evaluate(FAKE_IDB)
   for script in SCRIPTS:page.evaluate((ROOT/script).read_text())
   if w<=1120: page.locator('#open-menu').click()
   page.locator('button.nav-item[data-screen="Planos"]').click()
   page.locator('#pl-target').wait_for()
   assert page.locator('button.nav-item[data-screen="Planos"]').count()==1
   assert page.locator('#pl-camera').get_attribute('capture')=='environment'
   page.locator('#pl-folder-name').fill('Cliente Prueba')
   page.locator('#pl-folder-form button').click()
   page.wait_for_function("document.querySelectorAll('#pl-target option').length === 2",timeout=6000)
   page.locator('#pl-files').set_input_files(str(jpg))
   page.locator('.pl-item').first.wait_for(timeout=6000)
   assert page.locator('.pl-item').count()==1
   assert page.locator('.pl-item .pl-thumb img').count()==1
   if size=='pc':
    # PDF generado a partir de la imagen
    with page.expect_download() as dl:page.locator('.pl-item [data-action="pdf"]').first.click()
    pdf=dl.value;pdf_path=tmp/'imagen-exportada.pdf';pdf.save_as(pdf_path)
    assert pdf_path.read_bytes().startswith(b'%PDF-')
    out=subprocess.run(['pdfinfo',str(pdf_path)],capture_output=True,text=True)
    assert out.returncode==0,out.stderr
    assert 'Pages:           1' in out.stdout
    with page.expect_download() as backup:page.locator('[data-action="backup"]').click()
    zip_path=tmp/'backup.zip';backup.value.save_as(zip_path)
    with zipfile.ZipFile(zip_path) as z:
     assert z.testzip() is None
     assert len(z.namelist())==3,z.namelist()
     assert any(x.startswith('indice-planos') for x in z.namelist())
    # DXF genera silueta con una miniatura
    page.locator('#pl-files').set_input_files(str(ROOT/'EJEMPLO_PERFIL_MULTICAPA.dxf'))
    page.wait_for_function("document.querySelectorAll('.pl-item').length === 2",timeout=7000)
    assert page.locator('.pl-item .pl-thumb img').count()==2
    page.screenshot(path=str(ROOT.parent/'Plegar_Pro_Plus_v027_Planos.png'),full_page=True)
    with page.expect_download() as dl:page.locator('.pl-item [data-action="pdf"]').first.click()
    dxfpdf=tmp/'dxf-exportado.pdf';dl.value.save_as(dxfpdf)
    assert subprocess.run(['pdfinfo',str(dxfpdf)],capture_output=True).returncode==0
    # Importación masiva privada en carpeta independiente: índice, PDF y foto original.
    bundle_path=tmp/'cliente-ejemplo.zip'
    f='Cliente ZIP Demo'
    index={'type':'plans-import-v1','version':1,'folder':f,'documents':[{'name':'Pieza ejemplo.pdf','pdf':'pieza.pdf','original':'originales/soporte.jpeg','thumbnail':'miniaturas/soporte.jpg','originalName':'soporte.jpeg','note':'Foto con croquis de prueba'}]}
    with zipfile.ZipFile(bundle_path,'w',zipfile.ZIP_STORED) as z:
     z.writestr(f+'/indice-planos.json',json.dumps(index));z.write(pdf_path,f+'/pieza.pdf');z.write(jpg,f+'/originales/soporte.jpeg');z.write(jpg,f+'/miniaturas/soporte.jpg')
    page.locator('#pl-bundle').set_input_files(str(bundle_path))
    page.wait_for_function("document.querySelectorAll('.pl-item').length === 1 && document.querySelector('#pl-message')?.textContent.includes('1 plano(s)')",timeout=10000)
    assert page.locator('.pl-item .pl-thumb img').count()==1
    assert 'Cliente ZIP Demo' in page.locator('.pl-folders').inner_text()
    page.locator('#pl-bundle').set_input_files(str(bundle_path))
    page.wait_for_function("document.querySelector('#pl-message')?.textContent.includes('Omitidos duplicados: 1')",timeout=10000)
    assert page.locator('.pl-item').count()==1
    # Reabrir: persistencia
    page.locator('button[data-screen="Inicio"]').first.click()
    page.locator('button.nav-item[data-screen="Planos"]').click()
    page.locator('.pl-item').first.wait_for()
    assert page.locator('.pl-item').count()==3
    page.locator('.pl-folders button[data-action="folder"]').filter(has_text='Cliente ZIP Demo').click()
    assert page.locator('.pl-item').count()==1
    page.locator('.pl-item [data-action="more"]').first.click()
    assert page.locator('.pl-dialog').count()==1
    assert 'STEP / STP' in page.locator('.pl-formats').inner_text()
    assert 'Requiere CAD/CAM externo' in page.locator('.pl-formats').inner_text()
    page.locator('[data-action="close"]').click()
   overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
   assert not overflow,(size,page.evaluate('document.documentElement.scrollWidth'),w)
   assert not errors,(size,errors)
   print(size,'OK',flush=True)
   context.close()
  browser.close()

