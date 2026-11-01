const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{BK.view="idx";renderBank()});await p.waitForSelector(".ixtag");
 ok(await p.locator("th.c-d").count()===0,"no Description column");
 await p.evaluate(()=>{$("#bkMain").scrollTop=600});await p.waitForTimeout(200);const st=await p.evaluate(()=>$("#bkMain").scrollTop);
 const id=await p.evaluate(()=>[...document.querySelectorAll(".ixtag")].find(e=>{const r=e.getBoundingClientRect();return r.top>300&&r.bottom<innerHeight-50}).dataset.addt);const b=p.locator('.ixtag[data-addt="'+id+'"]');const before=await p.evaluate(id=>(BK.items.find(x=>x.id===id).p.tags||[]).slice(),id);
 await b.click();await p.waitForSelector("#tpQ");await p.fill("#tpQ","Zz test topic");await p.keyboard.press("Enter");await p.waitForTimeout(500);
 const after=await p.evaluate(id=>(BK.items.find(x=>x.id===id).p.tags||[]).slice(),id);ok(after.includes("Zz test topic"),"tag added from the table: "+after.join(", "));
 ok(await p.locator('.ixtag[data-addt="'+id+'"] .tchip',{hasText:"Zz test topic"}).count()===1,"table shows the new tag");
 {const s2=await p.evaluate(()=>[$("#bkMain").scrollTop,document.scrollingElement.scrollTop,$("#bkMain").scrollHeight,$("#bkMain").clientHeight]);console.log("st",st,s2);ok(Math.abs(s2[0]-st)<80,"table stays where you were")}
 await p.screenshot({path:"shots/ixtag.png"});
 await p.locator('.ixtag[data-addt="'+id+'"]').click();await p.waitForSelector("#tpQ");await p.click('#menu [data-tp="Zz test topic"]');await p.waitForTimeout(400);
 ok(!(await p.evaluate(id=>(BK.items.find(x=>x.id===id).p.tags||[]).includes("Zz test topic"),id)),"clicking it again removes it");
 ok(JSON.stringify(await p.evaluate(id=>(BK.items.find(x=>x.id===id).p.tags||[]),id))===JSON.stringify(before),"back to the original tags");
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await ctx.close()})();
