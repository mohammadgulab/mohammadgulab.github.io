import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const qs = new URLSearchParams(location.search);

/* ---------- data (all invented) ---------- */
const MOVIES = [
  {slug:'neon',title:'Neon Requiem',genre:['Sci-fi','Thriller'],rating:8.7,dur:'2h 14m',cert:'PG-15',lang:'English · Arabic subtitles',syn:'In a city that never switches off its lights, a night-shift engineer finds a signal hidden inside the power grid. Someone is using the skyline to send a message, and only she can read it.'},
  {slug:'dunes',title:'Dunes of Amber',genre:['Adventure','Drama'],rating:8.4,dur:'2h 02m',cert:'PG-12',lang:'Arabic · English subtitles',syn:'Two estranged brothers cross the open desert to return their grandfather\'s compass to the oasis where he was born. The sand remembers every promise.'},
  {slug:'hollow',title:'Afterglow',genre:['Music','Drama'],rating:8.1,dur:'1h 56m',cert:'PG-12',lang:'English · Arabic subtitles',syn:'A stage-light technician gets one night to save a farewell concert when the headliner goes missing an hour before the show.'},
  {slug:'highway',title:'Platform 23',genre:['Mystery','Thriller'],rating:7.9,dur:'1h 48m',cert:'PG-15',lang:'English · Arabic subtitles',syn:'The last train leaves at midnight. Every night, one passenger who boards it is never seen getting off.'},
  {slug:'pines',title:'The Fog Line',genre:['Horror'],rating:7.6,dur:'1h 39m',cert:'R-18',lang:'English · Arabic subtitles',syn:'An old railway track runs into a forest that the map says does not exist. A film crew follows it to find out why the fog never lifts.'},
  {slug:'horizon',title:'Red Horizon',genre:['Adventure','Family'],rating:8.3,dur:'2h 08m',cert:'PG',lang:'English · Arabic subtitles',syn:'A young pilot crash-lands beside a giant red rock and has seven days to fix her plane with help from the locals who live in its shadow.'},
  {slug:'veil',title:'Northern Veil',genre:['Fantasy','Romance'],rating:8.0,dur:'2h 11m',cert:'PG-12',lang:'English · Arabic subtitles',syn:'Every winter the sky lights up for one night. This year a lighthouse keeper sees someone walking inside the light.'},
  {slug:'summit',title:'Summit of Silence',genre:['Drama','Adventure'],rating:8.5,dur:'2h 20m',cert:'PG-12',lang:'English · Arabic subtitles',syn:'A deaf climber and her stubborn guide attempt the one peak that has turned back every expedition for forty years.'},
  {slug:'petals',title:'Petals in April',genre:['Romance','Comedy'],rating:7.8,dur:'1h 52m',cert:'PG',lang:'English · Arabic subtitles',syn:'A florist and a food critic keep getting each other\'s deliveries. Spring is short, and so is their patience.'},
  {slug:'drive',title:'Last Drive',genre:['Crime','Action'],rating:8.2,dur:'2h 05m',cert:'PG-15',lang:'English · Arabic subtitles',syn:'A retired getaway driver restores one last vintage car. The buyer turns out to be the man he left behind twenty years ago.'}
];
const CREDITS = ['Martin Wessely','Tim de Groot','Daniel Ebersole','Robin Röcker','Andrea Boldizsar','Georgia Dixon','Guillaume','Paul E. Harrer','Rula Sibai','Gabe Rodriguez'];
const THEATRES = [
  {id:'rsm',name:'CineNova Red Sea Mall',area:'North Obhur Rd · 4.2 km',am:'Recliners · Dolby Atmos'},
  {id:'cor',name:'CineNova Corniche',area:'Al Shati · 6.8 km',am:'IMAX · Parking'},
  {id:'and',name:'CineNova Al Andalus',area:'Al Andalus · 3.1 km',am:'4DX · Food court'},
  {id:'obh',name:'CineNova Obhur Marina',area:'Obhur · 18 km',am:'Balcony · Lounge'}
];
const FORMATS = {'2D':0,'IMAX':25,'4DX':35,'Dolby':15};
const CLASSES = {
  royal:{name:'Royal Recliner',price:95,color:'#f2b632',note:'Leather recliner, extra legroom'},
  balcony:{name:'Balcony',price:70,color:'#9a6bff',note:'Raised view, best for IMAX'},
  prime:{name:'Prime',price:55,color:'#33c48a',note:'Centre of the hall'},
  classic:{name:'Classic',price:40,color:'#3f86e8',note:'Front rows, big screen feel'}
};
const SNACKS = [
  {id:'combo',ic:'🍿',name:'Popcorn combo',desc:'Large popcorn + 2 drinks',p:39},
  {id:'caramel',ic:'🍯',name:'Caramel popcorn',desc:'Medium, freshly made',p:28},
  {id:'nachos',ic:'🧀',name:'Loaded nachos',desc:'Cheese and jalapeño',p:26},
  {id:'drink',ic:'🥤',name:'Soft drink',desc:'Large, any flavour',p:14}
];
const img = (s,k) => `img/${s}-${k}.webp`;
const sar = n => 'SAR ' + n.toLocaleString('en-US');

function hash(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return h>>>0}
function rng(seed){let a=hash(String(seed));return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- state ---------- */
let S = JSON.parse(sessionStorage.getItem('cn_state')||'null') || {movie:'neon',date:0,theatre:null,time:null,fmt:'2D',seats:[],snacks:{}};
const save = () => sessionStorage.setItem('cn_state', JSON.stringify(S));
const movie = () => MOVIES.find(m=>m.slug===S.movie) || MOVIES[0];

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2200)}
$$('[data-soon]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();toast('Coming soon in this concept')}));
$('#cityBtn').addEventListener('click',()=>toast('More cities coming soon'));
$('#credits').textContent = CREDITS.join(', ');

/* ---------- intro ---------- */
(function intro(){
  const el=$('#intro');
  const skip = qs.get('intro')==='0' || sessionStorage.getItem('cn_intro') || (location.hash && location.hash!=='#/');
  if(skip){el.remove();return}
  const wall=$('#introWall');
  for(let i=0;i<63;i++){const d=document.createElement('div');d.style.backgroundImage=`url(${img(MOVIES[(i*7)%10].slug,'p')})`;wall.appendChild(d)}
  sessionStorage.setItem('cn_intro','1');
  setTimeout(()=>{el.classList.add('done');setTimeout(()=>el.remove(),900)},2900);
  el.addEventListener('click',()=>{el.classList.add('done');setTimeout(()=>el.remove(),900)});
})();

/* ---------- poster markup ---------- */
function posterHTML(m){return `<div class="pst" style="background-image:url(${img(m.slug,'p')})"><span class="pc">CineNova Pictures</span><span class="pr">★ ${m.rating}</span><span class="pt">${m.title}</span><span class="pg">${m.genre.join(' · ')}</span></div>`}

/* ---------- home carousel ---------- */
const GLOW=['#3ee08f','#ff4fb8','#4aa3ff','#ffc21a','#a66bff'];
const ring=$('#ring'), stage=$('#stage'), N=MOVIES.length, STEP=1;
let angle=0, target=0, vel=0, cards=[], carRAF=0; // angle/target are continuous card indexes
MOVIES.forEach((m,i)=>{const c=document.createElement('div');c.className='card3';c.dataset.i=i;c.innerHTML=`<span class="lbl">${m.title}</span>`+posterHTML(m);c.style.setProperty('--gc',GLOW[i%GLOW.length]);ring.appendChild(c);cards.push(c)});
$('#dots').innerHTML=MOVIES.map(()=>'<i></i>').join('');
function layout(){
  const w=cards[0].offsetWidth||200, small=innerWidth<560, R=w*(small?3.0:3.5), A=small?19:20;
  ring.style.transform=`translateZ(${R*0.9}px)`;
  cards.forEach((c,i)=>{
    let d=((i-angle)%N+N*1.5)%N-N/2;
    const a=Math.abs(d);
    c.style.transform=`rotateY(${-d*A}deg) translateZ(${-R}px)`;
    c.style.opacity = a>3.4?0:a>2.6?(3.4-a)/.8:1;
    c.style.filter=`brightness(${a<.5?1.05:Math.max(.35,.9-a*.16)})`;
    c.style.zIndex = 100+Math.round(a*10);
    c.style.pointerEvents = a>2.8?'none':'auto';
    c.classList.toggle('act',a<.5);
  });
  const k=((Math.round(angle)%N)+N)%N; $$('#dots i').forEach((e,j)=>e.classList.toggle('on',j===k));
}
function activeIdx(){return ((Math.round(target)%N)+N)%N}
function info(){const m=MOVIES[activeIdx()];$('#carInfo').innerHTML=`<h3>${m.title}</h3><p>★ ${m.rating} · ${m.genre.join(' · ')} · ${m.dur}</p><a class="btn btn-y" href="#/movie/${m.slug}">Book tickets</a>`}
function tick(){
  if(!drag){angle+= (target-angle)*0.12}
  layout();
  if(drag||Math.abs(target-angle)>.002){carRAF=requestAnimationFrame(tick)}else{angle=target;layout();carRAF=0}
}
function kick(){if(!carRAF)carRAF=requestAnimationFrame(tick)}
function goTo(t){target=t;info();kick()}
let drag=false,sx=0,sa=0,lx=0,lt=0,moved=0;
stage.addEventListener('pointerdown',e=>{drag=true;sx=lx=e.clientX;sa=angle;lt=performance.now();moved=0;vel=0;stage.setPointerCapture(e.pointerId);kick()});
stage.addEventListener('pointermove',e=>{if(!drag)return;const now=performance.now();moved=Math.max(moved,Math.abs(e.clientX-sx));vel=(e.clientX-lx)/Math.max(1,now-lt);lx=e.clientX;lt=now;angle=sa-(e.clientX-sx)/((cards[0].offsetWidth||200)*1.1);target=angle});
stage.addEventListener('pointerup',e=>{
  if(!drag)return;drag=false;
  if(moved<6){
    const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.card3');
    if(el){const i=+el.dataset.i;const cur=activeIdx();
      if(i===cur){location.hash='#/movie/'+MOVIES[i].slug;return}
      let d=((i-cur)%N+N)%N; if(d>N/2)d-=N; goTo(Math.round(target)+d);return}
  }
  const fling=-vel*0.6; goTo(Math.round(angle+fling));
});
stage.addEventListener('pointercancel',()=>{drag=false;goTo(Math.round(angle))});
$('#prev').onclick=()=>goTo(Math.round(target)-1);
$('#next').onclick=()=>goTo(Math.round(target)+1);
addEventListener('keydown',e=>{if(cur!=='home')return;if(e.key==='ArrowLeft')$('#prev').click();if(e.key==='ArrowRight')$('#next').click()});
addEventListener('resize',()=>layout());
let auto=setInterval(()=>{if(cur==='home'&&!drag&&!document.hidden)goTo(Math.round(target)+1)},5200);
stage.addEventListener('pointerdown',()=>{clearInterval(auto)},{once:true});
info();layout();

/* ---------- detail ---------- */
function dayInfo(off){const d=new Date();d.setDate(d.getDate()+off);return d}
const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let fmtFilter='All';
function renderDetail(slug){
  const m=MOVIES.find(x=>x.slug===slug)||MOVIES[0]; if(S.movie!==m.slug){S.movie=m.slug;S.seats=[];save()}
  $('#bdImg').style.backgroundImage=`url(${img(m.slug,'b')})`;
  $('#dPoster').src=img(m.slug,'p');$('#dPoster').alt=m.title+' poster';
  $('#dTitle').textContent=m.title;
  $('#dMeta').innerHTML=`<span class="st">★ ${m.rating}/10</span><span>${m.dur}</span><span>·</span><span>${m.cert}</span>${m.genre.map(g=>`<span class="chip">${g}</span>`).join('')}<span class="chip">${m.lang}</span>`;
  $('#dSyn').textContent=m.syn;
  $('#dates').innerHTML=[...Array(7)].map((_,i)=>{const d=dayInfo(i);return `<button class="date ${i===S.date?'on':''}" data-d="${i}"><small>${i===0?'Today':DN[d.getDay()]}</small><b>${d.getDate()}</b><small>${MN[d.getMonth()]}</small></button>`}).join('');
  $$('.date').forEach(b=>b.onclick=()=>{S.date=+b.dataset.d;save();$$('.date').forEach(x=>x.classList.toggle('on',x===b));renderTimes()});
  $('#fmt').innerHTML=['All',...Object.keys(FORMATS)].map(f=>`<button class="${f===fmtFilter?'on':''}">${f==='All'?'All formats':f}</button>`).join('');
  $$('#fmt button').forEach(b=>b.onclick=()=>{fmtFilter=b.textContent==='All formats'?'All':b.textContent;$$('#fmt button').forEach(x=>x.classList.toggle('on',x===b));renderTimes()});
  renderTimes();
}
function showtimes(th){
  const r=rng(S.movie+th.id+S.date), base=['10:30','13:15','15:40','18:20','20:45','23:10'], fk=Object.keys(FORMATS);
  return base.filter(()=>r()>.25).map(t=>{const f=fk[Math.floor(r()*4)];const fill=.15+r()*.8;return {t,f,fill}});
}
function renderTimes(){
  $('#theatres').innerHTML=THEATRES.map(th=>{
    const list=showtimes(th).filter(s=>fmtFilter==='All'||s.f===fmtFilter);
    if(!list.length)return '';
    return `<div class="th"><div><h4>${th.name}</h4><p>${th.area}</p><p>${th.am}</p></div><div class="times">${list.map(s=>{const c=s.fill>.8?'var(--r)':s.fill>.55?'var(--a)':'var(--g)';return `<button class="time" style="--fill:${Math.round(s.fill*100)}%;--c:${c}" data-th="${th.id}" data-t="${s.t}" data-f="${s.f}"><b>${s.t}</b><small>${s.f} · from ${sar(CLASSES.classic.price+FORMATS[s.f])}</small></button>`}).join('')}</div></div>`}).join('') || '<p class="muted">No shows in this format on this day. Try another date.</p>';
  $$('.time').forEach(b=>b.onclick=()=>{S.theatre=b.dataset.th;S.time=b.dataset.t;S.fmt=b.dataset.f;S.seats=[];save();location.hash='#/seats'});
}
$('#playp').onclick=e=>{const p=$('.bd').classList.toggle('paused');e.currentTarget.classList.toggle('paused',p);e.currentTarget.setAttribute('aria-label',p?'Play teaser':'Pause teaser')};
$('#search').addEventListener('submit',e=>{e.preventDefault();const q=$('#q').value.trim().toLowerCase();if(!q)return;const i=MOVIES.findIndex(m=>m.title.toLowerCase().includes(q)||m.genre.join(' ').toLowerCase().includes(q));if(i<0){toast('No film matches that search');return}location.hash='#/';setTimeout(()=>{let d=((i-activeIdx())%N+N)%N;if(d>N/2)d-=N;goTo(Math.round(target)+d)},50)});
function badge(){const b=$('#tkBadge');b.hidden=!localStorage.getItem('cn_ticket')}badge();
$('#bookBtn').onclick=e=>{e.preventDefault();$('#times').scrollIntoView({behavior:'smooth'})};
$('#watchBtn').onclick=e=>{const on=e.currentTarget.classList.toggle('on');e.currentTarget.innerHTML=on?'&#9829; Saved':'&#9825; Watchlist';toast(on?'Added to your watchlist':'Removed from watchlist')};

/* ---------- seat model ---------- */
const ROWS=[];
(function buildRows(){
  const add=(ids,cls,n,blocks,opt={})=>ids.split('').forEach(id=>ROWS.push({id,cls,n,blocks,...opt}));
  add('ABC','classic',14,[3,8,3]);
  add('DEFGH','prime',16,[4,8,4]);
  add('JK','royal',10,[5,5],{wide:true});
  add('LMN','balcony',16,[4,8,4],{balcony:true});
})();
let SEATS=[];
function buildSeats(){
  SEATS=[];const r=rng(S.movie+S.theatre+S.time+S.date);
  let z=-6.5,y=0,bal=false;
  ROWS.forEach((row,ri)=>{
    if(row.balcony&&!bal){bal=true;z+=1.4;y+=1.5}
    const sp=row.wide?1.42:1.0, gap=row.wide?1.1:0.9;
    const width=row.n*sp+(row.blocks.length-1)*gap;
    let k=0,x=-width/2+sp/2;
    row.blocks.forEach((b,bi)=>{for(let j=0;j<b;j++){
      const occ=r()< (row.cls==='prime'?.42:row.cls==='royal'?.38:.3);
      SEATS.push({row:row.id,num:k+1,cls:row.cls,block:bi,x,y,z,wide:!!row.wide,booked:occ,sel:false,idx:SEATS.length});
      x+=sp;k++}x+=gap});
    z+= row.wide?2.1:(row.balcony?1.35:1.25); y+= row.balcony?0.5:0.3;
  });
  S.seats.forEach(id=>{const s=SEATS.find(q=>q.row+q.num===id);if(s&&!s.booked)s.sel=true});
}
const priceOf=s=>CLASSES[s.cls].price+FORMATS[S.fmt||'2D'];
const selected=()=>SEATS.filter(s=>s.sel);
function toggleSeat(s,force){
  if(s.booked){toast(`Seat ${s.row}${s.num} is already booked`);return}
  const v=force??!s.sel;
  if(v&&!s.sel&&selected().length>=8){toast('You can book up to 8 seats at once');return}
  s.sel=v;S.seats=selected().map(q=>q.row+q.num);save();hall&&hall.refresh(s);fbRefresh();renderPanel();
}
function renderPanel(){
  const counts={};SEATS.forEach(s=>{if(!s.booked&&!s.sel)counts[s.cls]=(counts[s.cls]||0)+1});
  $('#classes').innerHTML=Object.entries(CLASSES).map(([k,c])=>`<div class="cls"><i style="background:${c.color};color:${c.color}"></i><div><b>${c.name}</b><small>${counts[k]||0} left · ${c.note}</small></div><em>${sar(c.price+FORMATS[S.fmt||'2D'])}</em></div>`).join('');
  const sel=selected(), tot=sel.reduce((a,s)=>a+priceOf(s),0);
  $('#chips').innerHTML=sel.length?sel.map(s=>`<span class="chip2" style="border-color:${CLASSES[s.cls].color}88">${s.row}${s.num} · ${CLASSES[s.cls].name}<button data-id="${s.idx}" aria-label="Remove seat ${s.row}${s.num}">×</button></span>`).join('')+`<button class="btn btn-g" id="povBtn" style="height:34px;padding:0 12px;font-size:12.5px;margin-top:4px">👁 View from seat ${sel[0].row}${sel[0].num}</button>`:'<span class="muted">Tap a seat in the hall</span>';
  $$('#chips .chip2 button').forEach(b=>b.onclick=()=>toggleSeat(SEATS[+b.dataset.id],false));
  const pov=$('#povBtn'); if(pov) pov.onclick=()=>{hall&&hall.view('seat',sel[0]);$('#panel').classList.remove('open')};
  $('#pCount').textContent=sel.length?`${sel.length} seat${sel.length>1?'s':''} · ${sel.map(s=>s.row+s.num).join(', ')}`:'No seats yet';
  $('#pTotal').textContent=sar(tot);
  $('#contBtn').disabled=!sel.length;
}
let qn=2;
$('#qMinus').onclick=()=>{qn=Math.max(1,qn-1);qUpd()};$('#qPlus').onclick=()=>{qn=Math.min(8,qn+1);qUpd()};
function qUpd(){$('#qN').textContent=qn;$('#bestBtn').textContent=`Best ${qn} seat${qn>1?'s':''}`}
$('#bestBtn').onclick=()=>{
  const order=['F','G','E','H','M','L','D','J','K','N','C','B','A'];
  for(const rid of order){
    const row=SEATS.filter(s=>s.row===rid);
    const blocks=[...new Set(row.map(s=>s.block))];
    let best=null;
    blocks.forEach(b=>{const bs=row.filter(s=>s.block===b);for(let i=0;i+qn<=bs.length;i++){const g=bs.slice(i,i+qn);if(g.some(s=>s.booked))continue;const cx=g.reduce((a,s)=>a+s.x,0)/qn;const sc=Math.abs(cx);if(!best||sc<best.sc)best={g,sc}}});
    if(best){selected().forEach(s=>{s.sel=false;hall&&hall.refresh(s)});best.g.forEach(s=>{s.sel=true;hall&&hall.refresh(s)});S.seats=selected().map(q=>q.row+q.num);save();fbRefresh();renderPanel();toast(`Picked ${best.g.map(s=>s.row+s.num).join(', ')} for you`);return}
  }
  toast('No block of seats that size is free together');
};
$('#handle').onclick=()=>$('#panel').classList.toggle('open');
$('#contBtn').onclick=()=>{renderSnacks();$('#snacks').hidden=false};

/* ---------- CSS fallback seat map (no WebGL) ---------- */
function buildFallback(){
  const fb=$('#fallback');fb.hidden=false;
  const rows=[...new Set(SEATS.map(s=>s.row))];
  fb.innerHTML=`<div class="fb-grid"><div class="fb-scr"></div>${rows.map(r=>`<div class="fb-row">${SEATS.filter(s=>s.row===r).map(s=>`<button data-i="${s.idx}" aria-label="Seat ${s.row}${s.num}"></button>`).join('')}</div>`).join('')}</div>`;
  $$('#fallback button').forEach(b=>b.onclick=()=>toggleSeat(SEATS[+b.dataset.i]));fbRefresh();
}
function fbRefresh(){$$('#fallback button').forEach(b=>{const s=SEATS[+b.dataset.i];b.style.background=s.booked?'#3b3b46':s.sel?'var(--sel)':CLASSES[s.cls].color})}

/* ---------- 3D hall ---------- */
let hall=null;
function makeHall(){
  const canvas=$('#hall');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch(e){return null}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#04060f');scene.fog=new THREE.Fog('#04060f',40,90);
  const camera=new THREE.PerspectiveCamera(50,1,.1,200);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=3;controls.maxDistance=60;controls.enablePan=false;
  const tex=new THREE.TextureLoader();

  // lights
  scene.add(new THREE.HemisphereLight('#6c6a8a','#120a08',.55));
  const scrLight=new THREE.SpotLight('#cfe0ff',140,60,Math.PI/3.2,.6,1.4);scrLight.position.set(0,6,-14);scrLight.target.position.set(0,0,8);scene.add(scrLight,scrLight.target);
  const warm=new THREE.PointLight('#ffe0bd',45,40,1.6);warm.position.set(0,12,10);scene.add(warm);
  [-1,1].forEach(sd=>{const l=new THREE.PointLight('#ff8a3d',14,14,1.8);l.position.set(sd*11.5,5,2);scene.add(l)});

  // floor & risers
  const carpet=new THREE.MeshStandardMaterial({color:'#1b1220',roughness:.95});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,46),carpet);floor.rotation.x=-Math.PI/2;floor.position.z=4;scene.add(floor);
  const riserMat=new THREE.MeshStandardMaterial({color:'#24182a',roughness:.9});
  const stepLed=new THREE.MeshBasicMaterial({color:'#ffb64a'});
  const rowsZ=[...new Set(SEATS.map(s=>s.z+'|'+s.y+'|'+s.row))].map(t=>t.split('|'));
  rowsZ.forEach(([z,y,row])=>{z=+z;y=+y;if(y<=0.01)return;const isBal=SEATS.find(s=>s.row===row&&s.cls==='balcony');
    const d=isBal?1.35:(row==='J'||row==='K'?2.1:1.25);
    const m=new THREE.Mesh(new THREE.BoxGeometry(25,y,d),riserMat);m.position.set(0,y/2,z+0.05);scene.add(m);
    const led=new THREE.Mesh(new THREE.BoxGeometry(25,.03,.03),stepLed);led.position.set(0,y+.01,z-d/2+.02);scene.add(led)});
  // balcony front parapet glow
  const balZ=Math.min(...SEATS.filter(s=>s.cls==='balcony').map(s=>s.z)), balY=SEATS.find(s=>s.cls==='balcony').y;
  const par=new THREE.Mesh(new THREE.BoxGeometry(25,1,.25),new THREE.MeshStandardMaterial({color:'#2a1a12',roughness:.6}));par.position.set(0,balY+.2,balZ-1.0);scene.add(par);
  const parLed=new THREE.Mesh(new THREE.BoxGeometry(25,.06,.06),new THREE.MeshBasicMaterial({color:'#b98bff'}));parLed.position.set(0,balY+.72,balZ-0.87);scene.add(parLed);

  // walls with wood slats + sconces
  const wallMat=new THREE.MeshStandardMaterial({color:'#140d0c',roughness:.9});
  const slatMat=new THREE.MeshStandardMaterial({color:'#5a3622',roughness:.55});
  const sconce=new THREE.MeshBasicMaterial({color:'#ffcf8a'});
  [-1,1].forEach(sd=>{
    const w=new THREE.Mesh(new THREE.PlaneGeometry(46,16),wallMat);w.rotation.y=-sd*Math.PI/2;w.position.set(sd*13,8,4);scene.add(w);
    const slats=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,9,.5),slatMat,34);const o=new THREE.Object3D();
    for(let i=0;i<34;i++){o.position.set(sd*12.8,6.5,-12+i*1.05);o.updateMatrix();slats.setMatrixAt(i,o.matrix)}scene.add(slats);
    for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.1,.7,.25),sconce);s.position.set(sd*12.6,11.6,-9+i*5.2);scene.add(s)}
  });
  const back=new THREE.Mesh(new THREE.PlaneGeometry(26,16),wallMat);back.position.set(0,8,26);back.rotation.y=Math.PI;scene.add(back);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(26,46),new THREE.MeshStandardMaterial({color:'#08080c'}));ceil.rotation.x=Math.PI/2;ceil.position.set(0,16,4);scene.add(ceil);
  // ceiling star lights
  const sg=new THREE.BufferGeometry(),sp=[];for(let i=0;i<220;i++)sp.push((Math.random()-.5)*24,15.9,-12+Math.random()*38);sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:'#ffe2b0',size:.09})));

  // screen
  const scrW=19,scrH=8;
  const scrTex=tex.load(img(S.movie,'b'));scrTex.colorSpace=THREE.SRGBColorSpace;
  const scrGeo=new THREE.PlaneGeometry(scrW,scrH,32,1);{const p=scrGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,(x*x)/scrW*0.35)}}
  const screen=new THREE.Mesh(scrGeo,new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false,color:'#ffffff'}));screen.position.set(0,7.2,-15.2);scene.add(screen);
  const frame=new THREE.Mesh(new THREE.PlaneGeometry(scrW+.6,scrH+.6),new THREE.MeshBasicMaterial({color:'#000'}));frame.position.set(0,7.2,-15.35);scene.add(frame);
  // glow sprite
  const gc=document.createElement('canvas');gc.width=gc.height=128;const gx=gc.getContext('2d');const gr=gx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(190,215,255,.55)');gr.addColorStop(1,'rgba(190,215,255,0)');gx.fillStyle=gr;gx.fillRect(0,0,128,128);
  const glowTex=new THREE.CanvasTexture(gc);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(36,20),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.set(0,7.2,-15.5);scene.add(glow);
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(26,14),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(0,.02,-10);scene.add(pool);
  // stage + led strip
  const stageM=new THREE.Mesh(new THREE.BoxGeometry(24,1.2,3),new THREE.MeshStandardMaterial({color:'#2b1a10',roughness:.5}));stageM.position.set(0,.6,-14.2);scene.add(stageM);
  const led=new THREE.Mesh(new THREE.BoxGeometry(24,.08,.08),new THREE.MeshBasicMaterial({color:'#ffc531'}));led.position.set(0,1.22,-12.68);scene.add(led);
  // curtains
  const curtMat=new THREE.MeshStandardMaterial({color:'#8c0f18',roughness:.65,side:THREE.DoubleSide});
  const mkCurt=(w,h)=>{const g=new THREE.PlaneGeometry(w,h,60,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*5.5)*.22)}g.computeVertexNormals();return new THREE.Mesh(g,curtMat)};
  [-1,1].forEach(sd=>{const c=mkCurt(3.4,13.5);c.position.set(sd*(scrW/2+1.3),6.9,-14.6);scene.add(c)});
  const val=mkCurt(26,2.2);val.position.set(0,12.6,-14.5);scene.add(val);

  // seats: one instanced mesh, merged geometry
  const base=new RoundedBoxGeometry(.82,.28,.78,2,.08);base.translate(0,.38,0);
  const backG=new RoundedBoxGeometry(.82,.82,.16,2,.07);backG.rotateX(-.16);backG.translate(0,.86,.36);
  const armL=new RoundedBoxGeometry(.1,.3,.7,1,.04);armL.translate(-.46,.58,.02);
  const armR=armL.clone();armR.translate(.92,0,0);
  const seatGeo=mergeGeometries([base,backG,armL,armR]);
  const seatMat=new THREE.MeshStandardMaterial({roughness:.5,metalness:.05});
  const mesh=new THREE.InstancedMesh(seatGeo,seatMat,SEATS.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
  const legs=new THREE.InstancedMesh(new THREE.BoxGeometry(.5,.25,.5),new THREE.MeshStandardMaterial({color:'#111'}),SEATS.length);scene.add(legs);
  const CEN=new THREE.Vector3(0,0,-24);
  const obj=new THREE.Object3D(), lift=new Float32Array(SEATS.length), liftT=new Float32Array(SEATS.length);
  const rotY=SEATS.map(s=>Math.atan2(s.x,s.z-CEN.z)*.9);
  // curve rows toward the screen
  SEATS.forEach(s=>{const r=s.z-CEN.z;const th=s.x/r;s.px=Math.sin(th)*r;s.pz=CEN.z+Math.cos(th)*r;s.ry=th});
  const col=new THREE.Color();
  let hover=-1;
  function setMatrix(i){const s=SEATS[i];const sc=s.wide?1.38:1;obj.position.set(s.px,s.y+lift[i],s.pz);obj.rotation.set(0,s.ry,0);obj.scale.set(sc,1,s.wide?1.25:1);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);}
  function setColor(i){const s=SEATS[i];if(s.booked)col.set('#2e2e38');else if(s.sel)col.set('#2ee6d6');else{col.set(CLASSES[s.cls].color);if(i===hover)col.offsetHSL(0,0,.14)}mesh.setColorAt(i,col)}
  SEATS.forEach((s,i)=>{setMatrix(i);setColor(i);obj.position.set(s.px,s.y+.12,s.pz);obj.rotation.set(0,s.ry,0);obj.scale.set(1,1,1);obj.updateMatrix();legs.setMatrixAt(i,obj.matrix)});
  mesh.instanceColor.needsUpdate=true;

  // selection pins
  const pc=document.createElement('canvas');pc.width=pc.height=64;const px=pc.getContext('2d');px.fillStyle='#2ee6d6';px.shadowColor='#2ee6d6';px.shadowBlur=14;px.beginPath();px.arc(32,32,14,0,7);px.fill();
  const pinMat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(pc),depthTest:false,transparent:true});
  const pins=new Map();
  function refresh(s){const i=s.idx;liftT[i]=s.sel?.22:(i===hover&&!s.booked?.12:0);setColor(i);mesh.instanceColor.needsUpdate=true;
    if(s.sel&&!pins.has(i)){const p=new THREE.Sprite(pinMat);p.scale.set(.55,.55,1);p.position.set(s.px,s.y+1.75,s.pz);scene.add(p);pins.set(i,p)}
    if(!s.sel&&pins.has(i)){scene.remove(pins.get(i));pins.delete(i)}}
  SEATS.forEach(refresh);

  // camera views
  let tween=null,tour=false,tourT=0;
  const V={
    overview:()=>[[0,17.5,24],[0,0.5,-3]],
    stage:()=>[[0,3.4,-12],[0,3,12]],
    balcony:()=>[[0,balY+2.6,balZ+4.2],[0,4,-15]],
    bird:()=>[[0,36,4.5],[0,0,3.5]],
  };
  function fit(p){ // pull back on tall/narrow screens
    const a=camera.aspect; if(a>=1.2)return p; const k=Math.min(1.75,1.2/a*1.05);
    const [pp,t0]=p; const tt=[t0[0],t0[1]-(a<1?2.2:0),t0[2]]; return [[tt[0]+(pp[0]-tt[0])*k,tt[1]+(pp[1]-tt[1])*k,tt[2]+(pp[2]-tt[2])*k],tt];}
  function view(name,seat){
    $$('#views button').forEach(b=>b.classList.toggle('on',b.dataset.v===name));
    tour = name==='tour'; if(tour){tween=null;tourT=Math.atan2(camera.position.x,camera.position.z-6);return}
    let p;
    if(name==='seat'&&seat){p=[[seat.px,seat.y+1.25,seat.pz+.1],[0,6.4,-15.2]];}
    else p=fit(V[name]());
    tween={t:0,fp:camera.position.clone(),ft:controls.target.clone(),tp:new THREE.Vector3(...p[0]),tt:new THREE.Vector3(...p[1])};
  }
  controls.addEventListener('start',()=>{if(tour){tour=false;$$('#views button').forEach(b=>b.classList.remove('on'))}tween=null});

  // picking
  const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
  function pick(e){const r=canvas.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);const h=ray.intersectObject(mesh);return h.length?h[0].instanceId:-1}
  const tip=$('#tip');
  function showTip(i,x,y){if(i<0){tip.classList.remove('on');return}const s=SEATS[i];tip.innerHTML=`<b>Row ${s.row} · Seat ${s.num}</b>${CLASSES[s.cls].name} · ${s.booked?'Booked':sar(priceOf(s))}`;tip.style.left=x+'px';tip.style.top=y+'px';tip.classList.add('on')}
  let down=null;
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||down)return;
    const i=pick(e);if(i!==hover){const old=hover;hover=i;if(old>=0)refresh(SEATS[old]);if(i>=0)refresh(SEATS[i]);canvas.style.cursor=i>=0&&!SEATS[i].booked?'pointer':'grab'}
    showTip(i,e.clientX,e.clientY);
  });
  canvas.addEventListener('pointerleave',()=>{showTip(-1);if(hover>=0){const o=hover;hover=-1;refresh(SEATS[o])}});
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()}});
  canvas.addEventListener('pointerup',e=>{
    if(!down)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
    if(d<8&&dt<600){const i=pick(e);if(i>=0){toggleSeat(SEATS[i]);showTip(i,e.clientX,e.clientY);if(e.pointerType!=='mouse'){clearTimeout(showTip.t);showTip.t=setTimeout(()=>showTip(-1),1600)}}}
  });

  function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=camera.aspect<1?62:48;camera.updateProjectionMatrix()}
  addEventListener('resize',resize);
  const clock=new THREE.Clock();let running=false;
  function loop(){
    if(!running)return;requestAnimationFrame(loop);
    const rawDt=clock.getDelta(),dt=Math.min(rawDt,.05);
    if(tween){tween.t=Math.min(1,tween.t+Math.min(rawDt,.3)/1.3);const k=tween.t<.5?4*tween.t**3:1-(-2*tween.t+2)**3/2;camera.position.lerpVectors(tween.fp,tween.tp,k);controls.target.lerpVectors(tween.ft,tween.tt,k);if(tween.t>=1)tween=null}
    else if(tour){tourT+=dt*.22;camera.position.set(Math.sin(tourT)*15,8+Math.sin(tourT*.7)*3,6+Math.cos(tourT)*17);controls.target.set(0,3,-4)}
    let dirty=false;for(let i=0;i<lift.length;i++){const d=liftT[i]-lift[i];if(Math.abs(d)>.002){lift[i]+=d*.2;setMatrix(i);dirty=true}}
    if(dirty)mesh.instanceMatrix.needsUpdate=true;
    pins.forEach((p,i)=>{p.position.y=SEATS[i].y+1.75+Math.sin(clock.elapsedTime*3+i)*.08});
    controls.update();renderer.render(scene,camera);
  }
  window.cnSeatXY=id=>{const s=SEATS.find(q=>q.row+q.num===id);const v=new THREE.Vector3(s.px,s.y+.6,s.pz).project(camera);const r=canvas.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]};
  return {
    start(){running=true;resize();const p=fit(V.overview());camera.position.set(p[0][0],p[0][1]+10,p[0][2]+14);controls.target.set(...p[1]);view('overview');clock.getDelta();loop()},
    stop(){running=false},
    refresh, view,
    dispose(){running=false;renderer.dispose();removeEventListener('resize',resize)}
  };
}
$$('#views button').forEach(b=>b.onclick=()=>hall&&hall.view(b.dataset.v));

function webglOK(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){return false}}
function openSeats(){
  if(!S.theatre){location.hash='#/movie/'+S.movie;return}
  const m=movie(),th=THEATRES.find(t=>t.id===S.theatre),d=dayInfo(S.date);
  $('#sTitle').textContent=m.title;
  $('#sSub').textContent=`${th.name} · ${S.date===0?'Today':DN[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()]} · ${S.time} · ${S.fmt}`;
  $('#seatBack').href='#/movie/'+m.slug;
  buildSeats();renderPanel();
  if(hall){hall.dispose();hall=null}
  $('#fallback').hidden=true;
  if(webglOK()){hall=makeHall()}
  if(hall)hall.start();else buildFallback();
}

/* ---------- snacks ---------- */
function renderSnacks(){
  $('#snackList').innerHTML=SNACKS.map(s=>`<div class="sn"><span class="ic">${s.ic}</span><div><b>${s.name}</b><br><small>${s.desc} · ${sar(s.p)}</small></div><div class="stepper"><button data-s="${s.id}" data-d="-1" aria-label="Less">&minus;</button><b>${S.snacks[s.id]||0}</b><button data-s="${s.id}" data-d="1" aria-label="More">+</button></div></div>`).join('');
  $$('#snackList button').forEach(b=>b.onclick=()=>{const v=Math.max(0,Math.min(9,(S.snacks[b.dataset.s]||0)+ +b.dataset.d));S.snacks[b.dataset.s]=v;save();renderSnacks()});
  const n=Object.values(S.snacks).reduce((a,b)=>a+b,0);$('#addSn').textContent=n?`Add ${n} item${n>1?'s':''} & continue`:'Continue';
}
$('#skipSn').onclick=()=>{S.snacks={};save();$('#snacks').hidden=true;location.hash='#/checkout'};
$('#addSn').onclick=()=>{$('#snacks').hidden=true;location.hash='#/checkout'};
$('#snacks').addEventListener('click',e=>{if(e.target.id==='snacks')$('#snacks').hidden=true});

/* ---------- checkout ---------- */
function totals(){
  if(!SEATS.length)buildSeats();
  const sel=selected(),byCls={};sel.forEach(s=>{byCls[s.cls]=(byCls[s.cls]||0)+1});
  const tix=sel.reduce((a,s)=>a+priceOf(s),0), sn=SNACKS.reduce((a,s)=>a+(S.snacks[s.id]||0)*s.p,0), fee=sel.length*4, tot=tix+sn+fee;
  return {sel,byCls,tix,sn,fee,tot,vat:Math.round(tot*15/115*100)/100};
}
function renderCheckout(){
  const t=totals();if(!t.sel.length){location.hash='#/seats';return}
  const m=movie(),th=THEATRES.find(x=>x.id===S.theatre),d=dayInfo(S.date);
  $('#coBack').href='#/seats';
  $('#coSum').innerHTML=`<img src="${img(m.slug,'p')}" alt="${m.title} poster"><div><span class="tag">${S.fmt}</span><h2 style="margin-top:8px">${m.title}</h2><p class="muted">${m.cert} · ${m.dur}</p>
   <div class="kv"><span>Cinema</span><b>${th.name}</b></div><div class="kv"><span>Date</span><b>${DN[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()]}</b></div><div class="kv"><span>Time</span><b>${S.time}</b></div><div class="kv"><span>Seats</span><b>${t.sel.map(s=>s.row+s.num).join(', ')}</b></div></div>`;
  $('#coRows').innerHTML=Object.entries(t.byCls).map(([k,n])=>`<div class="kv"><span>${CLASSES[k].name} × ${n}</span><b>${sar(n*(CLASSES[k].price+FORMATS[S.fmt]))}</b></div>`).join('')
   +SNACKS.filter(s=>S.snacks[s.id]).map(s=>`<div class="kv"><span>${s.name} × ${S.snacks[s.id]}</span><b>${sar(S.snacks[s.id]*s.p)}</b></div>`).join('')
   +`<div class="kv"><span>Booking fee</span><b>${sar(t.fee)}</b></div><div class="kv"><span>Includes VAT 15%</span><b>${sar(t.vat)}</b></div><div class="kv tot"><span>Total</span><b>${sar(t.tot)}</b></div>`;
  $('#payBtn').textContent=`Pay ${sar(t.tot)}`;
}
$('#payBtn').onclick=()=>{
  const t=totals(),m=movie(),th=THEATRES.find(x=>x.id===S.theatre),d=dayInfo(S.date);
  $('#proc').hidden=false;
  setTimeout(()=>{
    const tk={id:'CN'+Math.floor(100000+Math.random()*899999),movie:m.slug,title:m.title,theatre:th.name,date:`${DN[d.getDay()]} ${d.getDate()} ${MN[d.getMonth()]}`,iso:d.toISOString().slice(0,10),time:S.time,fmt:S.fmt,seats:t.sel.map(s=>s.row+s.num),screen:'Hall '+(1+hash(th.id+S.time)%6),total:t.tot,snacks:Object.values(S.snacks).reduce((a,b)=>a+b,0)};
    localStorage.setItem('cn_ticket',JSON.stringify(tk));
    $('#proc').hidden=true;badge();location.hash='#/ticket';confetti();
  },1600);
};

/* ---------- ticket ---------- */
function drawQR(cv,seed){
  const n=29,r=rng(seed),x=cv.getContext('2d'),s=cv.width/n;x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#0b0b10';
  const finder=(cx,cy)=>{x.fillRect(cx*s,cy*s,7*s,7*s);x.fillStyle='#fff';x.fillRect((cx+1)*s,(cy+1)*s,5*s,5*s);x.fillStyle='#0b0b10';x.fillRect((cx+2)*s,(cy+2)*s,3*s,3*s)};
  const inF=(i,j)=>(i<8&&j<8)||(i>n-9&&j<8)||(i<8&&j>n-9);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(!inF(i,j)&&r()>.52)x.fillRect(i*s,j*s,s,s);
  finder(0,0);finder(n-7,0);finder(0,n-7);
}
function renderTicket(){
  const tk=JSON.parse(localStorage.getItem('cn_ticket')||'null');
  if(!tk){$('#tk').innerHTML=`<div class="tk-l" style="grid-template-columns:1fr"><div><h2>No tickets yet</h2><p class="muted">Pick a film from the carousel to book your first seats.</p></div></div>`;return}
  $('#tk').innerHTML=`<div class="tk-l"><img src="${img(tk.movie,'p')}" alt="${tk.title} poster"><div><span class="tag">${tk.fmt}</span><h2 style="margin-top:8px">${tk.title}</h2><div class="tk-g">
   <div><small>Date</small><b>${tk.date}</b></div><div><small>Time</small><b>${tk.time}</b></div><div><small>Cinema</small><b>${tk.theatre.replace('CineNova ','')}</b></div><div><small>Screen</small><b>${tk.screen}</b></div>
   <div><small>Seats</small><b>${tk.seats.join(', ')}</b></div><div><small>Paid</small><b>${sar(tk.total)}</b></div></div></div></div>
   <div class="tk-r"><canvas width="290" height="290" id="qr"></canvas><div><small>BOOKING ID</small><br><b>${tk.id}</b>${tk.snacks?`<br><small>${tk.snacks} snack item${tk.snacks>1?'s':''}</small>`:''}</div></div>`;
  drawQR($('#qr'),tk.id);
  $('#icsBtn').onclick=()=>{const [h,mi]=tk.time.split(':');const dt=tk.iso.replace(/-/g,'')+'T'+h+mi+'00';
    const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CineNova concept//EN\r\nBEGIN:VEVENT\r\nUID:${tk.id}@cinenova.demo\r\nDTSTART:${dt}\r\nSUMMARY:${tk.title} at ${tk.theatre}\r\nDESCRIPTION:Seats ${tk.seats.join(' ')} · Booking ${tk.id}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='cinenova-ticket.ics';a.click()};
}
const tkScene=$('#tkScene');
function tilt(x,y){const t=$('#tk');t.style.transform=`rotateY(${x*14}deg) rotateX(${-y*12}deg)`;t.style.setProperty('--sh',(50+x*60)+'%')}
tkScene.addEventListener('pointermove',e=>{const r=tkScene.getBoundingClientRect();tilt((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5)});
tkScene.addEventListener('pointerleave',()=>tilt(0,0));
addEventListener('deviceorientation',e=>{if(cur==='ticket'&&e.gamma!=null)tilt(Math.max(-.5,Math.min(.5,e.gamma/60)),Math.max(-.5,Math.min(.5,(e.beta-45)/60)))});
function confetti(){
  const cols=['#ffc531','#2ee6d6','#ff4d5e','#8f5bd6','#33d17a'];
  for(let i=0;i<70;i++){const p=document.createElement('i');const s=6+Math.random()*6;
    Object.assign(p.style,{position:'fixed',left:'50%',top:'38%',width:s+'px',height:s*.5+'px',background:cols[i%5],zIndex:95,pointerEvents:'none',borderRadius:'2px'});document.body.appendChild(p);
    const a=Math.random()*Math.PI*2,v=160+Math.random()*320;
    p.animate([{transform:'translate(-50%,-50%) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*v}px,${Math.sin(a)*v+260}px) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:1500+Math.random()*900,easing:'cubic-bezier(.2,.7,.4,1)'}).onfinish=()=>p.remove()}
}

/* ---------- router ---------- */
let cur='';
function route(){
  const h=location.hash||'#/';const [,name,arg]=h.split('/');
  let scr='home';
  if(name==='movie')scr='detail';else if(name==='seats')scr='seats';else if(name==='checkout')scr='checkout';else if(name==='ticket')scr='ticket';
  if(h==='#times')return;
  $('#snacks').hidden=true;
  if(cur==='seats'&&scr!=='seats'&&hall){hall.stop()}
  $$('.screen').forEach(s=>s.classList.toggle('on',s.dataset.screen===scr));
  document.body.classList.toggle('in-seats',scr==='seats');
  if(scr!==cur||scr==='detail')scrollTo({top:0,behavior:'instant'});
  cur=scr;
  if(scr==='home'){layout();info()}
  if(scr==='detail')renderDetail(arg);
  if(scr==='seats')openSeats();
  if(scr==='checkout')renderCheckout();
  if(scr==='ticket')renderTicket();
  document.title = scr==='home'?'CineNova | Book movie tickets in 3D':`${movie().title} | CineNova`;
}
addEventListener('hashchange',route);
route();
