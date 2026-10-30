const V='pdfpair-504a5fad';
const SHELL=['./','index.html','manifest.webmanifest','lib/pdf.min.js','lib/pdf.worker.min.js','lib/pdf-lib.min.js','lib/jszip.min.js','lib/qrcode.min.js','icons/icon-192.png','icons/icon-512.png','icons/apple-180.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='go')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin&&r.mode==='navigate'){ // newest page when online, saved copy when offline
    e.respondWith(Promise.race([fetch(r,{cache:'no-store'}).then(x=>{if(x.ok){const c=x.clone();caches.open(V).then(k=>k.put('index.html',c))}return x}),new Promise((_,no)=>setTimeout(no,4000))]).catch(()=>caches.match('index.html')));return}
  if(u.origin===location.origin){e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r)));return}
  if(u.host.includes('fonts.g')){e.respondWith(caches.open(V+'-f').then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}))))}
});
