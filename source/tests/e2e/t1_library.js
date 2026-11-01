const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{const {b,p,errs}=await launch();
 const files=fs.readdirSync('/tmp/e2e/pdfs').map(f=>'/tmp/e2e/pdfs/'+f);
 await p.setInputFiles('#fileIn',files);await p.waitForFunction(n=>L.docs.length===n&&document.querySelectorAll(".card").length>0,files.length+1,{timeout:60000});await p.evaluate(()=>{L.showAll=true;renderLibMain()});
 ok(true,"imported "+files.length+" PDFs");
 const srcs=await p.evaluate(()=>L.docs.map(d=>d.name+" → "+srcOf(d.key,d.name)));console.log("  "+srcs.join("\n  "));
 ok(await p.evaluate(()=>L.docs.every(d=>d.thumb&&d.pages>0)),"every paper has a thumbnail and page count");
 // re-import duplicate
 await p.setInputFiles('#fileIn',[files[0],files[1]]);await p.waitForTimeout(800);ok((await p.textContent("#toast")).includes("already in your library"),"duplicate import is skipped: "+await p.textContent("#toast"));
 // subjects
 await p.selectOption("#pdfSub","__new");await p.fill("#nsIn","FR");await p.press("#nsIn","Enter");await p.waitForTimeout(200);
 await p.selectOption("#pdfSub","all");await p.evaluate(()=>{L.showAll=true;renderLibMain()});await p.selectOption("#pdfSub","__new");await p.fill("#nsIn","AFM");await p.click("#menu [data-ns=ok]");await p.waitForTimeout(200);
 ok(await p.evaluate(()=>L.folders.map(f=>f.name).join(","))==="FR,AFM","two subjects created");
 await p.selectOption("#pdfSub","all");await p.evaluate(()=>{L.showAll=true;renderLibMain()});
 const move=async(name,sub)=>{await p.click('.card:has(.cname:text-is("'+name+'")) [data-act=menu]');await p.click('#menu [data-m=mv]:has-text("'+sub+'")');await p.waitForTimeout(150)};
 for(const n of ["Ind_AS_7","FR RTP N26","FR Past paper J26"])await move(n,"FR");
 for(const n of ["AFM RTP N26","AFM Past paper J26","MTP1 Questions","MTP1 Answers"])await move(n,"AFM");
 const fr=await p.evaluate(()=>L.folders.find(f=>f.name==="FR").id);await p.selectOption("#pdfSub","f:"+fr);await p.evaluate(()=>{L.showAll=true;renderLibMain()});
 ok(await p.locator(".card").count()===3,"FR subject shows its 3 papers");
 await p.selectOption("#pdfSub","unsorted");await p.evaluate(()=>{L.showAll=true;renderLibMain()});ok(await p.locator(".card").count()===files.length+1-7,"Unsorted shows only the unmoved papers");
 await p.selectOption("#pdfSub","all");await p.evaluate(()=>{L.showAll=true;renderLibMain()});
 // source type change
 await p.click('.card:has(.cname:text-is("Ind_AS_7")) [data-act=menu]');await p.click('#menu [data-m=src][data-s=module]');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const d=L.docs.find(d=>d.name==="Ind_AS_7.pdf");return srcOf(d.key,d.name)==="module"}),"source set to Module");
 // rename
 await p.click('.card:has(.cname:text-is("AFM RTP N26")) [data-act=menu]');await p.click('#menu [data-m=rename]');await p.fill("#mName","AFM RTP Nov 26");await p.press("#mName","Enter");await p.waitForTimeout(200);
 ok(await p.locator('.cname:text-is("AFM RTP Nov 26")').count()===1,"paper renamed");
 // search by name
 await p.fill("#libSearch","mtp1");await p.waitForTimeout(200);ok(await p.locator(".card").count()===2,"search by name finds 2 MTP papers");await p.fill("#libSearch","");
 // folder menu: rename + colour
 await p.selectOption("#pdfSub","f:"+fr);await p.evaluate(()=>{L.showAll=true;renderLibMain()});await p.click('[data-act=fmenu]');await p.click('#menu [data-m=col] >> nth=2');await p.waitForTimeout(150);
 await p.click('[data-act=fmenu]');await p.click('#menu [data-m=rename]');await p.fill("#mName","Financial Reporting");await p.press("#mName","Enter");await p.waitForTimeout(200);
 ok(await p.evaluate(()=>L.folders[0].name==="Financial Reporting"&&L.folders[0].color==="#c2410c"),"subject renamed and recoloured");
 await p.screenshot({path:"/tmp/e2e/s1_lib.png"});
 // delete + undo
 await p.selectOption("#pdfSub","all");await p.evaluate(()=>{L.showAll=true;renderLibMain()});const before=await p.locator(".card").count();
 await p.click('.card:has(.cname:text-is("Motion – practice set B (sample)")) [data-act=menu]');await p.click('#menu [data-m=delete]');await p.click('#menu [data-m=doDel]');await p.waitForTimeout(400);
 ok(await p.locator(".card").count()===before-1,"paper deleted");await p.click("#tUndo");await p.waitForTimeout(600);ok(await p.locator(".card").count()===before,"undo brings it back");
 // persistence across reload
 await p.reload();await p.waitForFunction(()=>document.querySelectorAll(".card").length>0);ok(await p.evaluate(n=>L.docs.length===n&&L.folders.length===2,files.length+1),"library survives reload");
 fs.writeFileSync("/tmp/e2e/state_ok","1");
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).join("\n")||"no page errors");await b.close()})();
