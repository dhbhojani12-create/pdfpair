const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:820}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
let gcalls=[];
await p.route('https://generativelanguage.googleapis.com/**',async r=>{const u=r.request().url();
  if(u.includes('/models?'))return r.fulfill({contentType:'application/json',body:JSON.stringify({models:[{name:'models/gemini-2.5-flash',displayName:'Gemini 2.5 Flash',supportedGenerationMethods:['generateContent']},{name:'models/gemini-2.0-flash',displayName:'Gemini 2.0 Flash',supportedGenerationMethods:['generateContent']},{name:'models/text-embedding-004',supportedGenerationMethods:['embedContent']}]})});
  const model=u.match(/models\/([^:]+):/)[1];const body=JSON.parse(r.request().postData());const txt=body.contents[0].parts[0].text;gcalls.push(model);
  if(model==='gemini-2.5-flash'&&gcalls.length>=2)return r.fulfill({status:429,contentType:'application/json',body:JSON.stringify({error:{message:'Resource exhausted'}})});
  // fake: every "Illustration N" line is q, the next "Solution" line is a
  const items=[];let last=null;for(const ln of txt.split('\n')){const m=ln.match(/^\[p(\d+) L(\d+)\] (.*)$/);if(!m)continue;
    const il=m[3].match(/^Illustration (\d+)/);if(il){last='Illustration '+il[1];items.push({t:'q',p:+m[1],l:+m[2],label:last,ch:'Ind AS 2 Inventory'})}
    else if(/^Solution/.test(m[3])&&last){items.push({t:'a',p:+m[1],l:+m[2],label:last,ch:''});last=null}}
  r.fulfill({contentType:'application/json',body:JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({items})}]}}]})})});
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1200);
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#libRestore').click())]);await fc.setFiles(process.argv[2]||'/home/claude/demo/amtest.zip');await w(3000);await p.evaluate(()=>document.querySelector('[data-b="restore"]').click());await w(4000);
await p.evaluate(()=>__ppLib.openSet('amset'));await w(4000);await p.evaluate(()=>{document.querySelector('#lib').hidden=true});await w(300);
// open via More menu
await p.click('#bMore');await w(300);ok(await p.isVisible('#bAuto'),'✨ Auto-mark in ⋯ More');
await p.click('#bAuto');await w(400);ok(await p.isVisible('#amDlg'),'dialog opens');
await p.screenshot({path:'am1.png'});
await p.click('#amGo');
for(let i=0;i<60&&!(await p.isVisible('#amRev'));i++)await w(500);
let s=await p.evaluate(()=>[...document.querySelectorAll('#amList .amrow')].map(r=>r.querySelector('.nm').textContent+' | '+r.querySelector('.ln').textContent+' | '+r.querySelector('select').value));
console.log(s.join('\n'));ok(s.length>=18,'ICAI found '+s.length+' (python: 20)');
await p.evaluate(()=>{document.querySelector('#bA')&&0});await p.keyboard.press('Escape');
await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='A'&&x.offsetParent);b&&b.click()});await w(600);
await p.click('#amList .amrow:nth-child(10) .nm');await w(1500);
{const v=await p.evaluate(()=>{const pg=document.querySelector('#pane-q .page[data-n="22"]')||document.querySelectorAll('.page')[21];const sc=pg.closest('[class*=sc],.sc')||pg.parentElement.parentElement;const r=pg.getBoundingClientRect();return {vis:getComputedStyle(document.querySelector('#pane-q')).display,top:Math.round(r.top),bot:Math.round(r.bottom)}});ok(v.vis!=='none'&&v.top<700&&v.bot>0,'from answer-only view, click shows the question page: '+JSON.stringify(v));}
await p.screenshot({path:'am2.png'});
ok(await p.evaluate(()=>document.querySelectorAll('.amRing').length===2),'preview rings on both sides');
const n0=await p.evaluate(()=>__ppTest.allNums().length);
await p.click('#amApply');await w(800);
s=await p.evaluate(()=>{const st=__ppTest.getSt();return {n:__ppTest.allNums().length,q:st.stickers.q.length,a:st.stickers.a.length,nm:st.names[1],ch:st.meta[1]&&st.meta[1].ch,next:st.next,t:document.querySelector('#toast').textContent}});
ok(s.n>=18&&s.nm,'applied: '+JSON.stringify(s));
await p.click('#bMore');await w(200);await p.click('#bAuto');await w(300);await p.click('#amGo');for(let i=0;i<60&&!(await p.isVisible('#amRev'));i++)await w(500);
{const d=await p.evaluate(()=>({rows:document.querySelectorAll('#amList .amrow').length,off:document.querySelectorAll('#amList .amrow.off').length,dup:[...document.querySelectorAll('#amList .wn')].filter(x=>/already has sticker/.test(x.textContent)).length,btn:document.querySelector('#amApply').textContent}));ok(d.off===d.rows&&d.dup===d.rows,'re-run: all already marked, unticked: '+JSON.stringify(d));}
await p.click('#amDiscard');await w(300);
await p.keyboard.press('Control+z');await w(500);
s=await p.evaluate(()=>__ppTest.allNums().length);ok(s===n0,'one Ctrl+Z removes all: '+s);
// Gemini: list, pause on 429, switch model, resume
await p.click('#bMore');await w(200);await p.click('#bAuto');await w(300);
await p.check('input[name=amM][value=gem]');await p.fill('#amKey','TESTKEY');await p.click('#amRef');await w(500);
s=await p.evaluate(()=>[...document.querySelectorAll('#amModel option')].map(o=>o.value));ok(s.length===2&&s[0]==='models/gemini-2.5-flash','models listed, embeddings dropped: '+s);
await p.evaluate(()=>{window.amFake=t=>t==='wait'?10:null});
await p.click('#amGo');for(let i=0;i<40&&!(await p.evaluate(()=>/Resume/.test(document.querySelector('#amGo').textContent)));i++)await w(300);
s=await p.evaluate(()=>document.querySelector('#amProg .amps').textContent);ok(/Paused/.test(s)&&/gemini-2.5-flash/.test(s)&&/429/.test(s),'pauses with model + reason: '+s);
await p.screenshot({path:'am3.png'});
await p.selectOption('#amModel','models/gemini-2.0-flash');await p.click('#amGo');
for(let i=0;i<60&&!(await p.isVisible('#amRev'));i++)await w(300);
s=await p.evaluate(()=>[...document.querySelectorAll('#amList .amrow')].map(r=>r.querySelector('.nm').textContent+' | '+r.querySelector('.ln').textContent));
console.log(s.join('\n'),gcalls);{const h=await p.evaluate(()=>document.querySelector('#amRev .mph small').textContent);ok(s.length>=2&&/gemini-2.0-flash/.test(h)&&/gemini-2.5-flash/.test(h),'resumed with other model: '+h);}
ok(!(await p.evaluate(()=>localStorage.getItem('pp:prefs')||'')).includes('TESTKEY'),'key not in prefs/backup');
await p.screenshot({path:'am4.png'});
{const m=await p.evaluate(()=>{const L=(p,y)=>({p,y});const f=[{t:'q',label:'Q 3',l:L(3,100)},{t:'q',label:'Q. 4',l:L(3,300)},{t:'a',label:'Answer 3',l:L(19,100)},{t:'a',label:'Ans 4',l:L(20,100)},{t:'q',label:'Illustration 2',l:L(5,10)},{t:'a',label:'Solution to Illustration 2',l:L(5,50)}];return __ppAm.gemMatch(f,false).map(i=>i.base+'>'+(i.a&&i.a.p))});ok(m.join()==='Q 3>19,Q. 4>20,Illustration 2>5','labels match across Q/Answer wording: '+m);}
await p.click('#amDiscard');
console.log('errors',errs);await b.close()})();
