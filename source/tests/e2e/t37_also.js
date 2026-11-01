const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(60000);
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");
 const exp=await p.evaluate(()=>{const it=BK.items.find(x=>BK.dupN.get(x.id));return BK.dupSrc.get(it.id)});
 for(const lay of ["bxIn","bxEnd"]){await p.click("#bkExport");await p.waitForSelector("#bxGo");if(await p.locator("#"+lay).count())await p.click("#"+lay);
 await Promise.all([p.waitForEvent("download",{timeout:180000}),p.click("#bxGo")]);const pdf=await p.evaluate(()=>__lastPdf);
 const n=pdf.texts.filter(t=>t==="ALSO ASKED IN").length;ok(n>0,lay+": ALSO ASKED IN appears "+n+" times");
 const i=pdf.texts.indexOf("ALSO ASKED IN");ok(i>=0&&exp.some(e=>pdf.texts.slice(i+1,i+4).join(" ").includes(e.split(" · ")[1].slice(0,8))),lay+": names the other source: "+pdf.texts.slice(i+1,i+2));
 await p.click("#gClose").catch(()=>{})}
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no errors "+errs.join(";"));await ctx.close()})();
