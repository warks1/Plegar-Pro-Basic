'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const T=require('../plan-trace.js');
test('coordinates are normalized, bounded and rounded',()=>{assert.deepEqual(T.point(.123456,.987654),{x:.1235,y:.9877});assert.throws(()=>T.point(-.1,0));assert.throws(()=>T.point(Infinity,0));});
test('nonzero lines, maximum count and SVG labels',()=>{assert.throws(()=>T.pair({x:.1,y:.1},{x:.101,y:.1}));const seg=T.pair({x:0,y:0},{x:1,y:1});assert.match(T.svg([seg]),/B1/);let marks=[];for(let i=0;i<24;i++)marks=T.append(marks,{x:0,y:0},{x:1,y:1});assert.equal(marks.length,24);assert.throws(()=>T.append(marks,{x:0,y:0},{x:1,y:1}));});
test('invalid stored marks discarded safely',()=>{assert.equal(T.restore([{a:{x:0,y:0},b:{x:1,y:1}},{a:{x:-4,y:0},b:{x:1,y:1}}]).length,1);assert.deepEqual(T.restore({}),[]);});
