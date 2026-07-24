/* ===========================================================
   CHART QUEST — site engine (blockchain bg, mascot, nav, PWA)
   =========================================================== */
(function(){
  var CFG = window.CHARTQUEST_CONFIG || {showBossesPage:true, gameUrl:"game.html"};
  var page = document.body.getAttribute('data-page') || 'home';

  /* ---------- Blockchain background layers ---------- */
  document.body.insertAdjacentHTML('afterbegin', '<div id="cqbg"></div><canvas id="cqnet"></canvas>');

  /* ---------- Turtle mascot sprite (improved) ---------- */
  var SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\
<radialGradient id="cq_shellG" cx="40%" cy="26%" r="85%"><stop offset="0%" stop-color="#54f0ad"/><stop offset="48%" stop-color="#19cf86"/><stop offset="100%" stop-color="#0a7d4f"/></radialGradient>\
<radialGradient id="cq_headG" cx="38%" cy="32%" r="80%"><stop offset="0%" stop-color="#6bf0b6"/><stop offset="100%" stop-color="#15c07c"/></radialGradient>\
<linearGradient id="cq_flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d6fbff"/><stop offset="35%" stop-color="#46e0ff"/><stop offset="100%" stop-color="#3b7cff"/></linearGradient>\
<linearGradient id="cq_jet" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#eef3fb"/><stop offset="100%" stop-color="#9fb0c8"/></linearGradient>\
<linearGradient id="cq_screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06231a"/><stop offset="100%" stop-color="#04140f"/></linearGradient>\
</defs><symbol id="cq-turtle" viewBox="0 0 300 260">\
<ellipse cx="150" cy="232" rx="104" ry="20" fill="#16f29a" opacity=".16"/>\
<ellipse cx="98" cy="196" rx="24" ry="14" fill="#129a63"/>\
<path d="M80 168 q-20 4 -27 21 q20 0 33 -11 z" fill="#129a63"/>\
<ellipse cx="150" cy="214" rx="16" ry="10" fill="#15b274"/>\
<g><rect x="60" y="110" width="30" height="50" rx="14" fill="url(#cq_jet)" stroke="#7e8ca0" stroke-width="2"/><rect x="67" y="119" width="16" height="12" rx="5" fill="#46e0ff"/><circle cx="75" cy="147" r="4.5" fill="#7e8ca0"/><path d="M75 160 q-12 20 0 42 q12 -22 0 -42z" fill="url(#cq_flame)"/><path d="M75 167 q-6 12 0 27 q6 -15 0 -27z" fill="#eafdff" opacity=".9"/></g>\
<path d="M150 196 q34 6 50 -2 q10 18 -6 30 q-30 8 -44 -8 z" fill="#23c98a"/>\
<path d="M86 170 a76 64 0 0 1 152 0 q0 10 -10 10 H96 q-10 0 -10 -10z" fill="url(#cq_shellG)" stroke="#0a7044" stroke-width="4"/>\
<g fill="none" stroke="#0c8a55" stroke-width="2.4" opacity=".55"><path d="M150 116 l20 11 v22 l-20 11 l-20 -11 v-22 z"/><path d="M111 138 l15 8 v17 l-15 8"/><path d="M189 138 l-15 8 v17 l15 8"/></g>\
<path d="M118 122 q34 -22 72 -1" stroke="#cffded" stroke-width="6" fill="none" stroke-linecap="round" opacity=".5"/>\
<path d="M98 172 H226" stroke="#0a7044" stroke-width="7" stroke-linecap="round" opacity=".25"/>\
<rect x="110" y="120" width="80" height="50" rx="12" fill="url(#cq_screen)" stroke="#16f29a" stroke-width="2"/>\
<g stroke-linecap="round"><line x1="126" y1="128" x2="126" y2="162" stroke="#ef5f66" stroke-width="2.4"/><rect x="120.5" y="135" width="11" height="20" rx="2.5" fill="#ef5f66"/><line x1="148" y1="131" x2="148" y2="164" stroke="#16f29a" stroke-width="2.4"/><rect x="142.5" y="138" width="11" height="20" rx="2.5" fill="#16f29a"/><line x1="170" y1="125" x2="170" y2="160" stroke="#16f29a" stroke-width="2.4"/><rect x="164.5" y="132" width="11" height="22" rx="2.5" fill="#16f29a"/></g>\
<line x1="112" y1="145" x2="188" y2="145" stroke="#46e0ff" stroke-width="1.4" opacity=".5"/>\
<g><ellipse cx="222" cy="134" rx="39" ry="37" fill="url(#cq_headG)" stroke="#0a7044" stroke-width="4"/>\
<ellipse cx="231" cy="124" rx="13" ry="14.5" fill="#fff"/><ellipse cx="210" cy="126" rx="10.5" ry="13" fill="#fff"/>\
<circle cx="235" cy="126" r="5.8" fill="#10222c"/><circle cx="213" cy="128" r="5" fill="#10222c"/>\
<circle cx="238" cy="122.5" r="2.2" fill="#fff"/><circle cx="216" cy="124.5" r="1.9" fill="#fff"/><circle cx="232" cy="129" r="1.1" fill="#46e0ff"/>\
<path d="M206 148 q14 12 29 1" stroke="#0a7044" stroke-width="3.4" fill="none" stroke-linecap="round"/>\
<circle cx="202" cy="141" r="5" fill="#ff9a8b" opacity=".5"/><circle cx="222" cy="141" r="1.6" fill="#0a7044" opacity=".55"/></g>\
</symbol></svg>';
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
  function turtle(cls){return '<svg class="tmark '+(cls||'')+'" viewBox="0 0 300 260"><use href="#cq-turtle"/></svg>';}
  window.cqTurtle = turtle;

  /* ---------- Animated blockchain network ---------- */
  (function net(){
    var c=document.getElementById('cqnet'); if(!c||!c.getContext) return;
    var ctx=c.getContext('2d'), w=0,h=0,nodes=[],raf,DPR=Math.min(window.devicePixelRatio||1,2);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function build(){ var n=Math.max(22,Math.min(60,Math.round(w*h/26000))); nodes=[];
      for(var i=0;i<n;i++) nodes.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,g:Math.random()<.3}); }
    function resize(){ w=c.clientWidth; h=c.clientHeight; c.width=w*DPR; c.height=h*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
    function frame(){
      ctx.clearRect(0,0,w,h);
      var i,j;
      for(i=0;i<nodes.length;i++){var p=nodes[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;}
      for(i=0;i<nodes.length;i++)for(j=i+1;j<nodes.length;j++){var a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
        if(d<20000){var o=(1-d/20000)*.4;ctx.strokeStyle='rgba(86,150,255,'+o+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
      for(i=0;i<nodes.length;i++){var p=nodes[i];ctx.fillStyle=p.g?'rgba(22,242,154,.9)':'rgba(70,224,255,.85)';ctx.beginPath();ctx.arc(p.x,p.y,p.g?2.2:1.6,0,6.3);ctx.fill();}
      raf=requestAnimationFrame(frame);
    }
    resize(); window.addEventListener('resize',function(){cancelAnimationFrame(raf);resize();if(!reduce)frame();});
    if(reduce) frame(); else frame();
  })();

  /* ---------- Navigation ---------- */
  var links = [
    {id:'home',  label:'Home',     href:'index.html'},
    {id:'game',  label:'The Game', href:'index.html#game'},
    {id:'bosses',label:'Bosses',   href:'bosses.html', boss:true},
    {id:'courses',label:'Courses', href:'courses.html'},
    {id:'play',  label:'Play',     href:'play.html'}
  ];
  var navHTML = '<nav class="nav"><div class="nav-in">'
    + '<a class="brand" href="index.html">'+turtle()+'<span>Chart Quest</span></a>'
    + '<button class="nav-burger" aria-label="Menu" id="cqBurger"><span></span></button>'
    + '<div class="nav-links" id="cqLinks">';
  links.forEach(function(l){ if(l.boss && !CFG.showBossesPage) return;
    navHTML += '<a href="'+l.href+'"'+(l.id===page?' class="active"':'')+'>'+l.label+'</a>'; });
  navHTML += '<span class="nav-cta"><a class="btn btn-primary" href="play.html">Play Free</a></span></div></div></nav>';
  var navMount = document.getElementById('nav'); if(navMount) navMount.outerHTML = navHTML;

  var burger=document.getElementById('cqBurger'), linksEl=document.getElementById('cqLinks');
  if(burger) burger.addEventListener('click',function(){linksEl.classList.toggle('open');});
  if(!CFG.showBossesPage) document.querySelectorAll('[data-boss-gated]').forEach(function(el){el.style.display='none';});

  /* ---------- Footer ---------- */
  var year=new Date().getFullYear();
  var footHTML='<footer class="foot"><div class="wrap"><div class="foot-grid">'
    +'<div><a class="brand" href="index.html" style="color:#fff">'+turtle()+'<span>Chart Quest</span></a>'
    +'<p style="margin-top:14px;max-width:280px;color:#8497ad">A side-scrolling trading RPG. Hop across live crypto charts, beat the Guardians, and learn to trade — free, in your browser.</p></div>'
    +'<div><h5>Game</h5><ul><li><a href="index.html#how">How it works</a></li><li><a href="index.html#worlds">The 10 worlds</a></li>'
    +(CFG.showBossesPage?'<li><a href="bosses.html">The 11 Guardians</a></li>':'')
    +'<li><a href="play.html">Play free</a></li><li><a href="index.html#install">Install the app</a></li></ul></div>'
    +'<div><h5>Learn</h5><ul><li><a href="courses.html">Courses</a></li><li><a href="courses.html#foundations">Foundations</a></li><li><a href="courses.html#pro">Pro Mastery</a></li><li><a href="index.html#faq">FAQ</a></li></ul></div>'
    +'<div><h5>Get launch updates</h5><p style="color:#8497ad">New worlds, bosses &amp; course drops. No spam.</p>'
    +'<form class="news" onsubmit="return cqNews(event)"><input type="email" required placeholder="you@email.com" aria-label="Email"><button class="btn btn-primary" type="submit">Join</button></form>'
    +'<p id="cqNewsMsg" style="color:var(--green);font-size:13px;margin-top:10px;display:none">Thanks — you\'re on the list! 🐢</p></div>'
    +'</div><p class="disclaimer"><b>Important:</b> Chart Quest is an educational game. All trades in the game are <b>simulated</b> with play money — you never risk real funds to play. Nothing in Chart Quest or Chart Quest Academy is financial advice, and we are not financial advisors. Trading real assets (including crypto) carries significant risk, including loss of capital. Always do your own research.</p>'
    +'<div class="foot-bottom"><span>© '+year+' Chart Quest // slow and steady</span><span>Built with 🐢 for new traders everywhere</span></div></div></footer>';
  var footMount=document.getElementById('footer'); if(footMount) footMount.outerHTML=footHTML;
  window.cqNews=function(e){e.preventDefault();var m=document.getElementById('cqNewsMsg');if(m)m.style.display='block';e.target.reset();return false;};

  /* ---------- Mount [data-turtle] ---------- */
  document.querySelectorAll('[data-turtle]').forEach(function(el){ el.innerHTML=turtle(el.getAttribute('data-turtle')||''); });

  /* ---------- FAQ ---------- */
  document.querySelectorAll('.qa button').forEach(function(b){ b.addEventListener('click',function(){
    var qa=b.parentElement, ans=qa.querySelector('.ans'); var open=qa.classList.toggle('open');
    ans.style.maxHeight = open ? ans.scrollHeight+'px' : 0; }); });

  /* ---------- Reveal ---------- */
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
  } else document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');});

  /* ---------- Sticky CTA ---------- */
  var sticky=document.getElementById('cqSticky');
  if(sticky){var on=function(){window.scrollY>560?sticky.classList.add('show'):sticky.classList.remove('show');};window.addEventListener('scroll',on,{passive:true});on();}

  /* ---------- PWA install ---------- */
  var deferred=null;
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;document.querySelectorAll('[data-install]').forEach(function(b){b.style.display='';});});
  var isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  window.cqInstall=function(){
    if(deferred){deferred.prompt();deferred.userChoice.finally(function(){deferred=null;});return;}
    var m=document.getElementById('cqInstallModal');
    if(m){m.querySelector('[data-iostext]').style.display=isiOS?'':'none';m.querySelector('[data-andtext]').style.display=isiOS?'none':'';m.classList.add('show');}
  };
  window.cqCloseModal=function(){var m=document.getElementById('cqInstallModal');if(m)m.classList.remove('show');};

  /* ---------- Courses checkout ---------- */
  window.cqBuy=function(which){
    var url=which==='pro'?CFG.checkoutProMasteryUrl:CFG.checkoutFoundationsUrl;
    if(url){window.location.href=url;return;}
    alert("Checkout is opening soon! 🐢\n\nThis is where your secure payment page will load once you connect a checkout provider (Stripe, Gumroad, Teachable…). Set the link in assets/config.js.");
  };

  /* ---------- Service worker ---------- */
  if('serviceWorker' in navigator) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();
