const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 const keep=await p.evaluate(()=>JSON.stringify(L.skip||{}));
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpg");const g=await p.evaluate(()=>{const g=BK.groups.find(x=>x.items.length>=2);return{a:g.items[0].id,b:g.items[1].id}});
 await p.evaluate(()=>{L.skip={}});await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());
 await p.evaluate(id=>{BK.rc=BK.list.findIndex(x=>x.id===id);BK.revealed=true;renderBankSlides()},g.a);
 await p.click(".rvasked");await p.waitForSelector("#smList");await p.check('#smList [data-sm="'+g.b+'"]');await p.click("#smGo");await p.waitForTimeout(400);
 ok(await p.evaluate(id=>!!L.skip[id],g.b),"marked as same");
 await p.click("#tUndo");await p.waitForTimeout(300);ok(await p.evaluate(id=>!L.skip[id],g.b),"Undo on the message brings it back");
 // mark again, then untick in the dialog
 await p.evaluate(id=>{BK.rc=BK.list.findIndex(x=>x.id===id);BK.revealed=true;renderBankSlides()},g.a);await p.click(".rvasked");await p.waitForSelector("#smList");await p.check('#smList [data-sm="'+g.b+'"]');await p.click("#smGo");await p.waitForTimeout(300);
 await p.evaluate(id=>{BK.rc=BK.list.findIndex(x=>x.id===id);BK.revealed=true;renderBankSlides()},g.a);await p.click(".rvasked");await p.waitForSelector("#smList");
 ok(await p.isChecked('#smList [data-sm="'+g.b+'"]'),"an already-marked copy shows ticked");await p.uncheck('#smList [data-sm="'+g.b+'"]');await p.click("#smGo");await p.waitForTimeout(300);ok(await p.evaluate(id=>!L.skip[id],g.b),"unticking it in the window brings it back");
 // Library badge
 await p.evaluate(id=>{L.skip[id]=id;studyEnd()},g.b);await p.waitForTimeout(300);await p.evaluate(()=>navGo("today"));await p.waitForTimeout(500);await p.click('[data-act="gosame"]');await p.waitForTimeout(800);
 ok(await p.evaluate(id=>BK.f.same&&BK.list.length===1&&BK.list[0].id===id,g.b),"Today’s skipped-as-same box opens just those");ok(await p.isVisible("#bkSame"),"filter chip shown to turn it off");
 await p.click('[data-unsame]');await p.waitForTimeout(300);ok(await p.evaluate(id=>!L.skip[id],g.b),"“Same ×” badge in Library brings it back");
 await p.click("#bkSame");ok(await p.evaluate(()=>!BK.f.same),"chip clears the filter");
 await p.evaluate(k=>{L.skip=JSON.parse(k);DB.put("kv","skip",L.skip)},keep);
 const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"));await ctx.close()})();
