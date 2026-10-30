(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const body=document.body, nav=$('#nav');
const goContact=()=>{const c=$('#contact'); if(c) c.scrollIntoView({behavior:'smooth'});};

/* ---------- menu ---------- */
const burger=$('#burger'), menu=$('#menu');
const setMenu=o=>{body.classList.toggle('menu-open',o);burger.setAttribute('aria-expanded',o);menu.setAttribute('aria-hidden',!o);};
burger.addEventListener('click',()=>setMenu(!body.classList.contains('menu-open')));
$$('#menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

/* ---------- nav theme ---------- */
const secs=$$('[data-theme]').filter(s=>s!==nav);
const navTheme=()=>{const y=34;for(const s of secs){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){nav.dataset.theme=s.dataset.theme;break;}}nav.classList.toggle('scrolled',scrollY>20);};
addEventListener('scroll',navTheme,{passive:true});navTheme();

/* ---------- torch ---------- */
const tb=$('#torchBtn'), hb=$('#subject'), tl=$('#torchLayer');
tb.addEventListener('click',()=>{const on=!body.classList.contains('torch-on');body.classList.toggle('torch-on',on);tb.setAttribute('aria-pressed',on);
  if(on){const r=hb.getBoundingClientRect();if(r.bottom<100||r.top>innerHeight*.5)hb.scrollIntoView({behavior:'smooth'});}});
const moveTorch=e=>{const r=hb.getBoundingClientRect();tl.style.setProperty('--mx',(e.clientX-r.left)+'px');tl.style.setProperty('--my',(e.clientY-r.top)+'px');};
hb.addEventListener('pointermove',moveTorch);hb.addEventListener('pointerdown',moveTorch);

/* ---------- pull rope ---------- */
const stage=$('#stage'), hire=$('#hire'), ropes=$('#ropes'), hand=$('#hand');
const NS='http://www.w3.org/2000/svg';
const tips=$$('.tip',hand);
const paths=tips.map(()=>{const p=document.createElementNS(NS,'path');ropes.appendChild(p);return p;});
let W=0,H=0,rest={x:0,y:0},bw=0,bh=0,L0=[];
let off={x:0,y:0},vel={x:0,y:0},drag=null,moved=0,maxPull=0,handOff={x:0,y:0};
const mobile=()=>innerWidth<=560;
function layout(){
  const r=stage.getBoundingClientRect();W=r.width;H=r.height;bw=hire.offsetWidth;bh=hire.offsetHeight;
  let cx=W*(mobile()?0.66:0.74), cy=H*(mobile()?0.2:0.34);
  cx=Math.min(Math.max(cx,bw/2+6),W-bw/2-6); cy=Math.max(cy,bh/2+4);
  rest={x:cx,y:cy};
  const a=attach(rest.x,rest.y), t=tipPts(0,0);
  L0=t.map((p,i)=>Math.hypot(a[i].x-p.x,a[i].y-p.y)*1.1);
}
function tipPts(){const sr=stage.getBoundingClientRect();return tips.map(c=>{const b=c.getBoundingClientRect();return{x:b.left+b.width/2-sr.left,y:b.top+b.height/2-sr.top};});}
function attach(x,y){const ang=[172,155,138,121,104];return ang.map(d=>{const a=d*Math.PI/180;return{x:x+Math.cos(a)*(bw/2-10),y:y+Math.sin(a)*(bh/2-5)};});}
const rubber=(d,lim)=>{const s=Math.sign(d),a=Math.abs(d);return s*lim*(1-1/(a/lim*0.9+1));};
let t0=performance.now();
function frame(now){
  const t=(now-t0)/1000;
  if(!drag){ // spring back
    const k=0.085,c=0.2; vel.x+=-k*off.x-c*vel.x; vel.y+=-k*off.y-c*vel.y; off.x+=vel.x; off.y+=vel.y;
  }
  const idle=drag?0:1;
  const bx=rest.x+off.x+Math.sin(t*1.3)*3*idle, by=rest.y+off.y+Math.cos(t*1.1)*4*idle;
  const dist=Math.hypot(off.x,off.y);
  // hand gets tugged along when pulled
  const tug=Math.min(dist/220,1);
  const tx=off.x*0.12, ty=off.y*0.12;
  handOff.x+=(tx-handOff.x)*0.25; handOff.y+=(ty-handOff.y)*0.25;
  hand.style.transform=`translate(${handOff.x}px,${handOff.y}px) rotate(${(off.y*0.02 - Math.max(off.x,0)*0.01).toFixed(2)}deg)`;
  hire.style.transform=`translate(${bx-bw/2}px,${by-bh/2}px) rotate(${(off.x*0.03).toFixed(2)}deg)`;
  hire.classList.toggle('taut',dist>120);
  const tp=tipPts(), ap=attach(bx,by);
  paths.forEach((p,i)=>{
    const a=tp[i],b=ap[i]; const d=Math.hypot(b.x-a.x,b.y-a.y); const L=L0[i]||d;
    const sag=d<L?Math.sqrt(L*L-d*d)*0.62:0;
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2+sag+Math.sin(t*1.7+i)*1.5*idle;
    p.setAttribute('d',`M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
    p.style.strokeWidth=(1.8-Math.min(tug,1)*0.5).toFixed(2);
  });
  requestAnimationFrame(frame);
}
hire.addEventListener('pointerdown',e=>{
  try{hire.setPointerCapture(e.pointerId);}catch(_){}
  drag={sx:e.clientX,sy:e.clientY,ox:off.x,oy:off.y};moved=0;maxPull=0;vel={x:0,y:0};
});
hire.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; moved=Math.max(moved,Math.hypot(dx,dy));
  off.x=rubber(drag.ox+dx,260); off.y=rubber(drag.oy+dy,200);
  maxPull=Math.max(maxPull,Math.hypot(off.x,off.y));
});
const end=e=>{
  if(!drag)return; drag=null;
  if(moved<7){goContact();return;}
  if(maxPull>120){setTimeout(goContact,420);}
};
hire.addEventListener('pointerup',end);hire.addEventListener('pointercancel',end);
hire.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goContact();}});
// expose for QA
window.__pull=(x,y)=>{drag={sx:0,sy:0,ox:0,oy:0};off.x=rubber(x,260);off.y=rubber(y,200);};
window.__release=()=>{drag=null;};
addEventListener('resize',layout);
(document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>{layout();});
layout();requestAnimationFrame(frame);
// gentle intro tug so people see it moves
new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){setTimeout(()=>{if(!drag){vel.x=9;vel.y=4;}},500);o.disconnect();}},{threshold:.4}).observe(stage);

/* ---------- v5: progress bar ---------- */
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const bar=$('#progress i');
const prog=()=>{const m=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${m>0?Math.min(scrollY/m,1):0})`;};
addEventListener('scroll',prog,{passive:true});addEventListener('resize',prog);prog();

/* ---------- WebGL fallback guard ---------- */
const h3=$('.hero3d');
setTimeout(()=>{if(h3&&!h3.classList.contains('gl-ready'))h3.classList.add('no-gl');},5000);

/* ---------- split text ---------- */
$$('[data-split]').forEach(el=>{const txt=el.textContent;el.textContent='';
  const w=document.createElement('span');w.className='wd';
  [...txt].forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c;w.appendChild(s);});el.appendChild(w);});
$$('.w-title .heavy,.t-title .heavy,.ab-h .heavy,.ct-title .heavy').forEach(el=>{el.setAttribute('data-split-w','');const words=el.textContent.trim().split(/\s+/);el.textContent='';
  words.forEach((wd,i)=>{const o=document.createElement('span');o.className='wd';const n=document.createElement('span');n.className='wi';n.textContent=wd;o.appendChild(n);el.appendChild(o);if(i<words.length-1)el.appendChild(document.createTextNode(' '));});});

/* ---------- custom cursor (desktop) ---------- */
if(fine&&!reduce){
  document.documentElement.classList.add('has-cursor');
  const d=$('#curDot'),r=$('#curRing');let mx=-100,my=-100,rx=-100,ry=-100;
  addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mx=e.clientX;my=e.clientY;d.style.transform=`translate(${mx}px,${my}px)`;},{passive:true});
  const loop=()=>{rx+=(mx-rx)*.18;ry+=(my-ry)*.18;r.style.transform=`translate(${rx}px,${ry}px)`;requestAnimationFrame(loop);};loop();
  document.addEventListener('pointerover',e=>{r.classList.toggle('big',!!e.target.closest('a,button,.hire'));});
  document.addEventListener('mouseleave',()=>{mx=my=-100;});
}

/* ---------- magnetic buttons ---------- */
if(fine&&!reduce){
  $$('.mag').forEach(b=>{const t=$('.mag-t',b);
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
      b.style.transform=`translate(${x*.28}px,${y*.38}px)`;if(t)t.style.transform=`translate(${x*.12}px,${y*.16}px)`;});
    b.addEventListener('pointerleave',()=>{b.style.transform='';if(t)t.style.transform='';});});
}

/* ---------- 3D tilt cards (mouse + touch) ---------- */
if(!reduce){
  $$('.tilt').forEach(el=>{
    const set=(cx,cy,on)=>{const r=el.getBoundingClientRect();const px=(cx-r.left)/r.width,py=(cy-r.top)/r.height;
      const ry=(px-.5)*14,rx=(.5-py)*12;
      el.style.transform=on?`perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.02)`:'';
      el.style.setProperty('--gx',(px*100).toFixed(1)+'%');el.style.setProperty('--gy',(py*100).toFixed(1)+'%');el.style.setProperty('--go',on?1:0);};
    el.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')set(e.clientX,e.clientY,true);});
    el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')set(0,0,false);});
    el.addEventListener('touchstart',e=>{const t=e.touches[0];set(t.clientX,t.clientY,true);},{passive:true});
    el.addEventListener('touchmove',e=>{const t=e.touches[0];set(t.clientX,t.clientY,true);},{passive:true});
    const off=()=>setTimeout(()=>set(0,0,false),120);
    el.addEventListener('touchend',off,{passive:true});el.addEventListener('touchcancel',off,{passive:true});
  });
}

/* ---------- carousel ---------- */
const row=$('#carRow'),prev=$('#carPrev'),next=$('#carNext'),dotsBox=$('#carDots'),count=$('#carCount');
if(row){
  const cards=$$('.m-card',row);const total=cards.length;const pad=n=>String(n).padStart(2,'0');
  const dots=cards.map((c,i)=>{const b=document.createElement('button');b.type='button';b.className='car-dot';b.setAttribute('aria-label','Go to project '+(i+1));
    b.addEventListener('click',()=>go(i));dotsBox.appendChild(b);return b;});
  const step=()=>cards[1]?cards[1].offsetLeft-cards[0].offsetLeft:row.clientWidth;
  const go=i=>{i=Math.max(0,Math.min(total-1,i));row.scrollTo({left:cards[i].offsetLeft-cards[0].offsetLeft,behavior:reduce?'auto':'smooth'});};
  const cur=()=>Math.round(row.scrollLeft/step());
  prev.addEventListener('click',()=>go(cur()-1));next.addEventListener('click',()=>go(cur()+1));
  const upd=()=>{const max=row.scrollWidth-row.clientWidth-2;let i=cur();if(row.scrollLeft>=max)i=total-1;i=Math.max(0,Math.min(total-1,i));
    dots.forEach((d,k)=>d.classList.toggle('on',k===i));count.textContent=pad(i+1)+' / '+pad(total);
    prev.disabled=row.scrollLeft<4;next.disabled=row.scrollLeft>=max;
    if(!reduce){const rr=row.getBoundingClientRect();cards.forEach(c=>{const b=c.getBoundingClientRect();const off=(b.left+b.width/2-(rr.left+rr.width/2))/rr.width;
      const im=c.querySelector('.m-img img');if(im)im.style.setProperty('--px',(-off*28).toFixed(1)+'px');});}};
  row.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});addEventListener('resize',upd);upd();
  row.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(cur()+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(cur()-1);}});
}

/* ---------- GSAP ---------- */
if(!window.gsap||!window.ScrollTrigger||reduce)return;
gsap.registerPlugin(ScrollTrigger);
// hero 3d intro: name letters rise one by one
const intro=gsap.timeline({delay:.15});
intro.from('.h3-k',{y:16,opacity:0,duration:.6,ease:'power3.out'})
  .from('.h3-name .l1 .ch',{yPercent:110,rotate:8,duration:.9,ease:'expo.out',stagger:.035},'-=.35')
  .from('.h3-name .l2 .ch',{yPercent:110,rotate:8,duration:1,ease:'expo.out',stagger:.05},'-=.75')
  .from('.h3-name .l3 .ch',{yPercent:110,opacity:0,duration:.9,ease:'expo.out',stagger:.04},'-=.7')
  .from('.h3-role > *',{y:22,opacity:0,stagger:.1,duration:.7,ease:'power3.out'},'-=.55')
  .from('.h3-cta > *',{y:22,opacity:0,stagger:.08,duration:.6,ease:'back.out(2)'},'-=.45')
  .from(['.h3-hint','.scroll-cue'],{opacity:0,duration:.6},'-=.3');
// hero 3d text drifts as you scroll away
gsap.to('.h3-name',{yPercent:-22,ease:'none',scrollTrigger:{trigger:'.hero3d',start:'top top',end:'bottom top',scrub:true}});
gsap.to('.h3-name .l3',{xPercent:12,ease:'none',scrollTrigger:{trigger:'.hero3d',start:'top top',end:'bottom top',scrub:true}});
// hero A (pull) enters
gsap.from('.ha-l1',{yPercent:60,opacity:0,duration:1,ease:'expo.out',scrollTrigger:{trigger:'.hero-a',start:'top 70%'}});
gsap.from('.ha-l2',{yPercent:60,opacity:0,duration:1,ease:'expo.out',delay:.15,scrollTrigger:{trigger:'.hero-a',start:'top 70%'}});
gsap.from(['.hero-a .kicker','.hint','.plain'],{y:20,opacity:0,duration:.8,stagger:.08,delay:.3,scrollTrigger:{trigger:'.hero-a',start:'top 70%'}});
gsap.from(['#hand','#hire'],{x:-80,opacity:0,duration:1.1,ease:'power3.out',delay:.25,scrollTrigger:{trigger:'.hero-a',start:'top 60%'}});
gsap.to('.ha-inner',{yPercent:18,scale:.94,opacity:.35,ease:'none',scrollTrigger:{trigger:'.hero-b',start:'top bottom',end:'top top',scrub:true}});
// hero B: motion-blur name reveal
const tlB=gsap.timeline({scrollTrigger:{trigger:'.hero-b',start:'top 65%'}});
tlB.from('.hb-full',{opacity:0,y:14,duration:.5})
   .fromTo('#bigName',{xPercent:-38,scaleX:1.5,opacity:0,filter:'blur(22px)'},{xPercent:0,scaleX:1,opacity:1,filter:'blur(0px)',duration:1.05,ease:'expo.out'},'<.05')
   .from('.circle-tag',{scale:0,rotate:-90,duration:.6,ease:'back.out(2)'},'-=.45')
   .from('.yblock',{scaleY:0,transformOrigin:'top',duration:.8,ease:'expo.out'},.1)
   .from('.rsq',{scale:0,duration:.4,ease:'back.out(3)'},'-=.3')
   .from('.me',{y:80,opacity:0,duration:1,ease:'power3.out'},.25)
   .from('.sticker',{y:30,rotate:-16,opacity:0,duration:.6,ease:'back.out(2)'},'-=.4')
   .from(['.hb-role','.hb-intro','.hb-cta'],{y:24,opacity:0,stagger:.08,duration:.6},'-=.6');
gsap.fromTo('.outline-word',{yPercent:-10},{yPercent:10,ease:'none',scrollTrigger:{trigger:'.hero-b',start:'top bottom',end:'bottom top',scrub:true}});
gsap.fromTo('.me',{yPercent:4},{yPercent:-6,ease:'none',scrollTrigger:{trigger:'.hero-b',start:'top bottom',end:'bottom top',scrub:true}});
// word split reveals on section titles
$$('[data-split-w]').forEach(el=>gsap.from($$('.wi',el),{yPercent:115,rotate:4,duration:.9,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:el,start:'top 85%'}}));
// about
gsap.from('.ab-photo',{clipPath:'inset(100% 0 0 0)',duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.about',start:'top 75%'}});
gsap.fromTo('.ab-photo img',{scale:1.2},{scale:1,ease:'none',scrollTrigger:{trigger:'.about',start:'top bottom',end:'bottom top',scrub:true}});
gsap.from('.ab-text > *:not(.ab-h)',{y:30,opacity:0,stagger:.08,duration:.7,scrollTrigger:{trigger:'.about',start:'top 70%'}});
// work
gsap.from('.w-title .serif',{y:40,opacity:0,duration:.9,delay:.15,ease:'power3.out',scrollTrigger:{trigger:'.work',start:'top 70%'}});
$$('.card').forEach((c,i)=>{
  gsap.from(c,{y:90,opacity:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:c,start:'top 88%'}});
  const nxt=$$('.card')[i+1];
  if(nxt) gsap.to(c,{scale:.94,filter:'brightness(.6)',ease:'none',scrollTrigger:{trigger:nxt,start:'top bottom',end:'top 30%',scrub:true}});
  const im=c.querySelector('.c-shot img');
  if(im) gsap.fromTo(im,{yPercent:-6},{yPercent:4,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'bottom top',scrub:true}});
  gsap.from(c.querySelectorAll('.tags li'),{y:16,opacity:0,stagger:.06,duration:.5,ease:'back.out(2)',scrollTrigger:{trigger:c,start:'top 70%'}});
});
gsap.from('.more-head',{y:30,opacity:0,duration:.7,scrollTrigger:{trigger:'.more',start:'top 88%'}});
gsap.from('.m-card',{x:80,opacity:0,stagger:.07,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.more',start:'top 85%'}});
// services
gsap.from('.t-title .serif',{y:60,opacity:0,duration:.9,delay:.12,ease:'expo.out',scrollTrigger:{trigger:'.toolkit',start:'top 70%'}});
gsap.from('.skills li',{x:-60,opacity:0,stagger:.08,duration:.7,ease:'power3.out',scrollTrigger:{trigger:'.skills',start:'top 80%'}});
$$('.skills li').forEach(li=>ScrollTrigger.create({trigger:li,start:'top 62%',end:'bottom 38%',toggleClass:{targets:li,className:'prime'}}));
gsap.fromTo('.band',{rotate:-2.5},{rotate:1.5,ease:'none',scrollTrigger:{trigger:'.band',start:'top bottom',end:'bottom top',scrub:true}});
// last thing
gsap.from('.l-title .w',{scale:2.2,opacity:0,filter:'blur(16px)',stagger:.16,duration:.9,ease:'expo.out',scrollTrigger:{trigger:'.last',start:'top 55%'}});
gsap.from(['.l-sub','.l-name'],{y:30,opacity:0,stagger:.12,duration:.8,delay:.5,scrollTrigger:{trigger:'.last',start:'top 55%'}});
// contact
gsap.from('.ct-card',{y:140,scale:.92,ease:'none',scrollTrigger:{trigger:'.contact',start:'top bottom',end:'top 25%',scrub:true}});
gsap.from(['.ct-title .serif','.ct-actions > *','.ct-list > div'],{y:40,opacity:0,stagger:.08,duration:.8,scrollTrigger:{trigger:'.ct-card',start:'top 70%'}});
addEventListener('load',()=>ScrollTrigger.refresh());
})();
