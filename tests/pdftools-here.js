const {chromium}=require('playwright');const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const p=await (await b.newContext({viewport:{width:1300,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto('http://127.0.0.1:9300/app.html');await p.waitForTimeout(1500);
await p.setInputFiles('#fq','/tmp/claude-0/icai/ch14u1.pdf');await p.click('#oGo');await p.waitForTimeout(3000);await p.evaluate(()=>document.querySelector('#lib').hidden=true);
// go to page 60
await p.evaluate(()=>{const pg=document.querySelector('#pane-q .page[data-n="60"]');const sc=document.querySelector('#pane-q .sc');sc.scrollTop=pg.offsetTop+20});await p.waitForTimeout(800);
await p.evaluate(()=>__ppTools.openTools());await p.waitForTimeout(2000);
let s=await p.evaluate(()=>{const sel=document.querySelector('.ptp.sel');const B=document.querySelector('#ptBody').getBoundingClientRect();const r=sel&&sel.getBoundingClientRect();return {n:sel&&sel.querySelector('.ptl b').textContent,vis:r&&r.top>B.top&&r.bottom<B.bottom}});
ok(s.n==='60'&&s.vis,'opens at the page you were on, selected: '+JSON.stringify(s));
await p.screenshot({path:'/tmp/claude-0/here1.png'});
s=await p.evaluate(()=>{const bar=document.querySelector('.ptbar').getBoundingClientRect(),B=document.querySelector('#ptBody').getBoundingClientRect();return Math.abs(bar.top-B.top)<2});ok(s,'tool buttons stay at the top while scrolled');
await p.click('.ptbar button:has-text("Blank page")');await p.waitForTimeout(800);
s=await p.evaluate(()=>__ppTools.PT.pages.slice(58,62).map(x=>x.blank?'B':x.pi).join(','));ok(s==='59,60,B,61','blank page goes right after page 60: '+s);
s=await p.evaluate(()=>{const bar=document.querySelector('.ptbar').getBoundingClientRect(),B=document.querySelector('#ptBody').getBoundingClientRect();return {sticky:Math.abs(bar.top-B.top)<2,st:document.querySelector('#ptBody').scrollTop}});ok(s.sticky&&s.st>1000,'still at the same place after adding: '+JSON.stringify(s));
console.log(errs);await b.close()})();
