// nav scroll state
const hdr=document.getElementById('hdr');
const onScroll=()=>hdr.classList.toggle('scrolled',window.scrollY>20);
onScroll();addEventListener('scroll',onScroll,{passive:true});
// mobile menu
const mb=document.getElementById('menuBtn'),nav=document.getElementById('nav');
if(mb&&nav){
 mb.addEventListener('click',()=>{const o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');mb.setAttribute('aria-expanded','false')}));
}
// reveal on scroll
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const els=document.querySelectorAll('.reveal');
const steps=document.querySelectorAll('.rstep');
if(reduce){els.forEach(e=>e.classList.add('in'));steps.forEach(e=>e.classList.add('in'))}
else{
 const io=new IntersectionObserver((en)=>{en.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),i*60);io.unobserve(e.target)}})},{threshold:.2,rootMargin:'0px 0px -8% 0px'});els.forEach(e=>io.observe(e));
 // roadmap steps: reveal one-by-one only once each rises past the middle of the screen ‚Äî never visible before
 const sio=new IntersectionObserver((en)=>{en.forEach((e)=>{if(e.isIntersecting){e.target.classList.add('in');sio.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -42% 0px'});steps.forEach(e=>sio.observe(e))}

// roadmap progress line fills as you scroll through it
const roadwrap=document.getElementById('roadwrap'),roadfill=document.getElementById('roadfill');
function roadScroll(){if(!roadwrap)return;const r=roadwrap.getBoundingClientRect();const vh=innerHeight;
 const total=r.height+vh*0.3;const passed=Math.min(Math.max(vh*0.7-r.top,0),total);
 roadfill.style.height=Math.min(100,(passed/r.height)*100)+'%';}
roadScroll();addEventListener('scroll',roadScroll,{passive:true});addEventListener('resize',roadScroll);

// 3D agent network in the hero
(function(){
 const c=document.getElementById('net');
 if(!c||!window.THREE||reduce) return;
 const renderer=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 const scene=new THREE.Scene();
 const cam=new THREE.PerspectiveCamera(55,1,0.1,100); cam.position.z=15;
 const group=new THREE.Group(); scene.add(group);
 const N=64, pts=[];
 for(let i=0;i<N;i++) pts.push(new THREE.Vector3((Math.random()-.5)*17,(Math.random()-.5)*12,(Math.random()-.5)*10));
 const pg=new THREE.BufferGeometry().setFromPoints(pts);
 group.add(new THREE.Points(pg,new THREE.PointsMaterial({color:0xd9b85e,size:.3,transparent:true,opacity:.95})));
 const lp=[];
 for(let a=0;a<N;a++)for(let b=a+1;b<N;b++){if(pts[a].distanceTo(pts[b])<4.3){lp.push(pts[a].x,pts[a].y,pts[a].z,pts[b].x,pts[b].y,pts[b].z);}}
 const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
 group.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x7ea876,transparent:true,opacity:.34})));
 let mx=0,my=0;
 const host=document.getElementById('hero3d');
 host.addEventListener('mousemove',e=>{const r=host.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5);my=((e.clientY-r.top)/r.height-.5);});
 host.addEventListener('mouseleave',()=>{mx=0;my=0;});
 function size(){const w=c.clientWidth,h=c.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
 size(); addEventListener('resize',size);
 (function loop(){requestAnimationFrame(loop);
  group.rotation.y+=0.0017; group.rotation.x=Math.sin(Date.now()*0.00018)*0.16;
  cam.position.x+=((mx*5)-cam.position.x)*0.045; cam.position.y+=((-my*5)-cam.position.y)*0.045; cam.lookAt(0,0,0);
  renderer.render(scene,cam);})();
})();

// 3D tilt on cards + roadmap cards + float card
function tilt(el,max,lift){
 el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();
  const rx=(((e.clientY-r.top)/r.height)-.5)*-2*max, ry=(((e.clientX-r.left)/r.width)-.5)*2*max;
  el.style.transform='perspective(820px) rotateX('+rx+'deg) rotateY('+ry+'deg)'+(lift?' translateY(-5px)':'');});
 el.addEventListener('mouseleave',()=>{el.style.transform='';});
}
if(!reduce){
 document.querySelectorAll('.acard').forEach(c=>tilt(c,5,true));
 document.querySelectorAll('.rcard').forEach(c=>tilt(c,4,false));
 const fc=document.querySelector('.floatcard'); if(fc) tilt(fc,10,false);
 const h3=document.getElementById('hero3d'); if(h3) tilt(h3,4,false);
}

// ===== Chat assistant ("Aanya") ‚Äî guided, human-feeling; captures leads to Google Sheet =====
const LEAD_URL="https://docs.google.com/forms/d/e/1FAIpQLScaersGUcbGAZ8l1WjeoUqdUNGypYxm4NMG1qeiTwHbgKmGVQ/formResponse";
const LEAD_F={fullname:"entry.1359721641",email:"entry.1597866042",phone:"entry.636808201",business:"entry.1800258224",need:"entry.2140075954"};
const win=document.getElementById('chatWin'),fab=document.getElementById('chatFab'),body=document.getElementById('chatBody'),foot=document.getElementById('chatFoot');
let started=false, lead={fullname:'',email:'',business:'',need:''}, askStage=null, lastTopic='';
function openChat(){win.classList.add('open');fab.style.display='none';if(!started){started=true;greet();}}
function closeChat(){win.classList.remove('open');fab.style.display='';}
function bubble(text,who){const d=document.createElement('div');d.className='msg '+(who||'bot');d.innerHTML=text;body.appendChild(d);body.scrollTop=body.scrollHeight;}
function typing(cb,ms){const t=document.createElement('div');t.className='typing';t.innerHTML='<span></span><span></span><span></span>';body.appendChild(t);body.scrollTop=body.scrollHeight;setTimeout(()=>{t.remove();cb();},ms||750);}
function chips(arr){foot.innerHTML='';const f=document.createElement('div');f.style.display='flex';f.style.flexWrap='wrap';f.style.gap='8px';f.style.width='100%';arr.forEach(o=>{const b=document.createElement('button');b.className='qr';b.textContent=o.t;b.onclick=o.f;f.appendChild(b);});foot.appendChild(f);}
function inputRow(ph,onSend){foot.innerHTML='';const f=document.createElement('form');f.className='chat-form';f.innerHTML='<input placeholder="'+ph+'" autocomplete="off"><button type="submit" aria-label="Send">‚Üí</button>';f.onsubmit=e=>{e.preventDefault();const v=f.querySelector('input').value.trim();if(!v)return;bubble(v,'me');onSend(v);};foot.appendChild(f);setTimeout(()=>f.querySelector('input').focus(),50);}
function greet(){bubble("Hi, I‚Äôm Aanya from Elevate üëã");typing(()=>{bubble("I help business owners figure out which AI agent would save them the most time. What would you like to know?");menu();},800);}
function menu(){chips([
 {t:'What can your agents do?',f:()=>{bubble('What can your agents do?','me');aWhat();}},
 {t:'How much does it cost?',f:()=>{bubble('How much does it cost?','me');aCost();}},
 {t:'How does it work?',f:()=>{bubble('How does it work?','me');aHow();}},
 {t:'I want a custom agent',f:()=>{bubble('I want a custom agent','me');askAgent('a custom agent');}},
 {t:'Talk to the team',f:()=>{bubble('Talk to the team','me');startLead('');}}
]);}
function aWhat(){typing(()=>{bubble("Loads of things ‚Äî each agent does one job perfectly, and it works on your real, messy paperwork (you don‚Äôt operate any software, the agent does the work). Popular ones: organising invoices, chasing payments, reconciling your bank against your bills, giving a plain-English cash-flow picture, catching costly mistakes before they hurt, summarising reports, finding any document instantly, tracking stock, wages, and GST deadlines. We also build fully custom ones.");typing(()=>{bubble("Which part of your work eats the most time right now?");afterAnswer();},800);},800);}
function aCost(){typing(()=>{bubble("It‚Äôs built to be affordable for small businesses ‚Äî a one-time setup fee, then a small monthly plan to keep it running and improving. The exact price depends on the agent, and you only pay after you‚Äôve seen it work on your own data ‚Äî for free.");typing(()=>{bubble("Want me to have someone share exact numbers for your case?");afterAnswer();},700);},850);}
function aHow(){typing(()=>{bubble("Super simple, and nothing technical from you: 1) you tell us the boring work, 2) we design &amp; build the agent around how you already work, 3) we connect it to your email/WhatsApp/PDFs, 4) you try it free, 5) it runs and we maintain it.");typing(()=>{bubble("Shall I get you set up with a free look at one for your business?");afterAnswer();},700);},850);}
function afterAnswer(){chips([
 {t:'Yes, let‚Äôs do it',f:()=>{bubble('Yes, let‚Äôs do it','me');startLead(lastTopic);}},
 {t:'Another question',f:()=>{bubble('Another question','me');menu();}}
]);}
function askAgent(name){lastTopic=name;
 // open the chat WITHOUT the generic greeting so the custom-agent flow doesn't collide with greet()
 const fresh=!started;started=true;win.classList.add('open');fab.style.display='none';
 setTimeout(()=>{bubble('Great choice. The <b>'+name+'</b> is one people love.','bot');typing(()=>{bubble("I‚Äôll set you up with a free look at it for your business. Quick ‚Äî what‚Äôs your name?");startLead(name,true);},700);},fresh?280:0);}
function startLead(topic,skipName){lastTopic=topic||lastTopic;
 if(!skipName){typing(()=>{bubble("Happy to help with that. Let me grab a couple of quick details so the right person can reach out. What‚Äôs your name?");askStage='name';inputRow('Your name‚Ä¶',handleLead);},700);}
 else{askStage='name';inputRow('Your name‚Ä¶',handleLead);}
}
function badName(v){
 if(!v) return true;
 const s=v.toLowerCase().trim();
 if(s.length<3) return true;
 if(/\d{3,}/.test(s)) return true;
 if(!/[a-z]/i.test(s)) return true;
 // reject if too few vowels for length (gibberish like "asdf", "qwer", "sjsj")
 const vowels=(s.match(/[aeiou]/g)||[]).length;
 if(s.length>=3 && vowels===0) return true;
 const blocked=['ur mom','your mom','urmom','test','testing','tester','asd','asdf','qwer','qwerty','xxx','abc','abcd','aaa','aaaa','fuck','shit','bitch','dick','penis','vagina','niga','nigg','poo','poop','pee','idiot','stupid','idk','none','na','nope','no name','noname','lol','lmao','rofl','smh','omg','wtf','tbh','fyi','asap','ok','okay','okk','hi','hii','hey','heyy','yo','sup','bro','bruh','jk','jkk','fake','foo','bar','foobar','xyz','abx','aas','sss'];
 if(blocked.some(b=>s===b||s.replace(/\s+/g,'')===b.replace(/\s+/g,''))) return true;
 return false;
}
function badEmail(v){
 return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v||'').trim());
}
function handleLead(v){
 if(askStage==='name'){
  if(badName(v)){typing(()=>{bubble("Could I get a real name? It helps me address you properly üôÇ");inputRow('Your name‚Ä¶',handleLead);},500);return;}
  lead.fullname=v;sendToSheet();
  typing(()=>{bubble("Nice to meet you, "+v.split(' ')[0]+"! What‚Äôs the best email to reach you?");askStage='email';inputRow('you@email.com‚Ä¶',handleLead);},600);
 }
 else if(askStage==='email'){
  if(badEmail(v)){typing(()=>{bubble("Hmm, that doesn‚Äôt look like a valid email ‚Äî could you double-check?");inputRow('you@email.com‚Ä¶',handleLead);},500);return;}
  lead.email=v;sendToSheet();
  typing(()=>{bubble("Got it. And what kind of business do you run?");askStage='business';inputRow('e.g. retailing, trading, services, manufacturing‚Ä¶',handleLead);},600);
 }
 else if(askStage==='business'){
  lead.business=v;lead.need=(lastTopic?('['+lastTopic+'] '):'')+'[business: '+v+']';sendToSheet();
  // if user came in for a specific agent already, skip suggestions and wrap up
  const haveAgent = lastTopic && lastTopic.toLowerCase()!=='a custom agent' && lastTopic.toLowerCase()!=='custom agent' && lastTopic.trim()!=='';
  if(haveAgent){
   typing(()=>{finishLead(lastTopic);},700);
  } else {
   typing(()=>{bubble("Got it ‚Äî "+v+". Here are the agents most useful for "+v+" businesses. Tap one to take a closer look, and I‚Äôll get the team to walk you through it:");showAgentsForIndustry(v);},800);
  }
 }
}
function showAgentsForIndustry(biz){
 const b=biz.toLowerCase();
 let agents;
 if(/retail|shop|store|kirana/.test(b)) agents=['Stock & reorder tracker','Payment chaser','Email & enquiry assistant','Price & quote analyst'];
 else if(/trade|trading|wholesale|distribut|import|export/.test(b)) agents=['Invoice & bill organiser','Payment chaser','Bank & cash reconciler','Money & cash-flow agent'];
 else if(/service|consult|agency|firm|studio/.test(b)) agents=['Email & enquiry assistant','Report summariser','Wages & payroll helper','Invoice & bill organiser'];
 else if(/manufactur|factory|production|mill|plant/.test(b)) agents=['Stock & reorder tracker','Money & cash-flow agent','Mistake & anomaly catcher','GST, compliance & renewals watcher'];
 else if(/restaurant|food|cafe|hotel|kitchen|caterer/.test(b)) agents=['Stock & reorder tracker','Wages & payroll helper','Email & enquiry assistant','Payment chaser'];
 else agents=['Invoice & bill organiser','Payment chaser','Stock & reorder tracker','Email & enquiry assistant'];
 askStage='agentpick';
 const opts=agents.map(a=>({t:a,f:()=>{bubble(a,'me');pickAgent(a);}}));
 opts.push({t:'See all agents',f:()=>{bubble('See all agents','me');window.location.href='agents.html';}});
 chips(opts);
}
function pickAgent(a){
 lead.need=(lastTopic?('['+lastTopic+'] '):'')+'[business: '+lead.business+'] interested: '+a;
 finishLead(a);
}
function sendToSheet(){
 try{
  const data=new URLSearchParams();
  data.append(LEAD_F.fullname,lead.fullname||'');data.append(LEAD_F.email,lead.email||'');
  data.append(LEAD_F.business,lead.business||'');data.append(LEAD_F.need,lead.need||'');data.append(LEAD_F.phone,'');
  fetch(LEAD_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:data.toString()}).catch(()=>{});
 }catch(_){}
}
function finishLead(agentName){foot.innerHTML='';typing(()=>{
 sendToSheet();
 bubble("Perfect ‚Äî looking at the <b>"+agentName+"</b> for you. üôå");
 typing(()=>{bubble("One of us will reach out very soon to walk you through it. Thanks, "+lead.fullname.split(' ')[0]+" ‚Äî talk soon!");chips([{t:'See agent details',f:()=>{window.location.href='agents.html';}},{t:'Close chat',f:closeChat}]);},900);
},700);}
// legacy alias so old call sites still work
function submitLead(){finishLead(lastTopic||'an agent');}
addEventListener('keydown',e=>{if(e.key==='Escape')closeChat();});
// auto-open chat with a specific agent if ?agent=... URL param is present
(function(){
 const p=new URLSearchParams(location.search);
 const a=p.get('agent');
 if(a){const name=decodeURIComponent(a.replace(/\+/g,' ')).trim();
  setTimeout(()=>askAgent(name),420);}
})();
