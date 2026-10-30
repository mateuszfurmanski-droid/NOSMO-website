const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const model=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/tile-groups.js','utf8');
const context={};vm.createContext(context);vm.runInContext(model,context);
const ids=['proj','a','b','c','d','e','f'];
const plain=value=>JSON.parse(JSON.stringify(value));
const workspace=groups=>context.nxCleanWorkspace({groups,pinned:{'nx-group-1':{x:100,y:100},'nx-group-2':{x:500,y:500},f:{x:800,y:700}}},ids);

test('detaching from a two-item node dissolves it without losing either object or visible positions',()=>{
 const before=workspace([{id:'nx-group-1',members:['a','b']}]);
 const snapshot={a:{x:80,y:100},b:{x:220,y:100},c:{x:-200,y:-100},proj:{x:0,y:0},'nx-group-1':{x:100,y:100}};
 const original=JSON.stringify(before),result=context.nxDetachMember(before,'a',{x:430,y:270},snapshot,ids);
 assert.equal(JSON.stringify(before),original);
 assert.equal(result.groups.length,0);
 assert.deepEqual(plain(result.pinned.a),{x:430,y:270});
 assert.deepEqual(plain(result.pinned.b),snapshot.b);
 assert.deepEqual(plain(result.pinned.c),snapshot.c);
 assert.deepEqual(plain(result.pinned.f),{x:800,y:700});
 assert.equal(result.pinned['nx-group-1'],undefined);
 const edges=context.nxGroupEdges(ids.map(id=>({id})),result.groups,null);
 assert.equal(edges.length,ids.length-1);
 assert.ok(edges.some(edge=>edge.source==='proj'&&edge.target==='a'));
 assert.ok(edges.some(edge=>edge.source==='proj'&&edge.target==='b'));
});

test('detaching from a three-item node leaves the other two grouped and preserves other nodes',()=>{
 const before=workspace([{id:'nx-group-1',members:['a','b','c']},{id:'nx-group-2',members:['d','e']}]);
 const result=context.nxDetachMember(before,'b',{x:600,y:150},{a:{x:50,y:50},c:{x:150,y:50},'nx-group-2':{x:530,y:540}},ids);
 assert.deepEqual(plain(result.groups),[{id:'nx-group-1',members:['a','c']},{id:'nx-group-2',members:['d','e']}]);
 assert.deepEqual(plain(result.pinned.b),{x:600,y:150});
 assert.deepEqual(plain(result.pinned.a),{x:50,y:50});
 assert.deepEqual(plain(result.pinned.c),{x:150,y:50});
 assert.deepEqual(plain(result.pinned['nx-group-2']),{x:530,y:540});
 const edges=context.nxGroupEdges(ids.map(id=>({id})),result.groups,'nx-group-1');
 assert.ok(edges.some(edge=>edge.source==='proj'&&edge.target==='b'));
 assert.equal(edges.filter(edge=>edge.target==='b').length,1);
 assert.ok(edges.some(edge=>edge.source==='nx-group-1'&&edge.target==='a'));
 assert.ok(edges.some(edge=>edge.source==='nx-group-1'&&edge.target==='c'));
});

test('project, unknown, group and ungrouped object IDs are no-ops',()=>{
 const before=workspace([{id:'nx-group-1',members:['a','b']}]);
 for(const id of ['proj','missing','nx-group-1','f'])assert.equal(context.nxDetachMember(before,id,{x:1,y:2},{},ids),before);
});

test('invalid release coordinates cancel detach and malformed snapshot pins are discarded',()=>{
 const before=workspace([{id:'nx-group-1',members:['a','b','c']}]);
 for(const point of [null,{x:NaN,y:1},{x:Infinity,y:1},{x:1,y:-Infinity},{x:'2',y:1}])assert.equal(context.nxDetachMember(before,'a',point,{},ids),before);
 const result=context.nxDetachMember(before,'a',{x:-200,y:250},{a:{x:NaN,y:4},b:{x:1,y:Infinity},c:{x:300,y:200},missing:{x:1,y:1},proj:{x:1,y:1}},ids);
 assert.deepEqual(plain(result.pinned.a),{x:-200,y:250});
 assert.deepEqual(plain(result.pinned.c),{x:300,y:200});
 assert.equal(result.pinned.b,undefined);assert.equal(result.pinned.missing,undefined);assert.equal(result.pinned.proj,undefined);
 assert.ok(Object.values(result.pinned).every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));
});
