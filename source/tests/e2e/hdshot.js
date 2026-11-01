const {open}=require('./shotlib');(async()=>{const {ctx,p}=await open({viewport:{width:1280,height:720}});
await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{BK.f.star=true;renderBank()});await p.waitForTimeout(600);await p.screenshot({path:"/tmp/e2e/shots/bkhead.png",clip:{x:0,y:0,width:1280,height:330}});await ctx.close()})()
