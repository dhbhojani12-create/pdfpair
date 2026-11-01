const {open}=require('./shotlib');
(async()=>{const {ctx,p}=await open({viewport:{width:1200,height:800}});await p.waitForTimeout(2000);
 console.log(await p.evaluate(async()=>{const d=L.docs.find(x=>x.name==="RENAMED IN TAB2.pdf");if(!d)return"none";const k=d.key;d.name=k.split("|")[0]||k;await DB.put("docs",k,d);return k+" -> "+d.name}));await ctx.close()})();
