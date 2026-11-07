const {chromium}=require('playwright');const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const p=await (await b.newContext({viewport:{width:1300,height:860}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.goto('http://127.0.0.1:9300/app.html');await p.waitForTimeout(1500);
await p.setInputFiles('#fq','/tmp/claude-0/icai/ch14u1.pdf');await p.click('#oGo');await p.waitForTimeout(3000);await p.evaluate(()=>document.querySelector('#lib').hidden=true);
await p.evaluate(()=>__ppTools.openTools());await p.waitForTimeout(1500);
// fast scroll to the end
for(let i=0;i<20;i++){await p.evaluate(i=>{const b=document.querySelector('#ptBody');b.scrollTop=b.scrollHeight*i/20},i);await p.waitForTimeout(60)}
await p.evaluate(()=>{const b=document.querySelector('#ptBody');b.scrollTop=b.scrollHeight});
const t0=Date.now();let vis;for(let k=0;k<40;k++){await p.waitForTimeout(250);vis=await p.evaluate(()=>{const B=document.querySelector('#ptBody').getBoundingClientRect();const cs=[...document.querySelectorAll('.ptp')].filter(c=>{const r=c.getBoundingClientRect();return r.bottom>B.top&&r.top<B.bottom});return {n:cs.length,done:cs.filter(c=>c.querySelector('.ptr img')).length}});if(vis.n&&vis.done===vis.n)break}
ok(vis.done===vis.n,'pages on screen at the end show within '+((Date.now()-t0)/1000).toFixed(1)+'s: '+JSON.stringify(vis));
// clicking a page (redraws grid) keeps thumbnails instantly
await p.evaluate(()=>{const B=document.querySelector('#ptBody').getBoundingClientRect();const c=[...document.querySelectorAll('.ptp')].reverse().find(c=>c.getBoundingClientRect().top>B.top+10);c.click()});await p.waitForTimeout(150);
vis=await p.evaluate(()=>{const B=document.querySelector('#ptBody').getBoundingClientRect();const cs=[...document.querySelectorAll('.ptp')].filter(c=>{const r=c.getBoundingClientRect();return r.bottom>B.top&&r.top<B.bottom});return {n:cs.length,done:cs.filter(c=>c.querySelector('.ptr img')).length,sel:document.querySelectorAll('.ptp.sel').length}});
ok(vis.sel===1&&vis.done===vis.n,'after selecting, thumbnails stay: '+JSON.stringify(vis));
console.log(errs);await b.close()})();
