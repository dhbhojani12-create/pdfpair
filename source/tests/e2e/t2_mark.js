const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{const {b,p,errs}=await launch();
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/Ind_AS_7.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:30000});ok(true,"single import opens the paper");
 ok(await p.evaluate(()=>S.pages.length)>10,"pages loaded: "+await p.evaluate(()=>S.pages.length));
 // ---- Find (ICAI format)
 await p.click("#autoBtn");await p.waitForSelector("#adGo");
 ok(await p.evaluate(()=>adMode)==="exam","Find opens in ICAI format for a module");
 await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});
 const sg=await p.evaluate(()=>({n:S.sugg.length,tags:[...new Set(S.sugg.map(s=>(s.tags||[]).join("+")))],labels:S.sugg.slice(0,3).map(s=>s.label)}));
 ok(sg.n===17,"Find suggests 17 questions: "+sg.n);ok(sg.tags.length===1&&sg.tags[0]==="Ind AS 7: Statement of Cash Flows","all tagged from module name: "+sg.tags);
 await p.click('#sbar [data-s=next]');ok((await p.textContent("#sbar .sgpos"))==="2 of 17","Next steps through suggestions");
 await p.click('#sbar [data-s=prev]');ok((await p.textContent("#sbar .sgpos"))==="1 of 17","Prev goes back");
 const one=await p.evaluate(()=>{const s=S.sugg.find(x=>x.q.length===1);goPage(s.q[0].page);return s.id});await p.waitForTimeout(400);const x=p.locator('#ov .sug.q[data-sg="'+one+'"] .sugx').first();await x.click();ok(await p.evaluate(()=>S.sugg.length)===16,"× on a one-box question removes that suggestion");
 await p.click('#sbar [data-s=accept]');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>S.data.pairs.length)===16,"Accept adds 16 pairs");
 const rows=await p.$$eval("#plist .pi b",bs=>bs.slice(0,3).map(b=>b.textContent));ok(rows.every(r=>!/^QIllus|^QTQ/.test(r)),"side list labels are clean: "+rows.join(", "));
 // ---- manual box drawing
 await p.click("#tabMark");const goEmpty=await p.evaluate(()=>{for(let n=1;n<=S.pages.length;n++){if(!S.data.pairs.some(pr=>pr.q.concat(pr.a).some(r=>r.page===n)))return n}return 1});
 await p.evaluate(n=>goPage(n),goEmpty);await p.waitForTimeout(300);await p.click("#mQ");
 const box=await p.locator("#ov").boundingBox();const drag=async(x0,y0,x1,y1)=>{await p.mouse.move(box.x+box.width*x0,box.y+box.height*y0);await p.mouse.down();await p.mouse.move(box.x+box.width*x1,box.y+box.height*y1,{steps:5});await p.mouse.up();await p.waitForTimeout(150)};
 const n0=await p.evaluate(()=>S.data.pairs.length);
 await drag(.15,.2,.85,.3);ok(await p.evaluate(()=>S.data.pairs.length)===n0+1,"drag draws a question box (page "+goEmpty+")");
 ok(await p.evaluate(()=>S.mode)==="a","Auto Q→A switches to Answer");
 {const pg=await p.evaluate(()=>S.cur);ok(await p.evaluate(()=>S.selId)===null,"new box is not auto-selected");await p.keyboard.press("ArrowRight");await p.waitForTimeout(250);ok(await p.evaluate(()=>S.cur)===pg+1,"→ after drawing turns the page");await p.keyboard.press("ArrowLeft");await p.waitForTimeout(250);ok(await p.evaluate(()=>S.cur)===pg,"← comes back")}
 await drag(.15,.4,.85,.55);ok(await p.evaluate(()=>{const ap=activePair();return ap.q.length===1&&ap.a.length===1}),"answer box joins the same pair");
 await p.keyboard.press("Control+z");ok(await p.evaluate(()=>activePair()&&activePair().a.length)===0,"Ctrl+Z undoes the answer box");
 await p.keyboard.press("Control+y");ok(await p.evaluate(()=>activePair()&&activePair().a.length)===1,"Ctrl+Y redoes it");
 // continue onto next page
 await p.keyboard.press("c");await p.evaluate(()=>goPage(S.cur+1));await p.waitForTimeout(250);
 const box2=await p.locator("#ov").boundingBox();await p.mouse.move(box2.x+box2.width*.15,box2.y+box2.height*.05);await p.mouse.down();await p.mouse.move(box2.x+box2.width*.8,box2.y+box2.height*.12,{steps:4});await p.mouse.up();await p.waitForTimeout(150);
 ok(await p.evaluate(()=>activePair().q.length)===2,"C continues the question onto the next page (2 parts)");
 // select, nudge, delete
 await p.keyboard.press("v");const reg=p.locator("#ov .reg").first();await reg.click({position:{x:20,y:20}});
 const y0=await p.evaluate(()=>findReg(S.selId).r.y);await p.keyboard.press("ArrowDown");ok(await p.evaluate(y=>findReg(S.selId).r.y>y,y0),"arrow key nudges the selected box");
 ok(await p.locator("#insp .ih .tag").count()===1,"inspector shows the selected box");
 const cnt=await p.evaluate(()=>S.data.pairs.flatMap(x=>x.q.concat(x.a)).length);await p.keyboard.press("Delete");ok(await p.evaluate(()=>S.data.pairs.flatMap(x=>x.q.concat(x.a)).length)===cnt-1,"Delete removes the box");
 await p.click("#tUndo");ok(await p.evaluate(()=>S.data.pairs.flatMap(x=>x.q.concat(x.a)).length)===cnt,"toast Undo restores it");
 // change type / belongs to / snap / notes & tags
 await p.locator("#ov .reg").first().click({position:{x:20,y:20}});const side0=await p.evaluate(()=>findReg(S.selId).side);
 await p.click('#insp [data-t='+(side0==="q"?"a":"q")+']');ok(await p.evaluate(s=>findReg(S.selId).side!==s,side0),"Type switch changes Q/A");await p.keyboard.press("Control+z");
 await p.locator("#ov .reg").first().click({position:{x:20,y:20}});
 await p.click("#inSnap");await p.waitForTimeout(400);ok(/fitted|Nothing to trim/.test(await p.textContent("#toast")),"Snap button: "+await p.textContent("#toast"));
 await p.evaluate(()=>{const d=document.querySelector("#insp details.nt");d.open=true});await p.fill("#insp .notearea","Remember: indirect method");await p.locator("#insp .notearea").blur();
 await p.fill("#insp .tagnew","Cash flow");await p.press("#insp .tagnew","Enter");await p.waitForTimeout(150);
 await p.evaluate(()=>{const d=document.querySelector("#insp details.nt");if(d)d.open=true});await p.fill("#insp .subtin","Operating activities");await p.press("#insp .subtin","Enter");await p.waitForTimeout(200);
 ok(await p.evaluate(()=>S.data.pairs.some(x=>x.subt==="Operating activities")),"subtopic typed while marking is saved on the question");
 ok(await p.evaluate(()=>{const pr=activePair();return pr.note==="Remember: indirect method"&&pr.tags.includes("Cash flow")}),"note and new tag saved on the pair");
 // star from list, delete pair from list
 await p.locator("#plist .pi.act [data-act=star]").click();ok(await p.evaluate(()=>activePair().star),"star from list");
 // chapters
 await p.evaluate(()=>goPage(3));await p.keyboard.press("h");await p.waitForSelector("#chNm");await p.fill("#chNm","Cash flows — basics");await p.press("#chNm","Enter");await p.waitForTimeout(150);
 ok(await p.evaluate(()=>S.data.chapters.length===1&&S.data.chapters[0].start===3),"H adds a chapter starting on this page");
 await p.locator("#plist .chh [data-act=chmenu]").first().click();await p.click("#menu [data-m=edit]");await p.fill("#chNm","Basics");await p.fill("#chPg","2");await p.click("#chOk");
 ok(await p.evaluate(()=>S.data.chapters[0].name==="Basics"&&S.data.chapters[0].start===2),"chapter renamed and moved");
 await p.locator("#plist .chh [data-act=chmenu]").first().click();await p.click("#menu [data-m=del]");await p.click("#menu [data-m=doDel]");ok(await p.evaluate(()=>S.data.chapters.length)===0,"chapter removed");
 // zoom & pages
 await p.click("#zIn");const z1=await p.evaluate(()=>S.zoom);await p.click("#zP");ok(await p.evaluate(z=>S.zoom<z&&S.fit==="page",z1),"zoom in, then fit page");
 await p.fill("#pIn","5");await p.press("#pIn","Enter");ok(await p.evaluate(()=>S.cur)===5,"page box jumps to page 5");
 await p.click('#thumbs .th[data-n="2"]');ok(await p.evaluate(()=>S.cur)===2,"thumbnail click goes to page 2");
 await p.screenshot({path:"/tmp/e2e/s2_mark.png"});
 // ---- Review
 await p.click("#tabReview");await p.waitForSelector("#rlist .slide");await p.waitForTimeout(500);
 const pos=await p.textContent("#rlist .pos");ok(/\/ 17$/.test(pos),"Review has one slide per pair: "+pos);
 await p.keyboard.press("ArrowRight");ok((await p.textContent("#rlist .pos")).startsWith("2 /"),"→ next slide");
 await p.check("#hideAns");ok(await p.locator("#rlist .ap.hidden").count()===1,"Hide answers hides the answer");
 await p.keyboard.press(" ");ok(await p.locator("#rlist .ap.hidden").count()===0,"Space reveals it");
 await p.keyboard.press("s");ok(await p.evaluate(()=>S.list[S.rc].p.star),"S stars the slide");
 await p.click("#fStar");ok(await p.evaluate(()=>S.list.length)===2,"★ filter shows the 2 starred");await p.click("#fAll");
 await p.selectOption("#tagSel","Cash flow");ok(await p.evaluate(()=>S.list.length)===1,"tag filter");await p.selectOption("#tagSel","all");
 // highlight + erase
 await p.keyboard.press("1");const hl=p.locator("#rlist .qp .crop .hl").first();await hl.waitFor();const hb=await hl.boundingBox();
 await p.mouse.move(hb.x+20,hb.y+hb.height/2);await p.mouse.down();await p.mouse.move(hb.x+hb.width*.6,hb.y+hb.height/2,{steps:6});await p.mouse.up();
 const rid=await hl.evaluate(c=>c.parentElement.dataset.id);const nm=await p.evaluate(id=>[(S.data.marks[id]||[]).length,S.hl,document.activeElement.tagName+"#"+document.activeElement.id],rid);ok(nm[0]===1,"highlighter draws one stroke "+JSON.stringify(nm));
 const hN=await p.evaluate(()=>S.hist.length);await p.keyboard.press("e");await p.mouse.move(hb.x+5,hb.y+5);await p.mouse.down();await p.mouse.up();
 ok(await p.evaluate(n=>S.hist.length===n,hN),"eraser tap on empty space adds no undo step");
 await p.mouse.move(hb.x+hb.width*.3,hb.y+hb.height/2);await p.mouse.down();await p.mouse.up();ok(await p.evaluate(id=>(S.data.marks[id]||[]).length,rid)===0,"eraser removes the stroke");
 await p.click("#undoR");ok(await p.evaluate(id=>(S.data.marks[id]||[]).length,rid)===1,"Undo brings the stroke back");await p.keyboard.press("Escape");
 await p.screenshot({path:"/tmp/e2e/s3_review.png"});
 // ---- Export
 for(const lay of ["exCont","exSlide"]){await p.click("#exportBtn");await p.check("#"+lay);const [dl]=await Promise.all([p.waitForEvent("download",{timeout:60000}),p.click("#exGo")]);
   const pdf=await p.evaluate(()=>window.__lastPdf);ok(pdf.images>=17&&dl.suggestedFilename().endsWith(".pdf"),lay+" export: "+dl.suggestedFilename()+" · "+pdf.pages+" pages · "+pdf.images+" images");await p.click("#exCancel")}
 await p.click("#exportBtn");await p.check("#exImp");const [dl2]=await Promise.all([p.waitForEvent("download"),p.click("#exGo")]);ok(/important/.test(dl2.suggestedFilename())&&(await p.evaluate(()=>__lastPdf.images))<=8,"Important-only export");await p.click("#exCancel");
 // ---- log
 await p.click("#tabMark");await p.evaluate(()=>{S.selId=null;refreshAll()});ok(await p.evaluate(()=>getComputedStyle(document.querySelector("#insp")).display==="none"),"shortcuts panel gone when nothing selected");await p.click("#keysBtn");ok(await p.isVisible("#menu .keys"),"keyboard button lists shortcuts");await p.click("#menu [data-k=log]");ok((await p.inputValue("#logTa")).includes("BUILT-IN FORMAT"),"Detection log shows the last search");await p.keyboard.press("Escape");
 // ---- back + persistence
 await p.click("#backBtn");await p.waitForSelector("#vLib:not([hidden]) .card");await p.waitForTimeout(800);const meta=await p.textContent(".card:has(.cname:text-is(\"Ind_AS_7\")) .pcmeta");ok(/17 questions/.test(meta),"library card shows 17 pairs: "+meta);
 await p.reload();await p.waitForSelector(".card");await p.click(".card [data-act=open]");await p.waitForSelector("canvas.pc");ok(await p.evaluate(()=>S.data.pairs.length===17&&S.data.pairs.some(x=>x.note)),"marks survive reload");
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).join("\n")||"no page errors");await b.close()})();
