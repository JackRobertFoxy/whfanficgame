import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
async function files(dir){const result=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())result.push(...await files(p));else if(!p.endsWith('.md'))result.push(p);}return result;}
const all=(await files('dist')).filter(p=>!p.endsWith('sw.js')&&!p.endsWith('asset-manifest.json')).sort();
const hash=createHash('sha256');for(const f of all){hash.update(f);hash.update(await readFile(f));}
const version=hash.digest('hex').slice(0,14);
await writeFile('dist/asset-manifest.json',JSON.stringify({version,assets:all.map(f=>f.slice(5))}));
await writeFile('dist/sw.js',`
const VERSION=${JSON.stringify(version)};
const PREFIX='quiet-world:'+new URL(self.registration.scope).pathname+':';
const CACHE=PREFIX+VERSION;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch(new URL('asset-manifest.json',self.registration.scope),{cache:'no-store'});
 if(!response.ok)throw Error('Offline manifest unavailable');
 const manifest=await response.json();
 const cache=await caches.open(CACHE);
 await cache.addAll(manifest.assets.map(p=>new URL(p,self.registration.scope).href));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
 for(const client of await self.clients.matchAll())client.postMessage({type:'OFFLINE_READY'});
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 event.respondWith((async()=>{
  if(event.request.mode==='navigate'){
   try{const response=await fetch(event.request);if(response.ok)return response;}catch{}
   return await caches.match(new URL('index.html',self.registration.scope).href)||Response.error();
  }
  return await caches.match(event.request)||fetch(event.request);
 })());
});
`);
await writeFile('dist/.nojekyll','');
console.log(`Offline ${version}: ${all.length} files, ready for root or GitHub Pages subpath.`);
