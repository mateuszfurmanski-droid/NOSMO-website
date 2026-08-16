(()=>{
  const indexKey='nexus.tradeFileIndex.v1';
  const MAX_FILE_BYTES=24*1024*1024;
  const MAX_TEXT=120000;
  const decoder=new TextDecoder('utf-8',{fatal:false});
  const latin1=new TextDecoder('latin1',{fatal:false});

  const tradeDefs=[
    {id:'joinery',keywords:['joinery','joiner','carpentry','carpenter','timber','wood','door frame','door frames','doorset','doorsets','ironmongery','skirting','architrave','cabinet','kitchen','second fix','hinge','hinges','door schedule']},
    {id:'fire-doors',keywords:['fire door','fire doors','fd30','fd60','fd90','fire rating','fire rated','intumescent','smoke seal','doorset','fire certificate','fire inspection','fire stopping','fire resistance']},
    {id:'electrical',keywords:['electrical','electric','cable','cables','lv','distribution board','consumer unit','rcd','mcb','eicr','electrical installation certificate','test certificate','schematic','single line diagram','containment','cable tray','trunking','lighting','socket','circuits','circuit','earthing','bonding','energisation','termination']},
    {id:'plumbing',keywords:['plumbing','plumber','pipe','pipes','pipework','water','waste','drainage','sanitary','toilet','basin','tap','valve','soil stack','hot water','cold water','pressure test']},
    {id:'hvac',keywords:['hvac','ventilation','duct','ductwork','ahu','fan coil','fcu','heating','cooling','air conditioning','mechanical ventilation','extract','supply air','return air','commissioning sheet']},
    {id:'drylining',keywords:['drylining','dry lining','plasterboard','gypsum','partition','stud wall','ceiling','mf ceiling','taping','jointing','board finish','metal stud','wall type']},
    {id:'site-management',keywords:['site management','site manager','construction manager','rams','risk assessment','method statement','programme','construction programme','logistics','permit','induction','toolbox talk','inspection plan','quality plan','qa','qaqc','site instruction','progress report']}
  ];

  const norm=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
  const extOf=file=>(file.name.split('.').pop()||'').toLowerCase();
  const fileKey=item=>`${item.name}|${item.size}|${item.lastModified}`;
  const clampText=text=>norm(text).slice(0,MAX_TEXT);

  const decodeXml=text=>{
    try{return new DOMParser().parseFromString(text,'application/xml').documentElement?.textContent||''}catch{return text.replace(/<[^>]+>/g,' ')}
  };

  async function inflate(bytes,format='deflate-raw'){
    if(typeof DecompressionStream==='undefined')throw new Error('DecompressionStream unavailable');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function findEocd(view){
    const min=Math.max(0,view.byteLength-0x10016);
    for(let i=view.byteLength-22;i>=min;i--){
      if(view.getUint32(i,true)===0x06054b50)return i;
    }
    return-1;
  }

  async function unzipEntries(file,wanted){
    if(file.size>MAX_FILE_BYTES)return new Map();
    const bytes=new Uint8Array(await file.arrayBuffer());
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const eocd=findEocd(view);
    if(eocd<0)return new Map();
    const count=view.getUint16(eocd+10,true);
    const cdOffset=view.getUint32(eocd+16,true);
    let offset=cdOffset;
    const out=new Map();
    for(let n=0;n<count&&offset+46<=view.byteLength;n++){
      if(view.getUint32(offset,true)!==0x02014b50)break;
      const method=view.getUint16(offset+10,true);
      const compSize=view.getUint32(offset+20,true);
      const nameLen=view.getUint16(offset+28,true);
      const extraLen=view.getUint16(offset+30,true);
      const commentLen=view.getUint16(offset+32,true);
      const localOffset=view.getUint32(offset+42,true);
      const name=decoder.decode(bytes.subarray(offset+46,offset+46+nameLen));
      if(wanted(name)){
        if(localOffset+30<=view.byteLength&&view.getUint32(localOffset,true)===0x04034b50){
          const localNameLen=view.getUint16(localOffset+26,true);
          const localExtraLen=view.getUint16(localOffset+28,true);
          const dataStart=localOffset+30+localNameLen+localExtraLen;
          const compressed=bytes.subarray(dataStart,dataStart+compSize);
          try{
            const data=method===0?compressed:method===8?await inflate(compressed,'deflate-raw'):null;
            if(data)out.set(name,data);
          }catch(error){console.debug('[Nexus content sort] zip entry skipped',name,error)}
        }
      }
      offset+=46+nameLen+extraLen+commentLen;
    }
    return out;
  }

  async function extractDocx(file){
    const entries=await unzipEntries(file,name=>/^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/i.test(name));
    const chunks=[];
    for(const [name,data] of entries){
      let xml=decoder.decode(data);
      xml=xml.replace(/<w:tab\b[^>]*\/>/gi,' ').replace(/<\/w:(p|tr)>/gi,'\n');
      chunks.push(name+' '+decodeXml(xml));
    }
    return clampText(chunks.join('\n'));
  }

  async function extractXlsx(file){
    const entries=await unzipEntries(file,name=>name==='xl/sharedStrings.xml'||/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)||name==='xl/workbook.xml');
    const shared=[];
    const sharedData=entries.get('xl/sharedStrings.xml');
    if(sharedData){
      const doc=new DOMParser().parseFromString(decoder.decode(sharedData),'application/xml');
      doc.querySelectorAll('si').forEach(si=>shared.push(si.textContent||''));
    }
    const chunks=[];
    const workbook=entries.get('xl/workbook.xml');
    if(workbook)chunks.push(decodeXml(decoder.decode(workbook)));
    for(const [name,data] of entries){
      if(!/^xl\/worksheets\/sheet\d+\.xml$/i.test(name))continue;
      const doc=new DOMParser().parseFromString(decoder.decode(data),'application/xml');
      const values=[];
      doc.querySelectorAll('c').forEach(cell=>{
        const type=cell.getAttribute('t')||'';
        const value=cell.querySelector('v')?.textContent||cell.textContent||'';
        if(type==='s'&&/^\d+$/.test(value))values.push(shared[Number(value)]||'');
        else values.push(value);
      });
      chunks.push(name+' '+values.join(' '));
      if(chunks.join(' ').length>MAX_TEXT)break;
    }
    return clampText(chunks.join('\n'));
  }

  function decodePdfLiteral(input){
    return input
      .replace(/\\([nrtbf()\\])/g,(m,ch)=>({n:'\n',r:'\r',t:'\t',b:' ',f:' ', '(':'(',')':')','\\':'\\'}[ch]||ch))
      .replace(/\\([0-7]{1,3})/g,(m,oct)=>String.fromCharCode(parseInt(oct,8)))
      .replace(/\\\r?\n/g,'');
  }

  function pdfTextOperators(source){
    const chunks=[];
    const literal=/\(((?:\\.|[^\\)])*)\)\s*Tj/g;
    let m;
    while((m=literal.exec(source))&&chunks.join(' ').length<MAX_TEXT)chunks.push(decodePdfLiteral(m[1]));
    const arrays=/\[((?:.|\n|\r)*?)\]\s*TJ/g;
    while((m=arrays.exec(source))&&chunks.join(' ').length<MAX_TEXT){
      const part=m[1];
      const inner=/\(((?:\\.|[^\\)])*)\)/g;
      let x;while((x=inner.exec(part)))chunks.push(decodePdfLiteral(x[1]));
    }
    const simpleAscii=source.match(/[A-Za-z][A-Za-z0-9\-_/.,:;() ]{12,}/g)||[];
    chunks.push(...simpleAscii.slice(0,800));
    return chunks.join(' ');
  }

  async function extractPdf(file){
    if(file.size>MAX_FILE_BYTES)return'';
    const bytes=new Uint8Array(await file.arrayBuffer());
    const raw=latin1.decode(bytes);
    const chunks=[pdfTextOperators(raw)];
    let pos=0,streams=0;
    while(streams<80){
      const streamAt=raw.indexOf('stream',pos);
      if(streamAt<0)break;
      const dictStart=raw.lastIndexOf('<<',streamAt);
      const dictEnd=raw.lastIndexOf('>>',streamAt);
      const endAt=raw.indexOf('endstream',streamAt+6);
      if(endAt<0)break;
      pos=endAt+9;
      const dict=dictStart>=0&&dictEnd>dictStart?raw.slice(dictStart,dictEnd+2):'';
      if(!/FlateDecode/.test(dict))continue;
      let dataStart=streamAt+6;
      if(raw[dataStart]==='\r'&&raw[dataStart+1]==='\n')dataStart+=2;
      else if(raw[dataStart]==='\r'||raw[dataStart]==='\n')dataStart+=1;
      let dataEnd=endAt;
      while(dataEnd>dataStart&&(raw[dataEnd-1]==='\r'||raw[dataEnd-1]==='\n'))dataEnd--;
      try{
        const inflated=await inflate(bytes.subarray(dataStart,dataEnd),'deflate');
        chunks.push(pdfTextOperators(latin1.decode(inflated)));
        streams++;
        if(chunks.join(' ').length>MAX_TEXT)break;
      }catch{}
    }
    return clampText(chunks.join(' '));
  }

  async function extractRichText(file){
    const ext=extOf(file);
    try{
      if(ext==='docx')return{format:'DOCX',text:await extractDocx(file)};
      if(ext==='xlsx'||ext==='xlsm')return{format:'XLSX',text:await extractXlsx(file)};
      if(ext==='pdf')return{format:'PDF',text:await extractPdf(file)};
    }catch(error){console.debug('[Nexus content sort] extraction failed',file.name,error)}
    return{format:ext.toUpperCase()||'FILE',text:''};
  }

  function countHits(haystack,keyword){
    if(!haystack||!keyword)return 0;
    let count=0,start=0;
    while(count<12){
      const at=haystack.indexOf(keyword,start);
      if(at<0)break;
      count++;start=at+keyword.length;
    }
    return count;
  }

  function classify(name,text){
    const hay=norm(`${name.replace(/[_.\-]+/g,' ')} ${text}`);
    const scored=tradeDefs.map(trade=>{
      let score=0;
      for(const keyword of trade.keywords){
        const k=norm(keyword);
        score+=countHits(norm(name),k)*5;
        score+=countHits(text,k)*1.35;
      }
      if(trade.id==='electrical'&&/\b(eicr|rcd|mcb|distribution board|cable schedule|single line|electrical installation|earth continuity|insulation resistance)\b/.test(hay))score+=14;
      if(trade.id==='fire-doors'&&/\b(fd30|fd60|intumescent|smoke seal|fire resistance|fire door)\b/.test(hay))score+=14;
      if(trade.id==='hvac'&&/\b(ahu|fcu|ductwork|air volume|ventilation|commissioning sheet)\b/.test(hay))score+=12;
      if(trade.id==='plumbing'&&/\b(pressure test|soil stack|sanitary|pipework|hot water|cold water)\b/.test(hay))score+=12;
      return{id:trade.id,score};
    }).sort((a,b)=>b.score-a.score);
    const best=scored[0]||{id:'site-management',score:0};
    const second=scored[1]?.score||0;
    const total=scored.reduce((sum,item)=>sum+item.score,0);
    const confidence=best.score<=0?.30:Math.max(.50,Math.min(.99,(best.score+(best.score-second)*.8)/(Math.max(1,total)+best.score*.65)));
    const threshold=Math.max(4,best.score*.54);
    let matches=scored.filter(item=>item.score>=threshold&&item.score>0).slice(0,3).map(item=>item.id);
    if(!matches.length)matches=['site-management'];
    return{primaryTrade:matches[0],trades:matches,confidence};
  }

  function loadIndex(){
    try{const parsed=JSON.parse(localStorage.getItem(indexKey)||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}
  }

  function saveIndex(index){
    try{localStorage.setItem(indexKey,JSON.stringify(index.slice(-250)))}catch{}
    window.__NEXUS_TRADE_FILE_INDEX__=index;
  }

  function tradeLabel(id){
    const known=window.NexusTrades?.trades?.find?.(trade=>trade.id===id);
    return known?.label||id;
  }

  function renderFromStorage(){
    const index=loadIndex();
    const active=document.documentElement.dataset.nexusTrade||'all';
    document.querySelectorAll('.nexus-trade-button[data-trade]').forEach(button=>{
      const id=button.dataset.trade;
      const count=id==='all'?index.length:index.filter(file=>file.trades?.includes(id)).length;
      const small=button.querySelector('.nexus-trade-copy small');
      if(small)small.textContent=`${count} classified file${count===1?'':'s'}`;
    });
    const list=document.getElementById('nexusTradeFileList');
    if(!list)return;
    const files=(active==='all'?index:index.filter(file=>file.trades?.includes(active))).slice().reverse().slice(0,30);
    list.innerHTML='';
    if(!files.length){
      const empty=document.createElement('div');
      empty.className='nexus-trade-empty';
      empty.textContent='No classified files in this trade yet.';
      list.appendChild(empty);
      return;
    }
    files.forEach(file=>{
      const row=document.createElement('div');
      row.className='nexus-trade-file';
      row.title=`${file.name} · ${file.method||'classifier'}`;
      const source=file.contentFormat?` · ${file.contentFormat}`:'';
      row.innerHTML=`<span>${file.name}</span><b>${tradeLabel(file.primaryTrade)} · ${Math.round((file.confidence||0)*100)}%${source}</b>`;
      list.appendChild(row);
    });
  }

  async function enrich(files){
    const supported=files.filter(file=>['pdf','docx','xlsx','xlsm'].includes(extOf(file)));
    if(!supported.length)return[];
    const status=document.getElementById('nexusTradeAiStatus');
    if(status)status.textContent='READING';
    const enriched=[];
    for(const file of supported){
      const extracted=await extractRichText(file);
      if(!extracted.text)continue;
      const classified=classify(file.name,extracted.text);
      let index=loadIndex();
      const key=`${file.name}|${file.size}|${file.lastModified||0}`;
      const existing=index.find(item=>fileKey(item)===key);
      const record={
        ...(existing||{}),
        name:file.name,size:file.size,type:file.type||'',lastModified:file.lastModified||0,
        primaryTrade:classified.primaryTrade,trades:classified.trades,
        confidence:Math.max(classified.confidence,existing?.confidence||0),
        method:'nexus-content-trade-classifier-v2',
        contentFormat:extracted.format,
        extractedTextChars:extracted.text.length,
        classifiedAt:new Date().toISOString()
      };
      index=index.filter(item=>fileKey(item)!==key);
      index.push(record);
      saveIndex(index);
      enriched.push(record);
      renderFromStorage();
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(status)status.textContent='READY';
    if(enriched.length){
      const selection=document.getElementById('nexusFileSelection');
      if(selection)selection.textContent=`${enriched.length} document${enriched.length===1?'':'s'} read by content — PDF/XLSX/DOCX trade classification updated`;
      window.dispatchEvent(new CustomEvent('nexus:files-trade-enriched',{detail:{files:enriched,source:'content-v2'}}));
    }
    renderFromStorage();
    return enriched;
  }

  window.addEventListener('nexus:file-upload-request',event=>{
    const files=Array.from(event.detail?.files||[]);
    if(files.length)setTimeout(()=>enrich(files),0);
  });
  window.addEventListener('nexus:trade-change',()=>setTimeout(renderFromStorage,0));
  window.addEventListener('nexus:files-trade-classified',()=>setTimeout(renderFromStorage,80));
  window.NexusTradeContentAI={extractRichText,enrich,render:renderFromStorage};
})();
