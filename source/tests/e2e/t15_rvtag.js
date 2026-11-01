const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [{width:1280,height:720},{width:390,height:800,touch:true,mobile:true}]){
 const {ctx,p,errs}=await open({viewport:{width:vp.width,height:vp.height},touch:vp.touch,mobile:vp.mobile});p.setDefaultTimeout(30000);const nm=vp.width>800?"laptop":"phone";
 await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.waitForSelector(".rvtag");
 const lbl0=await p.evaluate(()=>BK.list[BK.rc].id);
 await p.click(".rvtag");await p.waitForSelector("#menu #tpQ");ok(await p.isVisible("#menu #tpQ"),nm+": tag dropdown opens");
 await p.fill("#tpQ","Test Topic Z");await p.press("#tpQ","Enter");await p.waitForTimeout(500);
 let s=await p.evaluate(()=>({tags:BK.list[BK.rc].p.tags,id:BK.list[BK.rc].id,chip:document.querySelector(".rvtag").textContent,study:document.body.classList.contains("study")}));
 ok(s.tags.length===1&&s.tags[0]==="Test Topic Z",nm+": new topic set ("+s.tags+")");ok(s.id===lbl0&&s.study,nm+": stays on same question in Revise");ok(s.chip.includes("Test Topic Z"),nm+": chip shows topic");
 await p.screenshot({path:"/tmp/e2e/shots/rvtag_"+nm+".png"});
 await p.click(".rvtag");await p.waitForSelector("#menu [data-tp]");await p.click('#menu [data-tp="Test Topic Z"]');await p.waitForTimeout(400);
 s=await p.evaluate(()=>BK.list[BK.rc].p.tags||[]);ok(!s.includes("Test Topic Z"),nm+": tapping the current topic removes it");
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
