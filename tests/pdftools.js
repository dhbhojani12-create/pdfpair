const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});const ctx=await b.newContext({viewport:{width:1300,height:860},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push('console: '+m.text())});
await p.route('https://cdnjs.cloudflare.com/**',r=>{const u=r.request().url();const f=u.includes('qrcode')?'node_modules/qrcode-generator/qrcode.js':u.includes('jszip')?'node_modules/jszip/dist/jszip.min.js':u.includes('pdf-lib')?'node_modules/pdf-lib/dist/pdf-lib.min.js':'node_modules/pdfjs-dist/build/'+(u.endsWith('worker.min.js')?'pdf.worker.min.js':'pdf.min.js');r.fulfill({path:f,contentType:'application/javascript'})});
await p.route('https://fonts.**',r=>r.fulfill({body:'',contentType:'text/css'}));
await p.route('https://raw.githubusercontent.com/**',r=>r.fulfill({status:404,body:'',headers:{'access-control-allow-origin':'*'}}));
const w=ms=>p.waitForTimeout(ms);const D='/tmp/claude-0/ptout/';fs.rmSync(D,{recursive:true,force:true});fs.mkdirSync(D);
const dl=async fn=>{const dp=p.waitForEvent('download',{timeout:30000});await fn();const d=await dp;const f=D+d.suggestedFilename();await d.saveAs(f);return f};
const npages=f=>+execSync('pdfinfo "'+f+'" | grep Pages').toString().split(':')[1];
await p.goto('http://127.0.0.1:9300/app.html');await w(1500);
// a "same" set (one PDF, both sides) like ICAI modules: q1.pdf, 18 pages
await p.evaluate(()=>{document.querySelector('#oSame')&&0});
await p.setInputFiles('#fq','/home/claude/mtp/q1.pdf');await w(300);
const same=await p.evaluate(()=>{const c=document.querySelector('#oSame,[name=same],#same');if(c&&c.type==='checkbox'){c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));return true}return false});
await p.click('#oGo');await w(3000);await p.evaluate(()=>{const l=document.querySelector('#lib');if(l)l.hidden=true});
const info=await p.evaluate(()=>{const cs=__ppLib.LIB.sets.find(x=>x.id===__ppLib.LIB.cur);return {same:cs.same,q:cs.files.q.length,a:cs.files.a.length,np:document.querySelectorAll('#pane-q .page').length}});
console.log('set',JSON.stringify(info),'sameBox',same);
// marks on pages 2, 3, 5 and 18 (q side), plus a note and a highlight on page 5 and a bookmark on page 3
await p.evaluate(()=>{const st=__ppTest.getSt();
  st.stickers.q=[{n:1,page:2,x:.1,y:.2},{n:2,page:3,x:.1,y:.3},{n:3,page:5,x:.2,y:.4},{n:4,page:18,x:.1,y:.5}];
  st.stickers.a=[{n:1,page:10,x:.1,y:.2},{n:2,page:3,x:.5,y:.6}];
  st.hl.q=[{page:5,x1:.1,y1:.5,x2:.6,y2:.5,t:.012,c:0}];st.bm.q=[3,7];st.bmn={'q:7':'Case 2'};
  st.notes=[{id:'nn',side:'q',page:5,x:.5,y:.1,w:.3,txt:'note on 5',sty:'s',c:'k',sz:12}];st.clips=[{id:'c1',side:'q',page:3,x1:.1,y1:.1,x2:.4,y2:.2}];
  st.topics=[{id:'t1',side:'q',page:18,x:.1,y:.2,ch:'X',tp:''}];st.imgs=[{id:'i1',side:'q',page:5,x:.1,y:.1,w:.3,ar:.5},{id:'i2',side:'q',page:3,x:.1,y:.1,w:.3,ar:.5}];__ppTest.save();__ppTest.renderAll()});
// open tools
await p.evaluate(()=>__ppTools.openTools());await w(2500);
let s=await p.evaluate(()=>({open:!document.querySelector('#pt').hidden,cards:document.querySelectorAll('.ptp').length,src:document.querySelector('#ptSrc').selectedOptions[0].textContent,thumbs:document.querySelectorAll('.ptp canvas').length}));
ok(s.open&&s.cards===18&&s.thumbs>4,'tools open with this set\'s pages and thumbnails: '+JSON.stringify(s));
await p.screenshot({path:'pt1.png'});
// delete page 3 (index 2), rotate page 5 right, move page 18 to the front
const card=i=>p.$$('.ptp').then(a=>a[i]);
await (await card(2)).click();await w(100);
await p.click('.ptbar button:has-text("Delete")');await w(300);
ok(await p.evaluate(()=>document.querySelectorAll('.ptp').length)===17,'delete one page');
await (await card(3)).hover();await (await card(3)).$('[data-k="r"]').then(x=>x.click());await w(200);
ok(await p.evaluate(()=>__ppTools.PT.pages[3].pi===5&&__ppTools.PT.pages[3].rot===90),'rotate page 5');
// drag last to first
await p.locator(".ptp").nth(16).dragTo(p.locator(".ptp").nth(0),{targetPosition:{x:10,y:60}});await w(400);
s=await p.evaluate(()=>__ppTools.PT.pages.map(x=>x.pi).join(','));ok(s.startsWith('18,1,2,4,5'),'drag reorders: '+s);
// insert blank after page 1 (select first card)
await (await card(0)).click();await p.click('.ptbar button:has-text("Blank page")');await w(400);
s=await p.evaluate(()=>__ppTools.PT.pages.map(x=>x.blank?'B':x.pi).join(','));ok(s.startsWith('18,B,1,2'),'blank inserted after selected: '+s.slice(0,20));
await p.evaluate(()=>{__ppTools.PT.sel.clear();__ppTools.ptRender()});
// download: original untouched
const f1=await dl(()=>p.click('.ptf button:has-text("Download")'));ok(npages(f1)===18,'download has 18 pages: '+f1);
// replace in this set
await p.click('.ptf button:has-text("Replace")');await w(800);
s=await p.evaluate(()=>document.querySelector('#ptAsk .q').textContent);ok(/5 marks are on pages you removed/.test(s)&&/2 stickers, 1 bookmark, 1 clip card, 1 picture/.test(s),'warns about marks on the deleted page: '+s.slice(0,200));
await p.screenshot({path:'pt2.png'});
await p.click('#ptAsk [data-a="1"]');await w(4000);
s=await p.evaluate(()=>{const L=__ppLib.LIB;const cs=L.sets.find(x=>x.id===L.cur);const st=__ppTest.getSt();return {sets:L.sets.map(x=>x.name),pages:document.querySelectorAll('#pane-q .page').length,
  sq:st.stickers.q.map(x=>x.n+'@'+x.page+':'+x.x+','+x.y).join(' '),sa:st.stickers.a.map(x=>x.n+'@'+x.page).join(' '),hl:st.hl.q[0],bm:st.bm.q.join(','),bmn:st.bmn,note:st.notes[0]&&st.notes[0].page,img:st.imgs.map(x=>x.page+':'+x.x+','+x.y+','+x.w).join(' '),clips:st.clips.length,tp:st.topics[0].page,open:!document.querySelector('#pt').hidden}});
console.log(JSON.stringify(s));
// new order: 1:p18 2:blank 3:p1 4:p2 5:p4 6:p5(rot) 7:p6 8:p7 ... 18:p17
ok(s.pages===18&&!s.open,'set now shows the new PDF');
ok(s.sq.includes('1@4')&&!s.sq.includes('2@')&&s.sq.includes('4@1:'),'stickers follow their pages (deleted one dropped): '+s.sq);
ok(s.sa.includes('1@11')&&!s.sa.includes('2@'),'answer-side marks follow too: '+s.sa);
ok(s.hl.page===6&&s.hl.x1===s.hl.x2&&s.hl.y1!==s.hl.y2,'highlight on rotated page turns with it: '+JSON.stringify(s.hl));
ok(s.bm==='8'&&s.bmn['q:8']==='Case 2','bookmarks move (and names)');
ok(s.note===6&&s.clips===0&&s.tp===1,'note, clip and topic marker follow');ok(s.img.startsWith('6:')&&!s.img.includes(' '),'pictures follow (rotated position), deleted-page one dropped: '+s.img);
ok(s.sets.some(x=>/\(original/.test(x)),'original kept in library: '+s.sets);
// the original set still has the old marks and file
s=await p.evaluate(()=>{const L=__ppLib.LIB;const bk=L.sets.find(x=>/original/.test(x.name));const st=JSON.parse(localStorage.getItem('pp:'+bk.key));return {n:st.stickers.q.length,f:bk.files.q[0].size,cur:L.sets.find(x=>x.id===L.cur).files.q[0].size,id:bk.id}});
ok(s.n===4&&s.f!==s.cur,'backup set has the old marks and old file');
await p.evaluate(id=>__ppLib.openSet(id),s.id);await w(2500);
ok(await p.evaluate(()=>document.querySelectorAll('#pane-q .page').length===18&&__ppTest.getSt().stickers.q.length===4),'the original opens with all its marks');
// split by every 5 pages → zip of 4
await p.evaluate(()=>__ppTools.openTools('split'));await w(1500);
await p.fill('#spN','5');await w(300);s=await p.evaluate(()=>document.querySelectorAll('#spParts > div').length);ok(s===4,'every 5 pages = 4 parts');
await p.click('.ptf button:has-text("Download")');await w(3000);console.log('T',await p.textContent('#toast'),await p.evaluate(()=>document.querySelector('#ptBusy').hidden));const z=await dl(()=>p.click('.ptf button:has-text("Download")'));const zl=execSync('unzip -l "'+z+'"').toString();ok(/part 1 \(p1-5\)\.pdf/.test(zl)&&/part 4 \(p16-18\)\.pdf/.test(zl),'split zip: '+zl.split('\n').filter(x=>/pdf/.test(x)).length+' files');
await p.click('[name=spm][value="r"]');await p.fill('#spR','1-2, 10-');await w(300);
const n0=await p.evaluate(()=>__ppLib.LIB.sets.length);await p.click('.ptf button:has-text("Save to library")');await w(2500);
s=await p.evaluate(()=>__ppLib.LIB.sets.slice(-2).map(x=>x.name));ok(await p.evaluate(()=>__ppLib.LIB.sets.length)===n0+2,'ranges saved as 2 sets: '+s);
// page numbers
await p.click('.ptt button[data-k="num"]');await w(1200);await p.selectOption('#pnFmt','pn');await p.fill('#pnSk','1');await w(800);
await p.screenshot({path:'pt3.png'});
const fn=await dl(()=>p.click('.ptf button:has-text("Download")'));const t2=execSync('pdftotext -f 2 -l 2 "'+fn+'" -').toString();const t1=execSync('pdftotext -f 1 -l 1 "'+fn+'" -').toString();
ok(/Page 1 of 17/.test(t2)&&!/Page \d+ of 17/.test(t1),'page numbers drawn, first page skipped');
// pdf → images
await p.click('.ptt button[data-k="toimg"]');await w(800);await p.fill('#tiP','2-3');await w(200);
const zi=await dl(()=>p.click('.ptf button:has-text("Download")'));ok(/page 2\.png/.test(execSync('unzip -l "'+zi+'"').toString()),'PDF → images zip');
// images → pdf
await p.click('.ptt button[data-k="img"]');await w(500);
execSync('pdftoppm -f 1 -l 1 -r 40 -jpeg /home/claude/mtp/a1.pdf /tmp/claude-0/ptout/im');
await p.evaluate(()=>{const i=document.createElement('input');i.type='file';i.multiple=true;i.id='tim';document.body.append(i)});
await p.setInputFiles('#tim',['/tmp/claude-0/ptout/im-01.jpg','/tmp/claude-0/scan-02.png']);
await p.evaluate(()=>__ppTools.ptTakeImages([...document.querySelector('#tim').files]));await w(1500);
ok(await p.evaluate(()=>document.querySelectorAll('.ptp img').length)===2,'images show as pages');
await p.screenshot({path:'pt4.png'});
const fi=await dl(()=>p.click('.ptf button:has-text("Download")'));ok(npages(fi)===2,'images → 2-page PDF');
// combine: org with a1 added from library
await p.click('.ptt button[data-k="org"]');await w(2000);
const c0=await p.evaluate(()=>document.querySelectorAll('.ptp').length);
await p.setInputFiles('#tim','/home/claude/mtp/a1.pdf');
await p.evaluate(async()=>{const f=document.querySelector('#tim').files[0];const S=await __ppTools.ptLoadPdf(await f.arrayBuffer(),f.name);__ppTools.PT.sel.clear();const PT=__ppTools.PT;const si=PT.srcs.push(S)-1;for(let i=1;i<=S.n;i++)PT.pages.push({s:si,pi:i,rot:0,id:Math.random()+''});__ppTools.ptRender()});await w(800);
const c1=await p.evaluate(()=>document.querySelectorAll('.ptp').length);
const fc=await dl(()=>p.click('.ptf button:has-text("Download")'));ok(npages(fc)===c1&&c1>c0,'combine: '+c0+' + a1 = '+npages(fc));
console.log('errors',errs);await b.close()})();
