const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const B='http://127.0.0.1:9401/';
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(4000);await p.evaluate(u=>window.ppDesktop.openBrowser(u),B+'t.html');let bw;for(let i=0;i<20&&!bw;i++){await w(500);bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()))}
const errs=[];bw.on('pageerror',e=>errs.push(e.message));await w(2500);await bw.evaluate(u=>br.go(u),B+'r.html');await w(2500);await bw.evaluate(u=>br.go(u),B+'a.html');await w(2500);
await bw.click('#panelB');await w(500);await bw.click('#ptabs [data-p="history"]');await w(1200);
let s=await bw.evaluate(()=>document.querySelector('#pbody').innerText);ok(/Today/.test(s)&&/SA 700 explained/.test(s)&&/Text page/.test(s),'history lists today\'s pages: '+s.replace(/\n/g,' | ').slice(0,160));
await bw.fill('#hQ','SA 700');await w(900);s=await bw.evaluate(()=>document.querySelector('#hL').innerText);ok(/SA 700/.test(s)&&!/Text page/.test(s),'search history');
await bw.click('#hL .mi');await w(2000);ok(/r\.html/.test(await bw.evaluate(()=>document.querySelector('#u').value)),'click opens the page');
await bw.keyboard.press('Control+h');await w(500);await bw.screenshot({path:'hist.png'});console.log('errors',errs);await app.close()})().catch(e=>{console.error(e);process.exit(1)});
