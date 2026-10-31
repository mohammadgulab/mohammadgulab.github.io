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
let strands=[],falling=[],webCount=0;
function addStrand(a,b,kind){strands.push({a,b,kind,born:now});if(strands.length>1100)strands.splice(0,strands.length-1100);updHud()}
function updHud(){hudW.textContent=webCount+(webCount===1?' web':' webs');hudS.textContent=strands.length+(strands.length===1?' strand':' strands');clearBtn.classList.toggle('has',strands.length>0)}
function clearWebs(){
  if(!strands.length&&!sp.silkFrom){toast('No webs yet. Give it a moment.');return}
  for(const s of strands){const a=resolve(s.a),b=resolve(s.b);falling.push({ax:a.x,ay:a.y,bx:b.x,by:b.y,vx:rnd(-30,30),vy:rnd(-40,10),va:rnd(-1.5,1.5),rot:0,life:1})}
  strands=[];webCount=0;sp.silkFrom=null;sp.plan=null;sp.mode='rest';sp.restUntil=now+1.6;updHud();
}
clearBtn.addEventListener('click',clearWebs);
addEventListener('keydown',e=>{
  if((e.key==='Delete'||e.key==='Backspace')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();clearWebs()}
  if(e.key==='Escape')closeMenu();
});

/* ---------- pointer ---------- */
const ptr={cx:-1,cy:-1,x:0,y:0,last:-99,down:false,has:false};
function setPtr(cx,cy){ptr.cx=cx;ptr.cy=cy;ptr.x=cx;ptr.y=cy+sy;ptr.last=now;ptr.has=true}
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.pointerType==='pen')setPtr(e.clientX,e.clientY)},{passive:true});
addEventListener('pointerdown',e=>{setPtr(e.clientX,e.clientY)},{passive:true});
addEventListener('touchstart',e=>{const t=e.touches[0];if(t){ptr.down=true;setPtr(t.clientX,t.clientY)}},{passive:true});
addEventListener('touchmove',e=>{const t=e.touches[0];if(t)setPtr(t.clientX,t.clientY)},{passive:true});
addEventListener('touchend',()=>{ptr.down=false;ptr.last=now},{passive:true});
addEventListener('touchcancel',()=>{ptr.down=false},{passive:true});
document.addEventListener('mouseleave',()=>{ptr.last=now-5});
addEventListener('scroll',()=>{sy=scrollY;if(ptr.has)ptr.y=ptr.cy+sy},{passive:true});

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
const sp={x:0,y:0,h:Math.PI/2,v:0,mode:'enter',enterT:0,hang:1,anchorX:0,silkFrom:null,plan:null,restUntil:0,still:0,breath:0,startY:0,targetY:0};
function toWorld(f,s){const c=Math.cos(sp.h),n=Math.sin(sp.h);return {x:sp.x+(c*f-n*s)*L,y:sp.y+(n*f+c*s)*L}}
function plantFeet(){for(const g of legs){const p=toWorld(g.tf,g.ts);g.fx=p.x;g.fy=p.y;g.stepping=false}}

function size(){
  dpr=Math.min(devicePixelRatio||1,2);vw=innerWidth;vh=innerHeight;
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);
  L=clamp(Math.min(vw,vh*1.1)*.18,58,96);
}
let lastW=0;
function onResize(){size();if(lastW&&Math.abs(innerWidth-lastW)>40&&strands.length){strands=[];webCount=0;sp.plan=null;sp.silkFrom=null;updHud()}lastW=innerWidth}
addEventListener('resize',onResize);

function startEnter(x){
  sp.mode='enter';sp.enterT=0;sp.x=x;sp.startY=sy-L*2.2;sp.y=sp.startY;sp.targetY=sy+clamp(vh*.42,200,420);
  sp.h=Math.PI/2;sp.v=0;sp.hang=1;sp.anchorX=x;sp.plan=null;sp.silkFrom=null;
  for(const g of legs){const p=toWorld(g.tf*.8,g.ts*.8);g.fx=p.x;g.fy=p.y;g.stepping=false}
}

/* plan an orb web around a hub, anchored on real elements */
function planWeb(){
  readRects();
  const top=sy+(header?header.offsetHeight:60)+30,bot=sy+vh-40,left=14,right=vw-14;
  const R=clamp(vw*.5,140,340),Rmin=R*.3;
  const pts=[];
  for(let i=0;i<anchorEls.length;i++){const r=rects[i];if(!r.vis||r.y+r.h<top-R||r.y>bot+R)continue;
    for(const[u,v]of UVS){if((u===.25||u===.75)&&r.w<160)continue;const x=r.x+u*r.w,y=r.y+v*r.h;if(x<4||x>vw-4)continue;pts.push({i,u,v,x,y})}}
  let best=null;
  for(let n=0;n<60;n++){
    let hx,hy;
    if(n<30&&sp.y>top-50&&sp.y<bot+50){hx=clamp(sp.x+rnd(-R,R)*.8,left+40,right-40);hy=clamp(sp.y+rnd(-R,R)*.8,top+30,bot-30)}
    else{hx=rnd(left+40,right-40);hy=rnd(top+30,bot-30)}
    let near=false;for(const w of hubs){if(Math.hypot(w.x-hx,w.y-hy)<R*.55){near=true;break}}
    const sec=new Array(10).fill(null);
    for(const p of pts){const d=Math.hypot(p.x-hx,p.y-hy);if(d<Rmin||d>R)continue;
      const a=Math.atan2(p.y-hy,p.x-hx),k=Math.floor(((a+Math.PI)/TAU)*10)%10;
      if(!sec[k]||d<sec[k].d)sec[k]={p,d,a}}
    const filled=sec.filter(Boolean);
    const score=filled.length*10-(near?25:0)-Math.hypot(hx-sp.x,hy-sp.y)/60+Math.random()*4;
    if(filled.length>=4&&(!best||score>best.score))best={score,hx,hy,an:filled.sort((a,b)=>a.a-b.a)};
  }
  if(!best)return null;
  const hub={t:0,x:best.hx,y:best.hy};hubs.push(hub);if(hubs.length>14)hubs.shift();
  const an=best.an.map(o=>({t:1,i:o.p.i,u:o.p.u,v:o.p.v,ang:o.a}));
  const moves=[{to:hub,silk:false,kind:'walk',fast:false}];
  for(let i=0;i<an.length;i+=2){
    moves.push({to:an[i],silk:true,kind:'radial'});
    if(i+1<an.length){moves.push({to:an[i+1],silk:true,kind:'frame'});moves.push({to:hub,silk:true,kind:'radial',from:an[i+1]})}
    else moves.push({to:hub,silk:false,kind:'walk'});
  }
  // spiral capture thread on the radials
  const n=an.length,loops=5,f0=.86,f1=.28,total=loops*n;
  let first=true,prev=null;
  for(let j=0;j<=total;j++){
    const r=an[j%n],f=f0-(f0-f1)*(j/total);
    const pt={t:2,a:hub,b:r,f};
    if(first){moves.push({to:pt,silk:false,kind:'walk'});first=false}
    else{const gap=Math.abs(angDiff(prev.ang,r.ang));moves.push({to:pt,silk:gap<2.2,kind:'spiral'})}
    prev=r;
  }
  return {moves,idx:0,hub,counted:false};
}
const hubs=[];

let now=0;
function stepSpider(dt){
  const chasing=ptr.has&&(now-ptr.last<1.1||ptr.down);
  // keep the spider near what the reader is looking at
  if(sp.mode!=='enter'&&(sp.y<sy-vh*1.2||sp.y>sy+vh*2.2)){startEnter(ptr.has&&chasing?ptr.cx:rnd(vw*.25,vw*.75));}
  let tx=sp.x,ty=sp.y,maxV=L*3.2,arrive=L*.6,turn=7;
  if(sp.mode==='enter'){
    sp.enterT+=dt;const t=clamp(sp.enterT/1.6,0,1),e=1-Math.pow(1-t,3);
    sp.y=lerp(sp.startY,sp.targetY,e)+Math.sin(sp.enterT*5)*(1-e)*6;sp.x=sp.anchorX+Math.sin(sp.enterT*2.2)*4*(1-e);sp.hang=1-e*.9;
    sp.h=Math.PI/2+Math.sin(sp.enterT*3)*.15*(1-e);
    for(const g of legs){const p=toWorld(g.tf*(.78+.2*e),g.ts*(.78+.2*e));g.fx=lerp(g.fx,p.x,.35);g.fy=lerp(g.fy,p.y,.35)}
    if(t>=1){sp.mode='rest';sp.restUntil=now+.5;sp.hang=0;plantFeet()}
    return;
  }
  sp.hang=Math.max(0,sp.hang-dt*2);
  if(chasing){
    if(sp.mode==='spin'){sp.mode='chase';sp.plan=null;if(sp.silkFrom){sp.silkFrom=null}}
    sp.mode='chase';tx=ptr.x;ty=ptr.y;maxV=L*(ptr.down?4.6:3.8);arrive=L*.9;turn=9;
    // stop just short of the pointer
    const d=Math.hypot(tx-sp.x,ty-sp.y);if(d<L*.75){tx=sp.x;ty=sp.y}
  }else if(sp.mode==='chase'||sp.mode==='rest'){
    if(sp.mode==='chase'){sp.mode='rest';sp.restUntil=now+.7}
    if(now>sp.restUntil){sp.plan=planWeb();if(sp.plan){sp.mode='spin'}else{sp.restUntil=now+1.5}}
  }
  if(sp.mode==='spin'&&sp.plan){
    const m=sp.plan.moves[sp.plan.idx];
    const p=resolve(m.to);tx=p.x;ty=p.y;
    maxV=m.kind==='spiral'?L*6:m.kind==='walk'?L*4.6:L*5;arrive=L*.25;turn=12;
    if(m.silk&&!sp.silkFrom)sp.silkFrom=m.from||currentRef();
    const d=Math.hypot(tx-sp.x,ty-sp.y);
    if(d<Math.max(3,L*.06)){
      if(m.silk&&sp.silkFrom){addStrand(sp.silkFrom,m.to,m.kind);if(!sp.plan.counted){sp.plan.counted=true;webCount++;updHud()}}
      sp.silkFrom=null;sp.lastRef=m.to;sp.plan.idx++;
      if(sp.plan.idx>=sp.plan.moves.length){sp.plan=null;sp.mode='rest';sp.restUntil=now+1.2}
      else if(sp.plan.moves[sp.plan.idx].silk)sp.silkFrom=m.to;
    }
  }
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
function currentRef(){return sp.lastRef&&Math.hypot(resolve(sp.lastRef).x-sp.x,resolve(sp.lastRef).y-sp.y)<L*.3?sp.lastRef:{t:0,x:sp.x,y:sp.y}}

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
function drawWebs(){
  const top=sy-40,bot=sy+vh+40;
  ctx.lineCap='round';
  // silk floats a little above the page: one soft shadow pass, then the bright thread
  const dots=[];
  for(let pass=0;pass<2;pass++){
  const ox=pass?0:1.6,oy=pass?0:2.6;
  ctx.strokeStyle=pass?'rgba(255,255,255,.86)':'rgba(4,8,60,.3)';ctx.lineWidth=pass?1.1:1.4;ctx.beginPath();
  for(const s of strands){
    const a=resolve(s.a),b=resolve(s.b);
    if((a.y<top&&b.y<top)||(a.y>bot&&b.y>bot))continue;
        const ax=a.x+ox,ay=a.y-sy+oy,bx=b.x+ox,by=b.y-sy+oy;
    if(s.kind==='spiral'){
      // slight sag toward the hub, like a real capture thread
      const mx=(ax+bx)/2,my=(ay+by)/2;ctx.moveTo(ax,ay);const hb=s.a.a;ctx.quadraticCurveTo(mx+(hb.x+ox-mx)*.04,my+(hb.y-sy+oy-my)*.04+1.2,bx,by);
    }else line(ax,ay,bx,by);
    if(pass){if(s.a.t===1)dots.push(ax,ay);if(s.b.t===1)dots.push(bx,by)}
  }
  ctx.stroke();
  }
  // sticky attachment blobs on the elements
  ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();
  for(let i=0;i<dots.length;i+=2){ctx.moveTo(dots[i]+1.8,dots[i+1]);ctx.arc(dots[i],dots[i+1],1.8,0,TAU)}
  ctx.fill();
  // silk being laid right now
  if(sp.silkFrom){const a=resolve(sp.silkFrom),p=spinPos();ctx.strokeStyle='rgba(4,8,60,.3)';ctx.lineWidth=1.4;ctx.beginPath();line(a.x+1.6,a.y-sy+2.6,p.x+1.6,p.y-sy+2.6);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.98)';ctx.lineWidth=1.25;ctx.beginPath();line(a.x,a.y-sy,p.x,p.y-sy);ctx.stroke()}
  // strands falling after a clear
  if(falling.length){
    ctx.lineWidth=1;
    for(const f of falling){ctx.strokeStyle='rgba(255,255,255,'+(.8*f.life).toFixed(3)+')';ctx.beginPath();line(f.ax,f.ay-sy,f.bx,f.by-sy);ctx.stroke()}
  }
}
function drawDragline(){
  const p=spinPos();
  const topY=0,ax=sp.anchorX,ay=topY;const by=p.y-sy;if(by<-20)return;
  const sag=clamp((sp.x-sp.anchorX)*.18,-40,40);
  ctx.strokeStyle='rgba(255,255,255,'+(sp.mode==='enter'?.95:.6)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax,ay);
  ctx.quadraticCurveTo((ax+p.x)/2-sag,(ay+by)/2,p.x,by);ctx.stroke();
}

let last=performance.now(),fpsAcc=0,fpsN=0;window.__spider={fps:0,state:()=>({mode:sp.mode,x:sp.x,y:sp.y,strands:strands.length,webs:webCount})};
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;now+=dt;
  fpsAcc+=dt;fpsN++;if(fpsAcc>1){window.__spider.fps=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0}
  sy=scrollY;
  readRects();
  stepSpider(dt);stepLegs(dt);sp.breath+=dt*2.2;
  sp.anchorX+=(sp.x-sp.anchorX)*Math.min(1,dt*(sp.mode==='enter'?0:1.4));
  for(let i=falling.length-1;i>=0;i--){const f=falling[i];f.vy+=900*dt;f.ay+=f.vy*dt;f.by+=f.vy*dt*1.1;f.ax+=f.vx*dt;f.bx+=f.vx*dt;f.life-=dt*1.4;if(f.life<=0)falling.splice(i,1)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);
  drawWebs();
  ctx.save();ctx.translate(0,-sy);drawSpider();ctx.restore();
  drawDragline();
  requestAnimationFrame(frame);
}
size();lastW=innerWidth;sy=scrollY;readRects();
startEnter(vw*(vw<700?.62:.56));
requestAnimationFrame(t=>{last=t;requestAnimationFrame(frame)});
})();
