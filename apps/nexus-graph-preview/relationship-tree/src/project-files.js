// Existing e-SAFE source manifest, shared by the catalog and graph cards.
function nxEsafeCatalog(records) {
  const aliases={'6260847':'d-snaglist','6497142':'d-firecerts','19114712':'t-install','19126519':'t-snag','19126674':'t-fire'};
  const safeUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='zenodo.org'?url.href:null}catch{return null}};
  return records.flatMap(record=>(Array.isArray(record.files)?record.files:[]).flatMap((file,index)=>{
    if(!file||typeof file==='string'||!file.name)return [];
    const fileUrl=safeUrl(file.url),sourceUrl=safeUrl(record.url);if(!fileUrl||!sourceUrl)return [];
    return [{id:index===0&&aliases[record.id]?aliases[record.id]:'esafe-file-'+record.id+'-'+index,recordId:String(record.id),name:file.name,size:Number(file.size)||0,fileUrl,sourceUrl,title:record.title,date:record.date,dateRaw:record.dateRaw||record.date,datePrecision:record.datePrecision||'day',category:record.category,core:!!record.core,doi:record.doi,kind:/\.(mp4|webm|mov)$/i.test(file.name)?'Video':'PDF'}];
  }));
}
function nxFileSize(bytes){return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':Math.ceil(bytes/1024)+' KB'}
// datetime-local is entered and displayed in the browser's local timezone.
function nxFileLifetimeInputValue(iso) {
  if(!iso)return '';
  const date=new Date(iso);if(!Number.isFinite(date.getTime()))return '';
  const pad=value=>String(value).padStart(2,'0');
  return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes())+':'+pad(date.getSeconds());
}
function nxFileLifetimeInputIso(value) {
  const parts=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if(!parts)return null;
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  const components=[date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes(),date.getSeconds()];
  if(components.some((part,index)=>part!==Number(parts[index+1]||0)))return null;
  return date.toISOString();
}
function nxFileLifetimeDateLabel(iso) {
  const date=new Date(iso);if(!Number.isFinite(date.getTime()))return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(date);
}
function NexusFileLifetime({file,onSetDeactivation,busy,onError}) {
  const [value,setValue]=b.useState(()=>nxFileLifetimeInputValue(file.deactivateAt));
  const dateControl=b.useRef(null);
  b.useEffect(()=>setValue(nxFileLifetimeInputValue(file.deactivateAt)),[file.deactivateAt]);
  const zone=new Intl.DateTimeFormat().resolvedOptions().timeZone||'local timezone';
  const save=()=>{const iso=nxFileLifetimeInputIso(dateControl.current?.value??value);if(!iso){onError('Choose a valid local date and time for '+file.name+'.');return}onSetDeactivation(file.id,iso)};
  return s.jsxs('details',{className:'nx-file-lifetime',children:[
    s.jsx('summary',{children:'File lifetime'}),
    s.jsx('p',{children:'Deactivation moves this file to Archive. Its original file stays available.'}),
    s.jsxs('label',{children:[s.jsx('span',{children:'Date and time · '+zone+' (local)'}),s.jsx('input',{ref:dateControl,type:'datetime-local',step:1,value,disabled:busy,'aria-label':'Deactivation date and time for '+file.name,onInput:event=>setValue(event.target.value),onChange:event=>setValue(event.target.value)})]}),
    s.jsxs('div',{className:'nx-file-actions',children:[s.jsx('button',{type:'button',disabled:busy,onClick:save,children:'Set date'}),!file.archived&&s.jsx('button',{type:'button',disabled:busy,onClick:()=>onSetDeactivation(file.id,new Date().toISOString()),children:'Deactivate now'}),(file.deactivateAt||file.archived)&&s.jsx('button',{type:'button',disabled:busy,onClick:()=>onSetDeactivation(file.id,null),children:file.archived?'Reactivate':'Remove deactivation date'})]})]});
}
function NexusFileAdditionTime({file}) {
  const moment=typeof nxFileMoment==='function'?nxFileMoment(file):null;
  return moment?.basis==='Added to Nexus'?s.jsxs('p',{className:'nx-file-added-time',children:['Added to Nexus · ',s.jsx('time',{dateTime:new Date(moment.timestamp).toISOString(),children:moment.dateLabel+' '+moment.timeLabel})]}):s.jsx('p',{className:'nx-file-added-time',children:'Nexus addition time unavailable'});
}
function NexusProjectFileDetails({files,onClose,onReveal,initialFile=null,initialStatus='active',asOf=null,onSetDeactivation,onAddFiles,onRemoveFile,onRestoreFile,detailOnly=false}) {
  const [filter,setFilter]=b.useState(initialFile?'selected':'all'),[query,setQuery]=b.useState('');
  const [status,setStatus]=b.useState(()=>{const selected=files.find(file=>file.id===initialFile);return selected?(selected.archived?'archived':'active'):initialStatus==='archived'?'archived':'active'});
  const [lastRemoved,setLastRemoved]=b.useState(null),[error,setError]=b.useState(''),[message,setMessage]=b.useState(''),[busyId,setBusyId]=b.useState(null),[previewId,setPreviewId]=b.useState(null),[previewViewer,setPreviewViewer]=b.useState('google'),picker=b.useRef(null);
  const add=async e=>{const list=Array.from(e.target.files||[]);e.target.value='';if(!list.length)return;try{await onAddFiles(list);setError('');setFilter('all');setStatus('active')}catch(e){setError(e.message)}};
  const setDeadline=async(id,iso)=>{const file=files.find(file=>file.id===id);setBusyId(id);setError('');setMessage('');try{await onSetDeactivation(id,iso);setMessage(iso===null?'File reactivated. Find it in Active files.':Date.parse(iso)<=Date.now()?'File moved to Archive. The original file is retained.':'Deactivation date saved for '+(file?.name||'file')+'.');if(iso===null&&file?.archived||iso!==null&&Date.parse(iso)<=Date.now())onClose()}catch(e){setError('Could not change file lifetime: '+e.message)}finally{setBusyId(null)}};
  const closeButton=b.useRef(null),previousFocus=b.useRef(null);
  b.useEffect(()=>{previousFocus.current=document.activeElement;closeButton.current?.focus();return()=>previousFocus.current?.isConnected&&previousFocus.current.focus()},[]);
  const scoped=files.filter(file=>(!detailOnly||file.id===initialFile)&&(status==='all'||(status==='archived'?file.archived:!file.archived)));
  const shown=scoped.filter(file=>(filter==='all'||filter==='selected'&&file.id===initialFile||filter==='core'&&file.core||filter==='video'&&file.kind==='Video'||filter==='pdf'&&file.kind==='PDF')&&(!query||[file.name,file.title,file.category].join(' ').toLowerCase().includes(query.toLowerCase())));
  const previewFile=files.find(file=>file.id===previewId);
  const showPreview=id=>{setPreviewViewer('google');setPreviewId(id)};
  const keydown=e=>{if(e.key==='Escape'){e.preventDefault();if(previewId)setPreviewId(null);else onClose()}if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll('button,a,input,summary')].filter(n=>!n.disabled&&n.getClientRects().length);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  return ko.createPortal(s.jsxs('section',{id:'nexusProjectFiles','data-control':true,role:'dialog','aria-modal':'true','aria-labelledby':'nx-project-files-title',onKeyDown:keydown,children:[
    s.jsxs('header',{children:[s.jsxs('div',{children:[s.jsx('small',{children:'e-SAFE · CATANIA'}),s.jsx('h2',{id:'nx-project-files-title',children:detailOnly?'File details':'Project files · '+files.length})]}),s.jsx('button',{ref:closeButton,onClick:onClose,'aria-label':detailOnly?'Back to file explorer':'Close project files',children:detailOnly?'← Back':'×'})]}),
    asOf!==null&&s.jsx('p',{className:'nx-source-note',children:'TimeSpace snapshot · '+nxFileLifetimeDateLabel(new Date(asOf).toISOString())+' · read-only. Return to LIVE to change file dates.'}),s.jsx('p',{className:'nx-source-note',children:new Set(files.filter(f=>!f.local).map(f=>f.recordId)).size+' source records · '+files.filter(f=>f.kind==='PDF').length+' PDF · '+files.filter(f=>f.kind==='Video').length+' videos. '+files.filter(f=>f.local).length+' device files. Source links open from Zenodo; device files stay here. Dates refer to source publication or actual device addition.'}),
    !detailOnly&&s.jsxs('div',{className:'nx-file-filters','aria-label':'File status',children:[...['active','archived','all'].map(value=>s.jsx('button',{'data-file-status-filter':value,'aria-pressed':status===value,onClick:()=>{setStatus(value);setFilter('all')},children:({active:'Active '+files.filter(file=>!file.archived).length,archived:'Archive '+files.filter(file=>file.archived).length,all:'All statuses '+files.length})[value]},value))]}),
    !detailOnly&&s.jsxs('div',{className:'nx-file-filters','aria-label':'Filter project files',children:[...['all','core','pdf','video'].map(value=>s.jsx('button',{'aria-pressed':filter===value,onClick:()=>setFilter(value),children:({all:'All '+scoped.length,core:'Core pilot '+scoped.filter(f=>f.core).length,pdf:'PDF '+scoped.filter(f=>f.kind==='PDF').length,video:'Video '+scoped.filter(f=>f.kind==='Video').length})[value]},value)),s.jsxs('label',{children:[s.jsx('span',{className:'sr-only',children:'Search project files'}),s.jsx('input',{'aria-label':'Search project files',type:'search',value:query,onChange:e=>setQuery(e.target.value),placeholder:'Find a file…'})]},'search')]}),
    onAddFiles&&s.jsxs('div',{className:'nx-file-actions',children:[s.jsx('button',{onClick:()=>picker.current?.click(),children:'+ Add files'}),s.jsx('input',{ref:picker,type:'file',multiple:true,hidden:true,'aria-label':'Add files to project',onChange:add}),lastRemoved&&s.jsx('button',{onClick:async()=>{try{await onRestoreFile(lastRemoved);setLastRemoved(null)}catch(e){setError(e.message)}},children:'Undo removal'})]}),
    error&&s.jsx('p',{role:'alert',children:error}),message&&s.jsx('p',{role:'status',children:message}),
    previewFile&&typeof NexusFilePreview==='function'&&s.jsx(NexusFilePreview,{file:previewFile,world:window.__NEXUS_PROJECT_WORLD__||'esafe-demo',viewer:previewViewer,onViewerChange:setPreviewViewer,onClose:()=>setPreviewId(null)},previewFile.id),
    s.jsx('p',{className:'nx-file-result-count',role:'status',children:shown.length+' of '+files.length+' files'}),
    s.jsx('div',{className:'nx-project-file-list',children:shown.length?shown.map(file=>s.jsxs('article',{'data-file-id':file.id,'data-file-archived':file.archived?'true':'false',children:[s.jsxs('div',{className:'nx-file-name',children:[s.jsx('span',{className:'nx-file-kind',children:file.kind}),s.jsx('strong',{children:file.name})]}),s.jsx('p',{children:file.title}),s.jsx(NexusFileAdditionTime,{file}),s.jsx('small',{className:'nx-file-source-date',children:[file.category,' · ',file.local?'Device date · ':'Source publication · ',file.dateRaw||file.date,file.datePrecision==='year'?' (year only)':file.datePrecision==='month'?' (month only)':'',' · ',nxFileSize(file.size),file.core?' · CORE PILOT':'']}),
      s.jsxs('p',{className:'nx-file-lifetime-status',children:[file.archived?'Archived · ':file.deactivateAt?'Active until ':'Active · no deactivation date',file.deactivateAt?s.jsx('time',{dateTime:file.deactivateAt,children:nxFileLifetimeDateLabel(file.deactivateAt)}):file.archived?'deactivation time unavailable':'']}),
      s.jsxs('div',{className:'nx-file-actions',children:[!file.archived&&asOf===null&&s.jsx('button',{onClick:()=>onReveal(file.id),'aria-label':'Show in tree: '+file.name,children:'Show in tree'}),typeof NexusFilePreview==='function'&&s.jsx('button',{onClick:()=>showPreview(file.id),children:'Preview file'}),file.local?(!file.archived&&onRemoveFile&&s.jsx('button',{onClick:async()=>{try{await onRemoveFile(file.id);setLastRemoved(file.id);setFilter('all')}catch(e){setError(e.message)}},children:'Remove device file'})):s.jsx('a',{href:file.fileUrl,target:'_blank',rel:'noopener noreferrer',children:'Open file ↗'}),!file.local&&s.jsx('a',{href:file.sourceUrl,target:'_blank',rel:'noopener noreferrer',children:'Source ↗'})]}),
      onSetDeactivation&&s.jsx(NexusFileLifetime,{file,onSetDeactivation:setDeadline,busy:busyId!==null,onError:setError})]},file.id)):s.jsx('p',{children:'No matching files. Choose another status or All to see more files.'})})]}),document.body);
}

// The maintained shell uses Explorer; standalone legacy catalogs stay compatible.
function NexusProjectFiles(props){
 const Component=document.documentElement.dataset.nexusFileLayout==='explorer'&&typeof NexusFileExplorer==='function'?NexusFileExplorer:NexusProjectFileDetails;
 return s.jsx(Component,Object.fromEntries(Object.entries(props).filter(([key])=>key!=='key')));
}
