'use strict';
// Prevent publishing an interface that references missing files or losing Trenirtrade documents.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const exists=f=>fs.existsSync(path.join(root,f));
test('all local HTML scripts and style links exist',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const [,asset] of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)){
  if(/^(https?:|data:|\/\/|#)/.test(asset))continue;
  assert.ok(exists(asset),'Missing HTML resource: '+asset);
 }
 assert.ok(html.includes('plans-view.js')&&html.includes('repo-plans.js'));
});
test('offline service-worker precache resources exist',()=>{
 const src=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const m=src.match(/const FILES=\[([^;]+)\];/);assert.ok(m);
 for(const [,asset] of m[1].matchAll(/['"]\.\/([^'"]+)['"]/g))assert.ok(exists(asset),'Missing cache resource: '+asset);
});
test('the 10 public Trenirtrade PDFs and previews are complete',()=>{
 const index=JSON.parse(fs.readFileSync(path.join(root,'planos/trenirtrade/indice.json'),'utf8'));
 require(path.join(root,'repo-plans.js'));
 const docs=globalThis.PlegarRepoPlans.docs;
 assert.equal(index.documents.length,10);assert.equal(docs.length,10);
 for(const entry of index.documents){
  const pdf='planos/trenirtrade/'+entry.pdf,thumb='planos/trenirtrade/'+entry.thumbnail;
  assert.ok(exists(pdf),'Missing PDF '+pdf);assert.ok(exists(thumb),'Missing preview '+thumb);
  assert.ok(fs.readFileSync(path.join(root,pdf)).subarray(0,5).equals(Buffer.from('%PDF-')),'Invalid PDF '+pdf);
  assert.ok(fs.readFileSync(path.join(root,thumb)).subarray(0,3).equals(Buffer.from([255,216,255])),'Invalid JPEG '+thumb);
  assert.ok(docs.find(doc=>doc.pdf===pdf&&doc.thumbnail===thumb),'Missing entry for '+pdf);
 }
});

test('Planos retains the Programación 2D bridge and simulation safety gate',()=>{ const editor=fs.readFileSync(path.join(root,'editor2d.js'),'utf8'); const app=fs.readFileSync(path.join(root,'app.js'),'utf8'); assert.ok(editor.includes('setPlanReference')&&editor.includes('getPlanReference')&&editor.includes('isPlanConfigured')); assert.ok(app.includes('getPlanReference')&&app.includes('isPlanConfigured')); });
