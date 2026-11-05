// 📱 mini window: video tab moves into a small always-on-top window; video-only while playing, full page when paused; controls; back to the tab
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/v.html'));await w(4000);
const bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));
ok(await bw.isVisible('#miniB'),'📱 Mini button in the browser toolbar');
await bw.click('#miniB');await w(2500);
const info=()=>app.evaluate(({BrowserWindow,webContents})=>{const m=BrowserWindow.getAllWindows().find(x=>/mini\.html/.test(x.webContents.getURL()));const wc=webContents.getAllWebContents().find(x=>/v\.html$/.test(x.getURL()));
  return {mini:!!m,top:m?m.isAlwaysOnTop():null,b:m?m.getBounds():null,cs:m?m.getContentSize():null,inMini:m?m.contentView.children.length:0}});
let s=await info();ok(s.mini&&s.top&&s.inMini===1,'mini window open, always on top, holds the video tab: '+JSON.stringify(s.b));
const vid=()=>app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/v\.html$/.test(x.getURL()));return wc.executeJavaScript('({p:document.querySelector("video").paused,t:document.querySelector("video").currentTime,r:document.querySelector("video").playbackRate,cls:document.documentElement.className,vw:document.querySelector("video").getBoundingClientRect().width,iw:innerWidth})')});
let v=await vid();ok(!v.p&&/ppminiv/.test(v.cls)&&Math.abs(v.vw-v.iw)<2,'playing: video only, filling the window');
const ratio=(s.cs[1]-34)/s.cs[0];ok(ratio<0.8,'video-only window is short (16:9-ish): '+ratio.toFixed(2));
await w(500);let m=app.windows().find(x=>/mini\.html/.test(x.url()));
await m.click('[data-c="play"]');await w(1800);v=await vid();s=await info();ok(v.p&&!/ppminiv/.test(v.cls)&&(s.cs[1]-34)/s.cs[0]>1.3,'paused: full page, phone-tall window: '+JSON.stringify(s.cs));
await m.click('[data-c="play"]');await w(1800);v=await vid();s=await info();ok(!v.p&&/ppminiv/.test(v.cls),'play again: back to video only');
const t0=v.t;await m.click('[data-c="fwd10"]');await w(600);v=await vid();ok(v.t>t0+9,'10⟳ works');
await m.click('[data-c="rate"]');await w(500);v=await vid();ok(v.r===1.25,'speed 1.25');
await m.click('[data-c="mode"]');await w(1500);s=await info();v=await vid();ok(!/ppminiv/.test(v.cls)&&!v.p,'⌄ shows the full page while it keeps playing');
await m.click('[data-c="mode"]');await w(1500);v=await vid();ok(/ppminiv/.test(v.cls),'⌃ back to video only');
await m.click('[data-c="cap"]');await w(2000);ok(await p.evaluate(()=>__ppFind.CAP.tray.length)===1,'📸 frame lands in PDF Pair tray');
await m.click('[data-c="size"]');await w(800);const s2=await info();ok(s2.cs[0]!==s.cs[0],'⇲ changes size: '+s.cs[0]+'→'+s2.cs[0]);
// phone remote / video bar path uses the mini tab
const st=await p.evaluate(()=>window.ppDesktop.video("(()=>({ok:!!document.querySelector('video')}))()"));ok(st&&st.ok,'PDF Pair controls reach the mini video');
await m.click('[data-c="back"]');await w(1500);s=await info();v=await vid();ok(!s.mini&&!v.p&&!/ppminiv/.test(v.cls),'⤢ back to the tab, still playing');
// Alt+P toggles
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/v\.html$/.test(x.getURL()));wc.focus();wc.sendInputEvent({type:'keyDown',keyCode:'P',modifiers:['alt']})});await w(2500);
s=await info();ok(s.mini,'Alt+P opens the mini window');
m=app.windows().find(x=>/mini\.html/.test(x.url()));await m.click('[data-c="close"]');await w(1500);s=await info();v=await vid();ok(!s.mini&&v.p,'✕ closes, video paused in its tab');
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
