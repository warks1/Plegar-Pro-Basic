'use strict';
/* Regression test: GitHub releases must not omit resources referenced by the UI,
 * offline precache or the public Trenirtrade document catalogue. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const exists=f=>fs.existsSync(path.join(root,f));

test('every local stylesheet and deferred script referenced by index.html exists',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const [,asset] of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)) {
  if(/^(?:https?:|data:|\/\/|#)/.test(asset))continue;
  assert.ok(exists(asset),`Missing HTML resource: ${asset}`);
 }
 assert.ok(html.includes('plans-view.js')&&html.includes('repo-plans.js'));
});

test('all offline service-worker precache files exist',()=>{
 const src=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const sources=src.match(/const FILES=\[([^;]+)\];/);
 assert.ok(sources,'Static resource array present');
 for(const [,asset] of sources[1].matchAll(/['"]\.\/([^'"]+)['"]/g)) {
  assert.ok(exists(asset),`Missing offline precache resource: ${asset}`);
 }
});

test('10 public Trenirtrade PDFs and their real image thumbnails remain available',()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,'planos/trenirtrade/indice.json'),'utf8'));
 const manifest=require(path.join(root,'repo-plans.js'));
 // Browser-only manifest exposes PlegarRepoPlans on globalThis.
 const exposed=globalThis.PlegarRepoPlans;
 assert.equal(index.documents.length,10);
 assert.equal(exposed.docs.length,10);
 for(const doc of index.documents){
  const pdf='planos/trenirtrade/'+doc.pdf;
  const thumb='planos/trenirtrade/'+doc.thumbnail;
  assert.ok(exists(pdf),`Missing PDF: ${pdf}`);
  assert.ok(exists(thumb),`Missing preview: ${thumb}`);
  assert.ok(fs.readFileSync(path.join(root,pdf)).subarray(0,5).equals(Buffer.from('%PDF-')),`Not a PDF: ${pdf}`);
  assert.ok(fs.readFileSync(path.join(root,thumb)).subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff])),`Not JPEG: ${thumb}`);
  assert.ok(exposed.docs.find(entry=>entry.pdf===pdf && entry.thumbnail===thumb),`Missing menu registration for ${pdf}`);
  const item=exposed.docs.find(entry=>entry.pdf===pdf);assert.ok(item?.preview && exists(item.preview),`Missing high-resolution image for ${pdf}`);
 }
});

test('Planos retains the Programación 2D bridge and simulation safety gate',()=>{ const editor=fs.readFileSync(path.join(root,'editor2d.js'),'utf8'); const app=fs.readFileSync(path.join(root,'app.js'),'utf8'); assert.ok(editor.includes('setPlanReference')&&editor.includes('getPlanReference')&&editor.includes('isPlanConfigured')); assert.ok(app.includes('getPlanReference')&&app.includes('isPlanConfigured')); });
