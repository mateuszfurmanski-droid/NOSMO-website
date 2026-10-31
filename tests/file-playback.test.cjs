const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sourceRoot='apps/nexus-graph-preview/relationship-tree/src/';
const context={window:{},URL};vm.createContext(context);
vm.runInContext(fs.readFileSync(sourceRoot+'file-playback.js','utf8'),context);
const plain=value=>JSON.parse(JSON.stringify(value));
let loadedCatalog;
function catalog(){
 if(loadedCatalog)return loadedCatalog;
 vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/data.js','utf8'),context);
 vm.runInContext(fs.readFileSync('apps/nexus-esafe-demo/files.js','utf8'),context);
 vm.runInContext(fs.readFileSync(sourceRoot+'project-files.js','utf8'),context);
 loadedCatalog=Array.from(context.nxEsafeCatalog(context.window.ESAFE_RECORDS));return loadedCatalog;
}

test('playback traverses all 106 individual source files, including six/seven-file records and equal-date entries',()=>{
 const files=catalog(),before=JSON.stringify(files),sequence=Array.from(context.nxTimeSpaceSequence(files));
 assert.equal(sequence.length,106);assert.equal(new Set(sequence.map(file=>file.id)).size,106);
 assert.deepEqual(new Set(sequence.map(file=>file.id)),new Set(files.map(file=>file.id)));
 assert.ok(sequence.every((file,index)=>index===0||context.nxFileMoment(sequence[index-1]).timestamp<=context.nxFileMoment(file).timestamp));
 for(const [recordId,count] of [['6598271',6],['6505195',7]]){
  const source=files.filter(file=>file.recordId===recordId),steps=sequence.filter(file=>file.recordId===recordId);
  assert.equal(steps.length,count);assert.deepEqual(steps.map(file=>file.id),source.map(file=>file.id));
  const offsets=steps.map(file=>sequence.indexOf(file));assert.equal(offsets[offsets.length-1]-offsets[0]+1,count);
 }
 assert.equal(JSON.stringify(files),before);assert.notEqual(sequence,files);assert.ok(sequence.every(file=>files.includes(file)));
});

test('appending verified new import timestamps preserves every legacy step and appends their actual chronology',()=>{
 const files=catalog(),legacy=Array.from(context.nxTimeSpaceSequence(files));
 const later={id:'new-b',recordId:'upload-b',name:'Second upload.pdf',date:'2020-01-01',addedAt:'2026-10-31T11:12:13Z'};
 const earlier={id:'new-a',recordId:'upload-a',name:'First upload.pdf',date:'2027-01-01',addedAt:'2026-10-31T11:12:12Z'};
 const sequence=Array.from(context.nxTimeSpaceSequence([...files,later,earlier]));
 assert.equal(sequence.length,108);assert.deepEqual(sequence.slice(0,106).map(file=>file.id),legacy.map(file=>file.id));
 assert.deepEqual(sequence.slice(-2).map(file=>file.id),['new-a','new-b']);
 assert.equal(sequence[0],legacy[0]);
});

test('real import timestamps show UTC time including seconds; source dates keep unknown hours and true precision',()=>{
 assert.deepEqual(plain(context.nxFileMoment({addedAt:'2026-10-31T15:04:05+01:00',date:'2022-03-10'})),{dateLabel:'2026-10-31',timeLabel:'14:04:05 UTC',basis:'Added to Nexus',precision:'second',timestamp:Date.parse('2026-10-31T14:04:05Z')});
 for(const [file,dateLabel,precision] of [[{dateRaw:'2023'},'2023 (year only)','year'],[{dateRaw:'2023-10'},'2023-10 (month only)','month'],[{date:'2023-01-01',datePrecision:'year'},'2023 (year only)','year'],[{dateRaw:'2022-02-24'},'2022-02-24','day']]){
  const moment=context.nxFileMoment(file);assert.equal(moment.dateLabel,dateLabel);assert.equal(moment.timeLabel,'--:--');assert.equal(moment.precision,precision);assert.equal(moment.basis,'Source publication · addition time unknown');
 }
 const unknown=context.nxFileMoment({});assert.equal(unknown.timestamp,null);assert.equal(unknown.timeLabel,'--:--');assert.equal(unknown.precision,'unknown');
});

test('malformed dates do not become real import times; equal dates remain stable and unknown dates stay last',()=>{
 for(const addedAt of ['2026-10-31','2026-02-30T12:30:00Z','2026-10-31T25:00:00Z','2026-10-31T12:61:00Z','2026-10-31T12:30:00','not a date',0]){
  const moment=context.nxFileMoment({addedAt,dateRaw:'2022-03-01'});assert.equal(moment.basis,'Source publication · addition time unknown');assert.equal(moment.timeLabel,'--:--');
 }
 for(const dateRaw of ['2023-02-30','2023-13','no-date'])assert.equal(context.nxFileMoment({dateRaw}).timestamp,null);
 const files=[{id:'z',recordId:'20',date:'2024-05-01'},{id:'a1',recordId:'2',date:'2024-05-01'},{id:'a2',recordId:'2',date:'2024-05-01'},{id:'unknown'}];
 assert.deepEqual(Array.from(context.nxTimeSpaceSequence(files),file=>file.id),['a1','a2','z','unknown']);
 assert.deepEqual(Array.from(context.nxTimeSpaceSequence(null)),[]);
});

test('public Zenodo documents use an encoded Google iframe URL; explicit real Drive IDs use Drive preview',()=>{
 const file={name:'Plan A & B.pdf',kind:'PDF',fileUrl:'https://zenodo.org/records/6497142/files/Plan%20A%20%26%20B.pdf?download=1'};
 const preview=new URL(context.nxGooglePreviewUrl(file));assert.equal(preview.origin,'https://docs.google.com');assert.equal(preview.pathname,'/gview');assert.equal(preview.searchParams.get('embedded'),'true');assert.equal(preview.searchParams.get('url'),file.fileUrl);
 for(const name of ['Register.xlsx','Schedule.xls','Notes.docx','Notes.doc','Data.csv','Data.ods'])assert.ok(context.nxGooglePreviewUrl({...file,name}));
 const driveId='1AbCdEfGhIjKlMnOpQrStUvWxYz_234567';
 assert.equal(context.nxGooglePreviewUrl({name:'Plan.pdf',driveFileId:driveId}),'https://drive.google.com/file/d/'+driveId+'/preview');
 assert.equal(context.nxGooglePreviewUrl({name:'Plan.pdf',id:'6497142',recordId:'6497142'}),null);
 assert.equal(context.nxGooglePreviewUrl({name:'Plan.pdf',driveFileId:'6497142'}),null);
 assert.equal(context.nxGooglePreviewUrl({name:'Plan.pdf',driveFileId:'../../escape'}),null);
});

test('local, private, credentialed, off-origin and unsupported files are never passed to a Google viewer',()=>{
 const base={name:'Plan.pdf',kind:'PDF'};
 for(const fileUrl of ['blob:https://nosmotechnology.co.uk/123','file:///tmp/Plan.pdf','data:application/pdf,hi','http://zenodo.org/records/1/files/Plan.pdf','https://localhost/Plan.pdf','https://10.0.0.1/Plan.pdf','https://zenodo.org.evil.test/Plan.pdf','https://zenodo.org@evil.test/Plan.pdf','https://user:password@zenodo.org/Plan.pdf','https://zenodo.org/Plan.pdf?token=private','https://zenodo.org:8443/Plan.pdf','/local.pdf','javascript:alert(1)','broken'])assert.equal(context.nxGooglePreviewUrl({...base,fileUrl}),null,fileUrl);
 const fileUrl='https://zenodo.org/records/1/files/Plan.pdf';
 for(const flag of [{private:true},{isPublic:false},{public:false},{visibility:'private'},{access:'private'}])assert.equal(context.nxGooglePreviewUrl({...base,fileUrl,...flag}),null);
 for(const name of ['Video.mp4','Video.webm','Image.png','Photo.jpg','Image.svg','Archive.zip','Page.html'])assert.equal(context.nxGooglePreviewUrl({name,fileUrl}),null,name);
 assert.equal(context.nxGooglePreviewUrl({...base,fileUrl,type:'video/mp4'}),null);
 assert.equal(context.nxGooglePreviewUrl({...base,fileUrl,mimeType:'image/png'}),null);
 assert.equal(context.nxGooglePreviewUrl(null),null);
});

test('observed lifecycle keeps past expiry and reactivation checkpoints after the current rule is cleared',()=>{
 const file={id:'observed',recordId:'observed',name:'Observed.pdf',addedAt:'2026-10-31T10:00:00Z',deactivateAt:null,lifecycleEvents:[
  {id:'observed',at:'2026-10-31T10:15:00Z',deactivateAt:'2026-10-31T10:30:00Z'},
  {id:'observed',at:'2026-10-31T10:45:00Z',deactivateAt:null}
 ]};
 const before=JSON.stringify(file),points=plain(context.nxTimeSpaceCheckpoints([file],null));
 assert.deepEqual(points.map(point=>[point.kind,point.fileId,point.at]),[
  ['file','observed',Date.parse(file.addedAt)],
  ['deactivation','observed',Date.parse('2026-10-31T10:30:00Z')],
  ['reactivation','observed',Date.parse('2026-10-31T10:45:00Z')]
 ]);
 assert.equal(JSON.stringify(file),before);assert.equal(new Set(points.map(point=>point.key)).size,points.length);
});

test('cancelling or replacing a future rule before its deadline removes the expiry that never occurred',()=>{
 const base={id:'planned',recordId:'planned',name:'Planned.pdf',addedAt:'2026-10-31T10:00:00Z'};
 const first={id:'planned',at:'2026-10-31T10:15:00Z',deactivateAt:'2026-10-31T12:00:00Z'};
 const cancelled={...base,deactivateAt:null,lifecycleEvents:[first,{id:'planned',at:'2026-10-31T11:00:00Z',deactivateAt:null}]};
 const cancelledPoints=plain(context.nxTimeSpaceCheckpoints([cancelled],null));
 assert.deepEqual(cancelledPoints.map(point=>point.kind),['file']);
 const replaced={...base,deactivateAt:'2026-10-31T13:00:00Z',lifecycleEvents:[first,{id:'planned',at:'2026-10-31T11:00:00Z',deactivateAt:'2026-10-31T13:00:00Z'}]};
 const points=plain(context.nxTimeSpaceCheckpoints([replaced],null));
 assert.deepEqual(points.map(point=>[point.kind,point.at]),[['file',Date.parse(base.addedAt)],['deactivation',Date.parse('2026-10-31T13:00:00Z')]]);
 assert.ok(points.every(point=>point.at!==Date.parse(first.deactivateAt)));assert.ok(points.every(point=>point.kind!=='reactivation'));
});

test('setting a past deadline archives at the actual observed operation time without rewriting earlier history',()=>{
 const file={id:'late-rule',recordId:'late-rule',name:'Late rule.pdf',addedAt:'2026-10-31T10:00:00Z',deactivateAt:'2026-10-31T09:00:00Z',lifecycleEvents:[{id:'late-rule',at:'2026-10-31T11:00:00Z',deactivateAt:'2026-10-31T09:00:00Z'}]};
 const points=plain(context.nxTimeSpaceCheckpoints([file],null));
 assert.deepEqual(points.map(point=>[point.kind,point.at]),[['file',Date.parse(file.addedAt)],['deactivation',Date.parse(file.lifecycleEvents[0].at)]]);
 assert.ok(points.every(point=>point.at!==Date.parse(file.deactivateAt)));
 const recovered={...file,deactivateAt:null,lifecycleEvents:[...file.lifecycleEvents,{id:file.id,at:'2026-10-31T11:15:00Z',deactivateAt:null}]};
 const again=plain(context.nxTimeSpaceCheckpoints([recovered],null));
 assert.deepEqual(again.map(point=>[point.kind,point.at]),[['file',Date.parse(file.addedAt)],['deactivation',Date.parse(file.lifecycleEvents[0].at)],['reactivation',Date.parse('2026-10-31T11:15:00Z')]]);
});

test('a new connection focuses its actual affected file rather than an unrelated newer file',()=>{
 const files=[{id:'early',addedAt:'2026-10-31T10:00:00Z'},{id:'unrelated-newer',addedAt:'2026-10-31T11:00:00Z'}];
 const existing={id:'nx-group-unchanged',members:['unrelated-newer','person-old']},created={id:'nx-group-created',members:['person-new','early']};
 const history={baseline:{at:'2026-10-31T11:15:00Z',groups:[existing]},events:[{at:'2026-10-31T11:30:00Z',groups:[existing,created]}]};
 const before=JSON.stringify(history),points=plain(context.nxTimeSpaceCheckpoints(files,history)),connection=points.find(point=>point.kind==='connections'&&!point.baseline);
 assert.equal(connection.fileId,'early');assert.equal(connection.focusId,'early');assert.equal(connection.at,Date.parse(history.events[0].at));
 assert.equal(connection.key,'connections:1:'+history.events[0].at);assert.equal(connection.order,3);assert.equal(JSON.stringify(history),before);
 const baseline=points.find(point=>point.baseline);assert.equal(baseline.fileId,'unrelated-newer');assert.equal(baseline.focusId,'unrelated-newer');
});

test('merge, member removal and ungroup checkpoints use affected current and previous members',()=>{
 const files=[{id:'file-a',addedAt:'2026-10-31T10:00:00Z'},{id:'file-b',addedAt:'2026-10-31T10:01:00Z'},{id:'unrelated',addedAt:'2026-10-31T10:02:00Z'}];
 const first={id:'nx-group-first',members:['person-a','file-a']},second={id:'nx-group-second',members:['person-b','file-b']},merged={id:first.id,members:['person-b','file-b','person-a','file-a']};
 const history={baseline:{at:'2026-10-31T10:03:00Z',groups:[first,second]},events:[
  {at:'2026-10-31T10:04:00Z',groups:[merged]},
  {at:'2026-10-31T10:05:00Z',groups:[{id:first.id,members:['person-b','person-a']}]},
  {at:'2026-10-31T10:06:00Z',groups:[]}
 ]};
 const points=plain(context.nxTimeSpaceCheckpoints(files,history)).filter(point=>point.kind==='connections'&&!point.baseline);
 assert.equal(points[0].fileId,'file-b');assert.equal(points[0].focusId,'file-b','the newly merged member is in the changed group');
 assert.equal(points[1].fileId,'file-b');assert.equal(points[1].focusId,'file-b','a removed file remains an affected previous member');
 assert.equal(points[2].fileId,undefined);assert.equal(points[2].focusId,'person-b','a removed group cannot be the camera destination');
 const ungroup={baseline:{at:'2026-10-31T10:03:00Z',groups:[first]},events:[{at:'2026-10-31T10:04:00Z',groups:[]}]};
 const dissolved=plain(context.nxTimeSpaceCheckpoints(files,ungroup)).find(point=>point.kind==='connections'&&!point.baseline);
 assert.equal(dissolved.fileId,'file-a');assert.equal(dissolved.focusId,'file-a');
});

test('task-only connection changes focus the existing changed group or its member after removal',()=>{
 const files=[{id:'unrelated',addedAt:'2026-10-31T10:00:00Z'}],taskGroup={id:'nx-group-task',members:['task-a','person-b']};
 const history={baseline:{at:'2026-10-31T10:01:00Z',groups:[]},events:[{at:'2026-10-31T10:02:00Z',groups:[taskGroup]},{at:'2026-10-31T10:03:00Z',groups:[]}]};
 const points=plain(context.nxTimeSpaceCheckpoints(files,history)).filter(point=>point.kind==='connections');
 assert.equal(points[0].fileId,undefined);assert.equal(points[0].focusId,taskGroup.id);
 assert.equal(points[1].fileId,undefined);assert.equal(points[1].focusId,'task-a');
 const baselineOnly=plain(context.nxTimeSpaceCheckpoints(files,{baseline:{at:history.events[0].at,groups:[taskGroup]},events:[]})).find(point=>point.baseline);
 assert.equal(baselineOnly.focusId,taskGroup.id);assert.equal(baselineOnly.fileId,undefined);
});
