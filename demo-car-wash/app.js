gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const isPhone=()=>innerWidth<900;
const DPR=Math.min(window.devicePixelRatio||1,1.5);

/* ---------- desktop: booking panel lives inside the pinned garage ---------- */
const panel=$('#panel'),dock=$('#dock'),bookIn=$('#bookIn'),bookSec=$('#book');
function placePanel(){
  if(!isPhone()){ if(panel.parentNode!==dock){dock.appendChild(panel);} bookSec.classList.add('docked'); }
  else { if(panel.parentNode!==bookIn){bookIn.appendChild(panel);} bookSec.classList.remove('docked'); }
}
placePanel();

/* ---------- water jet wipe (jagged glowing line, clean car revealed behind it) ---------- */
const clean=$('#clean'),cleanR=$('#cleanR'),jet=$('#jet'),foam=$('#foam'),car=$('#car');
const W={p:0};let tNow=0;
function jag(y,t){return Math.sin(y*23+t*9)*.010+Math.sin(y*57-t*14)*.006+Math.sin(y*131+t*21)*.004+Math.sin(y*7+t*3)*.008}
function drawWash(){
  const p=W.p, x=-0.06+p*1.14, N=46, pts=[], poly=[];
  for(let i=0;i<=N;i++){const y=-0.25+i*(1.5/N);const xx=x+jag(y,tNow)*(p>0&&p<1?1:0);pts.push(xx,y);}
  let s='';for(let i=0;i<pts.length;i+=2){s+=(pts[i]*1000).toFixed(1)+','+(pts[i+1]*1000).toFixed(1)+' ';}
  jet.setAttribute('points',s);foam.setAttribute('points',s);
  let c='polygon(-5% -30%';for(let i=0;i<pts.length;i+=2){c+=','+(pts[i]*100).toFixed(2)+'% '+(pts[i+1]*100).toFixed(2)+'%';}c+=',-5% 130%)';
  clean.style.clipPath=c;clean.style.webkitClipPath=c;
  cleanR.style.clipPath='inset(0 '+(100-Math.max(0,Math.min(100,x*100)))+'% 0 0)';
  const on=p>0.001&&p<0.999?1:0;
  jet.style.opacity=on;foam.style.opacity=on*.9;
}
drawWash();

/* ---------- spray particles from the jet ---------- */
const sc=$('#spray'),sx=sc.getContext('2d');let parts=[];
function sizeCanvas(cv){const r=cv.getBoundingClientRect();cv.width=Math.max(1,r.width*DPR);cv.height=Math.max(1,r.height*DPR);}
function spray(dt){
  const r=car.getBoundingClientRect(),sr=sc.getBoundingClientRect();
  const active=W.p>0.001&&W.p<0.999&&r.width>0;
  if(active){
    const x=-0.06+W.p*1.14;const n=isPhone()?5:9;
    for(let i=0;i<n;i++){const yy=-0.1+Math.random()*1.15;const px=r.left-sr.left+(x+jag(yy,tNow))*r.width,py=r.top-sr.top+yy*r.height;
      parts.push({x:px,y:py,vx:-(40+Math.random()*160),vy:(Math.random()-.6)*120,l:0,L:.35+Math.random()*.5,s:.6+Math.random()*1.8});}
  }
  sx.setTransform(DPR,0,0,DPR,0,0);sx.clearRect(0,0,sc.width,sc.height);
  sx.fillStyle='#eaf7ff';
  parts=parts.filter(q=>{q.l+=dt;q.vy+=380*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;const a=1-q.l/q.L;if(a<=0)return false;sx.globalAlpha=a*.8;sx.beginPath();sx.arc(q.x,q.y,q.s,0,6.283);sx.fill();return true});
  sx.globalAlpha=1;
}

/* ---------- macro: swirl marks + water beads ---------- */
const sw=$('#swirl'),swx=sw.getContext('2d'),dr=$('#drops'),drx=dr.getContext('2d');
function paintSwirls(){
  sizeCanvas(sw);const w=sw.width,h=sw.height;swx.clearRect(0,0,w,h);
  const centers=[[.56*w,.46*h,Math.max(w,h)*.55],[.2*w,.75*h,Math.max(w,h)*.3]];
  for(const [cx,cy,RM] of centers){const n=isPhone()?260:420;
    for(let i=0;i<n;i++){const rr=Math.pow(Math.random(),.8)*RM;const a0=Math.random()*6.283,a1=a0+.15+Math.random()*.9;
      swx.strokeStyle='rgba(230,236,242,'+(.06+Math.random()*.2)*(1-rr/RM*.6)+')';swx.lineWidth=(.5+Math.random()*1.1)*DPR;
      swx.beginPath();swx.arc(cx+(Math.random()-.5)*6*DPR,cy+(Math.random()-.5)*6*DPR,rr,a0,a1);swx.stroke();}}
  const g=swx.createRadialGradient(centers[0][0],centers[0][1],0,centers[0][0],centers[0][1],centers[0][2]*.5);
  g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');swx.fillStyle=g;swx.fillRect(0,0,w,h);
}
let drops=[];
function makeDrops(){sizeCanvas(dr);drops=[];const n=isPhone()?60:120;for(let i=0;i<n;i++){drops.push({x:Math.random(),y:Math.random(),r:(3+Math.pow(Math.random(),2)*18)*(isPhone()?.8:1),d:Math.random()})}}
const D={p:0};
function drawDrops(){
  const w=dr.width,h=dr.height;drx.clearRect(0,0,w,h);if(D.p<=0)return;
  for(const q of drops){const k=Math.max(0,Math.min(1,(D.p-q.d*.7)/.3));if(k<=0)continue;
    const r=q.r*DPR*(.4+.6*k),x=q.x*w,y=q.y*h+(1-k)*-20*DPR;
    const g=drx.createRadialGradient(x-r*.3,y-r*.35,r*.05,x,y,r);
    g.addColorStop(0,'rgba(255,255,255,'+(.95*k)+')');g.addColorStop(.18,'rgba(200,215,230,'+(.35*k)+')');g.addColorStop(.7,'rgba(20,24,28,'+(.25*k)+')');g.addColorStop(1,'rgba(255,255,255,'+(.5*k)+')');
    drx.fillStyle=g;drx.beginPath();drx.arc(x,y,r,0,6.283);drx.fill();
    drx.fillStyle='rgba(0,0,0,'+(.35*k)+')';drx.beginPath();drx.ellipse(x+r*.15,y+r*.9,r*.8,r*.25,0,0,6.283);drx.fill();}
}

/* ---------- intro: lights flicker on, headlights wake (like the reel's first second) ---------- */
const intro=gsap.timeline({delay:.15});
intro.to('.tubes path',{opacity:1,duration:.06,stagger:{each:.07,from:'random'},repeat:1,yoyo:true})
     .to('.tubes path',{opacity:.8,duration:.12,stagger:.05})
     .to('#lamp1,#lamp2',{opacity:1,duration:.12,repeat:2,yoyo:true},'-=.2')
     .to('#lamp1,#lamp2',{opacity:1,duration:.3})
     .from('.t1 .ln>span',{yPercent:110,duration:.9,ease:'power4.out',stagger:.1},.1);

/* ---------- the one scrubbed camera timeline ---------- */
function show(sel,at,tl){tl.fromTo(sel+' .ln>span',{yPercent:110},{yPercent:0,duration:.35,ease:'power3.out',stagger:.08,immediateRender:false},at);}
function hide(sel,at,tl){tl.fromTo(sel+' .ln>span',{yPercent:0},{yPercent:-110,duration:.3,ease:'power2.in',stagger:.05,immediateRender:false},at);}
gsap.set('.t2 .ln>span,.t3 .ln>span,.t4 .ln>span,.t5 .ln>span',{yPercent:110});
let master;
function build(){
  if(master){master.scrollTrigger.kill();master.kill();}
  gsap.set('#rig',{clearProps:'all'});
  const phone=isPhone();
  const zoom=phone?2.5:2.7;
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#stage',start:'top top',end:()=>'+='+Math.round(innerHeight*(phone?8:9.5)),pin:true,scrub:.8,anticipatePin:1,invalidateOnRefresh:true}});
  // 0-1 settle + push in, swap headline
  tl.to('#rig',{scale:1.06,duration:1,ease:'power1.inOut',transformOrigin:'50% 60%'},0)
    .to('#hint',{opacity:0,duration:.3},0);
  hide('.t1',.45,tl); show('.t2',.8,tl);
  // 1-4 the wash: jet travels left to right
  tl.to(W,{p:1,duration:3,ease:'power1.inOut',onUpdate:drawWash},1.05);
  // 4-5.5 look closer: camera dives to the front corner
  hide('.t2',4.0,tl); show('.t3',4.25,tl);
  tl.to('#rig',{scale:zoom,xPercent:phone?-59:-32,yPercent:phone?5:-22,duration:1.5,ease:'power2.inOut'},4.0)
    .to('#lamp1,#lamp2',{opacity:.35,duration:.6},4.0)
    .fromTo('.sheen i',{left:'-20%',opacity:1},{left:'120%',duration:.9,stagger:.12,ease:'power1.inOut'},4.9);
  // 5.6-6 cut to macro of the paint
  tl.to('#macro',{autoAlpha:1,duration:.45},5.6)
    .fromTo('#macro .paint,#bands',{scale:1.25},{scale:1,duration:2.6},5.6)
    .fromTo('#bands',{xPercent:-6},{xPercent:6,duration:2.6},5.6);
  hide('.t3',5.75,tl); show('.t4',6.05,tl);
  // 6.1-7.3 polish band wipes swirls away, left to right
  tl.fromTo('#polish',{xPercent:-120},{xPercent:560,duration:1.2,ease:'power1.inOut'},6.15)
    .fromTo('#swirl',{clipPath:'inset(0 0 0 0%)'},{clipPath:'inset(0 0 0 100%)',duration:1.2,ease:'power1.inOut'},6.15);
  // 7.3-8 water beads on the coating
  tl.to(D,{p:1,duration:.8,onUpdate:drawDrops},7.3);
  hide('.t4',7.45,tl);
  tl.fromTo('.t5 .ln:not(.ln2)>span',{yPercent:110},{yPercent:0,duration:.35,ease:'power3.out',immediateRender:false},7.75);
  // 8-9 pull back out to the whole car, warm
  tl.to('#macro',{autoAlpha:0,duration:.4},8.0)
    .to('#rig',{scale:phone?.96:.9,xPercent:phone?6:-13,yPercent:phone?2:4,duration:1.1,ease:'power2.inOut'},7.95)
    .to('#lamp1,#lamp2',{opacity:1,duration:.4},8.4);
  tl.fromTo('.t5 .ln2>span',{yPercent:110},{yPercent:0,duration:.35,ease:'power3.out',immediateRender:false},8.45);
  // 8.6-9.6 garage door rolls up, sunlight floods the studio
  tl.to('#slats',{yPercent:-100,duration:1,ease:'power1.inOut'},8.6)
    .to('#flood',{opacity:1,duration:1},8.6)
    .to('.wall',{filter:'brightness(1.6)',duration:1},8.6)
    .to('.tubes path',{opacity:.45,duration:.6},8.8);
  // desktop: booking panel slides in from the right on the same shot
  if(!phone){ tl.fromTo('#dock',{xPercent:130,opacity:0},{xPercent:0,opacity:1,duration:.7,ease:'power3.out'},9.4).to({},{duration:.5}); }
  else { tl.to({},{duration:.3}); }
  master=tl;window.__master=tl;
}
build();

/* phone: panel slides in from the right as the booking section arrives */
gsap.matchMedia().add('(max-width:899px)',()=>{
  gsap.fromTo('#panel',{xPercent:40,opacity:0},{xPercent:0,opacity:1,ease:'none',scrollTrigger:{trigger:'#book',start:'top 85%',end:'top 25%',scrub:.6}});
  gsap.fromTo('.bh',{yPercent:40,opacity:0},{yPercent:0,opacity:1,ease:'none',scrollTrigger:{trigger:'#book',start:'top 95%',end:'top 50%',scrub:.6}});
});

/* ---------- loop for the living bits (jet shimmer + spray) ---------- */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;tNow+=dt;
  if(W.p>0.001&&W.p<0.999){drawWash();}
  if(W.p>0.001&&W.p<0.999||parts.length)spray(dt);else if(sc._dirty!==false){sx.clearRect(0,0,sc.width,sc.height);sc._dirty=false;}
  if(W.p>0.001&&W.p<0.999)sc._dirty=true;
  requestAnimationFrame(loop);}
requestAnimationFrame(loop);

function sizeAll(){sizeCanvas(sc);paintSwirls();makeDrops();drawDrops();}
sizeAll();
let lastW=innerWidth;
addEventListener('resize',()=>{if(Math.abs(innerWidth-lastW)<2)return;lastW=innerWidth;placePanel();sizeAll();build();ScrollTrigger.refresh();});

/* nav book button: jump to the end of the story on desktop */
$('#navBook').addEventListener('click',e=>{e.preventDefault();if(!isPhone()&&master){scrollTo({top:master.scrollTrigger.end-2,behavior:'smooth'});}else{$('#book').scrollIntoView({behavior:'smooth'});}});

/* ---------- booking ---------- */
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const dWrap=$('#dates');const now=new Date();
for(let i=1;i<=7;i++){const d=new Date(now);d.setDate(now.getDate()+i);const b=document.createElement('button');b.type='button';b.className='chip date'+(i===1?' on':'');b.dataset.d=days[d.getDay()]+' '+d.getDate();b.innerHTML=`<small>${days[d.getDay()].toUpperCase()}</small>${d.getDate()}`;dWrap.appendChild(b)}
function single(wrap){wrap.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...wrap.children].forEach(c=>c.classList.remove('on'));b.classList.add('on');upd()})}
single($('#pkgs'));single(dWrap);single($('#times'));
function sel(){const p=$('#pkgs .on'),d=$('#dates .on'),t=$('#times .on');return{p:p.dataset.p,v:+p.dataset.v,d:d.dataset.d,t:t.textContent}}
function upd(){$('#price').textContent='SAR '+sel().v.toLocaleString('en-US')}
const card=$('#confirmCard');
$('#confirm').addEventListener('click',()=>{const s=sel();$('#confText').textContent=`${s.p} · ${s.d} · ${s.t} · SAR ${s.v.toLocaleString('en-US')}`;$('#ref').textContent='OBS-'+(1000+Math.floor(Math.random()*8999));
  card.classList.add('on');gsap.fromTo(card,{opacity:0,scale:.9},{opacity:1,scale:1,duration:.45,ease:'back.out(1.8)'});gsap.fromTo('.tick',{scale:0,rotation:-90},{scale:1,rotation:0,duration:.6,delay:.15,ease:'back.out(2.5)'})});
$('#again').addEventListener('click',()=>{gsap.to(card,{opacity:0,duration:.25,onComplete:()=>card.classList.remove('on')})});
addEventListener('load',()=>{ScrollTrigger.refresh();});
window.__story=()=>master&&master.scrollTrigger;
