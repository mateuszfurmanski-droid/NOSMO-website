(function(){
  "use strict";

  const DRAFT_PREFIX="nexus-person-card-draft:";
  const INVITE_PREFIX="nexus-person-card-invite:";
  const DRAFT_TOKEN_PREFIX="nexus-person-card-draft-token:";
  const params=new URLSearchParams(window.location.search);
  const inviteId=(params.get("inviteId")||params.get("invite")||"invite-"+Date.now().toString(36)).slice(0,80);
  const agency=(params.get("agency")||"NOSMO Work Profile").slice(0,120);
  const suggestedTrade=(params.get("trade")||"").slice(0,120);
  const suggestedLocation=(params.get("location")||"").slice(0,120);
  const inviteToken=(params.get("inviteToken")||"").slice(0,8000);
  const apiBase=(document.querySelector('meta[name="nexus-onboarding-api-base"]')?.content||"").trim().replace(/\/$/,"");
  const secureInvite=Boolean(inviteToken);
  let draftToken="";
  let autosaveTimer=null;

  function q(sel){return document.querySelector(sel)}
  function qa(sel){return Array.from(document.querySelectorAll(sel))}
  function text(value){return String(value||"").replace(/\s+/g," ").trim()}
  function toast(message){
    const el=q("#onboardToast");if(!el)return;
    el.textContent=message;el.classList.add("show");
    setTimeout(()=>el.classList.remove("show"),2200);
  }
  function randomId(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    return "p-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
  }
  function mappedPersonId(){
    let id=null;
    try{id=localStorage.getItem(INVITE_PREFIX+inviteId)}catch(_){}
    if(!id){
      id=randomId();
      try{localStorage.setItem(INVITE_PREFIX+inviteId,id)}catch(_){}
    }
    return id;
  }
  let personId=mappedPersonId();

  const fields=["firstName","lastName","trade","location","experienceYears","phone","email","radius","availability","availableFrom","cvText","ownTransport","dayShift","nightShift","workAway"];

  function endpoint(path){
    return apiBase ? apiBase+path : "";
  }
  async function postJson(path,body){
    const url=endpoint(path);
    if(!url)throw new Error("NEXUS_ONBOARDING_API_NOT_CONFIGURED");
    const res=await fetch(url,{
      method:"POST",
      headers:{"content-type":"application/json"},
      credentials:"omit",
      cache:"no-store",
      body:JSON.stringify(body)
    });
    const payload=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(payload.error||("HTTP_"+res.status));
    return payload;
  }

  function fieldValue(id){
    const el=q("#"+id);
    if(!el)return "";
    if(el.type==="checkbox")return !!el.checked;
    return el.value;
  }

  function collect(){
    return {
      schema:"nexus-person-onboarding-draft/v1",
      personId,
      inviteId,
      agency,
      updatedAt:new Date().toISOString(),
      firstName:text(fieldValue("firstName")).slice(0,80),
      lastName:text(fieldValue("lastName")).slice(0,80),
      trade:text(fieldValue("trade")).slice(0,140),
      location:text(fieldValue("location")).slice(0,140),
      experienceYears:Number(fieldValue("experienceYears")||0)||0,
      phone:text(fieldValue("phone")).slice(0,80),
      email:text(fieldValue("email")).slice(0,160),
      radius:Number(fieldValue("radius")||0)||0,
      availability:String(fieldValue("availability")||"available"),
      availableFrom:String(fieldValue("availableFrom")||""),
      cvText:String(fieldValue("cvText")||"").slice(0,20000),
      ownTransport:!!fieldValue("ownTransport"),
      dayShift:!!fieldValue("dayShift"),
      nightShift:!!fieldValue("nightShift"),
      workAway:!!fieldValue("workAway"),
      photoDataUrl:window.__NEXUS_ONBOARDING_PHOTO||null
    };
  }

  function saveLocal(showToast){
    const draft=collect();
    try{localStorage.setItem(DRAFT_PREFIX+personId,JSON.stringify(draft))}catch(_){}
    if(showToast)toast("Draft saved on this device");
    return draft;
  }

  function setField(id,value){
    const el=q("#"+id);if(!el)return;
    if(el.type==="checkbox")el.checked=Boolean(value);
    else if(value!==undefined&&value!==null)el.value=String(value);
  }

  function applyDraft(draft){
    if(!draft)return;
    fields.forEach(id=>{
      if(Object.prototype.hasOwnProperty.call(draft,id))setField(id,draft[id]);
    });
    if(draft.photoDataUrl){
      window.__NEXUS_ONBOARDING_PHOTO=draft.photoDataUrl;
      setPhotoPreview(draft.photoDataUrl);
    }
    updatePreview();
  }

  function loadLocal(){
    let draft=null;
    try{draft=JSON.parse(localStorage.getItem(DRAFT_PREFIX+personId)||"null")}catch(_){}
    if(!draft){
      draft={trade:suggestedTrade,location:suggestedLocation,radius:40,availability:"available",dayShift:true};
    }
    applyDraft(draft);
    return draft;
  }

  function serverPayload(finalize){
    const d=collect();
    return {
      draftToken,
      finalize:Boolean(finalize),
      firstName:d.firstName,
      lastName:d.lastName,
      trade:d.trade,
      location:d.location,
      experienceYears:d.experienceYears,
      phone:d.phone,
      email:d.email,
      radius:d.radius,
      availability:d.availability,
      availableFrom:d.availableFrom,
      cvText:d.cvText,
      ownTransport:d.ownTransport,
      dayShift:d.dayShift,
      nightShift:d.nightShift,
      workAway:d.workAway
    };
  }

  function serverDraftToLocal(payload){
    const p=payload?.person||{};
    const w=payload?.workProfile||{};
    const a=w.availability||{};
    const prefs=w.preferences||{};
    const local={
      schema:"nexus-person-onboarding-draft/v1",
      personId,
      inviteId,
      agency,
      updatedAt:payload?.persistedAt||new Date().toISOString(),
      firstName:p.firstName||"",
      lastName:p.lastName||"",
      trade:p.primaryRole||prefs.primaryTrade||suggestedTrade||"",
      location:p.location||(prefs.locations&&prefs.locations[0])||suggestedLocation||"",
      experienceYears:Number(p.experienceYears||0)||0,
      phone:p.contact&&p.contact.phone||"",
      email:p.contact&&p.contact.email||"",
      radius:Number(a.preferredRadiusKm||40)||40,
      availability:a.status||"available",
      availableFrom:a.availableFrom||"",
      cvText:w.cvText||"",
      ownTransport:Boolean(a.ownTransport),
      dayShift:Array.isArray(a.shifts)?a.shifts.includes("day"):true,
      nightShift:Array.isArray(a.shifts)?a.shifts.includes("night"):false,
      workAway:Boolean(a.workAway),
      photoDataUrl:window.__NEXUS_ONBOARDING_PHOTO||null
    };
    try{localStorage.setItem(DRAFT_PREFIX+personId,JSON.stringify(local))}catch(_){}
    applyDraft(local);
  }

  async function loadServerDraft(){
    if(!apiBase||!draftToken)return false;
    const payload=await postJson("/drafts/load",{draftToken});
    if(payload.personId&&payload.personId!==personId)throw new Error("NEXUS_ONBOARDING_DRAFT_ID_MISMATCH");
    serverDraftToLocal(payload);
    return true;
  }

  function migrateLocalDraft(oldPersonId,newPersonId){
    if(!oldPersonId||oldPersonId===newPersonId)return;
    let prior=null;
    try{prior=JSON.parse(localStorage.getItem(DRAFT_PREFIX+oldPersonId)||"null")}catch(_){}
    if(prior){
      prior.personId=newPersonId;
      try{
        localStorage.setItem(DRAFT_PREFIX+newPersonId,JSON.stringify(prior));
        localStorage.removeItem(DRAFT_PREFIX+oldPersonId);
      }catch(_){}
    }
  }

  async function ensureServerClaim(){
    if(!secureInvite||!apiBase)return false;

    try{
      draftToken=localStorage.getItem(DRAFT_TOKEN_PREFIX+inviteId)||"";
    }catch(_){draftToken=""}

    if(draftToken){
      const mapped=localStorage.getItem(INVITE_PREFIX+inviteId);
      if(mapped)personId=mapped;
      try{localStorage.setItem("nexus-person-work-draft-token:"+personId,draftToken)}catch(_){}
      try{
        await loadServerDraft();
        q("#aiStatus").textContent="Secure server draft connected. Changes can be persisted to your Person Card.";
        return true;
      }catch(error){
        const message=error&&error.message?error.message:"load failed";
        if(message!=="NEXUS_ONBOARDING_DRAFT_TOKEN_EXPIRED"&&message!=="NEXUS_ONBOARDING_DRAFT_TOKEN_INVALID")throw error;
        try{localStorage.removeItem(DRAFT_TOKEN_PREFIX+inviteId)}catch(_){}
        draftToken="";
      }
    }

    const oldPersonId=personId;
    const claim=await postJson("/claim",{inviteToken});
    if(!claim.draftToken||!claim.personId)throw new Error("NEXUS_ONBOARDING_CLAIM_INVALID_RESPONSE");
    draftToken=claim.draftToken;
    personId=claim.personId;
    migrateLocalDraft(oldPersonId,personId);
    try{
      localStorage.setItem(INVITE_PREFIX+inviteId,personId);
      localStorage.setItem(DRAFT_TOKEN_PREFIX+inviteId,draftToken);
      localStorage.setItem("nexus-person-work-draft-token:"+personId,draftToken);
    }catch(_){}
    await loadServerDraft();
    q("#aiStatus").textContent="Secure invite claimed on this device. Worker-only draft authority is active.";
    toast("Secure Person Card draft connected");
    return true;
  }

  async function saveServer(finalize,showToast){
    if(!apiBase||!draftToken)return false;
    const result=await postJson("/drafts/save",serverPayload(finalize));
    if(showToast)toast(finalize?"Person Card finalized on server":"Draft saved to server");
    const mode=q("#previewSource");
    if(mode)mode.textContent=finalize?"Server":"Saved";
    return Boolean(result&&result.serverPersonMutationPerformed);
  }

  function scheduleServerAutosave(){
    if(!apiBase||!draftToken)return;
    if(autosaveTimer)clearTimeout(autosaveTimer);
    autosaveTimer=setTimeout(async()=>{
      try{await saveServer(false,false)}
      catch(error){
        q("#aiStatus").textContent="Server autosave unavailable: "+(error&&error.message?error.message:"request failed")+". Local draft is still available on this device.";
      }
    },900);
  }

  function initials(first,last){
    const chars=[text(first)[0],text(last)[0]].filter(Boolean).join("").toUpperCase();
    return chars||"PC";
  }

  function availabilityLabel(value){
    if(value==="not-looking")return "Not Looking";
    if(value==="from-date")return fieldValue("availableFrom")?("From "+fieldValue("availableFrom")):"From Date";
    return "Available";
  }

  function readiness(draft){
    let score=0;
    if(draft.firstName&&draft.lastName)score+=20;
    if(draft.trade)score+=20;
    if(draft.location)score+=15;
    if(draft.experienceYears||draft.cvText)score+=15;
    if(draft.phone||draft.email)score+=10;
    if(draft.radius>=0)score+=5;
    if(draft.availability)score+=5;
    if(draft.cvText.length>80)score+=10;
    return Math.min(100,score);
  }

  function updatePreview(){
    const d=collect();
    q("#previewFirst").textContent=d.firstName||"YOUR";
    q("#previewLast").textContent=d.lastName||"PERSON CARD";
    q("#previewRole").textContent="WORK PROFILE";
    q("#previewTrade").textContent=d.trade||"ADD YOUR TRADE";
    q("#previewLocation").textContent=d.location||"Add location";
    q("#previewExperience").textContent=d.experienceYears?d.experienceYears+" yrs experience":(d.cvText?"Work history added":"Add experience");
    q("#previewAvailability").textContent=availabilityLabel(d.availability);
    q("#previewPhoto").textContent=initials(d.firstName,d.lastName);

    const score=readiness(d);
    q("#readinessPercent").textContent=score+"%";
    q("#previewReadiness").textContent=score>=70?"Ready":"Draft";
    q("#barIdentity").style.width=((d.firstName&&d.lastName?100:d.firstName||d.lastName?55:15))+"%";
    q("#barWork").style.width=((d.trade&&d.location?100:d.trade||d.location?55:10))+"%";
    q("#barCv").style.width=(d.cvText.length>80?100:d.experienceYears?55:5)+"%";
  }

  function setPhotoPreview(dataUrl){
    const photo=q("#previewPhoto");if(!photo)return;
    if(dataUrl){
      photo.classList.add("hasPreview");
      photo.style.backgroundImage='url("'+dataUrl.replace(/"/g,"")+'")';
    }else{
      photo.classList.remove("hasPreview");
      photo.style.backgroundImage="";
    }
  }

  function openEditor(section){
    q("#onboardOverlay")?.classList.add("open");
    q("#onboardOverlay")?.setAttribute("aria-hidden","false");
    const targets={profile:"#firstName",work:"#trade",availability:"#availability",cv:"#cvText"};
    const label={profile:"Profile",work:"Work Preferences",availability:"Availability",cv:"CV / Smart Prefill"}[section]||"Build your Work Profile";
    q("#onboardTitle").textContent=label;
    setTimeout(()=>q(targets[section]||"#firstName")?.focus(),120);
  }

  function closeEditor(){
    q("#onboardOverlay")?.classList.remove("open");
    q("#onboardOverlay")?.setAttribute("aria-hidden","true");
  }

  function smartPrefill(){
    const cv=text(fieldValue("cvText"));
    if(!cv){toast("Paste CV or work history first");return}
    const lower=cv.toLowerCase();

    if(!text(fieldValue("trade"))){
      const trades=[
        ["carpenter / joiner",["joiner","carpenter","carpentry","second fix"]],
        ["welder / fabricator",["welder","welding","fabricator","fabrication"]],
        ["electrician",["electrician","electrical","electrical installer"]],
        ["plumber",["plumber","plumbing","pipefitter","pipe fitter"]],
        ["dryliner",["dryliner","dry lining","drylining"]],
        ["site manager",["site manager","construction manager","site supervisor"]]
      ];
      const hit=trades.find(row=>row[1].some(term=>lower.includes(term)));
      if(hit)q("#trade").value=hit[0];
    }

    if(!Number(fieldValue("experienceYears"))){
      const yearMatches=[...cv.matchAll(/(?:19|20)\d{2}/g)].map(m=>Number(m[0])).filter(y=>y>=1980&&y<=new Date().getFullYear());
      if(yearMatches.length){
        const earliest=Math.min(...yearMatches);
        q("#experienceYears").value=String(Math.max(1,Math.min(60,new Date().getFullYear()-earliest)));
      }
      const explicit=cv.match(/(\d{1,2})\+?\s*(?:years|yrs)\s+(?:of\s+)?experience/i);
      if(explicit)q("#experienceYears").value=explicit[1];
    }

    if(!text(fieldValue("location"))){
      const locationMatch=cv.match(/(?:based in|location[:\s]+)([A-Z][A-Za-z .'-]{2,40})/);
      if(locationMatch)q("#location").value=text(locationMatch[1]);
    }

    updatePreview();
    saveLocal(false);
    scheduleServerAutosave();
    q("#aiStatus").textContent="Smart Prefill used local text rules only. Review every field before Finish.";
    toast("Smart Prefill complete — review the fields");
  }

  async function aiAssist(){
    const status=q("#aiStatus");
    if(!secureInvite){
      status.textContent="AI Assist requires a secure signed Agency Invite. This unsigned/demo flow can still use Smart Prefill.";
      toast("Signed invite required for AI Assist");
      return;
    }
    if(!apiBase){
      status.textContent="Secure invite detected, but trusted onboarding API base is not configured on this preview. Smart Prefill remains local.";
      toast("Onboarding API not connected");
      return;
    }
    try{
      if(!draftToken)await ensureServerClaim();
      const d=collect();
      if(!d.cvText){toast("Paste CV or work history first");return}
      status.textContent="AI Assist is analysing the supplied work history…";
      const payload=await postJson("/ai-prefill",{
        inviteId,
        inviteToken,
        draftToken,
        personId,
        cvText:d.cvText,
        current:{
          firstName:d.firstName,
          lastName:d.lastName,
          trade:d.trade,
          location:d.location,
          experienceYears:d.experienceYears
        }
      });
      const p=payload.prefill||{};
      ["firstName","lastName","trade","location","experienceYears"].forEach(id=>{
        const el=q("#"+id);
        if(el&&p[id]!==undefined&&p[id]!==null&&String(p[id]).trim())el.value=String(p[id]);
      });
      updatePreview();
      saveLocal(false);
      await saveServer(false,false);
      status.textContent="AI Assist completed. Extracted fields are saved as a draft and still require your review.";
      toast("AI draft ready — review before Finish");
    }catch(error){
      status.textContent="AI Assist unavailable: "+(error&&error.message?error.message:"request failed")+". No verified field was changed automatically.";
      toast("AI Assist unavailable");
    }
  }

  function buildCanonicalDraft(d){
    const displayName=text(d.firstName+" "+d.lastName);
    const person={
      schema:"nexus-person-draft/v1",
      id:d.personId,
      source:"agency-invite",
      inviteId:d.inviteId,
      displayName,
      firstName:d.firstName,
      lastName:d.lastName,
      primaryRole:d.trade,
      location:d.location,
      experienceYears:d.experienceYears,
      contact:{phone:d.phone||null,email:d.email||null},
      photoDataUrl:d.photoDataUrl||null,
      verification:"unverified",
      createdAt:new Date().toISOString()
    };
    const workProfile={
      schema:"nexus-person-work-profile/v1",
      id:"work-profile:"+d.personId,
      personId:d.personId,
      version:"draft-v1",
      demoMode:false,
      source:"agency-invite-draft",
      agency:d.agency,
      updatedAt:new Date().toISOString(),
      availability:{
        status:d.availability,
        label:availabilityLabel(d.availability),
        availableFrom:d.availableFrom||null,
        preferredRadiusKm:d.radius,
        workAway:d.workAway,
        ownTransport:d.ownTransport,
        shifts:[d.dayShift?"day":null,d.nightShift?"night":null].filter(Boolean)
      },
      preferences:{
        primaryTrade:d.trade,
        targetRoles:[d.trade].filter(Boolean),
        locations:[d.location].filter(Boolean),
        employmentTypes:["contract","temporary","permanent"],
        paymentPreferences:[],
        rate:{amount:null,currency:"GBP",unit:"hour",display:"Open to offers"}
      },
      readiness:{
        cv:{state:d.cvText.length>80?"draft":"missing",source:"onboarding"},
        certificates:{state:"missing",source:"onboarding"},
        references:{state:"missing",source:"onboarding"},
        vault:{state:"not-connected",source:"onboarding"}
      },
      cvText:d.cvText,
      sourceConnectors:[
        {id:"indeed-external",label:"Indeed",mode:"external-link",status:"available",canRead:false,canApply:false},
        {id:"adzuna-jobs",label:"Adzuna",mode:"server-api",status:"ready-not-connected",canRead:true,canApply:false}
      ],
      jobGateway:{
        schema:"nexus-job-gateway-client/v1",
        status:"ready-not-connected",
        endpoint:null,
        provider:"Adzuna",
        connectorId:"adzuna-jobs",
        queryDefaults:{country:"gb",results:10},
        productionTarget:"https://nexus.nosmo.tech/api/nexus/jobs/search"
      },
      jobMatches:[],
      agencies:[]
    };
    return {person,workProfile};
  }

  async function finish(){
    const d=saveLocal(false);
    const missing=[];
    if(!d.firstName)missing.push("first name");
    if(!d.lastName)missing.push("last name");
    if(!d.trade)missing.push("trade");
    if(!d.location)missing.push("location");
    if(missing.length){
      toast("Complete: "+missing.join(", "));
      openEditor(missing.includes("first name")||missing.includes("last name")?"profile":"work");
      return;
    }

    if(secureInvite&&apiBase){
      try{
        if(!draftToken)await ensureServerClaim();
        await saveServer(true,true);
      }catch(error){
        q("#aiStatus").textContent="Finish blocked because server persistence failed: "+(error&&error.message?error.message:"request failed")+". Your local draft is still safe on this device.";
        toast("Server save failed — Finish blocked");
        return;
      }
    }

    const canonical=buildCanonicalDraft(collect());
    try{
      localStorage.setItem("nexus-person-draft:"+personId,JSON.stringify(canonical.person));
      localStorage.setItem("nexus-work-profile-draft:"+personId,JSON.stringify(canonical.workProfile));
    }catch(_){}
    const target="person-card-kamil-work-v1.html?draft="+encodeURIComponent(personId)+"&from=onboarding";
    window.location.href=target;
  }

  async function explicitSave(){
    saveLocal(false);
    if(secureInvite&&apiBase){
      try{
        if(!draftToken)await ensureServerClaim();
        await saveServer(false,true);
        q("#aiStatus").textContent="Draft saved to the secure Person Card store.";
        return;
      }catch(error){
        q("#aiStatus").textContent="Server save unavailable: "+(error&&error.message?error.message:"request failed")+". Local draft remains available.";
      }
    }
    toast("Draft saved on this device");
  }

  function bind(){
    q("#inviteAgency").textContent=agency;
    q("#inviteMessage").textContent=params.get("message")||"Create your Person Card once and reuse it with agencies and jobs.";
    q("#previewSource").textContent=secureInvite?"Secure Invite":(agency==="NOSMO Work Profile"?"Invite":"Agency");

    qa("[data-open-section]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();openEditor(el.dataset.openSection)}));
    q("#menuBtn")?.addEventListener("click",()=>{const menu=q("#menu");const open=menu.classList.toggle("open");q("#menuBtn").setAttribute("aria-expanded",String(open))});
    document.addEventListener("click",e=>{const menu=q("#menu"),btn=q("#menuBtn");if(menu&&!menu.contains(e.target)&&btn&&!btn.contains(e.target)){menu.classList.remove("open");btn.setAttribute("aria-expanded","false")}});
    q("#onboardClose")?.addEventListener("click",closeEditor);
    q("#onboardOverlay")?.addEventListener("click",e=>{if(e.target===q("#onboardOverlay"))closeEditor()});
    q("#doneEditing")?.addEventListener("click",()=>{updatePreview();saveLocal(false);scheduleServerAutosave();closeEditor();toast("Card preview updated")});
    q("#saveDraft")?.addEventListener("click",explicitSave);
    q("#smartPrefill")?.addEventListener("click",smartPrefill);
    q("#aiPrefill")?.addEventListener("click",aiAssist);
    q("#finishProfile")?.addEventListener("click",finish);
    fields.forEach(id=>{
      q("#"+id)?.addEventListener("input",()=>{updatePreview();saveLocal(false);scheduleServerAutosave()});
      q("#"+id)?.addEventListener("change",()=>{updatePreview();saveLocal(false);scheduleServerAutosave()});
    });
    q("#photoInput")?.addEventListener("change",e=>{
      const file=e.target.files&&e.target.files[0];if(!file)return;
      if(file.size>2*1024*1024){toast("Photo too large for local prototype (max 2 MB)");e.target.value="";return}
      const reader=new FileReader();
      reader.onload=()=>{window.__NEXUS_ONBOARDING_PHOTO=String(reader.result||"");setPhotoPreview(window.__NEXUS_ONBOARDING_PHOTO);saveLocal(false)};
      reader.readAsDataURL(file);
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")closeEditor()});
  }

  async function init(){
    bind();
    const local=loadLocal();
    let serverConnected=false;

    if(secureInvite&&apiBase){
      try{
        serverConnected=await ensureServerClaim();
      }catch(error){
        q("#aiStatus").textContent="Secure onboarding could not connect: "+(error&&error.message?error.message:"request failed")+". No server persistence is being claimed.";
      }
    }else if(secureInvite&&!apiBase){
      q("#aiStatus").textContent="Secure invite detected. Trusted API base is not configured on this static preview, so this device is using local draft storage only.";
    }else{
      q("#aiStatus").textContent="Unsigned/demo onboarding: local draft storage only. Smart Prefill is available; secure AI/persistence require a signed invite.";
    }

    if(!serverConnected&&!localStorage.getItem(DRAFT_PREFIX+personId))openEditor("profile");
  }

  init();
})();
