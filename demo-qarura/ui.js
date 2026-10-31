(function(){
  const CH=[
    {n:'Top note',t:'Taif rose',l:'picked at first light in Al Hada'},
    {n:'Heart note',t:'Aged oud',l:'rested in sealed glass until it softens'},
    {n:'Base note',t:'Amber',l:'warm resin for the evening air'},
    {n:'The finish',t:'Bakhoor',l:'smoke that stays in your abaya'}
  ];
  window.QCH=CH;
  window.storyP=0;
  setTimeout(()=>{if(!window.__glOK)document.documentElement.classList.add('no-gl')},9000);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis=null;
  if(window.Lenis && !reduce){
    lenis=new Lenis({lerp:0.09,smoothWheel:true,syncTouch:false});
    window.lenis=lenis;
    function raf(t){lenis.raf(t);requestAnimationFrame(raf)}
    requestAnimationFrame(raf);
  }
  const story=document.getElementById('story');
  const nav=document.getElementById('nav');
  const chNum=document.getElementById('chNum'),chName=document.getElementById('chName'),bar=document.getElementById('bar'),hint=document.getElementById('hint');
  const fbT=document.getElementById('fbTitle'),fbL=document.getElementById('fbLine');
  let lastC=-1;
  function setChapter(c){if(c===lastC)return;lastC=c;chNum.textContent='0'+(c+1);chName.textContent=CH[c].n;fbT.textContent=CH[c].t;fbL.textContent=CH[c].l}
  window.setChapter=setChapter;
  function onScroll(){
    const r=story.getBoundingClientRect();
    const total=story.offsetHeight-innerHeight;
    const p=Math.min(1,Math.max(0,-r.top/total));
    window.storyP=p;
    bar.style.transform='scaleX('+p.toFixed(4)+')';
    if(!window.__glOK) setChapter(Math.min(3,Math.round(p*3)));
    hint.style.opacity=p>0.04?0:1;
    nav.classList.toggle('solid',r.bottom<70);
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll);
  onScroll();

  // anchors through lenis
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href');const el=id==='#top'?document.body:document.querySelector(id);
    if(!el)return; e.preventDefault(); closeMenu();
    if(lenis) lenis.scrollTo(id==='#top'?0:el,{offset:id==='#story'?0:-70,duration:1.4}); else el.scrollIntoView({behavior:'smooth'});
  }));

  // menu
  const burger=document.getElementById('burger'),menu=document.getElementById('menu');
  function closeMenu(){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Open menu');lenis&&lenis.start();document.body.style.overflow=''}
  burger.addEventListener('click',()=>{
    const open=!menu.classList.contains('open');
    if(!open)return closeMenu();
    menu.classList.add('open');menu.setAttribute('aria-hidden','false');burger.setAttribute('aria-expanded','true');burger.setAttribute('aria-label','Close menu');lenis&&lenis.stop();document.body.style.overflow='hidden';
  });
  addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

  // toast
  const toast=document.getElementById('toast');let tt;
  function say(m){toast.textContent=m;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),2200)}

  // bag
  let count=0;const bagBtn=document.getElementById('bagBtn'),bagCount=document.getElementById('bagCount');
  document.querySelectorAll('button.add').forEach(b=>b.addEventListener('click',()=>{
    count++;bagCount.textContent=count;bagBtn.setAttribute('aria-label','Bag, '+count+' items');
    bagBtn.classList.add('pop');setTimeout(()=>bagBtn.classList.remove('pop'),300);
    b.classList.add('done');b.textContent='Added';setTimeout(()=>{b.classList.remove('done');b.textContent='Add'},1400);
    say(b.dataset.n+' added to your bag');
  }));
  bagBtn.addEventListener('click',()=>say(count? count+(count>1?' items':' item')+' in your bag. Checkout is not part of this demo.':'Your bag is empty'));

  // chips
  const chips=document.querySelectorAll('.chip');
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(x=>{x.classList.toggle('on',x===c);x.setAttribute('aria-selected',x===c)});
    const f=c.dataset.f;
    document.querySelectorAll('#grid .card').forEach(card=>{
      const show=f==='all'||card.dataset.f.split(' ').includes(f);
      card.classList.toggle('hide',!show);
    });
    lenis&&lenis.resize();
  }));

  // form
  document.getElementById('book').addEventListener('submit',e=>{
    e.preventDefault();const f=e.target;const n=f.n.value.trim();const msg=document.getElementById('bookMsg');
    if(!n){msg.textContent='Please add your name.';f.n.focus();return}
    msg.textContent='Thanks '+n+', your request for '+f.t.value.toLowerCase()+' is noted. This is a concept demo, so nothing was sent.';
  });

  // reveals
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.15});
  document.querySelectorAll('.intro .big,.sec-head,.card,.visit-body > *').forEach(el=>{el.classList.add('reveal');io.observe(el)});
})();
