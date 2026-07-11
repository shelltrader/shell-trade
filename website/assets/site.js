/* ===========================================================
   CHART QUEST — site engine (blockchain bg, mascot, nav, PWA)
   =========================================================== */
(function(){
  var CFG = window.CHARTQUEST_CONFIG || {showBossesPage:true, gameUrl:"game.html"};
  var page = document.body.getAttribute('data-page') || 'home';

  /* ---------- Blockchain background layers ---------- */
  document.body.insertAdjacentHTML('afterbegin', '<div id="cqbg"></div><canvas id="cqnet"></canvas>');

  /* ---------- Brand logomark ----------
     The old procedural turtle SVG (#cq-turtle / window.cqTurtle) was removed on
     2026-07-10: it was unapproved art that predates Finn. Anything that needs a
     mark now uses the candlestick logomark; anything that needs Finn uses the
     official PNGs in assets/finn-*.png. Do not reintroduce a drawn turtle. */
  function logomark(){return '<svg class="tmark" viewBox="0 0 32 32" fill="none" aria-hidden="true">'
    + '<rect x="6" y="10" width="6" height="14" rx="2" fill="#16C784"/><rect x="8" y="4" width="2" height="24" rx="1" fill="#16C784"/>'
    + '<rect x="20" y="8" width="6" height="12" rx="2" fill="#EA3943"/><rect x="22" y="4" width="2" height="24" rx="1" fill="#EA3943"/></svg>';}

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
    + '<a class="brand" href="index.html">'+logomark()+'<span>ChartQuest</span></a>'
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
    +'<div><a class="brand" href="index.html" style="color:#fff">'+logomark()+'<span>ChartQuest</span></a>'
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
