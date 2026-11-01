const {open}=require('./shotlib');
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{BK.view="idx";renderBank()});await p.waitForSelector(".ixtag");
 await p.evaluate(()=>{$("#bkMain").scrollTop=600});await p.waitForTimeout(200);
 await p.evaluate(()=>{const m=$("#bkMain");window.__log=[];m.addEventListener("scroll",()=>{window.__log.push("S "+m.scrollTop)});const f=m.scrollTo;const d=Object.getOwnPropertyDescriptor(Element.prototype,"scrollTop");Object.defineProperty(m,"scrollTop",{get(){return d.get.call(this)},set(v){window.__log.push("set "+v+" "+new Error().stack.split("\n").slice(2,5).join("|"));d.set.call(this,v)}})});
 const b=p.locator(".ixtag:visible").nth(3);await b.click();console.log(await p.evaluate(()=>window.__log.join("\n")));console.log("after click",await p.evaluate(()=>$("#bkMain").scrollTop));
 await p.evaluate(()=>{const m=$("#bkMain");let last=m.scrollTop;window.__log=[];const o=Object.getOwnPropertyDescriptor(Element.prototype,"scrollTop");m.addEventListener("scroll",()=>{window.__log.push(m.scrollTop+" "+new Error().stack.split("\n").slice(1,4).join("|"))})});
 await p.fill("#tpQ","Zz test topic");await p.keyboard.press("Enter");await p.waitForTimeout(600);console.log(await p.evaluate(()=>window.__log.join("\n")));console.log("end",await p.evaluate(()=>$("#bkMain").scrollTop));await ctx.close()})();
