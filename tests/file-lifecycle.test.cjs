const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function fixture(at=null){const data=new Map(),events=[],clock={now:at===null?Date.now():at};class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]))}static now(){return clock.now}}const ctx={Date:at===null?Date:ClockDate,localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},window:{dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/file-lifecycle.js','utf8'),ctx);return{ctx,data,events,clock}}
const plain=value=>JSON.parse(JSON.stringify(value));

test('deadline storage is world-scoped, normalized to UTC, reversible and emits after success',()=>{
 const {ctx,data,events}=fixture();assert.deepEqual(plain(ctx.nxFileLifecycleRead('esafe-demo')),{});
 const saved=ctx.nxFileLifecycleSet('esafe-demo','d-firecerts','2026-11-01T15:30:00+01:00');assert.equal(saved['d-firecerts'].deactivateAt,'2026-11-01T14:30:00.000Z');assert.deepEqual(plain(ctx.nxFileLifecycleRead('esafe-demo')),plain(saved));assert.deepEqual(plain(ctx.nxFileLifecycleRead('dev')),{});
 assert.equal(events[0].type,'nexus:file-lifecycle-updated');assert.equal(events[0].detail.world,'esafe-demo');assert.equal(events[0].detail.deactivateAt,saved['d-firecerts'].deactivateAt);
 assert.deepEqual(plain(ctx.nxFileLifecycleSet('esafe-demo','d-firecerts',null)),{});assert.equal(events.length,2);assert.equal(data.size,1);
});

test('invalid or missing-zone deadlines are rejected without replacing prior data or emitting success',()=>{
 const {ctx,data,events}=fixture();ctx.nxFileLifecycleSet('esafe-demo','file','2026-11-01T12:00:00Z');const before=[...data],count=events.length;
 for(const bad of ['2026-02-30T12:00:00Z','2026-11-01','2026-11-01T12:00:00','2026-11-01T24:00:00Z','2026-11-01T12:60:00Z','not a timestamp',undefined])assert.throws(()=>ctx.nxFileLifecycleSet('esafe-demo','file',bad),/valid date/);
 assert.deepEqual([...data],before);assert.equal(events.length,count);
 ctx.localStorage.setItem=()=>{throw Error('Quota exceeded')};assert.throws(()=>ctx.nxFileLifecycleSet('esafe-demo','file',null),/Quota/);assert.deepEqual([...data],before);assert.equal(events.length,count);
});

test('expiry is an as-of visibility projection at the exact boundary and never mutates files or ingestion times',()=>{
 const {ctx}=fixture(),at=Date.parse('2026-11-01T12:00:00Z'),files=[{id:'a',addedAt:'2026-10-31T10:11:12Z',local:true},{id:'b'}],rules={a:{deactivateAt:'2026-11-01T12:00:00Z'}};
 const before=JSON.stringify(files),early=ctx.nxFileLifecycleApply(files,rules,at-1),expired=ctx.nxFileLifecycleApply(files,rules,at);
 assert.equal(early[0].archived,false);assert.equal(expired[0].archived,true);assert.equal(expired[1].archived,false);assert.equal(expired[0].addedAt,files[0].addedAt);assert.equal(JSON.stringify(files),before);assert.equal(Object.hasOwn(files[0],'archived'),false);
 assert.equal(ctx.nxFileLifecycleApply(files,{},at)[0].archived,false);assert.equal(ctx.nxFileLifecycleNext(early,at-1),at);assert.equal(ctx.nxFileLifecycleNext(expired,at),null);
});

test('malformed stored rules are ignored and only the nearest valid future deadline is selected',()=>{
 const {ctx,data}=fixture(),key=ctx.nxFileLifecycleKey('esafe-demo');data.set(key,'{broken');assert.deepEqual(plain(ctx.nxFileLifecycleRead('esafe-demo')),{});
 data.set(key,JSON.stringify({a:{deactivateAt:'bad'},b:{deactivateAt:'2026-11-01T12:00:00Z'},c:null}));assert.deepEqual(Object.keys(ctx.nxFileLifecycleRead('esafe-demo')),['b']);
 const now=Date.parse('2026-11-01T12:00:00Z');assert.equal(ctx.nxFileLifecycleNext([{deactivateAt:'2026-11-01T13:00:00Z'},{deactivateAt:'bad'},{deactivateAt:'2026-11-01T12:10:00Z'},{deactivateAt:'2026-11-01T11:00:00Z'}],now),now+600000);
});

test('reactivation retains the observed deactivation cycle and does not make historical archived files permanently active',()=>{
 const t0=Date.parse('2026-11-01T12:00:00Z'),{ctx,clock,data}=fixture(t0),files=[{id:'file',addedAt:'2026-10-31T10:11:12Z'}],deadline=new Date(t0+10000).toISOString();
 ctx.nxFileLifecycleSet('esafe-demo','file',deadline);
 let rules=ctx.nxFileLifecycleRead('esafe-demo'),history=ctx.nxFileLifecycleHistory('esafe-demo');
 assert.equal(history.length,1);assert.equal(history[0].at,new Date(t0).toISOString());assert.equal(ctx.nxFileLifecycleApply(files,rules,t0-1,history)[0].deactivateAt,null);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0+9999,history)[0].archived,false);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0+10000,history)[0].archived,true);
 clock.now=t0+20000;ctx.nxFileLifecycleSet('esafe-demo','file',null);rules=ctx.nxFileLifecycleRead('esafe-demo');history=ctx.nxFileLifecycleHistory('esafe-demo');
 assert.deepEqual(plain(rules),{});assert.equal(history.length,2);assert.equal(history[1].at,new Date(clock.now).toISOString());assert.equal(history[1].deactivateAt,null);
 const archived=ctx.nxFileLifecycleApply(files,rules,t0+15000,history)[0],reactivated=ctx.nxFileLifecycleApply(files,rules,t0+20000,history)[0];assert.equal(archived.archived,true);assert.equal(archived.deactivateAt,deadline);assert.equal(archived.currentDeactivateAt,null);assert.equal(reactivated.archived,false);assert.equal(reactivated.deactivateAt,null);assert.equal(reactivated.lifecycleEvents.length,2);assert.equal(reactivated.addedAt,files[0].addedAt);
 const stored=JSON.parse(data.get(ctx.nxFileLifecycleKey('esafe-demo')));assert.equal(stored.version,2);assert.equal(stored.events.length,2);assert.deepEqual(stored.rules,{});
});

test('cancellation before a planned deadline prevents that later expiry while retaining the actual scheduling and cancellation times',()=>{
 const t0=Date.parse('2026-11-01T12:00:00Z'),{ctx,clock,events}=fixture(t0),files=[{id:'file'}],deadline=new Date(t0+30000).toISOString();
 ctx.nxFileLifecycleSet('esafe-demo','file',deadline);clock.now=t0+10000;ctx.nxFileLifecycleSet('esafe-demo','file',null);
 const rules=ctx.nxFileLifecycleRead('esafe-demo'),history=ctx.nxFileLifecycleHistory('esafe-demo');
 assert.equal(ctx.nxFileLifecycleApply(files,rules,t0+40000,history)[0].archived,false);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0+5000,history)[0].deactivateAt,deadline);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0+10000,history)[0].deactivateAt,null);assert.equal(history.length,2);
 const count=events.length;ctx.nxFileLifecycleSet('esafe-demo','file',null);assert.equal(ctx.nxFileLifecycleHistory('esafe-demo').length,2);assert.equal(events.length,count);
 ctx.nxFileLifecycleSet('esafe-demo','file',deadline);const nextCount=events.length;ctx.nxFileLifecycleSet('esafe-demo','file',deadline);assert.equal(events.length,nextCount);
});

test('a deadline entered in the past becomes effective only at its observed edit time, not retroactively',()=>{
 const t0=Date.parse('2026-11-01T12:00:00Z'),{ctx}=fixture(t0),files=[{id:'file'}];
 ctx.nxFileLifecycleSet('esafe-demo','file',new Date(t0-30000).toISOString());const rules=ctx.nxFileLifecycleRead('esafe-demo'),history=ctx.nxFileLifecycleHistory('esafe-demo');
 assert.equal(ctx.nxFileLifecycleApply(files,rules,t0-1,history)[0].archived,false);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0,history)[0].archived,true);
});

test('legacy rules migrate without fabricated operation timestamps and retain their unknown baseline after cancellation',()=>{
 const t0=Date.parse('2026-11-01T12:30:00Z'),{ctx,clock,data}=fixture(t0),deadline='2026-11-01T12:00:00.000Z',files=[{id:'old'}];
 data.set(ctx.nxFileLifecycleKey('esafe-demo'),JSON.stringify({old:{deactivateAt:deadline}}));
 const legacy=ctx.nxFileLifecycleHistory('esafe-demo');assert.equal(legacy.length,0);assert.equal(legacy.legacyRules.old.deactivateAt,deadline);assert.equal(Object.prototype.propertyIsEnumerable.call(legacy,'legacyRules'),false);
 assert.equal(ctx.nxFileLifecycleApply(files,ctx.nxFileLifecycleRead('esafe-demo'),t0-1000,legacy)[0].archived,true);
 ctx.nxFileLifecycleSet('esafe-demo','old',null);const history=ctx.nxFileLifecycleHistory('esafe-demo'),rules=ctx.nxFileLifecycleRead('esafe-demo');
 assert.equal(history.length,1);assert.equal(history[0].at,new Date(clock.now).toISOString());assert.equal(history[0].deactivateAt,null);assert.equal(history.legacyRules.old.deactivateAt,deadline);
 assert.equal(ctx.nxFileLifecycleApply(files,rules,t0-1000,history)[0].archived,true);assert.equal(ctx.nxFileLifecycleApply(files,rules,t0,history)[0].archived,false);
 assert.equal(JSON.parse(data.get(ctx.nxFileLifecycleKey('esafe-demo'))).legacyRules.old.deactivateAt,deadline);assert.deepEqual(plain(ctx.nxFileLifecycleHistory('dev')),[]);
});

test('v2 history, current rules and success events all remain unchanged when an atomic update fails',()=>{
 const t0=Date.parse('2026-11-01T12:00:00Z'),{ctx,clock,data,events}=fixture(t0);ctx.nxFileLifecycleSet('esafe-demo','file','2026-11-02T12:00:00Z');
 const key=ctx.nxFileLifecycleKey('esafe-demo'),before=data.get(key),count=events.length;clock.now+=10000;ctx.localStorage.setItem=()=>{throw Error('Storage full')};
 assert.throws(()=>ctx.nxFileLifecycleSet('esafe-demo','file',null),/Storage full/);assert.equal(data.get(key),before);assert.equal(events.length,count);assert.equal(ctx.nxFileLifecycleRead('esafe-demo').file.deactivateAt,'2026-11-02T12:00:00.000Z');assert.equal(ctx.nxFileLifecycleHistory('esafe-demo').length,1);
});
