const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 const p2=await ctx.newPage();await p2.goto(p.url());await p.waitForTimeout(2500);
 const ids=await p.evaluate(()=>{const ks=[...L.marksData.keys()].filter(k=>L.marksData.get(k).data.pairs.length);const k=ks[0];const ps=L.marksData.get(k).data.pairs;return[k+"|"+ps[0].id,k+"|"+ps[1].id,k]});
 // revised in tab 1 and tab 2 → both kept
 await p.evaluate(id=>markSeen({id}),ids[0]);await p2.evaluate(id=>markSeen({id}),ids[1]);await p.waitForTimeout(1800);
 const sn=await p.evaluate(async ids=>{const s=await DB.get("kv","seen");return[!!s[ids[0]],!!s[ids[1]]]},ids);ok(sn[0]&&sn[1],"'revised' from both tabs kept: "+sn);
 // close right after revising: still saved
 await p.evaluate(()=>{L.seen["zz|1"]=0});await p.evaluate(()=>{markSeen({id:"zz|quick"});dispatchEvent(new Event("pagehide"))});await p.waitForTimeout(400);
 ok(await p.evaluate(async()=>!!(await DB.get("kv","seen"))["zz|quick"]),"revised just before closing is saved");
 // same-question skip in tab 2, then tab 1 saves srs/skip → not lost
 await p2.evaluate(id=>{L.skip=L.skip||{};L.skip[id]="x";kvSave("skip")},ids[0]);await p2.waitForTimeout(900);
 await p.waitForTimeout(300);await p.evaluate(id=>{L.skip[id+"b"]="y";kvSave("skip")},ids[1]);await p.waitForTimeout(900);
 const sk=await p.evaluate(async ids=>{const s=await DB.get("kv","skip");return[!!s[ids[0]],!!s[ids[1]+"b"]]},ids);ok(sk[0]&&sk[1],"'same' marks from both tabs kept: "+sk);
 // plan added in tab 2, then tab 1 ticks/adds → both kept
 await p2.evaluate(()=>planAdd(0,{kind:"ids",label:"TAB2 plan",ids:[]}));await p2.waitForTimeout(600);
 await p.evaluate(()=>planAdd(0,{kind:"ids",label:"TAB1 plan",ids:[]}));await p.waitForTimeout(600);
 const pl=await p.evaluate(async()=>{const s=await DB.get("kv","plans");return Object.values(s).flat().map(i=>i.label)});ok(pl.includes("TAB2 plan")&&pl.includes("TAB1 plan"),"plans from both tabs kept");
 // rename in tab 2, open the paper in tab 1 → name stays
 await p2.evaluate(async k=>{const d=L.docs.find(x=>x.key===k);d.name="RENAMED IN TAB2.pdf";await DB.put("docs",k,d)},ids[2]);await p.waitForTimeout(600);
 await p.evaluate(async k=>{const d=L.docs.find(x=>x.key===k);await openDoc({kind:"lib",key:d.key,name:d.name,size:d.size})},ids[2]);await p.waitForTimeout(600);
 ok(await p.evaluate(async k=>(await DB.get("docs",k)).name,ids[2])==="RENAMED IN TAB2.pdf","rename from the other tab is kept after opening the paper");
 // note typed in Revise then closed at once
 await p.evaluate(()=>{showLibrary()});await p.waitForTimeout(500);
 // cleanup
 await p.evaluate(async o=>{const s=await DB.get("kv","seen");delete s["zz|quick"];delete s["zz|1"];await DB.put("kv","seen",s);const k=await DB.get("kv","skip");delete k[o[0]];delete k[o[1]+"b"];await DB.put("kv","skip",k);
   const pl=await DB.get("kv","plans");for(const d of Object.keys(pl))pl[d]=pl[d].filter(i=>!/TAB[12] plan/.test(i.label));await DB.put("kv","plans",pl)},ids);
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await ctx.close()})();
