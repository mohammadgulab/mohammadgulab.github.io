(function(){
var d=document,root=d.documentElement,q=location.search;
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var intro=d.getElementById('intro'),skipB=d.getElementById('skipIntro'),fbox=d.getElementById('flipbook');
var STEPS=[['s1',150],['s2',650],['s3',1950],['s4',2950],['s5x',3450],['s6',4050],['s5',4650],['done',5300]];
var freeze=(q.match(/[?&]t=(\d+)/)||[])[1];freeze=freeze?+freeze:null;
var hasIntro=root.classList.contains('intro-on');
function endIntro(){root.classList.add('s1','s2','s3','s4','s5x','s6','s5','done');root.classList.remove('intro-on');if(intro)intro.classList.add('gone');startLoops()}
function skip(){root.classList.add('skipping');endIntro();setTimeout(function(){root.classList.remove('skipping')},60)}
if(!hasIntro){root.classList.add('s4','s5x','s6','s5','done');if(intro)intro.classList.add('gone')}
else{
  /* flipbook frames built from the grid panels */
  var src=d.querySelectorAll('#pgrid .pnl-in'),frames=[];
  for(var i=0;i<src.length;i++){var f=d.createElement('div');f.className='fb';f.appendChild(src[i].cloneNode(true));fbox.appendChild(f);frames.push(f)}
  var order=[2,0,4,1,3,5,2,4,0,5],t0=performance.now(),si=0,lastF=-1,stopped=false;
  skipB.addEventListener('click',function(){stopped=true;skip()});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!stopped&&root.classList.contains('intro-on')){stopped=true;skip()}});
  (function tick(now){
    if(stopped)return;
    var t=freeze!==null?freeze:now-t0;
    while(si<STEPS.length&&t>=STEPS[si][1]){
      if(STEPS[si][0]==='done'){stopped=true;endIntro();return}
      root.classList.add(STEPS[si][0]);si++}
    if(t>=1950&&t<2950){var k=(t-1950)/1000,idx=Math.min(order.length-1,Math.floor(Math.pow(k,.8)*order.length));
      if(idx!==lastF){if(lastF>-1)frames[order[lastF]].classList.remove('on');frames[order[idx]].classList.add('on');lastF=idx}}
    else if(t>=2950&&lastF>-1){frames[order[lastF]].classList.remove('on');lastF=-1}
    if(freeze===null||si<STEPS.length)requestAnimationFrame(tick);
  })(t0);
}

/* rotating role */
var loops=false;
function startLoops(){if(loops||rm)return;loops=true;
  var roles=d.querySelectorAll('.role'),ri=0;
  setInterval(function(){roles[ri].classList.remove('is-on');ri=(ri+1)%roles.length;roles[ri].classList.add('is-on')},2400)}
if(!hasIntro)startLoops();

/* menu */
var burger=d.getElementById('burger'),menu=d.getElementById('mmenu'),closeB=d.getElementById('mmClose');
function openM(){menu.hidden=false;burger.setAttribute('aria-expanded','true');d.body.classList.add('menu-open');closeB.focus()}
function closeM(){menu.hidden=true;burger.setAttribute('aria-expanded','false');d.body.classList.remove('menu-open')}
burger.addEventListener('click',openM);closeB.addEventListener('click',function(){closeM();burger.focus()});
menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeM)});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!menu.hidden){closeM();burger.focus()}});

/* pop in on scroll */
var els=d.querySelectorAll('.pop,.do-item,.wcard,.dcard,.xcard,.timeline li');
if(rm||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')})}
else{var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(function(e){io.observe(e)})}
})();
