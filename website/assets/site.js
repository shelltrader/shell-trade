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
    {id:'courses',label:'Courses', href:'courses.html', course:true},
    {id:'play',  label:'Play',     href:'play.html'}
  ];
  var navHTML = '<nav class="nav"><div class="nav-in">'
    + '<a class="brand" href="index.html">'+logomark()+'<span>ChartQuest</span></a>'
    + '<button class="nav-burger" aria-label="Menu" id="cqBurger"><span></span></button>'
    + '<div class="nav-links" id="cqLinks">';
  /* Both orphan pages fail CLOSED: a missing config must hide them, not reveal them. */
  var showCourses = CFG.showCoursesPage === true;
  links.forEach(function(l){ if(l.boss && !CFG.showBossesPage) return;
    if(l.course && !showCourses) return;
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
    +'<div><h5>Game</h5><ul><li><a href="index.html#how">How it works</a></li><li><a href="index.html#roadmap">The map ahead</a></li>'
    +(CFG.showBossesPage?'<li><a href="bosses.html">The 11 Guardians</a></li>':'')
    +'<li><a href="play.html">Play free</a></li><li><a href="index.html#install">Install the app</a></li></ul></div>'
    /* The three course links are gated too. Hiding the nav entry but leaving these was how
       courses.html stayed one click away from every page while looking switched off. */
    +'<div><h5>Learn</h5><ul>'
    +(showCourses?'<li><a href="courses.html">Courses</a></li><li><a href="courses.html#foundations">Foundations</a></li><li><a href="courses.html#pro">Pro Mastery</a></li>':'')
    +'<li><a href="index.html#faq">FAQ</a></li><li><a href="privacy.html">Privacy</a></li><li><a href="terms.html">Terms</a></li></ul></div>'
    /* This used to be an email form that replied "Thanks — you're on the list! 🐢" and sent
       NOTHING anywhere — cqNews only unhid a message. Collecting an address and silently
       dropping it is worse than not asking, so the ask is gone until there is a real list. */
    +'<div><h5>The beta</h5><p style="color:#8497ad">ChartQuest is a free early beta. World 1 and the first Guardian are playable now.</p>'
    +'<div class="btn-row" style="margin-top:12px"><a class="btn btn-primary" href="play.html">▶ Play the Beta</a></div></div>'
    /* One-word ChartQuest throughout, and no "Academy" — that product is gated and does not exist. */
    +'</div><p class="disclaimer"><b>ChartQuest is in beta.</b> Right now you can play World 1 and fight the first Guardian, the Gambler. The other worlds are still being built.<br><br><b>Important:</b> ChartQuest is an educational game. Every trade inside the game uses <b>pretend money</b> — you can never lose real money by playing. We are not financial advisors, and nothing here is advice about your money. Buying and selling real things like crypto or shares is risky and people do lose money doing it. Always check things for yourself before you use real money.</p>'
    +'<div class="foot-bottom"><span>© '+year+' ChartQuest // slow and steady</span><span>Built with 🐢 for new traders everywhere</span></div></div></footer>';
  var footMount=document.getElementById('footer'); if(footMount) footMount.outerHTML=footHTML;
  /* cqNews removed with the fake signup form above. Kept as a no-op ONLY because a stale
     cached copy of an orphan page could still have the old inline onsubmit handler; without
     this the form would submit and reload the page. It intentionally does nothing. */
  window.cqNews=function(e){ if(e&&e.preventDefault) e.preventDefault(); return false; };


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
    /* This used to read: "Set the link in assets/config.js." — a developer instruction, shown
       to whoever clicked Buy. Never ship setup notes to a visitor; say the true thing instead. */
    alert("These courses aren't for sale yet 🐢\n\nChartQuest is a free early beta right now — the game itself is the lesson. We'll announce the courses when they're ready.");
  };

  /* ---------- Service worker ---------- */
  if('serviceWorker' in navigator) window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
})();
