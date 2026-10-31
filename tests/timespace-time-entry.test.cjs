const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/nexus-project-time-instrument.js','utf8');

function setup(world='esafe-demo',readyState='loading'){
 const dom=new JSDOM('<button id="nexusTopTime">TIME</button><span id="nexusTopTimeSub">SOURCE</span><div id="root"></div>',{url:'https://example.test/',runScripts:'outside-only'});
 const w=dom.window;w.__NEXUS_PROJECT_WORLD__=world;
 Object.defineProperty(w.document,'readyState',{value:readyState,configurable:true});
 const evaluate=()=>w.eval(source);
 const ready=()=>w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const time=w.document.getElementById('nexusTopTime');
 return {dom,w,time,evaluate,ready};
}

test('Catania TIME dispatches one TimeSpace request with a pending flag and blocks legacy handlers',()=>{
 const a=setup();let requests=0,legacyClicks=0,legacyUpdates=0;
 a.w.addEventListener('nexus:open-timespace',()=>{requests++;assert.equal(a.w.__NEXUS_TIMESPACE_PENDING__,true)});
 a.time.addEventListener('click',()=>legacyClicks++);
 a.w.addEventListener('nexus:project-time-change',()=>legacyUpdates++);
 const originalTime={worldId:'esafe-demo',progress:0.4,mode:'source-records'};
 a.w.__NEXUS_PROJECT_TIME__=originalTime;
 a.w.localStorage.setItem('nexus.demoPhase:esafe-demo','3');
 a.evaluate();a.ready();
 const click=new a.w.MouseEvent('click',{bubbles:true,cancelable:true});
 a.time.dispatchEvent(click);
 assert.equal(click.defaultPrevented,true);assert.equal(requests,1);assert.equal(legacyClicks,0);assert.equal(legacyUpdates,0);
 assert.equal(a.w.document.getElementById('nexusProjectTimeIso'),null);
 assert.equal(a.w.__NEXUS_PROJECT_TIME__,originalTime);
 assert.equal(a.w.document.getElementById('nexusTopTimeSub').textContent,'SOURCE');
 assert.equal(a.w.localStorage.getItem('nexus.demoPhase:esafe-demo'),'3');
 assert.equal(a.w.document.documentElement.hasAttribute('data-nx-phase-highlight'),false);
 a.dom.window.close();
});

test('Catania requests made before React mounts remain pending and repeated boot does not duplicate listeners',()=>{
 const a=setup();let requests=0;
 a.w.addEventListener('nexus:open-timespace',()=>requests++);
 a.evaluate();a.ready();a.evaluate();a.ready();a.time.click();
 assert.equal(requests,1);assert.equal(a.w.__NEXUS_TIMESPACE_PENDING__,true);
 // The React host can consume this once it mounts; the router owns no time data.
 a.w.__NEXUS_TIMESPACE_PENDING__=false;a.time.click();
 assert.equal(requests,2);assert.equal(a.w.__NEXUS_TIMESPACE_PENDING__,true);
 assert.equal(a.w.document.querySelector('section'),null);
 a.dom.window.close();
});

test('Catania router initializes immediately when its script arrives after DOMContentLoaded',()=>{
 const a=setup('esafe-demo','complete');let requests=0;
 a.w.addEventListener('nexus:open-timespace',()=>requests++);
 a.evaluate();a.time.click();assert.equal(requests,1);assert.equal(a.w.__NEXUS_TIMESPACE_PENDING__,true);
 assert.equal(a.w.document.getElementById('nexusProjectTimeIso'),null);
 a.dom.window.close();
});

test('Riverside still opens its existing phase panel without routing to TimeSpace',()=>{
 const a=setup('dev','complete');let requests=0;
 a.w.addEventListener('nexus:open-timespace',()=>requests++);
 a.evaluate();a.time.click();
 const panel=a.w.document.getElementById('nexusProjectTimeIso');
 assert.ok(panel.classList.contains('nx-pti-open'));assert.equal(panel.querySelectorAll('[data-phase]').length,5);
 assert.equal(panel.querySelector('[data-phase-name]').textContent,'Survey');assert.equal(requests,0);
 assert.equal(a.w.__NEXUS_TIMESPACE_PENDING__,undefined);
 a.dom.window.close();
});
