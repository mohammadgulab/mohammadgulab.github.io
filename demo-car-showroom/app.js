(function(){
"use strict";
gsap.registerPlugin(ScrollTrigger);

var CARS=[
 {id:"blue",stock:"MX-0214",name:"2022 Super SUV",sub:"Blue metallic · All-wheel drive",price:949000,
  specs:[["Mileage","18,400 km"],["Engine","4.0L twin-turbo V8"],["Power","641 hp"],["0 to 100","3.6 s"],["Drive","AWD"],["Seats","5"]],
  lot:[0.48,0.52], label:"Blue Super SUV",
  shots:[["blue-1.webp","Front",50,46],["blue-2.webp","Front 3/4",50,52],["blue-3.webp","Rear 3/4",50,45],["blue-4.webp","Rear",50,47]]},
 {id:"red",stock:"MX-0187",name:"2021 Hybrid V8 Supercar",sub:"Rosso red · Plug-in hybrid",price:1690000,
  specs:[["Mileage","9,800 km"],["Engine","4.0L V8 + 3 e-motors"],["Power","986 hp"],["0 to 100","2.5 s"],["Drive","AWD"],["Seats","2"]],
  lot:[0.085,0.235], label:"Red Hybrid Supercar",
  shots:[["red-1.webp","Front 3/4",54,55],["red-2.webp","Front 3/4, close",50,50],["red-3.webp","Front",50,56],["red-4.webp","Side detail",45,60],["red-5.webp","Rear",50,50]]},
 {id:"org",stock:"MX-0231",name:"2020 V8 Grand Tourer",sub:"Papaya orange · Rear-wheel drive",price:689000,
  specs:[["Mileage","22,600 km"],["Engine","4.0L twin-turbo V8"],["Power","612 hp"],["0 to 100","3.2 s"],["Drive","RWD"],["Seats","2"]],
  lot:[0.755,0.645], label:"Orange Grand Tourer",
  shots:[["org-1.webp","Front 3/4",50,45],["org-2.webp","Front 3/4, right",56,55],["org-4.webp","Rear 3/4",50,55],["org-3.webp","Rear 3/4, right",58,50],["org-5.webp","Rear",44,50]]}
];
var RATE=0.055;
var fmt=function(n){return "SAR "+Math.round(n).toLocaleString("en-US");};

var $=function(s,r){return (r||document).querySelector(s);};
var vp=$("#vp"), lot=$("#lot"), lotInner=$("#lotInner"), lotImg=$("#lotImg"), markers=$("#markers"), stage=$("#stage"), panel=$("#panel"), heroCopy=$("#heroCopy"), track=$("#track");

/* ---------- lot geometry ---------- */
var geo={tall:false,iw:2400,ih:1800,s0:1,ox:0,oy:0,vw:0,vh:0};
function isTall(){return window.innerWidth/window.innerHeight<1;}
function carPoint(c){ // fraction in current lot image
  var p=c.lot; return geo.tall?[1-p[1],p[0]]:[p[0],p[1]];
}
function layoutLot(){
  geo.tall=isTall();
  var want=geo.tall?"img/lot-tall.webp":"img/lot-wide.webp";
  if(lotImg.getAttribute("src")!==want) lotImg.setAttribute("src",want);
  geo.iw=geo.tall?1350:2400; geo.ih=1800;
  geo.vw=vp.clientWidth; geo.vh=vp.clientHeight;
  geo.s0=Math.max(geo.vw/geo.iw,geo.vh/geo.ih);
  var w=geo.iw*geo.s0,h=geo.ih*geo.s0;
  // on tall screens bias so all three cars sit inside the visible band
  geo.ox=(geo.vw-w)/2; geo.oy=(geo.vh-h)/2;
  if(geo.tall){ // centre the row of cars, not the photo
    var xs=CARS.map(function(c){return carPoint(c)[0]*w;}); var mid=(Math.min.apply(0,xs)+Math.max.apply(0,xs))/2;
    geo.ox=Math.min(0,Math.max(geo.vw-w,geo.vw/2-mid));
  }
  lotInner.style.width=w+"px"; lotInner.style.height=h+"px";
  lotInner.style.left=geo.ox+"px"; lotInner.style.top=geo.oy+"px";
}
var cam={amt:0,focus:0};
var KMAX=function(){return geo.tall?3.4:4.6;};
function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
function applyCam(){
  var w=geo.iw*geo.s0,h=geo.ih*geo.s0;
  var f=ease(Math.min(1,Math.max(0,cam.amt)));
  var k=1+(KMAX()-1)*f;
  var p=carPoint(CARS[cam.focus]); var px=p[0]*w, py=p[1]*h;
  var sx=geo.ox+px, sy=geo.oy+py; // screen pos at k=1
  var sr=stage.getBoundingClientRect(); var cx=sr.left+sr.width/2, cy=sr.top+sr.height/2;
  var dx=sx+(cx-sx)*f, dy=sy+(cy-sy)*f;
  var tx=dx-geo.ox-k*px, ty=dy-geo.oy-k*py;
  // clamp so the photo always covers the viewport
  var minX=geo.vw-geo.ox-k*w, maxX=-geo.ox, minY=geo.vh-geo.oy-k*h, maxY=-geo.oy;
  tx=Math.min(maxX,Math.max(minX,tx)); ty=Math.min(maxY,Math.max(minY,ty));
  lotInner.style.transform="translate3d("+tx+"px,"+ty+"px,0) scale("+k+")";
  // markers follow without scaling
  for(var i=0;i<CARS.length;i++){
    var q=carPoint(CARS[i]);
    var mx=geo.ox+tx+k*q[0]*w, my=geo.oy+ty+k*q[1]*h;
    var el=mkEls[i]; el.style.transform="translate3d("+mx+"px,"+my+"px,0)";
    var side=mx>geo.vw-110?"r":(mx<110?"l":""), up=my>geo.vh*(geo.tall?0.62:0.4);
    if(el._s!==side+up){el._s=side+up; el.classList.toggle("r",side==="r"); el.classList.toggle("l",side==="l"); el.classList.toggle("up",up);}
  }
}

/* ---------- build DOM ---------- */
var mkEls=[];
CARS.forEach(function(c,i){
  var b=document.createElement("button");
  b.className="mk"; b.type="button"; b.setAttribute("aria-label","View "+c.name+", "+fmt(c.price));
  b.innerHTML='<span class="dot"></span><span class="lab"><b>'+c.label+'</b><span>'+fmt(c.price)+'</span></span>';
  b.addEventListener("click",function(){goCar(i);});
  markers.appendChild(b); mkEls.push(b);

  var car=document.createElement("div"); car.className="car"; car.id="car-"+c.id;
  c.shots.forEach(function(s,k){
    var d=document.createElement("div"); d.className="shot";
    var im=document.createElement("img"); im.src="img/"+s[0]; im.alt=c.name+", "+s[1].toLowerCase()+" view"; im.decoding="async";
    if(i>0) im.loading="eager";
    im.style.objectPosition=s[2]+"% "+s[3]+"%";
    d.appendChild(im); car.appendChild(d);
  });
  var t=document.createElement("div"); t.className="carTitle"; t.innerHTML="<small>0"+(i+1)+" / 0"+CARS.length+"</small>"+c.name;
  var a=document.createElement("div"); a.className="angle";
  a.innerHTML='<span class="chip">'+c.shots[0][1]+'</span><span class="dots">'+c.shots.map(function(_,k){return "<i"+(k===0?' class="on"':'')+"></i>";}).join("")+'</span>';
  car.appendChild(t); car.appendChild(a);
  stage.appendChild(car); c.el=car;
});

/* ---------- panel + estimator ---------- */
var cur=-1, months=48, ctrEl=$("#ctrNum");
var down=$("#down");
function setPanel(i){
  if(i===cur) return; cur=i;
  var c=CARS[i];
  $("#pStock").textContent="Stock "+c.stock+" · Jeddah showroom";
  $("#pName").textContent=c.name; $("#pSub").textContent=c.sub; $("#pPrice").textContent=fmt(c.price);
  $("#pSpecs").innerHTML=c.specs.map(function(s){return "<div><dt>"+s[0]+"</dt><dd>"+s[1]+"</dd></div>";}).join("");
  calc();
}
function calc(){
  if(cur<0) return;
  var P=CARS[cur].price, pct=+down.value, d=P*pct/100, L=P-d, r=RATE/12, n=months;
  var m=L*r/(1-Math.pow(1+r,-n));
  $("#downPct").textContent=pct+"%"; $("#downAmt").textContent=fmt(d); $("#monthly").textContent=fmt(m);
  down.style.setProperty("--fill",((pct-10)/40*100)+"%");
}
down.addEventListener("input",calc);
document.querySelectorAll(".terms button").forEach(function(b){
  b.addEventListener("click",function(){
    months=+b.dataset.m;
    document.querySelectorAll(".terms button").forEach(function(x){var on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-checked",on?"true":"false");});
    calc();
  });
});

/* ---------- timeline ---------- */
var U={hero:0.7,dive:1.0,shot:0.75,exit:0.9};
var tl=gsap.timeline({paused:true,defaults:{ease:"none"}});
var segs=[]; // per car: {arrive, start, end}
var phone=function(){return window.innerWidth<900;};
var t=U.hero;
tl.to(heroCopy,{opacity:0,y:-30,duration:0.45},0.25);
CARS.forEach(function(c,i){
  var S=t;
  tl.set(cam,{focus:i},S);
  tl.to(cam,{amt:1,duration:U.dive,ease:"none"},S);
  tl.to(markers,{opacity:0,duration:0.3},S);
  tl.set(c.el,{visibility:"visible"},S+0.45);
  tl.fromTo(c.el,{opacity:0,scale:1.28},{opacity:1,scale:1,duration:0.55,ease:"power2.out"},S+0.45);
  tl.to(lot,{opacity:0,duration:0.35},S+0.7);
  tl.fromTo(panel,{x:function(){return phone()?0:"105%";},y:function(){return phone()?"105%":0;}},{x:0,y:0,duration:0.4,ease:"power2.out",immediateRender:false},S+0.8);
  var shots=c.el.querySelectorAll(".shot"), n=shots.length, A=S+U.dive;
  var chip=c.el.querySelector(".chip"), dots=c.el.querySelectorAll(".dots i");
  shots.forEach(function(sh,k){
    var img=sh.firstChild, st=A+k*U.shot;
    var dir=k%2?-1:1;
    if(k===0){ tl.set(sh,{opacity:1},S+0.45); }
    else { tl.to(sh,{opacity:1,duration:0.28},st-0.14); }
    tl.fromTo(img,{scale:1.04,xPercent:-1.5*dir},{scale:1.14,xPercent:1.5*dir,duration:U.shot+0.5},Math.max(S+0.45,st-0.25));
  });
  var E=A+n*U.shot;
  segs.push({S:S,arrive:S+U.dive+0.05,E:E,shots:n,A:A});
  // exit: back up to the lot
  tl.to(panel,{x:function(){return phone()?0:"105%";},y:function(){return phone()?"105%":0;},duration:0.3,ease:"power2.in"},E);
  tl.to(c.el,{opacity:0,scale:0.86,duration:0.45,ease:"power2.in"},E+0.05);
  tl.to(lot,{opacity:1,duration:0.35},E+0.1);
  tl.to(cam,{amt:0,duration:U.exit-0.15,ease:"none"},E+0.15);
  tl.to(markers,{opacity:1,duration:0.25},E+U.exit-0.25);
  tl.set(c.el,{visibility:"hidden"},E+U.exit);
  t=E+U.exit;
});
tl.to({},{duration:0.3},t);
var TOTAL=tl.duration();

function sizeTrack(){ track.style.height=(TOTAL*vp.clientHeight+vp.clientHeight)+"px"; }

var st;
function build(){
  layoutLot(); sizeTrack();
  if(st) st.kill();
  st=ScrollTrigger.create({trigger:track,start:"top top",end:"bottom bottom",scrub:0.5,animation:tl,
    onUpdate:function(){}});
  ScrollTrigger.refresh();
}
gsap.ticker.add(function(){
  applyCam();
  // which car is active, which angle
  var time=tl.time(), active=-1;
  for(var i=0;i<segs.length;i++){ if(time>=segs[i].S+0.6 && time<segs[i].E+0.2) active=i; }
  var ctr=active>=0?("0"+(active+1)+" / 0"+CARS.length+" · "+CARS[active].label):"Lot view";
  if(ctrEl.textContent!==ctr) ctrEl.textContent=ctr;
  if(active>=0){
    setPanel(active);
    var sg=segs[active], k=Math.min(sg.shots-1,Math.max(0,Math.floor((time-sg.A+0.14)/U.shot)));
    var c=CARS[active], chip=c.el.querySelector(".chip");
    if(chip.dataset.k!=String(k)){chip.dataset.k=k; chip.textContent=c.shots[k][1];
      c.el.querySelectorAll(".dots i").forEach(function(d,j){d.classList.toggle("on",j===k);});}
    panel.style.pointerEvents="auto"; panel.setAttribute("aria-hidden","false");
  } else {
    panel.style.pointerEvents="none"; panel.setAttribute("aria-hidden","true");
  }
  markers.style.pointerEvents=(cam.amt<0.15 && active<0)?"auto":"none";
  mkEls.forEach(function(m){m.tabIndex=(cam.amt<0.15&&active<0)?0:-1;});
});

/* ---------- navigation ---------- */
function timeToScroll(time){ return st.start+(time/TOTAL)*(st.end-st.start); }
function goCar(i){
  i=(i+CARS.length)%CARS.length;
  window.scrollTo({top:timeToScroll(segs[i].arrive+0.25),behavior:"smooth"});
}
$("#nextBtn").addEventListener("click",function(){goCar(cur+1);});
$("#prevBtn").addEventListener("click",function(){goCar(cur-1);});
$("#backLot").addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"});});
$("#brandLink").addEventListener("click",function(e){e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});});

/* ---------- inquire (nothing is sent) ---------- */
var dlg=$("#inq");
function openInq(){
  $("#fCar").value=cur>=0?(CARS[cur].name+" ("+CARS[cur].stock+")"):"General viewing";
  $("#fSent").hidden=true; $("#fSend").hidden=false;
  if(dlg.showModal) dlg.showModal(); else dlg.setAttribute("open","");
}
["#inqBtn","#topInquire","#visitInq"].forEach(function(s){$(s).addEventListener("click",openInq);});
$("#fSend").addEventListener("click",function(){ $("#fSent").hidden=false; $("#fSend").hidden=true; });

/* ---------- init ---------- */
window.addEventListener("resize",function(){
  var w=window.innerWidth;
  if(build._w===w && Math.abs(build._h-window.innerHeight)<120){ layoutLot(); return; } // mobile URL bar
  build._w=w; build._h=window.innerHeight; build();
});
build._w=window.innerWidth; build._h=window.innerHeight;
setPanel(0); cur=-1; setPanel(0);
build();
window.__demo={tl:tl,segs:segs,timeToScroll:timeToScroll,cam:cam,TOTAL:TOTAL};
})();
