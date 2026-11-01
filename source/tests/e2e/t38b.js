const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 for(const [f,q,a] of [["FR RTP N26.pdf","(1","1."]]){
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/'+f]);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m=kw]');await p.fill("#adKq",q);await p.fill("#adKa",a);
 await p.click("#adGo");await p.waitForTimeout(3000);await p.waitForSelector("#sbar:not([hidden])",{timeout:120000}).catch(()=>{});
 const info=await p.evaluate(()=>({n:(S.sugg||[]).length,orphans:S.suggInfo&&S.suggInfo.orphans,orph:S.suggInfo&&S.suggInfo.orph&&S.suggInfo.orph.map(o=>o.num+"@p"+o.parts[0].page).slice(0,5),res:(document.querySelector("#adRes")||{}).innerText}));console.log(f,JSON.stringify(info).slice(0,400));
 await p.evaluate(()=>{S.sugg=[];if(!$("#gModal").hidden)gmClose();refreshAll()});await p.click("#backBtn").catch(()=>{});await p.waitForTimeout(500)}
 await b.close()})();
