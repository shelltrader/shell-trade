const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
(async()=>{
 const listeners={},stored=new Map([['chartquest-site-v14',new Map([['https://playchartquest.com/bosses/flinches/boss-1-flinch-1.mp4',{identity:'old'}]])]]),deleted=[];
 const caches={keys:async()=>[...stored.keys()],delete:async key=>{deleted.push(key);return stored.delete(key)},match:async req=>{for(const rows of stored.values())if(rows.has(req.url||req))return rows.get(req.url||req)},open:async key=>{if(!stored.has(key))stored.set(key,new Map());return {put:async(req,res)=>stored.get(key).set(req.url,res),addAll:async()=>{}}}};
 const fresh={ok:true,redirected:false,identity:'approved-new',clone(){return {...this}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../website/sw.js'),'utf8'),{self:{addEventListener:(name,fn)=>listeners[name]=fn,clients:{claim:async()=>{}},navigator:{onLine:true},skipWaiting:async()=>{}},caches,fetch:async()=>fresh,Promise,Response:function(){}});
 let activation;listeners.activate({waitUntil:p=>activation=p});await activation;
 assert(deleted.includes('chartquest-site-v14'),'returning-player legacy cache must be purged');
 let response;listeners.fetch({request:{method:'GET',mode:'no-cors',url:'https://playchartquest.com/bosses/flinches/boss-1-flinch-1.mp4'},respondWith:p=>response=p});
 assert.equal((await response).identity,'approved-new','same video URL must resolve to approved replacement after activation');
 console.log('Returning-player Guardian video cache regression PASS');
})().catch(e=>{console.error(e);process.exit(1)});
