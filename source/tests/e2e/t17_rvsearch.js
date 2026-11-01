const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1536,860,"laptop"],[915,412,"phoneland"]]){const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:vp[2]!=="laptop",mobile:vp[2]!=="laptop"});p.setDefaultTimeout(30000);const nm=vp[2];
 await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.waitForSelector("#rvQ");
 const target=await p.evaluate(()=>{const i=Math.min(3,BK.list.length-1);const it=BK.list[i];const w=(it.tq||"").split(/\s+/).filter(x=>x.length>6)[0]||it.label;return{i,w,id:it.id}});
 await p.click("#rvQ");await p.keyboard.type(target.w);await p.waitForTimeout(300);
 const n=await p.locator("#rvRes .rvhit").count();ok(n>0,nm+": results show for “"+target.w+"” ("+n+")");
 const vis=await p.evaluate(()=>{const r=document.querySelector("#rvRes").getBoundingClientRect();const el=document.elementFromPoint(r.left+20,r.top+20);return !!(el&&el.closest("#rvRes"))});ok(vis,nm+": result list is on top, not clipped");
 await p.screenshot({path:"/tmp/e2e/shots/rvsearch_"+nm+".png"});
 await p.click('#rvRes .rvhit[data-go="'+target.i+'"]').catch(()=>{});await p.waitForTimeout(400);
 const now=await p.evaluate(()=>({id:BK.list[BK.rc].id,study:document.body.classList.contains("study"),q:document.querySelector("#rvQ").value}));
 ok(now.id===target.id&&now.study,nm+": tapping a result jumps to it");ok(now.q==="",nm+": box clears after jump");
 if(nm==="laptop"){await p.keyboard.press("/");ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="rvQ"),"/ focuses search");await p.keyboard.type("zzqqxx");await p.waitForTimeout(200);ok((await p.textContent("#rvRes")).includes("No question"),"no-match message");await p.keyboard.press("Escape");ok(await p.evaluate(()=>document.body.classList.contains("study")&&document.querySelector("#rvRes").hidden),"Esc closes search, stays in Revise")}
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
