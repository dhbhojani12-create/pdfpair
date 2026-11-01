const {open}=require('./shotlib');
(async()=>{const {ctx,p}=await open({viewport:{width:1400,height:860}});await p.waitForTimeout(1500);
 await p.evaluate(()=>{AB.dir={name:"My Drive/PaperPair",queryPermission:async()=>"granted"};AB.last={at:Date.now()-40*60e3,n:3286,size:1};AB.paused=false;navBkHint()});
 await p.click("#navBackup");await p.waitForTimeout(300);await p.screenshot({path:"shots/abmenu.png",clip:{x:900,y:0,width:500,height:420}});await ctx.close()})();
