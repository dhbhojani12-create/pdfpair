// 📌 in the 🎬 bar: links the popped-out lecture moment to the open question, or to the page when no question is picked
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push(e.message));await w(3000);
if(!await p.evaluate(()=>!!window.pdfjsLib)){for(const f of ['pdf.min.js','pdf-lib.min.js','jszip.min.js'])await p.addScriptTag({url:'http://127.0.0.1:9401/lib/'+f});await p.evaluate(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='http://127.0.0.1:9401/lib/pdf.worker.min.js'})}
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await app.evaluate(({BrowserWindow})=>{const fs=process.getBuiltinModule('fs');const data=fs.readFileSync('/home/claude/mtp/q1.pdf');BrowserWindow.getAllWindows()[0].webContents.send('pp-file',{name:'Link test.pdf',size:data.length,url:'x',data})});
for(let i=0;i<20;i++){await w(500);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}await p.fill('#dkName','Link test');await p.click('#dkAdd');await w(1500);
await p.evaluate(async()=>{await __ppLib.openSet(__ppLib.LIB.sets.find(x=>x.name==='Link test').id);for(const s of ['#lib','#open'])if(document.querySelector(s))document.querySelector(s).hidden=true});await w(2000);
await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/v.html'));await w(4000);
const bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));await bw.click('#app');await w(2500);
ok(await p.evaluate(()=>!document.querySelector('#vidBar').hidden&&!!document.querySelector('#vidBar [data-v="link"]')),'🎬 bar shows with 📌');
// no question picked: links to the page
await p.click('#vidBar [data-v="link"]');await w(800);
let s=await p.evaluate(()=>({pl:__ppTest.getSt().pglinks,chips:document.querySelectorAll('.plk').length,t:document.querySelector('#toast').textContent}));
ok(s.chips===1&&/page 1/.test(s.t)&&JSON.stringify(s.pl).includes('v.html'),'no question: linked to the page, ▶ chip on it: '+s.t);
// with a question picked
await p.evaluate(()=>{const st=__ppTest.getSt();st.stickers.q.push({n:1,page:1,x:.1,y:.3});st.next=2;__ppTest.save();__ppTest.renderAll();__ppVid&&0});
await p.evaluate(()=>{document.querySelector('#pane-q .stk').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:10,clientY:10}))}).catch(()=>{});
await p.click('#pane-q .stk').catch(()=>{});await w(500);
await p.click('#vidBar [data-v="link"]');await w(800);
s=await p.evaluate(()=>({l:((__ppTest.getSt().links||{})[1]||[]).length,t:document.querySelector('#toast').textContent}));
ok(s.l===1,'question picked: linked to the question: '+s.t);
console.log('errors',errs);await app.close()})().catch(e=>{console.error(e);process.exit(1)});
