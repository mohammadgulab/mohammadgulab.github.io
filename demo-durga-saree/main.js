(function(){
"use strict";
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var body=document.body, reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- toast ---------- */
var toastEl=$("#toast"), toastT;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("show")},2800)}

/* ---------- header + menu ---------- */
var head=$("#head"), burger=$("#burger"), menu=$("#menu");
function onScroll(){head.classList.toggle("scrolled",window.scrollY>30)}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();
function setMenu(open){body.classList.toggle("menu-open",open);burger.setAttribute("aria-expanded",open);burger.setAttribute("aria-label",open?"Close menu":"Open menu");menu.setAttribute("aria-hidden",!open)}
burger.addEventListener("click",function(){setMenu(!body.classList.contains("menu-open"))});
$$("#menu a").forEach(function(a){a.addEventListener("click",function(){setMenu(false)})});

/* ---------- drawers ---------- */
function openD(el){el.classList.add("open");el.setAttribute("aria-hidden","false")}
function closeD(el){el.classList.remove("open");el.setAttribute("aria-hidden","true")}
$$(".drawer").forEach(function(d){$$("[data-close]",d).forEach(function(b){b.addEventListener("click",function(){closeD(d)})})});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){$$(".drawer.open").forEach(closeD);setMenu(false)}});

/* ---------- bag ---------- */
var bag=[], bagCount=$("#bagCount"), bagBtn=$("#bagBtn"), list=$("#bagList"), totalEl=$("#bagTotal");
function fmt(n){return "SAR "+n.toLocaleString("en-US")}
function renderBag(){
  bagCount.textContent=bag.length;
  list.innerHTML="";
  if(!bag.length){list.innerHTML='<li class="empty">Your bag is empty.</li>'}
  bag.forEach(function(it,i){var li=document.createElement("li");li.innerHTML="<span>"+it.name+"<br><b>"+fmt(it.price)+"</b></span>";var b=document.createElement("button");b.textContent="Remove";b.setAttribute("aria-label","Remove "+it.name);b.onclick=function(){bag.splice(i,1);renderBag()};li.appendChild(b);list.appendChild(li)});
  totalEl.textContent=fmt(bag.reduce(function(s,it){return s+it.price},0));
}
function addToBag(name,price){bag.push({name:name,price:price});renderBag();bagBtn.classList.remove("bump");void bagBtn.offsetWidth;bagBtn.classList.add("bump");toast("Added: "+name+", "+fmt(price))}
$$(".card .add").forEach(function(b){b.addEventListener("click",function(){var c=b.closest(".card");addToBag(c.dataset.name,+c.dataset.price);b.textContent="Added";b.classList.add("done");setTimeout(function(){b.textContent="Add to bag";b.classList.remove("done")},1600)})});
bagBtn.addEventListener("click",function(){renderBag();openD($("#drawer"))});
$("#checkout").addEventListener("click",function(){toast(bag.length?"Concept demo: checkout is not live.":"Add a saree first.")});
renderBag();

/* ---------- gifts ---------- */
var gift={name:"Tant gift box",price:250}, giftAdd=$("#giftAdd");
$$(".opt").forEach(function(o){o.addEventListener("click",function(){$$(".opt").forEach(function(x){x.classList.remove("is-on")});o.classList.add("is-on");gift={name:o.dataset.gift,price:+o.dataset.price};giftAdd.textContent="Add "+gift.name.replace(" gift box"," box")+" to bag"})});
giftAdd.addEventListener("click",function(){addToBag(gift.name,gift.price)});

/* ---------- booking sheet ---------- */
var sheet=$("#sheet"), dayWrap=$("#dayChips"), picked={day:null,time:null};
var days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
for(var i=1;i<=5;i++){var d=new Date();d.setDate(d.getDate()+i);var b=document.createElement("button");b.className="chip";b.textContent=days[d.getDay()]+" "+d.getDate()+" "+months[d.getMonth()];dayWrap.appendChild(b)}
function chipGroup(wrap,key){$$(".chip",wrap).forEach(function(c){c.addEventListener("click",function(){$$(".chip",wrap).forEach(function(x){x.classList.remove("is-on")});c.classList.add("is-on");picked[key]=c.textContent})})}
chipGroup(dayWrap,"day");chipGroup($("#timeChips"),"time");
$$("[data-book]").forEach(function(b){b.addEventListener("click",function(){openD(sheet)})});
$("#confirmBook").addEventListener("click",function(){if(!picked.day||!picked.time){toast("Pick a day and a time.");return}closeD(sheet);toast("Concept demo: "+picked.day+", "+picked.time+" noted. Nothing was sent.")});

/* ---------- silk videos: right file for the screen, play only when visible ---------- */
$$(".silk-vid").forEach(function(v){
  var tall=window.innerHeight>window.innerWidth;
  v.src=tall?v.dataset.tall:v.dataset.wide;
  v.poster=tall?"img/silk-tall.webp":"img/silk-wide.webp";
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause()})},{rootMargin:"200px"}).observe(v);
  }
});

/* ---------- split quote into words ---------- */
var q=$("#quote");
q.innerHTML=q.textContent.trim().split(/\s+/).map(function(w){return '<span class="qw">'+w+'</span>'}).join(" ");

/* ---------- motion ---------- */
if(!window.gsap||!window.ScrollTrigger){body.classList.add("no-gsap");body.classList.remove("is-loading");return}
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});

/* loader */
var loader=$("#loader");
function endLoader(){body.classList.remove("is-loading");loader.style.display="none";ScrollTrigger.refresh();heroIntro()}
function heroIntro(){
  gsap.from(".hw-1",{xPercent:-30,opacity:0,duration:1.1,ease:"power3.out"});
  gsap.from(".hw-2",{xPercent:30,opacity:0,duration:1.1,ease:"power3.out",delay:.08});
  gsap.from("#heroMedia img",{scale:1.45,duration:1.6,ease:"power3.out"});
  gsap.from(".hero-kicker,.hero-note,.scroll-cue",{opacity:0,y:14,duration:.8,delay:.4,stagger:.1});
}
if(reduce||sessionStorage.getItem("aloka-seen")){
  gsap.to(loader,{opacity:0,duration:.4,onComplete:endLoader});
}else{
  var sparks=$(".sparks");for(var s=0;s<16;s++){sparks.appendChild(document.createElement("i"))}
  var size=Math.hypot(window.innerWidth,window.innerHeight)/40*1.1;
  var tl=gsap.timeline({onComplete:function(){sessionStorage.setItem("aloka-seen","1");endLoader()}});
  tl.to(".diya",{opacity:1,scale:1,duration:.9,ease:"power2.out"})
    .to(".spark-head",{opacity:1,duration:.2},"-=.3")
    .to(".ring-line",{strokeDashoffset:0,duration:1.6,ease:"power2.inOut"},"<")
    .to(".spark-orbit",{rotation:360,duration:1.6,ease:"power2.inOut"},"<")
    .to(".loader-word span",{y:0,duration:.8,stagger:.07,ease:"power3.out"},"-=1.1")
    .to(".loader-sub",{opacity:1,duration:.6},"-=.4")
    .to(".spark-head",{opacity:0,scale:2.5,duration:.3})
    .add(function(){
      $$(".sparks i").forEach(function(el,i){var a=i/16*Math.PI*2+Math.random()*.3,r=90+Math.random()*90;
        gsap.fromTo(el,{x:Math.cos(a)*60,y:Math.sin(a)*60,opacity:1,scale:1},{x:Math.cos(a)*r*1.6,y:Math.sin(a)*r*1.6,opacity:0,scale:.3,duration:.9+Math.random()*.4,ease:"power2.out"})});
    },"<")
    .to(".diya",{boxShadow:"0 0 120px 40px rgba(255,170,60,.7)",duration:.5},"<")
    .to(".flood",{scale:size,duration:1.1,ease:"power3.in"},"-=.05")
    .to(".loader-core",{opacity:0,duration:.3},"-=.35");
  loader.addEventListener("click",function(){tl.progress(1)});
  setTimeout(function(){if(tl.progress()<1)tl.progress(1)},7000);
}

/* hero: arch opens to full screen */
var hm=$("#heroMedia"), hw1=$(".hw-1"), hw2=$(".hw-2"), stage=$(".hero-stage");
var H={t:0,r:0,b:0,l:0,rad:0};
function heroStart(){
  var vw=stage.clientWidth, vh=stage.clientHeight, top, h, w;
  if(vw>=1024){w=vw*.22;h=vh*.70;top=vh*.14}
  else{top=hw1.offsetTop+hw1.offsetHeight+12;var bot=hw2.offsetTop-12;h=Math.max(160,bot-top);w=Math.min(vw*.68,h*.68)}
  var l=(vw-w)/2;H.t=top;H.l=l;H.r=l;H.b=vh-top-h;H.rad=w/2;
}
var hp={p:0};
function drawHero(){var k=1-hp.p;hm.style.clipPath="inset("+(H.t*k)+"px "+(H.r*k)+"px "+(H.b*k)+"px "+(H.l*k)+"px round "+(H.rad*k)+"px "+(H.rad*k)+"px "+(14*k)+"px "+(14*k)+"px)"}
heroStart();drawHero();
var wide=window.innerWidth>=1024;
var htl=gsap.timeline({scrollTrigger:{trigger:".hero",start:"top top",end:"+=140%",pin:true,scrub:.6,anticipatePin:1,invalidateOnRefresh:true,onRefreshInit:function(){heroStart();drawHero()}}});
htl.to(hp,{p:1,ease:"power2.inOut",duration:1,onUpdate:drawHero},0)
   .to("#heroMedia img",{scale:1,ease:"none",duration:1},0)
   .to(".hw-1",{x:function(){return wide?-window.innerWidth*.35:0},y:function(){return wide?0:-window.innerHeight*.25},opacity:0,ease:"power2.in",duration:.7},0)
   .to(".hw-2",{x:function(){return wide?window.innerWidth*.35:0},y:function(){return wide?0:window.innerHeight*.25},opacity:0,ease:"power2.in",duration:.7},0)
   .to(".hero-kicker,.hero-note,.scroll-cue",{opacity:0,duration:.3},0)
   .fromTo(".hero-over",{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:.35},.8);

/* scene: full bleed settles into a card */
var sp={p:0}, sf=$("#sceneFrame");
function drawScene(){var p=sp.p, w=window.innerWidth>=760, iy=(w?9:7)*p, ix=(w?7:4.5)*p;sf.style.clipPath="inset("+iy+"% "+ix+"% "+iy+"% "+ix+"% round "+(28*p)+"px)"}
gsap.timeline({scrollTrigger:{trigger:".scene",start:"top top",end:"+=110%",pin:true,scrub:.6,anticipatePin:1}})
  .fromTo(".st-1",{y:50,opacity:0},{y:0,opacity:1,duration:.35},0)
  .fromTo(".st-2",{y:50,opacity:0},{y:0,opacity:1,duration:.35},.3)
  .fromTo(".scene .eyebrow",{opacity:0},{opacity:1,duration:.3},0)
  .to(sp,{p:1,duration:.7,ease:"power2.inOut",onUpdate:drawScene},.3)
  .fromTo(".scene-frame img",{scale:1.2},{scale:1,duration:1,ease:"none"},0);

/* silk words */
gsap.timeline({scrollTrigger:{trigger:".silk",start:"top 75%",end:"center 55%",scrub:.6}})
  .fromTo(".bn .w",{yPercent:60,opacity:0,filter:"blur(14px)"},{yPercent:0,opacity:1,filter:"blur(0px)",stagger:.25,duration:.6})
  .fromTo(".silk-en,.silk-p",{opacity:0,y:20},{opacity:1,y:0,stagger:.15,duration:.4},"-=.2");

/* woven: portrait rises through the type */
gsap.timeline({scrollTrigger:{trigger:".woven",start:"top top",end:"+=120%",pin:true,scrub:.6,anticipatePin:1}})
  .fromTo("#wovenFig",{yPercent:80},{yPercent:0,ease:"power2.out",duration:1},0)
  .fromTo("#wovenFig img",{scale:1.3},{scale:1,ease:"none",duration:1},0)
  .fromTo(".wt-1",{xPercent:-8},{xPercent:4,ease:"none",duration:1},0)
  .fromTo(".wt-2",{xPercent:8},{xPercent:-4,ease:"none",duration:1},0)
  .to(".woven-cap",{opacity:1,y:0,duration:.25},.8);

/* bridal: colour wipes up over grey */
gsap.timeline({scrollTrigger:{trigger:"#bridalMedia",start:"top 80%",end:"bottom 45%",scrub:.5}})
  .fromTo(".b-colour",{clipPath:"inset(100% 0% 0% 0%)"},{clipPath:"inset(0% 0% 0% 0%)",ease:"none"},0)
  .fromTo(".b-line",{top:"100%"},{top:"0%",ease:"none"},0)
  .to(".b-line",{opacity:0,duration:.05});
gsap.from(".bridal-copy > *",{opacity:0,y:24,stagger:.08,duration:.7,scrollTrigger:{trigger:".bridal-copy",start:"top 85%"}});

/* collection: horizontal pinned gallery */
var track=$("#track");
function dist(){return Math.max(0,track.scrollWidth-window.innerWidth)}
gsap.timeline({scrollTrigger:{trigger:".collection",start:"top top",end:function(){return "+="+(dist()+window.innerHeight*.3)},pin:true,scrub:.6,anticipatePin:1,invalidateOnRefresh:true}})
  .to(track,{x:function(){return -dist()},ease:"none",duration:1},0)
  .to("#trackBar",{scaleX:1,ease:"none",duration:1},0)
  .fromTo(".col-title span",{xPercent:0},{xPercent:function(i){return i?-6:6},ease:"none",duration:1},0);

/* quote */
gsap.to(".q .qw",{opacity:1,stagger:.1,ease:"none",scrollTrigger:{trigger:".quote",start:"top 70%",end:"bottom 65%",scrub:.5}});

/* motif zoom */
gsap.to(".motif-media img",{scale:1,ease:"none",scrollTrigger:{trigger:".motif",start:"top bottom",end:"bottom bottom",scrub:.5}});
gsap.from(".motif-copy > *",{opacity:0,y:30,stagger:.12,duration:.8,scrollTrigger:{trigger:".motif-copy",start:"top 85%"}});

/* bijoya: words part around the image and fill with colour */
gsap.timeline({scrollTrigger:{trigger:".bijoya",start:"top top",end:"+=120%",pin:true,scrub:.6,anticipatePin:1}})
  .fromTo("#bijoyaFig",{scale:.5,rotation:-6},{scale:1,rotation:0,ease:"power2.out",duration:1},0)
  .fromTo(".bw-1",{x:0},{x:function(){return window.innerWidth>=1024?-window.innerWidth*.04:-window.innerWidth*.06},ease:"none",duration:1},0)
  .fromTo(".bw-2",{x:0},{x:function(){return window.innerWidth>=1024?window.innerWidth*.04:window.innerWidth*.06},ease:"none",duration:1},0)
  .fromTo(".bw-1",{"--fill":"0%"},{"--fill":"100%",ease:"none",duration:.6},.15)
  .fromTo(".bw-2",{"--fill":"0%"},{"--fill":"100%",ease:"none",duration:.6},.35)
  .fromTo(".bijoya-cap",{opacity:0,y:16},{opacity:1,y:0,duration:.2},.8);

/* express: scroll-driven marquee */
gsap.fromTo(".mq-1 .mq-in",{xPercent:0},{xPercent:-35,ease:"none",scrollTrigger:{trigger:".express",start:"top bottom",end:"bottom top",scrub:.4}});
gsap.fromTo(".mq-2 .mq-in",{xPercent:-35},{xPercent:0,ease:"none",scrollTrigger:{trigger:".express",start:"top bottom",end:"bottom top",scrub:.4}});
gsap.fromTo(".ex-fig img",{yPercent:-12},{yPercent:0,ease:"none",scrollTrigger:{trigger:".ex-fig",start:"top bottom",end:"bottom top",scrub:.4}});
gsap.from(".ex-fig",{clipPath:"inset(30% 20% 30% 20% round 200px)",duration:1.2,ease:"power3.out",scrollTrigger:{trigger:".ex-fig",start:"top 80%"}});

/* gifts + visit soft reveals */
$$(".gift-copy, .visit-copy").forEach(function(el){gsap.from(el.children,{opacity:0,y:24,stagger:.07,duration:.7,scrollTrigger:{trigger:el,start:"top 85%"}})});
$$(".gift-media img, .visit-media img").forEach(function(im){gsap.fromTo(im,{scale:1.25},{scale:1,ease:"none",scrollTrigger:{trigger:im,start:"top bottom",end:"bottom top",scrub:.4}})});

/* legacy */
gsap.timeline({scrollTrigger:{trigger:".legacy",start:"top 70%",end:"center 50%",scrub:.6}})
  .fromTo(".lg",{yPercent:60,opacity:0},{yPercent:0,opacity:1,stagger:.3})
  .fromTo(".legacy .btn",{opacity:0,y:20},{opacity:1,y:0},"-=.2");

/* footer letters rise */
gsap.to(".foot-big span",{yPercent:-100,stagger:.07,duration:.9,ease:"power3.out",scrollTrigger:{trigger:".foot",start:"top 85%",toggleActions:"play none none reverse"}});

window.addEventListener("load",function(){ScrollTrigger.refresh()});
})();
