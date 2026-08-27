// NEXUS_CORE_BROWSER_BRIDGE_ADDON_059_V1
// Thin browser transport only. Canonical authority/persistence remains in Nexus Core.
(()=>{
  if(window.__NEXUS_CORE_BROWSER_BRIDGE_ADDON_059__)return;
  window.__NEXUS_CORE_BROWSER_BRIDGE_ADDON_059__=true;
  if(document.documentElement.dataset.nexusEmbedded==='true')return;

  const SESSION_KEY='nexus-core-staging-device-session/v1';
  const PROJECT_ID='project-esafe-catania';
  const WORLD_ID='world-esafe-catania';
  const params=new URLSearchParams(window.location.search);
  let configuredOrigin='';

  const allowedCoreOrigin=value=>{
    try{
      const url=new URL(value);
      if(url.protocol!=='https:')return '';
      const host=url.hostname.toLowerCase();
      const released=
        host==='nexus-staging.nosmo.tech' ||
        host==='nosmo-nexus-cloud-staging.vercel.app' ||
        (host.startsWith('nosmo-nexus-cloud-staging-')&&host.endsWith('.vercel.app')) ||
        (host.startsWith('nosmo-nexus-cloud-st-git-')&&host.endsWith('.vercel.app'));
      return released?url.origin:'';
    }catch{return ''}
  };

  configuredOrigin=allowedCoreOrigin(params.get('coreOrigin')||'');

  const readSession=()=>{
    try{
      const parsed=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');
      if(!parsed||typeof parsed.token!=='string'||!/^[a-f0-9]{64}$/.test(parsed.token))return null;
      if(typeof parsed.expiresAt!=='string'||!Number.isFinite(Date.parse(parsed.expiresAt))||Date.parse(parsed.expiresAt)<=Date.now()){
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    }catch{return null}
  };

  const writeSession=session=>{
    sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('nexus:core-staging-session-change',{detail:{active:true,personId:session.personId}}));
    updateUi();
  };

  const clearSession=()=>{
    sessionStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('nexus:core-staging-session-change',{detail:{active:false}}));
    updateUi();
  };

  const authHeaders=()=>{
    const headers=new Headers({accept:'application/json'});
    const session=readSession();
    if(session)headers.set('authorization','Bearer '+session.token);
    return headers;
  };

  const dispatchResult=(ok,response,request=null)=>{
    window.dispatchEvent(new CustomEvent('nexus:semantic-drop-authoritative-result',{
      detail:{ok,response,request}
    }));
  };

  const setStatus=(label,tone='')=>{
    const status=document.getElementById('nexusCoreBridgeStatus');
    if(!status)return;
    status.textContent=label;
    status.dataset.tone=tone;
  };

  async function login(claimCode){
    if(!configuredOrigin)throw new Error('Core browser endpoint is not configured.');
    const code=String(claimCode||'').trim();
    if(code.length<32||code.length>200)throw new Error('Enter a valid one-time manager claim.');

    setStatus('CORE · CONNECTING','pending');
    const response=await fetch(configuredOrigin+'/api/nexus/core/staging-device-login',{
      method:'POST',
      mode:'cors',
      credentials:'omit',
      headers:{'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({claimCode:code})
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(payload?.message||payload?.error||('Core login rejected ('+response.status+').'));
    if(payload?.authentication!=='STAGING_DEVICE_CLAIM'||typeof payload?.token!=='string'||typeof payload?.personId!=='string'||typeof payload?.expiresAt!=='string'){
      throw new Error('Unexpected Core login response.');
    }
    writeSession({
      token:payload.token,
      personId:payload.personId,
      displayName:payload.displayName||payload.personId,
      expiresAt:payload.expiresAt
    });
    return payload;
  }

  const packageKind=type=>{
    if(type==='module')return'app';
    if(['task','app','document','evidence','checklist','approval','object'].includes(type))return type;
    return '';
  };

  const requestId=()=>{
    const bytes=new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return 'tree-'+Date.now().toString(36)+'-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  };

  const esafeContextReleased=()=>{
    const world=String(window.__NEXUS_PROJECT_WORLD__||params.get('world')||'').toLowerCase();
    const label=String(document.querySelector('#nexusTopProject .nexus-top-sub')?.textContent||'').toLowerCase();
    return world.includes('esafe')||label.includes('e-safe')||label.includes('catania');
  };

  async function commitSemanticDrop(detail){
    if(!configuredOrigin){
      dispatchResult(false,{error:'CORE_BROWSER_ENDPOINT_NOT_CONFIGURED',message:'Core browser endpoint is not released yet.'},detail);
      return;
    }
    const session=readSession();
    if(!session){
      dispatchResult(false,{error:'CORE_MANAGER_SESSION_REQUIRED',message:'Activate manager Core session before assignment.'},detail);
      updateUi();
      return;
    }
    if(!esafeContextReleased()){
      dispatchResult(false,{error:'CORE_PROJECT_SCOPE_NOT_RELEASED',message:'Browser Core bridge is released only for e-SAFE Catania.'},detail);
      return;
    }
    if(detail?.target?.type!=='person'||typeof detail?.target?.canonicalPersonId!=='string'||!detail.target.canonicalPersonId){
      dispatchResult(false,{error:'CANONICAL_PERSON_TARGET_REQUIRED',message:'Drop target is not bound to one canonical Nexus Person.'},detail);
      return;
    }
    const items=Array.isArray(detail?.workPackage?.items)?detail.workPackage.items:[];
    if(!items.length){
      dispatchResult(false,{error:'WORK_PACKAGE_REQUIRED',message:'Core currently releases only composed WorkPackage → Person assignment.'},detail);
      return;
    }
    const packageItems=items.map((item,index)=>({
      id:String(item?.id||('item-'+(index+1))).slice(0,160),
      kind:packageKind(String(item?.type||'')),
      label:String(item?.label||item?.id||('Item '+(index+1))).slice(0,160)
    }));
    if(packageItems.some(item=>!item.kind)){
      dispatchResult(false,{error:'WORK_PACKAGE_ITEM_KIND_UNSUPPORTED',message:'One Work Package item is not released by Core.'},detail);
      return;
    }

    const body={
      requestId:requestId(),
      requestedAt:new Date().toISOString(),
      projectId:PROJECT_ID,
      worldId:WORLD_ID,
      source:{
        kind:'work-package',
        label:'Relationship Tree Work Package',
        packageItems
      },
      target:{
        id:detail.target.canonicalPersonId,
        type:'person',
        label:String(detail.target.label||detail.target.canonicalPersonId).slice(0,160)
      },
      semanticIntent:'assign-work-package'
    };

    setStatus('CORE · SAVING','pending');
    try{
      const headers=authHeaders();
      headers.set('content-type','application/json');
      const response=await fetch(configuredOrigin+'/api/nexus/core/semantic-drop',{
        method:'POST',
        mode:'cors',
        credentials:'omit',
        headers,
        body:JSON.stringify(body)
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok){
        if(response.status===401)clearSession();
        setStatus('CORE · BLOCKED','blocked');
        dispatchResult(false,payload||{error:'CORE_ASSIGNMENT_REJECTED',message:'Core rejected assignment ('+response.status+').'},detail);
        return;
      }
      setStatus('CORE · ASSIGNED','ok');
      dispatchResult(true,payload,detail);
      if(payload?.projection){
        window.dispatchEvent(new CustomEvent('nexus:core-authoritative-projection',{detail:payload.projection}));
      }
    }catch{
      setStatus('CORE · UNAVAILABLE','blocked');
      dispatchResult(false,{error:'CORE_BROWSER_TRANSPORT_UNAVAILABLE',message:'Core browser transport is unavailable.'},detail);
    }
  }

  function ensureUi(){
    const composer=document.getElementById('nexusWorkPackageComposer');
    if(!composer||document.getElementById('nexusCoreBridgeControls'))return;

    const controls=document.createElement('section');
    controls.id='nexusCoreBridgeControls';
    controls.innerHTML=
      '<div id="nexusCoreBridgeStatus">CORE · '+(configuredOrigin?'DISCONNECTED':'TRANSPORT LOCKED')+'</div>'+
      '<div class="nx-core-connect">'+
        '<input id="nexusCoreClaimInput" type="password" autocomplete="off" placeholder="One-time manager claim" aria-label="One-time manager Core claim">'+
        '<button id="nexusCoreConnectBtn" type="button">CONNECT CORE</button>'+
        '<button id="nexusCoreClearBtn" type="button">CLEAR</button>'+
      '</div>'+
      '<small id="nexusCoreBridgeNote"></small>';

    composer.appendChild(controls);

    controls.querySelector('#nexusCoreConnectBtn')?.addEventListener('click',async()=>{
      const input=controls.querySelector('#nexusCoreClaimInput');
      const code=input?.value||'';
      if(input)input.value='';
      try{
        await login(code);
      }catch(error){
        setStatus('CORE · BLOCKED','blocked');
        const note=controls.querySelector('#nexusCoreBridgeNote');
        if(note)note.textContent=error instanceof Error?error.message:'Core connection failed.';
      }
    });

    controls.querySelector('#nexusCoreClearBtn')?.addEventListener('click',clearSession);
    updateUi();
  }

  function updateUi(){
    const controls=document.getElementById('nexusCoreBridgeControls');
    if(!controls)return;
    const session=readSession();
    const input=controls.querySelector('#nexusCoreClaimInput');
    const connect=controls.querySelector('#nexusCoreConnectBtn');
    const clear=controls.querySelector('#nexusCoreClearBtn');
    const note=controls.querySelector('#nexusCoreBridgeNote');

    if(!configuredOrigin){
      setStatus('CORE · TRANSPORT LOCKED','blocked');
      if(input)input.disabled=true;
      if(connect)connect.disabled=true;
      if(clear)clear.disabled=true;
      if(note)note.textContent='No public non-production Core browser endpoint is configured. Assignment remains fail-closed.';
      return;
    }

    if(session){
      setStatus('CORE · '+String(session.displayName||'MANAGER').toUpperCase(),'ok');
      if(input)input.disabled=true;
      if(connect)connect.disabled=true;
      if(clear)clear.disabled=false;
      if(note)note.textContent='Bearer session expires '+new Date(session.expiresAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'.';
    }else{
      setStatus('CORE · DISCONNECTED','');
      if(input)input.disabled=false;
      if(connect)connect.disabled=false;
      if(clear)clear.disabled=true;
      if(note)note.textContent='Claim is consumed server-side. Session stays in this browser tab only.';
    }
  }

  window.NexusCoreBrowserBridge={
    login,
    clearSession,
    readSession,
    origin:()=>configuredOrigin,
    configured:()=>Boolean(configuredOrigin)
  };

  window.addEventListener('nexus:semantic-drop-request',event=>void commitSemanticDrop(event.detail));
  window.addEventListener('nexus:core-staging-session-change',updateUi);

  const observer=new MutationObserver(()=>ensureUi());
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi,{once:true});else ensureUi();
  setTimeout(()=>observer.disconnect(),20000);
})();
