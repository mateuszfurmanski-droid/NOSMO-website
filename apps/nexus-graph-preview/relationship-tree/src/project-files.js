// Existing e-SAFE source manifest, shared by the catalog and graph cards.
function nxEsafeCatalog(records) {
  const aliases={'6260847':'d-snaglist','6497142':'d-firecerts','19114712':'t-install','19126519':'t-snag','19126674':'t-fire'};
  const safeUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='zenodo.org'?url.href:null}catch{return null}};
  return records.flatMap(record=>(Array.isArray(record.files)?record.files:[]).flatMap((file,index)=>{
    if(!file||typeof file==='string'||!file.name)return [];
    const fileUrl=safeUrl(file.url),sourceUrl=safeUrl(record.url);if(!fileUrl||!sourceUrl)return [];
    return [{id:index===0&&aliases[record.id]?aliases[record.id]:'esafe-file-'+record.id+'-'+index,recordId:String(record.id),name:file.name,size:Number(file.size)||0,fileUrl,sourceUrl,title:record.title,date:record.date,category:record.category,core:!!record.core,doi:record.doi,kind:/\.(mp4|webm|mov)$/i.test(file.name)?'Video':'PDF'}];
  }));
}
function nxFileSize(bytes){return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':Math.ceil(bytes/1024)+' KB'}
function NexusProjectFiles({files,onClose,onReveal,initialFile=null}) {
  const [filter,setFilter]=b.useState(initialFile?'selected':'all'),[query,setQuery]=b.useState('');
  const closeButton=b.useRef(null),previousFocus=b.useRef(null);
  b.useEffect(()=>{previousFocus.current=document.activeElement;closeButton.current?.focus();return()=>previousFocus.current?.isConnected&&previousFocus.current.focus()},[]);
  const shown=files.filter(file=>(filter==='all'||filter==='selected'&&file.id===initialFile||filter==='core'&&file.core||filter==='video'&&file.kind==='Video'||filter==='pdf'&&file.kind==='PDF')&&(!query||[file.name,file.title,file.category].join(' ').toLowerCase().includes(query.toLowerCase())));
  const keydown=e=>{if(e.key==='Escape'){e.preventDefault();onClose()}if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll('button,a,input')].filter(n=>!n.disabled&&n.getClientRects().length);if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
  return ko.createPortal(s.jsxs('section',{id:'nexusProjectFiles','data-control':true,role:'dialog','aria-modal':'true','aria-labelledby':'nx-project-files-title',onKeyDown:keydown,children:[
    s.jsxs('header',{children:[s.jsxs('div',{children:[s.jsx('small',{children:'e-SAFE · CATANIA'}),s.jsx('h2',{id:'nx-project-files-title',children:'Project files · '+files.length})]}),s.jsx('button',{ref:closeButton,onClick:onClose,'aria-label':'Close project files',children:'×'})]}),
    s.jsx('p',{className:'nx-source-note',children:new Set(files.map(f=>f.recordId)).size+' source records · '+files.filter(f=>f.kind==='PDF').length+' PDF · '+files.filter(f=>f.kind==='Video').length+' videos. Files open from Zenodo; this catalog stores their names and links. Dates refer to source publication.'}),
    s.jsxs('div',{className:'nx-file-filters','aria-label':'Filter project files',children:[...['all','core','pdf','video'].map(value=>s.jsx('button',{'aria-pressed':filter===value,onClick:()=>setFilter(value),children:({all:'All '+files.length,core:'Core pilot '+files.filter(f=>f.core).length,pdf:'PDF '+files.filter(f=>f.kind==='PDF').length,video:'Video '+files.filter(f=>f.kind==='Video').length})[value]},value)),s.jsxs('label',{children:[s.jsx('span',{className:'sr-only',children:'Search project files'}),s.jsx('input',{'aria-label':'Search project files',type:'search',value:query,onChange:e=>setQuery(e.target.value),placeholder:'Find a file…'})]},'search')]}),
    s.jsx('p',{className:'nx-file-result-count',role:'status',children:shown.length+' of '+files.length+' files'}),
    s.jsx('div',{className:'nx-project-file-list',children:shown.length?shown.map(file=>s.jsxs('article',{'data-file-id':file.id,children:[s.jsxs('div',{className:'nx-file-name',children:[s.jsx('span',{className:'nx-file-kind',children:file.kind}),s.jsx('strong',{children:file.name})]}),s.jsx('p',{children:file.title}),s.jsx('small',{children:[file.category,' · ',file.date,' · ',nxFileSize(file.size),file.core?' · CORE PILOT':'']}),s.jsxs('div',{className:'nx-file-actions',children:[s.jsx('button',{onClick:()=>onReveal(file.id),'aria-label':'Show in tree: '+file.name,children:'Show in tree'}),s.jsx('a',{href:file.fileUrl,target:'_blank',rel:'noopener noreferrer',children:'Open file ↗'}),s.jsx('a',{href:file.sourceUrl,target:'_blank',rel:'noopener noreferrer',children:'Source ↗'})]})]},file.id)):s.jsx('p',{children:'No matching files. Choose All to see the full catalog.'})})]}),document.body);
}
