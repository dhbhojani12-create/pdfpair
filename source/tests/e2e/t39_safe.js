const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/Ind_AS_7.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});
 const n=await p.evaluate(()=>S.sugg.length);await p.evaluate(()=>{S.sugg[0].a=[];refreshAll()});await p.waitForTimeout(600);
 // simulate shutting the laptop: reload without Accept
 await p.reload();await p.waitForSelector("#libMain .pcard",{timeout:60000}).catch(()=>{});await p.waitForTimeout(800);
 if(await p.evaluate(()=>S.view!=="work")){await p.evaluate(()=>{const d=L.docs[0];return openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})})}
 await p.waitForSelector("#sbar:not([hidden])",{timeout:30000});ok(await p.evaluate(()=>S.sugg.length)===n,"unaccepted suggestions survive a reload: "+n);
 ok(await p.evaluate(()=>S.sugg[0].a.length===0),"with your edits kept");
 await p.click('#sbar [data-s=accept]');await p.waitForTimeout(800);ok(await p.evaluate(async()=>!(await DB.get("kv","sg:"+S.doc.key))),"after Accept the kept copy is removed");
 const n2=await p.evaluate(()=>S.data.pairs.length);
 await p.reload();await p.waitForTimeout(1500);if(await p.evaluate(()=>S.view!=="work"))await p.evaluate(()=>{const d=L.docs[0];return openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})});
 await p.waitForTimeout(800);ok(await p.evaluate(()=>S.data.pairs.length)===n2&&await p.evaluate(()=>!(S.sugg||[]).length),"accepted pairs saved after reload: "+n2);
 // switching paper right after a change keeps both papers right
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/C3.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");await p.waitForTimeout(500);
 const k7=await p.evaluate(()=>L.docs.find(d=>/Ind_AS_7/.test(d.name)).key);
 await p.evaluate(k=>{const d=L.docs.find(x=>x.key===k);return openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})},k7);await p.waitForTimeout(400);
 await p.evaluate(()=>{S.data.pairs[0].star=true;save();const d=L.docs.find(x=>/C3/.test(x.name));openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})});await p.waitForTimeout(2500);
 const rec=await p.evaluate(async k=>{const r=await DB.get("marks",k);return{n:r.data.pairs.length,star:r.data.pairs[0].star}},k7);ok(rec.n===n2&&rec.star,"quick switch: first paper kept its "+rec.n+" questions and the change");
 // big drop → earlier copy can be brought back
 await p.evaluate(k=>{const d=L.docs.find(x=>x.key===k);return openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})},k7);await p.waitForTimeout(400);
 await p.evaluate(()=>{S.data.pairs.splice(0,5);save()});await p.waitForTimeout(800);await p.evaluate(()=>showLibrary());await p.waitForTimeout(800);
 ok(await p.evaluate(k=>L.prevKeys&&L.prevKeys.has(k),k7),"earlier copy kept after losing 5 questions");
 await p.locator('.pcard[data-key="'+k7+'"] [data-act=menu]').click();await p.waitForSelector('#menu [data-m=prev]');ok(true,"menu offers Bring back earlier marks");
 await p.click('#menu [data-m=prev]');await p.waitForSelector("#gFoot .primary");ok(/Bring back/.test(await p.textContent("#gFoot .primary")),"dialog: "+await p.textContent("#gFoot .primary"));
 await p.click("#gFoot .primary");await p.waitForTimeout(1000);ok(await p.evaluate(async k=>(await DB.get("marks",k)).data.pairs.length,k7)===n2,"brought back all "+n2);
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await b.close()})();
