const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const path='apps/nexus-graph-preview/relationship-tree/';
function timeline(world='dev',saved){
 const dom=new JSDOM('<button id="nexusTopTime"></button><span id="nexusTopTimeSub"></span><div id="root"><div data-node-id="proj"></div><div data-node-id="t-doorkits"></div><div data-node-id="d-doorschedule"></div><div data-node-id="t-snag"></div></div>',{url:'https://example.test/',runScripts:'outside-only'});
 const w=dom.window;w.__NEXUS_PROJECT_WORLD__=world;let tick=null;
 w.setInterval=fn=>(tick=fn,1);w.clearInterval=()=>{tick=null};
 if(saved!==undefined)w.localStorage.setItem('nexus.demoPhase:'+world,String(saved));
 w.eval(fs.readFileSync(path+'nexus-project-time-instrument.js','utf8'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,el:s=>w.document.querySelector(s),click:s=>w.document.querySelector(s).click(),tick:()=>tick?.()};
}
test('phase buttons, slider, graph highlights, boundaries, play and clear are functional',()=>{
 const a=timeline();a.click('#nexusTopTime');assert.ok(a.el('#nexusProjectTimeIso').classList.contains('nx-pti-open'));
 a.click('[data-phase="2"]');assert.equal(a.el('[data-phase-name]').textContent,'Procurement');assert.equal(a.el('[data-node-id="t-doorkits"]').dataset.nxPhaseMatch,'true');assert.equal(a.el('[data-node-id="t-snag"]').dataset.nxPhaseMatch,'false');
 assert.equal(a.w.localStorage.getItem('nexus.demoPhase:dev'),'2');
 const input=a.el('input');input.value='4';input.dispatchEvent(new a.w.Event('input'));assert.equal(a.el('[data-phase-name]').textContent,'Testing + handover');assert.equal(a.el('[data-cmd="next"]').disabled,true);
 a.click('[data-cmd="play"]');assert.equal(a.el('[data-phase-name]').textContent,'Survey');a.tick();assert.equal(a.el('[data-phase-name]').textContent,'Design + BIM');
 a.click('[data-cmd="close"]');a.tick();assert.equal(a.el('[data-phase-name]').textContent,'Design + BIM');
 a.click('[data-cmd="clear"]');assert.equal(a.w.document.documentElement.hasAttribute('data-nx-phase-highlight'),false);
 assert.equal(a.el('[data-knob]'),null);assert.equal(a.el('[data-cmd="rec"]'),null);a.dom.window.close();
});
test('saved phase survives reopen; corrupt phase falls back and worlds use separate keys',()=>{
 const a=timeline('dev',3);assert.equal(a.el('[data-phase-name]').textContent,'Construction');a.dom.window.close();
 const b=timeline('dev','broken');assert.equal(b.el('[data-phase-name]').textContent,'Survey');b.click('[data-phase="1"]');assert.equal(b.w.localStorage.getItem('nexus.demoPhase:esafe-demo'),null);b.dom.window.close();
});
