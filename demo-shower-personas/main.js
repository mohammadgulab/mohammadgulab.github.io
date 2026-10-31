
(function(){
'use strict';
var P=window.P||[], N=P.length;
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ---------- FOG ---------- */
var hero=$('#hero'), img=$('#heroImg'), cv=$('#fog'), ctx=cv.getContext('2d');
var tex=document.createElement('canvas'), tctx=tex.getContext('2d');
var mask=document.createElement('canvas'), mctx=mask.getContext('2d');
var cw=0, ch=0, sc=1, ready=false, dirty=0, visible=true, hint=$('#hint'), userWiped=false, autoDone=false, lastWipe=0, drips=[];
function coverRect(iw,ih,w,h,px,py){var s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;return [(w-dw)*px,(h-dh)*py,dw,dh];}
function rnd(a,b){return a+Math.random()*(b-a);}
function blurInto(dst,src,k){ // blur by down/up sampling in two passes
  var w=dst.canvas.width,h=dst.canvas.height,t1=document.createElement('canvas'),t2=document.createElement('canvas');
  t1.width=Math.max(2,Math.round(w/k)); t1.height=Math.max(2,Math.round(h/k)); t2.width=Math.max(2,Math.round(w/(k*2))); t2.height=Math.max(2,Math.round(h/(k*2)));
  var c1=t1.getContext('2d'), c2=t2.getContext('2d'); c1.imageSmoothingEnabled=c2.imageSmoothingEnabled=true;
  c1.drawImage(src,0,0,t1.width,t1.height); c2.drawImage(t1,0,0,t2.width,t2.height); c1.clearRect(0,0,t1.width,t1.height); c1.drawImage(t2,0,0,t1.width,t1.height);
  dst.imageSmoothingEnabled=true; dst.imageSmoothingQuality='high'; dst.drawImage(t1,0,0,w,h);
}
function build(){
  var r=hero.getBoundingClientRect(); if(!r.width||!img.naturalWidth) return;
  sc=Math.min(window.devicePixelRatio||1,2)*0.5; if(r.width>1000) sc=Math.min(sc,0.6); sc=Math.max(sc,0.5);
  cw=Math.max(2,Math.round(r.width*sc)); ch=Math.max(2,Math.round(r.height*sc));
  cv.width=tex.width=mask.width=cw; cv.height=tex.height=mask.height=ch;
  // the photo as the object-fit:cover image shows it
  var ph=document.createElement('canvas'); ph.width=cw; ph.height=ch; var pc=ph.getContext('2d');
  var cr=coverRect(img.naturalWidth,img.naturalHeight,cw,ch,0.5,0.18); pc.drawImage(img,cr[0],cr[1],cr[2],cr[3]);
  tctx.clearRect(0,0,cw,ch); blurInto(tctx,ph,10);
  // steam: cool milky haze, denser at the top where hot air collects
  var g=tctx.createLinearGradient(0,0,0,ch); g.addColorStop(0,'rgba(226,234,238,0.86)'); g.addColorStop(.45,'rgba(214,225,231,0.74)'); g.addColorStop(1,'rgba(190,204,212,0.70)');
  tctx.fillStyle=g; tctx.fillRect(0,0,cw,ch);
  // uneven condensation: soft brighter and darker patches
  var i,x,y,rr,bg;
  for(i=0;i<26;i++){ x=rnd(0,cw); y=rnd(0,ch); rr=rnd(.12,.35)*Math.max(cw,ch); bg=tctx.createRadialGradient(x,y,0,x,y,rr);
    var lite=Math.random()<.6; bg.addColorStop(0,lite?'rgba(245,249,251,.22)':'rgba(120,140,150,.10)'); bg.addColorStop(1,'rgba(0,0,0,0)'); tctx.fillStyle=bg; tctx.fillRect(x-rr,y-rr,rr*2,rr*2); }
  // micro mist dots
  var n=Math.round(cw*ch/38);
  for(i=0;i<n;i++){ x=rnd(0,cw); y=rnd(0,ch); rr=rnd(.35,1.0)*sc*1.6; tctx.fillStyle='rgba(255,255,255,'+rnd(.08,.28).toFixed(2)+')'; tctx.fillRect(x,y,rr,rr); }
  // beads: bright top-left, dark rim bottom-right, like real water drops
  n=Math.round(cw*ch/(900*sc*sc));
  for(i=0;i<n;i++){ x=rnd(0,cw); y=rnd(0,ch); var big=Math.random()<.12; rr=(big?rnd(3,7):rnd(1.1,2.6))*sc*2*(.5+.5*Math.random());
    tctx.fillStyle='rgba(60,74,82,'+(big?.28:.18)+')'; tctx.beginPath(); tctx.ellipse(x+rr*.15,y+rr*.22,rr,rr*1.08,0,0,6.283); tctx.fill();
    bg=tctx.createRadialGradient(x-rr*.3,y-rr*.35,0,x,y,rr); bg.addColorStop(0,'rgba(255,255,255,.95)'); bg.addColorStop(.35,'rgba(232,240,244,.55)'); bg.addColorStop(1,'rgba(200,214,222,.15)');
    tctx.fillStyle=bg; tctx.beginPath(); tctx.ellipse(x,y,rr*.92,rr,0,0,6.283); tctx.fill(); }
  mctx.globalCompositeOperation='source-over'; mctx.fillStyle='#000'; mctx.fillRect(0,0,cw,ch);
  ready=true; dirty=2; render();
}
function render(){
  ctx.globalCompositeOperation='source-over'; ctx.clearRect(0,0,cw,ch); ctx.drawImage(tex,0,0);
  ctx.globalCompositeOperation='destination-in'; ctx.drawImage(mask,0,0);
}
function dab(x,y,r){
  var g=mctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.55,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
  mctx.fillStyle=g; mctx.beginPath(); mctx.arc(x,y,r,0,6.283); mctx.fill();
}
var strokes={};
function brush(){ var w=cw/sc; return (w<700?46:(w<1100?58:66))*sc; }
function wipeTo(cx,cy,id){
  if(!ready) return;
  var r=cv.getBoundingClientRect(), x=(cx-r.left)/r.width*cw, y=(cy-r.top)/r.height*ch, rad=brush();
  mctx.globalCompositeOperation='destination-out';
  var p=strokes[id];
  if(p){ var dx=x-p.x, dy=y-p.y, d=Math.sqrt(dx*dx+dy*dy), steps=Math.max(1,Math.ceil(d/(rad*.22))); for(var s=1;s<=steps;s++) dab(p.x+dx*s/steps,p.y+dy*s/steps,rad);
    if(d>4 && drips.length<40 && Math.random()<.08) drips.push({x:x+rnd(-.6,.6)*rad,y:y+rad*.8,v:rnd(.2,.6)*sc,r:rnd(.9,1.6)*sc,life:rnd(30,90)}); }
  else dab(x,y,rad);
  strokes[id]={x:x,y:y}; lastWipe=performance.now(); dirty=1;
}
function endStroke(id){ delete strokes[id]; }
function userWipe(){ if(!userWiped){userWiped=true; hint.classList.add('gone');} }
// touch + pen: the glass owns the gesture (touch-action:none on the canvas), so a swipe wipes instead of scrolling
var activeIds={};
cv.addEventListener('pointerdown',function(e){
  if(e.pointerType==='mouse' && e.button!==0) return;
  activeIds[e.pointerId]=1; try{cv.setPointerCapture(e.pointerId);}catch(_){}
  endStroke('p'+e.pointerId); wipeTo(e.clientX,e.clientY,'p'+e.pointerId); if(e.pointerType!=='mouse'||autoDone) userWipe();
});
cv.addEventListener('pointermove',function(e){
  var down=activeIds[e.pointerId]; if(!down && e.pointerType!=='mouse') return;
  var list=(e.getCoalescedEvents&&e.getCoalescedEvents())||[]; if(!list.length) list=[e];
  for(var k=0;k<list.length;k++) wipeTo(list[k].clientX,list[k].clientY,'p'+e.pointerId);
  if(down || autoDone) userWipe();
});
function up(e){ delete activeIds[e.pointerId]; endStroke('p'+e.pointerId); }
cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') endStroke('p'+e.pointerId); });
// belt and braces for older Android browsers: never let a finger on the glass start a scroll
cv.addEventListener('touchstart',function(e){ if(e.cancelable) e.preventDefault(); },{passive:false});
cv.addEventListener('touchmove',function(e){ if(e.cancelable) e.preventDefault(); },{passive:false});
cv.addEventListener('contextmenu',function(e){ e.preventDefault(); });
function loop(now){
  requestAnimationFrame(loop);
  if(!ready||!visible) return;
  var changed=false;
  if(drips.length){ mctx.globalCompositeOperation='destination-out'; mctx.fillStyle='rgba(0,0,0,.3)';
    for(var k=drips.length-1;k>=0;k--){ var q=drips[k]; q.y+=q.v; q.v=Math.min(q.v*1.01,2.2*sc); q.x+=rnd(-.25,.25)*sc; q.life--; mctx.beginPath(); mctx.arc(q.x,q.y,q.r,0,6.283); mctx.fill(); if(q.life<=0||q.y>ch) drips.splice(k,1); }
    changed=true; }
  var idle=now-lastWipe;
  if(lastWipe && idle>6000 && dirty>0){ // the steam slowly comes back
    mctx.globalCompositeOperation='source-over'; mctx.fillStyle='rgba(0,0,0,'+(idle<9000?0.006:0.014)+')'; mctx.fillRect(0,0,cw,ch); changed=true;
    if(idle>16000) dirty=0; }
  if(changed||dirty===1){ render(); if(dirty===1) dirty=2; }
}
requestAnimationFrame(loop);
if('IntersectionObserver' in window){ new IntersectionObserver(function(en){ visible=en[0].isIntersecting; },{threshold:0}).observe(hero); }
function autoWipe(){
  if(reduce){autoDone=true;return;}
  var r=cv.getBoundingClientRect(), t0=performance.now(), dur=1700, w=r.width, h=r.height;
  var small=w<700, fx=0.5, fy=small?0.26:0.34, ax=small?0.30:0.14, ay=small?0.07:0.09;
  var prevE=0;
  function pt(e){ var seg=Math.min(2,Math.floor(e*3)), a=e*3-seg; if(e>=1){seg=2;a=1;}
    var dir=seg%2===0?1:-1, row=fy+(seg-1)*ay;
    return [r.left+w*(fx-dir*ax+2*dir*ax*a), r.top+h*(row+Math.sin(a*3.14)*0.012)]; }
  (function step(now){
    var k=Math.min(1,(now-t0)/dur), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    for(var s=prevE; s<=e; s+=0.008){ var q=pt(s); wipeTo(q[0],q[1],'auto'+Math.min(2,Math.floor(s*3))); }
    prevE=e;
    if(k<1) requestAnimationFrame(step); else { strokes={}; autoDone=true; }
  })(t0);
}
window.__fog={alpha:function(x0,y0,x1,y1){ // QA helper: mean fog alpha (0..1) in a viewport rectangle
  var r=cv.getBoundingClientRect(), a=Math.round((x0-r.left)/r.width*cw), b=Math.round((y0-r.top)/r.height*ch), c=Math.round((x1-r.left)/r.width*cw), d=Math.round((y1-r.top)/r.height*ch);
  var px=ctx.getImageData(a,b,Math.max(1,c-a),Math.max(1,d-b)).data, s=0; for(var i=3;i<px.length;i+=4) s+=px[i]; return s/(px.length/4)/255; }, ready:function(){return ready;}};
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
    li.innerHTML='<img src="img/bottle-'+p.k+'.webp?v=3" alt=""><span class="nm"><b style="color:'+p.c+'">'+p.n+'</b><small>'+p.no+' &middot; SAR '+p.p+'</small></span><button class="rm" type="button" aria-label="Remove '+p.n+'">Remove</button>';
    li.querySelector('.rm').addEventListener('click',function(){ bag.splice(idx,1); renderBag(); }); list.appendChild(li); });
  totalEl.textContent='SAR '+sum;
}
function add(i,btn){
  bag.push(i); renderBag();
  toast.textContent='Added '+P[i].n+' to your bag'; toast.classList.add('on'); clearTimeout(tt); tt=setTimeout(function(){toast.classList.remove('on')},1800);
  if(btn&&btn.classList.contains('btn-add')){ btn.classList.add('done'); btn.textContent='Added'; setTimeout(function(){btn.classList.remove('done'); btn.textContent='Add to bag';},1300); }
}
$$('[data-add]').forEach(function(b){ b.addEventListener('click',function(){ add(+b.getAttribute('data-add'),b); }); });
function openBag(o){ if(o){toast.classList.remove('on');} drawer.classList.toggle('open',o); scrim.classList.toggle('on',o); drawer.setAttribute('aria-hidden',o?'false':'true'); if(lenis){ o?lenis.stop():lenis.start(); } }
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
var roomsEl=$('#rooms'), dip=document.createElement('div'); dip.className='dip'; stage.insertBefore(dip,$('.stage-shade'));
// The stage is position:sticky (CSS), so the browser itself keeps it, and the bottle, still.
// Nothing below ever moves the bottle: only opacity of the stacked bottle images changes.
var tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:roomsEl,start:'top top',end:function(){return '+='+Math.max(1,roomsEl.offsetHeight-stage.offsetHeight);},scrub:0.6,invalidateOnRefresh:true,
  onUpdate:function(s){ setActive(Math.min(N-1,Math.max(0,Math.round(s.progress*(N-1))))); }}});
tl.set({},{},0);
for(var i=1;i<N;i++){
  var t=i-1+0.18, DU=0.64;
  tl.to(rooms[i-1],{opacity:0,scale:1.08,duration:DU,ease:'power1.in'},t)
    .fromTo(rooms[i],{opacity:0,scale:1.12},{opacity:1,scale:1.0,duration:DU,ease:'power1.out'},t+DU*0.25)
    .fromTo(dip,{opacity:0},{keyframes:[{opacity:.62,duration:DU*.5,ease:'sine.in'},{opacity:0,duration:DU*.5,ease:'sine.out'}]},t)
    .to(stage,{'--accent':P[i].c,duration:DU},t)
    .to(bottles[i-1],{opacity:0,duration:DU*.5,ease:'sine.inOut'},t+DU*.25)
    .fromTo(bottles[i],{opacity:0},{opacity:1,duration:DU*.5,ease:'sine.inOut'},t+DU*.25)
    .to(names[i-1],{opacity:0,y:-40,duration:DU*.45},t)
    .fromTo(names[i],{opacity:0,y:60},{opacity:1,y:0,duration:DU*.5},t+DU*.5)
    .to(infos[i-1],{autoAlpha:0,y:-16,duration:DU*.4},t)
    .fromTo(infos[i],{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:DU*.45},t+DU*.55);
}
tl.set({},{},N-1);
// gentle idle float on bottle

dots.forEach(function(d){ d.addEventListener('click',function(){ var st=tl.scrollTrigger, k=+d.getAttribute('data-go'); scrollToY(st.start+(st.end-st.start)*k/(N-1)+1); }); });

// shop
gsap.utils.toArray('.card').forEach(function(c,k){ gsap.from(c,{y:50,opacity:0,duration:.8,ease:'power3.out',delay:(k%5)*.06,scrollTrigger:{trigger:c,start:'top 92%',once:true}}); });
// closing
gsap.fromTo('.closing-img',{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:'.closing',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('.closing h2 span',{yPercent:100,opacity:0,duration:1,ease:'power3.out',stagger:.12,scrollTrigger:{trigger:'.closing',start:'top 40%',once:true}});
window.addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
