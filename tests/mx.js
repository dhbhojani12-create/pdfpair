const {chromium}=require('playwright');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const p=await (await b.newContext({viewport:{width:1400,height:860}})).newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
const w=ms=>p.waitForTimeout(ms);
await p.goto('http://127.0.0.1:9300/app.html');await w(1200);
await p.evaluate(()=>{const o=document.querySelector('#open');if(o)o.hidden=true});const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.evaluate(()=>document.querySelector('#libRestore').click())]);await fc.setFiles('/home/claude/demo/demo.zip');await w(6000);await p.evaluate(()=>document.querySelector('[data-b="restore"]').click());await w(6000);await p.evaluate(()=>{document.querySelector('#lib').hidden=true});
const openSet=async n=>{const id=await p.evaluate(n=>__ppLib.LIB.sets.find(s=>s.name===n).id,n);await p.evaluate(id=>__ppLib.openSet(id),id);await w(2500)};
const conKey=await p.evaluate(()=>'pp:'+__ppLib.LIB.sets.find(s=>s.name==='FR Concept Note').key);
const CS=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),conKey);
const rect=async(pane,pg)=>{await p.evaluate(([pane,pg])=>{const e=document.querySelector('#pane-'+pane+' .page[data-n="'+pg+'"]');document.querySelector('#pane-'+pane+' .sc').scrollTop=e.offsetTop},[pane,pg]);await w(900);return p.evaluate(([pane,pg])=>{const e=document.querySelector('#pane-'+pane+' .page[data-n="'+pg+'"]').getBoundingClientRect();return {x:e.x,y:e.y,w:e.width}},[pane,pg])};
const tool=async t=>{await p.evaluate(t=>{const P=JSON.parse(localStorage.getItem('pp:prefs'));},t);await p.evaluate(()=>{});await p.keyboard.press({hl:'h',star:'k',topic:'t',clip:'x',erase:'e'}[t]);await w(150);const on=await p.evaluate(t=>document.body.classList.contains('t-'+t),t);if(!on){await p.keyboard.press({hl:'h',star:'k',topic:'t',clip:'x',erase:'e'}[t]);await w(150)}};
const off=async()=>{await p.evaluate(()=>{for(const c of [...document.body.classList])if(c.startsWith('t-'))document.querySelector('[data-t="'+c.slice(2)+'"]').click()});await w(150)};
const drag=async(r,fx1,fy1,fx2,fy2)=>{await p.mouse.move(r.x+fx1*r.w,r.y+fy1*r.w);await p.mouse.down();await p.mouse.move(r.x+fx2*r.w,r.y+fy2*r.w,{steps:10});await p.mouse.up();await w(500)};
const click=async(r,fx,fy)=>{await p.mouse.click(r.x+fx*r.w,r.y+fy*r.w);await w(500)};
const counts=async(where)=>{if(where==='c'){const s=await CS();return {hl:(s.hl.q||[]).length,star:(s.stars.q||[]).length,topic:(s.topics||[]).length,clip:(s.clips||[]).length,bm:(s.bm.q||[]).length}}
  return p.evaluate(sd=>{const s=__ppTest.getSt();return {hl:s.hl[sd].length,star:(s.stars[sd]||[]).length,topic:(s.topics||[]).filter(t=>(t.side||'q')===sd).length,clip:(s.clips||[]).filter(c=>c.side===sd).length,bm:s.bm[sd].length}},where)};
async function run(label,where,pane,pg){
  const r=await rect(pane,pg);const base=await counts(where);
  await tool('hl');await drag(r,.2,.25,.6,.25);let c=await counts(where);ok(c.hl===base.hl+1,label+': highlight');
  await p.keyboard.press('Control+z');await w(400);c=await counts(where);ok(c.hl===base.hl,label+': undo highlight');
  await tool('star');await click(r,.85,.3);c=await counts(where);ok(c.star===base.star+1,label+': star');
  await tool('topic');await click(r,.08,.35);let tg=await p.evaluate(()=>!document.querySelector('#tagPop').hidden);
  if(tg){await p.fill('#tgTp','Test topic '+label);await p.click('#tgSave');await w(400)}c=await counts(where);ok(tg&&c.topic===base.topic+1,label+': concept marker + topic box');
  await tool('clip');await drag(r,.15,.45,.8,.6);tg=await p.evaluate(()=>({o:!document.querySelector('#tagPop').hidden,tp:document.querySelector('#tgTp').value}));
  if(tg.o){await p.click('#tgSave');await w(400)}c=await counts(where);ok(tg.o&&c.clip===base.clip+1,label+': clip + topic box (suggested "'+tg.tp+'")');
  await tool('erase');await click(r,.5,.52);c=await counts(where);ok(c.clip===base.clip,label+': eraser removes the card');
  await p.keyboard.press('Control+z');await w(400);c=await counts(where);ok(c.clip===base.clip+1,label+': undo brings the card back');
  await off();
}
await openSet('FR RTP');await p.keyboard.press('2');await w(500);
await run('Q pane','q','q',20);await run('A pane','a','a',31);
await openSet('FR QB V4');await p.keyboard.press('2');await w(500);
await p.evaluate(()=>[...document.querySelectorAll('.row')].find(r=>r.dataset.n==='4').click());await w(1500);await p.click('#bCon');await w(3000);
await run('Concept pane','c','c',9);
// bookmark from the concept pane
const b0=(await counts('c')).bm;await p.click('#conBm');await w(400);const b1=(await counts('c')).bm;ok(b1===b0+1,'Concept pane: 🔖 bookmarks the concept page');
await p.click('#bmcnt');await w(300);ok(await p.evaluate(()=>[...document.querySelectorAll('#list .row')].some(r=>r.textContent.includes('📖'))),'it shows in the Bookmarks tab');
await p.click('#conClose');await w(300);
await openSet('FR Concept Note');await w(500);await run('Concept book set','q','q',10);
console.log(errs);await b.close()})();
