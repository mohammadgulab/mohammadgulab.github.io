(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const items=window.ITEMS, fmt=n=>'SAR '+n.toLocaleString('en-US');
const cardsEl=$('#cards'); let bag=[]; let cat='All', maxP=1500, sort='new', q='';
const stars=r=>`<span class="rate" hidden></span>`;
// categories
const cats=['All',...new Set(items.map(i=>i.cat))];
$('#cats').innerHTML=cats.map(c=>`<label class="ck"><input type="radio" name="cat" value="${c}" ${c==='All'?'checked':''}><span>${c}</span><em>${c==='All'?items.length:items.filter(i=>i.cat===c).length}</em></label>`).join('');
$$('input[name=cat]').forEach(r=>r.addEventListener('change',()=>{cat=r.value;render();}));
$('#price').addEventListener('input',e=>{maxP=+e.target.value;$('#pv').textContent=fmt(maxP);render();});
$('#sort').addEventListener('change',e=>{sort=e.target.value;render();});
$('#q').addEventListener('input',e=>{q=e.target.value.toLowerCase();render();});
$$('.sizes button,.swatches button').forEach(b=>b.addEventListener('click',()=>{[...b.parentNode.children].forEach(x=>x.classList.remove('on'));b.classList.add('on'); if(b.parentNode.id==='qvSizes')$('#qvSizeL').textContent=b.textContent;}));
function render(){
  let list=items.filter(i=>(cat==='All'||i.cat===cat)&&i.price<=maxP&&(!q||i.name.toLowerCase().includes(q)));
  if(sort==='lo')list.sort((a,b)=>a.price-b.price); if(sort==='hi')list.sort((a,b)=>b.price-a.price);
  $('#count').textContent=list.length+' product'+(list.length===1?'':'s');
  cardsEl.innerHTML=list.map((i,k)=>`<article class="card" data-id="${i.id}" style="--d:${k*60}ms" tabindex="0">
    <div class="ph"><img src="img/${i.g}.webp?v=3" alt="${i.name}" loading="lazy"><img class="on" src="img/m${i.men}.webp" alt="${i.name} on a model" loading="lazy">
      ${k<3?'<span class="new">New</span>':''}${i.old?'<span class="new sale">Sale</span>':''}
      <button class="fav" aria-label="Save ${i.name}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg></button>
      <button class="see" data-see="${i.id}"><svg viewBox="0 0 24 24"><path d="M12 5a2 2 0 1 1 2 2c-1 0-2 .7-2 2l-8 5a1 1 0 0 0 .6 2h14.8a1 1 0 0 0 .6-2l-8-5"/></svg>See it on</button></div>
    <div class="meta"><div><h3>${i.name}</h3><p>${i.cat}</p></div>${stars(i.rating)}</div>
    <div class="pr"><b class="${i.old?'hot':''}">${fmt(i.price)}</b>${i.old?`<s>${fmt(i.old)}</s>`:''}<button class="plus" aria-label="Quick add ${i.name}" data-add="${i.id}">+</button></div>
  </article>`).join('')||'<p class="empty">Nothing matches these filters.</p>';
}
render();
cardsEl.addEventListener('click',e=>{
  const fav=e.target.closest('.fav'); if(fav){fav.classList.toggle('on');e.stopPropagation();return;}
  const add=e.target.closest('[data-add]'); if(add){addToBag(items.find(i=>i.id===add.dataset.add),'M');return;}
  const see=e.target.closest('[data-see]'); if(see){const c=see.closest('.card'); c.classList.toggle('show-on'); see.lastChild.textContent=c.classList.contains('show-on')?'Product':'See it on'; return;}
  const c=e.target.closest('.card'); if(c)openQV(c.dataset.id);
});
cardsEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList.contains('card'))openQV(e.target.dataset.id);});
// quick view
let cur=null, g='men';
function openQV(id){cur=items.find(i=>i.id===id);
  $('#qvName').textContent=cur.name; $('#qvCat').textContent=cur.cat; $('#qvPrice').textContent=fmt(cur.price); $('#qvPrice').className=cur.old?'hot':'';
  $('#qvOld').textContent=cur.old?fmt(cur.old):''; $('#qvRate').outerHTML=stars(cur.rating).replace('class="rate"','class="rate" id="qvRate"'); $('#qvDesc').textContent=cur.desc;
  $('#qvProd').src='img/'+cur.g+'.webp?v=3'; $('#qvProd').alt=cur.name; setG(g); setView('product');
  $('#qvAdd').classList.remove('loading','done'); $('#qvAdd span').textContent='Add to bag';
  document.body.classList.add('qv-open');}
function setView(v){$('#qvStage').classList.toggle('on',v==='on'); $$('.qv-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); $('#qvG').classList.toggle('show',v==='on'); $('#qvSee').textContent=v==='on'?'Back to product':'See it on a model';}
function setG(x){g=x; $('#qvOn').src='img/m'+cur[g]+'.webp'; $('#qvOn').alt=cur.name+' on a model'; $$('#qvG button').forEach(b=>b.classList.toggle('on',b.dataset.g===g));}
$$('.qv-tabs button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.v)));
$$('#qvG button').forEach(b=>b.addEventListener('click',()=>setG(b.dataset.g)));
$('#qvSee').addEventListener('click',()=>setView($('#qvStage').classList.contains('on')?'product':'on'));
const closeAll=()=>document.body.classList.remove('qv-open','bag-open','filters-open');
$('#qvClose').addEventListener('click',closeAll); $('#veil').addEventListener('click',closeAll);
addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});
$('#qvAdd').addEventListener('click',()=>{const b=$('#qvAdd'); if(b.classList.contains('loading'))return; b.classList.add('loading'); b.querySelector('span').textContent='Adding';
  setTimeout(()=>{b.classList.remove('loading');b.classList.add('done');b.querySelector('span').textContent='Added to bag'; addToBag(cur,$('#qvSizeL').textContent,true);},700);});
// bag
function addToBag(it,size,open){const ex=bag.find(b=>b.id===it.id&&b.size===size); ex?ex.qty++:bag.push({id:it.id,size,qty:1}); drawBag(); toast(it.name+' added'); if(open){setTimeout(()=>{document.body.classList.remove('qv-open');document.body.classList.add('bag-open');},450);} }
function drawBag(){const n=bag.reduce((a,b)=>a+b.qty,0); $('#bagCount').textContent=n; $('#bagCount').classList.toggle('show',n>0); $('#bagN').textContent=n?'('+n+')':'';
  $('#bagList').innerHTML=bag.length?bag.map((b,k)=>{const it=items.find(i=>i.id===b.id);return `<div class="bi"><img src="img/${it.g}.webp?v=3" alt=""><div><h4>${it.name}</h4><p>Size ${b.size}</p><div class="qty"><button data-k="${k}" data-d="-1" aria-label="Less">−</button><span>${b.qty}</span><button data-k="${k}" data-d="1" aria-label="More">+</button></div></div><b>${fmt(it.price*b.qty)}</b></div>`}).join(''):'<p class="empty">Your bag is empty.</p>';
  const sub=bag.reduce((a,b)=>a+items.find(i=>i.id===b.id).price*b.qty,0); $('#bagSub').textContent=fmt(sub); $('#bagDel').textContent=sub>=500||!sub?'Free':'SAR 25';}
$('#bagList').addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;const it=bag[+b.dataset.k];it.qty+=+b.dataset.d;if(it.qty<1)bag.splice(+b.dataset.k,1);drawBag();});
$('#bagOpen').addEventListener('click',()=>document.body.classList.add('bag-open')); $('#bagClose').addEventListener('click',closeAll);
$('#checkout').addEventListener('click',()=>toast(bag.length?'Demo store: checkout is not active':'Add something first'));
drawBag();
// filters drawer (mobile)
['#filtersOpen','#filtersOpen2'].forEach(s=>$(s).addEventListener('click',()=>document.body.classList.add('filters-open')));
['#filtersClose','#filtersApply'].forEach(s=>$(s).addEventListener('click',closeAll));
let tt; function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),1800);}
// credits
$('#creditsBtn').addEventListener('click',e=>{e.preventDefault();const l=$('#creditList');l.hidden=!l.hidden;});
$('#creditList').innerHTML=Object.entries(window.CREDITS).map(([id,slug])=>`<li><a href="https://www.pexels.com/photo/${slug}/" target="_blank" rel="noopener">Pexels photo ${id}</a></li>`).join('');
// showcase: scroll driven product by product
const scItems=items.filter(i=>i.sc), sc=$('#showcase'), model=$('#scModel'), flat=$('#scFlat'); let sg='men', si=-1;
model.innerHTML=scItems.map((i,k)=>`<img data-k="${k}" alt="${i.name} on a model">`).join('');
flat.innerHTML=scItems.map((i,k)=>`<img data-k="${k}" src="img/${i.g}.webp?v=3" alt="${i.name}">`).join('');
$('#scDots').innerHTML=scItems.map((_,k)=>`<i data-k="${k}"></i>`).join('');
function scModels(){$$('#scModel img').forEach((im,k)=>im.src='img/m'+scItems[k][sg]+'.webp');}
scModels();
function setSc(k){if(k===si)return; const dir=k>si?1:-1; si=k; const it=scItems[k];
  $$('#scModel img,#scFlat img').forEach(im=>{const n=+im.dataset.k; im.classList.toggle('cur',n===k); im.classList.toggle('prev',n<k); im.classList.toggle('next',n>k);});
  $$('#scDots i').forEach((d,n)=>d.classList.toggle('on',n===k));
  const info=$('.sc-info'); info.classList.remove('in'); void info.offsetWidth; info.classList.add('in');
  $('#scIdx').textContent=String(k+1).padStart(2,'0')+' / '+String(scItems.length).padStart(2,'0'); $('#scName').textContent=it.name; $('#scDesc').textContent=it.desc; $('#scPrice').textContent=fmt(it.price);}
$$('.gender button').forEach(b=>b.addEventListener('click',()=>{sg=b.dataset.g; $$('.gender button').forEach(x=>x.classList.toggle('on',x===b)); scModels();}));
$('#scShop').addEventListener('click',()=>openQV(scItems[si].id));
$('#scDots').addEventListener('click',e=>{const d=e.target.closest('i');if(!d)return;const r=sc.getBoundingClientRect();const total=sc.offsetHeight-innerHeight;scrollTo({top:scrollY+r.top+total*(+d.dataset.k+0.5)/scItems.length,behavior:'smooth'});});
function onScroll(){const r=sc.getBoundingClientRect(); const total=sc.offsetHeight-innerHeight; const p=Math.min(0.9999,Math.max(0,-r.top/total)); setSc(Math.floor(p*scItems.length));
  document.querySelector('.top').classList.toggle('solid',scrollY>40);}
addEventListener('scroll',onScroll,{passive:true}); onScroll();
})();