const {chromium,devices}=require('playwright');const fs=require('fs');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const route=async page=>{await page.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':u.includes('qrcode')?'/home/claude/pdfpair-repo/lib/qrcode.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
 await page.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.route('http://local/x.html',r=>r.fulfill({body:'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+fs.readFileSync('/home/claude/pdfpair/PDF-Pair.html','utf8')+'</body></html>',contentType:'text/html'}))};
const MCQ='/home/claude/out/PDF Pair - FR MCQ Case Scenarios (safe).zip';
async function setup(ctxo){const b=await chromium.launch();const ctx=await b.newContext(ctxo);const page=await ctx.newPage();await route(page);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('http://local/x.html');await page.waitForTimeout(1200);return {b,page,errs}}
(async()=>{
 // laptop
 let {b,page,errs}=await setup({viewport:{width:1400,height:850}});
 await page.evaluate(()=>{document.querySelector('#open').hidden=true});
 const [fc]=await Promise.all([page.waitForEvent('filechooser'),page.click('#libRestore')]);await fc.setFiles(MCQ);await page.waitForTimeout(4000);await page.click('[data-b="restore"]');await page.waitForTimeout(4000);
 const id=await page.evaluate(()=>__ppLib.LIB.sets.find(s=>s.type==='mcq').id);await page.click('#libClose').catch(()=>{});
 await page.evaluate(id=>__ppLib.openSet(id),id);await page.waitForTimeout(4000);
 await page.evaluate(()=>[...document.querySelectorAll('.row')].find(r=>r.textContent.includes('Case 1 · Q1')).click());await page.waitForTimeout(1500);
 let s=await page.evaluate(()=>({bar:getComputedStyle(document.querySelector('#mcqBar')).display,cover:getComputedStyle(document.querySelector('#mcqCover')).display,lab:document.querySelector('#mcqBar .mq').textContent}));
 ok(s.bar==='flex'&&s.cover==='grid'&&s.lab==='Case 1 · Q1','bar+cover shown '+JSON.stringify(s));
 await page.screenshot({path:'mp1.png'});
 // Case1 Q1 answer is d -> pick a (wrong)
 await page.click('#mcqBar [data-o="a"]');await page.waitForTimeout(800);
 s=await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('pp:FR MCQ'));const p=JSON.parse(localStorage.getItem(k));return {rev:p.rev[2],m:p.mans[2],cover:getComputedStyle(document.querySelector('#mcqCover')).display,ms:document.querySelector('#mcqBar .ms').textContent,bad:document.querySelector('#mcqBar .bad').dataset.o,good:document.querySelector('#mcqBar .ok').dataset.o}});
 ok(s.rev==='again'&&!s.m.ok&&s.cover==='none'&&s.bad==='a'&&s.good==='d','wrong pick '+JSON.stringify(s));
 await page.screenshot({path:'mp2.png'});
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(1200);
 s=await page.evaluate(()=>({lab:document.querySelector('#mcqBar .mq').textContent,cover:getComputedStyle(document.querySelector('#mcqCover')).display,done:document.querySelector('#mcqBar').classList.contains('done')}));
 ok(s.lab==='Case 1 · Q2'&&s.cover==='grid'&&!s.done,'next question resets '+JSON.stringify(s));
 const k2=await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('pp:FR MCQ'));return JSON.parse(localStorage.getItem(k)).mcq[3]});
 await page.click('#mcqBar [data-o="'+k2+'"]');await page.waitForTimeout(600);
 s=await page.evaluate(()=>document.querySelector('#mcqBar .ms').textContent);ok(s.includes('Right')&&s.includes('Case 1 1/5'),'right pick + case score: '+s);
 await page.keyboard.press('ArrowLeft');await page.waitForTimeout(1000);
 s=await page.evaluate(()=>document.querySelector('#mcqBar .ms').textContent);ok(s.startsWith('Last ✗'),'previous shows last: '+s);
 await page.keyboard.press('3');await page.waitForTimeout(500);await page.keyboard.press('ArrowRight');await page.waitForTimeout(400);await page.keyboard.press('ArrowRight');await page.waitForTimeout(1200);
 s=await page.evaluate(()=>({cls:document.querySelector('#app').className,lab:document.querySelector('#mcqBar .mq').textContent}));ok(s.cls.includes('v-q')&&s.lab==='Case 1 · Q3','answer-only view switches to question: '+JSON.stringify(s));
 await page.screenshot({path:'mp6.png'});
 await page.keyboard.press('ArrowLeft');await page.waitForTimeout(400);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(800);await page.keyboard.press('2');await page.waitForTimeout(500);
 // case heading -> no bar
 await page.keyboard.press('ArrowLeft');await page.waitForTimeout(800);
 s=await page.evaluate(()=>getComputedStyle(document.querySelector('#mcqBar')).display);ok(s==='none','case heading has no bar');
 await page.click('#setl');await page.waitForTimeout(800);
 s=await page.evaluate(()=>[...document.querySelectorAll('.sr small')].map(x=>x.textContent).join('|'));ok(s.includes('MCQs 1/2 right (50%)'),'library: '+s);
 console.log(errs);await b.close();
 // phone
 ({b,page,errs}=await setup({...devices['iPhone 13'],browserName:undefined,defaultBrowserType:undefined}));
 await page.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
 const [fc2]=await Promise.all([page.waitForEvent('filechooser'),page.evaluate(()=>document.querySelector('#libRestore').click())]);await fc2.setFiles(MCQ);await page.waitForTimeout(4000);await page.evaluate(()=>document.querySelector('[data-b="restore"]').click());await page.waitForTimeout(4000);
 const id2=await page.evaluate(()=>__ppLib.LIB.sets.find(s=>s.type==='mcq').id);
 await page.evaluate(id=>{try{document.querySelector('#libClose').click()}catch(e){}return __ppLib.openSet(id)},id2);await page.waitForTimeout(4000);
 await page.evaluate(()=>__ppLib.openPair?__ppLib.openPair(9):null);
 await page.evaluate(()=>{const r=[...document.querySelectorAll('.row')].find(r=>r.textContent.includes('Case 2 · Q2'));r&&r.click()});await page.waitForTimeout(1500);
 await page.screenshot({path:'mp3.png'});
 s=await page.evaluate(()=>({bar:getComputedStyle(document.querySelector('#mcqBar')).display,cover:getComputedStyle(document.querySelector('#mcqCover')).display,view:document.querySelector('#app').className}));ok(s.bar==='flex'&&s.cover==='none','phone bar '+JSON.stringify(s));
 await page.tap('#mcqBar [data-o="a"]');await page.waitForTimeout(1200);
 s=await page.evaluate(()=>({v:document.querySelector('#app').className.includes('v-a')}));ok(s.v,'phone flips to answer');
 await page.screenshot({path:'mp4.png'});
 console.log(errs);await b.close();
})();
