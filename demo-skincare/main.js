// Aurelle v6: photographed porcelain jar, lid lifts on scroll, drifting petals, GSAP reveals
(function(){
const $=id=>document.getElementById(id);
const loader=$('loader');

// bag
let bag=0; const toast=$('toast'), bagEl=document.querySelector('.bag');
document.querySelectorAll('.add').forEach(b=>b.addEventListener('click',()=>{
  bag++; $('bagCount').textContent=bag; bagEl.classList.add('bump'); setTimeout(()=>bagEl.classList.remove('bump'),300);
  const n=b.closest('.card').querySelector('h3').textContent; toast.textContent=n+' added to bag'; toast.classList.add('show');
  b.textContent='Added'; b.classList.add('done'); setTimeout(()=>{b.textContent='Add to bag'; b.classList.remove('done');},1600);
  clearTimeout(toast._t); toast._t=setTimeout(()=>toast.classList.remove('show'),1800);}));
// tap lift on phones
document.querySelectorAll('.card').forEach(c=>{c.addEventListener('touchstart',()=>{c.classList.add('lift'); clearTimeout(c._t); c._t=setTimeout(()=>c.classList.remove('lift'),700);},{passive:true});});

// nav turns solid after the hero starts moving
const nav=$('nav'); const onScroll=()=>nav.classList.toggle('solid',scrollY>30); addEventListener('scroll',onScroll,{passive:true}); onScroll();

// drifting petals (real petal photo)
const pl=$('petals'); const N=innerWidth<760?9:14;
for(let i=0;i<N;i++){const im=new Image(); im.src='img/petal.webp?v=6'; im.alt='';
  const s=18+Math.random()*26, d=11+Math.random()*10;
  im.style.cssText=`left:${Math.random()*100}%;--s:${s}px;--d:${d}s;--dl:${-Math.random()*d}s;--x1:${(Math.random()*120-60)|0}px;--x2:${(Math.random()*160-80)|0}px;--r1:${(Math.random()*240-120)|0}deg;--r2:${(Math.random()*480-240)|0}deg;filter:blur(${s<24?0.6:0}px)`;
  pl.appendChild(im);}

gsap.registerPlugin(ScrollTrigger);
function reveals(){
  gsap.utils.toArray('.hero .reveal').forEach((el,i)=>gsap.from(el,{y:50,opacity:0,duration:1.3,delay:.4+i*.12,ease:'power3.out'}));
  gsap.utils.toArray('.reveal').filter(el=>!el.closest('.hero')).forEach(el=>gsap.from(el,{y:46,opacity:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 96%',toggleActions:'play none none reverse'}}));
  // products slide and fade in, alternating sides
  gsap.utils.toArray('.card').forEach((c,i)=>gsap.from(c,{x:(i%2?40:-40),y:70,opacity:0,rotate:(i%2?2:-2),duration:1.15,ease:'power3.out',delay:(i%2)*.12,scrollTrigger:{trigger:c,start:'top 95%',toggleActions:'play none none reverse'}}));
  gsap.utils.toArray('.ph img').forEach(im=>gsap.fromTo(im,{yPercent:3},{yPercent:-3,ease:'none',scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:true}}));
  const sw=document.querySelector('.swatch img'); if(sw) gsap.fromTo(sw,{yPercent:-18},{yPercent:0,ease:'none',scrollTrigger:{trigger:'.swatch',start:'top bottom',end:'bottom top',scrub:true}});
  gsap.fromTo('.cta-peony',{y:60,rotate:-10},{y:-40,rotate:8,ease:'none',scrollTrigger:{trigger:'.cta',start:'top bottom',end:'bottom top',scrub:true}});
}

const stage=$('stage'), rig=$('rig'), tilt=$('tilt'), jBody=$('jBody'), jLid=$('jLid'), jTop=$('jTop'), pk=$('pk'), pf=$('pf');
// x,y viewport fractions; w jar width px; lid 0 closed..1 lifted; top 0..1 top view; pk back peony; pf front peony
function states(){
  const vw=innerWidth, vh=innerHeight;
  if(vw<760){
    const w=Math.min(vw*0.66,300);
    return [
      {x:.5,y:.36,w:w,     lid:0,top:0,pk:1,  pf:1,r:0},
      {x:.5,y:.38,w:w*.88, lid:1,top:0,pk:0, pf:0,r:-4},
      {x:.5,y:.33,w:w*.74, lid:1,top:0,pk:0,  pf:0,r:0},
      {x:.5,y:.6,w:Math.min(vw*0.62,300),lid:1,top:1,pk:0,pf:0,r:0}];
  }
  const w=Math.max(280,Math.min(vw*0.28,430,vh*0.48));
  return [
    {x:.68,y:.54,w:w,      lid:0,top:0,pk:1, pf:1,r:0},
    {x:.70,y:.54,w:w*1.06, lid:1,top:0,pk:0,pf:0,r:-4},
    {x:.70,y:.52,w:w*.95,  lid:1,top:0,pk:0, pf:0,r:0},
    {x:.50,y:.50,w:w*.95,  lid:1,top:1,pk:0, pf:0,r:0}];
}
const st={...states()[0]}; const intro={k:0}; let tl;
function buildTimeline(){
  if(tl){tl.scrollTrigger.kill(); tl.kill();}
  const A=states(); Object.assign(st,A[0]);
  tl=gsap.timeline({defaults:{ease:'power1.inOut',duration:1},scrollTrigger:{trigger:'main',start:'top top',endTrigger:'#collection',end:'top 60%',scrub:1}});
  for(let i=1;i<A.length;i++) tl.to(st,{...A[i]},i-1);
  tl.to({},{duration:.5});
}
const pointer={x:0,y:0,tx:0,ty:0};
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){pointer.tx=e.clientX/innerWidth-.5; pointer.ty=e.clientY/innerHeight-.5;}});
addEventListener('deviceorientation',e=>{if(e.gamma==null)return; pointer.tx=Math.max(-.5,Math.min(.5,e.gamma/40)); pointer.ty=Math.max(-.5,Math.min(.5,(e.beta-45)/50));});
let lastW=innerWidth,lastH=innerHeight;
addEventListener('resize',()=>{if(innerWidth!==lastW||Math.abs(innerHeight-lastH)>140){lastW=innerWidth;lastH=innerHeight;buildTimeline();ScrollTrigger.refresh();}});
const coll=$('collection'); const t0=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const hide=coll.getBoundingClientRect().top<=0;
  stage.style.visibility=hide?'hidden':'visible'; pl.style.visibility=hide?'hidden':'visible';
  if(hide) return;
  const t=(now-t0)/1000, k=intro.k, vw=innerWidth, vh=innerHeight, h=st.w*732/890;
  pointer.x+=(pointer.tx-pointer.x)*.06; pointer.y+=(pointer.ty-pointer.y)*.06;
  const fy=Math.sin(t*1.15)*st.w*0.03;
  rig.style.width=st.w+'px';
  rig.style.transform=`translate3d(${st.x*vw}px,${st.y*vh+fy+(1-k)*50}px,0) translate(-50%,-50%) scale(${.85+.15*k})`;
  rig.style.opacity=k;
  const ry=Math.sin(t*.5)*6+pointer.x*14, rx=Math.cos(t*.42)*2.5-pointer.y*8;
  tilt.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${st.r}deg)`;
  // lid: idle breath when closed, lifts off and floats on scroll
  const L=st.lid, breathe=(1-L)*Math.max(0,Math.sin(t*0.9))*0.012*h;
  const lf=Math.sin(t*1.6+1)*0.02*h*L;
  jLid.style.transform=`translate3d(${L*0.2*st.w}px,${-L*0.46*h-breathe+lf}px,0) rotate(${-L*13+Math.sin(t*1.3)*L*2}deg)`;
  jLid.style.opacity=1-st.top;
  jBody.style.opacity=1-st.top;
  jBody.style.transform=`scale(${1-.06*st.top})`;
  jTop.style.opacity=st.top; jTop.style.transform=`scale(${.9+.1*st.top}) rotate(${t*4%360}deg)`;
  const px=-pointer.x*18, py=-pointer.y*10;
  pk.style.opacity=st.pk;
  pk.style.transform=`translate(-50%,-50%) translate3d(${px*.6}px,${py*.6+(1-st.pk)*h*.4}px,0) scale(${.9+.1*st.pk}) rotate(${Math.sin(t*.3)*2.5}deg)`;
  pf.style.opacity=st.pf;
  pf.style.transform=`translate3d(${px*1.4}px,${py+(1-st.pf)*h*.8}px,0) rotate(${-12+Math.sin(t*.4)*3}deg)`;
}
function start(){
  buildTimeline(); requestAnimationFrame(frame);
  loader.classList.add('done'); gsap.to(intro,{k:1,duration:1.6,ease:'power3.out'}); reveals(); window.SITE_READY=true;
}
const imgs=[jBody,jLid,pk].map(im=>im.decode?im.decode().catch(()=>{}):Promise.resolve());
Promise.race([Promise.all(imgs),new Promise(r=>setTimeout(r,2500))]).then(start);
})();
