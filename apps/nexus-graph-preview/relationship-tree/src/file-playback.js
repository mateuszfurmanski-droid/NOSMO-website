// Individual-file playback. Source publication dates never become invented Nexus import times.
function nxFilePlaybackDay(raw) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
  const timestamp=Date.parse(raw+'T00:00:00Z');
  return Number.isFinite(timestamp)&&new Date(timestamp).toISOString().slice(0,10)===raw?timestamp:null;
}
function nxFilePlaybackAddedAt(value) {
  if(typeof value!=='string')return null;
  const match=value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/i);
  if(!match||nxFilePlaybackDay(match[1])===null||Number(match[2])>23||Number(match[3])>59||Number(match[4]||0)>59)return null;
  const timestamp=Date.parse(value);
  return Number.isFinite(timestamp)?timestamp:null;
}
function nxFileMoment(file) {
  const addedAt=nxFilePlaybackAddedAt(file?.addedAt);
  if(addedAt!==null){
    const iso=new Date(addedAt).toISOString();
    return {dateLabel:iso.slice(0,10),timeLabel:iso.slice(11,19)+' UTC',basis:'Added to Nexus',precision:'second',timestamp:addedAt};
  }
  const raw=String(file?.dateRaw||file?.date||'').trim();
  const precision=file?.datePrecision||(raw.length===4?'year':raw.length===7?'month':'day');
  const basis='Source publication · addition time unknown';
  if(precision==='year'&&/^\d{4}(?:$|-)/.test(raw)){
    const year=raw.slice(0,4),timestamp=nxFilePlaybackDay(year+'-01-01');
    if(timestamp!==null)return {dateLabel:year+' (year only)',timeLabel:'--:--',basis,precision:'year',timestamp};
  }
  if(precision==='month'&&/^\d{4}-\d{2}(?:$|-)/.test(raw)){
    const month=raw.slice(0,7),timestamp=nxFilePlaybackDay(month+'-01');
    if(timestamp!==null)return {dateLabel:month+' (month only)',timeLabel:'--:--',basis,precision:'month',timestamp};
  }
  const timestamp=nxFilePlaybackDay(raw);
  if(timestamp!==null)return {dateLabel:raw,timeLabel:'--:--',basis,precision:'day',timestamp};
  return {dateLabel:'Date not available',timeLabel:'--:--',basis,precision:'unknown',timestamp:null};
}
function nxTimeSpaceSequence(files) {
  return (Array.isArray(files)?files:[]).filter(file=>file&&typeof file==='object').map((file,index)=>({file,index,moment:nxFileMoment(file)}))
    .sort((a,b)=>{
      const aTime=a.moment.timestamp,bTime=b.moment.timestamp;
      if(aTime===null&&bTime!==null)return 1;
      if(bTime===null&&aTime!==null)return -1;
      return (aTime===null?0:aTime-bTime)||(a.file.addedAt&&b.file.addedAt?(Number(a.file.additionOrder)||0)-(Number(b.file.additionOrder)||0):0)||String(a.file.recordId??'').localeCompare(String(b.file.recordId??''),'en',{numeric:true})||a.index-b.index;
    }).map(entry=>entry.file);
}
function nxGooglePreviewUrl(file) {
  if(!file||typeof file!=='object'||file.local||file.private===true||file.isPublic===false||file.public===false||file.visibility==='private'||file.access==='private')return null;
  const name=String(file.name||file.originalName||''),kind=String(file.kind||'').toLowerCase(),mime=String(file.mimeType||file.type||'').toLowerCase();
  if(/^(video|image)/.test(mime)||/^(video|image|photo)$/.test(kind)||/\.(?:mp4|webm|mov|m4v|avi|mkv|png|jpe?g|gif|webp|svg|avif|bmp|tiff?)$/i.test(name))return null;
  const supported=/\.(?:pdf|docx?|odt|rtf|xlsx?|xlsm|ods|csv)$/i.test(name)||/^(pdf|document|spreadsheet)$/.test(kind)||/^(?:application\/(?:pdf|msword|vnd\.(?:ms-excel|openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet)|oasis\.opendocument\.(?:text|spreadsheet)))|text\/csv)$/.test(mime);
  if(!supported)return null;
  // This explicit field is supplied by a Drive connector; Zenodo record IDs are never Drive IDs.
  const driveId=typeof file.driveFileId==='string'?file.driveFileId:'';
  if(/^(?=.*[A-Za-z_-])[A-Za-z0-9_-]{20,200}$/.test(driveId))return 'https://drive.google.com/file/d/'+encodeURIComponent(driveId)+'/preview';
  try{
    const url=new URL(file.fileUrl||file.url||'');
    if(url.protocol!=='https:'||url.hostname!=='zenodo.org'||url.port||url.username||url.password)return null;
    // Public Zenodo links may use ?download=1; credentials or signed/private URLs are not forwarded.
    if([...url.searchParams.keys()].some(key=>key!=='download'))return null;
    url.hash='';
    return 'https://docs.google.com/gview?embedded=true&url='+encodeURIComponent(url.href);
  }catch{return null}
}
// Slider and Play follow actual expiry and recorded changes; file arrows still step files.
function nxTimeSpaceCheckpoints(files,history) {
  const points=nxTimeSpaceSequence(files).map((file,index)=>({key:'file:'+file.id,kind:'file',fileId:file.id,at:nxFileMoment(file).timestamp,order:index}));
  for(const file of files){
    const events=Array.isArray(file.lifecycleEvents)?file.lifecycleEvents:[];
    if(!events.length){const at=nxFilePlaybackAddedAt(file.deactivateAt);if(at!==null)points.push({key:'deactivation:'+file.id,kind:'deactivation',fileId:file.id,at,order:points.length});continue}
    for(const [index,event] of events.entries()){
      const recorded=nxFilePlaybackAddedAt(event.at),deadline=nxFilePlaybackAddedAt(event.deactivateAt),previous=events[index-1],priorDeadline=nxFilePlaybackAddedAt(previous?.deactivateAt);
      if(recorded===null)continue;
      if(priorDeadline!==null&&priorDeadline<=recorded&&(deadline===null||deadline>recorded))points.push({key:'reactivation:'+file.id+':'+index,kind:'reactivation',fileId:file.id,at:recorded,order:points.length});
      if(deadline===null)continue;
      const at=Math.max(recorded,deadline),nextChange=nxFilePlaybackAddedAt(events[index+1]?.at);
      if(nextChange!==null&&nextChange<=at)continue;
      points.push({key:'deactivation:'+file.id+':'+index,kind:'deactivation',fileId:file.id,at,order:points.length});
    }
  }
  const changes=[...(history?.baseline?.groups?.length?[{...history.baseline,baseline:true}]:[]),...(history?.events||[])];
  const fileIds=new Set(files.map(file=>file.id)),groupMap=groups=>new Map((Array.isArray(groups)?groups:[]).filter(group=>typeof group?.id==='string').map(group=>[group.id,[...new Set(Array.isArray(group.members)?group.members:[])].filter(id=>typeof id==='string')]));
  let previousGroups=new Map();
  for(const [index,event] of changes.entries()){
    const at=nxFilePlaybackAddedAt(event.at);if(at===null)continue;
    const groups=groupMap(event.groups),membership=members=>members?JSON.stringify([...members].sort()):null;
    const changed=[...new Set([...groups.keys(),...previousGroups.keys()])].filter(id=>membership(groups.get(id))!==membership(previousGroups.get(id)));
    const affected=[...new Set(changed.flatMap(id=>[...(groups.get(id)||[]),...(previousGroups.get(id)||[])]))];
    const fileId=affected.find(id=>fileIds.has(id)),focusId=fileId||changed.find(id=>groups.has(id))||affected[0];
    points.push({key:'connections:'+index+':'+event.at,kind:'connections',fileId,focusId,at,baseline:!!event.baseline,order:points.length});
    previousGroups=groups;
  }
  return points.sort((a,b)=>(a.at??Infinity)-(b.at??Infinity)||a.order-b.order);
}
