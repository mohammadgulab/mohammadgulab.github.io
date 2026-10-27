(function(){
var root=document.documentElement;root.classList.add('js');
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('ready');});});
// count up
if(!reduce){document.querySelectorAll('[data-count]').forEach(function(el){
 var end=+el.getAttribute('data-count'),pre=el.getAttribute('data-prefix')||'',t0=null,d=1400;
 function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/d),e=1-Math.pow(1-p,3);el.textContent=pre+Math.round(end*e).toLocaleString('en-US');if(p<1)requestAnimationFrame(step);}
 el.textContent=pre+'0';requestAnimationFrame(step);});}
// tilt
var card=document.getElementById('tilt');if(!card||reduce)return;var inner=card.querySelector('.tilt-in');
card.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect();var x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
 inner.style.transform='rotateY('+((x-.5)*18).toFixed(2)+'deg) rotateX('+((.5-y)*18).toFixed(2)+'deg)';
 inner.style.setProperty('--gx',(x*100)+'%');inner.style.setProperty('--gy',(y*100)+'%');});
card.addEventListener('pointerleave',function(){inner.style.transform='';});
})();