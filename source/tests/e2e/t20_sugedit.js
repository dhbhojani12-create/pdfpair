const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/DT_Ch1.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:60000});
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:180000});
 // go to Illus.1 answer (has 2 parts p45,p46)
 const sid=await p.evaluate(()=>{const s=S.sugg.find(x=>x.label==="Illus. 1");goPage(s.a[0].page);return s.id});await p.waitForTimeout(500);
 const sel='.sug.a[data-sg="'+sid+'"][data-j="0"]';const bb=await p.locator(sel).boundingBox();
 await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(200);
 ok(await p.locator(sel+'.ssel').count()===1,"tapping a suggestion selects it");ok(await p.locator(sel+' .h').count()===8,"resize handles appear");
 const h0=await p.evaluate(id=>S.sugg.find(s=>s.id===id).a[0].h,sid);
 const hs=await p.locator(sel+' .h[data-h="s"]').boundingBox();await p.mouse.move(hs.x+6,hs.y+6);await p.mouse.down();await p.mouse.move(hs.x+6,hs.y-120,{steps:6});await p.mouse.up();await p.waitForTimeout(200);
 const h1=await p.evaluate(id=>S.sugg.find(s=>s.id===id).a[0].h,sid);ok(h1<h0-.05,"dragging the bottom handle shrinks the box ("+h0.toFixed(3)+" → "+h1.toFixed(3)+")");
 const y0=await p.evaluate(id=>S.sugg.find(s=>s.id===id).a[0].y,sid);const b2=await p.locator(sel).boundingBox();await p.mouse.move(b2.x+b2.width/2,b2.y+b2.height/2);await p.mouse.down();await p.mouse.move(b2.x+b2.width/2,b2.y+b2.height/2+40,{steps:5});await p.mouse.up();
 const y1=await p.evaluate(id=>S.sugg.find(s=>s.id===id).a[0].y,sid);ok(y1>y0+.01,"dragging the box moves it");
 const n0=await p.evaluate(id=>S.sugg.find(s=>s.id===id).a.length,sid);await p.click(sel+' [data-sdel]');await p.waitForTimeout(200);
 ok(await p.evaluate(id=>S.sugg.find(s=>s.id===id).a.length,sid)===n0-1,"− removes just that box ("+n0+" → "+(n0-1)+")");
 await p.click('#sbar [data-s=accept]');await p.waitForTimeout(400);
 const acc=await p.evaluate(()=>{const x=S.data.pairs.find(q=>q.label==="Illus. 1");return{n:x.a.length,pg:x.a[0].page,qh:x.q[0].h}});ok(acc.n===n0-1&&acc.pg===46,"edits are kept on Accept ("+JSON.stringify(acc)+")");
 {const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"))}await b.close()})();
