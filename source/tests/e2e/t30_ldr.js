const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1536,860,"laptop"],[915,412,"phoneland"],[390,844,"phone"]]){const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:vp[2]!=="laptop",mobile:vp[2]!=="laptop"});p.setDefaultTimeout(30000);const nm=vp[2];
 await p.evaluate(()=>{BK.f.ldr=false});await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.waitForSelector(".rvldr");
 const id=await p.evaluate(()=>BK.list[BK.rc].id);const was=await p.evaluate(()=>!!BK.list[BK.rc].p.ldr);
 await p.click(".rvldr");await p.waitForTimeout(400);ok(await p.evaluate(()=>!!BK.list[BK.rc].p.ldr)!==was,nm+": LDR button toggles the question");
 ok((await p.getAttribute(".rvldr","aria-pressed"))===String(!was),nm+": button shows its state");
 await p.screenshot({path:"/tmp/e2e/shots/ldr_"+nm+".png",clip:{x:0,y:0,width:vp[0],height:nm==="phone"?220:70}});
 if(nm==="laptop"){await p.keyboard.press("l");await p.waitForTimeout(300);ok(await p.evaluate(()=>!!BK.list[BK.rc].p.ldr)===was,"L key toggles back");await p.keyboard.press("l");await p.waitForTimeout(300)}
 if(was){await p.click(".rvldr");await p.waitForTimeout(300)}
 // make sure it's on, then filter
 await p.evaluate(()=>{const it=BK.list[BK.rc];if(!it.p.ldr){it.p.ldr=true;saveDocData(it.key,it.data)}});await p.waitForTimeout(300);
 await p.evaluate(()=>studyEnd());await p.waitForTimeout(400);await p.evaluate(()=>{BK.view="list";renderBank()});
 if(nm==="laptop"){await p.click("#bkLdr");await p.waitForTimeout(300);const s=await p.evaluate(()=>({n:BK.list.length,all:BK.list.every(it=>it.p.ldr)}));ok(s.n>=1&&s.all,"Library LDR filter shows only LDR ("+s.n+")");
  ok(await p.locator(".brw .ldrb").count()>=1,"LDR badge on the row");
  await p.evaluate(()=>{BK.view="idx";renderBank()});await p.waitForTimeout(500);ok(await p.locator("input[data-xldr]:checked").count()>=1,"Index has an LDR column");await p.evaluate(()=>{BK.view="list";renderBank()});await p.click("#bkLdr");
  await p.evaluate(()=>navGo("today"));await p.waitForTimeout(600);ok((await p.textContent(".tmini")).includes("LDR"),"Today shows the LDR count");
  await p.click('.tmini [data-act="goldr"]');await p.waitForTimeout(800);ok(await p.evaluate(()=>BK.f.ldr&&BK.view==="list"),"LDR tile opens the filtered Library");await p.evaluate(()=>{BK.f.ldr=false;renderBank()})}
 await p.evaluate(id=>{const it=BK.items.find(x=>x.id===id);if(it){delete it.p.ldr;saveDocData(it.key,it.data)}},id);
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
