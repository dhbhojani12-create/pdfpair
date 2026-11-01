const {open}=require('./shotlib');
(async()=>{const {ctx,p}=await open();p.setDefaultTimeout(120000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs_dup/FR RTP M25 (copy).pdf']);await p.waitForTimeout(3000);
 if(!(await p.isVisible("canvas.pc"))){await p.evaluate(()=>{L.filter="all";renderLibrary()});await p.click('.card:has(.cname:text-is("FR RTP M25 (copy)")) [data-act=open]')}await p.waitForSelector("canvas.pc");await p.click("#autoBtn");await p.click("#adGo");
 await p.waitForFunction(()=>!document.querySelector("#sbar").hidden||document.querySelector("#adRes .res"));if(await p.evaluate(()=>(S.sugg||[]).length))await p.click('#sbar [data-s=accept]');await p.click("#backBtn");await p.waitForTimeout(800);
 await p.evaluate(async()=>{const d=L.docs.find(x=>/copy/.test(x.name));const fr=L.folders.find(f=>f.name==="FR");d.folder=fr.id;await DB.put("docs",d.key,d);try{L.sources[d.key]="pyq";await DB.put("kv","sources",L.sources)}catch(_){}});
 await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");console.log("groups",await p.evaluate(()=>BK.groups.length));await ctx.close()})();
