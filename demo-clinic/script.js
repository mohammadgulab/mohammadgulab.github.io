(function(){
var C=window.ClinicDemo,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
/* menu */
var nav=$('#nav'),mb=$('#menuBtn');
function setMenu(o){nav.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Close menu':'Open menu');document.body.style.overflow=o?'hidden':''}
mb.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
$$('#nav a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
/* reveal */
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});$$('.reveal').forEach(function(el){io.observe(el)})}else{$$('.reveal').forEach(function(el){el.classList.add('in')})}
/* sheet (call / whatsapp) */
var sheet=$('#sheet'),sb=$('#sheetBody');
function openSheet(h){sb.innerHTML=h;sheet.hidden=false;var x=$('.sheet-x',sheet);x&&x.focus()}
function closeSheet(){sheet.hidden=true}
$$('[data-close]').forEach(function(b){b.addEventListener('click',closeSheet)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeSheet();setMenu(false)}});
$$('[data-call]').forEach(function(b){b.addEventListener('click',function(){openSheet('<h3>Call the clinic</h3><p>On a live website this button dials the clinic straight away. In this demo calling is switched off.</p><a class="btn btn-rose" style="width:100%" href="#book" data-close>Book online instead</a>');$('#sheetBody [data-close]').addEventListener('click',closeSheet)})});
$$('[data-wa]').forEach(function(b){b.addEventListener('click',function(){openSheet('<h3>Chat on WhatsApp</h3><p>On a live website this opens WhatsApp with the clinic. Quick replies patients would see:</p><div class="qr"><button data-q="book">Book an appointment</button><button data-q="time">Clinic timings</button><button data-q="rep">Is my report ready?</button></div><p class="demo-note" id="qa" style="margin-top:12px"></p>');
  $$('#sheetBody [data-q]').forEach(function(q){q.addEventListener('click',function(){var k=q.getAttribute('data-q'),t=k==='book'?'Sure! Tap Book Appointment on the page and choose any free slot.':k==='time'?'Sat to Thu: 9 AM to 1 PM and 4:30 PM to 9:30 PM. Friday: evening only.':'Reports appear in the patient app under My Reports as soon as they are ready.';$('#qa').textContent='Clinic: '+t})})})});
/* booking */
var st={vt:'clinic',date:null,slot:null},dates=C.dates(14),strip=$('#dateStrip');
function stepTo(n){$$('.bk-step').forEach(function(s){s.classList.toggle('on',s.getAttribute('data-step')==String(n))});
  $$('.steps li').forEach(function(li){var s=+li.getAttribute('data-s'),cur=n===1?(st.slot!=null?2:1):n;li.classList.toggle('on',s<=cur);li.classList.toggle('ok',s<cur||n===4)});}
function renderDates(){strip.innerHTML='';dates.forEach(function(d,i){var s=C.slots(d),free=s.am.concat(s.pm).filter(function(x){return !x.booked}).length;var b=document.createElement('button');b.type='button';b.className='date'+(st.date&&d.getTime()===st.date.getTime()?' on':'');b.setAttribute('role','option');b.setAttribute('aria-selected',b.className.indexOf('on')>-1);b.disabled=free===0;b.innerHTML='<small>'+(i===0?'Today':C.DAYS[d.getDay()])+'</small><b>'+d.getDate()+'</b><i>'+(free?free+' free':'Full')+'</i>';b.addEventListener('click',function(){st.date=d;st.slot=null;renderDates();renderSlots();stepTo(1)});strip.appendChild(b)})}
function renderSlots(){var s=C.slots(st.date);$('#dateLabel').textContent='· '+C.longDate(st.date)+(s.friday?' (evening only)':'');
  [['#slotsAm',s.am],['#slotsPm',s.pm]].forEach(function(p){var el=$(p[0]);el.innerHTML='';if(!p[1].length){el.innerHTML='<p class="muted" style="margin:0;font-size:14px">Closed on Friday morning</p>';return}
   p[1].forEach(function(x){var b=document.createElement('button');b.type='button';b.className='slot'+(st.slot===x.m?' on':'');b.textContent=x.label;b.disabled=x.booked;b.setAttribute('aria-label',x.label+(x.booked?' booked':' available'));b.addEventListener('click',function(){st.slot=x.m;renderSlots();stepTo(1)});el.appendChild(b)})});
  var ok=st.slot!=null;$('#toDetails').disabled=!ok;$('#sum1').innerHTML=ok?C.dayLabel(st.date)+', '+C.fmtTime(st.slot)+'<small>'+(st.vt==='video'?'Video call':'Clinic visit')+' · SAR '+C.FEES[st.vt]+' (sample fee)</small>':'Select a time slot<small>'+(st.vt==='video'?'Video call':'Clinic visit')+' · SAR '+C.FEES[st.vt]+' (sample fee)</small>';}
function firstFree(){for(var i=0;i<dates.length;i++){var s=C.slots(dates[i]);if(s.am.concat(s.pm).some(function(x){return !x.booked}))return dates[i]}return dates[0]}
st.date=firstFree();renderDates();renderSlots();
$$('.vt-b').forEach(function(b){b.addEventListener('click',function(){st.vt=b.getAttribute('data-vt');$$('.vt-b').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',on)});renderSlots()})});
$('#toDetails').addEventListener('click',function(){var tl=st.vt==='video'?'Video call':'Clinic visit';$('#chosen').innerHTML='<span class="chip">'+C.longDate(st.date)+'</span><span class="chip">'+C.fmtTime(st.slot)+'</span><span class="chip">'+tl+'</span>';$('#fee').innerHTML='SAR '+C.FEES[st.vt]+'<small>Pay at the clinic (sample fee)</small>';if(st.vt==='video')$('#fReason').value='Video Consultation';stepTo(3);$('#book').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(function(){$('#fName').focus({preventScroll:true})},400)});
$$('[data-goto]').forEach(function(b){b.addEventListener('click',function(){stepTo(+b.getAttribute('data-goto'))})});
$('#fPhone').addEventListener('input',function(e){var v=e.target.value.replace(/\D/g,'').slice(0,9);e.target.value=v.replace(/^(\d{2})(\d{0,3})(\d{0,4}).*/,function(_,a,b,c){return a+(b?' '+b:'')+(c?' '+c:'')})});
$('#bkForm').addEventListener('submit',function(e){e.preventDefault();var n=$('#fName').value.trim(),p=$('#fPhone').value.replace(/\D/g,''),err=$('#fErr');
  if(n.length<2){err.textContent='Please enter your name.';$('#fName').focus();return}
  if(!/^5\d{8}$/.test(p)){err.textContent='Please enter a 9 digit Saudi mobile number starting with 5.';$('#fPhone').focus();return}
  err.textContent='';$('#dName').textContent=n.split(' ')[0];$('#dId').textContent=C.bookingId();$('#dDate').textContent=C.longDate(st.date);$('#dTime').textContent=C.fmtTime(st.slot);$('#dType').textContent=st.vt==='video'?'Video call':'Clinic visit';
  try{localStorage.setItem('clinicDemoBooking',JSON.stringify({name:n.split(' ')[0],date:st.date.getTime(),slot:st.slot,vt:st.vt,reason:$('#fReason').value}))}catch(x){}
  stepTo(4);$('#book').scrollIntoView({behavior:'smooth',block:'start'});});
$('#icsBtn').addEventListener('click',function(){C.ics(st.date,st.slot,'Appointment with Dr. Ayesha (demo)')});
$('#again').addEventListener('click',function(){st.slot=null;$('#bkForm').reset();renderDates();renderSlots();stepTo(1)});
$$('.svc-link').forEach(function(a){a.addEventListener('click',function(){var r=a.getAttribute('data-reason');var o=$$('#fReason option').filter(function(x){return x.value===r})[0];if(o)$('#fReason').value=r;if(r==='Video Consultation'){$$('.vt-b')[1].click()}})});
/* hide sticky book button near booking section and footer */
var mob=$('.mob-book');if(mob&&'IntersectionObserver' in window){var vis=new Map();var o2=new IntersectionObserver(function(es){es.forEach(function(e){vis.set(e.target,e.isIntersecting)});var any=false;vis.forEach(function(v){if(v)any=true});mob.classList.toggle('hide',any);var fab=$('.fab');fab.classList.toggle('hide',!!vis.get($('#book')))},{threshold:0});['#book','.ftr','.hero .hero-btns','.cta'].forEach(function(s){var el=$(s);if(el)o2.observe(el)})}
})();
