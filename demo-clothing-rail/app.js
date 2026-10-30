(function(){
"use strict";
var G=window.GARMENTS, PRODUCTS=G.products;
var $=function(s,r){return (r||document).querySelector(s)};
function sar(n){return 'SAR '+n.toLocaleString('en-US')}
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Rail engine ---------- */
var rails=[];var HOOK=30/1160; /* hook tip position inside every garment image */
function Rail(stage,list,opt){
  var self=this;
  this.stage=stage;this.list=list;this.opt=opt;
  this.track=$('.track',stage);this.rod=$('.rod',stage);
  this.cap=opt.caption;
  this.items=[];this.offset=0;this.vel=0;this.prevVel=0;this.acc=0;this.snap=null;this.focus=-1;
  this.drag=null;this.visible=true;
  list.forEach(function(p,i){
    var el=document.createElement('div');el.className='g';el.dataset.i=i;
    el.innerHTML='<div class="g-swing"><div class="g-lift"><div class="g-turn"><img alt="'+p.name+'" draggable="false"></div></div><div class="tag"><i class="str"></i><b>'+sar(p.price).replace('SAR ','SAR<br>')+'<small>'+String(i+1).padStart(2,'0')+'</small></b></div></div>';
    $('img',el).src=G.url(p,'front');$('.tag',el).style.top=(p.neck*100).toFixed(2)+'%';
    self.track.appendChild(el);
    self.items.push({el:el,swing:$('.g-swing',el),tag:$('.tag',el),img:$('img',el),p:p,th:0,w:0,tt:0,tw:0,part:0,
      k:40+Math.random()*16,c:1.3+Math.random()*.5,ph:Math.random()*6.28,x:0});
  });
  this.layout();
  this.bind();
  rails.push(this);
}
Rail.prototype.layout=function(){
  var W=this.stage.clientWidth,H=this.stage.clientHeight,o=this.opt;
  this.W=W;this.H=H;
  var gh=Math.min(o.maxH,H*o.hFrac), gw=gh*.75;
  this.gw=gw;this.gh=gh;
  this.sp=Math.max(o.minSp,gw*o.spFrac);
  this.partPx=gw*.5+this.sp*.45-this.sp*.5;
  this.rodTop=o.rodTop;
  this.sag=Math.min(o.sag,W*.05);
  this.min=0;this.max=(this.list.length-1)*this.sp;
  var self=this;
  this.items.forEach(function(it){it.el.style.width=gw+'px';var sl=$('.str',it.el);if(sl)sl.style.height=Math.max(4,(0.175-it.p.neck)*gh).toFixed(1)+'px';});
  // rod path
  var pts=[],steps=40;
  for(var s=0;s<=steps;s++){var x=-30+(W+60)*s/steps;pts.push((s?'L':'M')+x.toFixed(1)+' '+this.rodY(x).toFixed(1));}
  var d=pts.join(' ');
  var cap='';
  if(o.caps){var gf='url(#rg'+o.id+')',y1=this.rodY(10),y2=this.rodY(W-10);
    cap='<rect x="7" y="0" width="6" height="'+y1+'" fill="'+gf+'"/><rect x="'+(W-13)+'" y="0" width="6" height="'+y2+'" fill="'+gf+'"/><circle cx="10" cy="'+y1+'" r="7" fill="'+gf+'"/><circle cx="'+(W-10)+'" cy="'+y2+'" r="7" fill="'+gf+'"/>';}
  this.rod.setAttribute('viewBox','0 0 '+W+' '+H);
  this.rod.innerHTML='<defs><linearGradient id="rg'+o.id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#d9d7de"/><stop offset=".55" stop-color="#8d8a95"/><stop offset=".78" stop-color="#e4e2e8"/><stop offset="1" stop-color="#5f5c66"/></linearGradient></defs>'+
    '<path d="'+d+'" fill="none" stroke="rgba(30,20,50,.12)" stroke-width="'+(o.rodW+2)+'" transform="translate(0 4)" stroke-linecap="round"/>'+
    '<path d="'+d+'" fill="none" stroke="#6f6c77" stroke-width="'+o.rodW+'" stroke-linecap="round"/>'+
    '<path d="'+d+'" fill="none" stroke="#a9a6b1" stroke-width="'+(o.rodW*.72)+'" stroke-linecap="round" transform="translate(0 -.4)"/>'+
    '<path d="'+d+'" fill="none" stroke="#d6d4dc" stroke-width="'+(o.rodW*.42)+'" stroke-linecap="round" transform="translate(0 -'+(o.rodW*.14)+')"/>'+
    '<path d="'+d+'" fill="none" stroke="#fff" stroke-opacity=".95" stroke-width="'+Math.max(1,o.rodW*.16)+'" stroke-linecap="round" transform="translate(0 -'+(o.rodW*.24)+')"/>'+cap;
  if(this.offset<this.min||this.offset>this.max)this.offset=Math.max(this.min,Math.min(this.max,this.offset));
};
Rail.prototype.rodY=function(x){var u=(x/this.W)*2-1;if(this.opt.arch){var k=Math.min(this.opt.sag,this.W*.11);return this.rodTop+k*u*u;}return this.rodTop+this.sag*(1-u*u);};
Rail.prototype.center=function(i){return i*this.sp;};
Rail.prototype.bind=function(){
  var self=this,st=this.stage;
  st.addEventListener('pointerdown',function(e){
    if(e.button>0||e.target.closest('.arrow'))return;
    self.drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,o0:self.offset,t0:performance.now(),moved:false,samples:[[performance.now(),e.clientX]],locked:false};
    self.snap=null;self.vel=0;
  });
  window.addEventListener('pointermove',function(e){
    var d=self.drag;if(!d||e.pointerId!==d.id)return;
    var dx=e.clientX-d.x0,dy=e.clientY-d.y0;
    if(!d.moved){
      if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)){d.moved=true;st.classList.add('dragging');st.classList.add('used');try{st.setPointerCapture(e.pointerId)}catch(_){}}
      else if(Math.abs(dy)>10){self.drag=null;return;}
      else return;
    }
    var o=d.o0-dx;
    if(o<self.min)o=self.min-(self.min-o)*.35; if(o>self.max)o=self.max+(o-self.max)*.35;
    self.offset=o;
    d.samples.push([performance.now(),e.clientX]);if(d.samples.length>6)d.samples.shift();
  });
  function up(e){
    var d=self.drag;if(!d||e.pointerId!==d.id)return;self.drag=null;st.classList.remove('dragging');
    if(d.moved){
      var s=d.samples,a=s[0],b=s[s.length-1],dt=(b[0]-a[0])/1000;
      self.vel=dt>0.004?-(b[1]-a[1])/dt:0;
      if(performance.now()-b[0]>90)self.vel=0;
      self.vel=Math.max(-4200,Math.min(4200,self.vel));
    } else if(e.type==='pointerup'){
      self.tap(e.clientX,e.clientY);
    }
  }
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  var arrows=st.querySelectorAll('.arrow');
  arrows[0].addEventListener('click',function(){self.step(-1)});
  arrows[1].addEventListener('click',function(){self.step(1)});
  st.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){self.step(1);e.preventDefault();}
    else if(e.key==='ArrowLeft'){self.step(-1);e.preventDefault();}
    else if((e.key==='Enter'||e.key===' ')&&self.focus>=0){openDetail(self,self.focus);e.preventDefault();}
    else if(e.key==='Escape')self.setFocus(-1);
  });
  st.addEventListener('wheel',function(e){
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();self.snap=null;self.offset=Math.max(self.min-60,Math.min(self.max+60,self.offset+e.deltaX));self.vel=e.deltaX*20;}
  },{passive:false});
  if(this.cap){$('.cap-open',this.cap).addEventListener('click',function(){if(self.focus>=0)openDetail(self,self.focus)});}
};
Rail.prototype.step=function(dir){
  var i=this.focus>=0?this.focus+dir:Math.round(this.offset/this.sp)+dir;
  i=Math.max(0,Math.min(this.items.length-1,i));this.setFocus(i);
};
Rail.prototype.tap=function(cx,cy){
  var el=document.elementFromPoint(cx,cy),g=el&&el.closest&&el.closest('.g');
  var i=-1;
  if(g&&this.track.contains(g))i=+g.dataset.i;
  else{ // nearest garment under the rod within its width
    var r=this.stage.getBoundingClientRect(),x=cx-r.left,best=1e9,self=this;
    this.items.forEach(function(it,k){var dd=Math.abs(it.x-x);if(dd<best&&dd<self.sp*.5&&cy-r.top<self.rodTop+self.gh)best=dd,i=k;});
  }
  if(i<0){this.setFocus(-1);return;}
  if(i===this.focus)openDetail(this,i);else this.setFocus(i);
};
Rail.prototype.setFocus=function(i){
  if(this.focus>=0)this.items[this.focus].el.classList.remove('is-focus');
  this.focus=i;
  if(i>=0){
    var it=this.items[i];it.el.classList.add('is-focus');
    this.snap=this.center(i);
    it.w+=(Math.random()>.5?1:-1)*10; // a small swing as it is picked
    if(this.cap){$('.cap-name',this.cap).textContent=it.p.name;$('.cap-price',this.cap).textContent=sar(it.p.price);this.cap.classList.add('has');}
  } else if(this.cap)this.cap.classList.remove('has');
};
Rail.prototype.tick=function(dt,t){
  var self=this,W=this.W;
  if(!this.drag||!this.drag.moved){
    if(this.snap!=null){
      var k=70,c=2*Math.sqrt(k)*.85;
      this.vel+=((this.snap-this.offset)*k-this.vel*c)*dt;
      this.offset+=this.vel*dt;
      if(Math.abs(this.snap-this.offset)<.3&&Math.abs(this.vel)<4){this.offset=this.snap;this.vel=0;this.snap=null;}
    } else {
      this.offset+=this.vel*dt;
      this.vel*=Math.exp(-dt*2.6);
      if(this.offset<this.min){this.vel+=(this.min-this.offset)*90*dt;this.vel*=Math.exp(-dt*8);}
      else if(this.offset>this.max){this.vel+=(this.max-this.offset)*90*dt;this.vel*=Math.exp(-dt*8);}
      if(Math.abs(this.vel)<2&&this.offset>=this.min&&this.offset<=this.max)this.vel=0;
    }
  }
  // measured velocity / acceleration of the rail itself
  var mv=(this.lastOff==null?0:(this.offset-this.lastOff)/dt);this.lastOff=this.offset;
  this.mv=(this.mv||0)*.6+mv*.4;
  var acc=(this.mv-(this.pmv||0))/dt;this.pmv=this.mv;
  this.acc=(this.acc||0)*.5+acc*.5;
  var air=Math.max(-3.5,Math.min(3.5,-this.mv*.0016));
  var gain=-.026;
  var f=this.focus;
  for(var i=0;i<this.items.length;i++){
    var it=this.items[i];
    var target=f<0||i===f?0:(i<f?-1:1)*this.partPx;
    it.part+=(target-it.part)*Math.min(1,dt*7);
    var x=W/2+this.center(i)-this.offset+it.part;it.x=x;
    var on=x>-this.gw&&x<W+this.gw;
    if(on!==it.on){it.el.style.visibility=on?'':'hidden';it.on=on;}
    // pendulum: rail acceleration and air drag push the hem
    var breeze=Math.sin(t*.9+it.ph)*.35;
    var aTh=-it.k*(it.th-air-breeze)-it.c*it.w+gain*.35*this.acc;
    it.w+=aTh*dt;it.th+=it.w*dt;
    if(it.th>4.5){it.th=4.5;it.w*=-.3}else if(it.th<-4.5){it.th=-4.5;it.w*=-.3}
    var aT=-26*(it.tt)-1.4*it.tw-aTh*.9;
    it.tw+=aT*dt;it.tt+=it.tw*dt;it.tt=Math.max(-40,Math.min(40,it.tt));
    if(!on)continue;
    var u=(x/W)*2-1,s=this.opt.depth?1-this.opt.depth*Math.min(1,u*u):1;
    var y=this.rodY(x)-this.opt.rodW*.5-this.gh*HOOK;
    it.el.style.transform='translate3d('+(x-this.gw/2).toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+s.toFixed(4)+')';
    it.el.style.zIndex=i===f?50:(20-Math.round(Math.abs(u)*10));
    it.swing.style.transform='rotate('+it.th.toFixed(3)+'deg)';
    it.tag.style.transform='rotate('+it.tt.toFixed(2)+'deg)';
  }
};
Rail.prototype.intro=function(){
  if(reduce)return;
  this.offset=this.offset+this.sp*5;this.vel=-this.sp*5*2.6-200;
};

/* ---------- loop ---------- */
var last=performance.now();
function loop(now){
  var dt=Math.min(.033,(now-last)/1000);last=now;
  for(var i=0;i<rails.length;i++)if(rails[i].visible)rails[i].tick(dt,now/1000);
  requestAnimationFrame(loop);
}

/* ---------- setup rails ---------- */
var hero=$('#stage'),hero2=$('#stage2');
var wide=function(){return window.innerWidth>=900};
var r1=new Rail(hero,PRODUCTS.slice(0,8),{id:1,caption:$('.hero .caption'),maxH:640,hFrac:window.innerWidth<700?1.02:.95,spFrac:window.innerWidth<700?.5:.27,minSp:window.innerWidth<700?78:84,rodTop:window.innerWidth<700?34:18,sag:26,arch:false,rodW:8,rodCol:'#b4b1bb',depth:.06,caps:false});
var order=[3,0,5,1,6,4,7,2];
var r2=new Rail(hero2,order.map(function(i){return PRODUCTS[i]}),{id:2,caption:$('.rail2 .caption'),maxH:440,hFrac:.93,spFrac:.27,minSp:64,rodTop:22,sag:40,rodW:6,rodCol:'#c4c1c9',depth:0,caps:true});
r1.offset=r1.max/2;r2.offset=r2.max/2;
function size2(){var w=window.innerWidth;hero2.style.setProperty('--h2',Math.round(w<700?Math.min(400,Math.max(320,w*.86)):Math.min(520,Math.max(380,w*.34)))+'px');}
size2();r1.layout();r2.layout();
r1.intro();
if('IntersectionObserver' in window){
  var seen2=false;
  new IntersectionObserver(function(es){es.forEach(function(e){
    var r=e.target===hero?r1:r2;r.visible=e.isIntersecting;
    if(e.target===hero2&&e.isIntersecting&&!seen2){seen2=true;r2.intro();}
  })},{rootMargin:'80px'}).observe(hero);
}
// observe both
(function(){if(!('IntersectionObserver' in window))return;var seen=false;var io=new IntersectionObserver(function(es){es.forEach(function(e){r2.visible=e.isIntersecting;if(e.isIntersecting&&!seen){seen=true;r2.intro();}})},{rootMargin:'80px'});io.observe(hero2);})();
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){size2();r1.layout();r2.layout();},120)});
requestAnimationFrame(loop);

/* header state */
var top=$('.top');function hs(){top.classList.toggle('solid',window.scrollY>30)}hs();window.addEventListener('scroll',hs,{passive:true});

/* ---------- product sheet ---------- */
var sheet=$('#sheet'),media=$('#sheetMedia'),flip=$('#flip'),pImg=$('#pImg'),pBack=$('#pImgBack');
var cur=null; // {rail,i,p,hex,size,view}
var SIZES=['S','M','L','XL','XXL'];
function fillSheet(){
  var p=cur.p;
  $('#pCount').textContent=String(PRODUCTS.indexOf(p)+1).padStart(2,'0')+' / '+String(PRODUCTS.length).padStart(2,'0');
  $('#pKind').textContent=p.kind;$('#pName').textContent=p.name;$('#pPrice').textContent=sar(p.price);
  $('#pDesc').textContent=p.desc;$('#pTag').textContent=p.price>=400?'Limited':'New';
  pImg.src=G.url(p,'front',cur.hex);pBack.src=G.url(p,'front',cur.hex);pImg.alt=p.name+' front';pBack.alt=p.name+' back';
  var dots=$('#dots');dots.innerHTML='';
  p.colors.forEach(function(c){var b=document.createElement('button');b.className='cdot'+(c.hex===cur.hex?' on':'');b.style.background=c.hex;b.setAttribute('aria-label',c.name);
    b.onclick=function(){cur.hex=c.hex;fillSheet();};dots.appendChild(b);});
  var cn=p.colors.filter(function(c){return c.hex===cur.hex})[0];$('#colName').textContent=cn?cn.name:'';
  var sz=$('#sizes');sz.innerHTML='';
  SIZES.forEach(function(s){var b=document.createElement('button');b.className='size'+(s===cur.size?' on':'');b.textContent=s;
    if(s==='XXL'&&p.id!=='navy'&&p.id!=='stone'){b.disabled=true;b.setAttribute('aria-label','XXL sold out');}
    b.onclick=function(){cur.size=s;fillSheet();};sz.appendChild(b);});
  $('#sizeNote').textContent=p.type==='bomber'||p.type==='puffer'?'Regular fit':'Oversized fit, size down for a closer fit';
}
function setView(v){cur.view=v;flip.classList.toggle('back',v==='back');
  document.querySelectorAll('.seg button').forEach(function(b){var on=b.dataset.view===v;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  $('.seg').classList.toggle('right',v==='back');}
document.querySelectorAll('.seg button').forEach(function(b){b.onclick=function(){setView(b.dataset.view)}});

function rect(el){return el.getBoundingClientRect()}
function flyImg(src,from,to,dur,lift,cb){
  var im=document.createElement('img');im.className='fly';im.src=src;
  im.style.left=to.left+'px';im.style.top=to.top+'px';im.style.width=to.width+'px';im.style.height=to.height+'px';
  document.body.appendChild(im);
  var sx=from.width/to.width,sy=from.height/to.height,dx=from.left-to.left,dy=from.top-to.top;
  var a=im.animate([
    {transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')'},
    {transform:'translate('+(dx*.45)+'px,'+(dy*.45-lift)+'px) scale('+((sx+1)/2*1.04)+','+((sy+1)/2*1.04)+') rotate(-2deg)',offset:.45},
    {transform:'none'}],{duration:reduce?1:dur,easing:'cubic-bezier(.3,.7,.2,1)',fill:'forwards'});
  a.onfinish=function(){cb&&cb(im);};
  return im;
}
// the visible garment box (img inside the turned element) mapped to a 3:4 box
function boxOf(img){var r=rect(img);return {left:r.left,top:r.top,width:r.width,height:r.width*4/3};}
function openDetail(rail,i){
  var it=rail.items[i];
  cur={rail:rail,i:i,p:it.p,hex:it.p.color,size:'M',view:'front'};
  fillSheet();setView('front');resetAdd();
  sheet.hidden=false;document.body.style.overflow='hidden';
  media.classList.add('flying');
  var from=boxOf(it.img);
  requestAnimationFrame(function(){
    sheet.classList.add('open');
    var to=rect(pImg);
    it.el.classList.add('lifted');
    flyImg(it.img.src,from,to,720,60,function(im){media.classList.remove('flying');setTimeout(function(){im.remove()},40);});
  });
  setTimeout(function(){$('.close',sheet).focus({preventScroll:true})},700);
}
function closeDetail(){
  if(!cur)return;var it=cur.rail.items[cur.i];
  var from=rect(pImg);
  media.classList.add('flying');sheet.classList.remove('open');
  it.el.classList.remove('lifted');it.img.style.opacity='0';
  var to=boxOf(it.img);
  // reverse flight: start at sheet image, land on rail
  var im2=document.createElement('img');im2.className='fly';im2.src=G.url(it.p,'front');
  im2.style.left=to.left+'px';im2.style.top=to.top+'px';im2.style.width=to.width+'px';im2.style.height=to.height+'px';document.body.appendChild(im2);
  var sx=from.width/to.width,dx=from.left-to.left,dy=from.top-to.top;
  var a=im2.animate([{transform:'translate('+dx+'px,'+dy+'px) scale('+sx+')'},{transform:'none'}],{duration:reduce?1:560,easing:'cubic-bezier(.3,.7,.2,1)',fill:'forwards'});
  a.onfinish=function(){it.img.style.opacity='';im2.remove();it.w+=60;};
  document.querySelectorAll('.fly').forEach(function(f){if(f!==im2)f.remove()});
  setTimeout(function(){sheet.hidden=true;media.classList.remove('flying');document.body.style.overflow='';},420);
  cur=null;
}
sheet.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeDetail();});

/* add to cart */
var addBtn=$('#addBtn'),viewCart=$('#viewCart'),addT;
function resetAdd(){clearTimeout(addT);addBtn.className='add';addBtn.disabled=false;viewCart.classList.remove('show');}
addBtn.addEventListener('click',function(){
  if(!cur||addBtn.disabled)return;
  if(!cur.size){var s=$('#sizes');s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake');toast('Pick a size first');return;}
  addBtn.disabled=true;addBtn.classList.add('loading');
  var snap={p:cur.p,hex:cur.hex,size:cur.size};
  addT=setTimeout(function(){
    addBtn.classList.remove('loading');addBtn.classList.add('added');
    addToCart(snap.p,snap.hex,snap.size);
    // thumbnail flies to the cart icon
    var from=rect(pImg),cb=rect($('#cartBtn'));
    var to={left:cb.left+cb.width/2-14,top:cb.top+cb.height/2-18,width:28,height:37};
    var im=document.createElement('img');im.className='fly';im.src=G.url(snap.p,'front',snap.hex);
    Object.assign(im.style,{left:to.left+'px',top:to.top+'px',width:to.width+'px',height:to.height+'px'});document.body.appendChild(im);
    var a=im.animate([{transform:'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+(from.width/to.width)+')',opacity:1},
      {transform:'translate('+((from.left-to.left)*.4)+'px,'+((from.top-to.top)*.4-120)+'px) scale('+(from.width/to.width*.4)+')',opacity:1,offset:.5},
      {transform:'none',opacity:.2}],{duration:reduce?1:850,easing:'cubic-bezier(.5,0,.3,1)'});
    a.onfinish=function(){im.remove();bumpBadge();};
    viewCart.classList.add('show');
    addT=setTimeout(function(){openCart();},1250);
    setTimeout(function(){if(addBtn.classList.contains('added')){addBtn.className='add';addBtn.disabled=false;}},2600);
  },reduce?50:950);
});
viewCart.addEventListener('click',function(){clearTimeout(addT);openCart();});

/* ---------- cart ---------- */
var cart=[];try{cart=JSON.parse(localStorage.getItem('veloura-cart')||'[]').filter(function(l){return PRODUCTS.some(function(p){return p.id===l.id})})}catch(e){cart=[]}
var discount=false;
function save(){try{localStorage.setItem('veloura-cart',JSON.stringify(cart))}catch(e){}}
function prod(id){return PRODUCTS.filter(function(p){return p.id===id})[0]}
function addToCart(p,hex,size){
  var l=cart.filter(function(x){return x.id===p.id&&x.hex===hex&&x.size===size})[0];
  if(l)l.q++;else cart.push({id:p.id,hex:hex,size:size,q:1});
  save();renderCart();
}
function count(){return cart.reduce(function(a,l){return a+l.q},0)}
function bumpBadge(){var b=$('#badge');b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');}
function renderCart(){
  var b=$('#badge'),n=count();b.textContent=n;b.classList.toggle('show',n>0);
  var ul=$('#lines');ul.innerHTML='';var sub=0;
  cart.forEach(function(l,idx){
    var p=prod(l.id);sub+=p.price*l.q;
    var cn=(p.colors.filter(function(c){return c.hex===l.hex})[0]||{}).name||'';
    var li=document.createElement('li');li.className='line';
    li.innerHTML='<div class="thumb"><img alt=""></div><div><h3></h3><div class="meta"></div><div class="qty"><button aria-label="Less">&minus;</button><span></span><button aria-label="More">+</button></div></div><div class="right"><span class="price"></span><button class="trash" aria-label="Remove"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>';
    $('img',li).src=G.url(p,'front',l.hex);$('h3',li).textContent=p.name;$('.meta',li).textContent=cn+' · Size '+l.size;
    $('.qty span',li).textContent=l.q;$('.price',li).textContent=sar(p.price*l.q);
    var bs=li.querySelectorAll('.qty button');
    bs[0].onclick=function(){l.q--;if(l.q<1)cart.splice(idx,1);save();renderCart();};
    bs[1].onclick=function(){l.q=Math.min(9,l.q+1);save();renderCart();};
    $('.trash',li).onclick=function(){cart.splice(idx,1);save();renderCart();};
    ul.appendChild(li);
  });
  var d=discount?Math.round(sub*.1):0,after=sub-d,ship=after>=400||after===0?0:25;
  $('#sub').textContent=sar(sub);$('#discAmt').textContent='- '+sar(d);$('#discRow').classList.toggle('show',discount&&sub>0);
  $('#shipAmt').textContent=ship?sar(ship):'Free';$('#total').textContent=sar(after+ship);
  $('#cartCount').textContent=n?'('+n+')':'';
  var left=400-after;$('#shipText').textContent=left>0?'Add '+sar(left)+' more for free delivery':'You have free delivery';
  $('#shipFill').style.width=Math.min(100,after/4)+'%';
  drawer.classList.toggle('is-empty',n===0);
}
var drawer=$('#drawer');
function openCart(){drawer.classList.remove('is-done');renderCart();drawer.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(function(){requestAnimationFrame(function(){drawer.classList.add('open')})});}
function closeCart(){drawer.classList.remove('open');setTimeout(function(){drawer.hidden=true;if(sheet.hidden)document.body.style.overflow='';},500);}
$('#cartBtn').addEventListener('click',openCart);
drawer.addEventListener('click',function(e){if(e.target.closest('[data-dclose]'))closeCart();});
$('#disc').addEventListener('submit',function(e){e.preventDefault();var v=$('#discIn').value.trim().toUpperCase(),m=$('#discMsg');
  if(v==='VELOURA10'){discount=true;m.textContent='VELOURA10 applied, 10% off';m.className='disc-msg good';}
  else{discount=false;m.textContent=v?'That code is not valid. Try VELOURA10':'Enter a code. Try VELOURA10';m.className='disc-msg bad';}
  renderCart();});
var co=$('#checkout');
co.addEventListener('click',function(){if(co.disabled)return;co.disabled=true;co.classList.add('loading');
  setTimeout(function(){co.classList.remove('loading');co.disabled=false;drawer.classList.add('is-done');cart=[];discount=false;save();var b=$('#badge');b.textContent=0;b.classList.remove('show');},1300);});
$('#doneBtn').addEventListener('click',function(){closeCart();if(!sheet.hidden)closeDetail();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!drawer.hidden)closeCart();else if(!sheet.hidden)closeDetail();}});
renderCart();

var tt;function toast(s){var t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show')},1800);}

/* expose for QA */
window.__rail={r1:r1,r2:r2,open:openDetail,openCart:openCart};
})();
