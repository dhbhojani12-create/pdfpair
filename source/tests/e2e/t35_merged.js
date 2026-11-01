const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1400,860,"laptop"],[915,412,"phoneland"],[390,844,"phone"]]){const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:vp[2]!=="laptop",mobile:vp[2]!=="laptop"});p.setDefaultTimeout(30000);const nm=vp[2];
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpg");const a=await p.evaluate(()=>BK.groups.find(x=>x.items.length>=2).items[0].id);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");ok(await p.locator("#bkDue").count()===0,nm+": Due filter removed");
 await p.evaluate(()=>studyStart());await p.evaluate(id=>{BK.rc=BK.list.findIndex(x=>x.id===id);BK.revealed=true;renderBankSlides()},a);await p.waitForTimeout(500);
 ok(await p.locator(".rvrate").count()===0,nm+": no rating bar after the answer");ok(await p.isVisible(".rvasked"),nm+": Asked N× button visible");
 await p.screenshot({path:"/tmp/e2e/shots/merged_"+nm+".png",clip:{x:0,y:0,width:vp[0],height:nm==="phone"?260:70}});
 await p.click(".rvasked");await p.waitForSelector("#smList");ok((await p.textContent("#gTitle")).startsWith("Asked"),nm+": it opens the copies window: "+await p.textContent("#gTitle"));
 ok(await p.locator("#smList [data-smgo]").count()>=1,nm+": with Do it next");await p.keyboard.press("Escape");
 if(nm==="laptop"){await p.keyboard.press("v");await p.waitForTimeout(300);ok(await p.isVisible("#smList"),"V key opens it too");await p.keyboard.press("Escape");
   await p.evaluate(()=>studyEnd());await p.evaluate(()=>navGo("today"));await p.waitForTimeout(600);ok(await p.locator(".pldue,[data-act=duego]").count()===0,"no Due row or tile on Today")}
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);ok(sw,nm+": no sideways scroll");
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
