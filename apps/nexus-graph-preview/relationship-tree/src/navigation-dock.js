// One React-owned navigation row. Shell panels and project storage are reused.
const nxDockPanelSelector='.nexus-shell-panel.open,.nexus-project-switcher.open,.nexus-people-panel.open,#nexusSoftwarePanel.open,#nexusIntegrationsPanel.open,#nexusCloudPanel.open';
function nxDockClosePanels(){
  document.querySelectorAll(nxDockPanelSelector).forEach(panel=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true')});
  document.getElementById('nexusShellScrim')?.classList.remove('open');
}
function nxDockOpenPanel(id){
  const panel=document.getElementById(id);if(!panel)return false;
  nxDockSignal('nexus:navigation-panel-opening');
  const wasOpen=panel.classList.contains('open');nxDockClosePanels();if(wasOpen)return true;
  panel.classList.add('open');panel.setAttribute('aria-hidden','false');
  document.getElementById('nexusShellScrim')?.classList.add('open');
  panel.querySelector('button,a,input,select')?.focus();return true;
}
function nxDockSignal(name,detail={}){window.dispatchEvent(new CustomEvent(name,{detail}))}
function NxDockIcon({kind}){
  const paths={time:'M12 7v5l3 2',files:'M3 6h6l2 2h10v12H3z',cloud:'M7 18h11a4 4 0 0 0 0-8 6 6 0 0 0-11-1 4.5 4.5 0 0 0 0 9',soft:'M3 7h18M3 17h18M8 4v6M16 14v6',integrations:'M4 4h6v6H4zM14 4h6v6h-6zM9 15h6v6H9zM10 7h4M7 10l3 5M17 10l-3 5',system:'M4 6h16M4 12h16M4 18h16',project:'M3 21V6l9-3 9 3v15M8 9h1m6 0h1M8 13h1m6 0h1M9 21v-4h6v4',people:'M16 21v-3a4 4 0 0 0-8 0v3M16 10a4 4 0 1 0-8 0 4 4 0 0 0 8 0M21 20v-2a4 4 0 0 0-3-4M3 20v-2a4 4 0 0 1 3-4',tasks:'M9 5h11v16H4V5h2M8 3h8v4H8zM8 12l2 2 5-5',tools:'M14 4a6 6 0 0 0-7 7l-5 6 5 5 6-6a6 6 0 0 0 7-7l-4 4-4-4z',trades:'M4 13v-2a8 8 0 0 1 16 0v2M2 14h20v5H2zM9 4v7m6-7v7'};
  return s.jsxs('svg',{width:26,height:26,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true,children:[kind==='time'&&s.jsx('circle',{cx:12,cy:12,r:9}),s.jsx('path',{d:paths[kind]||paths.system})]});
}
function NexusDockAssistant({world,onClose,onAction}){
  const [query,setQuery]=b.useState(''),[files,setFiles]=b.useState([]),[error,setError]=b.useState(''),[loading,setLoading]=b.useState(true);
  b.useEffect(()=>{let live=true;const sources=world==='esafe-demo'?nxEsafeCatalog(window.ESAFE_RECORDS||[]):ns.filter(node=>node.type==='document').map(node=>({...node,name:node.label}));
    const load=async()=>{try{const local=world==='esafe-demo'?await nxLocalFilesList(world):[];if(live){setFiles([...sources,...local]);setError('')}}catch{if(live){setFiles(sources);setError('Device files could not be read. Source files are still searchable.')}}finally{if(live)setLoading(false)}};
    load();const changed=event=>{if(event.detail?.world===world)load()};window.addEventListener('nexus:local-files-updated',changed);return()=>{live=false;window.removeEventListener('nexus:local-files-updated',changed)};
  },[world]);
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean),matches=terms.length?files.filter(file=>terms.every(term=>(file.name+' '+(file.category||'')+' '+(file.title||'')).toLowerCase().includes(term))):[];
  return s.jsxs('div',{className:'nx-dock-assistant',children:[s.jsx('p',{children:'Find a project file or open a workspace tool.'}),s.jsxs('label',{children:[s.jsx('span',{children:'Search this project'}),s.jsx('input',{type:'search',value:query,onChange:e=>setQuery(e.target.value),'aria-label':'Ask Nexus: search project files',placeholder:'Filename, topic or document title',autoFocus:true})]}),error&&s.jsx('p',{role:'alert',children:error}),s.jsx('p',{role:'status',children:loading?'Reading project files…':terms.length?matches.length+' matching files':files.length+' project files available'}),
    s.jsx('div',{className:'nx-dock-search-results',children:matches.slice(0,30).map(file=>s.jsxs('button',{type:'button',onClick:()=>{onClose();nxDockSignal('nexus:navigation-reveal-file',{world,fileId:file.id})},children:[s.jsx(NxDockIcon,{kind:'files'}),s.jsx('span',{children:file.name})]},file.id))}),
    s.jsxs('div',{className:'nx-dock-folder-grid',children:[s.jsx('button',{onClick:()=>onAction('project-files'),children:'Project files'}),s.jsx('button',{onClick:()=>onAction('time'),children:'TimeSpace'}),s.jsx('button',{onClick:()=>onAction('system'),children:'System'})]})]});
}
function cU({selected,selectedLinks,onOpenWorkflow}){
  const world=window.__NEXUS_PROJECT_WORLD__||'dev',key='nosmo.unified-dock:v1:'+world;
  const [folder,setFolder]=b.useState(null),[anchor,setAnchor]=b.useState(8),[notice,setNotice]=b.useState(''),[overflow,setOverflow]=b.useState({left:false,right:false});
  const [profile,setProfile]=b.useState(()=>{try{const value=new URLSearchParams(window.location.search).get('accessProfile')||localStorage.getItem(Dw);return Aw(value)?value:'manager'}catch{return'manager'}});
  const visibleApps=b.useMemo(()=>new Set(YB(KB[profile],oU).visibleApps),[profile]);
  const row=b.useRef(null),popup=b.useRef(null),origin=b.useRef(null),ready=b.useRef(false);
  const visible=id=>{const app=aU[id==='files'?'documents':id];return !app||visibleApps.has(app)};
  const tiles=[['ask','Ask Nexus'],['project','Project'],['files','Files'],['time','TimeSpace'],['people','People'],['tasks','Tasks'],['soft','SOFT'],['integrations','INT.'],['trades','Trades'],['tools','Tools'],['system','System']].filter(([id])=>visible(id));
  const syncScroll=()=>{const el=row.current;if(!el)return;setOverflow({left:el.scrollLeft>2,right:el.scrollLeft+el.clientWidth<el.scrollWidth-2})};
  b.useEffect(()=>{const el=row.current;if(!el)return;try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(Number.isFinite(saved.scrollLeft))el.scrollLeft=saved.scrollLeft}catch{}ready.current=true;syncScroll();window.addEventListener('resize',syncScroll);return()=>window.removeEventListener('resize',syncScroll)},[key]);
  const close=()=>{setFolder(null);origin.current?.isConnected&&origin.current.focus()};
  b.useEffect(()=>{if(!folder)return;popup.current?.querySelector('input,button,a')?.focus();const outside=e=>{if(!popup.current?.contains(e.target)&&!row.current?.contains(e.target))setFolder(null)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[folder]);
  b.useEffect(()=>{const closeShell=e=>{const escape=e.type==='keydown'&&e.key==='Escape',control=e.target.closest?.('[data-nexus-close-panel],.nx-cloud-close,.nx-int-close,.nx-soft-close,.nexus-people-close,#nexusShellScrim');if(escape||control){nxDockClosePanels();if(escape)setFolder(null);origin.current?.isConnected&&origin.current.focus()}};document.addEventListener('keydown',closeShell);document.addEventListener('click',closeShell);return()=>{document.removeEventListener('keydown',closeShell);document.removeEventListener('click',closeShell)}},[]);
  const openPanel=id=>{setFolder(null);if(!nxDockOpenPanel(id))setNotice('This panel is still loading. Please try again.')};
  const action=id=>{
    setNotice('');
    if(id==='project-files'){setFolder(null);nxDockClosePanels();if(world==='esafe-demo')nxDockSignal('nexus:open-project-files');else openPanel('nexusFilesPanel');return}
    if(id==='time'){setFolder(null);nxDockClosePanels();if(world==='esafe-demo')nxDockSignal('nexus:open-timespace');else document.getElementById('nexusTopTime')?.click();return}
    if(id==='cloud')return openPanel('nexusCloudPanel');
    if(id==='project')return openPanel('nexusProjectSwitcher');
    if(id==='system')return openPanel('nexusMenuPanel');
    if(id==='soft')return openPanel('nexusSoftwarePanel');
    if(id==='integrations')return openPanel('nexusIntegrationsPanel');
    if(id==='people'){setFolder(null);nxDockClosePanels();document.querySelector('[data-nexus-action="people"]')?.click();return}
    if(id==='trades')return openPanel('nexusTradesPanel');
    if(id==='tasks'){setFolder(null);nxDockClosePanels();const node=[...document.querySelectorAll('[data-node-id]>button')].find(button=>button.getAttribute('aria-label')?.startsWith('task:'));if(node)node.click();else setNotice('No tasks are visible in this project.');return}
  };
  const activate=(id,event)=>{origin.current=event.currentTarget;if(['files','tools','ask'].includes(id)){nxDockSignal('nexus:navigation-panel-opening');nxDockClosePanels();setAnchor(Math.max(8,Math.min(event.currentTarget.getBoundingClientRect().left,window.innerWidth-320)));setFolder(value=>value===id?null:id)}else action(id)};
  const scroll=direction=>{const el=row.current;if(el)el.scrollBy({left:direction*Math.max(160,el.clientWidth*.65),behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
  const toolItems=(jk.find(item=>item.id==='tools')?.items||[]).filter(item=>!item.accessApp||visibleApps.has(item.accessApp));
  const popupKeys=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}if(e.key==='Tab'){const nodes=[...popup.current.querySelectorAll('button:not(:disabled),a,input,select')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
  return s.jsxs(s.Fragment,{children:[
    s.jsxs('nav',{'data-control':true,'data-nexus-unified-dock':true,'aria-label':'Nexus folder dock',className:'nx-unified-dock',children:[
      s.jsx('button',{className:'nx-dock-scroll nx-dock-scroll-left',type:'button','aria-label':'Scroll navigation left',disabled:!overflow.left,onClick:()=>scroll(-1),children:'‹'}),
      s.jsx('div',{ref:row,id:'nexusUnifiedDockRow',className:'nx-unified-dock-row','aria-label':'Workspace tools',tabIndex:0,onScroll:()=>{syncScroll();setFolder(null);if(ready.current)try{localStorage.setItem(key,JSON.stringify({scrollLeft:row.current.scrollLeft}))}catch{}},children:tiles.map(([id,label])=>s.jsxs('button',{type:'button','data-nx-nav':id,'aria-label':label,'aria-expanded':['files','tools','ask'].includes(id)?folder===id:undefined,'aria-controls':['files','tools','ask'].includes(id)?'nexusDockFolder':undefined,onClick:event=>activate(id,event),className:'nx-dock-tile'+(folder===id?' nx-dock-tile-active':''),children:[id==='ask'?s.jsx('img',{src:'/apps/nexus-graph-preview/relationship-tree/nexus-brain-n.svg',alt:'Nexus brain and N',className:'nx-dock-brand'}):s.jsx(NxDockIcon,{kind:id}),s.jsx('span',{children:label}),['files','tools'].includes(id)&&s.jsx('small',{'aria-hidden':true,children:'⌃'})]},id))}),
      s.jsx('button',{className:'nx-dock-scroll nx-dock-scroll-right',type:'button','aria-label':'Scroll navigation right',disabled:!overflow.right,onClick:()=>scroll(1),children:'›'})]}),
    notice&&s.jsxs('div',{className:'nx-dock-notice',role:'status',children:[notice,s.jsx('button',{onClick:()=>setNotice(''),'aria-label':'Dismiss navigation message',children:'×'})]}),
    folder&&ko.createPortal(s.jsxs('section',{id:'nexusDockFolder',ref:popup,role:'dialog','aria-label':folder==='ask'?'Ask Nexus':folder==='files'?'Files and cloud':'Project tools',className:'nx-dock-folder',style:{left:anchor},onKeyDown:popupKeys,children:[s.jsxs('header',{children:[s.jsx('strong',{children:folder==='ask'?'Ask Nexus':folder==='files'?'Files':'Tools'}),s.jsx('button',{type:'button',onClick:close,'aria-label':'Close navigation folder',children:'×'})]}),
      folder==='files'&&s.jsxs('div',{className:'nx-dock-folder-grid',children:[s.jsxs('button',{onClick:()=>action('project-files'),children:[s.jsx(NxDockIcon,{kind:'files'}),s.jsx('span',{children:'Project files'})]}),s.jsxs('button',{onClick:()=>action('cloud'),children:[s.jsx(NxDockIcon,{kind:'cloud'}),s.jsx('span',{children:'Cloud sources'})]})]}),
      folder==='tools'&&s.jsx('div',{className:'nx-dock-folder-grid',children:toolItems.map(item=>item.href&&item.status!=='disconnected'?s.jsx('a',{href:item.href,children:item.label},item.label):s.jsx('button',{disabled:true,title:item.label+' — not connected',children:item.label+' · not connected'},item.label))}),
      folder==='ask'&&s.jsx(NexusDockAssistant,{world,onClose:close,onAction:action})]}),document.body),
    document.getElementById('nexusSystemAccessProfile')&&ko.createPortal(s.jsxs('label',{className:'nx-system-access-profile',children:[s.jsx('span',{children:'Demo access profile'}),s.jsx('select',{'aria-label':'Access test profile',value:profile,onChange:e=>{const value=e.target.value;if(!Aw(value))return;setProfile(value);try{localStorage.setItem(Dw,value)}catch{}},children:['manager','joiner','electrician'].map(value=>s.jsx('option',{value,children:value},value))})]}),document.getElementById('nexusSystemAccessProfile'))
  ]});
}
