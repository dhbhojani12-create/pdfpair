const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1400,900,"laptop"],[390,844,"phone"]]){const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:vp[2]==="phone",mobile:vp[2]==="phone"});p.setDefaultTimeout(30000);const nm=vp[2];
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpg");
 // open the 5th group and scroll to it
 await p.evaluate(()=>{BK.repOpen=4;renderBankRepeats()});await p.waitForSelector(".rpg.open .rpview");await p.locator(".rpg.open").scrollIntoViewIfNeeded();await p.waitForTimeout(200);
 const y0=await p.evaluate(()=>$("#bkMain").scrollTop);await p.click(".rpg.open .rpview");await p.waitForTimeout(600);ok(await p.evaluate(()=>document.body.classList.contains("study")),nm+": in Revise");
 await p.keyboard.press("Escape");await p.waitForTimeout(700);
 const s=await p.evaluate(()=>({v:BK.view,y:$("#bkMain").scrollTop,open:BK.repOpen}));ok(s.v==="rep"&&Math.abs(s.y-y0)<40&&s.open===4,nm+": back on Repeats at the same place (y "+y0+" → "+s.y+", group "+(s.open+1)+" open)");
 // side by side too
 await p.click(".rpg.open [data-rview]");await p.waitForTimeout(600);await p.evaluate(()=>studyEnd());await p.waitForTimeout(500);ok(Math.abs(await p.evaluate(()=>$("#bkMain").scrollTop)-y0)<40,nm+": same after View side by side");
 // list view: Revise from the middle of the list
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{$("#bkMain").scrollTop=1200});await p.waitForTimeout(200);const ly=await p.evaluate(()=>$("#bkMain").scrollTop);
 await p.evaluate(()=>studyStart());await p.waitForTimeout(500);await p.evaluate(()=>studyEnd());await p.waitForTimeout(500);ok(Math.abs(await p.evaluate(()=>$("#bkMain").scrollTop)-ly)<40,nm+": Library list keeps its place after Revise");
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
