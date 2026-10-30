(function(){
var d=document,root=d.documentElement,q=location.search;
var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var intro=d.getElementById('intro'),skipB=d.getElementById('skipIntro'),fbox=d.getElementById('flipbook');
var STEPS=[['m1',90],['lg1',1300],['lg2',1900],['s4',2950],['s5x',3450],['s6',4050],['s5',4650],['done',5300]];
var freeze=(q.match(/[?&]t=(\d+)/)||[])[1];freeze=freeze?+freeze:null;
var hasIntro=root.classList.contains('intro-on');
function endIntro(){root.classList.add('m1','lg1','lg2','s1','s2','s3','s4','s5x','s6','s5','done');root.classList.remove('intro-on');if(intro)intro.classList.add('gone');startLoops()}
function skip(){root.classList.add('skipping');endIntro();setTimeout(function(){root.classList.remove('skipping')},60)}
if(!hasIntro){root.classList.add('s4','s5x','s6','s5','done');if(intro)intro.classList.add('gone')}
else{
  /* montage: comic pages and close crops built from the drawn panels, red tinted */
  var src=d.querySelectorAll('#pgrid .pnl-in'),frames=[],seed=7;
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  function crop(){var s=(1.0+rnd()*.45).toFixed(2),x=((rnd()-.5)*14).toFixed(1),y=((rnd()-.5)*14).toFixed(1);return 'scale('+s+') translate('+x+'%,'+y+'%)'+(rnd()<.3?' scaleX(-1)':'')}
  var LAY=[['1fr 1fr','1.2fr 1fr 1fr',[[1,1,2,1],[1,2,1,1],[2,2,1,1],[1,3,2,1]]],['1.3fr 1fr','1fr 1fr',[[1,1,1,1],[2,1,1,1],[1,2,2,1]]],['1fr','1fr 1.4fr 1fr',[[1,1,1,1],[1,2,1,1],[1,3,1,1]]],['1fr 1fr','1fr 1fr 1fr',[[1,1,1,1],[2,1,1,2],[1,2,1,1],[1,3,2,1]]]];
  for(var i=0;i<14;i++){var f=d.createElement('div');f.className='mf';
    if(i%4!==3){var L=LAY[i%LAY.length],pg=d.createElement('div');pg.className='mpg';pg.style.gridTemplateColumns=L[0];pg.style.gridTemplateRows=L[1];
      L[2].forEach(function(c,k){var cell=d.createElement('div');cell.className='cell';cell.style.gridColumn=c[0]+' / span '+c[2];cell.style.gridRow=c[1]+' / span '+c[3];
        var p=src[Math.floor(rnd()*src.length)].cloneNode(true);var cap=p.querySelector('.pnl-cap');if(cap&&rnd()<.6)cap.remove();cell.style.setProperty('--cz',crop());cell.appendChild(p);pg.appendChild(cell)});
      f.appendChild(pg)}
    else{var p2=src[(i*5)%src.length].cloneNode(true);f.classList.add('cz');f.style.setProperty('--cz',crop());f.appendChild(p2)}
    f.style.setProperty('--tf','rotate('+((rnd()-.5)*7).toFixed(1)+'deg) scale('+(1+rnd()*.12).toFixed(2)+')');
    fbox.appendChild(f);frames.push(f)}
  var cuts=[],ct=90,dt=150;while(ct<1900){cuts.push(ct);ct+=dt;dt=Math.max(48,dt*.87)}
  var t0=performance.now(),si=0,lastC=-1,stopped=false;
  function show(c){frames.forEach(function(x){x.classList.remove('on','gh')});if(c<0)return;
    if(c>0)frames[(c-1)%frames.length].classList.add('gh');frames[c%frames.length].classList.add('on')}
  skipB.addEventListener('click',function(){stopped=true;skip()});
  d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!stopped&&root.classList.contains('intro-on')){stopped=true;skip()}});
  (function tick(now){
    if(stopped)return;
    var t=freeze!==null?freeze:now-t0;
    while(si<STEPS.length&&t>=STEPS[si][1]){
      if(STEPS[si][0]==='done'){stopped=true;endIntro();return}
      root.classList.add(STEPS[si][0]);si++}
    var c=-1;if(t<1900){for(var j=0;j<cuts.length;j++)if(t>=cuts[j])c=j}
    if(c!==lastC){show(c);lastC=c}
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
