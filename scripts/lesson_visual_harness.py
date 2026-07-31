#!/usr/bin/env python3
"""Rebuild the LessonChart visual-audit harness straight from chart-quest.html.

Renders every LessonChart scene at true mobile card width so label placement can be
eyeballed and screenshotted. Run after any edit to the LessonChart engine:
    python3 scripts/lesson_visual_harness.py
"""
import os, sys, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'chart-quest.html'), encoding='utf-8').read()
i = src.index('const LessonChart=(function(){')
j = src.index('\n})();', i) + len('\n})();')
block = src[i:j]
keys = re.findall(r'\n    ([a-z_]+):\{caption:', block)
out = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LessonChart visual audit</title>
<style>
 body{margin:0;background:#05070c;font:14px -apple-system,system-ui,sans-serif;color:#e6edf6}
 h1{font-size:15px;padding:14px 16px 4px;margin:0;letter-spacing:.4px}
 .sub{padding:0 16px 12px;color:#7d8aa0;font-size:12px}
 .grid{display:flex;flex-wrap:wrap;gap:14px;padding:0 16px 40px}
 .card{width:342px;background:#0a0e17;border:1px solid #1c2737;border-radius:12px;overflow:hidden}
 .key{font:800 10px/1 -apple-system,sans-serif;letter-spacing:1.2px;color:#4cc3ff;padding:9px 12px 0}
 canvas{display:block;width:342px;height:208px}
 .cap{padding:6px 12px 11px;font-size:12px;line-height:1.45;color:#c8d6e6}
 .cap b{color:#fff}
</style></head><body>
<h1>LESSONCHART — EVERY SCENE, MOBILE WIDTH (342&times;208)</h1>
<div class="sub">Rendered from chart-quest.html. Labels must never touch a candle, never clip, never rely on colour alone.</div>
<div class="grid" id="g"></div>
<script>
""" + block + """
const KEYS=""" + repr(keys).replace("'", '"') + """;
const g=document.getElementById('g'),MOUNTS=[];
KEYS.forEach(k=>{
  const d=document.createElement('div');d.className='card';
  d.innerHTML='<div class="key">'+k.toUpperCase()+'</div><canvas></canvas>'+
              '<div class="cap">'+(LessonChart.SCENES[k].caption||'')+'</div>';
  g.appendChild(d);
  MOUNTS.push(LessonChart.mount(d.querySelector('canvas'),k));
});
/* Restart every scene together, then settle past the last reveal (max `at` is 3.6s) so a
   screenshot shows EVERY annotation at once. Deterministic — no phase luck. */
window.__showAll=function(sec){
  MOUNTS.forEach(m=>{try{m.freeze(sec==null?4.6:sec);m.redraw();}catch(e){}});
  return new Promise(r=>setTimeout(()=>r('frozen at t='+(sec==null?4.6:sec)+'s — every annotation revealed'),120));
};
/* Set every canvas to `w` CSS px and force a synchronous re-measure + re-solve.
   Do NOT rely on the rAF loop here: it is throttled while the pane is hidden, so a sweep that
   just sets a width and waits will silently re-measure the OLD layout and report a false pass. */
window.__setWidth=function(w){
  document.querySelectorAll('.card').forEach(e=>e.style.width=w+'px');
  document.querySelectorAll('canvas').forEach(e=>e.style.width=w+'px');
  MOUNTS.forEach(m=>{try{m.freeze(4.6);m.redraw();}catch(e){}});
  const cv=document.querySelector('canvas');
  return {asked:w, measured:Math.round(cv.getBoundingClientRect().width),
          solvedFor:LessonChart.SCENES[KEYS[0]]._layKey};
};
/* ── AUDIT — the founder's seven criteria, asserted against the layout the engine actually
   solved (scene._lay) and the obstacle list it actually used (scene._ob). This tests the
   shipped code, not a re-implementation of it.
     1 no text TOUCHES a candle   → require a real gap, not merely zero overlap
     2 no text overlaps candles / other words / other objects (zones, the reward float)
     3 text always visible and clearly identifies its target → on-frame + anchored
     4 arrows from term to candle are visible → every anchored label carries one
     7 mobile → the caller sweeps widths and re-runs this                              */
window.__audit=function(minGap){
  const GAP = (minGap==null?3:minGap);
  const hit=(a,b,p)=>!(a.x+a.w+p<=b.x||b.x+b.w+p<=a.x||a.y+a.h+p<=b.y||b.y+b.h+p<=a.y);
  const clr=(a,b)=>Math.max(b.x-(a.x+a.w), a.x-(b.x+b.w), b.y-(a.y+a.h), a.y-(b.y+b.h));
  const bad=[]; let labels=0, arrows=0, tightest=1e9, tightAt='';
  KEYS.forEach(k=>{
    const s=LessonChart.SCENES[k],lay=s._lay,ob=s._ob||[],B=s._B;
    if(!lay){bad.push({scene:k,issue:'NO LAYOUT SOLVED'});return;}
    const rects=lay.filter(o=>o&&o.r); labels+=rects.length;
    rects.forEach((o,i)=>{
      // 1 + 2 — clearance from every candle
      ob.forEach((c,ci)=>{
        const g=clr(o.r,c);
        if(g<tightest){tightest=g;tightAt=k+':"'+o.text+'"';}
        if(hit(o.r,c,0))        bad.push({scene:k,label:o.text,issue:'OVERLAPS candle '+ci});
        else if(g<GAP)          bad.push({scene:k,label:o.text,issue:'TOUCHES candle '+ci+' (gap '+g.toFixed(1)+'px < '+GAP+')'});
      });
      // 2 — against other words
      rects.forEach((q,j)=>{ if(j>i&&hit(o.r,q.r,0)) bad.push({scene:k,label:o.text,issue:'OVERLAPS label "'+q.text+'"'}); });
      // 3 — on-frame
      if(o.r.x<B.x0-0.5||o.r.x+o.r.w>B.x1+0.5||o.r.y<B.y0-0.5||o.r.y+o.r.h>B.y1+0.5)
        bad.push({scene:k,label:o.text,issue:'OUT OF FRAME'});
      // 4 — an anchored label must carry a visible arrow to its target
      if(o.ax!=null){
        const mx=o.r.x+o.r.w/2,my=o.r.y+o.r.h/2;
        const reach=Math.hypot(o.ax-mx,o.ay-my);
        if(reach<6) bad.push({scene:k,label:o.text,issue:'arrow too short to read ('+reach.toFixed(1)+'px)'});
        else arrows++;
      }
    });
  });
  return {scenes:KEYS.length, labels:labels, arrows:arrows,
          minCandleGap:+tightest.toFixed(1), tightest:tightAt, failures:bad};
};
/* Smallest label text actually rendered — criterion 7 guards against tiny type on phones. */
window.__typeScale=function(){
  const cv=document.querySelector('canvas'), x=cv.getContext('2d');
  const before=x.font; const sizes=new Set();
  KEYS.forEach(k=>(LessonChart.SCENES[k]._lay||[]).forEach(o=>{ if(o&&o.tier) sizes.add(o.tier); }));
  x.font=before;
  return {tiersInUse:[...sizes].sort(), canvasWidth:Math.round(cv.getBoundingClientRect().width)};
};
</script></body></html>"""
dest = os.path.join(ROOT, 'lesson-visual-audit.html')
open(dest, 'w', encoding='utf-8').write(out)
print('scenes:', len(keys))
print('wrote', dest)
