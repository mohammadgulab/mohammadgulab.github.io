(function(){
"use strict";
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s){return document.querySelector(s)};
var hasG = !!(window.gsap && window.ScrollTrigger);

/* ---------- sound: generated in the browser, off by default ---------- */
var ctx=null, master=null, on=false, droneOn=false;
function initAudio(){
  var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  var lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=380; lp.connect(master);
  [55, 82.4, 110.3].forEach(function(f,i){ var o=ctx.createOscillator(); o.type= i==2?'triangle':'sawtooth'; o.frequency.value=f; o.detune.value=(i-1)*6; var g=ctx.createGain(); g.gain.value= i==2?0.05:0.09; o.connect(g); g.connect(lp); o.start(); });
  var len=ctx.sampleRate*2, buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0); for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
  var n=ctx.createBufferSource(); n.buffer=buf; n.loop=true; var bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=0.7; var ng=ctx.createGain(); ng.gain.value=0.05; n.connect(bp); bp.connect(ng); ng.connect(master); n.start();
  return true;
}
function hit(){
  if(!on || !ctx) return; var t=ctx.currentTime;
  var o=ctx.createOscillator(), g=ctx.createGain(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(48,t+0.4);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.9,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.7);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+0.75);
}
var exp=$('#exp'), expState=$('#expState');
exp.addEventListener('click',function(){
  on=!on;
  if(on && !ctx && !initAudio()){ on=false; expState.textContent='N/A'; return; }
  exp.setAttribute('aria-pressed', on?'true':'false');
  exp.setAttribute('aria-label','Experience sound, currently '+(on?'on':'off'));
  expState.textContent = on?'ON':'OFF';
  if(ctx){ var t=ctx.currentTime; if(on){ ctx.resume(); master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value,t); master.gain.linearRampToValueAtTime(0.5,t+1.2); setTimeout(hit,120);} else { master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value,t); master.gain.linearRampToValueAtTime(0,t+0.4); setTimeout(function(){ if(!on) ctx.suspend(); },500);} }
});

/* ---------- booking form: honest demo ---------- */
var form=$('#book'), note=$('#note');
form.addEventListener('submit',function(e){ e.preventDefault(); var n=form.n.value.trim();
  note.textContent = n ? 'Thanks, '+n.split(' ')[0]+'. This is a concept demo, so nothing was sent and no class was booked.' : 'Please add your name first.'; });

if(!hasG){ return; }
document.documentElement.classList.add('js-anim');
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});

/* ---------- smooth scroll (wheel only; touch stays native) ---------- */
var lenis=null;
if(!reduce && window.Lenis){
  lenis = new Lenis({lerp:0.1, smoothWheel:true});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t*1000); });
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){ var id=a.getAttribute('href'); if(id.length<2) return; var el=document.querySelector(id); if(!el) return; e.preventDefault();
    var y = id==='#top' ? 0 : el;
    if(lenis) lenis.scrollTo(y,{duration:1.4}); else window.scrollTo({top: y===0?0:el.getBoundingClientRect().top+scrollY, behavior: reduce?'auto':'smooth'}); });
});

/* ---------- ink drips (SVG, built to the moon section's real size) ---------- */
var svgNS='http://www.w3.org/2000/svg', drips=$('#drips'), s2=$('#s2');
function rnd(a,b){return a+Math.random()*(b-a)}
function buildDrips(){
  var w=s2.clientWidth, h=s2.clientHeight; drips.setAttribute('viewBox','0 0 '+w+' '+h);
  while(drips.firstChild) drips.removeChild(drips.firstChild);
  var g=document.createElementNS(svgNS,'g'); g.setAttribute('fill','#0e0a0a');
  var body=document.createElementNS(svgNS,'rect'); body.setAttribute('x',-20); body.setAttribute('y',-h*1.3); body.setAttribute('width',w+40); body.setAttribute('height',h*1.3+2); g.appendChild(body);
  for(var x=-10;x<w+30;x+=rnd(18,42)){ var c=document.createElementNS(svgNS,'circle'); c.setAttribute('cx',x); c.setAttribute('cy',rnd(-4,6)); c.setAttribute('r',rnd(12,30)); g.appendChild(c); }
  var n=Math.max(9,Math.round(w/42)), maxL=0, list=[];
  for(var i=0;i<n;i++){
    var cx=(i+rnd(0.15,0.85))*(w/n), rw=rnd(7,w>700?26:18), L=rnd(h*0.12,h*0.62); maxL=Math.max(maxL,L+rw*1.4);
    var dg=document.createElementNS(svgNS,'g');
    var p=document.createElementNS(svgNS,'path'), b=rw*1.25, y0=-2;
    p.setAttribute('d','M'+(cx-rw*1.6)+' '+y0+' C'+(cx-rw*0.9)+' '+(y0+10)+' '+(cx-rw*0.8)+' '+(y0+L*0.4)+' '+(cx-rw*0.7)+' '+(y0+L-b)+
      ' A'+b+' '+b+' 0 1 0 '+(cx+rw*0.7)+' '+(y0+L-b)+' C'+(cx+rw*0.8)+' '+(y0+L*0.4)+' '+(cx+rw*0.9)+' '+(y0+10)+' '+(cx+rw*1.6)+' '+y0+' Z');
    dg.appendChild(p); g.appendChild(dg); list.push(dg);
    if(Math.random()<0.45){ var dot=document.createElementNS(svgNS,'circle'); dot.setAttribute('cx',cx+rnd(-3,3)); dot.setAttribute('cy',L+b*2.2+rnd(4,26)); dot.setAttribute('r',rnd(3,b*0.7)); dg.appendChild(dot); }
  }
  drips.appendChild(g);
  return {g:g, drips:list, h:h, maxL:maxL};
}

/* ---------- HUD: chapter number + progress through the story ---------- */
var chNum=$('#chNum'), chBar=$('#chBar'), chapterEl=$('#chapter'), grain=$('#grain'), lastCh=-1;
function setCh(c){ if(c===lastCh) return; if(lastCh!==-1) hit(); lastCh=c; chNum.textContent='0'+c; }

var ctxG=null;
function build(){
  ctxG = gsap.context(function(){
  var D=buildDrips(), vw=window.innerWidth, vh=$('#s1').clientHeight;
  var scrub = reduce?true:0.6;
  gsap.set(['#moonWrap','#ring','#coinWrap'],{x:0,y:0,xPercent:-50,yPercent:-50});

  ScrollTrigger.create({trigger:'#story',start:'top top',end:'bottom bottom',
    onUpdate:function(st){ chBar.style.transform='scaleX('+st.progress.toFixed(3)+')'; },
    onToggle:function(st){ chapterEl.classList.toggle('off',!st.isActive); grain.classList.toggle('on',st.isActive); }});
  grain.classList.add('on');
  ['#s1','#s2','#s3','#s4','#s5'].forEach(function(id,i){
    ScrollTrigger.create({trigger:id,start:'top 55%',end:'bottom 55%',onToggle:function(st){ if(st.isActive) setCh(i+1); }});
  });

  /* 1 THE COIN: short pin while the hand takes the coin, then the page moves on */
  var t1=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s1',start:'top top',end:'+=95%',pin:true,anticipatePin:1,scrub:scrub}});
  t1.to('#hint',{autoAlpha:0,duration:0.2},0)
    .fromTo('.wall',{scale:1.15},{scale:1,duration:1.5,ease:'power1.out'},0)
    .fromTo('#hand',{x:-vw*0.08,y:-vh*0.85,rotation:-8},{x:0,y:0,rotation:0,duration:1.2,ease:'power2.out'},0)
    .to('#title',{y:-60,autoAlpha:0,duration:0.6},0.2)
    .fromTo('#c1a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},0.75)
    .to('#hand',{y:function(){return Math.min(vw*0.4,vh*0.4,300)*0.32},rotation:2,duration:0.3,ease:'power1.inOut'},1.2)
    .to('#coin',{rotation:14,duration:0.3},1.2)
    .fromTo('#c1b',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},1.3)
    .to('#hand',{y:-vh*0.9,rotation:-6,duration:0.7,ease:'power2.in'},1.6)
    .to('#coinWrap',{y:-vh*0.9,rotation:-10,duration:0.7,ease:'power2.in'},1.6)
    .fromTo('#splash',{scale:0,rotation:-25},{scale:0.9,rotation:6,duration:0.75,ease:'power2.out'},1.65);
  /* parallax while the coin scene scrolls away under the moon section */
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s2',start:'top bottom',end:'top top',scrub:scrub}})
    .fromTo('.wall',{yPercent:0},{yPercent:-6,immediateRender:false},0).fromTo('#splash',{scale:0.9,rotation:6,yPercent:0},{scale:1.12,rotation:12,yPercent:6,immediateRender:false},0).fromTo(['#c1a','#c1b'],{y:0},{y:-40,immediateRender:false},0);

  /* 2 THE MOON: the circle window opens as the section scrolls in */
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s2',start:'top bottom',end:'top top',scrub:scrub}})
    .fromTo('#moonWrap',{clipPath:'circle(0% at 50% 50%)',scale:0.55},{clipPath:'circle(50% at 50% 50%)',scale:1,duration:1,ease:'power2.out'},0)
    .fromTo('#ring',{scale:0.15,autoAlpha:0},{scale:1,autoAlpha:1,duration:1,ease:'power2.out'},0)
    .fromTo('#dots',{yPercent:-8},{yPercent:6,duration:1},0)
    .fromTo('#sam',{yPercent:50},{yPercent:0,duration:0.6,ease:'power2.out'},0.4)
    .fromTo('#c2t',{autoAlpha:0},{autoAlpha:1,duration:0.15},0.7)
    .fromTo('#k2',{autoAlpha:0,y:50},{autoAlpha:0.92,y:0,duration:0.3},0.65)
    .fromTo('#c2a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.2},0.8);
  /* short pin: push into the moon, then black ink pours down over it */
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s2',start:'top top',end:'+=90%',pin:true,anticipatePin:1,scrub:scrub}})
    .fromTo('#moonWrap',{scale:1},{scale:1.9,duration:1,ease:'power1.in',immediateRender:false},0)
    .fromTo('#ring',{scale:1},{scale:2,duration:1,ease:'power1.in',immediateRender:false},0)
    .fromTo('#sam',{yPercent:0},{yPercent:18,duration:1,immediateRender:false},0)
    .fromTo(['#c2t','#c2a'],{autoAlpha:1},{autoAlpha:0,duration:0.25,immediateRender:false},0.2).fromTo('#k2',{autoAlpha:0.92},{autoAlpha:0,duration:0.25,immediateRender:false},0.2)
    .fromTo(D.g,{y:-(D.maxL+20)},{y:D.h+10,duration:1.1,ease:'power1.in'},0.25)
    .fromTo(D.drips,{scaleY:0.35,transformOrigin:'50% 0%'},{scaleY:1.5,duration:1.1,stagger:{each:0.012,from:'random'},ease:'power1.in'},0.25)
    .fromTo('#plume',{yPercent:-110},{yPercent:110,duration:1.15,ease:'power1.in'},0.2);

  /* 3 THE GAZE: panels slide in one by one as they scroll up, photos drift inside */
  [['#p1',{xPercent:-105}],['#p2',{xPercent:-60,yPercent:30}],['#p3',{xPercent:105}]].forEach(function(p){
    gsap.fromTo(p[0],p[1],{xPercent:0,yPercent:0,ease:'power3.out',scrollTrigger:{trigger:p[0],start:'top 100%',end:'top 70%',scrub:scrub}});
    gsap.fromTo(p[0]+' img',{yPercent:-9,scale:1.25},{yPercent:9,scale:1,ease:'none',scrollTrigger:{trigger:p[0],start:'top bottom',end:'bottom top',scrub:scrub}});
  });
  ['#c3t','#c3a','#c3b'].forEach(function(id){
    gsap.fromTo(id,{autoAlpha:0,y:24},{autoAlpha:1,y:0,ease:'power2.out',scrollTrigger:{trigger:id,start:'top 92%',end:'top 72%',scrub:scrub}});
  });

  /* 4 THE HALL: diagonal ink wipe while it scrolls in, then a short pin down the corridor */
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s4',start:'top bottom',end:'top top',scrub:scrub}})
    .fromTo('#s4in',{clipPath:'polygon(0% 0%, 0% 0%, -25% 100%, 0% 100%)'},{clipPath:'polygon(0% 0%, 130% 0%, 105% 100%, 0% 100%)',duration:1,ease:'power2.inOut'},0)
    .fromTo('#edge',{x:-vw*0.3},{x:vw*1.15,duration:1,ease:'power2.inOut'},0)
    .fromTo('#torii',{scale:1.3,yPercent:-6},{scale:1.08,yPercent:0,duration:1},0);
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#s4',start:'top top',end:'+=100%',pin:true,anticipatePin:1,scrub:scrub}})
    .fromTo('#torii',{scale:1.08},{scale:(vw>vh?2:2.3),duration:2,ease:'power1.in',immediateRender:false},0)
    .fromTo('#c4t',{autoAlpha:0},{autoAlpha:1,duration:0.15},0)
    .fromTo('#c4a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},0.15)
    .fromTo('#k4',{autoAlpha:0,y:40},{autoAlpha:0.95,y:0,duration:0.4},0.35)
    .fromTo('#c4b',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},0.7)
    .to(['#c4t','#c4a','#c4b','#k4'],{autoAlpha:0,duration:0.25},1.6);

  /* 5 END CARD: scrolls in, photo drifts, text rises */
  gsap.fromTo('#jump',{yPercent:-8,scale:1.15},{yPercent:6,scale:1,ease:'none',scrollTrigger:{trigger:'#s5',start:'top bottom',end:'bottom top',scrub:scrub}});
  gsap.fromTo('.end > *',{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:0.6,stagger:0.08,ease:'power2.out',scrollTrigger:{trigger:'#s5',start:'top 45%',toggleActions:'play none none reverse'}});
  });
}
build();
var lastW=window.innerWidth, rt=null;
window.addEventListener('resize',function(){ if(Math.abs(window.innerWidth-lastW)<2) return; lastW=window.innerWidth; clearTimeout(rt); rt=setTimeout(function(){
  if(ctxG) ctxG.revert(); lastCh=-1; build(); ScrollTrigger.refresh();
},200); });
window.addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
