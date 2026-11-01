const {chromium,devices}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});
for(const dev of ['laptop','phone']){
const ctx=await b.newContext(dev==='laptop'?{viewport:{width:1300,height:820}}:{...devices['Pixel 7']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1200);
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#libRestore').click())]);await fc.setFiles('/home/claude/demo/demo.zip');await w(6000);await p.evaluate(()=>document.querySelector('[data-b="restore"]').click());await w(6000);await p.evaluate(()=>{document.querySelector('#lib').hidden=true});
const id=await p.evaluate(()=>__ppLib.LIB.sets.find(s=>s.type==='mcq').id);await p.evaluate(id=>__ppLib.openSet(id),id);await w(3000);
const btn=dev==='laptop'?'#bQuiz':'#phQuiz';
ok(await p.evaluate(b=>!document.querySelector(b).hidden,btn),dev+' Quiz button on the MCQ set');
await p.evaluate(b=>document.querySelector(b).click(),btn);await w(1200);
ok(await p.isVisible('#qzLoad'),dev+' asks to load the quiz file once');
const [fc2]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#qzLoad').click())]);await fc2.setFiles('/home/claude/quiz/q.html');await w(4000);
let s=await p.evaluate(()=>({toast:document.querySelector('#toast').textContent,qs:document.querySelectorAll('.qzq').length,opts:document.querySelectorAll('.qzo').length,score:document.querySelector('#qzScore').textContent,a:getComputedStyle(document.querySelector('#pane-a')).display,qp:getComputedStyle(document.querySelector('#pane-q')).display}));
ok(/277 linked/.test(s.toast)&&!/Corrected/.test(s.toast)&&s.qs>=4&&s.a==='none'&&s.qp!=='none',dev+' loaded and linked: '+JSON.stringify(s));
if(dev==='laptop')await p.screenshot({path:'qz1.png'});else await p.screenshot({path:'qz3.png'});
// answer Q1 of case 1 wrongly (key d)
await p.evaluate(()=>{const q=document.querySelectorAll('.qzq')[0];[...q.querySelectorAll('.qzo')].find(b=>b.textContent.startsWith('(a)')).click()});await w(800);
s=await p.evaluate(()=>{const q=document.querySelectorAll('.qzq')[0];return {no:!!q.querySelector('.qzo.no'),ok:q.querySelector('.qzo.ok').textContent.slice(0,3),exp:q.querySelector('.qze').textContent.slice(0,40),mans:__ppTest.getSt().mans,rev:__ppTest.getSt().rev,score:document.querySelector('#qzScore').textContent}});
const n0=Object.keys(s.mans).find(k=>s.mans[k].c==='a');
ok(s.no&&s.ok==='(d)'&&/Not quite/.test(s.exp)&&n0&&s.rev[n0]==='again',dev+' wrong pick: shows answer, saved like PDF view: '+JSON.stringify({exp:s.exp,score:s.score,rev:s.rev[n0]}));
// star
await p.evaluate(()=>document.querySelectorAll('.qzq')[1].querySelector('.qst').click());await w(400);
s=await p.evaluate(()=>({st:document.querySelectorAll('.qzq')[1].querySelector('.qst').textContent,stars:__ppTest.getSt().stars.q.length,score:document.querySelector('#qzScore').textContent}));ok(/★ Important/.test(s.st)&&s.stars>=1&&/★ 1/.test(s.score),dev+' star saved as an app star: '+JSON.stringify(s));
// next case and important-only
await p.evaluate(()=>document.querySelector('#qzNext').click());await w(800);
s=await p.evaluate(()=>document.querySelector('#qzSel').selectedOptions[0].textContent);ok(s==='Case Scenario 2',dev+' next case: '+s);
await p.evaluate(()=>document.querySelector('#qzImp').click());await w(800);
s=await p.evaluate(()=>({c:document.querySelector('#qzSel').selectedOptions[0].textContent,n:document.querySelectorAll('.qzq').length}));ok(s.n===0||s.c==='Case Scenario 2',dev+' important only: '+JSON.stringify(s));
await p.evaluate(()=>document.querySelector('#qzPrev').click());await w(800);
s=await p.evaluate(()=>({c:document.querySelector('#qzSel').selectedOptions[0].textContent,n:document.querySelectorAll('.qzq').length}));ok(s.c==='Case Scenario 1'&&s.n===1,dev+' important only goes to the starred case: '+JSON.stringify(s));
await p.evaluate(()=>document.querySelector('#qzImp').click());await w(300);
// reset case
await p.evaluate(()=>document.querySelector('#qzReset').click());await w(500);
s=await p.evaluate(()=>({ans:document.querySelectorAll('.qzo.no,.qzo.ok').length,rev:Object.values(__ppTest.getSt().rev||{}).filter(v=>v==='again').length}));ok(s.ans===0&&s.rev>=1,dev+' reset case clears answers, keeps ↻: '+JSON.stringify(s));
// close back to pdf view
await p.evaluate(()=>document.querySelector('#qzClose').click());await w(800);
s=await p.evaluate(()=>({quiz:document.querySelector('#app').classList.contains('quiz')}));ok(!s.quiz,dev+' back to PDF view');
// reopen keeps data (no reload prompt)
await p.evaluate(b=>document.querySelector(b).click(),btn);await w(1200);ok(!(await p.isVisible('#qzLoad'))&&await p.evaluate(()=>document.querySelectorAll('.qzq').length>0),dev+' quiz text remembered');
if(dev==='laptop'){await p.evaluate(()=>document.querySelectorAll('.qzq')[0].querySelector('.stem').click());await w(1000);await p.screenshot({path:'qz2.png'})}
console.log(errs);await ctx.close()}
await b.close()})();
