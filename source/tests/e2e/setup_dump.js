const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 const files=["Ind_AS_7.pdf","FR RTP N26.pdf","FR Past paper J26.pdf","AFM RTP N26.pdf","MTP1 Questions.pdf","MTP1 Answers.pdf"].map(f=>'/tmp/e2e/pdfs/'+f);
 await p.setInputFiles('#fileIn',files);await p.waitForFunction(n=>document.querySelectorAll(".card").length===n,files.length+1,{timeout:90000});
 await p.click("#addFolder2");await p.fill("#nfIn","FR");await p.press("#nfIn","Enter");await p.click("[data-f=all]");await p.click("#addFolder");await p.fill("#nfIn","AFM");await p.press("#nfIn","Enter");await p.click("[data-f=all]");await p.waitForTimeout(200);
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
 await p.click("#openBank");await p.waitForSelector("#vBank:not([hidden]) .brw",{timeout:120000});
 await p.evaluate(()=>0);fs.writeFileSync("/tmp/e2e/bank_items.json",JSON.stringify(await p.evaluate(()=>BK.items.map(it=>({id:it.id,key:it.key,name:it.name,src:it.src,sub:it.sub,label:it.label,tq:it.tq,ta:it.ta,tags:it.p.tags||[]})))));
 const ctx=p.context();await ctx.storageState({path:"/tmp/e2e/state.json"});
 // save IndexedDB too
 const dbdump=await p.evaluate(async()=>{const out={};for(const s of ["docs","marks","kv","text"])out[s]=await DB.entries(s);return out});fs.writeFileSync("/tmp/e2e/db_nobytes.json",JSON.stringify(dbdump));
 console.log("dumped");await b.close()})();
