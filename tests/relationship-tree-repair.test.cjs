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
 const b=timeline('esafe-demo','broken');assert.equal(b.el('[data-phase-name]').textContent,'Survey');b.click('[data-phase="1"]');assert.equal(b.w.localStorage.getItem('nexus.demoPhase:dev'),null);b.dom.window.close();
});
test('connection editor reports save, blocks duplicates, removes only manual edges and surfaces storage failure',()=>{
 const source=fs.readFileSync('apps/nexus-graph-preview/assets/index-CWI-Glgh.js','utf8');
 const fn=source.slice(source.indexOf('function NexusLinkEditor'),source.indexOf('function AU(){'));
 let state=[],cursor=0;const objects=[{id:'a',label:'Document A',type:'document'},{id:'b',label:'Task B',type:'task'},{id:'c',label:'Person C',type:'person'}];let edges=[{id:'a|c',source:'a',target:'c'}],failure=false;
 const context={b:{useState(init){const n=cursor++;if(!(n in state))state[n]=init;return[state[n],v=>state[n]=v]},useEffect(){}},s:{jsx:(type,props)=>({type,...props}),jsxs:(type,props)=>({type,...props})},ko:{createPortal:x=>x},document:{body:{}},Nk:(a,b)=>[a,b].sort().join('|')};vm.createContext(context);vm.runInContext(fn,context);
 const render=()=>{cursor=0;return context.NexusLinkEditor({source:'a',objects,edges,onSave:next=>{if(failure)return false;edges=[edges[0],...next];return true},onClose(){}})};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return null;if(predicate(node))return node;for(const child of [node.children].flat(Infinity)){const found=find(child,predicate);if(found)return found}return null};
 let tree=render();find(tree,n=>n.id==='nx-link-target').onChange({target:{value:'b'}});tree=render();find(tree,n=>n.className==='nx-link-primary').onClick();tree=render();assert.match(find(tree,n=>n.role==='status').children,/Connected: Document A/);assert.equal(edges.length,2);assert.equal(find(tree,n=>n.className==='nx-link-primary').disabled,true);
 assert.equal(find(tree,n=>n['aria-label']==='Remove connection to Person C'),null);
 find(tree,n=>n['aria-label']==='Remove connection to Task B').onClick();tree=render();assert.equal(edges.length,1);
 failure=true;find(tree,n=>n.className==='nx-link-primary').onClick();tree=render();assert.match(find(tree,n=>n.role==='status').children,/Could not save/);assert.equal(edges.length,1);
});
