const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{for(const vp of [[1280,800,"laptop"],[390,844,"phone"]]){const {ctx,p,errs}=await open({viewport:{width:vp[0],height:vp[1]},touch:vp[2]==="phone",mobile:vp[2]==="phone"});p.setDefaultTimeout(30000);const nm=vp[2];
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpw");
 const n0=await p.evaluate(()=>(BK.repShown||[]).length);ok(await p.isVisible(".rpfbar"),nm+": filter bar shown ("+n0+" repeats)");
 if(n0){const src=await p.getAttribute('.rpfbar [data-rf="src"]','data-v').catch(()=>null);
   if(src){await p.click('.rpfbar [data-rf="src"][data-v="'+src+'"]');const n1=await p.evaluate(s=>({n:BK.repShown.length,ok:BK.repShown.every(g=>g.items.some(it=>it.src===s))}),src);ok(n1.ok,nm+": source chip "+src+" filters ("+n1.n+")");await p.click('.rpfbar [data-rf="clear"]')}
   const w=await p.evaluate(()=>((BK.repShown[0].lead.tq||"").split(/\s+/).find(x=>x.length>6)||"zzz"));
   await p.fill("#rpQ",w);await p.waitForTimeout(500);const n2=await p.evaluate(()=>BK.repShown.length);ok(n2>=1&&n2<=n0,nm+": search “"+w+"” narrows to "+n2);ok(await p.evaluate(()=>document.activeElement&&document.activeElement.id==="rpQ"),nm+": search box keeps focus");
   await p.fill("#rpQ","qqqzzzxx");await p.waitForTimeout(500);ok((await p.textContent(".rpw")).includes("No repeats match"),nm+": empty result message");
   await p.click('.rpfbar [data-rf="clear"]');ok(await p.evaluate(()=>BK.repShown.length)===n0,nm+": Clear filters restores all");
   await p.click('.rpfbar [data-rf="unseen"]');ok(await p.evaluate(()=>BK.repShown.every(g=>!g.items.some(it=>(L.seen||{})[it.id]))),nm+": Not revised yet works");await p.click('.rpfbar [data-rf="clear"]')}
 await p.screenshot({path:"/tmp/e2e/shots/repf_"+nm+".png"});
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);ok(sw,nm+": no sideways scroll");
 ok(!errs.length,nm+": no page errors "+errs.join(";"));await ctx.close()}})();
