// Back up with PDFs in the desktop app: a zip with every PDF reaches disk
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
const FILES=(process.env.FILES||'/home/claude/mtp/q1.pdf,/home/claude/mtp/a1.pdf,/tmp/claude-0/icai/ch14u1.pdf').split(',');
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});await w(3000);
if(!await p.evaluate(()=>!!window.JSZip)){for(const f of ['pdf.min.js','pdf-lib.min.js','jszip.min.js'])await p.addScriptTag({url:'http://127.0.0.1:9401/lib/'+f});await p.evaluate(()=>{pdfjsLib.GlobalWorkerOptions.workerSrc='http://127.0.0.1:9401/lib/pdf.worker.min.js'})}
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
for(const f of FILES){await app.evaluate(({BrowserWindow},f)=>{const fs=process.getBuiltinModule('fs');const data=fs.readFileSync(f);BrowserWindow.getAllWindows()[0].webContents.send('pp-file',{name:f.split('/').pop(),size:data.length,url:'x',data})},f);
  for(let i=0;i<20;i++){await w(400);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}await p.evaluate(()=>document.querySelector('#dkAdd').click());await w(1200)}
const n=await p.evaluate(()=>__ppLib.LIB.sets.length);ok(n===FILES.length,'library has '+n+' sets');
const run=async(partMB,tag)=>{
  await app.evaluate(({session},tag)=>{global.__dls=[];session.defaultSession.removeAllListeners('will-download');session.defaultSession.on('will-download',(e,item)=>{const p='/tmp/claude-0/'+tag+'-'+item.getFilename().replace(/\s+/g,'_');item.setSavePath(p);const r={p,st:'started'};global.__dls.push(r);item.once('done',(ev,st)=>{r.st=st})})},tag);
  await p.evaluate(mb=>{window.__bkPartMB=mb},partMB);
  const toasts=[];const tt=setInterval(async()=>{try{const t=await p.evaluate(()=>document.querySelector('#toast').textContent);if(toasts[toasts.length-1]!==t)toasts.push(t)}catch(e){}},250);
  await p.evaluate(()=>__ppTest.bkAction('full'));await w(2000);clearInterval(tt);
  const d=await app.evaluate(()=>global.__dls);return {d,toasts}};
let r=await run(300,'one');console.log('toasts:',r.toasts.slice(-2).join(' | '));
ok(r.d.length===1&&r.d[0].st==='completed','normal library: one zip saved');
let list=require('child_process').execSync('unzip -l "'+r.d[0].p+'"').toString();ok((list.match(/blobs\/.*\.pdf/g)||[]).length===FILES.length&&/pdfpair\.json/.test(list),'zip has every PDF and the marks');
r=await run(1,'parts');console.log('toasts:',r.toasts.slice(-1).join(' | '));
ok(r.d.length>=2&&r.d.every(x=>x.st==='completed'),'big library: '+r.d.length+' parts saved');
let np=0;for(const x of r.d){const l=require('child_process').execSync('unzip -l "'+x.p+'"').toString();np+=(l.match(/blobs\/.*\.pdf/g)||[]).length;if(!/pdfpair\.json/.test(l))np=-99}
ok(np===FILES.length,"every PDF is in exactly one part, each part has the marks: "+np);
console.log('errors',errs);await app.close()})().catch(e=>{console.error(e);process.exit(1)});
