const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/a.html'));await w(3000);
const info=()=>app.evaluate(({BrowserWindow,webContents})=>{const b=BrowserWindow.getAllWindows().find(x=>/Browser|a\.html|Opener/.test(x.getTitle()));const wc=webContents.getAllWebContents().find(x=>/a\.html$/.test(x.getURL()));return {fs:b&&b.isFullScreen(),title:b&&b.getTitle()}});
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/a\.html$/.test(x.getURL()));return wc.executeJavaScript('document.documentElement.requestFullscreen().then(()=>1)',true)});await w(1500);
let s=await info();ok(s.fs,'video-style full screen fills the window: '+JSON.stringify(s));
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/a\.html$/.test(x.getURL()));return wc.executeJavaScript('document.exitFullscreen().then(()=>1)',true)});await w(1500);
s=await info();ok(!s.fs,'exit full screen: '+JSON.stringify(s));
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
