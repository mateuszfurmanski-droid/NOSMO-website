document.documentElement.classList.add("js");
document.addEventListener("DOMContentLoaded",function(){
  var toggle=document.querySelector(".nav-toggle");
  var nav=document.querySelector(".site-nav");
  var zoomButton=document.querySelector(".exo-zoom");
  var lightbox=document.querySelector(".exo-lightbox");
  if(zoomButton&&lightbox){
    var sourceImage=zoomButton.querySelector("img");
    var lightboxImage=lightbox.querySelector("img");
    var closeButton=lightbox.querySelector(".exo-lightbox-close");
    zoomButton.addEventListener("click",function(){
      lightboxImage.src=sourceImage.currentSrc||sourceImage.src;
      lightboxImage.alt=sourceImage.alt;
      lightbox.style.setProperty("--exo-zoom-width",(sourceImage.getBoundingClientRect().width*2)+"px");
      lightbox.showModal();
      closeButton.focus();
    });
    closeButton.addEventListener("click",function(){lightbox.close();});
    lightbox.addEventListener("click",function(event){if(event.target===lightbox)lightbox.close();});
  }
  if(!toggle||!nav)return;
  function closeNav(){nav.setAttribute("data-open","false");toggle.setAttribute("aria-expanded","false");}
  toggle.addEventListener("click",function(){
    var open=nav.getAttribute("data-open")==="true";
    nav.setAttribute("data-open",open?"false":"true");
    toggle.setAttribute("aria-expanded",open?"false":"true");
  });
  nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeNav);});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeNav();});
  window.addEventListener("resize",function(){if(window.innerWidth>820)closeNav();});
});
