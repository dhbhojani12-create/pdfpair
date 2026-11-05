const {_electron}=require('playwright');const w=ms=>new Promise(r=>setTimeout(r,ms));let F=0;const ok=(c,m)=>{if(!c)F++;console.log((c?'PASS ':'FAIL ')+m)};
const B='http://127.0.0.1:9401/';
(async()=>{const app=await _electron.launch({executablePath:'/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/el/electron',args:['/home/claude/pdfpair-desktop/app','--no-sandbox','--autoplay-policy=no-user-gesture-required'],env:Object.assign({},process.env,{PP_URL:'http://127.0.0.1:9300/app.html',PP_TEST:'1'})});
const p=await app.firstWindow();const errs=[];p.on('pageerror',e=>errs.push('app: '+e.message));await w(4500);
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});
await app.evaluate(({BrowserWindow})=>{const fs=process.getBuiltinModule('fs');const data=fs.readFileSync('/tmp/claude-0/-home-claude/18f77194-c1b7-561f-938c-23c25eb72d78/scratchpad/am/m2x.pdf');const w=BrowserWindow.getAllWindows()[0];w.webContents.send('pp-file',{name:'AM test.pdf',size:data.length,url:'x',data})});
for(let i=0;i<20;i++){await w(500);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}await p.fill('#dkName','AM test');await p.click('#dkAdd');await w(1500);
const SID=await p.evaluate(()=>__ppLib.LIB.sets.find(x=>x.name==='AM test').id);await p.evaluate(id=>__ppLib.openSet(id),SID);await w(2500);
await p.evaluate(()=>{document.querySelector('#lib').hidden=true;const st=__ppTest.getSt();st.stickers.q.push({n:1,page:5,x:.1,y:.3});st.stickers.a.push({n:1,page:5,x:.1,y:.6});st.names[1]='Ind AS 2 · Illus 1';st.meta[1]={ch:'Ind AS 2 Inventory'};st.next=2;__ppTest.save();__ppTest.renderAll()});
await p.evaluate(id=>__ppDesk.open(id,1),SID);await w(800);
await w(800);
const run=async(re,js)=>app.evaluate(async({webContents},[re,js])=>{const wc=webContents.getAllWebContents().find(x=>new RegExp(re).test(x.getURL()));return wc?wc.executeJavaScript(js,true):'no-wc'},[re,js]);
await p.evaluate(u=>window.ppDesktop.openBrowser(u),B+'v.html');let bw;for(let i=0;i<20&&!bw;i++){await w(500);bw=app.windows().find(x=>x!==p&&/browser\.html/.test(x.url()))}
bw.on('pageerror',e=>errs.push('bar: '+e.message));await w(3500);
ok(await bw.evaluate(()=>!document.querySelector('#readB').hidden&&!!window.TOOLS&&!document.querySelector('#panelB').hidden),'v2 tools shown');
// 📌 link
await run('v\\.html','document.querySelector("video").currentTime=12');await w(500);
await bw.click('#linkB');await w(1200);let s=await p.evaluate(()=>JSON.stringify(__ppTest.getSt().links));ok(/v\.html#t=1[23]/.test(s),'📌 lecture moment linked to the open question: '+s.slice(0,120));
ok(await p.evaluate(()=>!!document.querySelector('.row .wlk')),'question row shows ▶ mark');
// notes panel
await bw.click('#panelB');await w(800);await bw.fill('#nIn','Remember: SA 700 para 9');await bw.click('#nTime');await w(800);
s=await bw.evaluate(()=>document.querySelector('#nList').innerText);ok(/Remember/.test(s)&&/0:1\d/.test(s),'note with time saved: '+s.replace(/\n/g,' ').slice(0,80));
await bw.click('#nList .q');await w(1000);s=await p.evaluate(()=>JSON.stringify(__ppTest.getSt().wnotes));ok(/Remember/.test(s),'note → question');
// playback: speed remembered, then resume after reload
await bw.click('#playB');await w(800);await bw.click('#vsp .chip >> text=1.5×');await w(600);
ok(+(await run('v\\.html','document.querySelector("video").playbackRate'))===1.5,'speed 1.5×');
await bw.mouse.click(5,300);await w(300);
await run('v\\.html','document.querySelector("video").currentTime=60');await w(6500);   // progress saved every 5 s
await bw.evaluate(()=>br.cmd('reload'));await w(7000);
s=await run('v\\.html','[document.querySelector("video").currentTime,document.querySelector("video").playbackRate]');ok(s[0]>30&&s[1]===1.5,'after reload: resumed '+s[0].toFixed(1)+'s at '+s[1]+'×');
// highlight on a text page
await bw.evaluate(u=>br.go(u),B+'t.html');await w(2500);
await run('t\\.html','(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById("p1"));getSelection().removeAllRanges();getSelection().addRange(r);return 1})()');
await bw.click('#hlB');await w(1200);ok(+(await run('t\\.html','CSS.highlights.get("pph")?CSS.highlights.get("pph").size:0'))===1,'🖍 highlight shown on the page');
await bw.evaluate(()=>br.cmd('reload'));await w(3500);ok(+(await run('t\\.html','CSS.highlights.get("pph")?CSS.highlights.get("pph").size:0'))===1,'highlight comes back after reload');
s=await bw.evaluate(()=>document.querySelector('#hList')?document.querySelector('#hList').innerText:'');ok(/Key audit matters/.test(s),'highlight listed in Notes');
// reader + save pdf
await bw.evaluate(u=>br.go(u),B+'r.html');await w(2500);await bw.click('#readB');await w(1500);
s=await run('r\\.html','[!!document.querySelector("#rd"),document.body.innerText.includes("BUY NOW"),document.querySelectorAll("#ct p").length]');ok(s[0]&&!s[1]&&s[2]>=10,'📖 reader mode: clean article '+JSON.stringify(s));
await bw.click('#pdfB');for(let i=0;i<20;i++){await w(500);if(await p.evaluate(()=>!document.querySelector('#dkCard').hidden))break}
s=await p.evaluate(()=>({card:!document.querySelector('#dkCard').hidden,t:document.querySelector('#dkCard .dkt').textContent}));ok(s.card&&/SA 700 explained\.pdf/.test(s.t),'📄 page saved as PDF to PDF Pair: '+s.t);
await p.click('#dkAdd');await w(800);ok(await p.evaluate(()=>__ppLib.LIB.sets.some(x=>x.name==='SA 700 explained')),'PDF added to the library');
// command bar
await bw.click('#kh');await w(1200);await bw.fill('#cq','illus');await w(1500);s=await bw.evaluate(()=>document.querySelector('#cr').innerText);ok(/your questions/i.test(s)&&/Illus 1/.test(s),'⌘ command bar finds your questions');
await bw.screenshot({path:'cmd.png'});
await bw.press('#cq','Escape');await w(300);
// split
await bw.evaluate(u=>br.tab({op:'new',url:u}),B+'t.html');await w(2000);await bw.click('#splitB');await w(1200);
s=await app.evaluate(({BrowserWindow})=>{const b=BrowserWindow.getAllWindows().find(x=>x.contentView.children.length>1);return b?b.contentView.children.map(v=>v.getBounds()):null});ok(s&&s.some(r=>r.x>200&&r.width<900)&&s.some(r=>r.x===0&&r.width<900),'⇆ split view: two pages side by side '+JSON.stringify(s));
await bw.screenshot({path:'split.png'});
await bw.click('#splitB');await w(500);await bw.click('#smenu .mi >> text=Close split view');await w(600);
// focus
await bw.click('#ptabs [data-p="focus"]');await w(600);await bw.click('#fPre .chip >> nth=0');await w(800);
await bw.evaluate(()=>br.go('https://www.instagram.com/'));await w(2500);s=await bw.evaluate(()=>document.querySelector('#u').value);ok(/Blocked during focus/.test(s),'🧘 distracting site blocked: '+s);
ok(await bw.evaluate(()=>!document.querySelector('#focusPill').hidden),'focus timer pill shows');
await p.evaluate(()=>window.ppDesktop.track('Audit',3));await w(300);await bw.click('#ptabs [data-p="notes"]');await w(200);await bw.click('#ptabs [data-p="focus"]');await w(800);
s=await bw.evaluate(()=>document.querySelector('#pbody').innerText);ok(/Audit/.test(s)&&/3m/.test(s),'📊 study time shows Audit 3m');
await bw.screenshot({path:'focus.png'});
await bw.click('#fStop');await w(500);
// courses render with a YouTube-style lecture
await bw.evaluate(async()=>{br.kv.set('courses',[{id:'c1',name:'Audit Revision Marathon',subject:'Audit',items:[{u:'https://www.youtube.com/watch?v=abc123',title:'SA 800 recap'},{u:'https://www.youtube.com/watch?v=def456',title:'CARO recap'}]}]);br.kv.set('pos',{'yt:abc123':{t:1200,d:3600,max:1800},'yt:def456':{t:0,d:1800,max:1800}})});
await bw.evaluate(()=>location.reload());await w(3500);await bw.click('#panelB');await w(300);if(await bw.evaluate(()=>document.querySelector('#panel').hidden))await bw.click('#panelB');await bw.click('#ptabs [data-p="courses"]');await w(1000);
s=await bw.evaluate(()=>document.querySelector('#pbody').innerText);ok(/Audit Revision Marathon/.test(s)&&/67%/.test(s),'🎓 course progress 67%: '+s.replace(/\n/g,' ').slice(0,120));
await bw.screenshot({path:'courses.png'});
console.log('errors',errs);console.log(F?F+' FAILED':'ALL PASSED');await app.close()})().catch(e=>{console.error(e);process.exit(1)});
