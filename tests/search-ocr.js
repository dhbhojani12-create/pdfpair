const {chromium}=require('playwright');const fs=require('fs');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:820}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
const jsd=[];
await p.route('https://cdn.jsdelivr.net/**',r=>{const u=r.request().url();jsd.push(u.split('/npm/')[1]);let f=null;
  if(u.includes('tesseract.js@5.1.1/dist/'))f='node_modules/tesseract.js/dist/'+u.split('/').pop();
  else if(u.includes('tesseract.js-core@5.1.1'))f='node_modules/tesseract.js-core/'+u.split('/').pop();
  else if(u.includes('@tesseract.js-data/eng@1.0.0/4.0.0_best_int'))f='node_modules/@tesseract.js-data/eng/4.0.0_best_int/'+u.split('/').pop();
  if(f&&fs.existsSync(f))r.fulfill({path:f,headers:{'access-control-allow-origin':'*'},contentType:f.endsWith('.wasm')?'application/wasm':f.endsWith('.js')?'application/javascript':'application/octet-stream'});else r.fulfill({status:404,body:'nf',headers:{'access-control-allow-origin':'*'}})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:404,body:'',headers:{'access-control-allow-origin':'*'}}));
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1500);
// set 1: q1/a1 ; set 2: scanned only
await p.setInputFiles('#fq','/home/claude/mtp/q1.pdf');await p.setInputFiles('#fa','/home/claude/mtp/a1.pdf');await w(300);await p.click('#oGo');await w(3000);
await p.evaluate(()=>{const l=document.querySelector('#lib');if(l)l.hidden=true});
// a note to be found
await p.evaluate(()=>{const st=__ppTest.getSt();st.notes=[{id:'n1',side:'a',page:3,x:.1,y:.2,w:.3,txt:'Check deferred tax note here',sty:'s',c:'k',sz:12}];__ppTest.save();__ppTest.renderAll()});
await p.keyboard.press('Control+f');await w(200);
ok(await p.evaluate(()=>!document.querySelector('#fbar').hidden&&document.activeElement.id==='fxQ'),'Ctrl+F opens search');
await p.keyboard.type('trust');await w(2500);
let s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,rows:document.querySelectorAll('.fxr').length,hit:document.querySelectorAll('.fhit.cur').length,all:document.querySelectorAll('.fhit').length}));
ok(s.rows>3&&s.hit>=1,'finds "trust" and marks it on the page: '+JSON.stringify(s));
await p.screenshot({path:'fx1.png'});
const pos1=await p.evaluate(()=>document.querySelector('#pane-q .sc').scrollTop);
await p.keyboard.press('Enter');await p.keyboard.press('Enter');await p.keyboard.press('Enter');await p.keyboard.press('Enter');await w(800);
s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,cur:document.querySelector('.fxr.cur')&&document.querySelector('.fxr.cur .w').textContent}));
ok(/^5 of/.test(s.n),'Enter steps to next result: '+JSON.stringify(s));
// note search
await p.fill('#fxQ','deferred tax note');await w(1500);
s=await p.evaluate(()=>[...document.querySelectorAll('.fxr .w')].map(x=>x.textContent));ok(s.some(x=>x.startsWith('📝')),'notes are found: '+s.slice(0,3));
await p.click('.fxr');await w(600);ok(await p.evaluate(()=>document.querySelector('.nte[data-id="n1"]').classList.contains('flash')),'clicking a note result jumps to it');
// phrase across spaces/line breaks
await p.fill('#fxQ','Companies   Act');await w(1500);s=await p.evaluate(()=>document.querySelector('#fxN').textContent);ok(/found|of/.test(s)&&!/No/.test(s),'multi-word search: '+s);
// add scanned set
await p.keyboard.press('Escape');await w(200);ok(await p.evaluate(()=>document.querySelector('#fbar').hidden&&!document.querySelector('.fhit')),'Esc closes and clears marks');
await p.evaluate(()=>__ppLib.openLib&&0);
await p.evaluate(()=>{__ppFind.showSetDialog('add')});await w(300);
await p.setInputFiles('#fq','/tmp/claude-0/scan.pdf');await w(300);await p.click('#oGo');await w(3000);
await p.evaluate(()=>{const l=document.querySelector('#lib');if(l)l.hidden=true});
await p.keyboard.press('Control+f');await p.fill('#fxQ','discount');await w(2500);
s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,info:document.querySelector('#fxInfo').textContent}));
ok(/No matches/.test(s.n)&&/2 pages have no text/.test(s.info),'scanned PDF: offers OCR: '+JSON.stringify(s));
await p.click('#fxInfo .btn');
for(let i=0;i<120;i++){await w(1000);if(await p.evaluate(()=>!__ppFind.FX.ocrBusy))break}
await w(1500);
s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,cur:document.querySelectorAll('.fhit.cur').length,w:document.querySelector('.fxr .w')&&document.querySelector('.fxr .w').textContent,t:document.querySelector('#toast').textContent}));
ok(/found|of/.test(s.n)&&s.cur>=1&&/🔍/.test(s.w||''),'after OCR the scanned page is searchable and marked: '+JSON.stringify(s));
await p.screenshot({path:'fx2.png'});
console.log('jsdelivr asked for:',[...new Set(jsd)].join(', '));
// library scope
await p.click('.fsc button[data-s="lib"]');await w(4000);
s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,g:[...document.querySelectorAll('.fxg')].map(x=>x.textContent)}));
ok(s.g.length>=2,'Library search shows both sets (OCR text too): '+JSON.stringify(s));
// click a result in the other set opens it
await p.fill('#fxQ','Board of Directors');await w(3000);
const row=await p.$$('.fxr');ok(row.length>0,'library hit for phrase in q1: '+row.length);
await row[0].click();await w(4000);
s=await p.evaluate(()=>({cur:(__ppLib.LIB.sets.find(x=>x.id===__ppLib.LIB.cur)||{}).name,hit:document.querySelectorAll('.fhit.cur').length}));
ok(s.cur==='q1'&&s.hit>=1,'clicking opens that set at the match: '+JSON.stringify(s));
await p.screenshot({path:'fx3.png'});
// cached text after reload: no re-read
await p.reload();await w(3000);await p.keyboard.press('Control+f');await p.click('.fsc button[data-s="lib"]');await p.fill('#fxQ','discount');await w(2500);
s=await p.evaluate(()=>({n:document.querySelector('#fxN').textContent,info:document.querySelector('#fxInfo').textContent}));ok(/found/.test(s.n),'OCR text kept after reload: '+JSON.stringify(s));
console.log('errors',errs);await b.close()})();
