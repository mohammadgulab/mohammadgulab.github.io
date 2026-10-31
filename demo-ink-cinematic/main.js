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

if(!hasG){ document.documentElement.classList.add('nojs-anim'); return; }
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});

/* ---------- smooth scroll (wheel only; touch stays native) ---------- */
var lenis=null;
if(!reduce && window.Lenis){
  lenis = new Lenis({lerp:0.09, smoothWheel:true});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function(t){ lenis.raf(t*1000); });
  gsap.ticker.lagSmoothing(0);
}
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){ var id=a.getAttribute('href'); if(id.length<2) return; var el=document.querySelector(id); if(!el) return; e.preventDefault();
    var y = id==='#top' ? 0 : el;
    if(lenis) lenis.scrollTo(y,{duration:1.4}); else window.scrollTo({top: y===0?0:el.getBoundingClientRect().top+scrollY, behavior: reduce?'auto':'smooth'}); });
});

/* ---------- ink drips (SVG, built to the stage's real pixel size) ---------- */
var svgNS='http://www.w3.org/2000/svg', drips=$('#drips'), stage=$('#stage');
function rnd(a,b){return a+Math.random()*(b-a)}
function buildDrips(){
  var w=stage.clientWidth, h=stage.clientHeight; drips.setAttribute('viewBox','0 0 '+w+' '+h);
  while(drips.firstChild) drips.removeChild(drips.firstChild);
  var g=document.createElementNS(svgNS,'g'); g.setAttribute('id','dripG'); g.setAttribute('fill','#0e0a0a');
  var body=document.createElementNS(svgNS,'rect'); body.setAttribute('x',-20); body.setAttribute('y',-h*1.3); body.setAttribute('width',w+40); body.setAttribute('height',h*1.3+2); g.appendChild(body);
  // wavy lower edge of the ink mass
  for(var x=-10;x<w+30;x+=rnd(18,42)){ var c=document.createElementNS(svgNS,'circle'); c.setAttribute('cx',x); c.setAttribute('cy',rnd(-4,6)); c.setAttribute('r',rnd(12,30)); g.appendChild(c); }
  var n=Math.max(9,Math.round(w/42)), maxL=0, list=[];
  for(var i=0;i<n;i++){
    var cx=(i+rnd(0.15,0.85))*(w/n), rw=rnd(7,w>700?26:18), L=rnd(h*0.12,h*0.62); maxL=Math.max(maxL,L+rw*1.4);
    var dg=document.createElementNS(svgNS,'g'); dg.setAttribute('class','drip');
    var p=document.createElementNS(svgNS,'path');
    // tapered column with a round bulb at the tip
    var b=rw*1.25, y0=-2;
    p.setAttribute('d','M'+(cx-rw*1.6)+' '+y0+' C'+(cx-rw*0.9)+' '+(y0+10)+' '+(cx-rw*0.8)+' '+(y0+L*0.4)+' '+(cx-rw*0.7)+' '+(y0+L-b)+
      ' A'+b+' '+b+' 0 1 0 '+(cx+rw*0.7)+' '+(y0+L-b)+' C'+(cx+rw*0.8)+' '+(y0+L*0.4)+' '+(cx+rw*0.9)+' '+(y0+10)+' '+(cx+rw*1.6)+' '+y0+' Z');
    dg.appendChild(p); g.appendChild(dg); list.push(dg);
    if(Math.random()<0.45){ var dot=document.createElementNS(svgNS,'circle'); dot.setAttribute('cx',cx+rnd(-3,3)); dot.setAttribute('cy',L+b*2.2+rnd(4,26)); dot.setAttribute('r',rnd(3,b*0.7)); dot.setAttribute('class','drop'); dg.appendChild(dot); }
  }
  drips.appendChild(g);
  return {g:g, drips:list, h:h, maxL:maxL};
}

/* ---------- master timeline ---------- */
var tl=null, chNum=$('#chNum'), chBar=$('#chBar'), lastCh=-1;
var marks=[0,0.235,0.45,0.685,0.9];
function chapterAt(p){ var c=0; for(var i=0;i<marks.length;i++) if(p>=marks[i]) c=i; return c; }
function build(){
  var D=buildDrips(), vw=stage.clientWidth, vh=stage.clientHeight;
  gsap.set(['#moonWrap','#ring'],{x:0,y:0,xPercent:-50,yPercent:-50});
  gsap.set('#coinWrap',{x:0,y:0,xPercent:-50,yPercent:-50});
  tl = gsap.timeline({defaults:{ease:'none'}, scrollTrigger:{trigger:'#film', start:'top top', end:'bottom bottom', scrub: reduce?true:0.7,
    onUpdate:function(st){ var p=st.progress; chBar.style.transform='scaleX('+p.toFixed(3)+')'; var c=chapterAt(p); if(c!==lastCh){ if(lastCh!==-1) hit(); lastCh=c; chNum.textContent='0'+(c+1);} }}});
  // 1 THE COIN
  tl.to('#hint',{autoAlpha:0,duration:0.25},0)
    .fromTo('.wall',{scale:1.15},{scale:1,duration:1.5,ease:'power1.out'},0)
    .fromTo('#hand',{x:-vw*0.08,y:-vh*0.85,rotation:-8},{x:0,y:0,rotation:0,duration:1.3,ease:'power2.out'},0)
    .to('#title',{y:-60,autoAlpha:0,duration:0.7},0.25)
    .fromTo('#c1a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},0.8)
    .to('#hand',{y:function(){return Math.min(vw*0.4,vh*0.4,300)*0.32},rotation:2,duration:0.3,ease:'power1.inOut'},1.3)
    .to('#coin',{rotation:14,duration:0.3},1.3)
    .fromTo('#c1b',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},1.4)
    .to('#hand',{y:-vh*0.9,rotation:-6,duration:0.75,ease:'power2.in'},1.7)
    .to('#coinWrap',{y:-vh*0.9+Math.min(vw*0.4,vh*0.4,300)*0.0,rotation:-10,duration:0.75,ease:'power2.in'},1.7)
    .fromTo('#splash',{scale:0,rotation:-25},{scale:1,rotation:10,duration:0.8,ease:'power2.out'},1.75)
    .to(['#c1a','#c1b'],{autoAlpha:0,duration:0.25},1.85)
  // 2 THE MOON: circle window opens, then zoom through it
    .fromTo('#s2',{clipPath:'circle(0% at 50% 56%)'},{clipPath:'circle(80% at 50% 56%)',duration:0.8,ease:'power2.inOut'},2.3)
    .fromTo('#moonWrap',{scale:0.35},{scale:1,duration:0.9,ease:'power2.out'},2.3)
    .fromTo('#ring',{scale:0.2,autoAlpha:0},{scale:1,autoAlpha:1,duration:0.9,ease:'power2.out'},2.3)
    .fromTo('#sam',{yPercent:45},{yPercent:0,duration:0.8,ease:'power2.out'},2.8)
    .fromTo('#c2t',{autoAlpha:0},{autoAlpha:1,duration:0.2},2.9)
    .fromTo('#c2a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},3.15)
    .fromTo('#k2',{autoAlpha:0,y:40},{autoAlpha:0.92,y:0,duration:0.4},3.0)
    .to(['#c2t','#c2a','#k2'],{autoAlpha:0,duration:0.2},3.75)
    .to('#moonWrap',{scale:9,duration:0.9,ease:'power2.in'},3.75)
    .to('#ring',{scale:9.5,duration:0.9,ease:'power2.in'},3.75)
    .to('#sam',{yPercent:40,duration:0.7,ease:'power2.in'},3.75)
    .to('#s2w',{opacity:1,duration:0.3,ease:'power1.in'},4.3)
  // 3 INK DRIP WIPE (black ink pours down over the white moon)
    .fromTo(D.g,{y:-(D.maxL+20)},{y:D.h+10,duration:1.05,ease:'power1.in'},4.55)
    .fromTo(D.drips,{scaleY:0.35,transformOrigin:'50% 0%'},{scaleY:1.5,duration:1.05,stagger:{each:0.012,from:'random'},ease:'power1.in'},4.55)
    .fromTo('#plume',{yPercent:-110},{yPercent:110,duration:1.1,ease:'power1.in'},4.5)
  // 4 THE GAZE: manga panels slide in
    .set('#s3',{visibility:'visible'},5.6)
    .fromTo('#p1',{xPercent:-112},{xPercent:0,duration:0.55,ease:'power3.out'},5.62)
    .fromTo('#p2',{yPercent:112},{yPercent:0,duration:0.55,ease:'power3.out'},5.9)
    .fromTo('#p3',{xPercent:112},{xPercent:0,duration:0.55,ease:'power3.out'},6.15)
    .fromTo('.panel img',{scale:1.35},{scale:1,duration:1.5,ease:'power1.out'},5.62)
    .fromTo('#c3t',{autoAlpha:0},{autoAlpha:1,duration:0.2},5.75)
    .fromTo('#c3a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},6.2)
    .fromTo('#c3b',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},6.6)
  // 5 THE HALL: diagonal ink wipe, then zoom down the corridor
    .fromTo('#s4',{clipPath:'polygon(0% 0%, 0% 0%, -25% 100%, 0% 100%)'},{clipPath:'polygon(0% 0%, 130% 0%, 105% 100%, 0% 100%)',duration:0.75,ease:'power2.inOut'},7.0)
    .fromTo('#edge',{x:-vw*0.25},{x:vw*1.15,duration:0.75,ease:'power2.inOut'},7.0)
      .fromTo('#torii',{scale:1.08},{scale:(vw>vh?2.4:3.4),duration:1.9,ease:'power1.in'},7.2)
    .fromTo('#c4t',{autoAlpha:0},{autoAlpha:1,duration:0.2},7.45)
    .fromTo('#c4a',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},7.7)
    .fromTo('#k4',{autoAlpha:0,y:40},{autoAlpha:0.95,y:0,duration:0.4},7.8)
    .fromTo('#c4b',{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:0.3},8.15)
    .to(['#c4t','#c4a','#c4b','#k4'],{autoAlpha:0,duration:0.2},8.75)
  // 6 END CARD
    .to('#flash',{opacity:1,duration:0.3,ease:'power2.in'},8.85)
    .set('#s5',{visibility:'visible'},9.15)
    .to('#flash',{opacity:0,duration:0.4,ease:'power2.out'},9.15)
    .fromTo('.jump',{scale:1.18},{scale:1,duration:0.85,ease:'power2.out'},9.15)
    .fromTo('.end > *',{autoAlpha:0,y:30},{autoAlpha:1,y:0,duration:0.35,stagger:0.08},9.35)
    .to({},{duration:0.15},10.05);
}
build();
// rebuild on a real width change (rotation / desktop resize), not on the mobile URL bar
var lastW=window.innerWidth, rt=null;
window.addEventListener('resize',function(){ if(Math.abs(window.innerWidth-lastW)<2) return; lastW=window.innerWidth; clearTimeout(rt); rt=setTimeout(function(){
  var p = tl && tl.scrollTrigger ? tl.scrollTrigger.progress : 0;
  if(tl){ tl.scrollTrigger.kill(); tl.kill(); }
  gsap.set('#s1 *, #s2, #s2 *, #plume, #s3, #s3 *, #s4, #s4 *, #s5, #s5 *, #flash, #title, #hint',{clearProps:'all'});
  build(); ScrollTrigger.refresh();
},200); });
window.addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
