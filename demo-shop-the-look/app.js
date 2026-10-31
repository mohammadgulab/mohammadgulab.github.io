(function(){
"use strict";
var L=window.LOOKS, N=L.length;
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var stage=$("#stage"), lineup=$("#lineup"), panel=$("#panel"), veil=$("#veil"), itemsEl=$("#items");
var prevBtn=$("#prevBtn"), nextBtn=$("#nextBtn"), cap=$("#cap");
var active=0, mode="line", busy=false, models=[], bag=[], autoT=null, userTouched=false, curScale=1;
var BLUR=[0,2.4,4.4,6.4,8.4], reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function fmt(n){return "SAR "+n.toLocaleString("en-US")}
function isMobile(){return window.innerWidth<=860}
function pad(n){return (n<10?"0":"")+n}
function bundleOf(l){var t=0,b=0;l.items.forEach(function(it){t+=it.price;b+=Math.round(it.price*0.9)});return {total:t,bundle:b}}

/* build line-up */
L.forEach(function(l,i){
  var m=document.createElement("div"); m.className="model"; m.style.aspectRatio=l.w+" / "+l.h;
  m.setAttribute("role","button"); m.setAttribute("tabindex","0"); m.setAttribute("aria-label","Look "+pad(i+1)+", "+l.name);
  m.innerHTML='<div class="shadow"></div><img src="'+l.img+'" alt="Model wearing look '+(i+1)+', '+l.name+'" draggable="false" '+(i<3?'':'loading="eager"')+'><div class="spots"></div>';
  var sp=$(".spots",m);
  l.items.forEach(function(it,j){
    var b=document.createElement("button"); b.className="spot"; b.style.left=it.x+"%"; b.style.top=it.y+"%";
    b.setAttribute("aria-label",(j+1)+". "+it.name); b.dataset.j=j; b.innerHTML="<i>"+(j+1)+"</i>"; b.tabIndex=-1;
    b.addEventListener("click",function(e){e.stopPropagation();focusItem(j,true)});
    b.addEventListener("mouseenter",function(){markItem(j)});
    sp.appendChild(b);
  });
  m._b={v:0}; m._d=0;
  m.addEventListener("click",function(){ if(dragged) return; onModelClick(i)});
  m.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();onModelClick(i)}});
  m.addEventListener("mouseenter",function(){ if(mode==="line"&&i!==active&&!busy) gsap.to(m._b,{v:Math.max(0,BLUR[Math.min(4,Math.abs(m._d))]-2.2),duration:.35,onUpdate:applyBlur,onUpdateParams:[m]}) });
  m.addEventListener("mouseleave",function(){ if(mode==="line"&&i!==active&&!busy) gsap.to(m._b,{v:BLUR[Math.min(4,Math.abs(m._d))],duration:.45,onUpdate:applyBlur,onUpdateParams:[m]}) });
  lineup.appendChild(m); models.push(m);
});
function applyBlur(m){var v=m._b.v; var img=m.children[1]; img.style.filter=v<0.15?"none":"blur("+v.toFixed(2)+"px)"}

/* grid of looks */
var grid=$("#lookGrid");
L.forEach(function(l,i){
  var b=document.createElement("button"); b.className="lg";
  b.innerHTML='<span>'+pad(i+1)+'</span><img src="'+l.img+'" alt="" loading="lazy"><em>'+l.name+'</em>';
  b.addEventListener("click",function(){ stopAuto(); window.scrollTo({top:0,behavior:reduce?"auto":"smooth"}); setTimeout(function(){ if(mode==="look") switchLook(i); else openLook(i)},reduce?50:650)});
  grid.appendChild(b);
});

function offsetOf(i){var d=((i-active)%N+N)%N; if(d>N/2) d-=N; return d}
function spacing(){
  var h=models[0].offsetHeight, avgW=0; L.forEach(function(l){avgW+=h*l.w/l.h}); avgW/=N;
  return isMobile()? avgW*0.7 : avgW*0.8;
}
function lineProps(i){
  var d=offsetOf(i), a=Math.abs(d), sp=spacing();
  return {d:d,x:d*sp,y:0,scale:1-(isMobile()?0.07:0.055)*Math.min(a,4),opacity:a>=4?0:(a===3?0.72:1-0.06*a),blur:BLUR[Math.min(a,4)],z:20-a};
}
function layout(animate,dir){
  models.forEach(function(m,i){
    var p=lineProps(i), jump=Math.abs(p.d-m._d)>N/2-0.5;
    m.style.zIndex=p.z;
    gsap.killTweensOf(m); gsap.killTweensOf(m._b);
    if(!animate){ gsap.set(m,{x:p.x,y:0,xPercent:-50,scale:p.scale,opacity:p.opacity}); m._b.v=p.blur; applyBlur(m); m._d=p.d; return }
    var dur=reduce?0.01:0.95;
    if(jump){
      gsap.set(m,{x:p.x+(p.d>0?60:-60),xPercent:-50,scale:p.scale,opacity:0,y:0});
      gsap.to(m,{x:p.x,opacity:p.opacity,duration:dur*0.8,delay:dur*0.25,ease:"power2.out"});
      m._b.v=p.blur; applyBlur(m);
    } else {
      gsap.to(m,{x:p.x,y:0,xPercent:-50,scale:p.scale,opacity:p.opacity,duration:dur,ease:"power3.inOut"});
      var moved=p.d!==m._d, peak=Math.max(m._b.v,p.blur)+(moved?3.2:0);
      gsap.to(m._b,{keyframes:[{v:peak,duration:dur*0.45,ease:"power2.in"},{v:p.blur,duration:dur*0.55,ease:"power2.out"}],onUpdate:applyBlur,onUpdateParams:[m]});
    }
    m._d=p.d;
    m.setAttribute("aria-current",p.d===0?"true":"false");
  });
}
function updateCap(animate){
  var l=L[active], b=bundleOf(l);
  function set(){ $("#capNum").textContent=pad(active+1); $("#capTot").textContent=pad(N); $("#capName").textContent=l.name; $("#capFrom").textContent=fmt(b.bundle)+" full look"; }
  if(!animate){set();return}
  gsap.timeline().to(["#capName","#capNum"],{y:-10,opacity:0,duration:.22,ease:"power2.in"}).add(set).fromTo(["#capName","#capNum"],{y:12,opacity:0},{y:0,opacity:1,duration:.45,ease:"power3.out",stagger:.05});
}
function go(i,from){
  i=(i%N+N)%N; if(i===active) return;
  active=i; layout(true); updateCap(true);
}
function next(){ if(mode==="look") switchLook(active+1,1); else go(active+1) }
function prev(){ if(mode==="look") switchLook(active-1,-1); else go(active-1) }
function onModelClick(i){
  stopAuto();
  if(mode==="look") return;
  if(i!==active){ go(i); return }
  openLook(i);
}

/* look mode geometry */
function availRect(){
  var vw=window.innerWidth, vh=window.innerHeight, hdr=$("#hdr").offsetHeight;
  if(isMobile()){ var sh=panel.offsetHeight||vh*0.46; return {l:0,r:vw,t:hdr+58,b:vh-sh-22} }
  return {l:0,r:vw-panel.offsetWidth,t:hdr+64,b:vh-34};
}
function targetFor(i){
  var m=models[i], r=stage.getBoundingClientRect(), A=availRect(), l=L[i];
  var floor=parseFloat(getComputedStyle(m).bottom)||0, H=m.offsetHeight, W=H*l.w/l.h;
  var s=Math.min((A.b-A.t)/H,((A.r-A.l)*0.86)/W,1.7);
  var baseCx=r.left+r.width/2, baseB=r.bottom-floor;
  return {x:(A.l+A.r)/2-baseCx,y:A.b-baseB,scale:s,cy:(A.t+A.b)/2-r.top};
}
function showSpots(i,on,delay){
  var sp=$$(".spot",models[i]);
  gsap.killTweensOf(sp);
  sp.forEach(function(b){b.tabIndex=on?0:-1; b.classList.remove("on")});
  if(on) gsap.fromTo(sp,{opacity:0,scale:0},{opacity:1,scale:1/curScale,duration:.5,ease:"back.out(2.2)",stagger:.08,delay:delay||0});
  else gsap.to(sp,{opacity:0,scale:0,duration:.2});
}
function fillPanel(i,animate){
  var l=L[i], b=bundleOf(l);
  function set(){
    $("#pTitle").textContent="Look "+pad(i+1)+" · "+l.name; $("#pDesc").textContent=l.desc;
    itemsEl.innerHTML=l.items.map(function(it,j){
      return '<li class="item" data-j="'+j+'"><span class="n">'+(j+1)+'</span><img src="'+it.thumb+'" alt="'+it.name+' close up" loading="lazy"><div><h3>'+it.name+'</h3><p>'+it.note+'</p><p class="pr">'+fmt(it.price)+'</p></div><button class="add1" aria-label="Add '+it.name+' to bag" data-j="'+j+'">+</button></li>'
    }).join("");
    $("#bSave").textContent="Bundle all "+l.items.length+", save 10%";
    $("#bWas").textContent=fmt(b.total); $("#bNow").textContent=fmt(b.bundle);
    $("#addAll").classList.remove("ok"); $("#addAllTxt").textContent="Add full look to bag";
    itemsEl.scrollTop=0;
    $$(".item",itemsEl).forEach(function(li){
      var j=+li.dataset.j;
      li.addEventListener("mouseenter",function(){markSpot(j)});
      li.addEventListener("mouseleave",function(){markSpot(-1)});
      li.addEventListener("click",function(e){ if(e.target.closest(".add1")) return; focusItem(j,false)});
    });
    $$(".add1",itemsEl).forEach(function(btn){btn.addEventListener("click",function(){addOne(+btn.dataset.j,btn)})});
  }
  if(!animate){set(); gsap.fromTo($$(".item",itemsEl),{y:18,opacity:0},{y:0,opacity:1,duration:.5,stagger:.06,delay:.35,ease:"power3.out"}); return}
  gsap.to([".p-head",".items"],{opacity:0,y:-8,duration:.2,onComplete:function(){set(); gsap.to([".p-head",".items"],{opacity:1,y:0,duration:.35}); gsap.fromTo($$(".item",itemsEl),{y:16,opacity:0},{y:0,opacity:1,duration:.45,stagger:.05,ease:"power3.out"})}});
}
function placeArrows(t){
  if(mode!=="look"){ gsap.set([prevBtn,nextBtn],{clearProps:"top,bottom,right"}); return }
  var top=t.cy-26;
  gsap.set(prevBtn,{top:top,bottom:"auto"});
  gsap.set(nextBtn,{top:top,bottom:"auto",right:isMobile()?8:panel.offsetWidth+24});
}
function openLook(i){
  if(busy) return; stopAuto();
  if(i!==active){ go(i); busy=true; setTimeout(function(){busy=false; openLook(i)},700); return }
  busy=true; mode="look";
  var r=stage.getBoundingClientRect(), hdr=$("#hdr").offsetHeight;
  var y=window.scrollY+r.top-hdr; window.scrollTo({top:Math.max(0,y),behavior:"auto"});
  document.body.classList.add("look","locked");
  fillPanel(i,false);
  panel.classList.add("open"); panel.classList.remove("tall"); panel.setAttribute("aria-hidden","false");
  gsap.to(veil,{autoAlpha:1,duration:.6,ease:"power2.out"});
  gsap.to(cap,{autoAlpha:0,duration:.3});
  requestAnimationFrame(function(){
    var t=targetFor(i); curScale=t.scale; placeArrows(t);
    models.forEach(function(m,k){
      if(k===i) return;
      var d=offsetOf(k);
      gsap.to(m,{x:"+="+(d<0?-90:90),opacity:0,duration:.7,ease:"power3.inOut"});
      gsap.to(m._b,{v:14,duration:.7,onUpdate:applyBlur,onUpdateParams:[m]});
    });
    var m=models[i]; m.style.zIndex=30; models.forEach(function(mm){mm.classList.remove('live')}); m.classList.add('live');
    gsap.to(m,{x:t.x,y:t.y,scale:t.scale,opacity:1,duration:reduce?.01:1.05,ease:"power3.inOut",onComplete:function(){busy=false}});
    gsap.to(m._b,{v:0,duration:.4,onUpdate:applyBlur,onUpdateParams:[m]});
    showSpots(i,true,reduce?0:.8);
  });
}
function switchLook(i,dir){
  i=(i%N+N)%N; if(busy||i===active) return; busy=true;
  dir=dir||(i>active?1:-1);
  var old=models[active]; showSpots(active,false);
  gsap.to(old,{x:"-="+(dir*120),opacity:0,duration:.55,ease:"power2.in"});
  gsap.to(old._b,{v:10,duration:.5,onUpdate:applyBlur,onUpdateParams:[old]});
  active=i; updateCap(false);
  // silently move the rest to their line positions (hidden)
  models.forEach(function(m,k){ if(k===i||m===old) return; var p=lineProps(k); gsap.killTweensOf(m); gsap.set(m,{x:p.x,y:0,scale:p.scale,opacity:0}); m._d=p.d; m._b.v=12; applyBlur(m) });
  var m=models[i], t=targetFor(i); curScale=t.scale; placeArrows(t);
  gsap.killTweensOf(m); m.style.zIndex=30; old.classList.remove('live'); m.classList.add('live');
  gsap.set(m,{x:t.x+dir*140,y:t.y,scale:t.scale,opacity:0}); m._b.v=10; applyBlur(m);
  gsap.to(m,{x:t.x,opacity:1,duration:.75,delay:.3,ease:"power3.out",onComplete:function(){busy=false; models.forEach(function(mm,k){ if(k!==i){var p=lineProps(k); mm._d=p.d}})}});
  gsap.to(m._b,{v:0,duration:.6,delay:.35,onUpdate:applyBlur,onUpdateParams:[m]});
  old._d=lineProps(models.indexOf(old)).d;
  fillPanel(i,true); showSpots(i,true,.75);
}
function closeLook(){
  if(mode!=="look"||busy) return; busy=true; mode="line";
  showSpots(active,false); models.forEach(function(mm){mm.classList.remove('live')});
  panel.classList.remove("open","tall"); panel.setAttribute("aria-hidden","true");
  gsap.to(veil,{autoAlpha:0,duration:.6,delay:.2});
  gsap.to(cap,{autoAlpha:1,duration:.4,delay:.5});
  placeArrows();
  models.forEach(function(m){m._d=99});
  models.forEach(function(m,i){ var p=lineProps(i); m._d=p.d; m.style.zIndex=p.z;
    gsap.killTweensOf(m); gsap.to(m,{x:p.x,y:0,scale:p.scale,opacity:p.opacity,duration:reduce?.01:1,ease:"power3.inOut"});
    gsap.to(m._b,{v:p.blur,duration:.9,onUpdate:applyBlur,onUpdateParams:[m]});
  });
  setTimeout(function(){document.body.classList.remove("look","locked"); busy=false},reduce?20:650);
}
function markSpot(j){ $$(".spot",models[active]).forEach(function(b){b.classList.toggle("on",+b.dataset.j===j)}) }
function markItem(j){ $$(".item",itemsEl).forEach(function(li){li.classList.toggle("on",+li.dataset.j===j)}) }
function focusItem(j,fromSpot){
  markSpot(j); markItem(j);
  var li=$('.item[data-j="'+j+'"]',itemsEl); if(!li) return;
  var top=li.offsetTop-itemsEl.offsetTop-8; itemsEl.scrollTo({top:top,behavior:reduce?"auto":"smooth"});
  if(fromSpot) gsap.fromTo(li,{backgroundColor:"#ffe7c7"},{backgroundColor:"#f4f2ec",duration:1.1,ease:"power2.out",clearProps:"backgroundColor"});
}

/* bag */
var bagCount=$("#bagCount");
function bump(){ bagCount.textContent=bag.length; gsap.fromTo(bagCount,{scale:1.8},{scale:1,duration:.7,ease:"elastic.out(1,.4)"}); renderBag() }
function fly(fromEl){
  if(reduce) return;
  var a=fromEl.getBoundingClientRect(), bEl=$("#bagBtn").getBoundingClientRect();
  var dot=document.createElement("div");
  dot.style.cssText="position:fixed;z-index:90;width:14px;height:14px;border-radius:50%;background:#c8562b;left:"+(a.left+a.width/2-7)+"px;top:"+(a.top+a.height/2-7)+"px;pointer-events:none";
  document.body.appendChild(dot);
  gsap.to(dot,{x:bEl.left+bEl.width/2-(a.left+a.width/2),duration:.75,ease:"power1.inOut"});
  gsap.to(dot,{y:bEl.top+bEl.height/2-(a.top+a.height/2),duration:.75,ease:"back.in(1.6)",onComplete:function(){dot.remove()}});
}
function addOne(j,btn){
  var l=L[active], it=l.items[j];
  bag.push({name:it.name,note:"Look "+pad(active+1),price:it.price,thumb:it.thumb});
  btn.classList.add("done"); btn.textContent="✓"; fly(btn); setTimeout(bump,700);
  toast(it.name+" added to bag");
}
$("#addAll").addEventListener("click",function(){
  var l=L[active], btn=this;
  l.items.forEach(function(it){bag.push({name:it.name,note:"Look "+pad(active+1)+" bundle",price:Math.round(it.price*0.9),thumb:it.thumb})});
  btn.classList.add("ok"); $("#addAllTxt").textContent="Added "+l.items.length+" pieces ✓";
  $$(".add1",itemsEl).forEach(function(b){b.classList.add("done");b.textContent="✓"});
  fly(btn); setTimeout(bump,700);
  toast("Full look "+pad(active+1)+" added · "+fmt(bundleOf(l).bundle));
  gsap.fromTo(btn,{scale:.97},{scale:1,duration:.5,ease:"elastic.out(1,.5)"});
});
function renderBag(){
  var ul=$("#dList"), tot=0;
  if(!bag.length){ul.innerHTML='<li class="d-empty">Your bag is empty. Pick a look from the line-up.</li>'; $("#dTot").textContent=fmt(0); return}
  ul.innerHTML=bag.map(function(b){tot+=b.price;return '<li><img src="'+b.thumb+'" alt=""><div>'+b.name+'<small>'+b.note+'</small></div><strong>'+fmt(b.price)+'</strong></li>'}).join("");
  $("#dTot").textContent=fmt(tot);
}
renderBag();
var drawer=$("#drawer");
$("#bagBtn").addEventListener("click",function(){drawer.classList.add("open");drawer.setAttribute("aria-hidden","false")});
$("#dClose").addEventListener("click",function(){drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true")});
$("#dClear").addEventListener("click",function(){bag=[];bump()});
var toastT; function toast(t){var el=$("#toast"); el.textContent=t; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(function(){el.classList.remove("show")},2000)}

/* menu */
var mb=$("#menuBtn"), mm=$("#mmenu");
function setMenu(o){mb.setAttribute("aria-expanded",o);mm.classList.toggle("open",o);mm.setAttribute("aria-hidden",!o);document.body.classList.toggle("locked",o||mode==="look")}
mb.addEventListener("click",function(){setMenu(mb.getAttribute("aria-expanded")!=="true")});
$$("a",mm).forEach(function(a){a.addEventListener("click",function(){setMenu(false)})});

/* controls */
prevBtn.addEventListener("click",function(){stopAuto();prev()});
nextBtn.addEventListener("click",function(){stopAuto();next()});
$("#shopBtn").addEventListener("click",function(){stopAuto();openLook(active)});
$("#closeLook").addEventListener("click",closeLook); $("#pClose").addEventListener("click",closeLook);
$("#grab").addEventListener("click",function(){panel.classList.toggle("tall")});
document.addEventListener("keydown",function(e){
  if(e.target.tagName==="INPUT") return;
  if(e.key==="ArrowRight"){stopAuto();next()} else if(e.key==="ArrowLeft"){stopAuto();prev()}
  else if(e.key==="Escape"){ if(drawer.classList.contains("open")) $("#dClose").click(); else if(mode==="look") closeLook(); else setMenu(false)}
});
/* swipe */
var sx=0,sy=0,down=false,dragged=false;
stage.addEventListener("pointerdown",function(e){ if(e.target.closest("button")) return; down=true;dragged=false;sx=e.clientX;sy=e.clientY});
stage.addEventListener("pointermove",function(e){ if(!down) return; if(Math.abs(e.clientX-sx)>12&&Math.abs(e.clientX-sx)>Math.abs(e.clientY-sy)) dragged=true});
function endSwipe(e){ if(!down) return; down=false; var dx=e.clientX-sx;
  if(dragged&&Math.abs(dx)>40){ stopAuto(); dx<0?next():prev() }
  setTimeout(function(){dragged=false},30) }
stage.addEventListener("pointerup",endSwipe); stage.addEventListener("pointercancel",function(){down=false;dragged=false});
/* sheet swipe down to collapse / up to expand */
(function(){var y0=null; panel.addEventListener("touchstart",function(e){ if(e.target.closest(".grab,.p-head")) y0=e.touches[0].clientY; else y0=null},{passive:true});
  panel.addEventListener("touchend",function(e){ if(y0===null) return; var dy=e.changedTouches[0].clientY-y0; if(dy<-30) panel.classList.add("tall"); else if(dy>30){ if(panel.classList.contains("tall")) panel.classList.remove("tall"); else closeLook() } y0=null})})();

/* auto advance until the visitor touches anything */
function startAuto(){ if(reduce) return; autoT=setInterval(function(){ if(mode==="line"&&!busy&&!document.hidden) go(active+1) },3600) }
function stopAuto(){ userTouched=true; clearInterval(autoT); autoT=null }
["wheel","touchstart","keydown"].forEach(function(ev){window.addEventListener(ev,function(){ if(!userTouched&&ev!=="wheel") stopAuto() },{passive:true,once:true})});
stage.addEventListener("pointerdown",stopAuto);

/* resize */
var rT; window.addEventListener("resize",function(){clearTimeout(rT);rT=setTimeout(function(){
  if(mode==="look"){ var t=targetFor(active); curScale=t.scale; gsap.set(models[active],{x:t.x,y:t.y,scale:t.scale}); placeArrows(t); $$(".spot",models[active]).forEach(function(b){gsap.set(b,{scale:1/curScale})}); models.forEach(function(m,k){ if(k!==active){var p=lineProps(k); gsap.set(m,{x:p.x,scale:p.scale,opacity:0}); m._d=p.d}}) }
  else layout(false);
},120)});

/* intro */
active=2; layout(false); updateCap(false);
if(!reduce){
  gsap.from(".title .tl",{yPercent:110,duration:1,ease:"power4.out",delay:.1});
  gsap.from(".sub",{opacity:0,y:14,duration:.8,delay:.35});
  gsap.from(models,{y:70,opacity:0,duration:1.1,ease:"power3.out",stagger:{each:.07,from:"center"},delay:.2});
  gsap.from(cap,{opacity:0,y:16,duration:.8,delay:.7});
}
startAuto();
window.__shop={open:openLook,close:closeLook,go:go,next:next,state:function(){return {active:active,mode:mode,bag:bag.length,busy:busy}}};
})();
