/* VELOURA garments: real product photos (Pexels, credited in the footer), cut out and hung on their own hangers. Extra colourways are colour grades of the same real photo. */
(function(){
var HC={sand:['#cdb89a','Sand'],midnight:['#2b2a30','Midnight'],lilac:['#bfb0dc','Lilac'],ivory:['#e9e3d7','Ivory'],forest:['#2c5a43','Forest'],ash:['#a7a6ab','Ash'],clay:['#b7735a','Clay'],mist:['#9fb2c6','Mist'],cobalt:['#2d55a8','Cobalt'],indigo:['#3e5a80','Indigo'],olive:['#6e6b48','Olive']};
var NECK={"h-sand": 0.1474, "h-midnight": 0.1474, "h-lilac": 0.1474, "h-ivory": 0.1474, "h-forest": 0.1474, "h-ash": 0.1474, "h-clay": 0.1474, "h-mist": 0.1474, "h-cobalt": 0.1474, "h-indigo": 0.1474, "h-olive": 0.1474, "blue": 0.1207, "white": 0.1345, "crop": 0.1414, "floral": 0.0672, "tee-sage": 0.1345, "tee-sand": 0.1345, "tee-mist": 0.1345, "crop-clay": 0.1414, "crop-sage": 0.1414, "crop-ink": 0.1414};
var TC={white:['#f2f2f0','White'],'tee-sage':['#96aa8c','Sage'],'tee-sand':['#d6c4a6','Sand'],'tee-mist':['#a0b2c8','Mist']};
var BC={crop:['#ece6da','Ivory'],'crop-clay':['#c48064','Clay'],'crop-sage':['#96aa8c','Sage'],'crop-ink':['#50586e','Ink']};
function sw2(map,keys){return keys.map(function(k){return {hex:map[k][0],name:map[k][1],file:k}})}
function sw(map,pre,keys){return keys.map(function(k){return {hex:map[k][0],name:map[k][1],file:pre+k}})}
var P=[
 {id:'boxy',file:'crop',kind:'Tee',name:'Ivory Boxy Tee',price:129,colors:sw2(BC,['crop','crop-clay','crop-sage','crop-ink']),desc:'A heavy cotton tee with a boxy cropped cut and dropped shoulders. Soft hand feel, holds its shape.'},
 {id:'dune',file:'h-sand',kind:'Hoodie',name:'Dune Heavyweight Hoodie',price:289,colors:sw(HC,'h-',['sand','clay','ivory','olive']),desc:'Our signature 480 gsm hoodie in a warm sand tone. Double layer hood, flat drawcords and a deep kangaroo pocket.'},
 {id:'white',file:'white',kind:'Tee',name:'Everyday White Tee',price:119,colors:sw2(TC,['white','tee-sand','tee-sage','tee-mist']),desc:'The clean white tee. Midweight cotton jersey, a straight cut and a neat ribbed neckline.'},
 {id:'harbour',file:'blue',kind:'Hoodie',name:'Harbour Blue Hoodie',price:299,colors:[{hex:'#1f45b5',name:'Harbour blue',file:'blue'}],desc:'A bright ultramarine pullover in brushed fleece, hung on natural wood. Relaxed body and ribbed hem.'},
 {id:'garden',file:'floral',kind:'Shirt',name:'Garden Print Tunic',price:239,colors:[{hex:'#c9b48f',name:'Garden print',file:'floral'}],desc:'A light, airy tunic in an all over botanical print with a relaxed collar and short sleeves.'},
 {id:'midnight',file:'h-midnight',kind:'Hoodie',name:'Midnight Hoodie',price:299,colors:sw(HC,'h-',['midnight','ash','indigo','cobalt']),desc:'A deep charcoal black that stays dark wash after wash. Brushed inside, clean outside, made for layering.'},
 {id:'sage',file:'tee-sage',kind:'Tee',name:'Sage Garden Tee',price:129,colors:sw2(TC,['tee-sage','white','tee-sand','tee-mist']),desc:'The everyday tee garment dyed in a soft sage. Midweight cotton jersey with a straight cut.'},
 {id:'clay',file:'crop-clay',kind:'Tee',name:'Clay Boxy Tee',price:129,colors:sw2(BC,['crop-clay','crop','crop-sage','crop-ink']),desc:'The boxy cropped tee in a warm clay colour that softens with every wash.'},
 {id:'forest',file:'h-forest',big:true,kind:'Hoodie',name:'Forest Original Hoodie',price:319,colors:sw(HC,'h-',['forest','olive','mist','lilac']),desc:'Deep forest green, our most loved piece this season. Heavy, soft and built to keep its shape.'}
];
P.forEach(function(p){p.color=p.colors[0].hex;p.neck=NECK[p.file]||.1;p.type=p.kind.toLowerCase();});
function url(p,view,hex){var f=p.file;if(hex){p.colors.forEach(function(c){if(c.hex===hex)f=c.file;});}return 'img/r6-'+f+'.webp?v=6';}
window.GARMENTS={products:P,url:url};
})();
