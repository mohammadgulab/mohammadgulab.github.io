(()=>{
"use strict";
if(("ontouchstart" in window)||matchMedia("(pointer:coarse)").matches)document.documentElement.classList.add("touch");
const cv=document.getElementById('silk'),ctx=cv.getContext('2d');
const clearBtn=document.getElementById('clearBtn'),hudW=document.getElementById('hudWebs'),hudS=document.getElementById('hudStrands'),toastEl=document.getElementById('toast');
const header=document.getElementById('top');
let vw=0,vh=0,dpr=1,L=70,sy=0;
const TAU=Math.PI*2;
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d}

/* ---------- images ---------- */
const bodyImg=new Image(),bodySh=new Image(),legImg=new Image();
bodyImg.src='img/body.webp';bodySh.src='img/body-sh.webp';legImg.src='img/leg.webp';
// body sprite geometry (fractions of sprite): cephalothorax centre and spinnerets, L = 0.894 * sprite height
const CEPH={x:.491,y:.716},SPIN={x:.51,y:.03},LFRAC=.894;

/* ---------- toast ---------- */
let toastT=0;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),2400)}

/* ---------- anchors (real DOM elements) ---------- */
const anchorEls=[...document.querySelectorAll('[data-anchor]')];
const rects=anchorEls.map(()=>({x:0,y:0,w:0,h:0}));
function readRects(){
  for(let i=0;i<anchorEls.length;i++){
    const r=anchorEls[i].getBoundingClientRect(),o=rects[i];
    o.x=r.left;o.y=r.top+sy;o.w=r.width;o.h=r.height;o.vis=r.width>0;
  }
}
// candidate anchor points on an element, as (u,v) fractions of its box
const UVS=[[0,0],[.5,0],[1,0],[1,.5],[1,1],[.5,1],[0,1],[0,.5],[.25,0],[.75,0],[.25,1],[.75,1]];
function resolve(ref){
  if(ref.t===0)return ref;                         // free point {t:0,x,y}
  if(ref.t===1){const r=rects[ref.i];return {x:r.x+ref.u*r.w,y:r.y+ref.v*r.h}} // element point
  const a=resolve(ref.a),b=resolve(ref.b);return {x:lerp(a.x,b.x,ref.f),y:lerp(a.y,b.y,ref.f)}; // along a strand
}

/* ---------- webs ---------- */
// each web is its own object with a build timeline: frames, radials, hub, then the capture spiral
let webs=[],falling=[];
const MAXWEBS=12;
function liveWebs(){let n=0;for(const w of webs)if(w.start!==null&&!w.fading)n++;return n}
function strandCount(){let n=0;for(const w of webs){if(w.start===null)continue;if(w.done){n+=w.strands.length;continue}const T=now-w.start;for(const s of w.strands)if(T>s.t0)n++}return n}
let hudN=-1,hudM=-1;
function updHud(){const n=liveWebs(),m=strandCount();if(n===hudN&&m===hudM)return;hudN=n;hudM=m;
  hudW.textContent=n+(n===1?' web':' webs');hudS.textContent=m+(m===1?' strand':' strands');clearBtn.classList.toggle('has',m>0)}
function clearWebs(){
  const m=strandCount();
  if(!m){toast('No webs yet. Give it a moment.');return}
  let k=0;
  for(const w of webs){if(w.start===null)continue;const T=now-w.start;
    for(const s of w.strands){if(!w.done&&T<=s.t0)continue;if(k++>700)break;const a=resolve(s.a),b=resolve(s.b);
      falling.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,vx:rnd(-30,30),vy:rnd(-40,10),life:1})}}
  webs=[];sp.web=null;sp.mode='rest';sp.restUntil=now+1.4;updHud();
}
clearBtn.addEventListener('click',clearWebs);
addEventListener('keydown',e=>{
  if((e.key==='Delete'||e.key==='Backspace')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();clearWebs()}
  if(e.key==='Escape')closeMenu();
});

/* ---------- pointer ---------- */
// moving pointer = the spider chases; pointer resting ~0.6 s, or a tap = a new web right there
const ptr={cx:-1,cy:-1,x:0,y:0,has:false,down:false,inside:false,mouse:false,moveAt:-99,stX:-999,stY:-999,spun:true,dnT:0,dnX:0,dnY:0};
function setPtr(cx,cy,mouse){ptr.cx=cx;ptr.cy=cy;ptr.x=cx;ptr.y=cy+sy;ptr.has=true;ptr.mouse=mouse;
  if(Math.hypot(ptr.x-ptr.stX,ptr.y-ptr.stY)>9){ptr.stX=ptr.x;ptr.stY=ptr.y;ptr.moveAt=now;ptr.spun=false}}
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen'){ptr.inside=true;setPtr(e.clientX,e.clientY,true)}},{passive:true});
addEventListener('pointerdown',e=>{ptr.dnT=now;ptr.dnX=e.clientX;ptr.dnY=e.clientY;if(e.pointerType!=='touch'){ptr.inside=true;setPtr(e.clientX,e.clientY,true)}},{passive:true});
addEventListener('pointerup',e=>{
  if(now-ptr.dnT<.4&&Math.hypot(e.clientX-ptr.dnX,e.clientY-ptr.dnY)<12&&!(e.target.closest&&e.target.closest('button,a,.menu,.hud'))){
    requestWeb(e.clientX,e.clientY+sy);ptr.spun=true;ptr.stX=e.clientX;ptr.stY=e.clientY+sy;ptr.moveAt=now-1;
  }
},{passive:true});
addEventListener('touchstart',e=>{const t=e.touches[0];if(t){ptr.down=true;setPtr(t.clientX,t.clientY,false)}},{passive:true});
addEventListener('touchmove',e=>{const t=e.touches[0];if(t)setPtr(t.clientX,t.clientY,false)},{passive:true});
addEventListener('touchend',()=>{ptr.down=false},{passive:true});
addEventListener('touchcancel',()=>{ptr.down=false;ptr.spun=true},{passive:true});
document.addEventListener('mouseleave',()=>{ptr.inside=false;ptr.spun=true;ptr.moveAt=-99});
addEventListener('blur',()=>{ptr.inside=false;ptr.spun=true;ptr.moveAt=-99});
addEventListener('scroll',()=>{sy=scrollY;if(ptr.has&&ptr.mouse&&ptr.inside)setPtr(ptr.cx,ptr.cy,true)},{passive:true});

/* ---------- draggable scatter objects ---------- */
document.querySelectorAll('[data-drag]').forEach(el=>{
  let sx=0,syy=0,ox=0,oy=0,id=null;
  el.addEventListener('pointerdown',e=>{
    if(e.button>0)return;id=e.pointerId;el.setPointerCapture(id);el.classList.add('dragging');
    const cur=(el.style.translate||'0px 0px').split(' ').map(parseFloat);ox=cur[0]||0;oy=cur[1]||0;sx=e.clientX;syy=e.clientY;
  });
  el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;el.style.translate=(ox+e.clientX-sx)+'px '+(oy+e.clientY-syy)+'px'});
  const end=e=>{if(e.pointerId!==id)return;id=null;el.classList.remove('dragging')};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
});

/* ---------- menu ---------- */
const menu=document.getElementById('menu'),menuBtn=document.getElementById('menuBtn');
function openMenu(){menu.hidden=false;menuBtn.setAttribute('aria-expanded','true');document.getElementById('menuClose').focus()}
function closeMenu(){if(menu.hidden)return;menu.hidden=true;menuBtn.setAttribute('aria-expanded','false');menuBtn.focus({preventScroll:true})}
menuBtn.addEventListener('click',openMenu);
document.getElementById('menuClose').addEventListener('click',closeMenu);
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuBtn.setAttribute('aria-expanded','false')}));

/* ---------- hold buttons ---------- */
document.querySelectorAll('.hold').forEach(b=>b.addEventListener('click',()=>{
  const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'On hold':'Hold for me';
  if(on)toast('Concept demo: nothing was reserved.');
}));

/* ---------- spider ---------- */
// legs in body units (f = forward, s = lateral), measured from the photographed spider
const LEGS=[[.12,.15,1.05,.42,1.1],[.05,.19,.52,.72,.95],[-.04,.19,-.3,.68,.9],[-.12,.15,-.98,.3,1.0]];
const legs=[];
for(let side=-1;side<=1;side+=2)for(let k=0;k<4;k++){
  const[bf,bs,tf,ts,w]=LEGS[k];
  const reach=Math.hypot(tf-bf,ts-bs);
  legs.push({side,k,bf,bs:bs*side,tf:tf*.98,ts:ts*side*.98,l1:reach*.56,l2:reach*.6,w,group:(k+(side>0?1:0))%2,
    fx:0,fy:0,stepping:false,t:0,dur:.12,sx:0,sy:0,ex:0,ey:0,lift:0});
}
const sp={web:null,head:null,goT:0,fast:false,faceTo:null,x:0,y:0,h:Math.PI/2,v:0,mode:'enter',enterT:0,hang:1,anchorX:0,silkFrom:null,plan:null,restUntil:0,still:0,breath:0,startY:0,targetY:0};
function toWorld(f,s){const c=Math.cos(sp.h),n=Math.sin(sp.h);return {x:sp.x+(c*f-n*s)*L,y:sp.y+(n*f+c*s)*L}}
function plantFeet(){for(const g of legs){const p=toWorld(g.tf,g.ts);g.fx=p.x;g.fy=p.y;g.stepping=false}}

function size(){
  dpr=Math.min(devicePixelRatio||1,2);vw=innerWidth;vh=innerHeight;
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);
  L=clamp(Math.min(vw,vh*1.1)*.18,58,96);
}
let lastW=0;
function onResize(){size();if(lastW&&Math.abs(innerWidth-lastW)>40&&webs.length){webs=[];sp.web=null;if(sp.mode!=='enter')sp.mode='rest';updHud()}lastW=innerWidth}
addEventListener('resize',onResize);

function startEnter(x){
  sp.mode='enter';sp.enterT=0;sp.x=x;sp.startY=sy-L*2.2;sp.y=sp.startY;sp.targetY=sy+clamp(vh*.42,200,420);
  sp.h=Math.PI/2;sp.v=0;sp.hang=1;sp.anchorX=x;sp.web=null;sp.head=null;
  for(const g of legs){const p=toWorld(g.tf*.8,g.ts*.8);g.fx=p.x;g.fy=p.y;g.stepping=false}
}

/* ---------- planning a web on real elements ---------- */
function webR(){return clamp(vw*.34,118,230)}
function gatherPts(top,bot,R){
  const pts=[];
  for(let i=0;i<anchorEls.length;i++){const r=rects[i];if(!r.vis||r.y+r.h<top-R||r.y>bot+R)continue;
    for(const[u,v]of UVS){if((u===.25||u===.75)&&r.w<150)continue;const x=r.x+u*r.w,y=r.y+v*r.h;if(x<3||x>vw-3)continue;pts.push({i,u,v,x,y})}}
  return pts;
}
const NS=12;
function sectorsAt(pts,hx,hy,R){
  const sec=new Array(NS).fill(null),Rmin=R*.32;
  for(const p of pts){const d=Math.hypot(p.x-hx,p.y-hy);if(d<Rmin||d>R)continue;
    const a=Math.atan2(p.y-hy,p.x-hx),k=Math.floor(((a+Math.PI)/TAU)*NS)%NS;
    if(!sec[k]||Math.abs(d-R*.75)<Math.abs(sec[k].d-R*.75))sec[k]={p,d,a}}
  const an=sec.filter(Boolean).sort((a,b)=>a.a-b.a);
  // largest empty angle, so a web never hangs off one side only
  let gap=0;for(let i=0;i<an.length;i++){const g=i?an[i].a-an[i-1].a:an[0].a+TAU-an[an.length-1].a;if(g>gap)gap=g}
  return {an,gap};
}
function minHubDist(hx,hy){let m=1e9;for(const w of webs){if(w.fading)continue;const d=Math.hypot(w.hub.x-hx,w.hub.y-hy);if(d<m)m=d}return m}
function planWeb(target){
  readRects();
  const hh=header?header.offsetHeight:60,top=sy+hh+16,bot=sy+vh-24;
  let R=webR(),best=null;
  const pts=gatherPts(top,bot,R*1.5);
  const tryHub=(hx,hy,RR,bias)=>{
    const {an,gap}=sectorsAt(pts,hx,hy,RR);
    if(an.length<4||gap>2.7)return;
    const md=Math.min(minHubDist(hx,hy),RR*2);
    let ds=0,dm=0;for(const o of an)dm+=o.d;dm/=an.length;for(const o of an)ds+=Math.abs(o.d-dm);ds/=an.length*RR;
    const score=an.length*6-gap*6-ds*30+(target?-bias:md/RR*22-Math.hypot(hx-sp.x,hy-sp.y)/vw*8)+Math.random()*3;
    if(!best||score>best.score)best={score,hx,hy,an,R:RR};
  };
  if(target){
    for(const k of [1,1.3,1.6]){
      const RR=R*k;
      tryHub(target.x,target.y,RR,0);
      for(const rr of [18,36,60,90])for(let a=0;a<8;a++){const ang=a/8*TAU+rr;tryHub(target.x+Math.cos(ang)*rr,target.y+Math.sin(ang)*rr,RR,rr*.25)}
      if(best)break;
    }
  }else{
    for(let n=0;n<70;n++)tryHub(rnd(26,vw-26),rnd(top+10,bot-10),R*rnd(.85,1.15),0);
  }
  if(!best)return null;
  return buildWeb(best);
}
function rayHit(hx,hy,ang,A,B){ // ray from hub at angle vs segment A-B -> f on segment
  const dx=Math.cos(ang),dy=Math.sin(ang),ex=B.x-A.x,ey=B.y-A.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-6)return -1;
  const t=((A.x-hx)*ey-(A.y-hy)*ex)/den,f=((A.x-hx)*dy-(A.y-hy)*dx)/den;return t>0?f:-1;
}
function buildWeb(b){
  const hub={t:0,x:b.hx,y:b.hy},n=b.an.length;
  const an=b.an.map(o=>({ref:{t:1,i:o.p.i,u:o.p.u,v:o.p.v},ang:o.a,x:o.p.x,y:o.p.y}));
  const frames=[],rad=[];
  for(let i=0;i<n;i++){
    const A=an[i],B=an[(i+1)%n];let g=B.ang-A.ang;if(g<=0)g+=TAU;
    rad.push({ref:A.ref,ang:A.ang});
    if(g<2.5){
      frames.push({a:A.ref,b:B.ref});
      const extra=Math.max(0,Math.ceil(g/.44)-1);
      for(let k=1;k<=extra;k++){const ang=A.ang+g*(k+rnd(-.18,.18))/(extra+1),f=rayHit(b.hx,b.hy,ang,A,B);
        if(f>.04&&f<.96)rad.push({ref:{t:2,a:A.ref,b:B.ref,f},ang:ang>Math.PI?ang-TAU:ang,gapAfter:false})}
    }
  }
  rad.sort((p,q)=>p.ang-q.ang);
  const m=rad.length;
  // which neighbouring radials are bridged (no bridge across the open side of the web)
  for(let i=0;i<m;i++){let g=rad[(i+1)%m].ang-rad[i].ang;if(g<=0)g+=TAU;rad[i].ok=g<1.2}
  const S=[];let t=0;
  // 1) bridge and frame threads
  for(const f of frames){S.push({a:f.a,b:f.b,kind:'frame',t0:t,dur:.11});t+=.04}
  t+=.05;
  // 2) radials, laid alternating across the hub like a real orb weaver
  const stride=Math.max(1,Math.round(m/2)-(m%2?0:1)),seen=new Set();let j=0;
  for(let k=0;k<m;k++){while(seen.has(j))j=(j+1)%m;seen.add(j);S.push({a:hub,b:rad[j].ref,kind:'radial',t0:t,dur:.16,ang:rad[j].ang});t+=clamp(.8/m,.035,.07);j=(j+stride)%m}
  t+=.12;
  // 3) small tight hub spiral
  const hubSeg=Math.round(m*1.5);
  for(let q=0;q<hubSeg;q++){const r0=rad[q%m],r1=rad[(q+1)%m];if(!r0.ok){continue}
    const f0=.15-.07*(q/hubSeg),f1=.15-.07*((q+1)/hubSeg);
    S.push({a:{t:2,a:hub,b:r0.ref,f:f0},b:{t:2,a:hub,b:r1.ref,f:f1},kind:'hub',t0:t,dur:.04});t+=.008}
  t+=.06;
  // 4) capture spiral, outside in
  const spacing=clamp(b.R*.085,10,18),loops=clamp(Math.round(b.R*.6/spacing),4,8),total=loops*m,fo=.9,fi=.3;
  const step=clamp(1.65/total,.01,.045),spiralStart=t,jit=[];for(let q=0;q<=total;q++)jit.push(rnd(-.022,.022));
  for(let q=0;q<total;q++){const r0=rad[q%m],r1=rad[(q+1)%m];
    const f0=fo-(fo-fi)*(q/total)+jit[q],f1=fo-(fo-fi)*((q+1)/total)+jit[q+1];
    if(r0.ok)S.push({a:{t:2,a:hub,b:r0.ref,f:f0},b:{t:2,a:hub,b:r1.ref,f:f1},kind:'spiral',t0:t,dur:step*1.7});
    t+=step}
  return {hub,anchors:an.map(o=>o.ref),strands:S,start:null,done:false,len:t+.15,spiralStart,alpha:1,fading:false,born:now};
}
function addWeb(w){
  webs.push(w);
  let live=0;for(const x of webs)if(!x.fading)live++;
  for(const x of webs){if(live<=MAXWEBS)break;if(!x.fading){x.fading=true;live--}}
}
function cutWeb(w){ // stop a half-built web where it is
  if(!w)return;
  if(w.start===null){webs.splice(webs.indexOf(w),1);return}
  const T=now-w.start;w.strands=w.strands.filter(s=>s.t0<T);for(const s of w.strands)s.t0=Math.min(s.t0,T-s.dur);
  w.done=true;if(w.strands.length<6){const k=webs.indexOf(w);if(k>=0)webs.splice(k,1)}
}
function addBridge(w){ // the dragline a real spider trails from its last web to the next spot
  let prev=null;for(let i=webs.length-1;i>=0;i--)if(webs[i].done&&!webs[i].fading){prev=webs[i];break}
  if(!prev)return;const d=Math.hypot(prev.hub.x-w.hub.x,prev.hub.y-w.hub.y);if(d<60||d>vw*1.4)return;
  // from the old web's anchor nearest the new hub to the new web's anchor nearest the old hub
  const near=(list,x,y)=>{let b=null,bd=1e9;for(const r of list){const p=resolve(r),dd=Math.hypot(p.x-x,p.y-y);if(dd<bd){bd=dd;b=r}}return b};
  const a=near(prev.anchors,w.hub.x,w.hub.y),b=near(w.anchors,prev.hub.x,prev.hub.y);if(!a||!b||a===b)return;
  w.strands.unshift({a,b,kind:'bridge',t0:0,dur:.35});
}
function requestWeb(x,y){
  const w=planWeb({x,y});
  if(!w)return false;
  cutWeb(sp.web);addWeb(w);sp.web=w;sp.mode='go';sp.goT=0;sp.fast=true;return true;
}

let now=0;
function stepSpider(dt){
  const chasing=ptr.has&&(ptr.down||(ptr.mouse&&ptr.inside)||now-ptr.moveAt<.15)&&now-ptr.moveAt<.6;
  // keep the spider near what the reader is looking at
  if(sp.mode!=='enter'&&(sp.y<sy-vh*.9||sp.y>sy+vh*1.9)){cutWeb(sp.web);sp.web=null;startEnter(ptr.has&&chasing?ptr.cx:rnd(vw*.25,vw*.75));}
  let tx=sp.x,ty=sp.y,maxV=L*3.2,arrive=L*.6,turn=7;
  if(sp.mode==='enter'){
    sp.enterT+=dt;const t=clamp(sp.enterT/1.2,0,1),e=1-Math.pow(1-t,3);
    sp.y=lerp(sp.startY,sp.targetY,e)+Math.sin(sp.enterT*5)*(1-e)*6;sp.x=sp.anchorX+Math.sin(sp.enterT*2.2)*4*(1-e);sp.hang=1-e*.9;
    sp.h=Math.PI/2+Math.sin(sp.enterT*3)*.15*(1-e);
    for(const g of legs){const p=toWorld(g.tf*(.78+.2*e),g.ts*(.78+.2*e));g.fx=lerp(g.fx,p.x,.35);g.fy=lerp(g.fy,p.y,.35)}
    if(t>=1){sp.mode='rest';sp.restUntil=now+.15;sp.hang=0;plantFeet()}
    return;
  }
  sp.hang=Math.max(0,sp.hang-dt*2);
  // resting pointer, not yet spun there: new web under it
  if(ptr.has&&!ptr.spun&&!chasing&&now-ptr.moveAt>=.6&&(ptr.inside||!ptr.mouse)){ptr.spun=true;if(!requestWeb(ptr.stX,ptr.stY)){sp.mode='rest';sp.restUntil=now+.3}}
  if(chasing){
    if(sp.mode==='build'||sp.mode==='go'){cutWeb(sp.web);sp.web=null}
    sp.mode='chase';tx=ptr.x;ty=ptr.y;maxV=L*(ptr.down?4.8:4);arrive=L*.9;turn=9;
    const d=Math.hypot(tx-sp.x,ty-sp.y);if(d<L*.75){tx=sp.x;ty=sp.y}
  }else if(sp.mode==='chase'){sp.mode='rest';sp.restUntil=now+.7}
  if(sp.mode==='rest'&&now>sp.restUntil){
    const w=planWeb(null);
    if(w){addBridge(w);addWeb(w);sp.web=w;sp.mode='go';sp.goT=0;sp.fast=false}else sp.restUntil=now+1;
  }
  if(sp.mode==='go'&&sp.web){
    sp.goT+=dt;const h=sp.web.hub;tx=h.x;ty=h.y;maxV=L*(sp.fast?7:5.2);arrive=L*.5;turn=11;
    if(Math.hypot(tx-sp.x,ty-sp.y)<L*1.6||sp.goT>(sp.fast?.5:1.3)){sp.web.start=now;sp.mode='build'}
  }
  if(sp.mode==='build'&&sp.web){
    const w=sp.web,T=now-w.start;
    if(T>=w.len){w.done=true;sp.web=null;sp.mode='rest';sp.restUntil=now+rnd(.15,.4);}
    else{
      // follow the strand being laid: lean out from the hub for radials, ride the spiral
      let hd=null;for(let i=w.strands.length-1;i>=0;i--){const s=w.strands[i];if(s.t0<=T){hd=s;break}}
      const hub=w.hub;let gx=hub.x,gy=hub.y;
      if(hd){const a=resolve(hd.a),b=resolve(hd.b),p=clamp((T-hd.t0)/hd.dur,0,1),hx=lerp(a.x,b.x,p),hy=lerp(a.y,b.y,p);
        const k=hd.kind==='spiral'?.68:hd.kind==='hub'?.6:.22;gx=hub.x+(hx-hub.x)*k;gy=hub.y+(hy-hub.y)*k;sp.head={x:hx,y:hy,on:hd.kind==='spiral'||hd.kind==='hub'};
        sp.faceTo=Math.atan2(hy-sp.y,hx-sp.x)}
      const px=sp.x,py=sp.y,dx=gx-sp.x,dy=gy-sp.y,d=Math.hypot(dx,dy),mv=Math.min(d,Math.max(d*Math.min(1,dt*11),0),L*10*dt);
      if(d>.01){sp.x+=dx/d*mv;sp.y+=dy/d*mv}
      const vx=(sp.x-px)/Math.max(dt,1e-3),vy=(sp.y-py)/Math.max(dt,1e-3),spd=Math.hypot(vx,vy);
      const want=spd>L*1.2?Math.atan2(vy,vx):(sp.faceTo??sp.h);
      sp.h+=clamp(angDiff(sp.h,want),-14*dt,14*dt);
      sp.v=spd*Math.max(0,Math.cos(angDiff(sp.h,Math.atan2(vy,vx))));sp.v=spd;
      sp.still=spd<L*.15?sp.still+dt:0;
      return;
    }
  }
  sp.head=null;
  // locomotion
  const dx=tx-sp.x,dy=ty-sp.y,dist=Math.hypot(dx,dy);
  let want=0;
  if(dist>1.5){
    const ha=Math.atan2(dy,dx),dh=angDiff(sp.h,ha);
    sp.h+=clamp(dh,-turn*dt,turn*dt);
    want=Math.min(maxV,dist/Math.max(dt,.001)*.5,dist*4+L*.5);
    if(dist<arrive)want=Math.min(want,dist*5);
    want*=clamp(1-Math.abs(dh)/1.9,.12,1);
  }
  sp.v+=(want-sp.v)*Math.min(1,dt*9);
  sp.x+=Math.cos(sp.h)*sp.v*dt;sp.y+=Math.sin(sp.h)*sp.v*dt;
  sp.x=clamp(sp.x,-L,vw+L);
  sp.still=sp.v<L*.15?sp.still+dt:0;
}

function stepLegs(dt){
  if(sp.mode==='enter')return;
  const vx=Math.cos(sp.h)*sp.v,vy=Math.sin(sp.h)*sp.v,spd=sp.v/L;
  const thr=L*(.24+Math.min(spd,6)*.04),dur=clamp(.15-spd*.016,.06,.15),lead=dur*1.1;
  let gStep=[0,0];for(const g of legs)if(g.stepping)gStep[g.group]++;
  for(const g of legs){
    if(g.stepping){
      g.t+=dt/g.dur;
      if(g.t>=1){g.stepping=false;g.fx=g.ex;g.fy=g.ey;g.lift=0}
      else{const e=g.t<.5?2*g.t*g.t:1-Math.pow(-2*g.t+2,2)/2;g.fx=lerp(g.sx,g.ex,e);g.fy=lerp(g.sy,g.ey,e);g.lift=Math.sin(Math.PI*g.t)}
      continue;
    }
    const d=toWorld(g.tf,g.ts),off=Math.hypot(d.x-g.fx,d.y-g.fy);
    const settle=sp.still>.25&&off>L*.07;
    if((off>thr||settle||off>L*.9)&&gStep[1-g.group]===0){
      g.stepping=true;g.t=0;g.dur=settle?.16:dur;g.sx=g.fx;g.sy=g.fy;g.ex=d.x+vx*lead;g.ey=d.y+vy*lead;gStep[g.group]++;
    }
  }
}

/* ---------- drawing ---------- */
function ik(bx,by,fx,fy,l1,l2,side){
  let dx=fx-bx,dy=fy-by,d=Math.hypot(dx,dy);const mx=(l1+l2)*.995,mn=Math.abs(l1-l2)+.001;
  if(d>mx){fx=bx+dx/d*mx;fy=by+dy/d*mx;d=mx}if(d<mn)d=mn;
  const a=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),base=Math.atan2(dy,dx);
  // knee bends away from the body's midline
  const c1=base+a,c2=base-a,k1x=bx+Math.cos(c1)*l1,k1y=by+Math.sin(c1)*l1,k2x=bx+Math.cos(c2)*l1,k2y=by+Math.sin(c2)*l1;
  const nx=-Math.sin(sp.h),ny=Math.cos(sp.h);
  const s1=((k1x-sp.x)*nx+(k1y-sp.y)*ny)*side,s2=((k2x-sp.x)*nx+(k2y-sp.y)*ny)*side;
  return s1>s2?[k1x,k1y,fx,fy]:[k2x,k2y,fx,fy];
}
function seg(ax,ay,bx,by,s0,s1,w){
  const len=Math.hypot(bx-ax,by-ay);if(len<.5)return;
  ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(by-ay,bx-ax)-Math.PI/2);
  const H=legImg.naturalHeight,Wd=legImg.naturalWidth,ov=w*.12;
  ctx.drawImage(legImg,0,s0*H,Wd,(s1-s0)*H,-w/2,-ov,w,len+ov*2);ctx.restore();
}
function drawSpider(){
  const lx=L*.07+sp.hang*L*.5,ly=L*.11+sp.hang*L*.7;
  const legGeo=legs.map(g=>{const b=toWorld(g.bf,g.bs);const nx=-Math.sin(sp.h)*g.side,ny=Math.cos(sp.h)*g.side;
    const fx=g.fx+nx*g.lift*L*.07,fy=g.fy+ny*g.lift*L*.07;return [b.x,b.y,...ik(b.x,b.y,fx,fy,g.l1*L,g.l2*L,g.side),g]});
  // shadows
  ctx.strokeStyle='rgba(6,10,70,.22)';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=L*.03;
  ctx.beginPath();
  for(const[bx,by,kx,ky,fx,fy,g]of legGeo){const lf=g.lift*L*.08;ctx.moveTo(bx+lx*1.4,by+ly*1.4);ctx.lineTo(kx+lx*1.3,ky+ly*1.3);ctx.lineTo(fx+lx*.5+lf,fy+ly*.5+lf)}
  ctx.stroke();
  const sh=bodyImg.naturalHeight?L/LFRAC:0,swd=sh*bodyImg.naturalWidth/(bodyImg.naturalHeight||1);
  const rot=sp.h-Math.PI/2;
  if(sh&&bodySh.complete&&bodySh.naturalWidth){
    const k=bodySh.naturalWidth/bodyImg.naturalWidth;
    ctx.save();ctx.globalAlpha=.55-sp.hang*.25;ctx.translate(sp.x+lx*1.9,sp.y+ly*1.9);ctx.rotate(rot);
    ctx.drawImage(bodySh,-CEPH.x*swd-(k-1)*swd/2,-CEPH.y*sh-(bodySh.naturalHeight/bodyImg.naturalHeight-1)*sh/2,swd*k,sh*bodySh.naturalHeight/bodyImg.naturalHeight);ctx.restore();
  }
  // legs: lower segment then upper
  if(legImg.complete&&legImg.naturalWidth){
    for(const[bx,by,kx,ky,fx,fy,g]of legGeo){const w=L*.115*g.w;seg(kx,ky,fx,fy,.36,1,w*.95);}
    for(const[bx,by,kx,ky,fx,fy,g]of legGeo){const w=L*.115*g.w;seg(bx,by,kx,ky,0,.42,w*1.08);}
  }
  // body
  if(sh){
    const br=1+Math.sin(sp.breath)*.012;
    ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(rot);ctx.scale(br,1/br);
    ctx.drawImage(bodyImg,-CEPH.x*swd,-CEPH.y*sh,swd,sh);ctx.restore();
  }
}
function spinPos(){const c=Math.cos(sp.h-Math.PI/2),n=Math.sin(sp.h-Math.PI/2);const sh=L/LFRAC,swd=sh*.53;const px=(SPIN.x-CEPH.x)*swd,py=(SPIN.y-CEPH.y)*sh;return {x:sp.x+c*px-n*py,y:sp.y+n*px+c*py}}

function line(ax,ay,bx,by){ctx.moveTo(ax,ay);ctx.lineTo(bx,by)}
/* silk: hair-thin, semi-transparent, a soft shadow so it reads over white type,
   brightness by how each strand faces the light (sheen), and gravity sag on long strands */
const BUCK=[[.34,.6],[.48,.65],[.64,.7],[.86,.8]];
const paths=[[],[],[],[]];
function drawWebs(){
  const top=sy-30,bot=sy+vh+30,lightA=.75+Math.sin(now*.45)*.55;
  ctx.lineCap='round';
  const dots=[];
  for(const w of webs){
    if(w.start===null)continue;
    // cull whole web by its anchors
    let y0=1e9,y1=-1e9;const hb=w.hub;y0=Math.min(y0,hb.y);y1=Math.max(y1,hb.y);
    for(const a of w.anchors){const p=resolve(a);if(p.y<y0)y0=p.y;if(p.y>y1)y1=p.y}
    if(y1<top||y0>bot)continue;
    const T=w.done?1e9:now-w.start,al=w.alpha;
    const sh=[];for(const b of paths)b.length=0;
    for(const s of w.strands){
      if(T<=s.t0)continue;
      const p=T>=s.t0+s.dur?1:(T-s.t0)/s.dur;
      const a=resolve(s.a),b0=resolve(s.b);
      const ax=a.x,ay=a.y-sy,bx=lerp(ax,b0.x,p),by=lerp(ay,b0.y-sy,p);
      const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(len<.6)continue;
      // sag grows with length squared, mostly straight down, a little less on near-vertical strands
      const sag=Math.min(len*len*(s.kind==='bridge'?.0004:.00021),s.kind==='bridge'?34:11)*(.35+.65*Math.abs(dx)/len);
      const mx=(ax+bx)/2,my=(ay+by)/2+sag;
      const g=Math.abs(Math.cos(Math.atan2(dy,dx)-lightA)),k=Math.min(3,Math.floor(g*g*g*4));
      paths[k].push(ax,ay,mx,my,bx,by);sh.push(ax,ay,mx,my,bx,by);
      if(p===1&&(s.kind==='frame'||s.kind==='radial'||s.kind==='bridge')){if(s.a.t===1)dots.push(ax,ay,al);if(s.b.t===1)dots.push(bx,by,al)}
    }
    // shadow pass
    ctx.globalAlpha=al;
    ctx.strokeStyle='rgba(6,10,70,.2)';ctx.lineWidth=1.15;ctx.beginPath();
    for(let i=0;i<sh.length;i+=6){ctx.moveTo(sh[i]+.9,sh[i+1]+1.7);ctx.quadraticCurveTo(sh[i+2]+.9,sh[i+3]+1.7,sh[i+4]+.9,sh[i+5]+1.7)}
    ctx.stroke();
    // thread passes, dim to bright
    for(let k=0;k<4;k++){const b=paths[k];if(!b.length)continue;
      ctx.strokeStyle='rgba(255,255,255,'+BUCK[k][0]+')';ctx.lineWidth=BUCK[k][1];ctx.beginPath();
      for(let i=0;i<b.length;i+=6){ctx.moveTo(b[i],b[i+1]);ctx.quadraticCurveTo(b[i+2],b[i+3],b[i+4],b[i+5])}
      ctx.stroke()}
    // the glint: brightest strands get a fine hot core
    const b=paths[3];if(b.length){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=.35;ctx.beginPath();
      for(let i=0;i<b.length;i+=6){ctx.moveTo(b[i],b[i+1]-.25);ctx.quadraticCurveTo(b[i+2],b[i+3]-.25,b[i+4],b[i+5]-.25)}ctx.stroke()}
    ctx.globalAlpha=1;
  }
  // tiny sticky attachment points on the elements
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();
  for(let i=0;i<dots.length;i+=3){ctx.moveTo(dots[i]+1.05,dots[i+1]);ctx.arc(dots[i],dots[i+1],1.05,0,TAU)}
  ctx.fill();
  // silk leaving the spinnerets while it rides the spiral
  if(sp.head&&sp.head.on){const p=spinPos();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=.6;ctx.beginPath();line(p.x,p.y-sy,sp.head.x,sp.head.y-sy);ctx.stroke()}
  // strands falling after a clear
  if(falling.length){
    ctx.lineWidth=.7;
    for(const f of falling){ctx.strokeStyle='rgba(255,255,255,'+(.7*f.life).toFixed(3)+')';ctx.beginPath();line(f.ax,f.ay-sy,f.bx,f.by-sy);ctx.stroke()}
  }
}
function drawDragline(){
  const p=spinPos();
  const ax=sp.anchorX,ay=0;const by=p.y-sy;if(by<-20)return;
  const sag=clamp((sp.x-sp.anchorX)*.18,-40,40);
  ctx.strokeStyle='rgba(6,10,70,.18)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(ax+.9,ay);ctx.quadraticCurveTo((ax+p.x)/2-sag+.9,(ay+by)/2+1.7,p.x+.9,by+1.7);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,'+(sp.mode==='enter'?.9:.55)+')';ctx.lineWidth=.75;ctx.beginPath();ctx.moveTo(ax,ay);
  ctx.quadraticCurveTo((ax+p.x)/2-sag,(ay+by)/2,p.x,by);ctx.stroke();
}

let last=performance.now(),fpsAcc=0,fpsN=0;
window.__spider={fps:0,state:()=>({t:Math.round(now*10)/10,mode:sp.mode,x:sp.x,y:sp.y,webs:liveWebs(),strands:strandCount(),hubs:webs.filter(w=>w.start!==null&&!w.fading).map(w=>[Math.round(w.hub.x),Math.round(w.hub.y)])}),web:(x,y)=>requestWeb(x,y+scrollY)};
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;now+=dt;
  fpsAcc+=dt;fpsN++;if(fpsAcc>1){window.__spider.fps=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0}
  sy=scrollY;
  readRects();
  stepSpider(dt);stepLegs(dt);sp.breath+=dt*2.2;
  sp.anchorX+=(sp.x-sp.anchorX)*Math.min(1,dt*(sp.mode==='enter'?0:1.4));
  for(let i=webs.length-1;i>=0;i--){const w=webs[i];if(w.fading){w.alpha-=dt/1.4;if(w.alpha<=0){webs.splice(i,1);if(sp.web===w){sp.web=null;sp.mode='rest'}}}}
  for(let i=falling.length-1;i>=0;i--){const f=falling[i];f.vy+=900*dt;f.ay+=f.vy*dt;f.by+=f.vy*dt*1.1;f.ax+=f.vx*dt;f.bx+=f.vx*dt;f.life-=dt*1.4;if(f.life<=0)falling.splice(i,1)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);
  drawWebs();
  ctx.save();ctx.translate(0,-sy);drawSpider();ctx.restore();
  drawDragline();
  updHud();
  requestAnimationFrame(frame);
}
size();lastW=innerWidth;sy=scrollY;readRects();
startEnter(vw*(vw<700?.62:.56));
requestAnimationFrame(t=>{last=t;requestAnimationFrame(frame)});
})();
