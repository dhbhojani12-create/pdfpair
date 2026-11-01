const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.evaluate(()=>{BK.rc=3;renderBankSlides()});await p.waitForTimeout(400);
 // open the PDF from Revise, come back, mark LDR, then "close the laptop"
 await p.click(".rvq2pdf");await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:60000});await p.waitForTimeout(600);await p.click("#backBtn");await p.waitForTimeout(1200);
 const it=await p.evaluate(()=>{const x=BK.list[BK.rc];return{key:x.key,pid:x.p.id,ldr:!!x.p.ldr,star:!!x.p.star}});
 await p.click('#bkMain [data-act="ldr"]');await p.waitForTimeout(500);
 await p.evaluate(()=>flushSave());await p.evaluate(()=>{document.dispatchEvent(new Event("visibilitychange"));dispatchEvent(new Event("pagehide"))});await p.waitForTimeout(500);
 const saved=await p.evaluate(async o=>{const r=await DB.get("marks",o.key);return !!r.data.pairs.find(x=>x.id===o.pid).ldr},it);ok(saved===!it.ldr,"LDR kept after closing ("+saved+")");
 await p.reload();await p.waitForTimeout(2500);const after=await p.evaluate(async o=>{const r=await DB.get("marks",o.key);return !!r.data.pairs.find(x=>x.id===o.pid).ldr},it);ok(after===!it.ldr,"LDR still there after reopening");
 // edits in the PDF are still saved
 await p.evaluate(async o=>{const d=L.docs.find(x=>x.key===o.key);await openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})},it);await p.waitForTimeout(500);
 await p.evaluate(o=>{const pr=S.data.pairs.find(x=>x.id===o.pid);pr.star=!pr.star;save()},it);await p.evaluate(()=>flushSave());await p.waitForTimeout(400);
 ok(await p.evaluate(async o=>{const r=await DB.get("marks",o.key);const x=r.data.pairs.find(x=>x.id===o.pid);return x.star===!o.star&&!!x.ldr===!o.ldr},it),"a change in the PDF saves and keeps the LDR");
 // two tabs: change in tab 2 is not overwritten by tab 1 closing
 const p2=await ctx.newPage();await p2.goto(p.url());await p2.waitForTimeout(2500);
 await p2.evaluate(async o=>{const r=await DB.get("marks",o.key);const x=r.data.pairs.find(x=>x.id===o.pid);x.mis=true;x.misNote="tab2";await saveDocData(o.key,r.data)},it);await p.waitForTimeout(600);
 await p.evaluate(()=>{dispatchEvent(new Event("pagehide"));return flushSave()});await p.waitForTimeout(400);
 ok(await p.evaluate(async o=>{const r=await DB.get("marks",o.key);return r.data.pairs.find(x=>x.id===o.pid).misNote==="tab2"},it),"change made in another tab survives closing this tab");
 ok(await p.evaluate(o=>S.data.pairs.find(x=>x.id===o.pid).misNote==="tab2",it),"and this tab picked it up");
 // undo LDR for cleanliness
 await p.evaluate(async o=>{const r=await DB.get("marks",o.key);const x=r.data.pairs.find(x=>x.id===o.pid);if(o.ldr)x.ldr=true;else delete x.ldr;x.star=o.star;delete x.mis;delete x.misNote;await DB.put("marks",o.key,r)},it);
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await ctx.close()})();
