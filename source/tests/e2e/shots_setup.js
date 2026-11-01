const {open}=require('./shotlib');
(async()=>{require('fs').rmSync("/tmp/e2e/profile",{recursive:true,force:true});const {ctx,p}=await open();p.setDefaultTimeout(120000);
 const files=["Ind_AS_7.pdf","FR RTP N26.pdf","FR Past paper J26.pdf","AFM RTP N26.pdf"].map(f=>'/tmp/e2e/pdfs/'+f);
 await p.setInputFiles('#fileIn',files);await p.waitForFunction(n=>document.querySelectorAll(".card").length===n,files.length+1);
 await p.click("#addFolder2");await p.fill("#nfIn","FR");await p.press("#nfIn","Enter");await p.click("[data-f=all]");await p.click("#addFolder");await p.fill("#nfIn","AFM");await p.press("#nfIn","Enter");await p.click("[data-f=all]");await p.waitForTimeout(200);
 const move=async(name,sub)=>{await p.click('.card:has(.cname:text-is("'+name+'")) [data-act=menu]');await p.click('#menu [data-m=mv]:has-text("'+sub+'")');await p.waitForTimeout(120)};
 for(const n of ["Ind_AS_7","FR RTP N26","FR Past paper J26"])await move(n,"FR");await move("AFM RTP N26","AFM");
 for(const n of ["Ind_AS_7","FR RTP N26","FR Past paper J26","AFM RTP N26"]){await p.click('.card:has(.cname:text-is("'+n+'")) [data-act=open]');await p.waitForSelector("canvas.pc");await p.click("#autoBtn");await p.click("#adGo");
   await p.waitForFunction(()=>!document.querySelector("#sbar").hidden||document.querySelector("#adRes .res"));if(await p.evaluate(()=>(S.sugg||[]).length))await p.click('#sbar [data-s=accept]');await p.click("#backBtn");await p.waitForTimeout(600)}
 // tag a few, star a few, subtopics
 await p.evaluate(async()=>{for(const [k,v] of L.marksData){if(!v||!v.data)continue;const d=L.docs.find(x=>x.key===k);v.data.pairs.forEach((pr,i)=>{if(/Ind_AS_7/.test(d.name)){pr.tags=["Ind AS 7: Statement of Cash Flows"];if(i%3===0)pr.subt=i%2?"Operating activities":"Investing activities"}else if(i%4===0)pr.tags=["Ind AS 115: Revenue"];if(i%5===1)pr.star=true});await saveDocData(k,v.data)}});
 console.log("setup done",await p.evaluate(()=>L.docs.length));await ctx.close()})();
