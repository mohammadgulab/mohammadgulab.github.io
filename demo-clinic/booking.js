/* Shared demo booking data: everything stays in the browser. */
(function(){
  var DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function pad(n){return (n<10?'0':'')+n}
  function fmtTime(m){var h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM';var hh=h%12||12;return hh+':'+pad(mm)+' '+ap}
  function seed(d,m){var x=(d.getFullYear()*372+d.getMonth()*31+d.getDate())*97+m*13;x=Math.sin(x)*10000;return x-Math.floor(x)}
  function dates(n){var out=[],t=new Date();t.setHours(0,0,0,0);for(var i=0;i<n;i++){var d=new Date(t);d.setDate(t.getDate()+i);out.push(d)}return out}
  function slots(d){
    var now=new Date(),isToday=d.toDateString()===now.toDateString(),nowM=now.getHours()*60+now.getMinutes();
    var fri=d.getDay()===5,am=[],pm=[],m;
    if(!fri){for(m=9*60;m<=12*60+30;m+=30)am.push(m)}
    for(m=16*60+30;m<=21*60;m+=30)pm.push(m);
    function mk(m){var past=isToday&&m<=nowM+20;return {m:m,label:fmtTime(m),booked:past||seed(d,m)<0.3,past:past}}
    return {am:am.map(mk),pm:pm.map(mk),friday:fri};
  }
  function dayLabel(d){var t=new Date();t.setHours(0,0,0,0);var diff=Math.round((d-t)/864e5);return diff===0?'Today':diff===1?'Tomorrow':DAYS[d.getDay()]}
  function longDate(d){return DAYS[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]}
  function bookingId(){return 'DEMO-'+Math.random().toString(36).slice(2,6).toUpperCase()}
  function ics(d,m,title){
    var s=new Date(d);s.setHours(Math.floor(m/60),m%60,0,0);var e=new Date(s.getTime()+20*60000);
    function f(x){return x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+'T'+pad(x.getHours())+pad(x.getMinutes())+'00'}
    var body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Concept demo//EN','BEGIN:VEVENT','UID:'+Date.now()+'@demo','DTSTAMP:'+f(new Date()),'DTSTART:'+f(s),'DTEND:'+f(e),'SUMMARY:'+title,'LOCATION:Al Rawdah, Jeddah (demo)','DESCRIPTION:Concept demo booking. Not a real appointment.','END:VEVENT','END:VCALENDAR'].join('\r\n');
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/calendar'}));a.download='appointment-demo.ics';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);
  }
  window.ClinicDemo={DAYS:DAYS,MON:MON,dates:dates,slots:slots,fmtTime:fmtTime,dayLabel:dayLabel,longDate:longDate,bookingId:bookingId,ics:ics,FEES:{clinic:150,video:100}};
})();
