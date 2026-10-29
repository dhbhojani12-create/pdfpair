const V='pdfpair-ca5a022e';
const SHELL=['./','index.html','manifest.webmanifest','lib/pdf.min.js','lib/pdf.worker.min.js','lib/pdf-lib.min.js','lib/jszip.min.js','icons/icon-192.png','icons/icon-512.png','icons/apple-180.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='go')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):fetch(r))));return}
  if(u.host.includes('fonts.g')){e.respondWith(caches.open(V+'-f').then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}))))}
});
