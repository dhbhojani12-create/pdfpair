const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(150000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/Ind_AS_7.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#xrBtn");await p.waitForFunction(()=>xrDoc&&!xrDoc.running,null,{timeout:150000});await p.waitForTimeout(600);
 await p.evaluate(()=>goPage(8));await p.waitForTimeout(1200);
 await p.fill("#xtQ","#.");await p.waitForTimeout(500);
 const n0=await p.evaluate(()=>xrDoc.test.starts.length);ok(n0>3,"numbered lines found: "+n0);
 // select a numbered line on this page
 const idx=await p.evaluate(()=>{const it=xrayBuild(xrDoc,8);return it.findIndex(x=>x.k!=="ignored"&&/^\s*\d+\.\s/.test(x.l.text))});ok(idx>=0,"a numbered line exists on p.8");
 await p.evaluate(i=>{S.xrSel=i;xrayDraw()},idx);await p.waitForTimeout(500);
 const btns=await p.$$eval("[data-xig]",e=>e.map(x=>x.dataset.xig));console.log(JSON.stringify(btns));ok(btns.length===2,"two ignore buttons shown");
 await p.click("[data-xig]:nth-of-type(2)");await p.waitForTimeout(500);
 const r=await p.evaluate(()=>({v:$("#xtI").value,n:xrDoc.test.starts.length}));console.log(JSON.stringify(r));
 ok(r.v==="#."&&r.n<n0,"like-this rule added and starts dropped: "+n0+" → "+r.n);
 // exact
 await p.fill("#xtI","");await p.waitForTimeout(300);
 await p.evaluate(i=>{S.xrSel=i;xrayDraw()},idx);await p.waitForTimeout(400);
 await p.click("[data-xig]:nth-of-type(1)");await p.waitForTimeout(500);
 const r2=await p.evaluate(()=>({v:$("#xtI").value,n:xrDoc.test.starts.length}));ok(r2.n===n0-1||r2.n<n0,"exact line ignored: "+JSON.stringify(r2));
 await p.fill("#xtI","/(a/");await p.waitForTimeout(400);ok(/not valid/.test(await p.textContent("#xtR")),"bad ignore pattern is explained");
 const e=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e.length,"no page errors "+e.join("|").slice(0,300));await b.close()})();
