const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1400,860,"laptop"],[390,844,"phone"]]){const nm=vp[2];const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:nm!=="laptop",mobile:nm!=="laptop"});p.setDefaultTimeout(30000);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());
 // pick a long question (several boxes) so there is something to scroll
 await p.evaluate(()=>{let k=BK.list.findIndex(x=>x.p.q.length>=2||x.p.q.some(r=>r.h>.6));BK.rc=k<0?0:k;BK.revealed=true;renderBankSlides()});await p.waitForTimeout(1500);
 await p.evaluate(()=>{document.activeElement&&document.activeElement.blur();if($("#bkMain .rv.land"))setSplit(.75,false,false)});await p.waitForTimeout(300);
 const rc0=await p.evaluate(()=>BK.rc);const sc=await p.evaluate(()=>{const e=rvScroller();window.__sc=e;return{tag:e.className||e.tagName,top:e.scrollTop,can:e.scrollHeight-e.clientHeight}});
 await p.keyboard.press("ArrowDown");await p.waitForTimeout(500);await p.keyboard.press("ArrowDown");await p.waitForTimeout(500);
 const t1=await p.evaluate(()=>window.__sc.scrollTop);ok(await p.evaluate(()=>BK.rc)===rc0,nm+": ↓ stays on the same question");
 ok(sc.can<=0||t1>sc.top,nm+": ↓ scrolls ("+sc.tag+" "+sc.top+"→"+t1+", room "+sc.can+")");
 await p.keyboard.press("ArrowUp");await p.waitForTimeout(500);ok(sc.can<=0||await p.evaluate(()=>window.__sc.scrollTop)<t1,nm+": ↑ scrolls back");
 await p.keyboard.press("ArrowRight");await p.waitForTimeout(500);ok(await p.evaluate(()=>BK.rc)===rc0+1,nm+": → still goes to the next question");
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
