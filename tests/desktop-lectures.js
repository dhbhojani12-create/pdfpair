// ▶ Lectures: from PDF Pair straight into the mini window, browser stays hidden
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push(e.message));await w(3000);await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
ok(await p.isVisible('#bLec'),'▶ Lectures button in PDF Pair');
await p.keyboard.press('Alt+KeyY');await w(800);let s=await p.evaluate(()=>({open:!document.querySelector('#lecPop').hidden,txt:document.querySelector('#lecPop').innerText,focus:document.activeElement.placeholder}));
ok(s.open&&/Open YouTube/.test(s.txt)&&/Search YouTube/.test(s.focus),'Alt+Y opens the list with search focused');
await p.evaluate(()=>{document.querySelector('#lecPop').hidden=true;window.ppDesktop.openMini('http://127.0.0.1:9401/v.html')});await w(4000);
const info=()=>app.evaluate(({BrowserWindow})=>{const all=BrowserWindow.getAllWindows();const m=all.find(x=>/mini\.html/.test(x.webContents.getURL()));const b=all.find(x=>/browser\.html/.test(x.webContents.getURL()));return {mini:!!m,inMini:m?m.contentView.children.length:0,brVisible:b?b.isVisible():null,cs:m?m.getContentSize():null}});
s=await info();ok(s.mini&&s.inMini===1&&s.brVisible===false,'video opens straight in the mini window, browser hidden: '+JSON.stringify(s));
ok((s.cs[1]-34)/s.cs[0]<0.8,'playing → video only');
// second open reuses the mini window
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/t.html'));await w(2500);
s=await info();ok(s.mini&&s.inMini===1,'next lecture opens in the same mini window');
// list shows "continue watching" after something played (pos is written by the browser tools; seed one)
await app.evaluate(({app})=>{const fs=process.getBuiltinModule('fs'),path=process.getBuiltinModule('path');const d=path.join(app.getPath('userData'),'kv');fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,'pos.json'),JSON.stringify({'yt:abc':{u:'https://www.youtube.com/watch?v=abc',t:600,d:2400,title:'Ind AS 115 · Lecture 4',at:Date.now()}}))}).catch(()=>{});
await p.click('#bLec');await w(800);s=await p.evaluate(()=>document.querySelector('#lecPop').innerText);ok(/Continue watching/i.test(s)&&/Lecture 4/.test(s)&&/10:00 of 40:00/.test(s),'Continue watching shows the last lecture with time');
console.log('errors',errs);await app.close()})().catch(e=>{console.error(e);process.exit(1)});
