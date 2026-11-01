const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1280,height:800}});p.setDefaultTimeout(30000);
 const reload=async()=>{await p.evaluate(()=>navSnap());await p.reload();await p.waitForFunction(()=>{try{return L.docs.length>0}catch(e){return false}});await p.waitForTimeout(2500)};
 // 1. Library list with a filter, scrolled
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{BK.f.star=true;renderBank()});await p.waitForTimeout(300);
 const n1=await p.evaluate(()=>BK.list.length);await p.evaluate(()=>{BK.f.star=false;renderBank()});await p.waitForTimeout(300);await p.evaluate(()=>{$("#bkMain").scrollTop=1500});await p.waitForTimeout(200);
 await reload();let s=await p.evaluate(()=>({v:S.view,bv:BK.view,top:$("#bkMain").scrollTop}));ok(s.v==="bank"&&s.bv==="list","Library list comes back after refresh: "+JSON.stringify(s));ok(Math.abs(s.top-1500)<60,"scroll position kept ("+s.top+")");
 await p.evaluate(()=>{BK.f.star=true;renderBank()});await reload();ok(await p.evaluate(()=>BK.f.star&&BK.list.length),"filters kept ("+n1+" important)");await p.evaluate(()=>{BK.f.star=false;renderBank()});
 // 2. Revise at question 4
 await p.evaluate(()=>{studyStart();bankGo(3)});await p.waitForTimeout(800);const id=await p.evaluate(()=>BK.list[BK.rc].id);
 await reload();s=await p.evaluate(()=>({study:document.body.classList.contains("study"),id:BK.list[BK.rc]&&BK.list[BK.rc].id,rc:BK.rc}));ok(s.study&&s.id===id,"Revise reopens on the same question (#"+(s.rc+1)+")");
 await p.evaluate(()=>studyEnd());await p.waitForTimeout(300);
 // 3. Repeats with a filter
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpfbar");await p.evaluate(()=>{BK.rf.unseen=true;renderBankRepeats()});await reload();
 s=await p.evaluate(()=>({bv:BK.view,un:BK.rf&&BK.rf.unseen,bar:!!document.querySelector('.rpfbar [data-rf="unseen"][aria-pressed="true"]')}));ok(s.bv==="rep"&&s.un&&s.bar,"Repeats and its filter come back: "+JSON.stringify(s));
 // 4. A paper on page 2, Review tab
 await p.evaluate(()=>navGo("today"));await p.waitForTimeout(500);await p.evaluate(async()=>{const d=L.docs.find(x=>x.pages>1)||L.docs[0];await openDoc({kind:"lib",key:d.key,name:d.name,size:d.size});goPage(2);setTab("review")});await p.waitForTimeout(800);
 const k=await p.evaluate(()=>S.doc.key);await reload();s=await p.evaluate(()=>({v:S.view,key:S.doc&&S.doc.key,cur:S.cur,tab:S.tab}));ok(s.v==="work"&&s.key===k&&s.cur===2&&s.tab==="review","paper, page and tab come back: "+JSON.stringify(s));
 // 5. Today
 await p.evaluate(()=>navGo("today"));await p.waitForTimeout(600);await reload();ok(await p.evaluate(()=>S.view)==="lib","Today stays Today");
 // 6. a second tab keeps its own place
 const p2=await ctx.newPage();await p2.goto(p.url());await p2.waitForFunction(()=>{try{return L.docs.length>0}catch(e){return false}});await p2.waitForTimeout(1500);ok(await p2.evaluate(()=>S.view)==="lib","a new tab starts fresh on Today");
 const e2=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e2.length,"no page errors "+e2.join(";"));await ctx.close()})();
