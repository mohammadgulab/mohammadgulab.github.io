(function(){
var C=window.ClinicDemo,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))},IC=window.ICONS;
var q=new URLSearchParams(location.search);
if(q.get('embed')==='1')document.body.classList.add('embed');
function chkMobile(){document.body.classList.toggle('mobile',!document.body.classList.contains('embed')&&window.innerWidth<600)}
chkMobile();window.addEventListener('resize',chkMobile);
var h=new Date().getHours();$('#greet').textContent=h<12?'Good morning':h<17?'Good afternoon':'Good evening';
/* state: default upcoming appointment or one booked on the website */
var dates=C.dates(14),appt=null;
try{var saved=JSON.parse(localStorage.getItem('clinicDemoBooking')||'null');if(saved&&saved.date>=new Date().setHours(0,0,0,0)){appt={date:new Date(saved.date),slot:saved.slot,vt:saved.vt};if(saved.name){$('#pname').textContent=saved.name;$('#pname2').textContent=saved.name}}}catch(e){}
if(!appt){var d=dates[1];var s=C.slots(d),f=s.pm.filter(function(x){return !x.booked})[1]||s.pm[0];appt={date:d,slot:f.m,vt:'clinic'}}
function paintAppt(){$('#apptDate').textContent=C.dayLabel(appt.date)+', '+appt.date.getDate()+' '+C.MON[appt.date.getMonth()];$('#apptTime').textContent=C.fmtTime(appt.slot);$('#apptType').textContent=appt.vt==='video'?'Video call':'Clinic visit'}
paintAppt();
/* nav */
function go(n){$$('.scr').forEach(function(s){s.classList.toggle('on',s.getAttribute('data-scr')===n)});$$('.tabs button').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-go')===n)});var sc=$('.scr[data-scr="'+n+'"]');sc.scrollTop=0;$('#app').classList.toggle('on-book',n==='book')}
document.addEventListener('click',function(e){var g=e.target.closest('[data-go]');if(g){go(g.getAttribute('data-go'))}var t=e.target.closest('[data-toast]');if(t)toast(t.getAttribute('data-toast'));var r=e.target.closest('[data-open-report]');if(r)openReport(+r.getAttribute('data-open-report'));if(e.target.closest('[data-x]'))closeOv()});
var tt;function toast(m){var el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){el.classList.remove('show')},2400)}
/* overlay */
function openOv(h){$('#ovBody').innerHTML=h;$('#ov').hidden=false}
function closeOv(){$('#ov').hidden=true}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeOv()});
/* reports */
var R=window.REPORTS;
function repBtn(r,i){return '<button class="rep" data-open-report="'+i+'"><span class="ri">'+IC[r.ic]+'</span><span class="rt"><b>'+r.t+'</b><small>'+r.s+' · '+r.d+'</small></span><span class="chip '+r.st+'">'+(r.st==='ready'?'Ready':'Processing')+'</span></button>'}
function paintReports(f){$('#rlist').innerHTML=R.map(function(r,i){return (f==='all'||r.st===f)?repBtn(r,i):''}).join('')}
$('#recent').innerHTML=R.slice(0,3).map(repBtn).join('');paintReports('all');
$$('.filters button').forEach(function(b){b.addEventListener('click',function(){$$('.filters button').forEach(function(x){x.classList.toggle('on',x===b)});paintReports(b.getAttribute('data-f'))})});
function openReport(i){var r=R[i];var body='';
 if(r.st!=='ready'){body='<p>The lab is still working on this report. You will get a WhatsApp message as soon as it is ready.</p><span class="chip processing">Processing</span>'}
 else if(r.ic==='pill'){body='<p>Prescribed by Dr. Ayesha on '+r.d+'. Sample content for this demo, not medical advice.</p><table class="vals"><tr><th>Medicine</th><th>When</th></tr><tr><td>Tablet A (sample)</td><td>After breakfast</td></tr><tr><td>Syrup B (sample)</td><td>Night, 5 ml</td></tr></table><button class="dl" data-toast="Download works on a live app">'+IC.download+' Download PDF</button>'}
 else if(r.t.indexOf('CBC')===0){body='<p>'+r.s+' · '+r.d+'. Demo values only.</p><table class="vals"><tr><th>Test</th><th>Result</th><th>Range</th></tr><tr><td>Haemoglobin</td><td>13.8 g/dL</td><td>13 to 17</td></tr><tr><td>WBC</td><td>7.2</td><td>4 to 11</td></tr><tr><td>Platelets</td><td>250</td><td>150 to 410</td></tr></table><button class="dl" data-toast="Download works on a live app">'+IC.download+' Download PDF</button><button class="dl ghost" data-go="book" data-x>Book a follow-up</button>'}
 else{body='<p>'+r.s+' · '+r.d+'. The report file opens here on a live app.</p><button class="dl" data-toast="Download works on a live app">'+IC.download+' Download PDF</button>'}
 openOv('<h3>'+r.t+'</h3>'+body)}
/* booking */
var bk={vt:'clinic',date:null,slot:null};
function firstFree(){for(var i=0;i<dates.length;i++){var s=C.slots(dates[i]);if(s.am.concat(s.pm).some(function(x){return !x.booked}))return dates[i]}return dates[0]}
bk.date=firstFree();
function paintDates(){var el=$('#dstrip');el.innerHTML='';$('#mon').textContent=C.MON[bk.date.getMonth()]+' '+bk.date.getFullYear();dates.forEach(function(d,i){var s=C.slots(d),free=s.am.concat(s.pm).some(function(x){return !x.booked});var b=document.createElement('button');b.className='d'+(d.getTime()===bk.date.getTime()?' on':'');b.disabled=!free;b.innerHTML='<small>'+(i===0?'Today':C.DAYS[d.getDay()])+'</small><b>'+d.getDate()+'</b>';b.setAttribute('aria-label',C.longDate(d));b.addEventListener('click',function(){bk.date=d;bk.slot=null;paintDates();paintSlots()});el.appendChild(b)})}
function paintSlots(){var s=C.slots(bk.date),el=$('#slots');el.innerHTML='';
 [['Morning',s.am],['Evening',s.pm]].forEach(function(g){if(!g[1].length){el.insertAdjacentHTML('beforeend','<p class="sh">'+g[0]+': closed on Friday</p>');return}el.insertAdjacentHTML('beforeend','<p class="sh">'+g[0]+'</p>');g[1].forEach(function(x){var b=document.createElement('button');b.className='s'+(bk.slot===x.m?' on':'');b.textContent=x.label.replace(' AM','').replace(' PM','')+(x.m<720?' am':' pm');b.disabled=x.booked;b.setAttribute('aria-label',x.label+(x.booked?' booked':''));b.addEventListener('click',function(){bk.slot=x.m;paintSlots()});el.appendChild(b)})});
 $('#confirm').disabled=bk.slot==null;$('#confirm').textContent=bk.slot==null?'Select a slot':'Confirm Booking · '+C.fmtTime(bk.slot)}
paintDates();paintSlots();
$$('.seg button').forEach(function(b){b.addEventListener('click',function(){bk.vt=b.getAttribute('data-vt');$$('.seg button').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b)});$('#feeA').textContent=C.FEES[bk.vt]})});
$('#confirm').addEventListener('click',function(){var btn=this;btn.disabled=true;btn.textContent='Booking...';setTimeout(function(){appt={date:bk.date,slot:bk.slot,vt:bk.vt};paintAppt();var id=C.bookingId();
 openOv('<div class="center"><div class="ok-tick">'+IC.check+'</div><h3 style="padding:0">Booking confirmed!</h3><p>See you soon. A WhatsApp reminder would go out one day before.</p></div><div class="tkt"><div><small>Booking ID</small><b>'+id+'</b></div><div><small>Visit</small><b>'+(bk.vt==='video'?'Video call':'Clinic visit')+'</b></div><div><small>Date</small><b>'+C.longDate(bk.date)+'</b></div><div><small>Time</small><b>'+C.fmtTime(bk.slot)+'</b></div></div><p class="center" style="font-size:12.5px">Demo only. Nothing was sent.</p><button class="dl" data-go="home" data-x>Back to home</button>');
 bk.slot=null;paintSlots()},700)});
/* whatsapp */
$('#fabWa').addEventListener('click',function(){openOv('<h3>WhatsApp the clinic</h3><p>On a live app this opens WhatsApp chat with the clinic. Quick replies:</p><div class="qr"><button data-a="Your next appointment is '+C.dayLabel(appt.date)+' at '+C.fmtTime(appt.slot)+'.">My next appointment</button><button data-a="Your Lipid Profile and Vitamin D reports are still processing. We will message you when ready.">Report status</button><button data-a="Sat to Thu 9 AM to 1 PM and 4:30 PM to 9:30 PM. Friday evening only.">Clinic timings</button></div><div class="wa-ans" id="waAns" hidden><p></p></div>');
 $$('#ovBody [data-a]').forEach(function(b){b.addEventListener('click',function(){var a=$('#waAns');a.hidden=false;$('p',a).textContent=b.getAttribute('data-a')})})});
})();
