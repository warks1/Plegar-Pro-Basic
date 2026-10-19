"""Verificación de pantalla de carga animada en cuatro anchuras. Chromium local."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<script src="[^"]+" defer></script>', '',html)
html=re.sub(r'<link rel="stylesheet"[^>]+>', '',html)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in [(1440,900),(820,1180),(390,844),(320,700)]:
  page=browser.new_page(viewport={'width':w,'height':h})
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded')
  page.add_style_tag(content=(root/'styles.css').read_text()+'\n'+(root/'splash.css').read_text())
  page.evaluate((root/'splash.js').read_text())
  assert page.locator('#startup-splash').is_visible()
  page.wait_for_timeout(650)
  assert int(page.locator('#startup-meter').get_attribute('aria-valuenow'))>=10
  assert page.locator('.pp-splash-emblem').count()==2
  page.wait_for_timeout(4500)
  assert page.locator('#startup-splash').count()==0
  assert page.locator('#brand-home').is_visible()
  assert not errors, errors
  print('Splash OK:',w,h)
  page.close()
 browser.close()
