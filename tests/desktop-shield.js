const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const fs=require('fs');
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(2500);await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/a.html'));
const bw=await (async()=>{for(let i=0;i<20;i++){await w(500);const x=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()));if(x)return x}})();
let info;for(let i=0;i<120;i++){await w(1000);info=await bw.evaluate(()=>br.ad.info());if(info.ready)break}
console.log('info',JSON.stringify(info));ok(info.lists.ads&&info.lists.bad>1000,'lists loaded');
const ud=await app.evaluate(({app})=>app.getPath('userData'));console.log('userData',ud,fs.readdirSync(ud).filter(x=>/bin|txt/.test(x)));
await bw.evaluate(()=>br.go('http://127.0.0.1:9401/ad.html'));await w(4000);
info=await bw.evaluate(()=>br.ad.info());ok(info.blocked>=2,'ads blocked on page: '+info.blocked);
const hid=await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/ad\.html/.test(x.getURL()));return wc.executeJavaScript('getComputedStyle(document.querySelector(".adsbygoogle")).display')});console.log('ad box display (cosmetic hiding not verified):',hid);
const sh=await bw.evaluate(()=>document.querySelector('#shield').textContent);console.log('shield shows',sh);
// allow site
await bw.click('#shield');await w(500);await bw.screenshot({path:'ad1.png'});await bw.click('#admenu .mi >> nth=0');await w(3000);
info=await bw.evaluate(()=>br.ad.info());ok(info.siteOff&&info.blocked===0,'allow ads on this site: '+JSON.stringify(info));
await bw.evaluate(()=>br.ad.set({site:'127.0.0.1',off:false}));await w(3000);info=await bw.evaluate(()=>br.ad.info());ok(!info.siteOff&&info.blocked>=2,'block again: '+info.blocked);
// phishing
const bad=fs.readFileSync(ud+'/badhosts.txt','utf8').split('\n').map(l=>(l.match(/^0\.0\.0\.0\s+([a-z0-9.-]+)/i)||[])[1]).filter(Boolean)[50];console.log('bad host',bad);
await bw.evaluate(u=>br.go(u),'https://'+bad+'/login');await w(3000);
const tabUrl=await bw.evaluate(()=>document.querySelector('#u').value);ok(/warn\.html|Dangerous/.test(tabUrl),'dangerous site shows the warning page: '+tabUrl.slice(0,80));
const wt=await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/warn\.html/.test(x.getURL()));return wc.executeJavaScript('document.body.innerText')});ok(/Dangerous site blocked/.test(wt)&&new RegExp(bad.replace(/\./g,'\\.')).test(wt),'warning text: '+wt.slice(0,60).replace(/\n/g,' '));
ok(/⚠ Dangerous site blocked: /.test(await bw.evaluate(()=>document.querySelector('#u').value)),'address bar says blocked');
await app.evaluate(({webContents})=>{const wc=webContents.getAllWebContents().find(x=>/warn\.html/.test(x.getURL()));return wc.executeJavaScript('document.getElementById("c").click()',true)});await w(3000);
const u2=await app.evaluate(({webContents})=>webContents.getAllWebContents().map(x=>x.getURL()).filter(u=>/0qwk|login/.test(u)||true).join(' | '));ok(new RegExp(bad).test(u2)&&!/warn\.html/.test(u2),'continue anyway opens it: '+u2.slice(0,160));
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
