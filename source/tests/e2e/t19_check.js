const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/DT_Ch1.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:60000});
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:180000});
 // make one suggestion look wrong: answer running 6 pages, and drop another's answer
 await p.evaluate(()=>{const s=S.sugg[0];const a=s.a[0];s.a=[0,1,2,3,4,5].map(k=>({...a,page:a.page+k}));S.sugg[1].a=[];refreshAll()});
 console.log(JSON.stringify(await p.evaluate(()=>{const st=chkStats(S.sugg);return S.sugg.map(s=>[s.label,reviewFlags(s,S.sugg,st),s.q.map(r=>[r.page,+r.h.toFixed(3),+r.w.toFixed(3)]),s.a.map(r=>[r.page,+r.h.toFixed(3)])]).filter(x=>x[1].length)})));const bt=await p.textContent("#sbar");ok(/2 to check/.test(bt),"suggestion bar shows 2 to check: "+bt.match(/⚠[^A-Z]*/));
 await p.click('#sbar [data-s=odd]');await p.waitForTimeout(400);ok(await p.evaluate(()=>!!S.sgFocus),"⚠ button jumps to an unusual one");
 ok(await p.locator(".sug.chk").count()>0,"unusual suggestion drawn in orange");
 await p.screenshot({path:"/tmp/e2e/shots/chk_sugg.png"});
 await p.click('#sbar [data-s=accept]');await p.waitForTimeout(500);
 ok(await p.isVisible("#chkBtn"),"pairs list shows the to-check button");ok((await p.textContent("#chkBtn")).includes("2 to check"),"count 2: "+await p.textContent("#chkBtn"));
 ok(await p.locator("#plist .pi.chk").count()===2,"two rows flagged");
 const reason=await p.textContent("#plist .pi.chk .chkr");ok(/answer runs 6 pages|no answer found/.test(reason),"reason shown: "+reason);
 await p.click("#chkBtn");await p.waitForTimeout(300);const act=await p.evaluate(()=>S.activeId);ok(await p.evaluate(id=>chkList().some(x=>x.p.id===id),act),"to-check button selects a flagged pair");
 await p.screenshot({path:"/tmp/e2e/shots/chk_list.png"});
 await p.click("#plist .pi.chk .okc");await p.waitForTimeout(300);ok(await p.locator("#plist .pi.chk").count()===1,"✓ clears one warning");ok((await p.textContent("#chkBtn")).includes("1 to check"),"count now 1");
 // fixing the box clears it too
 await p.evaluate(()=>{const x=chkList()[0].p;if(!x.a.length){x.a=[{...x.q[0],id:uid(),page:x.q[0].page+1}]}else x.a=x.a.slice(0,1);save();refreshAll()});await p.waitForTimeout(300);
 ok(await p.isHidden("#chkBtn"),"fixing the pair removes the last warning");
 {const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"))};await b.close()})();
