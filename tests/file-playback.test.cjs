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
