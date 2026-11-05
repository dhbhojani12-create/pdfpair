// 📱 mini window v2: a lecture shows ONLY the video (playing or paused), controls inside it on hover; pages to pick from use the phone layout
const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const EL=process.env.EL||'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron';
(async()=>{const app=await _electron.launch({executablePath:EL,args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
const info=()=>app.evaluate(({BrowserWindow})=>{const m=BrowserWindow.getAllWindows().find(x=>/mini\.html/.test(x.webContents.getURL()));if(!m)return {mini:false};const v=m.contentView.children[0];return {mini:true,top:m.isAlwaysOnTop(),cs:m.getContentSize(),vb:v?v.getBounds():null}});
const pg=js=>app.evaluate(({webContents},js)=>{const wc=webContents.getAllWebContents().find(x=>/9401\/(v|prev|t)\.html/.test(x.getURL()));return wc?wc.executeJavaScript(js):null},js);
// 1) lecture straight from ▶ Lectures
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/v.html'));await w(5000);
let s=await info();ok(s.mini&&s.top,'mini window open, always on top');
ok(s.vb&&s.vb.y===0&&s.vb.height===s.cs[1],'video fills the whole window (no bar, no page): '+JSON.stringify(s.vb)+' '+JSON.stringify(s.cs));
ok(s.cs[1]/s.cs[0]<0.7,'window has the video shape: '+s.cs);
let v=await pg("({p:document.querySelector('video').paused,ov:!!document.getElementById('ppmov'),vis:getComputedStyle(document.querySelector('p')||document.body).visibility,vw:document.querySelector('video').getBoundingClientRect().width,iw:innerWidth})");
ok(!v.p&&v.ov&&Math.abs(v.vw-v.iw)<2,'playing, controls layer present, video full width');
// 2) pause by clicking the video: still video only, same size
const s0=s.cs;await pg("document.getElementById('ppmov').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:100,clientY:100}))");await w(2500);
v=await pg("({p:document.querySelector('video').paused,paused:document.getElementById('ppmov').classList.contains('paused')})");s=await info();
ok(v.p&&v.paused&&s.cs[0]===s0[0]&&s.cs[1]===s0[1]&&s.vb.y===0,'click pauses: big ▶, still only the video, same size');
await pg("document.getElementById('ppmov').dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:100,clientY:100}))");await w(800);v=await pg("document.querySelector('video').paused");ok(v===false,'click again plays');
// 3) hover controls
v=await pg("(()=>{const o=document.getElementById('ppmov');o.dispatchEvent(new MouseEvent('mousemove',{bubbles:true}));return o.classList.contains('on')})()");ok(v,'controls fade in on hover');
const t0=await pg("document.querySelector('video').currentTime");await pg("document.querySelector('#ppmov [data-k=f10]').click()");await w(400);ok(await pg("document.querySelector('video').currentTime")>t0+9,'10⟳');
await pg("document.querySelector('#ppmov [data-k=rate]').click()");ok(await pg("document.querySelector('video').playbackRate")===1.25,'speed');
const m0=await pg("document.querySelector('video').muted");await pg("document.querySelector('#ppmov [data-k=mute]').click()");ok(await pg("document.querySelector('video').muted")===!m0,'🔊 mute toggles');
await pg("(()=>{const o=document.getElementById('ppmov');o.dispatchEvent(new MouseEvent('mousemove',{bubbles:true}));return 1})()");await w(300);
await app.evaluate(async({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/9401\/v\.html/.test(x.getURL()));const img=await wc.capturePage();process.getBuiltinModule('fs').writeFileSync('/tmp/claude-0/mini-hover.png',img.toPNG())});
await w(2600);ok(await pg("!document.getElementById('ppmov').classList.contains('on')"),'controls fade out again');
// 4) 📸 from inside the video
await pg("document.querySelector('#ppmov [data-k=cap]').click()");await w(2500);ok(await p.evaluate(()=>__ppFind.CAP.tray.length)===1,'📸 frame to PDF Pair tray');
// 5) size, steady
await pg("document.querySelector('#ppmov [data-k=size]').click()");await w(1000);const a1=(await info()).cs;await w(3000);const a2=(await info()).cs;ok(a1[0]!==s0[0]&&a1[0]===a2[0]&&a1[1]===a2[1],'⇲ size changes and stays: '+s0+' → '+a1);
// 6) a page to pick from: phone-size page with a slim bar, steady while previews play
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/prev.html'));await w(4000);
s=await info();ok(s.vb.y===34&&s.cs[1]/s.cs[0]>1.5,'page: phone-tall window with a slim bar: '+s.cs);
const seen=new Set();for(let i=0;i<8;i++){seen.add(JSON.stringify((await info()).cs));await w(500)}ok(seen.size===1,'steady while previews play');
// 7) back to a lecture → video only again; ⤢ back to the browser
await p.evaluate(()=>window.ppDesktop.openMini('http://127.0.0.1:9401/v.html'));await w(5000);s=await info();ok(s.vb.y===0&&s.cs[1]/s.cs[0]<0.7,'next lecture: video only again');
await pg("document.querySelector('#ppmov [data-k=back]').click()");await w(2000);s=await info();v=await pg("({p:document.querySelector('video').paused,ov:!!document.getElementById('ppmov'),c:document.documentElement.className})");
ok(!s.mini&&!v.p&&!v.ov&&!/ppminiv/.test(v.c),'⤢ back to the browser tab, still playing, page normal again');
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
