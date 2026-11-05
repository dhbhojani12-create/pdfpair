// 🎬 phone remote: laptop (desktop app) plays a lecture, the linked phone pauses/skips/changes speed, links the moment, captures the frame, adds a note
// run: xvfb-run -a node tests/desktop-phoneremote.js   (fbmock on :9300, test pages on :9401 incl. v.html + lib/)
const {_electron,chromium,devices}=require('playwright');
const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
const QPDF='/home/claude/mtp/q1.pdf',ROOM='rm'+Date.now().toString(36);
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
let p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push('laptop: '+e.message));await w(3000);
if(!await p.evaluate(()=>!!window.pdfjsLib)){for(const f of ['pdf.min.js','pdf-lib.min.js','jszip.min.js'])await p.addScriptTag({url:'http://127.0.0.1:9401/lib/'+f});await p.evaluate(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='http://127.0.0.1:9401/lib/pdf.worker.min.js'})}
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await app.evaluate(({BrowserWindow},f)=>{const fs=process.getBuiltinModule('fs');const data=fs.readFileSync(f);BrowserWindow.getAllWindows()[0].webContents.send('pp-file',{name:'Remote test.pdf',size:data.length,url:'x',data})},QPDF);
for(let i=0;i<20;i++){await w(500);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}await p.fill('#dkName','Remote test');await p.click('#dkAdd');await w(1500);
await p.evaluate(async()=>{await __ppLib.openSet(__ppLib.LIB.sets.find(x=>x.name==='Remote test').id);for(const s of ['#lib','#open'])if(document.querySelector(s))document.querySelector(s).hidden=true});await w(2000);
await p.evaluate(()=>{const st=__ppTest.getSt();st.stickers.q.push({n:1,page:1,x:.1,y:.3});st.stickers.a.push({n:1,page:2,x:.1,y:.3});st.names[1]='Illus 7';st.next=2;__ppTest.save();__ppTest.renderAll();__ppVid.setActive(1)});
await p.evaluate(room=>{const pr=__ppVid.prefs;pr.syncUrl='http://127.0.0.1:9300';pr.room=room;pr.linkRole='laptop';__ppVid.linkStart()},ROOM);
await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/v.html'));await w(4000);
const vid=()=>app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/v\.html$/.test(x.getURL()));return wc.executeJavaScript('({p:document.querySelector("video").paused,t:document.querySelector("video").currentTime,r:document.querySelector("video").playbackRate})')});
// phone
const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({...devices['Pixel 7']});
await ctx.addInitScript(room=>{if(!sessionStorage.getItem('i')){sessionStorage.setItem('i',1);localStorage.setItem('pp:prefs',JSON.stringify({syncUrl:'http://127.0.0.1:9300',room,linkRole:'phone',linkToolSet:1}))}},ROOM);
const m=await ctx.newPage();m.on('pageerror',e=>errs.push('phone: '+e.message));
await m.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();r.fulfill({path:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/pop/lib/'+u.split('/').pop(),contentType:'application/javascript'})});
await m.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await m.goto('http://127.0.0.1:9300/app.html');await w(2000);
await m.setInputFiles('#fq',QPDF);await w(300);await m.evaluate(()=>document.querySelector('#oGo').click());await w(3000);await m.evaluate(()=>{const l=document.querySelector('#lib');if(l)l.hidden=true});
for(let i=0;i<20;i++){await w(500);if(await m.evaluate(()=>!document.querySelector('#dkVid').hidden))break}
ok(await m.evaluate(()=>!document.querySelector('#dkVid').hidden&&getComputedStyle(document.querySelector('#dkVid')).display!=='none'),'🎬 button appears in the phone pill while the laptop plays a video');
ok(await m.evaluate(()=>document.querySelector('#vidPop').hidden&&document.querySelector('#vidSheet').hidden),'nothing covers the PDF until you tap it');
await m.screenshot({path:'/tmp/claude-0/pr1.png'});
await m.tap('#dkVid');await w(500);ok(await m.evaluate(()=>!document.querySelector('#vidPop').hidden),'tap: controls slide out');
let pb=await m.evaluate(()=>{const a=document.querySelector('#vidPop').getBoundingClientRect(),d=document.querySelector('#dock').getBoundingClientRect();return {popR:a.right,dockL:d.left}});ok(pb.popR<=pb.dockL,'row sits beside the pill, not over it');
await m.screenshot({path:'/tmp/claude-0/pr2.png'});
let v=await vid();ok(!v.p,'video playing on laptop');
await m.tap('#vidPop [data-va="pp"]');await w(2000);v=await vid();ok(v.p,'⏸ on phone pauses the laptop video');
const t0=v.t;await m.tap('#vidPop [data-va="f10"]');await w(2000);v=await vid();ok(v.t>t0+9,'10⟳ skips: '+t0.toFixed(1)+'→'+v.t.toFixed(1));
await m.tap('#vidPop [data-va="rate"]');await w(2000);v=await vid();ok(v.r===1.25,'speed button: '+v.r);
await m.tap('#vidPop [data-va="pp"]');await w(2000);v=await vid();ok(!v.p,'▶ plays again');
await m.tap('#vidPop [data-va="more"]');await w(600);ok(await m.evaluate(()=>!document.querySelector('#vidSheet').hidden),'⌃ opens the full remote');
await w(1500);const lab=await m.evaluate(()=>document.querySelector('#vidSheet [data-va="link"]').textContent);ok(/Illus 7/.test(lab),'link button names the laptop question: '+lab);
await m.screenshot({path:'/tmp/claude-0/pr3.png'});
await m.tap('#vidSheet [data-r="2"]');await w(2000);v=await vid();ok(v.r===2,'speed chip 2×');
await m.tap('#vidSheet [data-va="link"]');await w(2000);
let s=await p.evaluate(()=>{const st=__ppTest.getSt();return {l:((st.links||{})[1]||[]).length,u:((st.links||{})[1]||[])[0]}});ok(s.l===1&&/v\.html/.test(s.u.u)&&s.u.t>0,'📌 link saved on the laptop question: '+JSON.stringify(s.u));
await m.tap('#vidSheet [data-va="cap"]');await w(2500);
s=await p.evaluate(()=>__ppFind.CAP.tray.length);ok(s===1,'📸 frame lands in the laptop tray');
await m.tap('#vidSheet [data-va="note"]');await m.fill('#vidSheet textarea','Revenue: 5-step model');await m.tap('#vidSheet [data-va="nsave"]');await w(2000);
s=await p.evaluate(()=>((__ppTest.getSt().wnotes||{})[1]||[]).map(x=>x.text));ok(s.includes('Revenue: 5-step model'),'🗒 note saved on the laptop question');
await m.tap('#vidSheet [data-va="close"]');await w(300);ok(await m.evaluate(()=>document.querySelector('#vidSheet').hidden),'close');
// tapping the page hides the row
await m.tap('#dkVid');await w(300);await m.tap('#pane-q .page',{position:{x:150,y:300}});await w(300);ok(await m.evaluate(()=>document.querySelector('#vidPop').hidden),'tap on the page tucks it back');
// close the video tab: button goes away
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/v\.html$/.test(x.getURL()));wc.loadURL('http://127.0.0.1:9401/t.html')});
for(let i=0;i<10;i++){await w(800);if(await m.evaluate(()=>document.querySelector('#dkVid').hidden))break}
ok(await m.evaluate(()=>document.querySelector('#dkVid').hidden),'no video: the button disappears');
console.log('errors',errs);await b.close();await app.close()})().catch(e=>{console.error(e);process.exit(1)});
