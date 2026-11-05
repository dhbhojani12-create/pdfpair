const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);const fs=require('fs'),os=require('os'),path=require('path');
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();await w(3000);const dl=await app.evaluate(({app})=>app.getPath('downloads'));try{fs.rmSync(path.join(dl,'notes.zip'))}catch(e){}
await p.evaluate(()=>window.ppDesktop.openBrowser('http://127.0.0.1:9401/notes.zip'));await w(4000);
ok(fs.existsSync(path.join(dl,'notes.zip')),'zip saved to Downloads: '+dl);
const n=await p.evaluate(()=>__ppLib.LIB.sets.length);ok(n===0,'not added to library');
await app.close()})().catch(e=>{console.error(e);process.exit(1)});
