const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 const files=["Ind_AS_7.pdf","FR RTP N26.pdf","FR Past paper J26.pdf","AFM RTP N26.pdf","MTP1 Questions.pdf","MTP1 Answers.pdf"].map(f=>'/tmp/e2e/pdfs/'+f);
 await p.setInputFiles('#fileIn',files);await p.waitForFunction(n=>L.docs.length===n&&document.querySelectorAll(".card").length>0,files.length+1,{timeout:90000});await p.evaluate(()=>{L.showAll=true;renderLibMain()});
 await p.evaluate(async()=>{await addFolder("FR");await addFolder("AFM");L.filter="all";L.showAll=true;renderLibrary()});await p.waitForTimeout(200);
 const move=async(name,sub)=>{await p.click('.card:has(.cname:text-is("'+name+'")) [data-act=menu]');await p.click('#menu [data-m=mv]:has-text("'+sub+'")');await p.waitForTimeout(120)};
 for(const n of ["Ind_AS_7","FR RTP N26","FR Past paper J26"])await move(n,"FR");for(const n of ["AFM RTP N26","MTP1 Questions","MTP1 Answers"])await move(n,"AFM");
 const findIn=async name=>{await p.click('.card:has(.cname:text-is("'+name+'")) [data-act=open]');await p.waitForSelector("canvas.pc");await p.click("#autoBtn");await p.click("#adGo");
   await p.waitForFunction(()=>!document.querySelector("#sbar").hidden||document.querySelector("#adRes .res"),null,{timeout:180000});
   const r=await p.evaluate(()=>({sugg:(S.sugg||[]).length,res:(document.querySelector("#adRes .res")||{}).innerText||""}));if(r.sugg){await p.click('#sbar [data-s=accept]')}return r};
 for(const n of ["Ind_AS_7","FR RTP N26","FR Past paper J26","AFM RTP N26"]){const r=await findIn(n);ok(r.sugg>0,"Find in "+n+": "+r.sugg+" suggestions accepted");await p.click("#backBtn");await p.waitForTimeout(600)}
 // MTP: questions only → join with answers
 const r=await findIn("MTP1 Questions");ok(/no answers in this PDF/.test(r.res),"MTP questions-only paper offers to join with the answer PDF");
 ok((await p.inputValue("#adComb")).startsWith("MTP1 Answers"),"answer PDF is the first choice");
 await p.click("#adCombGo");await p.waitForFunction(()=>S.doc&&/Q\+A/.test(S.doc.name)&&!document.querySelector("#sbar").hidden,null,{timeout:180000});
 const mt=await p.evaluate(()=>({name:S.doc.name,n:S.sugg.length,withA:S.sugg.filter(s=>s.a.length).length}));ok(mt.n===37&&mt.withA===37,"joined PDF found "+mt.n+" (all with answers): "+mt.name);
 await p.click('#sbar [data-s=accept]');await p.click("#backBtn");await p.waitForTimeout(600);
 ok(await p.evaluate(()=>{const d=L.docs.find(x=>/Q\+A/.test(x.name));return d&&srcOf(d.key,d.name)==="mtp"&&L.folders.find(f=>f.id===d.folder).name==="AFM"}),"joined PDF keeps MTP source and AFM subject");
 // ---- Bank
 await p.click("#nav [data-nav=lib]");await p.waitForSelector("#vBank:not([hidden]) .brw",{timeout:120000});
 const tot=await p.evaluate(()=>BK.items.length);ok(tot>100,"Question Bank lists all "+tot+" questions");
 ok(await p.evaluate(()=>BK.items.every(it=>it.tq&&it.tq.length>5)),"every question has its text read");
 await p.click('#bkSub [data-sub]:has-text("FR")');const fr=await p.evaluate(()=>BK.list.length);ok(fr<tot&&fr>40,"Subject filter FR: "+fr);
 await p.click('#bkSrc [data-src=rtp]');const frRtp=await p.evaluate(()=>BK.list.length);ok(frRtp===20,"Source RTP within FR: "+frRtp);
 await p.click('#bkClearAll');ok(await p.evaluate(()=>BK.list.length)===tot,"Clear all filters");
 const paperKey=await p.evaluate(()=>BK.docs.find(d=>/Ind_AS_7/.test(d.name)).key);await p.selectOption("#bkPaper",paperKey);ok(await p.evaluate(()=>BK.list.length)===17,"Paper filter: Ind AS 7 → 17");
 await p.selectOption("#bkPaper","all");
 await p.fill("#bkQ","cash flow");await p.waitForTimeout(400);const cf=await p.evaluate(()=>BK.list.length);ok(cf>0&&cf<tot,"search 'cash flow': "+cf);await p.fill("#bkQ","");await p.waitForTimeout(400);
 const tops=await p.$$eval("#bkTopics .fr .nm",e=>e.map(x=>x.textContent));console.log("  topics:",tops.slice(0,8).join(" | "),"…",tops.length);
 ok(tops.includes("Ind AS 7: Statement of Cash Flows"),"module questions carry the Ind AS 7 topic");
 await p.fill("#bkTopicQ","cash");ok(await p.evaluate(()=>[...document.querySelectorAll("#bkTopics .fr")].filter(b=>!b.hidden).length)>=1,"topic search narrows the list");await p.fill("#bkTopicQ","");
 await p.click('#bkTopics [data-tag="Ind AS 7: Statement of Cash Flows"]');{const v=await p.evaluate(()=>[BK.list.length,[...BK.f.topics]]);ok(v[0]===18,"topic filter (17 module + 1 RTP) "+JSON.stringify(v))};await p.click("#bkTopClr");
 // bulk tagging
 await p.click('#bkSrc [data-src=pyq]');await p.check("#bkAll");ok(await p.locator("#bkTagPick").count()===1,"bulk bar appears after selecting");
 const bopts=await p.$$eval("#bkTagPick option",o=>o.map(x=>x.value));ok(bopts.length>2&&bopts.includes("__new"),"bulk bar lists this subject's topics ("+(bopts.length-2)+") plus New topic");
 await p.selectOption("#bkTagPick","__new");ok(await p.isVisible("#bkTagIn"),"New topic shows the name box");await p.fill("#bkTagIn","Exam 2026");await p.click("#bkTagAdd");await p.waitForTimeout(300);ok(await p.evaluate(()=>BK.items.filter(it=>(it.p.tags||[]).includes("Exam 2026")).length)===29,"Add tag to 29 past-paper questions");
 await p.check("#bkAll");await p.selectOption("#bkTagRm","Exam 2026");await p.waitForTimeout(300);ok(await p.evaluate(()=>BK.items.filter(it=>(it.p.tags||[]).includes("Exam 2026")).length)===0,"Remove tag from them");
 await p.locator("#bkMain input[data-sel]").first().check();await p.click("#bkStarSel");await p.waitForTimeout(200);await p.click('#bkSrc [data-src=all]');
 await p.click("#bkStar");{const v=await p.evaluate(()=>[BK.list.length,BK.items.filter(i=>i.p.star).length,BK.f.star]);ok(v[0]===3,"★ Important filter (1 new + 2 sample) "+JSON.stringify(v))};await p.click("#bkStar");
 // slides
 await p.locator("#bkMain .bo").first().click();await p.waitForSelector("#bkMain .bslide .crop canvas.img");ok(await p.evaluate(()=>BK.view)==="slides","clicking a question opens Slides");
 await p.keyboard.press("ArrowRight");await p.waitForTimeout(300);ok((await p.textContent("#bkMain .pos")).startsWith("2 /"),"→ next question in Slides");
 await p.check("#bkHide");ok(await p.locator("#bkMain .ap.hidden").count()===1,"Hide answers in Slides");await p.keyboard.press(" ");ok(await p.locator("#bkMain .ap.hidden").count()===0,"Space reveals");
 await p.keyboard.press("2");const cv=p.locator("#bkMain .qp .crop .hl").first();await cv.waitFor();await p.waitForTimeout(400);const cb=await cv.boundingBox();
 await p.mouse.move(cb.x+15,cb.y+cb.height/2);await p.mouse.down();await p.mouse.move(cb.x+cb.width*.5,cb.y+cb.height/2,{steps:5});await p.mouse.up();await p.waitForTimeout(300);
 ok(await p.evaluate(()=>{const it=BK.list[BK.rc];return Object.values(it.data.marks||{}).some(a=>a.length)}),"highlighting works in Slides and is saved");await p.keyboard.press("Escape");
 await p.locator('#bkMain [data-n=edit]').click();await p.fill("#bkMain .subtin","Slides subtopic");await p.fill("#bkMain .notearea","bank note");await p.locator('#bkMain .tagnew').fill("Tricky");await p.press('#bkMain .tagnew',"Enter");await p.click('#bkMain [data-n=done]');await p.waitForTimeout(300);ok(await p.evaluate(()=>BK.list[BK.rc].p.subt==="Slides subtopic")&&await p.locator("#bkMain .tchip.subt").count()===1,"subtopic set from the Slides panel is saved and shown");
 {const v=await p.evaluate(()=>{const it=BK.list[BK.rc];return [it.p.note,it.p.tags]});ok(v[0]==="bank note"&&v[1].includes("Tricky"),"note and tag from Slides saved "+JSON.stringify(v))};
 await p.click('#bkMain [data-act=paper]');await p.waitForSelector("#vMark:not([hidden]) canvas.pc");ok((await p.textContent("#backLbl"))==="Question Bank","Open in paper, back button says Question Bank");
 await p.click("#backBtn");await p.waitForSelector("#vBank:not([hidden])");ok(true,"back returns to the Question Bank");
 // repeats
 await p.click("#nav [data-nav=rep]");await p.waitForTimeout(300);ok(await p.locator("#bkMain .rpw").count()>=1,"Repeats view renders: "+(await p.textContent("#bkSum")));
 await p.click("#nav [data-nav=lib]");
 // Suggest topics
 await p.click('#bkSide [data-autotag]');await p.waitForFunction(()=>/Suggestions for/.test(document.querySelector("#gBody").innerText));const sugN=await p.locator("#gBody .atr").count();ok(sugN>0,"Suggest topics lists "+sugN+" untagged questions");
 await p.locator("#gBody [data-av]").first().click();await p.waitForSelector("#gBody .atp .crop");ok(true,"View question shows the question image");
 const sa=p.locator("#gBody .atp [data-ans]");if(await sa.count()){await sa.click();await p.waitForTimeout(500);ok(await p.locator("#gBody .atp .plab:text-is('Answer')").count()===1,"Show answer in preview")}
 await p.click('#gBody [data-at=none]');const sel=p.locator("#gBody select[data-as]").first();const opts=await sel.locator("option").allTextContents();await sel.selectOption({index:1});
 const before=await p.evaluate(()=>BK.items.filter(it=>!(it.p.tags||[]).length).length);await p.click("#atGo");await p.waitForTimeout(500);
 ok(await p.evaluate(b=>BK.items.filter(it=>!(it.p.tags||[]).length).length===b-1,before),"Apply tags exactly the 1 ticked question");
 // Re-check
 await p.click('#bkSide [data-autotag]');await p.click('#gBody [data-amode=check]');await p.waitForFunction(()=>/Checked \d+ tagged/.test(document.querySelector('#gBody').innerText)&&document.querySelector('#busy').hidden,null,{timeout:60000});ok(true,"Re-check tagged runs: "+(await p.locator("#gBody .atr").count())+" flagged");await p.keyboard.press("Escape");
 // Manage topics
 await p.click('#bkSub [data-sub]:has-text("FR")');await p.waitForTimeout(200);await p.click("#bkManage");await p.waitForSelector("#mtAdd");
 await p.fill("#mtAdd","1. Ind AS 116: Leases\n• Ind AS 109: Financial Instruments\nind as 7 statement of cash flows");await p.click("#mtAddGo");await p.waitForTimeout(300);
 ok(/Added 1 topic · 2 already there/.test(await p.textContent("#toast")),"bulk add: "+await p.textContent("#toast"));
 ok(await p.locator(".mt-cov").count()===1,"Ind AS check shows: "+(await p.textContent(".mt-cov .mt-ah span")));
 await p.click("#mtAddMiss");await p.waitForTimeout(300);ok(/37 of 37/.test(await p.textContent(".mt-cov .mt-ah span")),"Add missing fills the list");
 const ri=p.locator('#gBody input[data-ri]').filter({hasText:""});const idx=await p.evaluate(()=>[...document.querySelectorAll("#gBody input[data-ri]")].findIndex(i=>i.value==="Tricky"));
 await p.locator('#gBody input[data-ri]').nth(idx).fill("Tricky ones");await p.locator('#gBody input[data-ri]').nth(idx).press("Enter");await p.waitForTimeout(300);
 ok(await p.evaluate(()=>BK.items.some(it=>(it.p.tags||[]).includes("Tricky ones"))&&!BK.items.some(it=>(it.p.tags||[]).includes("Tricky"))),"rename a topic");
 const di=await p.evaluate(()=>[...document.querySelectorAll("#gBody input[data-ri]")].findIndex(i=>i.value==="Tricky ones"));
 await p.locator('#gBody [data-del]').nth(di).click();await p.locator('#gBody [data-del]').nth(di).click();await p.waitForTimeout(300);ok(await p.evaluate(()=>!BK.items.some(it=>(it.p.tags||[]).includes("Tricky ones"))),"delete a topic (with confirm)");
 const ck=await p.evaluate(()=>[...document.querySelectorAll("#gBody input[data-ri]")].map((i,k)=>[i.value,k]).filter(x=>/Ind AS (29|114)\b/.test(x[0])).map(x=>x[1]));for(const k of ck)await p.locator('#gBody input[data-ck]').nth(k).check();
 await p.click("#mtDelSel");await p.click("#mtDelSel");await p.waitForTimeout(300);ok(await p.evaluate(()=>!savedTopics("all").some(x=>/Ind AS (29|114)\b/.test(x))),"Delete selected removes 2 topics from the list");
 await p.click("#mtCopy");await p.waitForTimeout(200);ok(/Copied|Names put/.test(await p.textContent("#toast")),"Copy names: "+await p.textContent("#toast"));
 await p.keyboard.press("Escape");
 // dropdown includes single-use + saved topics
 await p.click('#bkSide [data-autotag]');await p.waitForSelector("#gBody select[data-as]");const o2=await p.locator("#gBody select[data-as]").first().locator("option").allTextContents();
 ok(o2.some(x=>/Ind AS 10: Events/.test(x)),"Suggest dropdown includes saved topics like Ind AS 10");await p.keyboard.press("Escape");
 // bank export
 for(const g of ["bxTopic","bxPaper"]){await p.click("#bkExport");await p.click("#"+g);const [dl]=await Promise.all([p.waitForEvent("download",{timeout:120000}),p.click("#bxGo")]);const pdf=await p.evaluate(()=>__lastPdf);
   ok(pdf.images>100,"bank export ("+g+"): "+dl.suggestedFilename()+" · "+pdf.images+" images");await p.click("#gClose")}
 await p.screenshot({path:"/tmp/e2e/s4_bank.png"});
 // index uses the top search box (no second box)
 await p.click("#bkClearAll").catch(()=>{});await p.click("#bkVIdx");await p.waitForTimeout(300);
 ok(await p.locator("#ixQ").count()===0&&await p.locator(".bfil .search input").count()===1,"Index has a single search box (the top one)");
 const xtot=await p.locator("#ixBody tbody tr").count();const xword=await p.evaluate(()=>{const it=BK.list.find(x=>(x.tq||"").split(/\s+/).length>12);return it.tq.split(/\s+/).filter(w=>/^[A-Za-z]{6,}$/.test(w))[1]});
 await p.fill("#bkQ",xword);await p.waitForTimeout(500);const xhit=await p.locator("#ixBody tbody tr").count();
 ok(xhit>0&&xhit<xtot,"top search “"+xword+"” narrows the Index from "+xtot+" to "+xhit+" rows");
 await p.evaluate(()=>{const it=BK.list[0];it.p.desc="zebra crossing note";});await p.fill("#bkQ","zebra crossing");await p.waitForTimeout(500);ok(await p.locator("#ixBody tbody tr").count()===1,"top search finds a question by its description");
 await p.fill("#bkQ",xword);await p.waitForTimeout(500);
 const [dl2]=await Promise.all([p.waitForEvent("download"),p.click("#ixCsv")]);const csv2=fs.readFileSync(await dl2.path(),"utf8");ok(csv2.trim().split("\n").length===xhit+1,"Excel download has only the "+xhit+" searched rows");
 // study mode
 await p.click("#bkStudy");await p.waitForTimeout(1200);
 const xst=await p.evaluate(()=>({study:document.body.classList.contains("study"),top:getComputedStyle(document.querySelector(".top")).display,side:getComputedStyle(document.querySelector("#bkSide")).display,fil:getComputedStyle(document.querySelector(".bfil")).display,pos:((document.querySelector("#bkMain .rvpos span")||{}).textContent||"").trim(),zoomUI:document.querySelectorAll("#bkMain .zm").length}));
 ok(xst.study&&xst.top==="none"&&xst.side==="none"&&xst.fil==="none","Study hides the header, filters and toolbar");
 ok(xst.pos==="1 / "+xhit,"Study goes through just the searched questions: "+xst.pos);ok(xst.zoomUI===0,"no in-pane zoom controls");
 ok(await p.evaluate(()=>[...document.styleSheets].every(s=>{try{return[...s.cssRules].every(r=>!/touch-action:\s*pan/.test(r.cssText))}catch(_){return true}})),"nothing blocks the browser's own pinch-zoom on the slides");
 await p.keyboard.press("Space");await p.waitForTimeout(300);ok(await p.evaluate(()=>!document.querySelector("#bkMain .ap.hidden")),"Space shows the answer");
 if(xhit>1){await p.keyboard.press("ArrowRight");await p.waitForTimeout(800);ok((await p.textContent("#bkMain .rvpos span")).trim().startsWith("2 /"),"→ goes to the next question")}
 await p.keyboard.press("Escape");await p.waitForTimeout(500);ok(await p.evaluate(()=>!document.body.classList.contains("study")&&BK.view==="idx"),"Esc leaves Study and returns to the Index");
 await p.click("#nav [data-nav=lib]");await p.click("#bkStudy");await p.waitForTimeout(800);await p.click('#bkMain [data-act=studyx]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>!document.body.classList.contains("study")&&(BK.view==="list"||BK.view==="idx")),"Exit button leaves Study (back to the same Library view)");
 await p.fill("#bkQ","");await p.waitForTimeout(300);
 // mobile
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);await p.click("#bkFilt");ok(await p.evaluate(()=>document.querySelector(".bank").classList.contains("side-open")),"mobile: Filters opens the drawer");
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);ok(!ov,"mobile: no sideways scrolling");await p.screenshot({path:"/tmp/e2e/s5_mobile.png"});await p.click("#bkSideX");
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).join("\n")||"no page errors");await b.close()})();
