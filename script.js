(function(){
  var d=document,root=d.documentElement;root.classList.add('js');
  var hdr=d.querySelector('.hdr');function onS(){hdr&&hdr.classList.toggle('scrolled',window.scrollY>10)}onS();window.addEventListener('scroll',onS,{passive:true});
  var btn=d.querySelector('.menu-btn'),links=d.getElementById('nav-links');
  if(btn&&links){btn.addEventListener('click',function(){var o=links.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false')});
    links.addEventListener('click',function(e){if(e.target.closest('a')){links.classList.remove('open');btn.setAttribute('aria-expanded','false')}})}
  var y=d.getElementById('year');if(y)y.textContent=new Date().getFullYear();
  // reveal
  var rv=[].slice.call(d.querySelectorAll('.rv'));
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.05});
    rv.forEach(function(el){io.observe(el)})}else{rv.forEach(function(el){el.classList.add('in')})}
  // filters
  var cards=[].slice.call(d.querySelectorAll('.card')),fb=[].slice.call(d.querySelectorAll('.fbtn')),moreW=d.querySelector('.more'),moreB=d.getElementById('show-all'),LIMIT=12,expanded=false,cur='all';
  fb.forEach(function(b){var c=b.getAttribute('data-f'),n=c==='all'?cards.length:cards.filter(function(x){return (' '+x.getAttribute('data-cat')+' ').indexOf(' '+c+' ')>-1}).length;var s=b.querySelector('sup');if(s)s.textContent=n;if(!n)b.hidden=true});
  function apply(){var shown=0,total=0;cards.forEach(function(x){var ok=cur==='all'||(' '+x.getAttribute('data-cat')+' ').indexOf(' '+cur+' ')>-1;if(ok)total++;var vis=ok&&(expanded||cur!=='all'||shown<LIMIT);if(vis){shown++;x.classList.remove('hide');x.classList.add('in')}else x.classList.add('hide')});
    if(moreW)moreW.style.display=(cur==='all'&&!expanded&&total>LIMIT)?'flex':'none'}
  fb.forEach(function(b){b.addEventListener('click',function(){cur=b.getAttribute('data-f');fb.forEach(function(o){o.setAttribute('aria-pressed',o===b?'true':'false')});apply()})});
  if(moreB)moreB.addEventListener('click',function(){expanded=true;apply()});
  apply();
  // lightbox
  var lb=d.getElementById('lb'),img=d.getElementById('lb-img'),cap=d.getElementById('lb-cap'),sc=d.getElementById('lb-scroll'),prev=lb.querySelector('.lb-prev'),next=lb.querySelector('.lb-next'),list=[],i=0,last=null;
  function show(){var it=list[i],vid=d.getElementById('lb-vid');if(vid&&/\.mp4$/.test(it.src)){img.hidden=true;img.removeAttribute('src');vid.hidden=false;vid.src=it.src;var pp=vid.play();if(pp&&pp.catch)pp.catch(function(){})}else{if(vid){vid.hidden=true;vid.pause();vid.removeAttribute('src')}img.hidden=false;img.src=it.src}img.alt=it.alt;cap.innerHTML='<b></b><span></span>';cap.querySelector('b').textContent=it.title;cap.querySelector('span').textContent=(list.length>1?(i+1)+' / '+list.length+' · ':'')+it.note;prev.hidden=next.hidden=list.length<2;sc.scrollTop=0}
  function open(card,start){var t=card.querySelector('h3').textContent,n=card.getAttribute('data-note')||'';list=card.getAttribute('data-images').split('|').map(function(s){return{src:s,alt:t,title:t,note:n}});i=start||0;show();lb.classList.add('open');lb.setAttribute('aria-hidden','false');d.body.style.overflow='hidden';lb.querySelector('.lb-x').focus()}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');d.body.style.overflow='';img.removeAttribute('src');var v=d.getElementById('lb-vid');if(v){v.pause();v.removeAttribute('src')}if(last)last.focus()}
  d.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(){last=b;open(b.closest('.card'),+(b.getAttribute('data-open')||0))})});
  lb.querySelector('.lb-x').addEventListener('click',close);
  prev.addEventListener('click',function(){i=(i-1+list.length)%list.length;show()});next.addEventListener('click',function(){i=(i+1)%list.length;show()});
  lb.addEventListener('click',function(e){if(e.target===lb||e.target===sc)close()});
  d.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')next.click();if(e.key==='ArrowLeft')prev.click()});
  var sx=null;lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60&&list.length>1){(dx<0?next:prev).click()}sx=null});
})();

(function(){var d=document,w=window;var rm=w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches;var fine=w.matchMedia&&w.matchMedia('(pointer: fine)').matches;
var bar=d.querySelector('.progress i');function prog(){if(!bar)return;var h=d.documentElement.scrollHeight-w.innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,w.scrollY/h):0)+')'}prog();w.addEventListener('scroll',prog,{passive:true});w.addEventListener('resize',prog);
if(rm||!fine)return;
var g=d.querySelector('.cglow');if(g){w.addEventListener('pointermove',function(e){g.classList.add('on');g.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)'},{passive:true});d.addEventListener('pointerleave',function(){g.classList.remove('on')})}
var t=d.getElementById('tilt');if(t){var wrap=t.parentNode;wrap.addEventListener('pointermove',function(e){var r=wrap.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.style.transform='perspective(900px) rotateY('+(x*14)+'deg) rotateX('+(-y*14)+'deg)'});wrap.addEventListener('pointerleave',function(){t.style.transform=''})}
d.querySelectorAll('.mag').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18)+'px,'+((e.clientY-r.top-r.height/2)*.28)+'px)'});b.addEventListener('pointerleave',function(){b.style.transform=''})});
})();
