const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:820},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1200);
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#libRestore').click())]);await fc.setFiles('/home/claude/demo/demo.zip');await w(6000);await p.evaluate(()=>document.querySelector('[data-b="restore"]').click());await w(6000);await p.evaluate(()=>{document.querySelector('#lib').hidden=true});
const openSet=async n=>{const id=await p.evaluate(n=>__ppLib.LIB.sets.find(s=>s.name===n).id,n);await p.evaluate(id=>__ppLib.openSet(id),id);await w(2500)};
await openSet('FR RTP');await p.keyboard.press('1');await w(500);
await p.evaluate(()=>[...document.querySelectorAll('.row')].find(r=>r.dataset.n==='4').click());await w(2000);
ok(await p.isVisible('[data-t="clip"]'),'✂ Clip tool in toolbar');
await p.keyboard.press('x');await w(200);
const pr=await p.evaluate(()=>{const e=document.querySelector('#pane-q .page[data-n="20"]').getBoundingClientRect();return {x:e.x,y:e.y,w:e.width}});
await p.mouse.move(pr.x+0.23*pr.w,pr.y+0.525*pr.w);await p.mouse.down();await p.mouse.move(pr.x+0.86*pr.w,pr.y+0.625*pr.w,{steps:12});await p.mouse.up();await w(700);await p.click('#tgSave');await w(300);
let s=await p.evaluate(()=>({clips:__ppTest.getSt().clips,toast:document.querySelector('#toast').textContent,outl:document.querySelectorAll('#pane-q .clp').length}));
ok(s.clips.length===1&&s.clips[0].tp==='Breach of Loan Terms'&&s.outl===1,'card from the RTP table, tagged from its question: '+s.toast);
await p.screenshot({path:'dk1.png'});
await p.keyboard.press('x');await w(200);
// amendment on sticker 4
const sb=await p.evaluate(()=>{const e=document.querySelector('#pane-q .stk[data-n="4"]').getBoundingClientRect();return {x:e.x+e.width/2,y:e.y+e.height/2}});
await p.mouse.click(sb.x,sb.y,{button:'right'});await w(500);
ok(await p.isVisible('#tgAmd'),'tag popup shows the amendment tick');
await p.check('#tgAmd');await p.click('#tgSave');await w(500);
s=await p.evaluate(()=>({m:__ppTest.getSt().meta[4],cls:document.querySelector('#pane-q .stk[data-n="4"]').className,row:document.querySelector('.row[data-n="4"] .amdb')!==null}));
ok(s.m.amd&&/amd/.test(s.cls)&&s.row&&s.m.ch,'⚠ on sticker and index, tags kept: '+JSON.stringify(s));
// concept book card
await openSet('FR Concept Note');await w(500);
await p.keyboard.press('x');await w(200);
const pc=await p.evaluate(()=>{const e=document.querySelector('#pane-q .page[data-n="6"]').getBoundingClientRect();return {x:e.x,y:e.y,w:e.width}});
await p.evaluate(y=>{document.querySelector('#pane-q .sc').scrollTop=document.querySelector('#pane-q .page[data-n="6"]').offsetTop+0.4*y},pc.w);await w(1200);
const pc2=await p.evaluate(()=>{const e=document.querySelector('#pane-q .page[data-n="6"]').getBoundingClientRect();return {x:e.x,y:e.y,w:e.width}});
await p.mouse.move(pc2.x+0.15*pc2.w,pc2.y+0.45*pc2.w);await p.mouse.down();await p.mouse.move(pc2.x+0.92*pc2.w,pc2.y+0.78*pc2.w,{steps:10});await p.mouse.up();await w(600);await p.click('#tgSave');await w(300);
s=await p.evaluate(()=>__ppTest.getSt().clips);ok(s&&s.length===1&&s[0].tp==='Cancellation','concept book card tagged by topic above: '+JSON.stringify(s&&s.map(c=>c.tp)));
await p.keyboard.press('x');
// deck
await p.evaluate(()=>__ppLib.openLib());await w(600);
const amdChip=await p.evaluate(()=>!![...document.querySelectorAll('#lib .fc')].find(b=>b.textContent==='⚠ Amendments'));ok(amdChip,'library has ⚠ Amendments filter');
await p.evaluate(()=>document.querySelector('#libView [data-v="d"]').click());await w(4000);
s=await p.evaluate(()=>({cards:document.querySelectorAll('.dcard').length,imgs:document.querySelectorAll('.dcard img').length,amd:document.querySelectorAll('.damd').length,chs:[...document.querySelectorAll('#libBody .cch b')].map(b=>b.textContent),btn:document.querySelector('#rvAll').textContent}));
ok(s.cards===2&&s.imgs===2&&s.amd===1,'deck shows 2 cards with pictures + 1 amended question: '+JSON.stringify(s));
await p.screenshot({path:'dk2.png'});
const dlp=p.waitForEvent('download',{timeout:60000});await p.click('#rvAll');const dl=await dlp;await dl.saveAs('deck.pdf');
ok(true,'deck PDF saved');
// card edit
await p.click('.dcard .ed');await w(200);await p.fill('.dtag input:nth-child(2)','Covenants');await p.click('.dtag button');await w(800);
s=await p.evaluate(()=>[...document.querySelectorAll('#libBody .dtp')].map(x=>x.textContent));ok(s.includes('Covenants'),'card topic edited: '+JSON.stringify(s));
console.log(errs);await b.close()})();
