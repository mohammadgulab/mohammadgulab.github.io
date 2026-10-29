(()=>{const d=document.documentElement;d.classList.add('js');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
requestAnimationFrame(()=>setTimeout(()=>document.body.classList.add('ready'),60));
// reveals
const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
document.querySelectorAll('.rv,.rv-img,.contact .ln').forEach(el=>io.observe(el));
// words
const bt=document.querySelector('[data-words]');let words=[];
if(bt){const t=bt.textContent.trim().split(/\s+/);bt.setAttribute('aria-label',bt.textContent.trim());bt.innerHTML=t.map(w=>'<span class="w" aria-hidden="true">'+w+'</span>').join(' ');words=[...bt.querySelectorAll('.w')];if(reduce)words.forEach(w=>w.classList.add('lit'))}
// roles
const roles=[...document.querySelectorAll('.role')];let ri=0;
if(roles.length>1&&!reduce){setInterval(()=>{const a=roles[ri];a.classList.remove('is-on');a.classList.add('is-out');ri=(ri+1)%roles.length;const b=roles[ri];b.classList.remove('is-out');void b.offsetWidth;b.classList.add('is-on');setTimeout(()=>a.classList.remove('is-out'),750)},2400)}
else if(reduce){const box=document.querySelector('.roles');if(box){box.textContent='Document Controller, Graphic Designer, Web Designer and Excel tracker maker'}}
// nav
const nav=document.getElementById('nav');let last=0;
const par=[...document.querySelectorAll('[data-par]')];
let tick=false;
function frame(){tick=false;const y=scrollY,vh=innerHeight;
 nav.classList.toggle('solid',y>40);nav.classList.toggle('hide',y>last&&y>500);last=y;
 if(!reduce){par.forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;const p=(r.top+r.height/2-vh/2);const m=el.offsetHeight*0.055;let v=p*-parseFloat(el.dataset.par);v=Math.max(-m,Math.min(m,v));el.style.transform='translate3d(0,'+v.toFixed(1)+'px,0)'});
 if(words.length){const r=bt.getBoundingClientRect();const prog=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));const n=Math.round(prog*words.length);words.forEach((w,i)=>w.classList.toggle('lit',i<n))}}
}
addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(frame)}},{passive:true});addEventListener('resize',frame);frame();
// close nav links smoothly handled by CSS
})();