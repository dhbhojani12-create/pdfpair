const {chromium}=require('playwright');const fs=require('fs');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const D=process.env.SHDIR||'/tmp/shelftest/';
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:820}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.route('https://raw.githubusercontent.com/**',r=>{const u=r.request().url();if(u.includes('shelf.json'))r.fulfill({path:'/home/claude/pdfpair-repo/shelf.json',contentType:'text/plain',headers:{'access-control-allow-origin':'*'}});else r.fulfill({status:404,body:'',headers:{'access-control-allow-origin':'*'}})});
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(2500);await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await p.evaluate(()=>__ppLib.openLib());await w(500);
await p.evaluate(()=>{[...document.querySelectorAll('#subTabs button')].find(b=>b.textContent==='Audit').click()});await w(300);
await p.click('#libView button[data-v="i"]');await w(1500);
let s=await p.evaluate(()=>({t:document.querySelector('#libTitle').textContent,rows:document.querySelectorAll('.shr').length,gets:document.querySelectorAll('.shget').length,g:[...document.querySelectorAll('.shh b')].map(x=>x.textContent)}));
ok(s.rows===27&&s.gets===27,'shelf lists Audit: '+JSON.stringify(s));
await p.screenshot({path:'sh1.png'});
// pick downloaded files (one renamed "(1)" by Chrome)
await p.evaluate(()=>{const i=document.createElement('input');i.type='file';i.multiple=true;i.id='tf';document.body.append(i)});
await p.setInputFiles('#tf',[D+'86599bos-aps1177-g1-p3.pdf',D+'87915bos-aps2168-ch9 (1).pdf']);
await p.evaluate(()=>__ppShelf.shelfTake([...document.querySelector('#tf').files]));await w(1200);
s=await p.evaluate(()=>({sets:__ppLib.LIB.sets.map(x=>x.subject+'|'+x.type+'|'+x.name+'|'+x.same),have:document.querySelectorAll('.shr.have').length,t:document.querySelector('#toast').textContent}));
ok(s.sets.includes('Audit|rtp|RTP Sep 2025|true')&&s.sets.includes('Audit|mod|Ch 9 Related Services|true')&&s.have===2,'files filed as sets: '+JSON.stringify(s));
await p.screenshot({path:'sh2.png'});
// again: no duplicates
await p.evaluate(()=>__ppShelf.shelfTake([...document.querySelector('#tf').files]));await w(800);
s=await p.evaluate(()=>({n:__ppLib.LIB.sets.length,t:document.querySelector('#toast').textContent}));ok(s.n===2&&/already/.test(s.t),'no duplicate: '+s.t);
// watched folder: fake handle with a new download
await p.setInputFiles('#tf',[D+'86599bos-aps1177-g1-p3.pdf']);
const buf=fs.readFileSync(D+'87915bos-aps2168-ch9 (1).pdf');
await p.evaluate(()=>{const L=__ppLib.LIB;L.sets=[];});
await p.evaluate(()=>{const f=document.querySelector('#tf').files[0];__ppShelf.SH.dir={name:'Downloads',queryPermission:async()=>'granted',values:async function*(){yield {kind:'file',name:'86599bos-aps1177-g1-p3.pdf',getFile:async()=>f};yield {kind:'file',name:'other.pdf',getFile:async()=>new File(['x'],'other.pdf')}}}});
await w(4500);s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name));ok(s.includes('RTP Sep 2025'),'watched folder picks up the download: '+s);
// open the set from the shelf
await p.evaluate(()=>__ppShelf.renderShelfLib());await w(300);await p.click('.shr.have .lnk');await w(3000);
s=await p.evaluate(()=>({lib:!document.querySelector('#lib').hidden,cur:(__ppLib.LIB.sets.find(x=>x.id===__ppLib.LIB.cur)||{}).name,pages:document.querySelectorAll('#pane-q .page').length}));ok(!s.lib&&s.cur==='RTP Sep 2025'&&s.pages>5,'✓ Open shows the PDF: '+JSON.stringify(s));
console.log('errors',errs);await b.close()})();
