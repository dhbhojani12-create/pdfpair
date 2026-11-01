const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.evaluate(()=>{BK.rc=2;BK.revealed=false;renderBankSlides()});await p.waitForTimeout(500);
 await p.mouse.click(700,40).catch(()=>{});await p.keyboard.press("Escape").catch(()=>{});
 if(!(await p.evaluate(()=>document.body.classList.contains("study")))){await p.evaluate(()=>studyStart());await p.evaluate(()=>{BK.rc=2;BK.revealed=false;renderBankSlides()})}
 await p.evaluate(()=>document.activeElement&&document.activeElement.blur());await p.evaluate(()=>setSplit(.75,false,false));
 await p.keyboard.press("a");await p.waitForTimeout(500);ok(await p.evaluate(()=>BK.revealed&&BK.split<.5),"A shows the answer and makes it big ("+await p.evaluate(()=>BK.split)+")");
 await p.keyboard.press("q");await p.waitForTimeout(400);ok(await p.evaluate(()=>BK.split>.5),"Q makes the question big");
 await p.keyboard.press("Tab");await p.waitForTimeout(400);ok(await p.evaluate(()=>BK.split<.5),"Tab switches to the answer");
 await p.keyboard.press("Tab");await p.waitForTimeout(400);ok(await p.evaluate(()=>BK.split>.5),"Tab switches back");
 ok(await p.evaluate(()=>document.body.classList.contains("study")),"still in Revise");
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await ctx.close()})();
