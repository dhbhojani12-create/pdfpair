const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(90000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/AFM RTP N26.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});await p.click('#sbar [data-s=accept]');await p.waitForTimeout(600);
 const before=await p.evaluate(()=>({N:S.pages.length,n:S.data.pairs.length,pages:S.data.pairs.map(x=>x.q[0].page),ch:(S.data.chapters||[]).map(c=>c.start),key:S.doc.key}));
 // delete page 1 and page 2: every remaining mark should move up by 2
 await p.click("#delPgBtn");await p.fill("#dpIn","1-2");await p.waitForTimeout(300);
 const info=await p.textContent("#dpInfo");ok(/Pages 1–2/.test(info)&&new RegExp(before.N+" → "+(before.N-2)).test(info),"preview says what will happen: "+info.trim().slice(0,110));
 await p.click("#dpGo");await p.waitForFunction(n=>S.pages&&S.pages.length===n,before.N-2,{timeout:60000});await p.waitForTimeout(800);
 const after=await p.evaluate(()=>({N:S.pages.length,n:S.data.pairs.length,pages:S.data.pairs.map(x=>x.q[0].page)}));
 ok(after.N===before.N-2,"PDF now has "+after.N+" pages (was "+before.N+")");
 const exp=before.pages.filter(pg=>pg>2).map(pg=>pg-2);ok(JSON.stringify(after.pages)===JSON.stringify(exp),"marks moved with their pages: "+JSON.stringify(after.pages.slice(0,6)));
 const stored=await p.evaluate(async k=>{const r=await DB.get("marks",k);const bb=await DB.get("bytes",k);const d=await pdfjsLib.getDocument({data:new Uint8Array(bb.slice?bb.slice(0):bb)}).promise;return{n:r.data.pairs.length,pg:d.numPages}},before.key);
 ok(stored.pg===before.N-2&&stored.n===after.n,"saved PDF and marks are consistent after reload: "+JSON.stringify(stored));
 // undo
 await p.click("#tUndo");await p.waitForFunction(n=>S.pages&&S.pages.length===n,before.N,{timeout:60000});await p.waitForTimeout(800);
 const back=await p.evaluate(()=>({N:S.pages.length,pages:S.data.pairs.map(x=>x.q[0].page)}));
 ok(back.N===before.N&&JSON.stringify(back.pages)===JSON.stringify(before.pages),"Undo brings back all pages and marks exactly");
 // validation
 await p.click("#delPgBtn");await p.fill("#dpIn","1-"+before.N);await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector("#dpGo").disabled),"cannot delete every page");
 await p.fill("#dpIn","abc");await p.waitForTimeout(200);ok(await p.evaluate(()=>document.querySelector("#dpGo").disabled),"bad input blocked");
 const e=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e.length,"no page errors "+e.join("|").slice(0,300));await b.close()})();
