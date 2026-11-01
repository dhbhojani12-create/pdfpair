const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/Ind_AS_7.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});await p.click('#sbar [data-s=accept]');await p.waitForTimeout(500);
 await p.evaluate(()=>{const pr=S.data.pairs[0];pr.ldr=true;pr.tags=["Ind AS 7: Statement of Cash Flows"];save()});await p.evaluate(()=>flushSave());await p.evaluate(()=>showLibrary());await p.waitForTimeout(800);
 // menu before setup
 await p.click("#navBackup");await p.waitForSelector("#menu [data-bm=all]");ok(await p.locator("#menu [data-bm=pick]").count()===1,"Backup menu offers 'Choose a folder' for auto backup");
 ok(/Google Drive/.test(await p.textContent("#menu")),"and explains Google Drive");await p.keyboard.press("Escape");
 // a pretend folder (the real one comes from the folder picker)
 await p.evaluate(()=>{const files={};window.__files=files;AB.dir={name:"PaperPair (Google Drive)",queryPermission:async()=>"granted",requestPermission:async()=>"granted",
   getFileHandle:async(n,o)=>{if(!files[n]&&!(o&&o.create)){const e=new Error("nf");e.name="NotFoundError";throw e}return{getFile:async()=>files[n]||new Blob([]),createWritable:async()=>{const parts=[];return{write:async d=>parts.push(d),close:async()=>{files[n]=new Blob(parts)}}}}}}});
 ok(await p.evaluate(()=>autoBackupRun(true)),"auto backup writes");
 const f1=await p.evaluate(()=>Object.keys(__files).map(k=>k+" "+__files[k].size));ok(f1.length===1&&/^PaperPair auto backup\.zip/.test(f1[0]),"one file: "+f1);
 const inside=await p.evaluate(async()=>{const z=await JSZip.loadAsync(__files["PaperPair auto backup.zip"]);const mf=JSON.parse(await z.file("paperpair.json").async("string"));const k=Object.keys(mf.marks)[0];return{files:Object.keys(z.files),n:mf.marks[k].data.pairs.length,ldr:mf.marks[k].data.pairs[0].ldr,docs:mf.docs.length}});
 ok(inside.files.length===1&&inside.n>5&&inside.ldr===true,"it has the marks (with LDR), no PDFs: "+JSON.stringify(inside));
 await p.evaluate(()=>autoBackupRun(true));ok(await p.evaluate(()=>!!__files["PaperPair auto backup (previous).zip"]),"second run keeps the previous copy");
 // due timing
 ok(!(await p.evaluate(()=>abDue())),"not due right after a backup");ok(await p.evaluate(()=>{AB.last.at-=3*3600e3+1000;return abDue()}),"due after 3 hours");
 // safety: big drop → don't overwrite
 await p.evaluate(()=>{AB.last.n=1000});await p.evaluate(()=>autoBackupRun(true));ok(await p.evaluate(()=>Object.keys(__files).some(k=>/check/.test(k))),"if questions suddenly drop, the good backup is not overwritten");
 // paused
 await p.evaluate(()=>{AB.dir.queryPermission=async()=>"prompt";AB.dir.requestPermission=async()=>"denied"});ok(!(await p.evaluate(()=>autoBackupRun(false))),"without permission it pauses");
 ok(await p.evaluate(()=>$("#navBackup").classList.contains("due")),"and the Backup button shows a dot");await p.click("#navBackup");ok(await p.locator("#menu [data-bm=allow]").count()===1,"menu offers Allow");await p.keyboard.press("Escape");
 // restore after losing everything
 const key=await p.evaluate(()=>L.docs[0].key);const n0=await p.evaluate(async k=>(await DB.get("marks",k)).data.pairs.length,key);
 await p.evaluate(async k=>{await DB.del("marks",k)},key);
 await p.evaluate(async()=>{const f=new File([__files["PaperPair auto backup.zip"]],"PaperPair auto backup.zip");await restoreLibrary(f)});await p.waitForTimeout(800);
 ok(await p.evaluate(async k=>{const r=await DB.get("marks",k);return r&&r.data.pairs.length},key)===n0,"Restore from the auto backup brings back all "+n0+" questions");
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await b.close()})();
