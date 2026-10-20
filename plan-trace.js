/* Plegar Pro Plus v0.33 — anotación visual sin reconstrucción CAD ni cotas inferidas. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlegarPlanTrace=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const maxMarks=24;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
function point(x,y){if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)throw Error('Punto fuera del plano');return {x:Math.round(x*10000)/10000,y:Math.round(y*10000)/10000};}
function pair(a,b){const p=point(a.x,a.y),q=point(b.x,b.y);if(Math.hypot(p.x-q.x,p.y-q.y)<.005)throw Error('La línea es demasiado corta');return {a:p,b:q};}
function restore(value){if(!Array.isArray(value))return [];return value.slice(0,maxMarks).flatMap(m=>{try{return [pair(m.a,m.b)];}catch{return [];}});}
function append(marks,a,b){if(marks.length>=maxMarks)throw Error('Máximo 24 líneas de referencia');return [...marks,pair(a,b)];}
function svg(marks,pending){const fmt=n=>(n*1000).toFixed(2);const lines=restore(marks).map((m,i)=>`<g class="ed-plan-traced" aria-label="Marca visual B${i+1}"><line x1="${fmt(m.a.x)}" y1="${fmt(m.a.y)}" x2="${fmt(m.b.x)}" y2="${fmt(m.b.y)}"/><text x="${fmt((m.a.x+m.b.x)/2)}" y="${fmt((m.a.y+m.b.y)/2)}">B${i+1}</text></g>`).join('');return lines+(pending?`<circle class="ed-plan-pending" cx="${fmt(pending.x)}" cy="${fmt(pending.y)}" r="9"/>`:'');}
return {point,pair,append,restore,svg,maxMarks,clamp};
});
