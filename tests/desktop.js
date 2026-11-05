const {_electron}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{
const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const w=ms=>new Promise(r=>setTimeout(r,ms));
const p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,150))});
await w(5000);
ok(await p.evaluate(()=>!!window.ppDesktop),'desktop bridge present');
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});

await p.evaluate(()=>__ppLib.openLib());await w(500);
await p.evaluate(()=>{[...document.querySelectorAll('#subTabs button')].find(b=>b.textContent==='Audit').click()});await w(300);
await p.click('#libView button[data-v="i"]');await w(4000);
let s=await p.evaluate(()=>({rows:document.querySelectorAll('.shr').length,btns:[...document.querySelectorAll('#libFlt button')].map(b=>b.textContent),getall:document.querySelectorAll('.shh .btn').length}));
ok(s.rows===27&&s.btns.some(x=>/Open ICAI/.test(x))&&!s.btns.some(x=>/Watch/.test(x))&&s.getall===4,'desktop shelf: '+JSON.stringify(s));
// direct Get (no browser) of RTP Sep 2025
await p.evaluate(()=>{const r=[...document.querySelectorAll('.shr')].find(x=>/RTP Sep 2025/.test(x.textContent));r.querySelector('.shget').click()});
for(let i=0;i<30;i++){await w(1000);if(await p.evaluate(()=>__ppLib.LIB.sets.some(x=>x.name==='RTP Sep 2025')))break}
s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name+'|'+x.subject+'|'+x.files.q[0].size));ok(s.some(x=>x.startsWith('RTP Sep 2025|Audit|291942')),'⤓ Get downloads straight in: '+s);
// built-in browser: open a PDF link
await p.evaluate(()=>window.ppDesktop.openBrowser('https://boslive.icai.org/education_content_rtp_list.php?c=Final&content_year=May, 2025'));await w(6000);
const ws=app.windows();ok(ws.length>=2,'browser window opened ('+ws.length+' windows)');
const bw=ws.find(x=>x!==p);
await bw.evaluate(()=>br.go('https://resource.cdn.icai.org/84617bos68187-p3.pdf'));
for(let i=0;i<40;i++){await w(1000);if(await p.evaluate(()=>__ppLib.LIB.sets.some(x=>x.name==='RTP May 2025')))break}
s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name));ok(s.includes('RTP May 2025'),'PDF clicked in the browser lands in the library: '+s);
const msg=await bw.evaluate(()=>document.querySelector('#m').textContent);console.log('browser says:',msg);
// a PDF not on the shelf -> card asks subject/name
await bw.evaluate(()=>br.go('https://resource.cdn.icai.org/84556bos68130-final-gp1.pdf'));
for(let i=0;i<60;i++){await w(1000);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}
s=await p.evaluate(()=>({card:!document.querySelector('#dkCard').hidden,t:document.querySelector('#dkCard .dkt').textContent,name:document.querySelector('#dkName').value}));ok(s.card,'other PDF asks where to put it: '+JSON.stringify(s));
await p.screenshot({path:'el1.png'});
await p.fill('#dkName','MTP Group I');await p.click('#dkAdd');await w(800);
s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name+'|'+x.type));ok(s.includes('MTP Group I|mtp')||s.includes('MTP Group I|mod'),'added: '+s);
await bw.screenshot({path:'el2.png'});
console.log('errors',errs.filter(e=>!/firebase|favicon|fonts/i.test(e)));await app.close()})().catch(e=>{console.error(e);process.exit(1)});
