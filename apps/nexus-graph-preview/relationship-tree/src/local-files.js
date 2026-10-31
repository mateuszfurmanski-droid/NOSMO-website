// Local project files remain on this device. Metadata and bytes commit together.
const nxLocalFilesDatabaseName='nosmo-local-project-files-v1';
let nxLocalFilesDatabasePromise=null;
function nxLocalFilesWorld(world) {
  if(typeof world!=='string'||!world.trim()||world.length>200)throw new Error('Choose a valid project before adding files.');
  return world.trim();
}
function nxLocalFilesOpen() {
  if(nxLocalFilesDatabasePromise)return nxLocalFilesDatabasePromise;
  if(typeof indexedDB==='undefined')return Promise.reject(new Error('Device file storage is unavailable in this browser.'));
  const promise=new Promise((resolve,reject)=>{
    let request,settled=false;
    try{request=indexedDB.open(nxLocalFilesDatabaseName,1)}catch(error){reject(error);return}
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('files')){const store=db.createObjectStore('files',{keyPath:['world','id']});store.createIndex('world','world',{unique:false})}};
    request.onerror=()=>{settled=true;reject(request.error||new Error('Could not open device file storage.'))};
    request.onblocked=()=>{settled=true;reject(new Error('Device file storage is blocked by another open Nexus tab.'))};
    request.onsuccess=()=>{const db=request.result;if(settled){db.close();return}settled=true;db.onversionchange=()=>{db.close();nxLocalFilesDatabasePromise=null};resolve(db)};
  });
  nxLocalFilesDatabasePromise=promise;
  promise.catch(()=>{if(nxLocalFilesDatabasePromise===promise)nxLocalFilesDatabasePromise=null});
  return promise;
}
function nxLocalFilesMetadata(record) {const {blob,...metadata}=record;return metadata}
function nxLocalFilesNotify(world,addedIds=[],extra={}) {
  try{if(typeof window==='undefined'||typeof window.dispatchEvent!=='function')return;const EventClass=window.CustomEvent||(typeof CustomEvent!=='undefined'?CustomEvent:null);if(EventClass)window.dispatchEvent(new EventClass('nexus:local-files-updated',{detail:{world,addedIds,...extra}}))}catch{}
}
function nxLocalFileKind(file) {
  const mime=String(file.type||'').toLowerCase(),ext=String(file.name||'').split('.').pop().toLowerCase();
  if(mime==='application/pdf')return'PDF';
  if(mime.startsWith('video/'))return'Video';
  if(mime.startsWith('image/'))return'Image';
  if(/spreadsheet|excel|csv/.test(mime))return'Spreadsheet';
  if(/msword|wordprocessingml|opendocument.text|presentation|powerpoint/.test(mime)||mime==='application/rtf')return'Document';
  if(['ifc','ifczip','ifcxml'].includes(ext)||/ifc|x-step/.test(mime))return'IFC';
  if(ext==='pdf')return'PDF';
  if(['mp4','webm','mov','m4v','avi','mkv','mpeg','mpg'].includes(ext))return'Video';
  if(['jpg','jpeg','png','gif','webp','heic','heif','tif','tiff','bmp','svg','avif'].includes(ext))return'Image';
  if(['xlsx','xls','xlsm','ods','csv'].includes(ext))return'Spreadsheet';
  if(['doc','docx','odt','rtf','txt','md','ppt','pptx','odp'].includes(ext))return'Document';
  if(mime==='text/plain'||mime==='text/markdown')return'Document';
  return'Other';
}
function nxLocalFileTopic(name,kind) {
  const text=String(name).toLowerCase().replace(/[_-]+/g,' ');
  if(/\b(survey|site measure|measured survey|pomiar|inwentaryzacja)\b/.test(text))return'Survey';
  if(kind==='IFC'||/\b(bim|ifc|revit|3d model|digital model)\b/.test(text))return'BIM';
  if(/\b(production|delivery|procurement|pre assembly|purchase order)\b/.test(text))return'Production';
  if(/\b(inspection|test|testing|certificate|monitoring|commissioning|odbior)\b/.test(text))return'Testing';
  if(/\b(design|drawing|plan|layout|specification|abacus|projekt|rysunek)\b/.test(text))return'Design';
  if(/\b(newsletter|poster|dissemination|training|outreach|minutes|meeting)\b/.test(text))return'Communication';
  if(/\b(construction|installation|renovation|retrofit|site|door|ventilation|duct|electrical|plumbing)\b/.test(text))return'Construction';
  return'Unclassified';
}
function nxLocalFileLocation(name) {
  const text=String(name).toLowerCase().replace(/_/g,' ');
  // A named negative level or a range is not a single configured building level.
  if(/\b(?:level|floor|lvl)\s+-\s*\d/.test(text)||/\b(?:level|floor|lvl|l)[ -]*\d+[ -]*(?:to|through|[–—-])[ -]*\d+/.test(text))return'unassigned';
  const locations=new Set();
  for(const match of text.matchAll(/(?:^|[^a-z0-9])(?:level|floor|lvl)[ -]*0?([0-4])(?=$|[^a-z0-9])/g))locations.add('level-'+match[1]);
  for(const match of text.matchAll(/(?:^|[^a-z0-9])l0?([0-4])(?=$|[^a-z0-9])/g))locations.add('level-'+match[1]);
  return locations.size===1?[...locations][0]:'unassigned';
}
function nxLocalFilesSort(files) {return files.sort((a,b)=>String(a.addedAt).localeCompare(String(b.addedAt))||(a.additionOrder-b.additionOrder)||a.id.localeCompare(b.id))}
async function nxLocalFilesList(world) {
  world=nxLocalFilesWorld(world);const db=await nxLocalFilesOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readonly'),request=tx.objectStore('files').index('world').getAll(world);let records=[];
    request.onsuccess=()=>{records=request.result};
    tx.oncomplete=()=>resolve(nxLocalFilesSort(records.filter(record=>!record.trashedAt).map(nxLocalFilesMetadata)));
    tx.onabort=()=>reject(tx.error||new Error('Could not read device files.'));
  });
}
async function nxLocalFilesAdd(world,files) {
  world=nxLocalFilesWorld(world);files=Array.from(files||[]);
  if(!files.length)return[];
  for(const file of files)if(!file||typeof file.name!=='string'||!file.name||!Number.isFinite(file.size)||file.size<0||typeof file.slice!=='function'||typeof file.arrayBuffer!=='function')throw new Error('Choose valid files to add to the project.');
  const db=await nxLocalFilesOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),existing=store.index('world').getAll(world);let output=[],failure=null;
    existing.onsuccess=()=>{
      try{
        let order=existing.result.reduce((max,record)=>Number.isFinite(record.additionOrder)?Math.max(max,record.additionOrder):max,-1)+1;
        const addedAt=new Date().toISOString(),day=addedAt.slice(0,10);
        for(const file of files){
          const id='local-'+crypto.randomUUID(),kind=nxLocalFileKind(file),mime=file.type||'application/octet-stream';
          const modifiedAt=Number.isFinite(file.lastModified)&&file.lastModified>=0?new Date(file.lastModified).toISOString():null;
          const record={world,id,recordId:id,name:file.name,title:file.name,size:file.size,mime,kind,date:day,dateRaw:day,datePrecision:'day',dateBasis:'added',addedAt,additionOrder:order++,modifiedAt,category:nxLocalFileTopic(file.name,kind),categoryBasis:'filename',suggestedLocation:nxLocalFileLocation(file.name),locationBasis:'filename',local:true,sourceUrl:null,fileUrl:null,blob:file.slice(0,file.size,mime)};
          store.add(record);output.push(nxLocalFilesMetadata(record));
        }
      }catch(error){failure=error;tx.abort()}
    };
    tx.oncomplete=()=>{nxLocalFilesNotify(world,output.map(record=>record.id),{operation:'add'});resolve(output)};
    tx.onabort=()=>reject(failure||tx.error||new Error('Could not save files on this device.'));
  });
}
async function nxLocalFileBlob(world,id) {
  world=nxLocalFilesWorld(world);const db=await nxLocalFilesOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readonly'),request=tx.objectStore('files').get([world,String(id)]);let record=null;
    request.onsuccess=()=>{record=request.result};tx.oncomplete=()=>resolve(record&&!record.trashedAt?record.blob:null);tx.onabort=()=>reject(tx.error||new Error('Could not open the device file.'));
  });
}
async function nxLocalFilesSetTrash(world,ids,trash) {
  world=nxLocalFilesWorld(world);ids=[...new Set(Array.from(ids||[]).filter(id=>typeof id==='string'&&id))];if(!ids.length)return[];
  const db=await nxLocalFilesOpen();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readwrite'),store=tx.objectStore('files');let changed=[],failure=null;
    for(const id of ids){const request=store.get([world,id]);request.onsuccess=()=>{try{const record=request.result;if(!record||!!record.trashedAt===trash)return;const next={...record};if(trash)next.trashedAt=new Date().toISOString();else delete next.trashedAt;store.put(next);changed.push(nxLocalFilesMetadata(next))}catch(error){failure=error;tx.abort()}}};
    tx.oncomplete=()=>{if(changed.length)nxLocalFilesNotify(world,[],{operation:trash?'trash':'restore',[trash?'trashedIds':'restoredIds']:changed.map(record=>record.id)});resolve(changed)};
    tx.onabort=()=>reject(failure||tx.error||new Error('Could not update device files.'));
  });
}
function nxLocalFilesTrash(world,ids) {return nxLocalFilesSetTrash(world,ids,true)}
function nxLocalFilesRestore(world,ids) {return nxLocalFilesSetTrash(world,ids,false)}
