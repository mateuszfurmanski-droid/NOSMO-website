const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-motion.js','utf8'),ctx);
const project={id:'proj',label:'Project'},archive={id:'nexus-archive',label:'Archive',archive:true},file={id:'f',label:'Report.pdf',type:'document',archived:false};
function snapshot(nodes,known=nodes,edges=[]){return ctx.nxGraphMotionSnapshot(new Map([['proj',{x:0,y:0}],['nexus-archive',{x:-300,y:200}],['f',{x:400,y:100}],['g',{x:150,y:200}]]),nodes,edges,new Map(known.map(n=>[n.id,n])))}
test('first mount stays still; expiration visibly routes the departing file into archive without changing source metadata',()=>{
 const before=snapshot([project,archive,file]),after=snapshot([project,archive],[project,archive,{...file,archived:true}]);
 assert.equal(ctx.nxGraphMotionPlan(null,before).moves.length,0);
 const plan=ctx.nxGraphMotionPlan(before,after);assert.equal(plan.moves.length,1);assert.equal(plan.moves[0].reason,'archive');assert.equal(plan.moves[0].kind,'depart');
 assert.equal(plan.moves[0].from.x,400);assert.equal(plan.moves[0].to.x,-300);assert.equal(plan.moves[0].to.y,200);assert.equal(file.archived,false);
});
test('historical entry comes from the project, while reactivation comes back out of archive',()=>{
 const upcoming=snapshot([project,archive],[project,archive,file]),current=snapshot([project,archive,file]);
 const arriving=ctx.nxGraphMotionPlan(upcoming,current).moves[0];assert.equal(arriving.kind,'arrive');assert.equal(arriving.from.x,0);
 const archived=snapshot([project,archive],[project,archive,{...file,archived:true}]);
 const restored=ctx.nxGraphMotionPlan(archived,current).moves[0];assert.equal(restored.reason,'archive');assert.equal(restored.from.x,-300);assert.equal(restored.to.x,400);
});
test('a file in a closed group is extracted to archive and returns to that group, preserving other memberships',()=>{
 const group={id:'g',label:'Node 1',members:['f','other']},other={id:'other',label:'Other.pdf',archived:false};
 const before=snapshot([project,archive,group],[project,archive,group,file,other]);
 const after=snapshot([project,archive,{...group,members:['other']}],[project,archive,group,{...file,archived:true},other]);
 const outgoing=ctx.nxGraphMotionPlan(before,after).moves.find(n=>n.id==='f');assert.ok(outgoing);assert.equal(outgoing.from.x,150);assert.equal(outgoing.to.x,-300);
 const incoming=ctx.nxGraphMotionPlan(after,before).moves.find(n=>n.id==='f');assert.ok(incoming);assert.equal(incoming.from.x,-300);assert.equal(incoming.to.x,150);
 assert.equal(group.members.length,2);
});
test('connection changes retain old and new route endpoints so disconnect and connect can be drawn separately',()=>{
 const group={id:'g',label:'Node 1',members:['f']};
 const before=snapshot([project,archive,file],[project,archive,file],[{source:'proj',target:'f'}]);
 const after=snapshot([project,archive,group,file],[project,archive,group,file],[{source:'g',target:'f'}]);
 const plan=ctx.nxGraphMotionPlan(before,after);assert.equal(plan.links.length,2);
 assert.equal(plan.links.find(n=>n.kind==='disconnect').from.x,0);assert.equal(plan.links.find(n=>n.kind==='connect').from.x,150);
});
test('camera anchor changes are not migrations and existing archive endpoints follow the current anchor',()=>{
 const before=snapshot([project,archive,file]),after=snapshot([project,archive],[project,archive,{...file,archived:true}]);
 const moved=snapshot([project,archive],[project,archive,{...file,archived:true}]);
 moved.points.set('nexus-archive',{x:-900,y:700});moved.nodes.set('nexus-archive',{...moved.nodes.get('nexus-archive'),x:-900,y:700});
 assert.equal(ctx.nxGraphMotionSignature(after),ctx.nxGraphMotionSignature(moved));
 const plan={...ctx.nxGraphMotionPlan(before,after),focus:[]};
 const resolved=ctx.nxGraphMotionResolve(plan,moved);assert.equal(resolved.moves[0].to.x,-900);assert.equal(resolved.moves[0].to.y,700);
});
test('actual React migration survives selection cleanup and camera-only rerender, then finishes on its original timer',async()=>{
 const {JSDOM}=require('jsdom');
 const dom=new JSDOM('<div id="mount"></div>',{url:'https://example.test/'}),w=dom.window;
 global.window=w;global.document=w.document;global.navigator=w.navigator;global.IS_REACT_ACT_ENVIRONMENT=true;
 const React=require('react'),{createRoot}=require('react-dom/client'),jsx=require('react/jsx-runtime');
 const timers=new Map();let nextTimer=0;w.setTimeout=fn=>{const id=++nextTimer;timers.set(id,fn);return id};w.clearTimeout=id=>timers.delete(id);
 const local={window:w,b:React,s:jsx};vm.createContext(local);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-motion.js','utf8'),local);
 const root=createRoot(w.document.getElementById('mount'));
 let props={positions:new Map([['proj',{x:0,y:0}],['f',{x:400,y:100}],['nexus-archive',{x:-300,y:200}]]),visibleNodes:[project,archive,file],edges:[{source:'proj',target:'f'},{source:'proj',target:'nexus-archive'}],byId:new Map([project,archive,file].map(n=>[n.id,n])),replayKey:100,activeId:'f'};
 const render=()=>React.act(()=>root.render(jsx.jsx(local.NexusGraphMotion,props)));
 try{
  await render();assert.equal(w.document.querySelector('[data-motion-batch]'),null);
  props={...props,visibleNodes:[project,archive],edges:[{source:'proj',target:'nexus-archive'}],byId:new Map([project,archive,{...file,archived:true}].map(n=>[n.id,n])),replayKey:200};
  await render();const ghost=w.document.querySelector('[data-motion-node="f"]');assert.ok(ghost);assert.equal(ghost.getAttribute('data-motion-destination'),'archive');
  const batch=w.document.querySelector('[data-motion-batch]').getAttribute('data-motion-batch'),timer=[...timers.keys()][0];assert.equal(timers.size,1);
  props={...props,activeId:'nexus-archive'};await render();assert.equal(w.document.querySelector('[data-motion-node="f"]'),ghost);assert.equal(w.document.querySelector('[data-motion-batch]').getAttribute('data-motion-batch'),batch);assert.equal([...timers.keys()][0],timer);
  props={...props,positions:new Map([...props.positions].map(([id,p])=>[id,id==='nexus-archive'?{x:-900,y:700}:p]))};
  await render();assert.equal(w.document.querySelector('[data-motion-node="f"]'),ghost);assert.equal(ghost.style.getPropertyValue('--nx-to-x'),'-900px');assert.equal([...timers.keys()][0],timer);
  await React.act(()=>timers.get(timer)());assert.equal(w.document.querySelector('[data-motion-batch]'),null);
 }finally{await React.act(()=>root.unmount());w.close()}
});
