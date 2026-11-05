// 📸 capture in the desktop browser → tray in PDF Pair → click a page to place → drag/resize → Save PDF + full backup
// run: xvfb-run -a node tests/desktop-capture.js  (mock app on :9300, test pages on :9401)
const {_electron}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
const QPDF=process.env.QPDF||'/home/claude/mtp/q1.pdf';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
let p=await app.firstWindow();const errs=[];
p.on('pageerror',e=>errs.push(e.message));await w(3000);
// no internet in the test box: load the CDN libraries from the local test server
if(!await p.evaluate(()=>!!window.pdfjsLib)){for(const f of ['pdf.min.js','pdf-lib.min.js','jszip.min.js'])await p.addScriptTag({url:'http://127.0.0.1:9401/lib/'+f});await p.evaluate(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='http://127.0.0.1:9401/lib/pdf.worker.min.js'})}
// a set with one PDF
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await app.evaluate(({BrowserWindow},f)=>{const fs=process.getBuiltinModule('fs');const data=fs.readFileSync(f);BrowserWindow.getAllWindows()[0].webContents.send('pp-file',{name:'Cap test.pdf',size:data.length,url:'x',data})},QPDF);
for(let i=0;i<20;i++){await w(500);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}await p.fill('#dkName','Cap test');await p.click('#dkAdd');await w(1500);
await p.evaluate(async()=>{await __ppLib.openSet(__ppLib.LIB.sets.find(x=>x.name==='Cap test').id);for(const s of ['#lib','#open'])if(document.querySelector(s))document.querySelector(s).hidden=true});await w(2500);
console.log(await p.evaluate(()=>({pdfjs:!!window.pdfjsLib,lib:!!window.PDFLib,sets:__ppLib.LIB.sets.map(x=>x.name),dk:document.querySelector('#dkCard').hidden,t:document.querySelector('#toast').textContent,pages:document.querySelectorAll('#pane-q .page').length})));ok(await p.evaluate(()=>document.querySelectorAll('#pane-q .page').length)>3,'set open');
// open the browser on the text page
await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/t.html'));await w(3500);
const bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));
ok(!!bw&&await bw.isVisible('#capB'),'📸 Capture button in the browser toolbar');
await bw.click('#capB');await w(1200);
let s=await bw.evaluate(()=>({ov:!document.querySelector('#capOv').hidden,img:document.querySelector('#capOv img').naturalWidth}));
ok(s.ov&&s.img>200,'page frozen for selecting: '+JSON.stringify(s));
await bw.screenshot({path:'/tmp/claude-0/cap1.png'});
// drag a box over the first paragraph
const r=await bw.evaluate(()=>{const b=document.querySelector('#capOv').getBoundingClientRect();return {x:b.left,y:b.top}});
await bw.mouse.move(r.x+5,r.y+5);await bw.mouse.down();await bw.mouse.move(r.x+400,r.y+80,{steps:5});await bw.screenshot({path:'/tmp/claude-0/cap2.png'});await bw.mouse.up();await w(1500);
ok(await bw.evaluate(()=>document.querySelector('#capOv').hidden),'overlay closes after the box');
s=await p.evaluate(()=>({tray:!document.querySelector('#capTray').hidden,n:document.querySelectorAll('.capi').length,armed:document.body.classList.contains('t-place'),cap:__ppFind.CAP.tray[0]}));
ok(s.tray&&s.n===1&&s.armed&&s.cap.w>300&&s.cap.h>60,'capture lands in PDF Pair tray, ready to place: '+JSON.stringify(s.cap&&{w:s.cap.w,h:s.cap.h}));
// Alt+S from the page itself, then Esc cancels
await bw.evaluate(()=>0);
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/t\.html$/.test(x.getURL()));wc.focus();wc.sendInputEvent({type:'keyDown',keyCode:'S',modifiers:['alt']})});await w(1500);
ok(await bw.evaluate(()=>!document.querySelector('#capOv').hidden),'Alt+S on the page starts a capture');
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/browser\.html/.test(x.getURL()));wc.sendInputEvent({type:'keyDown',keyCode:'Escape'})});await w(800);
ok(await bw.evaluate(()=>document.querySelector('#capOv').hidden),'Esc cancels');
// place on page 1
await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows().find(x=>/PDF Pair$/.test(x.getTitle())||!/Browser/.test(x.getTitle())).focus()});
const pg=await p.$('#pane-q .page');const bb=await pg.boundingBox();
await p.mouse.click(bb.x+bb.width*.1,bb.y+bb.width*.2);await w(1200);
s=await p.evaluate(()=>{const st=__ppTest.getSt();return {n:(st.imgs||[]).length,m:st.imgs&&st.imgs[0],el:document.querySelectorAll('.cim').length,src:document.querySelector('.cim img')&&document.querySelector('.cim img').src.slice(0,5),armed:document.body.classList.contains('t-place')}});
ok(s.n===1&&s.el===1&&s.src==='blob:'&&!s.armed,'click on a page places it: '+JSON.stringify(s.m));
await p.screenshot({path:'/tmp/claude-0/cap3.png'});
// drag and resize
let b0=await (await p.$('.cim')).boundingBox();
await p.mouse.move(b0.x+b0.width/2,b0.y+b0.height/2);await p.mouse.down();await p.mouse.move(b0.x+b0.width/2+50,b0.y+b0.height/2+120,{steps:5});await p.mouse.up();await w(300);
let b1=await (await p.$('.cim')).boundingBox();ok(Math.abs(b1.x-b0.x-50)<3&&Math.abs(b1.y-b0.y-120)<3,'drag moves it');
await p.hover('.cim');const h=await (await p.$('.cim .nrz')).boundingBox();await p.mouse.move(h.x+5,h.y+5);await p.mouse.down();await p.mouse.move(h.x-60,h.y+5,{steps:4});await p.mouse.up();await w(300);
let b2=await (await p.$('.cim')).boundingBox();ok(b2.width<b1.width-50&&Math.abs(b2.height/b2.width-b1.height/b1.width)<.02,'corner resizes and keeps its shape');
// Save PDF has an image on page 1
await p.evaluate(()=>{window.__dl=null;const o=URL.createObjectURL;});
const fp='/tmp/claude-0/cap.pdf';
await app.evaluate(({session},fp)=>{session.defaultSession.once('will-download',(e,item)=>{item.setSavePath(fp)})},fp);
await p.evaluate(()=>document.querySelector('#bSave').click());await w(500);await p.click('#eGo');await w(4000);
const imgs=execSync('pdfimages -list -f 1 -l 1 '+fp+' | tail -n +3 | wc -l').toString().trim();ok(+imgs>=1,'Save PDF includes the picture ('+imgs+' image on page 1)');
// full backup carries the picture
const fz='/tmp/claude-0/cap.zip';await app.evaluate(({session},fz)=>{session.defaultSession.once('will-download',(e,item)=>{item.setSavePath(fz)})},fz);
await p.evaluate(()=>__ppTest.bkAction('full'));await w(4000);
const zl=execSync('unzip -l '+fz).toString();ok(/imgs\/[a-z0-9]+\.png/.test(zl),'backup with PDFs has the picture');
// eraser removes, Ctrl+Z restores
await p.keyboard.press('e');await p.click('.cim');await w(300);ok(await p.evaluate(()=>(__ppTest.getSt().imgs||[]).length)===0,'eraser removes it');
await p.keyboard.press('Control+z');await w(500);ok(await p.evaluate(()=>document.querySelectorAll('.cim').length)===1,'Ctrl+Z brings it back');
console.log('errors',errs);await app.close()})().catch(e=>{console.error(e);process.exit(1)});
