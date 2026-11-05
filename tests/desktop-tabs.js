const {_electron}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const w=ms=>new Promise(r=>setTimeout(r,ms));
const launch=()=>_electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
(async()=>{
let app=await launch();let p=await app.firstWindow();await w(3000);
// pretend the old browser bar saved bookmarks (file:// storage)
await app.evaluate(async({BrowserWindow,app})=>{const x=new BrowserWindow({show:false});await x.loadFile(app.getAppPath()+'/offline.html');await x.webContents.executeJavaScript(`localStorage.setItem('bm',JSON.stringify({folders:[{name:'Audit',items:[{t:'Old one',u:'https://boslive.icai.org/'}]},{name:'DT',items:[]}]}))`);x.destroy()});
await p.evaluate(()=>window.ppDesktop.openBrowser('https://boslive.icai.org/'));await w(6000);
let bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));ok(!!bw,'toolbar loaded (fallback to local): '+(bw&&bw.url()));
let s=await bw.evaluate(()=>({bar:[...document.querySelectorAll('.bb')].map(b=>b.textContent),f:[...document.querySelectorAll('.fb')].map(b=>b.textContent),tabs:document.querySelectorAll('.tab').length}));
ok(s.f.join()==='📁 Audit ▾,📁 DT ▾'&&s.bar.join()==='Claude,RTPs by subject'&&s.tabs===1,'old bookmarks kept + Claude/RTP on bar: '+JSON.stringify(s));
// bookmark on bar
await bw.click('#star');await w(300);await bw.fill('#dn','BOS');await bw.selectOption('#ds','__bar__');await bw.click('#dok');await w(300);
s=await bw.evaluate(()=>[...document.querySelectorAll('.bb')].map(b=>b.textContent).join());ok(/BOS/.test(s)&&/Claude/.test(s),'bookmark on the bar: '+s);
// new folder via dialog
await bw.click('#star');await w(200);await bw.selectOption('#ds','__new__');await bw.fill('#dsn','IDT');await bw.click('#dok');await w(300);
s=await bw.evaluate(()=>({f:[...document.querySelectorAll('.fb')].map(b=>b.textContent).join(),bar:[...document.querySelectorAll('.bb')].map(b=>b.textContent).join()}));ok(/IDT/.test(s.f)&&!/BOS/.test(s.bar),'moved into new folder: '+JSON.stringify(s));
// tabs
await bw.click('#nt');await w(1500);await bw.fill('#g','ESG assurance');await bw.press('#g','Enter');await w(3000);
s=await bw.evaluate(()=>({n:document.querySelectorAll('.tab').length,on:document.querySelector('.tab.on span').textContent,u:document.querySelector('#u').value}));ok(s.n===3&&/google/.test(s.u),'tabs: '+JSON.stringify(s));
await bw.click('.tab >> nth=0');await w(800);s=await bw.evaluate(()=>document.querySelector('#u').value);ok(/boslive/.test(s),'switch tab: '+s);
await bw.click('.tab.on button');await w(800);s=await bw.evaluate(()=>document.querySelectorAll('.tab').length);ok(s===2,'close tab: '+s);
// PDF download still works in a tab
await bw.evaluate(()=>br.go('https://resource.cdn.icai.org/88981bos-aps2822-p3.pdf'));
for(let i=0;i<40;i++){await w(1000);if(await p.evaluate(()=>__ppLib.LIB.sets.some(x=>x.name==='RTP Jan 2026')))break}
s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name+'|'+x.subject));ok(s.includes('RTP Jan 2026|Audit'),'download from tab filed: '+s);
// DT RTP -> new subject
await bw.evaluate(()=>br.go('https://resource.cdn.icai.org/88982bos-aps2822-p4.pdf'));
for(let i=0;i<40;i++){await w(1000);if(await p.evaluate(()=>__ppLib.LIB.sets.some(x=>x.subject==='DT')))break}
s=await p.evaluate(()=>__ppLib.LIB.sets.map(x=>x.name+'|'+x.subject));ok(s.some(x=>/\|DT$/.test(x)),'DT RTP makes DT subject: '+s);
await bw.screenshot({path:'el5.png'});
await app.close();
// bookmarks survive restart
app=await launch();p=await app.firstWindow();await w(3000);await p.evaluate(()=>window.ppDesktop.openBrowser());await w(5000);
bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));s=await bw.evaluate(()=>[...document.querySelectorAll('.fb')].map(b=>b.textContent).join());ok(/IDT/.test(s),'bookmarks after restart: '+s);
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
