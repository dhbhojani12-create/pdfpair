// a results page with small hover previews must not make the mini window jump
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/prev.html'));await w(3000);
const sz=()=>app.evaluate(({BrowserWindow})=>{const m=BrowserWindow.getAllWindows().find(x=>/mini\.html/.test(x.webContents.getURL()));return m?m.getBounds():null});
const seen=new Set();for(let i=0;i<12;i++){const b=await sz();seen.add(JSON.stringify(b));await w(500)}
ok(seen.size===1,'stays the same size while previews play/pause: '+[...seen].join(' | '));
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/v.html'));await w(5000);const b=await sz();ok(b&&b.height<b.width,'a real lecture still goes video-only: '+JSON.stringify(b));
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
