const {chromium}=require('playwright');const fs=require('fs');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const route=async page=>{await page.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
 await page.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.route('http://local/x.html',r=>r.fulfill({body:'<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+fs.readFileSync('/home/claude/pdfpair/PDF-Pair.html','utf8')+'</body></html>',contentType:'text/html'}))};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1400,height:850}});const page=await ctx.newPage();await route(page);const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto('http://local/x.html');await page.waitForTimeout(1000);
const rs=async f=>{await page.evaluate(()=>{document.querySelector('#open').hidden=true});const [fc]=await Promise.all([page.waitForEvent('filechooser'),page.click('#libRestore')]);await fc.setFiles(f);await page.waitForTimeout(4000);await page.click('[data-b="restore"]');await page.waitForTimeout(5000)};
await rs('/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/old.zip');
// simulate the user tagging RTP Q1 chapter
const rk=await page.evaluate(()=>__ppLib.LIB.sets.find(s=>s.name==='FR RTP').key);
await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem('pp:'+k));s.meta={'5':{ch:'Ind AS 21',tp:''}};localStorage.setItem('pp:'+k,JSON.stringify(s))},rk);
await rs('/home/claude/out/PDF Pair - FR Module 1 (safe).zip');
const r=await page.evaluate(k=>({ty:__ppLib.LIB.sets.map(s=>s.type).join(),sets:__ppLib.LIB.sets.map(s=>s.name),rtpMeta:JSON.parse(localStorage.getItem('pp:'+k)).meta,pq:(()=>{const s=__ppLib.LIB.sets.find(s=>s.name==='FR Past Paper');return JSON.parse(localStorage.getItem('pp:'+s.key)).stickers.q.length})()}),rk);
ok(r.rtpMeta['5']&&r.sets.length===5&&r.sets.includes('FR Module 1'),JSON.stringify(r));
const pid=await page.evaluate(()=>__ppLib.LIB.sets.find(s=>s.name==='FR Module 1').id);await page.click('#libClose').catch(()=>{});
await page.evaluate(id=>__ppLib.openSet(id),pid);await page.waitForTimeout(5000);
const m=await page.evaluate(()=>[document.querySelectorAll('#pane-q .stk').length,document.querySelectorAll('#pane-a .stk').length,document.querySelectorAll('#pane-q .page').length,document.querySelectorAll('#pane-a .page').length]);ok(m.join()==='127,127,524,524','MTP opens: '+m);await page.evaluate(()=>{const r=[...document.querySelectorAll('.row')].find(r=>r.textContent.includes('Ind AS 7 · TYK 3'));r.click()});await page.waitForTimeout(2500);await page.screenshot({path:'m1.png'});
console.log(errs);await b.close()})();
