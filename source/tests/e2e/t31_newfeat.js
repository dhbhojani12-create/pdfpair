const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 const keep=await p.evaluate(()=>JSON.stringify({srs:L.srs||{},skip:L.skip||{},exams:L.exams||{dates:{},finish:14}}));
 await p.evaluate(()=>{try{localStorage.setItem("pp-hide","1")}catch(_){};BK.hide=true;L.srs={};L.skip={}});
 // ---- Revise: rating
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpg");
 const grpItem=await p.evaluate(()=>{const g=BK.groups.find(x=>x.items.length>=2);return g?g.items[0].id:null});
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.waitForSelector(".rv");
 ok(await p.locator(".rvrate").count()===0,"no rating bar before the answer is shown");
 await p.evaluate(()=>{BK.revealed=true;renderBankSlides()});await p.waitForSelector(".rvrate");ok(await p.isVisible(".rvrate .rr.m"),"rating bar appears with the answer");
 const id1=await p.evaluate(()=>BK.list[BK.rc].id);await p.click(".rvrate .rr.m");await p.waitForTimeout(400);
 const s1=await p.evaluate(id=>({due:L.srs[id]&&L.srs[id].due,r:L.srs[id]&&L.srs[id].r,rc:BK.rc,seen:!!L.seen[id]}),id1);
 const tom=await p.evaluate(()=>dayStart()+864e5);ok(s1.r==="m"&&s1.due===tom&&s1.rc===1&&s1.seen,"Missed → due tomorrow, counted revised, moved to next");
 await p.evaluate(()=>{BK.revealed=true;renderBankSlides()});await p.waitForSelector(".rvrate");const id2=await p.evaluate(()=>BK.list[BK.rc].id);await p.keyboard.press("c");await p.waitForTimeout(300);
 const s2=await p.evaluate(id=>L.srs[id],id2);ok(s2&&s2.r==="g"&&Math.round((s2.due-Date.now())/864e5)>=9,"C key = Got it → about 10 days");
 // ---- marks timer
 await p.evaluate(()=>{const it=BK.list[BK.rc];it.tq=(it.tq||"")+" (10 Marks)";BK.mt=null;renderBankSlides()});await p.waitForSelector("#rvMt");ok((await p.textContent("#rvMt")).includes("10 marks"),"marks timer shows for a 10-mark question: "+(await p.textContent("#rvMt")).replace(/\s+/g," "));
 await p.waitForTimeout(1300);const tt=await p.textContent("#rvMt b");ok(/^17:5\d$/.test(tt),"it counts down from 18:00 ("+tt+")");
 // ---- mistake
 await p.click(".rvmis");await p.waitForSelector("#misT");await p.fill("#misT","forgot the 12-month test");await p.click('[data-mm2="ok"]');await p.waitForTimeout(400);
 const mi=await p.evaluate(()=>({m:BK.list[BK.rc].p.mis,n:BK.list[BK.rc].p.misNote,pr:document.querySelector(".rvmis").getAttribute("aria-pressed")}));ok(mi.m&&mi.n==="forgot the 12-month test"&&mi.pr==="true","Mistake saved with its note");
 await p.screenshot({path:"/tmp/e2e/shots/nf_revise.png"});
 // ---- same as earlier
 if(grpItem){await p.evaluate(id=>{BK.rc=BK.list.findIndex(x=>x.id===id);BK.revealed=true;renderBankSlides()},grpItem);await p.waitForSelector(".rvrate");await p.click(".rvrate .rr.same");await p.waitForSelector("#smList");
   const n=await p.locator("#smList [data-sm]").count();ok(n>=1,"Same as earlier lists "+n+" matching question(s)");await p.screenshot({path:"/tmp/e2e/shots/nf_same.png"});
   await p.check("#smList [data-sm] >> nth=0");const sid=await p.getAttribute("#smList [data-sm] >> nth=0","data-sm");await p.click("#smGo");await p.waitForTimeout(500);
   const sk=await p.evaluate(id=>({skip:L.skip[id],seen:!!L.seen[id],inList:BK.list.some(x=>x.id===id)}),sid);ok(sk.skip===grpItem&&sk.seen&&!sk.inList,"ticked repeat is marked same, counted revised and dropped from Revise")}
 else ok(true,"(no repeat groups in test data for Same as earlier)");
 await p.evaluate(()=>studyEnd());await p.waitForTimeout(300);
 // ---- Library filters
 await p.evaluate(()=>{BK.view="list";renderBank()});await p.click("#bkMis");ok(await p.evaluate(()=>BK.list.length>=1&&BK.list.every(it=>it.p.mis)),"Mistakes filter");await p.click("#bkMis");
 await p.evaluate(()=>{const id=Object.keys(L.srs)[0];L.srs[id].due=dayStart()-864e5});await p.click("#bkDue");ok(await p.evaluate(()=>BK.list.length>=1&&BK.list.every(it=>isDue(it.id))),"Due filter ("+await p.evaluate(()=>BK.list.length)+")");await p.click("#bkDue");
 // ---- Today
 await p.evaluate(async()=>{const fo=L.folders[0];const d=new Date();d.setDate(d.getDate()+1);const tm=d.toISOString().slice(0,10);const d2=new Date();d2.setDate(d2.getDate()+60);L.exams={dates:{[fo.id]:tm},finish:14};L.folders[1]&&(L.exams.dates[L.folders[1].id]=d2.toISOString().slice(0,10));navGo("today")});await p.waitForTimeout(800);
 ok(await p.locator(".texc").count()>=1,"exam countdown cards on Today ("+await p.locator(".texc").count()+")");ok(await p.isVisible(".tldr"),"exam-tomorrow banner shows");
 ok(await p.isVisible(".pldue"),"due row in Today's plan: "+(await p.textContent(".pldue")).replace(/\s+/g," ").slice(0,60));
 ok(await p.locator(".tmini .tmis").count()===1,"mistakes tile");ok(await p.locator(".tcov .tcv").count()>=1,"topic coverage card ("+await p.locator(".tcov .tcv").count()+" topics)");
 await p.screenshot({path:"/tmp/e2e/shots/nf_today.png",fullPage:false});await p.locator(".tcov").screenshot({path:"/tmp/e2e/shots/nf_cov.png"});
 await p.click('.texe');await p.waitForSelector("#gBody [data-exd]");ok(await p.locator("#gBody [data-exd]").count()>=1,"exam dates dialog");await p.keyboard.press("Escape");
 await p.click(".pldue [data-act=duego]");await p.waitForTimeout(1500);console.log("  dbg",JSON.stringify(await p.evaluate(()=>({st:document.body.classList.contains("study"),n:BK.list.length,due:BK.list.map(it=>isDue(it.id)),ids:dueIdsAll().length}))));ok(await p.evaluate(()=>document.body.classList.contains("study")&&BK.list.every(it=>isDue(it.id))),"Start on the due row revises only due questions");await p.evaluate(()=>studyEnd());await p.waitForTimeout(400);
 await p.evaluate(()=>navGo("today"));await p.waitForTimeout(500);const tp=await p.getAttribute(".tcov .tcv >> nth=0","data-covt");await p.click(".tcov .tcv >> nth=0");await p.waitForTimeout(800);
 ok(await p.evaluate(t=>BK.view==="list"&&(BK.f.topics.has(t)||BK.f.topics.has("__untagged__")),tp),"tapping a topic opens it in Library");
 // ---- pack dialog
 await p.evaluate(()=>{BK.f.topics.clear();renderBank()});await p.click("#bkExport");await p.waitForSelector("#bxEnd");ok(await p.isVisible("#bxMis"),"revision pack dialog with layout + mistake notes");await p.click("#bxEnd");ok((await p.getAttribute("#bxEnd","aria-pressed"))==="true","answers-at-end layout selectable");await p.keyboard.press("Escape");
 // restore
 await p.evaluate(k=>{const o=JSON.parse(k);L.srs=o.srs;L.skip=o.skip;L.exams=o.exams;DB.put("kv","srs",L.srs);DB.put("kv","skip",L.skip);DB.put("kv","exams",L.exams);for(const it of BK.items){if(it.p.mis){delete it.p.mis;delete it.p.misNote;saveDocData(it.key,it.data)}}},keep);await p.waitForTimeout(600);
 const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"));await ctx.close()})();
