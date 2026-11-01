const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();
 ok(await p.evaluate(()=>!!window.pdfjsLib&&!!window.jspdf&&!!window.JSZip),"libraries loaded");
 ok(await p.locator(".card").count()===1,"sample paper in library");
 await p.click(".card [data-act=open]");await p.waitForSelector("#vMark:not([hidden]) canvas.pc",{timeout:15000});
 ok(await p.evaluate(()=>S.data.pairs.length===SAMPLE_REGIONS.length),"sample opened with its pairs");
 console.log(await p.evaluate(()=>[S.pages.length,S.data.pairs.length,document.querySelectorAll("#ov .reg").length]));
 console.log(errs.join("\n"));await b.close()})();
