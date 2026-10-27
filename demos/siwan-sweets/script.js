(function(){
  document.documentElement.classList.add('js');
  var toast=document.getElementById('toast'),t;
  function show(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(t);t=setTimeout(function(){toast.classList.remove('show')},2600)}
  document.querySelectorAll('.js-wa').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();show('Demo only: this button would open WhatsApp')})});
  document.querySelectorAll('.js-demo').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();show(a.getAttribute('data-msg'))})});
  var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var d=document.querySelector('.js-day'); if(d) d.textContent='· '+days[new Date().getDay()];
  var els=document.querySelectorAll('.card,.mcat,.fcard,.times,.loc,.head');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(el){el.classList.add('rv');io.observe(el)});
})();
