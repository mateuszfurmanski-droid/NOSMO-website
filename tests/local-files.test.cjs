const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {IDBFactory}=require('fake-indexeddb');
const source=fs.readFileSync('apps/nexus-graph-preview/relationship-tree/src/local-files.js','utf8');
function service(factory=new IDBFactory(),overrides={}) {
 const events=[],window={CustomEvent,dispatchEvent:event=>events.push(event)};
 const ctx={indexedDB:factory,crypto:require('node:crypto').webcrypto,Date,CustomEvent,window,...overrides};
 vm.createContext(ctx);vm.runInContext(source,ctx);return{ctx,events,factory};
}
function file(name,contents='file bytes',type='application/pdf',lastModified=Date.UTC(2020,4,20)){return new File([contents],name,{type,lastModified})}
const plain=value=>JSON.parse(JSON.stringify(value));

test('files and bytes persist with actual immutable addition time, stable order and no Blob in returned metadata',async()=>{
 const {ctx,events,factory}=service(),start=Date.now();
 const selected=[file('Level_2_ventilation_inspection.pdf'),file('L01_delivery_schedule.xlsx','sheet','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')];
 const added=await ctx.nxLocalFilesAdd('esafe-demo',selected),end=Date.now();
 assert.equal(added.length,2);assert.ok(added.every(record=>record.id.startsWith('local-')&&record.recordId===record.id&&record.local));
 assert.ok(added.every(record=>Date.parse(record.addedAt)>=start&&Date.parse(record.addedAt)<=end));
 assert.equal(added[0].addedAt,added[1].addedAt);assert.equal(added[1].additionOrder,added[0].additionOrder+1);
 assert.equal(added[0].date,added[0].addedAt.slice(0,10));assert.equal(added[0].dateRaw,added[0].date);assert.equal(added[0].datePrecision,'day');assert.equal(added[0].dateBasis,'added');
 assert.equal(added[0].modifiedAt,'2020-05-20T00:00:00.000Z');assert.notEqual(added[0].modifiedAt,added[0].addedAt);
 assert.equal(added[0].sourceUrl,null);assert.equal(added[0].fileUrl,null);assert.equal(added[0].mime,'application/pdf');assert.equal(added[0].kind,'PDF');
 assert.equal(added[0].category,'Testing');assert.equal(added[0].categoryBasis,'filename');assert.equal(added[0].suggestedLocation,'level-2');assert.equal(added[0].locationBasis,'filename');
 assert.equal(added[1].suggestedLocation,'level-1');assert.equal(added[1].kind,'Spreadsheet');assert.equal(Object.hasOwn(added[0],'blob'),false);
 const stored=await ctx.nxLocalFilesList('esafe-demo');assert.deepEqual(plain(stored),plain(added));
 const blob=await ctx.nxLocalFileBlob('esafe-demo',added[0].id);assert.equal(await blob.text(),'file bytes');assert.equal(blob.type,'application/pdf');
 assert.equal(events.length,1);assert.equal(events[0].type,'nexus:local-files-updated');assert.equal(events[0].detail.world,'esafe-demo');assert.deepEqual(Array.from(events[0].detail.addedIds),Array.from(added,record=>record.id));
 const reopened=service(factory);const listed=await reopened.ctx.nxLocalFilesList('esafe-demo');assert.deepEqual(plain(listed),plain(added));assert.equal(await(await reopened.ctx.nxLocalFileBlob('esafe-demo',added[0].id)).text(),'file bytes');
 const next=await ctx.nxLocalFilesAdd('esafe-demo',[file('unlabelled.bin','data','application/octet-stream')]);assert.ok(next[0].additionOrder>added[1].additionOrder);assert.equal(next[0].kind,'Other');assert.equal(next[0].category,'Unclassified');assert.equal(next[0].suggestedLocation,'unassigned');
});

test('world isolation applies equally to lists, file bytes, trash and restore',async()=>{
 const {ctx}=service();
 const [a]=await ctx.nxLocalFilesAdd('esafe-demo',[file('Shared.pdf','Catania')]);const [b]=await ctx.nxLocalFilesAdd('dev',[file('Shared.pdf','Riverside')]);
 assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,1);assert.equal((await ctx.nxLocalFilesList('dev')).length,1);assert.equal(await ctx.nxLocalFileBlob('dev',a.id),null);assert.equal(await ctx.nxLocalFileBlob('esafe-demo',b.id),null);
 assert.equal((await ctx.nxLocalFilesTrash('dev',[a.id])).length,0);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,1);
 await ctx.nxLocalFilesTrash('esafe-demo',[a.id]);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,0);assert.equal((await ctx.nxLocalFilesList('dev')).length,1);
 assert.equal((await ctx.nxLocalFilesRestore('dev',[a.id])).length,0);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,0);
 await ctx.nxLocalFilesRestore('esafe-demo',[a.id]);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,1);
 await assert.rejects(ctx.nxLocalFilesList(''),/valid project/);
});

test('soft trash retains original bytes, addition time and order; restoring is idempotent and does not restamp ingestion',async()=>{
 const {ctx,events,factory}=service();const added=await ctx.nxLocalFilesAdd('esafe-demo',[file('survey.pdf','original content'),file('drawing.pdf','other content')]);
 const trashed=await ctx.nxLocalFilesTrash('esafe-demo',[added[0].id,added[0].id,'missing']);assert.equal(trashed.length,1);assert.ok(trashed[0].trashedAt);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,1);assert.equal(await ctx.nxLocalFileBlob('esafe-demo',added[0].id),null);
 const eventCount=events.length;await ctx.nxLocalFilesTrash('esafe-demo',[added[0].id]);assert.equal(events.length,eventCount);
 const reopened=service(factory);assert.equal((await reopened.ctx.nxLocalFilesList('esafe-demo')).length,1);
 await reopened.ctx.nxLocalFilesRestore('esafe-demo',[added[0].id]);const restored=await reopened.ctx.nxLocalFilesList('esafe-demo');assert.deepEqual(plain(restored),plain(added));assert.equal(await(await reopened.ctx.nxLocalFileBlob('esafe-demo',added[0].id)).text(),'original content');
 assert.equal(reopened.events[0].detail.operation,'restore');assert.deepEqual(Array.from(reopened.events[0].detail.addedIds),[]);assert.deepEqual(Array.from(reopened.events[0].detail.restoredIds),[added[0].id]);
});

test('kind and topic/location suggestions use filename evidence without fabricating a floor or classifying every file as PDF',async()=>{
 const {ctx}=service();
 const added=await ctx.nxLocalFilesAdd('esafe-demo',[
  file('model_level-3.ifc','ISO','text/plain'),file('photo.jpg','image','image/jpeg'),file('walkthrough.mp4','video','video/mp4'),file('notes.docx','office','application/vnd.openxmlformats-officedocument.wordprocessingml.document'),file('cells.csv','a,b','text/plain'),file('backup.zip','zip','application/zip'),file('floor_4_plan.pdf'),file('Level_2_Level_3.pdf'),file('Level 0-4 plans.pdf'),file('Level -1 basement.pdf'),file('Level12.pdf'),file('level0_survey.pdf')]);
 assert.deepEqual(Array.from(added.slice(0,6),record=>record.kind),['IFC','Image','Video','Document','Spreadsheet','Other']);assert.equal(added[0].category,'BIM');assert.equal(added[0].suggestedLocation,'level-3');assert.equal(added[6].suggestedLocation,'level-4');
 assert.ok(added.slice(7,11).every(record=>record.suggestedLocation==='unassigned'));assert.equal(added[11].suggestedLocation,'level-0');assert.equal(added[11].category,'Survey');
});

test('batch failure rolls back metadata and Blob writes together and emits no success event',async()=>{
 const {ctx,events}=service();const [existing]=await ctx.nxLocalFilesAdd('esafe-demo',[file('existing.pdf','keep')]);const before=events.length;
 const broken=file('broken.pdf','bad');Object.defineProperty(broken,'slice',{value(){throw new Error('Read failed')}});
 await assert.rejects(ctx.nxLocalFilesAdd('esafe-demo',[file('first.pdf','must roll back'),broken]),/Read failed/);
 const after=await ctx.nxLocalFilesList('esafe-demo');assert.equal(after.length,1);assert.equal(after[0].id,existing.id);assert.equal(events.length,before);assert.equal(await(await ctx.nxLocalFileBlob('esafe-demo',existing.id)).text(),'keep');
 await assert.rejects(ctx.nxLocalFilesAdd('esafe-demo',[{name:'not a File',size:10}]),/valid files/);assert.equal(events.length,before);
 assert.deepEqual(Array.from(await ctx.nxLocalFilesAdd('esafe-demo',[])),[]);assert.equal(events.length,before);
});

test('an aborted IndexedDB write is reported as failure and never publishes an added-file event',async()=>{
 const {ctx,events}=service();const db=await ctx.nxLocalFilesOpen(),original=db.transaction.bind(db);
 db.transaction=(...args)=>{const tx=original(...args);if(args[1]==='readwrite')queueMicrotask(()=>tx.abort());return tx};
 await assert.rejects(ctx.nxLocalFilesAdd('esafe-demo',[file('not saved.pdf')]));assert.equal(events.length,0);assert.equal((await ctx.nxLocalFilesList('esafe-demo')).length,0);
 const unavailable=service(undefined,{indexedDB:undefined});await assert.rejects(unavailable.ctx.nxLocalFilesAdd('esafe-demo',[file('no storage.pdf')]),/unavailable/);assert.equal(unavailable.events.length,0);
});
