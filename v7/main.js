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

/* ---------- v8: hand + rope (verlet physics) ---------- */
const stage=$('#stage'), hire=$('#hire'), ropes=$('#ropes'), hand=$('#hand');
const tipEl=$('.tip',hand), tipIn=$('.tip-in',hand), tipTail=$('.tip-tail',hand), grip=$('.h-grip',hand);
const rpx=['.rp-in','.rp-tl-o','.rp-tl-b','.rp-tl-t'].map(c=>$(c,ropes));
const HAND_AR=1201/720; let HW=200, RW=14;
const rp=['.rp-o','.rp-b','.rp-t','.rp-o2','.rp-b2','.rp-t2'].map(c=>$(c,ropes));
const cv=$('#confetti'), cx2=cv.getContext('2d');
const tBar=$('#tensionBar'), tPct=$('#tensionPct'), tBox=$('#tension'), hireT=$('#hireT'), hireS=$('#hireS');
const sheet=$('#sheet');
const N=22, G=0.42;
let SW=0,SH=0,rest={x:0,y:0},bw=0,bh=0,segL=8,Ltot=160;
let off={x:0,y:0},vel={x:0,y:0},drag=null,moved=0,broken=false,brokeAt=0,cut=11;
let pts=[],hoff={x:0,y:0},hvel={x:0,y:0},look=0,lookT=0,tension=0,squeeze=0,lastTug=performance.now();
let parts=[];
const mob=()=>innerWidth<=560;
function cen(el,s){const b=el.getBoundingClientRect();return{x:b.left+b.width/2-s.left,y:b.top+b.height/2-s.top};}
function anchor(){return cen(tipEl,stage.getBoundingClientRect());}
function attachPt(bx,by){return{x:bx-bw/2+16,y:by+2};}
function initRope(){
  const A=anchor(),B=attachPt(rest.x,rest.y);
  Ltot=Math.hypot(B.x-A.x,B.y-A.y)*(mob()?1.1:1.05); segL=Ltot/(N-1);
  pts=[];for(let i=0;i<N;i++){const t=i/(N-1);const x=A.x+(B.x-A.x)*t,y=A.y+(B.y-A.y)*t+Math.sin(t*Math.PI)*20;pts.push({x,y,px:x,py:y});}
}
function layout(){
  const r=stage.getBoundingClientRect();SW=r.width;SH=r.height;bw=hire.offsetWidth;bh=hire.offsetHeight;
  // size the photo hand so the whole fist, wrist and forearm sit inside the stage
  HW=mob()?Math.min(SW*0.5,(SH-24)/HAND_AR,210):Math.min(SW*0.27,(SH-10)/HAND_AR,330);HW=Math.max(HW,120);
  hand.style.width=HW.toFixed(1)+'px';hand.style.left=(mob()?Math.max(6,SW*0.02):SW*0.06).toFixed(1)+'px';hand.style.top=(mob()?6:4)+'px';
  RW=Math.max(9,Math.min(HW*0.075,22));stage.style.setProperty('--rw',RW.toFixed(1)+'px');
  let x=SW*(mob()?0.72:0.72), y=SH*(mob()?0.6:0.6);
  x=Math.min(Math.max(x,bw/2+8),SW-bw/2-8); y=Math.min(Math.max(y,bh/2+8),SH-bh/2-34);
  rest={x,y};
  const d=Math.min(devicePixelRatio||1,2);cv.width=SW*d;cv.height=SH*d;cx2.setTransform(d,0,0,d,0,0);
  initRope();
}
const rubber=(v,lim)=>{const s=Math.sign(v),a=Math.abs(v);return s*lim*(1-1/(a/lim+1));};
function smooth(list){if(list.length<2)return'';let d=`M${list[0].x.toFixed(1)},${list[0].y.toFixed(1)}`;
  for(let i=1;i<list.length-1;i++){const mx=(list[i].x+list[i+1].x)/2,my=(list[i].y+list[i+1].y)/2;d+=` Q${list[i].x.toFixed(1)},${list[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;}
  const l=list[list.length-1];return d+` L${l.x.toFixed(1)},${l.y.toFixed(1)}`;}
function burst(x,y){
  const cols=['#ffd60a','#ff3b30','#0c0c0c','#f3efe6','#ffffff'];
  for(let i=0;i<110;i++){const a=Math.random()*Math.PI*2,sp=3+Math.random()*9;
    parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-5,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.4,w:5+Math.random()*7,h:3+Math.random()*5,c:cols[i%cols.length],life:1});}
}
function drawParts(){
  cx2.clearRect(0,0,SW,SH);
  parts=parts.filter(p=>p.life>0);
  parts.forEach(p=>{p.vy+=.28;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life-=.011;
    cx2.save();cx2.globalAlpha=Math.max(p.life,0);cx2.translate(p.x,p.y);cx2.rotate(p.r);cx2.fillStyle=p.c;
    if(p.c==='#f3efe6'||p.c==='#ffffff'){cx2.strokeStyle='#0c0c0c';cx2.lineWidth=1;cx2.strokeRect(-p.w/2,-p.h/2,p.w,p.h);}
    cx2.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx2.restore();});
}
function snap(B){
  broken=true;brokeAt=performance.now();cut=Math.floor(N*0.55);
  const dx=B.x-pts[0].x,dy=B.y-pts[0].y,dl=Math.hypot(dx,dy)||1;
  for(let i=0;i<N;i++){const s=i<=cut?-1:1;pts[i].px=pts[i].x-s*dx/dl*7;pts[i].py=pts[i].y-s*dy/dl*7;}
  hvel.x-=dx/dl*14;hvel.y-=dy/dl*8; // hand recoils
  drag=null;vel={x:off.x*-.08,y:off.y*-.08};
  hire.classList.add('won');hireT.textContent='HIRED!';hireS.textContent="Let's talk";
  burst(rest.x+off.x*.4,rest.y+off.y*.4);
  try{navigator.vibrate&&navigator.vibrate([18,40,28]);}catch(_){}
  stage.classList.add('snapped');
  setTimeout(openSheet,650);
}
function retie(){
  broken=false;hire.classList.remove('won');hireT.textContent='HIRE ME';hireS.textContent='Pull me or tap';stage.classList.remove('snapped');initRope();
}
let lastFocus=null;
function openSheet(){lastFocus=document.activeElement;sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');body.classList.add('sheet-open');setTimeout(()=>{const f=$('.sheet-row',sheet);f&&f.focus({preventScroll:true});},300);}
function closeSheet(go){sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');body.classList.remove('sheet-open');
  if(broken)setTimeout(retie,900); if(go)setTimeout(goContact,250); else if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true});}
$$('[data-close]',sheet).forEach(el=>el.addEventListener('click',e=>{const go=el.dataset.go==='contact';if(go)e.preventDefault();closeSheet(go);}));
addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('open'))closeSheet(false);});
let t0=performance.now();
function frame(now){
  const t=(now-t0)/1000, idle=drag?0:1;
  // button spring
  if(!drag){const k=broken?0.06:0.09,c=0.18;vel.x+=-k*off.x-c*vel.x;vel.y+=-k*off.y-c*vel.y;off.x+=vel.x;off.y+=vel.y;}
  // idle invite: every ~4.5 s the hand gives a small tug
  if(!drag&&!broken&&now-lastTug>4500&&Math.hypot(off.x,off.y)<2){lastTug=now;hvel.x-=5;hvel.y+=1.5;vel.x-=3.2;vel.y-=1;}
  const bx=rest.x+off.x+Math.sin(t*1.3)*2.5*idle, by=rest.y+off.y+Math.cos(t*1.1)*3*idle;
  const B=attachPt(bx,by);
  // hand: pulled toward the button by tension, springs home
  const A0=anchor();
  const dist=Math.hypot(B.x-(A0.x-hoff.x),B.y-(A0.y-hoff.y));
  const tTarget=broken?0:Math.max(0,Math.min(1,(dist-Ltot)/Math.min(Ltot*0.5+30,mob()?95:105)));
  tension+=(tTarget-tension)*0.3;
  const dl=dist||1, ux=(B.x-(A0.x-hoff.x))/dl, uy=(B.y-(A0.y-hoff.y))/dl;
  const pullK=mob()?42:56, want={x:ux*tension*pullK,y:uy*tension*pullK*0.7};
  hvel.x+=(want.x-hoff.x)*0.12;hvel.y+=(want.y-hoff.y)*0.12;hvel.x*=0.78;hvel.y*=0.78;hoff.x+=hvel.x;hoff.y+=hvel.y;
  look+=((lookT)-look)*0.08;
  const ang=Math.atan2(uy,ux)*180/Math.PI;
  // the arm pivots at the elbow: the fist leans toward the pull, trembles under strain, recoils on the snap
  const strain=Math.max(0,tension-0.45)/0.55;
  const shake=strain*strain*(Math.sin(t*61)*0.9+Math.sin(t*37)*0.6);
  const lean=broken?hvel.x*0.5:tension*(7+Math.max(-5,Math.min(5,(ang-30)*0.1)));
  const rot=lean+shake+look*0.35+Math.sin(t*1.5)*0.9*idle;
  hand.style.transform=`translate(${(hoff.x+shake*0.6).toFixed(2)}px,${(hoff.y+Math.sin(t*1.2)*2.5*idle).toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
  squeeze+=((drag&&!broken?0.4:0)+tension*0.6-squeeze)*0.22;
  // grip tightens: fist compresses a touch, knuckles go pale and contrasty
  grip.style.transform=`scale(${(1-squeeze*0.025).toFixed(4)},${(1+squeeze*0.012).toFixed(4)})`;
  grip.style.filter=`contrast(${(1+squeeze*0.12).toFixed(3)}) saturate(${(1-squeeze*0.12).toFixed(3)}) brightness(${(1+squeeze*0.05).toFixed(3)})`;
  hand.style.setProperty('--sq',squeeze.toFixed(3));
  hire.style.transform=`translate(${(bx-bw/2).toFixed(1)}px,${(by-bh/2).toFixed(1)}px) rotate(${(off.x*0.035+(broken?0:tension*-4)).toFixed(2)}deg) scale(${(1+tension*0.05).toFixed(3)})`;
  hire.classList.toggle('taut',tension>0.55&&!broken);
  // rope physics
  const A=anchor(), Pi0=cen(tipIn,stage.getBoundingClientRect());
  let dux=A.x-Pi0.x, duy=A.y-Pi0.y; const dd0=Math.hypot(dux,duy)||1; dux/=dd0; duy/=dd0;
  const P1={x:A.x+dux*segL*0.85,y:A.y+duy*segL*0.85};
  for(let i=0;i<N;i++){const p=pts[i];
    const pinned=(i<=1)||(i===N-1);
    if(pinned)continue;
    const vx=(p.x-p.px)*0.985, vy=(p.y-p.py)*0.985;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+G;}
  pts[0].x=A.x;pts[0].y=A.y;pts[1].x=P1.x;pts[1].y=P1.y;pts[N-1].x=B.x;pts[N-1].y=B.y;
  for(let k=0;k<18;k++){
    for(let i=0;i<N-1;i++){ if(broken&&i===cut)continue;
      const a=pts[i],b=pts[i+1];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,diff=(d-segL)/d;
      const aP=i<=1, bP=i+1===N-1; const wa=aP?0:(bP?1:.5), wb=bP?0:(aP?1:.5);
      a.x+=dx*diff*wa;a.y+=dy*diff*wa;b.x-=dx*diff*wb;b.y-=dy*diff*wb;}
    pts[0].x=A.x;pts[0].y=A.y;pts[1].x=P1.x;pts[1].y=P1.y;pts[N-1].x=B.x;pts[N-1].y=B.y;
  }
  // floor so the loose ends rest on the stage
  pts.forEach(p=>{if(p.y>SH-6)p.y=SH-6;});
  const w=(1-tension*0.25);
  const d1=broken?smooth(pts.slice(0,cut+1)):smooth(pts), d2=broken?smooth(pts.slice(cut+1)):'';
  rp[0].setAttribute('d',d1);rp[1].setAttribute('d',d1);rp[2].setAttribute('d',d1);
  rp[3].setAttribute('d',d2);rp[4].setAttribute('d',d2);rp[5].setAttribute('d',d2);
  const ow=(RW*w).toFixed(2), iw=(RW*w-2.6).toFixed(2);
  [rp[0],rp[3]].forEach(p=>p.style.strokeWidth=ow);[rp[1],rp[4]].forEach(p=>p.style.strokeWidth=iw);[rp[2],rp[5]].forEach(p=>p.style.strokeWidth=(RW*w*0.42).toFixed(2));
  // rope inside the fist and the loose tail on the thumb side, both follow the hand
  const sR=stage.getBoundingClientRect(), Pi=cen(tipIn,sR), Pt=cen(tipTail,sR);
  rpx[0].setAttribute('d',`M${Pi.x.toFixed(1)},${Pi.y.toFixed(1)} L${A.x.toFixed(1)},${A.y.toFixed(1)}`);
  const sw=Math.sin(t*1.7)*3+(broken?Math.sin((now-brokeAt)/60)*6*Math.max(0,1-(now-brokeAt)/900):0)-tension*3;
  // loose end hangs under gravity behind the thumb
  const cxT=Pi.x-HW*0.065+sw*0.2, cyT=Pi.y-HW*0.004, exT=Pi.x-HW*0.075+sw*0.6, eyT=Pi.y+HW*0.12+Math.abs(sw)*0.3;
  const td=`M${Pi.x.toFixed(1)},${Pi.y.toFixed(1)} Q${cxT.toFixed(1)},${cyT.toFixed(1)} ${exT.toFixed(1)},${eyT.toFixed(1)}`;
  rpx.slice(1).forEach(p=>p.setAttribute('d',td));
  rpx[0].style.strokeWidth=iw;rpx[1].style.strokeWidth=ow;rpx[2].style.strokeWidth=iw;rpx[3].style.strokeWidth=(RW*0.42).toFixed(2);
  rp[1].style.stroke=tension>0.8?'#f1d9c9':'';
  rp[2].style.strokeDashoffset=(-t*4-tension*30).toFixed(1);
  // tension meter
  const pc=Math.round(tension*100);tBar.style.transform=`scaleX(${tension.toFixed(3)})`;tPct.textContent=broken?'SNAP':pc+'%';tBox.classList.toggle('hot',tension>0.7||broken);tBox.classList.toggle('on',!!drag||broken||tension>0.02);
  if(drag&&!broken&&tension>=0.98)snap(B);
  if(parts.length)drawParts();else if(cv._dirty){cx2.clearRect(0,0,SW,SH);} cv._dirty=parts.length>0;
  requestAnimationFrame(frame);
}
hire.addEventListener('pointerdown',e=>{
  try{hire.setPointerCapture(e.pointerId);}catch(_){}
  drag={sx:e.clientX,sy:e.clientY,ox:off.x,oy:off.y};moved=0;vel={x:0,y:0};
});
hire.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.sx, dy=e.clientY-drag.sy; moved=Math.max(moved,Math.hypot(dx,dy));
  off.x=Math.max(-rest.x+bw/2-30,Math.min(SW-rest.x-bw/2+30,(drag.ox+dx)*0.92)); off.y=Math.max(-rest.y+bh/2-30,Math.min(SH-rest.y+60,(drag.oy+dy)*0.92));
});
const end=e=>{
  if(!drag)return; drag=null;
};
hire.addEventListener('click',e=>{if(moved<7&&!broken){burst(rest.x,rest.y);openSheet();}moved=0;});
hire.addEventListener('pointerup',end);hire.addEventListener('pointercancel',end);
// hand looks toward a finger or the mouse on the stage
stage.addEventListener('pointermove',e=>{if(drag)return;const r=stage.getBoundingClientRect();lookT=((e.clientY-r.top)/r.height-.5)*10;},{passive:true});
stage.addEventListener('pointerleave',()=>{lookT=0;});
// expose for QA
window.__pull=(x,y)=>{drag={sx:0,sy:0,ox:0,oy:0};moved=99;off.x=rubber(x,mob()?300:420);off.y=rubber(y,mob()?240:300);};
window.__release=()=>{drag=null;};
window.__state=()=>({tension,broken,sheet:sheet.classList.contains('open')});
addEventListener('resize',()=>{layout();});
(document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>{layout();});
layout();requestAnimationFrame(frame);
new IntersectionObserver((es,o)=>{if(es[0].isIntersecting){setTimeout(()=>{if(!drag){vel.x=10;vel.y=3;hvel.x-=4;}},600);o.disconnect();}},{threshold:.4}).observe(stage);

/* v8: glare sweep on featured frames when they enter */
{const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('in',e.isIntersecting)),{threshold:.5});$$('.card').forEach(c=>io.observe(c));}
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
  row.scrollLeft=0;row.addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});addEventListener('resize',upd);upd();
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
gsap.from(['#hand','#hire'],{opacity:0,duration:1.1,ease:'power3.out',delay:.25,scrollTrigger:{trigger:'.hero-a',start:'top 60%'}});
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
  if(nxt&&innerWidth>899) gsap.to(c,{scale:.94,filter:'brightness(.6)',ease:'none',scrollTrigger:{trigger:nxt,start:'top bottom',end:'top 30%',scrub:true}});
  const im=c.querySelector('.c-shot');
  if(im) gsap.fromTo(im,{y:24},{y:-24,ease:'none',scrollTrigger:{trigger:c,start:'top bottom',end:'bottom top',scrub:true}});
  gsap.from(c.querySelectorAll('.tags li'),{y:16,opacity:0,stagger:.06,duration:.5,ease:'back.out(2)',scrollTrigger:{trigger:c,start:'top 70%'}});
});
gsap.from('.more-head',{y:30,opacity:0,duration:.7,scrollTrigger:{trigger:'.more',start:'top 88%'}});
gsap.from('.m-card',{y:50,opacity:0,stagger:.07,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.more',start:'top 85%'}});
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
