const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/a.html'));await w(3000);
const bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));
// find the tab's webContents via main
const run=js=>app.evaluate(({webContents},js)=>{const wc=webContents.getAllWebContents().find(x=>/a\.html$/.test(x.getURL()));return wc?wc.executeJavaScript(js):'no tab'},js);
await run("document.getElementById('p').click()");await w(2500);
ok(/got signed-in/.test(await run("document.getElementById('r').textContent")),'popup keeps opener and closes itself: '+await run("document.getElementById('r').textContent"));
await run("document.getElementById('t').click()");await w(600);
let s=await bw.evaluate(()=>document.querySelectorAll('.tab').length);console.log('tabs while open',s);await w(1500);
s=await bw.evaluate(()=>[...document.querySelectorAll('.tab span')].map(x=>x.textContent));ok(s.length===1,'self-closing tab removed, no crash: '+s);
const ua=await run('navigator.userAgent');ok(!/Electron/.test(ua),'normal Chrome user agent: '+ua.slice(-60));
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
