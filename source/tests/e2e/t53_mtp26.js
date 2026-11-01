const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(120000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/MTP1M26 QA.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000});
 const r=await p.evaluate(()=>({n:S.sugg.length,withA:S.sugg.filter(s=>s.a.length).length,labels:S.sugg.map(s=>s.label).join(","),orph:(S.suggInfo&&S.suggInfo.orphans)||0,chk:document.querySelector("#sbar .chkbtn")?document.querySelector("#sbar .chkbtn").innerText:""}));
 ok(r.n===13&&r.withA===13,"Find (Auto) on your MTP1M26 finds 13 questions, all with answers: "+JSON.stringify(r));
 const e=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e.length,"no page errors");await b.close()})();
