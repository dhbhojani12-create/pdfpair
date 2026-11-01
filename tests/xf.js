const {chromium,devices}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});
const route=async page=>{await page.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});await page.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}))};
const prep=async ctx=>ctx.addInitScript(()=>{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i',1);localStorage.setItem('pp:prefs',JSON.stringify({syncUrl:'http://127.0.0.1:9300'}))}});
const ZIP='/home/claude/out/PDF Pair - FR MCQ Case Scenarios (safe).zip';
const L=await b.newContext({viewport:{width:1300,height:800}});await prep(L);const lp=await L.newPage();await route(lp);
const M=await b.newContext({...devices['Pixel 7']});await prep(M);const mp=await M.newPage();await route(mp);
const errs=[];lp.on('pageerror',e=>errs.push('L '+e.message));mp.on('pageerror',e=>errs.push('M '+e.message));
await lp.goto('http://127.0.0.1:9300/app.html');await lp.waitForTimeout(1000);
const [fc]=await Promise.all([lp.waitForEvent('filechooser'),lp.click('#oRestore')]);await fc.setFiles(ZIP);await lp.waitForTimeout(3500);await lp.evaluate(()=>document.querySelector('[data-b="restore"]').click());await lp.waitForTimeout(3500);await lp.evaluate(()=>{document.querySelector('#lib').hidden=true});
const id=await lp.evaluate(()=>__ppLib.LIB.sets.find(s=>s.type==='mcq').id);await lp.evaluate(id=>__ppLib.openSet(id),id);await lp.waitForTimeout(2500);
await mp.goto('http://127.0.0.1:9300/app.html');await mp.waitForTimeout(1200);
await lp.click('#bLink');await lp.waitForTimeout(1200);const code=await lp.evaluate(()=>document.querySelector('.lkcode').textContent);
await mp.evaluate(()=>{document.querySelector('#oLink').click()});await mp.fill('#lkCode',code);await mp.tap('#lkGo');await mp.waitForTimeout(3000);
await lp.click('#lkClose');await lp.click('#bLink');await lp.waitForTimeout(1500);
ok(await lp.isVisible('#lkSend'),'laptop link window has Send button: '+await lp.textContent('#lkSend'));
const t0=Date.now();await lp.click('#lkSend');
let seen=[];for(let i=0;i<60;i++){await mp.waitForTimeout(500);const x=await mp.evaluate(()=>document.querySelector('#xfer').hidden?'':document.querySelector('#xfer .xt').textContent);if(x&&!seen.includes(x.replace(/\d+%/,'')))seen.push(x.replace(/\d+%/,''));const has=await mp.evaluate(()=>__ppLib.LIB.sets.some(s=>s.type==='mcq'));if(has&&!x)break}
if(seen.length)console.log('phone saw:',seen.join(' | '));
const r=await mp.evaluate(async()=>{const s=__ppLib.LIB.sets.find(s=>s.type==='mcq');if(!s)return null;const k=JSON.parse(localStorage.getItem('pp:'+s.key));const db=await new Promise(r=>{const q=indexedDB.open('pdfpair');q.onsuccess=()=>r(q.result)});const blob=await new Promise(r=>{const g=db.transaction('files').objectStore('files').get('blob:'+s.files.q[0].id);g.onsuccess=()=>r(g.result)});return {name:s.name,st:k.stickers.q.length,mcq:Object.keys(k.mcq).length,size:blob&&blob.size,want:s.files.q[0].size}});
ok(r&&r.st===345&&r.size===r.want,'phone received set over Wi-Fi in '+((Date.now()-t0)/1000).toFixed(1)+'s: '+JSON.stringify(r));
await mp.waitForTimeout(2500);
const lt=await lp.evaluate(()=>document.querySelector('#toast').textContent);ok(/Sent/.test(lt),'laptop says: '+lt);
const pg=await mp.evaluate(()=>document.querySelectorAll('#pane-q .page').length);ok(pg===276,'phone opens it: '+pg+' pages');
// share-in: drop the PDF blob then share the same PDF
await mp.evaluate(async()=>{const s=__ppLib.LIB.sets.find(s=>s.type==='mcq');const db=await new Promise(r=>{const q=indexedDB.open('pdfpair');q.onsuccess=()=>r(q.result)});await new Promise(r=>{const t=db.transaction('files','readwrite');t.objectStore('files').delete('blob:'+s.files.q[0].id);t.oncomplete=r})});
await mp.evaluate(()=>{const i=document.createElement('input');i.type='file';i.id='tsf';i.multiple=true;document.body.append(i)});
await mp.setInputFiles('#tsf','/home/claude/mcq/pkg/FR MCQ Case Scenarios.pdf');
await mp.evaluate(()=>__ppXfer.takeShared(document.querySelector('#tsf').files));await mp.waitForTimeout(2500);
const t2=await mp.evaluate(async()=>{const s=__ppLib.LIB.sets.find(s=>s.type==='mcq');const db=await new Promise(r=>{const q=indexedDB.open('pdfpair');q.onsuccess=()=>r(q.result)});const b=await new Promise(r=>{const g=db.transaction('files').objectStore('files').get('blob:'+s.files.q[0].id);g.onsuccess=()=>r(g.result)});return {sz:b&&b.size,toast:document.querySelector('#toast').textContent}});
ok(t2.sz>0&&/Added the PDF/.test(t2.toast),'shared PDF re-attached to its set: '+JSON.stringify(t2));
// share a new PDF -> Add set dialog prefilled
await mp.setInputFiles('#tsf','/home/claude/mtp/FR MTP Nov 26 Questions.pdf');
await mp.evaluate(()=>__ppXfer.takeShared(document.querySelector('#tsf').files));await mp.waitForTimeout(1200);
const d=await mp.evaluate(()=>({open:!document.querySelector('#open').hidden,name:document.querySelector('#oName').value,go:!document.querySelector('#oGo').disabled}));
ok(d.open&&d.name==='FR MTP Nov 26 Questions'&&d.go,'new PDF opens Add set filled in: '+JSON.stringify(d));await mp.screenshot({path:'xf1.png'});
await mp.evaluate(()=>document.querySelector('#oCancel').click());
// share a zip -> restore confirm
await mp.setInputFiles('#tsf','/home/claude/out/PDF Pair - FR MTP (safe).zip');
await mp.evaluate(()=>__ppXfer.takeShared(document.querySelector('#tsf').files));await mp.waitForTimeout(3000);
ok(await mp.isVisible('[data-b="restore"]'),'shared zip shows the Restore confirm');await mp.screenshot({path:'xf2.png'});
console.log(errs);await b.close()})();
