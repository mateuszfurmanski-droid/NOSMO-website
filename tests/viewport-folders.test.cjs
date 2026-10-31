const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/tile-groups.js','utf8'),ctx);
const plain=x=>JSON.parse(JSON.stringify(x));
test('derived topic/import folders preserve source order, exclude manual members and retain separate import identities',()=>{
 const files=[{id:'a',category:'BIM'},{id:'b',category:'Survey'},{id:'c',category:'BIM'},{id:'d',category:'BIM',folderMode:'batch',importBatchId:'first',importLabel:'Drawings'},{id:'e',category:'Survey',folderMode:'batch',importBatchId:'first'},{id:'f',category:'BIM',folderMode:'batch',importBatchId:'second'},{id:'g'}];
 const before=JSON.stringify(files),groups=ctx.nxAutomaticFileFolders(files,[{members:['c']}]);
 assert.deepEqual(plain(groups.map(g=>g.members)),[['a'],['b'],['d','e'],['f'],['g']]);assert.deepEqual(plain(groups.map(g=>g.label)),['BIM','Survey','Drawings','Imported files','Unclassified']);
 assert.equal(new Set(groups.map(g=>g.id)).size,5);assert.ok(groups.every(g=>g.automatic));assert.equal(JSON.stringify(files),before);
 const after=ctx.nxAutomaticFileFolders(files.filter(f=>f.id!=='d'),[{members:['c']}]);assert.equal(after.find(g=>g.members.includes('e')).id,groups[2].id);
});
for(const [width,height] of [[320,640],[390,716],[716,390],[900,900],[1600,700],[250,1000],[1200,250]]){
 for(const fileCount of [8,40,106])test(`${fileCount} external tiles fit and never overlap at ${width}x${height}, including reserved player/header area`,()=>{
  const base=new Map([['proj',{x:0,y:0}],...Array.from({length:8},(_,i)=>['core-'+i,{x:350*Math.cos(i*Math.PI/4),y:350*Math.sin(i*Math.PI/4)}]),['manual-overlap',{x:0,y:0}]]);
  const outer=Array.from({length:fileCount},(_,i)=>({id:i?'file-'+i:'nexus-archive'})),ids=[...base.keys(),...outer.map(f=>f.id)];
  const area={left:12,top:80,width:width-24,height:Math.max(20,height-80-Math.min(250,height*.45))};
  const positions=ctx.nxViewportGraphLayout(base,outer,ids,area),camera=ctx.nxFitViewportGraph(positions,ids,area,{w:width,h:height});
  assert.ok(camera.zoom>0);const boxes=ids.map(id=>{const p=positions.get(id),x=width/2+camera.pan.x+p.x*camera.zoom,y=height/2+camera.pan.y+p.y*camera.zoom;return{id,left:x-76*camera.zoom,right:x+76*camera.zoom,top:y-82*camera.zoom,bottom:y+82*camera.zoom}});
  for(const a of boxes){assert.ok(a.left>=area.left-1e-6&&a.right<=area.left+area.width+1e-6&&a.top>=area.top-1e-6&&a.bottom<=area.top+area.height+1e-6,`Clipped ${a.id}`);for(const b of boxes)if(a.id!==b.id)assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`Overlap ${a.id}/${b.id}`)}
  const core=boxes.slice(0,base.size),bounds={left:Math.min(...core.map(b=>b.left)),right:Math.max(...core.map(b=>b.right)),top:Math.min(...core.map(b=>b.top)),bottom:Math.max(...core.map(b=>b.bottom))};
  for(const b of boxes.slice(base.size))assert.ok(b.right<=bounds.left||b.left>=bounds.right||b.bottom<=bounds.top||b.top>=bounds.bottom,`External file inside circle ${b.id}`);
 });
}

test('manual pan and zoom remain bounded by the safe area, including a fit scale below legacy minimum zoom',()=>{
 const base=new Map([['a',{x:-2000,y:-3000}],['b',{x:2000,y:3000}]]),ids=['a','b'],area={left:12,top:80,width:300,height:200},canvas={w:324,h:400};
 for(const zoom of [.0001,.02,.3,1.3])for(const pan of [{x:-10000,y:10000},{x:10000,y:-10000}]){
  const view=ctx.nxConstrainViewportCamera(base,ids,area,canvas,{zoom,pan});assert.ok(view.zoom<.3);
  for(const p of base.values()){const x=canvas.w/2+view.pan.x+p.x*view.zoom,y=canvas.h/2+view.pan.y+p.y*view.zoom;assert.ok(x-76*view.zoom>=area.left-1e-6&&x+76*view.zoom<=area.left+area.width+1e-6&&y-82*view.zoom>=area.top-1e-6&&y+82*view.zoom<=area.top+area.height+1e-6)}
 }
});
