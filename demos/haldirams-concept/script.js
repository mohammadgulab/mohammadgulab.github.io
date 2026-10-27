(function(){
var d=document,root=d.documentElement;root.classList.add('js');
var btn=d.getElementById('menuBtn'),nav=d.getElementById('nav');
if(btn&&nav){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o);btn.setAttribute('aria-label',o?'Close menu':'Open menu');});
nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');});});}
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var els=d.querySelectorAll('.reveal');
if(!reduce&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});els.forEach(function(el){io.observe(el);});}
else{els.forEach(function(el){el.classList.add('in');});}
var toast=d.getElementById('toast'),tt;
function show(msg){toast.textContent=msg||'This is a design concept — no real orders.';toast.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove('show');},2200);}
d.querySelectorAll('.demo-btn').forEach(function(b){if(b.tagName==='BUTTON'){b.addEventListener('click',function(){show();});}});
var chips=d.querySelectorAll('.filters .chip'),prods=d.querySelectorAll('.prod');
function filter(f){chips.forEach(function(c){var on=c.dataset.filter===f;c.classList.toggle('active',on);c.setAttribute('aria-selected',on);});prods.forEach(function(p){p.classList.toggle('hide',f!=='all'&&p.dataset.cat!==f);if(f!=='all')p.classList.add('in');});}
chips.forEach(function(c){c.addEventListener('click',function(){filter(c.dataset.filter);});});
d.querySelectorAll('[data-jump]').forEach(function(a){a.addEventListener('click',function(){var f=a.dataset.jump;if(a.getAttribute('href')==='#bestsellers')filter(f);});});
var sizes=d.querySelectorAll('.size'),gp=d.getElementById('giftPrice');
sizes.forEach(function(s){s.addEventListener('click',function(){sizes.forEach(function(x){x.classList.remove('active');x.setAttribute('aria-checked','false');});s.classList.add('active');s.setAttribute('aria-checked','true');gp.textContent=s.dataset.price;});});
var stores=d.querySelectorAll('.store'),pins=d.querySelectorAll('.pin');
stores.forEach(function(s,i){s.addEventListener('click',function(){stores.forEach(function(x){x.classList.remove('active');});pins.forEach(function(p){p.classList.remove('on');});s.classList.add('active');if(pins[i])pins[i].classList.add('on');});});
d.querySelectorAll('.city-chips .chip').forEach(function(c,_,all){c.addEventListener('click',function(){all.forEach(function(x){x.classList.remove('active');});c.classList.add('active');show('Static store locator mock — sample outlets only.');});});
})();
