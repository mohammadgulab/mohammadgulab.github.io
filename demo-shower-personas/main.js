
(function(){
'use strict';
var P=window.P||[], N=P.length;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- FOG ---------- */
var hero=$('#hero'), img=$('#heroImg'), cv=$('#fog'), ctx=cv.getContext('2d');
var tex=document.createElement('canvas'), tctx=tex.getContext('2d');
var mask=document.createElement('canvas'), mctx=mask.getContext('2d');
var cw=0, ch=0, sc=1, ready=false, dirty=0, visible=true, frame=0, hint=$('#hint'), userWiped=false;
function coverRect(iw,ih,w,h,px,py){var s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;return [(w-dw)*px,(h-dh)*py,dw,dh];}
function build(){
  var r=hero.getBoundingClientRect(); if(!r.width||!img.naturalWidth) return;
  sc=Math.min(window.devicePixelRatio||1,2)*0.5; if(r.width>1000) sc=Math.min(sc,0.6);
  cw=Math.max(2,Math.round(r.width*sc)); ch=Math.max(2,Math.round(r.height*sc));
  cv.width=tex.width=mask.width=cw; cv.height=tex.height=mask.height=ch;
  var cr=coverRect(img.naturalWidth,img.naturalHeight,cw,ch,0.42,0.22);
  // blur by down/up sampling (works on every browser)
  var tiny=document.createElement('canvas'), k=14; tiny.width=Math.max(2,Math.round(cw/k)); tiny.height=Math.max(2,Math.round(ch/k));
  var tc=tiny.getContext('2d'); tc.imageSmoothingEnabled=true;
  tc.drawImage(img,cr[0]/k,cr[1]/k,cr[2]/k,cr[3]/k);
  tctx.imageSmoothingEnabled=true; tctx.imageSmoothingQuality='high';
  tctx.clearRect(0,0,cw,ch); tctx.drawImage(tiny,0,0,cw,ch);
  // steam haze
  var g=tctx.createLinearGradient(0,0,0,ch); g.addColorStop(0,'rgba(236,241,244,0.80)'); g.addColorStop(.55,'rgba(228,235,239,0.74)'); g.addColorStop(1,'rgba(205,215,221,0.66)');
  tctx.fillStyle=g; tctx.fillRect(0,0,cw,ch);
  // condensation beads
  var n=Math.round(cw*ch/260), i, x, y, rr, bg, big;
  for(i=0;i<n;i++){ x=Math.random()*cw; y=Math.random()*ch; big=Math.random()<.06; rr=(big? 1.8+Math.random()*2.4 : .5+Math.random()*1.1)*sc*2;
    bg=tctx.createRadialGradient(x-rr*.35,y-rr*.4,0,x,y,rr); bg.addColorStop(0,'rgba(255,255,255,'+(big?.55:.35)+')'); bg.addColorStop(.6,'rgba(220,228,233,.10)'); bg.addColorStop(1,'rgba(70,82,90,'+(big?.30:.16)+')');
    tctx.fillStyle=bg; tctx.beginPath(); tctx.arc(x,y,rr,0,6.283); tctx.fill(); }
  mctx.globalCompositeOperation='source-over'; mctx.fillStyle='#000'; mctx.fillRect(0,0,cw,ch);
  ready=true; dirty=2; render();
}
function render(){
  ctx.globalCompositeOperation='source-over'; ctx.clearRect(0,0,cw,ch); ctx.drawImage(tex,0,0);
  ctx.globalCompositeOperation='destination-in'; ctx.drawImage(mask,0,0);
}
var last=null;
function dab(x,y,r){
  var g=mctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.55,'rgba(0,0,0,.9)'); g.addColorStop(1,'rgba(0,0,0,0)');
  mctx.fillStyle=g; mctx.beginPath(); mctx.arc(x,y,r,0,6.283); mctx.fill();
}
function wipeTo(cx,cy,id){
  if(!ready) return;
  var r=cv.getBoundingClientRect(), x=(cx-r.left)/r.width*cw, y=(cy-r.top)/r.height*ch;
  var rad=Math.max(cw,ch)*(cw/sc<700?0.07:0.05);
  mctx.globalCompositeOperation='destination-out';
  var p=last&&last.id===id?last:null;
  if(p){ var dx=x-p.x, dy=y-p.y, d=Math.sqrt(dx*dx+dy*dy), steps=Math.max(1,Math.ceil(d/(rad*.3))); for(var s=1;s<=steps;s++) dab(p.x+dx*s/steps,p.y+dy*s/steps,rad); }
  else dab(x,y,rad);
  last={x:x,y:y,id:id}; dirty=1100;
}
function userWipe(){ if(!userWiped){userWiped=true; hint.classList.add('gone');} }
hero.addEventListener('pointermove',function(e){ if(e.pointerType==='mouse'){ wipeTo(e.clientX,e.clientY,'m'); if(autoDone) userWipe(); } });
hero.addEventListener('pointerleave',function(){ last=null; });
hero.addEventListener('touchstart',function(e){ last=null; var t=e.touches[0]; if(t){wipeTo(t.clientX,t.clientY,'t'+t.identifier); userWipe();} },{passive:true});
hero.addEventListener('touchmove',function(e){ for(var i=0;i<e.touches.length;i++){var t=e.touches[i]; wipeTo(t.clientX,t.clientY,'t'+t.identifier);} userWipe(); },{passive:true});
hero.addEventListener('touchend',function(){ last=null; },{passive:true});
function loop(){
  requestAnimationFrame(loop);
  if(!ready||!visible||dirty<=0) return;
  frame++;
  if(frame%4===0){ mctx.globalCompositeOperation='lighter'; mctx.fillStyle='rgba(0,0,0,0.0079)'; mctx.fillRect(0,0,cw,ch); } // ~8 s to fog back
  dirty--; render();
}
requestAnimationFrame(loop);
if('IntersectionObserver' in window){ new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(hero); }
var autoDone=false;
function autoWipe(){
  if(reduce){autoDone=true;return;}
  var r=cv.getBoundingClientRect(), t0=performance.now(), dur=1900, w=r.width, h=r.height;
  var small=w<700, fx=0.52, fy=small?0.27:0.40, ax=small?0.32:0.16, ay=small?0.075:0.085;
  last=null; var prevE=0;
  function pt(e){ var seg=Math.min(2,Math.floor(e*3)), a=e*3-seg; if(e>=1){seg=2;a=1;}
    var dir=seg%2===0?1:-1, row=fy+(seg-1)*ay*1.15;
    return [r.left+w*(fx-dir*ax+2*dir*ax*a), r.top+h*(row+Math.sin(a*3.14)*0.015)]; }
  (function step(now){
    var k=Math.min(1,(now-t0)/dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    for(var s=prevE; s<=e; s+=0.01){ var q=pt(s); wipeTo(q[0],q[1],'auto'+Math.min(2,Math.floor(s*3))); }
    prevE=e;
    if(k<1) requestAnimationFrame(step); else { last=null; autoDone=true; }
  })(t0);
}
function start(){ build(); if(/noauto/.test(location.search)){autoDone=true;return;} setTimeout(autoWipe,700); }
if(img.complete&&img.naturalWidth) start(); else img.addEventListener('load',start);
var rw=window.innerWidth, rto;
window.addEventListener('resize',function(){ if(Math.abs(window.innerWidth-rw)<2&&ready) return; rw=window.innerWidth; clearTimeout(rto); rto=setTimeout(build,200); });

/* ---------- BAG ---------- */
var bag=[], countEl=$('#bagCount'), list=$('#bagList'), totalEl=$('#bagTotal'), drawer=$('#drawer'), scrim=$('#scrim'), toast=$('#toast'), tt;
function renderBag(){
  countEl.textContent=bag.length; countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump');
  var sum=0; list.innerHTML='';
  if(!bag.length){ var e=document.createElement('li'); e.className='empty'; e.textContent='Your bag is empty. Pick a mood.'; list.appendChild(e); }
  bag.forEach(function(i,idx){ var p=P[i]; sum+=p.p; var li=document.createElement('li');
    li.innerHTML='<img src="img/bottle-'+p.k+'.webp" alt=""><span class="nm"><b style="color:'+p.c+'">'+p.n+'</b><small>'+p.no+' &middot; SAR '+p.p+'</small></span><button class="rm" type="button" aria-label="Remove '+p.n+'">Remove</button>';
    li.querySelector('.rm').addEventListener('click',function(){ bag.splice(idx,1); renderBag(); }); list.appendChild(li); });
  totalEl.textContent='SAR '+sum;
}
function add(i,btn){
  bag.push(i); renderBag();
  toast.textContent='Added '+P[i].n+' to your bag'; toast.classList.add('on'); clearTimeout(tt); tt=setTimeout(function(){toast.classList.remove('on')},1800);
  if(btn&&btn.classList.contains('btn-add')){ btn.classList.add('done'); btn.textContent='Added'; setTimeout(function(){btn.classList.remove('done'); btn.textContent='Add to bag';},1300); }
}
$$('[data-add]').forEach(function(b){ b.addEventListener('click',function(){ add(+b.getAttribute('data-add'),b); }); });
function openBag(o){ drawer.classList.toggle('open',o); scrim.classList.toggle('on',o); drawer.setAttribute('aria-hidden',o?'false':'true'); if(lenis){ o?lenis.stop():lenis.start(); } }
$('#bagBtn').addEventListener('click',function(){openBag(true)}); $('#closeBag').addEventListener('click',function(){openBag(false)}); scrim.addEventListener('click',function(){openBag(false)});
document.addEventListener('keydown',function(e){ if(e.key==='Escape') openBag(false); });
renderBag(); countEl.classList.remove('bump');

/* ---------- SCROLL ---------- */
var lenis=null;
if(!window.gsap||!window.ScrollTrigger){ return; }
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});
var QA=/qa/.test(location.search);
if(!reduce && !QA && window.Lenis){
  lenis=new Lenis({lerp:0.1,smoothWheel:true});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t*1000); }); gsap.ticker.lagSmoothing(0);
}
function scrollToY(y){ if(lenis) lenis.scrollTo(y,{duration:1.2}); else window.scrollTo({top:y,behavior:reduce?'auto':'smooth'}); }
$$('a[href^="#"]').forEach(function(a){ a.addEventListener('click',function(e){ var id=a.getAttribute('href'); var el=id.length>1?$(id):null; if(id==='#top'){e.preventDefault(); scrollToY(0); return;} if(el){ e.preventDefault(); scrollToY(el.getBoundingClientRect().top+window.scrollY); } }); });

// hero parallax
gsap.to('#heroMedia',{yPercent:18,scale:1.06,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
gsap.to('.hero-copy',{yPercent:-30,opacity:0,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'70% top',scrub:true}});
gsap.from('.hero h1 span',{yPercent:60,opacity:0,duration:1.1,ease:'power3.out',stagger:.12,delay:.2});

// intro words
var ip=$('.intro p'); if(ip){
  var walk=function(node){ Array.prototype.slice.call(node.childNodes).forEach(function(c){ if(c.nodeType===3){ var f=document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(function(w){ if(!w) return; if(/^\s+$/.test(w)) f.appendChild(document.createTextNode(w)); else { var s=document.createElement('span'); s.className='w'; s.textContent=w; f.appendChild(s);} }); node.replaceChild(f,c);} else walk(c); }); };
  walk(ip);
  gsap.to('.intro .w',{opacity:1,stagger:.08,ease:'none',scrollTrigger:{trigger:'.intro',start:'top 80%',end:'bottom 45%',scrub:true}});
}

// rooms
var stage=$('#stage'), rooms=$$('.room'), bottles=$$('.bottle'), names=$$('.pname'), infos=$$('.pinfo'), dots=$$('.dot'), ctr=$('#ctr'), active=-1;
function setActive(i){
  if(i===active) return; active=i;
  dots.forEach(function(d,k){ d.classList.toggle('on',k===i); });
  ctr.textContent='0'+(i+1);
  document.documentElement.style.setProperty('--accent',P[i].c);
}
setActive(0);
gsap.set(stage,{'--accent':P[0].c});
var tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:stage,start:'top top',end:function(){return '+='+window.innerHeight*(N-1)*1.1;},pin:true,scrub:0.5,anticipatePin:1,invalidateOnRefresh:true,
  snap:QA?false:{snapTo:1/(N-1),directional:true,duration:{min:.25,max:.7},delay:.1,ease:'power2.inOut'},
  onUpdate:function(s){ setActive(Math.round(s.progress*(N-1))); }}});
for(var i=1;i<N;i++){
  var t=i-1;
  tl.to(rooms[t],{opacity:0,scale:1.1,duration:1},t)
    .fromTo(rooms[i],{opacity:0,scale:1.14},{opacity:1,scale:1.0,duration:1},t)
    .to(stage,{'--accent':P[i].c,duration:1},t)
    .to('.bottles',{keyframes:[{scaleX:.78,rotation:-4,y:-14,duration:.5,ease:'power1.in'},{scaleX:1,rotation:0,y:0,duration:.5,ease:'power1.out'}]},t)
    .to(bottles[t],{opacity:0,duration:.3},t+.35)
    .fromTo(bottles[i],{opacity:0},{opacity:1,duration:.3},t+.35)
    .to(names[t],{opacity:0,y:-50,duration:.4},t+.05)
    .fromTo(names[i],{opacity:0,y:70},{opacity:1,y:0,duration:.45},t+.5)
    .to(infos[t],{autoAlpha:0,y:-20,duration:.35},t+.05)
    .fromTo(infos[i],{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:.4},t+.55);
}
// gentle idle float on bottle
if(!reduce) gsap.to('#floatBox',{y:-10,duration:2.4,ease:'sine.inOut',yoyo:true,repeat:-1});
dots.forEach(function(d){ d.addEventListener('click',function(){ var st=tl.scrollTrigger, k=+d.getAttribute('data-go'); scrollToY(st.start+(st.end-st.start)*k/(N-1)+1); }); });

// shop
gsap.utils.toArray('.card').forEach(function(c,k){ gsap.from(c,{y:50,opacity:0,duration:.8,ease:'power3.out',delay:(k%5)*.06,scrollTrigger:{trigger:c,start:'top 92%',once:true}}); });
// closing
gsap.fromTo('.closing-img',{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:'.closing',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('.closing h2 span',{yPercent:100,opacity:0,duration:1,ease:'power3.out',stagger:.12,scrollTrigger:{trigger:'.closing',start:'top 40%',once:true}});
window.addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
