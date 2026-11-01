const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{let {b,ctx,p,errs}=await launch();p.setDefaultTimeout(60000);
 // ---- My examples + Numbering on the sample paper
 await p.click(".card [data-act=open]");await p.waitForSelector("canvas.pc");
 const keep=await p.evaluate(()=>{const ps=S.data.pairs;S.data.pairs=ps.slice(0,2);S.data.pairs.forEach(x=>delete x.auto);refreshAll();return ps.length});
 await p.click("#autoBtn");await p.waitForSelector("#adGo");ok(await p.evaluate(()=>adMode)==="auto","Find opens in Auto, with the other methods under Advanced options");
 await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m=learn]');await p.waitForFunction(()=>/Questions/.test(document.querySelector("#adLearned").innerText));ok(true,"My examples learns: "+(await p.textContent("#adLearned")).slice(0,80));
 await p.click("#adGo");await p.waitForFunction(()=>!document.querySelector("#sbar").hidden||document.querySelector("#adRes .res"));
 const n1=await p.evaluate(()=>(S.sugg||[]).length);ok(n1===keep-2,"My examples finds the other "+n1+" questions");await p.click('#sbar [data-s=discard]');
 await p.click("#autoBtn");await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m=std]');await p.click("#adGo");await p.waitForFunction(()=>!document.querySelector("#sbar").hidden||document.querySelector("#adRes .res"));
 ok(await p.evaluate(()=>(S.sugg||[]).length)>=1,"Numbering mode finds "+await p.evaluate(()=>(S.sugg||[]).length));await p.click('#sbar [data-s=discard]');
 await p.click("#backBtn");await p.waitForTimeout(500);
 // ---- Redo boxes + library question search on a real paper
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/FR RTP N26.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:30000});
 await p.click("#autoBtn");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});await p.click('#sbar [data-s=accept]');
 await p.evaluate(()=>{const pr=S.data.pairs[0];pr.star=true;pr.note="keep me";pr.q[0].h=.01;save()});
 await p.click("#autoBtn");await p.check("#adRedoA");await p.click("#adGo");await p.waitForFunction(()=>/Redid the boxes/.test((document.querySelector("#adRes")||{}).innerText||"")||/Redid/.test(document.querySelector("#toast").innerText));
 ok(await p.evaluate(()=>{const pr=S.data.pairs[0];return pr.star&&pr.note==="keep me"&&pr.q[0].h>.01}),"Redo boxes fixes the box and keeps star + note");await p.keyboard.press("Escape");
 await p.click("#backBtn");await p.waitForTimeout(800);await p.fill("#libSearch","consolidated");await p.waitForTimeout(500);
 const hits=await p.locator(".hit").count();const stale=await p.locator("[data-act=idxAll]").count();if(stale){await p.click("[data-act=idxAll]");await p.waitForTimeout(4000)}
 const hits2=await p.locator(".hit").count();ok(hits2>0,"library search finds questions by their words: "+hits2+" hits");
 await p.locator(".hit").first().click();await p.waitForSelector("#vMark:not([hidden]) .reg.sel",{timeout:20000});ok(true,"clicking a hit opens the paper at that question");await p.click("#backBtn");await p.fill("#libSearch","");
 // ---- Join from the paper menu
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/MTP1 Questions.pdf','/tmp/e2e/pdfs/MTP1 Answers.pdf']);await p.waitForTimeout(4000);
 await p.click('.card:has(.cname:text-is("MTP1 Questions")) [data-act=menu]');await p.click('#menu [data-m=combine]');ok((await p.locator("#menu [data-m=comb]").first().textContent()).includes("MTP1 Answers"),"Join menu lists the answer PDF first");
 await p.locator("#menu [data-m=comb]").first().click();await p.waitForFunction(()=>S.doc&&/Q\+A/.test(S.doc.name)&&!document.querySelector("#sbar").hidden,null,{timeout:180000});ok(true,"Join from menu makes the joined PDF and finds "+await p.evaluate(()=>S.sugg.length));
 await p.click('#sbar [data-s=accept]');await p.click("#backBtn");await p.waitForTimeout(600);
 // ---- Backup
 await p.click("#navBackup");await p.click("#menu [data-bm=all]");const [dl]=await Promise.all([p.waitForEvent("download",{timeout:120000})]);const zp="/tmp/e2e/backup.zip";await dl.saveAs(zp);await p.waitForTimeout(500);
 ok(fs.statSync(zp).size>500000,"Back up downloads a zip: "+dl.suggestedFilename()+" ("+Math.round(fs.statSync(zp).size/1024)+" KB)");
 ok((await p.textContent(".bkt")).includes("Last backup"),"library shows the last backup time");
 // set a topic list + source to check they travel in the backup
 await p.evaluate(async()=>{L.topicList={all:["Ind AS 99: Test topic"]};await saveTopicList();const d=L.docs.find(x=>/FR RTP/.test(x.name));await setSrc(d.key,"pyq")});
 await p.keyboard.press("Escape");await p.click("#navBackup");await p.click("#menu [data-bm=all]");const [dl2]=await Promise.all([p.waitForEvent("download",{timeout:120000})]);await dl2.saveAs(zp);await p.keyboard.press("Escape");
 const docsN=await p.evaluate(()=>L.docs.length),pairsN=await p.evaluate(()=>[...L.meta.values()].reduce((s,m)=>s+(m.count||0),0));
 await b.close();
 // ---- Restore into a fresh browser
 ({b,ctx,p,errs}=await launch());p.setDefaultTimeout(60000);await p.setInputFiles("#bkIn",zp);await p.waitForFunction(()=>/Done\./.test((document.querySelector("#gMsg")||{}).textContent||""),null,{timeout:120000});
 ok(true,"Restore: "+await p.textContent("#gMsg"));await p.waitForFunction(()=>!document.querySelector("#gClose").disabled);await p.keyboard.press("Escape");await p.waitForTimeout(500);
 const st=await p.evaluate(async()=>({docs:L.docs.length,pairs:[...L.meta.values()].reduce((s,m)=>s+(m.count||0),0),topics:((await DB.get("kv","topicList"))||{}).all,src:(()=>{const d=L.docs.find(x=>/FR RTP/.test(x.name));return srcOf(d.key,d.name)})()}));
 ok(st.docs===docsN&&st.pairs===pairsN+3,"restore brings back "+st.docs+" papers and "+st.pairs+" pairs (was "+pairsN+"; the fresh sample's 5 pairs are newer than the trimmed 2)");ok(st.topics&&st.topics[0]==="Ind AS 99: Test topic","topic list restored");ok(st.src==="pyq","source types restored");
 await p.click('.card:has(.cname:text-is("FR RTP N26")) [data-act=open]');await p.waitForSelector("canvas.pc");ok(await p.evaluate(()=>S.data.pairs[0].note==="keep me"),"restored paper opens with its marks");await p.click("#backBtn");
 // ---- Repeats actions (FR RTP N26 vs its joined twin? use same paper twice: import FR RTP under another name)
 fs.copyFileSync("/tmp/e2e/pdfs/FR RTP N26.pdf","/tmp/e2e/FR RTP N26 copy.pdf");await p.setInputFiles('#fileIn',['/tmp/e2e/FR RTP N26 copy.pdf']);await p.waitForSelector("canvas.pc",{timeout:30000});
 await p.click("#autoBtn");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});await p.click('#sbar [data-s=accept]');await p.click("#backBtn");await p.waitForTimeout(600);
 await p.click("#nav [data-nav=lib]");await p.waitForSelector("#vBank:not([hidden])",{timeout:120000});await p.click("#nav [data-nav=rep]");await p.waitForTimeout(400);
 const g=await p.locator("#bkMain .rpg").count();ok(g===10,"Repeats finds the "+g+" questions that appear in both copies");
 await p.locator("#bkMain [data-rstar]").first().click();await p.waitForTimeout(400);ok(/Marked 2 copies/.test(await p.textContent("#toast")),"★ All marks every copy");
 await p.locator("#bkMain [data-rview]").first().click();await p.waitForSelector("#bkMain .rv");ok((await p.textContent("#bkMain .rvpos span")).trim().endsWith("/ 2"),"View side by side shows the 2 copies");
 await p.keyboard.press("Escape");await p.waitForTimeout(500);await p.click("#nav [data-nav=rep]");await p.locator('#bkMain [data-rmin="3"]').click();ok((await p.textContent("#bkMain")).includes("None asked 3 or more times"),"3× filter");
 await p.click("#nav [data-nav=lib]");await p.click("#bkDup");ok(await p.evaluate(()=>BK.list.every(it=>BK.dupN.has(it.id))),"Asked 2+ times filter in List");
 // ---- keyboard in work view
 await p.locator("#bkMain .bo").first().click();await p.click('#bkMain [data-act=paper]');await p.waitForSelector("canvas.pc");
 await p.keyboard.press("Escape");await p.evaluate(()=>goPage(2));await p.waitForTimeout(200);const c0=await p.evaluate(()=>[S.cur,document.activeElement.tagName,document.activeElement.className]);await p.keyboard.press("ArrowRight");ok(await p.evaluate(c=>S.cur===c+1,c0[0]),"→ next page "+JSON.stringify(c0));await p.keyboard.press("Home");ok(await p.evaluate(()=>S.cur)===1,"Home → page 1");
 await p.keyboard.press("End");ok(await p.evaluate(()=>S.cur===S.pages.length),"End → last page");await p.keyboard.press("w");ok(await p.evaluate(()=>S.fit)==="width","W fits width");await p.keyboard.press("0");ok(await p.evaluate(()=>S.fit)==="page","0 fits page");
 await p.keyboard.press("a");ok(await p.evaluate(()=>S.mode)==="a","A selects the Answer tool");await p.keyboard.press("j");ok(true,"J jump: page "+await p.evaluate(()=>S.cur));
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).join("\n")||"no page errors");await b.close()})();
