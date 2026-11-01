const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [w,h,n] of [[1280,700,'d'],[390,800,'m']]){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file:///home/claude/PaperPair.html');await p.waitForTimeout(1200);await p.screenshot({path:'/tmp/e2e/nav_'+n+'.png',clip:{x:0,y:0,width:w,height:70}});}
await b.close()})()
