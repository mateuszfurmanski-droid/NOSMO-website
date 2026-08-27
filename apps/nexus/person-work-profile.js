(function(){
  "use strict";

  function q(sel,root){return (root||document).querySelector(sel)}
  function qa(sel,root){return Array.from((root||document).querySelectorAll(sel))}
  function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function toast(msg){
    var el=q("#workToast");
    if(!el)return;
    el.textContent=msg;
    el.classList.add("show");
    window.setTimeout(function(){el.classList.remove("show")},2400);
  }
  function sourceLabel(profile,id){
    var row=(profile.sourceConnectors||[]).find(function(x){return x.id===id});
    return row?row.label:"Source";
  }
  function renderCriteria(profile){
    var grid=q("#workCriteria");
    if(!grid)return;
    var a=profile.availability||{},p=profile.preferences||{};
    var chips=[
      ["Trade",p.primaryTrade||"—"],
      ["Base",(p.locations||[])[0]||"—"],
      ["Status",a.label||a.status||"—"],
      ["Radius",a.preferredRadiusKm?String(a.preferredRadiusKm)+" km":"—"],
      ["Shift",(a.shifts||[]).join(" / ")||"—"],
      ["Transport",a.ownTransport?"Own transport":"Not stated"]
    ];
    grid.innerHTML=chips.map(function(row){
      return '<div class="workChip"><span>'+escapeHtml(row[0])+'</span><strong>'+escapeHtml(row[1])+'</strong></div>';
    }).join("");
  }
  function renderJobs(profile){
    var list=q("#jobList");
    if(!list)return;
    list.innerHTML=(profile.jobMatches||[]).map(function(job){
      var reasons=(job.reasons||[]).map(function(x){return '<i>'+escapeHtml(x)+'</i>'}).join("");
      var gaps=(job.gaps||[]).length
        ? '<p class="reason">Check: '+escapeHtml((job.gaps||[]).join(" · "))+'</p>'
        : '<p class="reason">No missing requirement identified in the demo record.</p>';
      return '<article class="jobCard">'+
        '<div class="jobTop"><div><strong>'+escapeHtml(job.title)+'</strong><span>'+escapeHtml(sourceLabel(profile,job.sourceId))+' · '+escapeHtml(job.location)+'</span></div><div class="match">'+escapeHtml(job.matchScore)+'%</div></div>'+
        '<div class="jobMeta"><i>'+escapeHtml(job.distanceKm)+' km</i><i>'+escapeHtml(job.shift||"Shift n/a")+'</i><i>'+escapeHtml(job.rate||"Rate n/a")+'</i></div>'+
        '<p class="reason">'+reasons+'</p>'+gaps+
        '<div class="jobActions"><button type="button" data-demo-draft="'+escapeHtml(job.title)+'">Prepare message</button><button type="button" data-job-id="'+escapeHtml(job.id)+'">Details</button></div>'+
      '</article>';
    }).join("");
  }
  function renderAgencies(profile){
    var list=q("#agencyQueue");
    if(!list)return;
    list.innerHTML=(profile.agencies||[]).map(function(a){
      return '<div class="agencyRow"><strong>'+escapeHtml(a.name)+'</strong><p>'+escapeHtml(a.desk||"Agency")+' · '+escapeHtml(a.status||"")+'</p>'+
        '<div class="agencyActions"><a href="'+escapeHtml(a.whatsapp||"#")+'" target="_blank" rel="noopener">WhatsApp</a><a href="'+escapeHtml(a.email||"#")+'">Email</a></div></div>';
    }).join("");
  }
  function renderReadiness(profile){
    var p=profile.readiness||{};
    var map=[
      ["#aiCvState",p.cv&&p.cv.state],
      ["#aiCertState",p.certificates&&p.certificates.state],
      ["#aiRefState",p.references&&p.references.state]
    ];
    map.forEach(function(row){var el=q(row[0]);if(el&&row[1])el.textContent=String(row[1]).toUpperCase()});
  }
  function bindJobDetails(profile){
    document.addEventListener("click",function(e){
      var btn=e.target.closest&&e.target.closest("[data-job-id]");
      if(!btn)return;
      var job=(profile.jobMatches||[]).find(function(j){return j.id===btn.dataset.jobId});
      if(!job)return;
      toast(job.title+" · "+job.matchScore+"% · "+(job.gaps||[]).length+" gap(s)");
    });
  }
  async function init(){
    var host=q("[data-work-profile-src]");
    if(!host)return;
    var src=host.getAttribute("data-work-profile-src");
    try{
      var res=await fetch(src,{cache:"no-store"});
      if(!res.ok)throw new Error("HTTP "+res.status);
      var profile=await res.json();
      window.NEXUS_WORK_PROFILE=profile;
      renderCriteria(profile);
      renderJobs(profile);
      renderAgencies(profile);
      renderReadiness(profile);
      bindJobDetails(profile);
      var mode=q("#workDataMode");
      if(mode)mode.textContent=profile.demoMode?"DEMO DATA":"CONNECTED";
    }catch(err){
      console.error("Nexus Work Profile data load failed",err);
      toast("Work Profile data unavailable. Static fallback remains visible.");
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
