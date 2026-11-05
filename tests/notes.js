const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:820},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':u.includes('tesseract')?'node_modules/tesseract.js/dist/tesseract.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:404,body:'',headers:{'access-control-allow-origin':'*'}}));
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1500);
await p.setInputFiles('#fq','/home/claude/mtp/q1.pdf');await p.setInputFiles('#fa','/home/claude/mtp/a1.pdf');await w(300);await p.click('#oGo');await w(3000);
await p.evaluate(()=>{const l=document.querySelector('#lib');if(l)l.hidden=true});
await p.keyboard.press('n');await w(200);
ok(await p.evaluate(()=>document.body.classList.contains('t-note')),'N picks the Note tool');
const pg=await p.$('#pane-q .page');const bb=await pg.boundingBox();
await p.mouse.click(bb.x+bb.width*.3,bb.y+bb.width*.3);await w(400);
ok(await p.evaluate(()=>!!document.querySelector('.nte.ed .nta')&&document.activeElement.classList.contains('nta')),'click makes a note and you can type');
await p.keyboard.type('Remember: Rs. limit is 5 lakh under section 44AB and the long word supercalifragilisticexpialidocious wraps');
await p.keyboard.press('Enter');await p.keyboard.type('₹ second line');
// size up twice, colour red
await p.click('.nbar button[title="Bigger text"]');await p.click('.nbar button[title="Bigger text"]');await p.click('.nbar button[title="Red text"]');await w(200);
let n=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('pp:'+__ppTest.key()));return s.notes&&s.notes[0]});
ok(n&&n.sz===16&&n.c==='r'&&/second line/.test(n.txt),'size A+ twice = 16, red, text saved: '+JSON.stringify(n&&{sz:n.sz,c:n.c}));
ok(await p.evaluate(()=>document.activeElement.classList.contains('nta')),'bar buttons keep typing focus');
const fsz=await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.nte')).fontSize));
await p.click('.nbar button[title="Plain text on the page"]');await w(150);
ok(await p.evaluate(()=>document.querySelector('.nte').classList.contains('p')),'switch to plain text');
await p.click('.nbar button[title="Yellow sticky note"]');
await p.screenshot({path:'nt1.png'});
// click elsewhere finishes without making a new note
await p.mouse.click(bb.x+bb.width*.7,bb.y+bb.width*.9);await w(400);
n=await p.evaluate(()=>({c:document.querySelectorAll('.nte').length,ed:document.querySelectorAll('.nte.ed').length}));
ok(n.c===1&&n.ed===0,'click elsewhere finishes editing, no extra note: '+JSON.stringify(n));
// drag
let r0=await (await p.$('.nte')).boundingBox();
await p.mouse.move(r0.x+20,r0.y+8);await p.mouse.down();await p.mouse.move(r0.x+80,r0.y+108,{steps:6});await p.mouse.up();await w(300);
let r1=await (await p.$('.nte')).boundingBox();ok(Math.abs(r1.x-r0.x-60)<3&&Math.abs(r1.y-r0.y-100)<3,'drag moves the note');
ok(await p.evaluate(()=>!document.querySelector('.nte.ed')),'drag does not open editing');
// resize
await p.hover('.nte');const h=await (await p.$('.nte .nrz')).boundingBox();
await p.mouse.move(h.x+5,h.y+5);await p.mouse.down();await p.mouse.move(h.x+105,h.y+5,{steps:5});await p.mouse.up();await w(300);
let r2=await (await p.$('.nte')).boundingBox();ok(Math.abs(r2.width-r1.width-100)<4,'resize widens: '+r1.width.toFixed(0)+'→'+r2.width.toFixed(0));
// zoom keeps proportions
const ratio0=r2.width/(await pg.boundingBox()).width;
await p.keyboard.press('Control+=');await w(1200);
const pgb=await (await p.$('#pane-q .page')).boundingBox();const r3=await (await p.$('.nte')).boundingBox();
ok(Math.abs(r3.width/pgb.width-ratio0)<.01,'note scales with zoom');
await p.keyboard.press('Control+0');await w(1000);
// undo
const cnt=()=>p.evaluate(()=>(JSON.parse(localStorage.getItem('pp:'+__ppTest.key())).notes||[]).length);
// export
await p.evaluate(()=>window.__ppTest&&0);
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});const dlP=p.waitForEvent('download',{timeout:20000});await p.evaluate(()=>document.querySelector('#bSave').click());await w(400);console.log('exp hidden',await p.evaluate(()=>document.querySelector('#exp').hidden));await p.click('#eGo');await w(3000);console.log('toast',await p.textContent('#toast'));const dl=await dlP;
const fp='/tmp/claude-0/nt.pdf';await dl.saveAs(fp);const txt=execSync('pdftotext -raw -f 1 -l 1 '+fp+' -').toString();
const tx=txt.replace(/\s+/g,' ');ok(/Remember: Rs\. limit/.test(tx)&&/Rs\. second line/.test(tx)&&/supercalifragil/.test(tx),'Save PDF has the note text');
execSync('pdftoppm -f 1 -l 1 -r 60 -png '+fp+' /tmp/claude-0/ntp');
// erase
await p.keyboard.press('e');await p.click('.nte');await w(300);
ok(await cnt()===0,'eraser removes the note');
await p.keyboard.press('Control+z');await w(400);ok(await cnt()===1&&await p.evaluate(()=>document.querySelectorAll('.nte').length===1),'Ctrl+Z brings it back');
// empty note disappears
await p.keyboard.press('n');await p.mouse.click(bb.x+bb.width*.2,bb.y+bb.width*1.0);await w(300);await p.keyboard.press('Escape');await w(400);
ok(await cnt()===1&&await p.evaluate(()=>document.querySelectorAll('.nte').length===1),'empty note is dropped');
// keys while typing do not switch tools
await p.mouse.click(bb.x+bb.width*.2,bb.y+bb.width*1.0);await w(300);await p.keyboard.type('hes');await w(200);
ok(await p.evaluate(()=>document.body.classList.contains('t-note')),'typing h/e/s in a note does not switch tool');
await p.keyboard.press('Escape');await w(300);
// reload persists
await p.reload();await w(3500);ok(await p.evaluate(()=>document.querySelectorAll('.nte').length)===2,'notes come back after reload');
await p.screenshot({path:'nt2.png'});
console.log('errors',errs);await b.close()})();
