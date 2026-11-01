const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(150000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/MTP1M26 QA.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 await p.click("#xrBtn");await p.waitForFunction(()=>xrDoc&&!xrDoc.running,null,{timeout:150000});await p.waitForTimeout(500);
 const sum=await p.evaluate(()=>{const D=xrDoc;return{err:D.err,n:D.res&&D.res.pairs&&D.res.pairs.length,via:D.res&&D.res.via}});
 ok(!sum.err&&sum.n>=13,"X-ray ran the real Find on the whole paper: "+JSON.stringify(sum));
 // page 9 : Q2(a) continues, Q3(a) starts
 await p.evaluate(()=>goPage(9));await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{const D=xrDoc,it=xrayBuild(D,9);const c={};it.forEach(x=>c[x.k]=(c[x.k]||0)+1);return{n:it.length,c,labels:it.filter(x=>x.label&&/start/i.test(XR_NAME[x.k])).map(x=>x.label+" «"+x.l.text.trim().slice(0,30)+"»")}});
 console.log(JSON.stringify(r));
 ok(r.n>25,"every line the reader found is listed: "+r.n);ok((r.c.qstart||0)>=1,"question start shown from Find's real result: "+JSON.stringify(r.labels));
 // facts for a line
 await p.evaluate(()=>{S.xrSel=xrayBuild(xrDoc,9).findIndex(x=>x.k==="qstart");xrayDraw()});await p.waitForTimeout(400);
 const t=await p.textContent("#xrPanel");ok(/Starts at/.test(t)&&/Text size/.test(t)&&/Font/.test(t)&&/What Find did/.test(t),"line details show the raw facts and what Find did");
 await p.screenshot({path:"/tmp/e2e/xr2_p9.png"});
 await p.evaluate(()=>goPage(8));await p.waitForTimeout(1500);await p.screenshot({path:"/tmp/e2e/xr2_p8.png"});
 const e=errs.filter(x=>!/Failed to load resource/.test(x));ok(!e.length,"no page errors "+e.join("|").slice(0,300));await b.close()})();
