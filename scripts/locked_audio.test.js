#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const game=fs.readFileSync(require('path').join(__dirname,'../chart-quest.html'),'utf8');
const audition=fs.readFileSync(require('path').join(__dirname,'../docs/previews/chartquest-audio-audition.html'),'utf8');
function section(s,a,b){const i=s.indexOf(a);assert(i>=0,a);const j=s.indexOf(b,i);assert(j>i,b);return s.slice(i,j);}
class Param {
 constructor(){this.value=0;this.events=[];}
 setValueAtTime(v,t){assert(Number.isFinite(v)&&Number.isFinite(t));this.value=v;this.events.push(['set',v,t]);}
 exponentialRampToValueAtTime(v,t){assert(v>0);this.setValueAtTime(v,t);}
 linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}
 cancelScheduledValues(){} cancelAndHoldAtTime(){}
}
class Node {
 constructor(ctx,kind){this.ctx=ctx;this.kind=kind;this.links=[];for(const k of ['gain','frequency','detune','Q','threshold','knee','ratio','attack','release'])this[k]=new Param();ctx.nodes.push(this);}
 connect(n){this.links.push(n);return n;} disconnect(){this.links=[];}
 start(t=0){this.startTime=t;this.ctx.sources.push(this);} stop(t){this.stopTime=t;}
}
class Context {
 constructor(){this.currentTime=0;this.sampleRate=1000;this.state='running';this.nodes=[];this.sources=[];this.destination=new Node(this,'destination');Context.last=this;Context.count++;}
 createGain(){return new Node(this,'gain');} createOscillator(){return new Node(this,'osc');} createBufferSource(){return new Node(this,'noise');}
 createBiquadFilter(){return new Node(this,'filter');} createDynamicsCompressor(){return new Node(this,'compressor');} createWaveShaper(){return new Node(this,'shaper');}
 createBuffer(ch,n){return {getChannelData:()=>new Float32Array(n)};} resume(){this.state='running';return Promise.resolve();}
}
Context.count=0;
function signature(ctx){return ctx.sources.map(n=>({kind:n.kind,type:n.type,start:n.startTime,stop:n.stopTime,f:n.frequency.events,chain:n.links.map(x=>({kind:x.kind,f:x.frequency.events,g:x.gain.events}))}));}
function harness(){
 const intervals=new Map(),docEvents={},winEvents={},els={};let nextId=1;
 const el=id=>els[id]||(els[id]={classes:new Set(),style:{display:'none'},classList:{contains(c){return els[id].classes.has(c);}}});
 const env={console,Math,Float32Array,Audio:class {load(){} pause(){} play(){return Promise.resolve();}},
  document:{hidden:false,getElementById:el,addEventListener:(n,f)=>docEvents[n]=f},
  window:{AudioContext:Context,addEventListener:(n,f)=>winEvents[n]=f},
  setInterval:f=>{const n=nextId++;intervals.set(n,f);return n;},clearInterval:n=>intervals.delete(n),setTimeout:()=>nextId++,
  introCine:{active:false},bcJourney:{active:false},trade:null,reviewEntry:null,reviewMode:'replay',lessonOpen:false,journalOpen:false,journalTab:'history',portals:[],CineAudio:{setMuted(){}}};
 const code=section(game,'function createLockedScore(context)', '/* ════════ BOSS ARENA');
 vm.runInNewContext(code+'\nthis.music=GameMusic;this.factory=createLockedScore;',env);
 return {env,el,intervals,docEvents,winEvents,m:env.music,advance(seconds){Context.last.currentTime+=seconds;for(const f of intervals.values())f();}};
}
const cases=[];function test(name,fn){cases.push([name,fn]);}
test('all seven locked choices match audition notes, timing and synthesis for two full cycles',()=>{
 const h=harness();
 const original=section(audition,'  const sceneData =','  const $ =')+section(audition,'  function midi(', '  function scheduleStep(');
 const data={explore:['exploration',7,'scheduleExploration'],trade:['trade',4,'scheduleTrade'],guardian:['guardian',2,'scheduleGuardian'],continue:['recovery',7,'scheduleExploration'],forward:['recovery',8,'scheduleRecovery'],chamber:['recovery',9,'scheduleRecovery'],quiet:['recovery',10,'scheduleRecovery']};
 for(const [name,[mode,index,schedule]] of Object.entries(data)){
  const real=new Context(),ref=new Context(), renderer=h.env.factory(real),r={context:ref,noiseBuffer:{},Math};
  vm.runInNewContext(original+`;this.d=variants.${mode}[${index}];this.render=${schedule};`,r);
  assert.deepEqual(JSON.parse(JSON.stringify(renderer.scores[name])),JSON.parse(JSON.stringify(r.d)),name+' config');
  for(let step=0;step<128;step++){const at=step*(60/r.d.bpm)/4;renderer.schedule(name,step,at,real.destination);r.render(r.d,step%16,Math.floor(step/16)%4,Math.floor(step/64)%2,at,ref.destination);}
  assert.deepEqual(signature(real),signature(ref),name+' changed approved audio');
 }
});
test('every level and Guardian uses the approved state map with overlay priority',()=>{
 const {m}=harness();
 for(let level=0;level<=11;level++){
  for(const [state,expected] of [[{},'explore'],[{browse:true},'continue'],[{trade:true},'trade'],[{ticket:true},'trade'],[{predict:true},'trade'],[{guardianApproach:true},'guardian'],[{boss:true},'guardian'],[{boss:true,bossResult:true},'forward'],[{review:true},'forward'],[{review:true,reviewDetails:true},'quiet'],[{journal:true},'chamber'],[{journal:true,journalReading:true},'quiet'],[{intermission:true},'chamber'],[{lesson:true},'quiet'],[{drill:true},'forward'],[{intro:true},null],[{intro:true,journey:true},'explore'],[{trade:true,journal:true},'chamber']]) assert.equal(m.route({...state,level}),expected);
 }
});
test('actual DOM and gameplay states route replay, details, Journal, ticket and every boss',()=>{
 const h=harness(),{m,env,el}=h;m.unlock();m.sync();assert.equal(m.snapshot().selected,'explore');
 el('tradePanel').classes.add('open');m.sync();assert.equal(m.snapshot().selected,'trade');
 env.trade={};el('tradePanel').classes.clear();m.sync();assert.equal(m.snapshot().selected,'trade');
 env.journalOpen=true;m.sync();assert.equal(m.snapshot().selected,'chamber');
 env.journalTab='knowledge';m.sync();assert.equal(m.snapshot().selected,'quiet');
 env.reviewEntry={};el('chartFull').classes.add('open');m.sync();assert.equal(m.snapshot().selected,'forward');
 env.reviewMode='details';m.sync();assert.equal(m.snapshot().selected,'quiet');
 env.trade=null;env.reviewEntry=null;env.journalOpen=false;el('chartFull').classes.clear();
 for(let level=1;level<=11;level++){env.bfState={level};el('bossFight').classes.add('open');m.sync();assert.equal(m.snapshot().title,'Collision');el('bossFight').classes.add('won');m.sync();assert.equal(m.snapshot().selected,'forward');el('bossFight').classes.clear();}
 env.portals=[{kind:'boss',entered:false}];m.sync();assert.equal(m.snapshot().selected,'guardian');env.portals=[];m.sync();assert.equal(m.snapshot().selected,'explore');
});
test('gesture gate, saved mute, repeated selection, shared Exploration transport and silent Review',()=>{
 const h=harness(),{m}=h,initial=Context.count;m.setMuted(true);m.play('trade');m.sting('win');assert.equal(Context.count,initial);
 m.unlock();assert.equal(h.intervals.size,0);m.setMuted(false);assert.equal(m.snapshot().selected,'trade');assert.equal(h.intervals.size,1);
 m.play('explore');h.advance(.3);const step=m.snapshot().step;m.play('continue');assert.equal(m.snapshot().step,step);m.play('explore');assert.equal(m.snapshot().step,step);assert.equal(h.intervals.size,1);
 m.play('quiet');const n=Context.last.sources.length;h.advance(10);assert.equal(Context.last.sources.length,n);assert.equal(h.intervals.size,0);
 m.sting('coin');assert(Context.last.sources.length>n);m.setMuted(true);const mutedCount=Context.last.sources.length;m.sting('coin');h.advance(5);assert.equal(Context.last.sources.length,mutedCount);
});
test('hidden tabs stop, foreground selects current activity, stalled clocks do not burst old notes',()=>{
 const h=harness(),{m,env}=h;m.unlock();m.play('trade');env.document.hidden=true;h.docEvents.visibilitychange();assert.equal(h.intervals.size,0);
 const n=Context.last.sources.length;h.advance(60);m.sting('win');assert.equal(Context.last.sources.length,n);
 env.trade={};env.document.hidden=false;h.docEvents.visibilitychange();assert.equal(m.snapshot().selected,'trade');assert.equal(h.intervals.size,1);
 const before=Context.last.sources.length;h.advance(120);assert(Context.last.sources.length-before<30,'scheduler burst after stall');
 h.winEvents.pagehide();assert.equal(h.intervals.size,0);h.winEvents.pageshow();assert.equal(h.intervals.size,1);
});
test('music ducks, mute disconnects active effect tails, and Boss 1 authored controller is preserved',()=>{
 const h=harness(),{m}=h;m.unlock();m.play('guardian');m.duckTo(.18,.12);
 const master=Context.last.nodes.find(n=>n.kind==='gain' && Math.abs(n.gain.value-.62*.18)<1e-9);assert(master);
 m.play('trade');assert.equal(master.gain.value,.62*.18);m.setMuted(true);m.setMuted(false);assert.equal(master.gain.value,.62*.18);
 const before=Context.last.nodes.length;m.sting('win');const bus=Context.last.nodes.slice(before).find(n=>n.kind==='gain');assert(bus.links.length);m.setMuted(true);assert.equal(bus.links.length,0);
 assert.match(game, /if \(!_boss1CineOwnsDuck && typeof GameMusic/);
});
function runSuite({report=true}={}){let passed=0;for(const [name,fn]of cases){fn();passed++;if(report)console.log('✓ '+name);}return {ok:true,passed,total:cases.length,detail:`${passed}/${cases.length} locked audio suites passed`};}
if(require.main===module){try{console.log(runSuite().detail);}catch(e){console.error(e);process.exitCode=1;}}
module.exports={runSuite};
