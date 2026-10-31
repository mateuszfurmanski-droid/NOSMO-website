const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/graph-history.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const at='2026-10-31T14:15:16.123Z',later='2026-10-31T14:15:17.456Z',last='2026-10-31T14:15:18.789Z';
const group=(id='a',members=['file-a','person-b'])=>({id:'nx-group-'+id,members});
function harness(){
 const data=new Map(),events=[];let writes=0,fail=false;
 const localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>{if(fail)throw Error('Storage unavailable');writes++;data.set(key,value)}};
 const context={localStorage,window:{dispatchEvent:event=>events.push(event)},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {context,data,events,writes:()=>writes,setFailure:()=>fail=true};
}

test('history starts at its first observed snapshot and never fabricates earlier connections',()=>{
 const h=harness(),c=h.context;assert.equal(c.nxGraphHistoryRead('esafe-demo'),null);
 const initial=[group()];const history=c.nxGraphHistoryEnsure('esafe-demo',initial,at);
 assert.deepEqual(plain(history),{version:1,baseline:{at,groups:initial},events:[]});
 assert.equal(c.nxGraphHistoryAt(history,Date.parse(at)-1),null);
 assert.deepEqual(plain(c.nxGraphHistoryAt(history,Date.parse(at))),initial);
 assert.equal(h.events.length,1);assert.deepEqual(plain(h.events[0].detail),{world:'esafe-demo'});
 const again=c.nxGraphHistoryEnsure('esafe-demo',[],later);assert.deepEqual(plain(again),plain(history));assert.equal(h.writes(),1);assert.equal(h.events.length,1);
 initial[0].members.push('mutation');assert.deepEqual(plain(c.nxGraphHistoryRead('esafe-demo').baseline.groups),[group()]);
});

test('connection changes and undo states append immutable snapshots and replay at exact boundaries',()=>{
 const h=harness(),c=h.context;h.data.set('nosmo-tile-groups:v2:esafe-demo','original workspace');
 const initial=c.nxGraphHistoryEnsure('esafe-demo',[],at),one=c.nxGraphHistoryRecord('esafe-demo',[group()],later),two=c.nxGraphHistoryRecord('esafe-demo',[],last);
 assert.equal(initial.events.length,0);assert.equal(one.events.length,1);assert.equal(two.events.length,2);
 assert.deepEqual(plain(c.nxGraphHistoryAt(two,Date.parse(later)-1)),[]);
 assert.deepEqual(plain(c.nxGraphHistoryAt(two,Date.parse(later))),[group()]);
 assert.deepEqual(plain(c.nxGraphHistoryAt(two,Date.parse(last))),[]);
 assert.deepEqual(Array.from(c.nxGraphHistoryTimes(two)),[at,later,last]);
 const snapshot=c.nxGraphHistoryAt(two,Date.parse(later));snapshot[0].members.length=0;
 assert.deepEqual(plain(c.nxGraphHistoryRead('esafe-demo').events[0].groups),[group()]);
 assert.equal(h.data.get('nosmo-tile-groups:v2:esafe-demo'),'original workspace');assert.equal(h.writes(),3);assert.equal(h.events.length,3);
});

test('unchanged membership is not a new event, including reordered groups and members',()=>{
 const h=harness(),c=h.context,groups=[group('a',['a','b']),group('b',['c','d'])];
 c.nxGraphHistoryEnsure('esafe-demo',groups,at);
 const same=c.nxGraphHistoryRecord('esafe-demo',[group('b',['d','c']),group('a',['b','a'])],later);
 assert.equal(same.events.length,0);assert.equal(h.writes(),1);assert.equal(h.events.length,1);
});

test('worlds stay isolated and same-millisecond observations retain latest insertion order',()=>{
 const h=harness(),c=h.context;c.nxGraphHistoryEnsure('esafe-demo',[],at);c.nxGraphHistoryEnsure('dev',[group('dev')],later);
 c.nxGraphHistoryRecord('esafe-demo',[group()],later);const changed=c.nxGraphHistoryRecord('esafe-demo',[],later);
 assert.equal(changed.events.length,2);assert.deepEqual(plain(c.nxGraphHistoryAt(changed,Date.parse(later))),[]);
 assert.deepEqual(Array.from(c.nxGraphHistoryTimes(changed)),[at,later]);
 assert.deepEqual(plain(c.nxGraphHistoryRead('dev').baseline.groups),[group('dev')]);assert.equal(c.nxGraphHistoryRead('unknown'),null);
});

test('invalid and backdated timestamps are rejected without changing saved history',()=>{
 const h=harness(),c=h.context;
 for(const value of ['2026-10-31','2026-02-30T12:30:00Z','2026-10-31T25:00:00Z','2026-10-31T12:30:00','bad',0])assert.throws(()=>c.nxGraphHistoryEnsure('esafe-demo',[],value),/real ISO/);
 assert.equal(h.writes(),0);c.nxGraphHistoryEnsure('esafe-demo',[],later);const before=h.data.get(c.nxGraphHistoryKey('esafe-demo'));
 assert.throws(()=>c.nxGraphHistoryRecord('esafe-demo',[group()],at),/before the last/);
 assert.equal(h.data.get(c.nxGraphHistoryKey('esafe-demo')),before);assert.equal(h.events.length,1);
 const offset=c.nxGraphHistoryEnsure('offset',[],'2026-10-31T15:15:16.123+01:00');assert.equal(offset.baseline.at,at);
});

test('corrupt snapshots are sanitized, untrusted extra fields do not become stored app state',()=>{
 const h=harness(),c=h.context,key=c.nxGraphHistoryKey('esafe-demo');
 h.data.set(key,'{bad json');assert.equal(c.nxGraphHistoryRead('esafe-demo'),null);
 h.data.set(key,JSON.stringify({version:1,baseline:{at,groups:[group('a',['a','a','proj','b']),group('duplicate',['a','c']),{id:'invalid',members:['x','y']},group('nested',['nx-group-other','z'])],pinned:{evil:{x:1,y:2}}},events:[{at:'bad',groups:[]},{at:'2020-01-01T00:00:00Z',groups:[]},{at:later,groups:[]},{at:last,groups:[],extra:'ignored'}]}));
 const clean=c.nxGraphHistoryRead('esafe-demo');assert.deepEqual(plain(clean),{version:1,baseline:{at,groups:[group('a',['a','b'])]},events:[{at:later,groups:[]}]});
 assert.equal(c.nxGraphHistoryAt(clean,NaN),null);assert.deepEqual(Array.from(c.nxGraphHistoryTimes(null)),[]);
});

test('a failed write preserves the previous observation and publishes no success event',()=>{
 const h=harness(),c=h.context;c.nxGraphHistoryEnsure('esafe-demo',[],at);const before=h.data.get(c.nxGraphHistoryKey('esafe-demo'));h.setFailure();
 assert.throws(()=>c.nxGraphHistoryRecord('esafe-demo',[group()],later),/Storage unavailable/);
 assert.equal(h.data.get(c.nxGraphHistoryKey('esafe-demo')),before);assert.equal(h.events.length,1);
 assert.throws(()=>c.nxGraphHistoryEnsure('other',[],later),/Storage unavailable/);assert.equal(c.nxGraphHistoryRead('other'),null);assert.equal(h.events.length,1);
});
