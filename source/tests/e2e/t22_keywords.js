const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/DT_Ch1.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:60000});
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m="kw"]');await p.waitForTimeout(800);
 ok(await p.isVisible("#adKq"),"Keywords tab shows the two fields");
 await p.fill("#adKq","Illustration 1");await p.fill("#adKa","Solution");await p.fill("#adQf","40");await p.fill("#adQt","69");
 ok((await p.textContent("#adKinfo")).includes("right after each question"),"explains how it will pair: "+(await p.textContent("#adKinfo")).slice(0,90));
 await p.screenshot({path:"/tmp/e2e/shots/kw_dialog.png"});
 await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});
 const sg=await p.evaluate(()=>({n:S.sugg.length,a:S.sugg.filter(s=>s.a.length).length,nums:S.sugg.map(s=>s.num).join(",")}));
 ok(sg.n===10&&sg.a===10,"finds 10 illustrations with solutions: "+JSON.stringify(sg));
 await p.click('#sbar [data-s=accept]');await p.waitForTimeout(800);
 const rc=await p.evaluate(()=>L.recipes);ok(rc&&rc.length===1&&rc[0].q==="Illustration 1"&&rc[0].used===1,"pattern remembered after Accept: "+JSON.stringify(rc&&rc.map(r=>[r.q,r.a,r.used])));
 // a new search remembers it and prefills
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m="kw"]');await p.waitForSelector(".kwchip",{timeout:20000});
 ok(await p.locator(".kwchip.best").count()===1,"saved pattern offered as best fit");ok(await p.inputValue("#adKq")==="Illustration 1","fields filled from the best saved pattern");
 await p.screenshot({path:"/tmp/e2e/shots/kw_saved.png"});
 await p.click(".kwchip i");await p.waitForTimeout(300);ok(await p.evaluate(()=>L.recipes.length)===0,"× forgets a saved pattern");
 {const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"))}await b.close()})();
