const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const model=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/tile-groups.js','utf8');
const c={};vm.createContext(c);vm.runInContext(model,c);
const ids=['proj','a','b','c','d'];
const empty=()=>c.nxCleanWorkspace(null,ids);
const drop=(s,a,b,id='nx-group-1')=>c.nxGroupDrop(s,a,b,id,{x:25,y:50},ids);
test('fresh objects have only project edges; collapsed groups replace children; open groups expose their members',()=>{
 const objects=ids.map(id=>({id}));assert.ok(c.nxGroupEdges(objects,[],null).every(e=>e.source==='proj'));
 const s=drop(empty(),'a','b');assert.deepEqual(Array.from(s.groups[0].members),['b','a']);assert.equal(c.nxGroupEdges(objects,s.groups,null).length,3);
 const edges=c.nxGroupEdges(objects,s.groups,'nx-group-1');assert.equal(edges.length,5);assert.equal(edges.filter(e=>e.source==='nx-group-1').length,2);
});
test('add, merge, move between groups and ungroup preserve unique members without nested groups',()=>{
 let s=drop(empty(),'a','b');s=drop(s,'c','nx-group-1');assert.equal(s.groups[0].members.length,3);
 assert.equal(drop(s,'a','nx-group-1'),s);assert.equal(drop(s,'proj','c'),s);assert.equal(drop(s,'a','unknown'),s);
 s=drop(drop(empty(),'a','b'),'c','d','nx-group-2');s=drop(s,'nx-group-1','nx-group-2');assert.equal(s.groups.length,1);assert.equal(s.groups[0].members.length,4);
 s=c.nxUngroup(s,'nx-group-2',{a:{x:2,y:3}},ids);assert.equal(s.groups.length,0);assert.equal(s.pinned.a.x,2);
 s=drop(drop(empty(),'a','b'),'c','d','nx-group-2');s=drop(s,'a','nx-group-2');assert.equal(s.groups.length,1);assert.equal(s.groups[0].members.length,3);
});
test('persistence round trip and malformed data retain only valid, unique memberships and finite coordinates',()=>{
 const s=drop(empty(),'a','b');assert.equal(JSON.stringify(c.nxCleanWorkspace(JSON.parse(JSON.stringify(s)),ids)),JSON.stringify(s));
 const bad=c.nxCleanWorkspace({groups:[{id:'nx-group-a',members:['proj','a','b','b','missing']},{id:'nx-group-b',members:['a','c']},null],pinned:{a:{x:Infinity,y:1},proj:{x:1,y:1},b:{x:1,y:2}}},ids);
 assert.equal(bad.groups.length,1);assert.deepEqual(Object.keys(bad.pinned),['b']);
});
test('actual React map: drag hover, drop, add, undo, expand, reload, cancel, save failure, reset and world isolation',async()=>{
 const React=require('react'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const dom=new JSDOM('<div id="mount"></div>',{url:'https://example.test/'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const objects=ids.map((id,i)=>({id,label:id,type:id==='proj'?'project':'task',Icon:()=>null}));
 const geometry={proj:{x:0,y:0},a:{x:100,y:0},b:{x:220,y:0},c:{x:340,y:0},d:{x:460,y:0}};
 let raf=null;const ctx={URL,URLSearchParams,window:w,document:w.document,localStorage:w.localStorage,b:React,s:jsx,ns:objects,Dt:()=>null,CU:()=>null,gc:{project:{},task:{}},crypto:require('node:crypto').webcrypto,
 CustomEvent:w.CustomEvent,ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>(raf=fn,1),cancelAnimationFrame(){raf=null},getComputedStyle:w.getComputedStyle,
 _w:z=>Math.max(.3,Math.min(1.3,z)),EU:(items,root,edges,pinned)=>new Map(items.map((o,i)=>[o.id,pinned[o.id]||geometry[o.id]||{x:220,y:0}]))};
 vm.createContext(ctx);vm.runInContext(model+'\n'+fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/relationship-map.js','utf8'),ctx);
 let root=createRoot(w.document.getElementById('mount'));const act=React.act;
 const render=()=>act(()=>root.render(jsx.jsx(ctx.AU,{})));
 const node=id=>w.document.querySelector(`[data-node-id="${id}"] button`);
 const graph=()=>w.document.querySelector('[data-zoom]');
 const button=text=>[...w.document.querySelectorAll('button')].find(e=>e.textContent===text);
 const state=()=>JSON.parse(w.localStorage.getItem('nosmo-tile-groups:v2:dev'));
 const click=async el=>{await new Promise(r=>setTimeout(r,360));await act(()=>el.click())};
 const send=async(el,type,x,y)=>act(()=>{const e=new w.MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button:0});Object.defineProperties(e,{pointerId:{value:1},pointerType:{value:'touch'}});el.dispatchEvent(e)});
 const boxes=()=>{w.document.querySelectorAll('[data-node-id]').forEach(el=>{const id=el.dataset.nodeId,p=geometry[id]||{x:220,y:0};el.querySelector('[data-tile-face]').getBoundingClientRect=()=>({left:p.x-40,top:p.y-40,width:80,height:80})})};
 await render();assert.equal(w.document.querySelectorAll('line').length,4);assert.equal(w.document.querySelector('input,select'),null);
 boxes();node('b').querySelector('[data-tile-face]').getBoundingClientRect=()=>({left:205,top:-15,width:30,height:30});await send(node('a'),'pointerdown',65,0);await send(graph(),'pointermove',185,0);await act(()=>raf?.());assert.equal(w.document.querySelector('[data-drop-target=true]').dataset.nodeId,'b');await send(graph(),'pointerup',185,0);
 assert.equal(state().groups.length,1);assert.equal(w.document.querySelectorAll('[data-group-members]').length,1);assert.equal(node('a'),null);
 let group=w.document.querySelector('[data-group-members]').dataset.nodeId;
 await click(node(group));assert.ok(node('a'));assert.ok(node('b'));assert.equal(node(group).getAttribute('aria-expanded'),'true');
 await click(node(group));boxes();await send(node('c'),'pointerdown',340,0);await send(graph(),'pointerup',220,0);assert.equal(state().groups[0].members.length,3);
 await click(button('Undo'));assert.equal(state().groups[0].members.length,2);
 await act(()=>root.unmount());root=createRoot(w.document.getElementById('mount'));await render();assert.equal(w.document.querySelectorAll('[data-group-members]').length,1);
 const before=w.localStorage.getItem('nosmo-tile-groups:v2:dev');boxes();await send(node('c'),'pointerdown',340,0);await send(graph(),'pointermove',220,0);await act(()=>raf?.());await send(graph(),'pointercancel',220,0);assert.equal(w.localStorage.getItem('nosmo-tile-groups:v2:dev'),before);
 const original=w.Storage.prototype.setItem;w.Storage.prototype.setItem=()=>{throw Error('Quota exceeded')};boxes();await send(node('c'),'pointerdown',340,0);await send(graph(),'pointerup',220,0);assert.equal(w.localStorage.getItem('nosmo-tile-groups:v2:dev'),before);assert.match(w.document.querySelector('[role=status]').textContent,/Could not save/);w.Storage.prototype.setItem=original;
 await click(node(group));await click(button('Ungroup'));assert.equal(state().groups.length,0);assert.ok(node('a'));
 await click(button('Reset demo'));assert.equal(w.document.querySelectorAll('line').length,4);assert.equal(w.localStorage.getItem('nosmo-persistent-workspace:dev'),null);
 await act(()=>root.unmount());w.__NEXUS_PROJECT_WORLD__='another-demo';root=createRoot(w.document.getElementById('mount'));await render();assert.equal(w.document.querySelectorAll('[data-group-members]').length,0);assert.equal(w.localStorage.getItem('nosmo-tile-groups:v2:another-demo'),null);
 await act(()=>root.unmount());dom.window.close();
});

test('expanded members avoid neighbouring tiles and each other',()=>{
 const occupied=new Map([['proj',{x:0,y:0}],['nx-group-1',{x:-300,y:-100}],['task',{x:-300,y:100}],['person',{x:-300,y:-290}]]);
 const placed=c.nxPlaceMembers({x:-300,y:-100},['a','b','c','d'],occupied);
 const points=[...occupied.values()];for(const p of placed.values()){assert.ok(points.every(q=>Math.abs(p.x-q.x)>155||Math.abs(p.y-q.y)>185));points.push(p)}assert.equal(placed.size,4);
});
