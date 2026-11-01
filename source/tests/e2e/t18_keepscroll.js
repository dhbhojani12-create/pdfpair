const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1536,height:860}});p.setDefaultTimeout(30000);
 await p.evaluate(()=>{try{localStorage.setItem("pp-hide","0");localStorage.setItem("pp-fit","width")}catch(_){};BK.hide=false;BK.fit="width";BK.split=.5});
 await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");
 // pick a question whose answer is long
 await p.evaluate(()=>studyStart());await p.waitForTimeout(1200);
 for(let k=0;k<40;k++){const long=await p.evaluate(()=>{const f=document.querySelector(".rv .ap .fit");return f&&f.scrollHeight>f.clientHeight*1.6});if(long)break;await p.evaluate(()=>bankGo(BK.rc+1));await p.waitForTimeout(700)}
 await p.evaluate(()=>setSplit(.3,false,false));await p.waitForTimeout(600);
 const fr=()=>p.evaluate(()=>{const f=document.querySelector(".rv .ap .fit");return f.scrollTop/f.scrollHeight});
 await p.evaluate(()=>{const f=document.querySelector(".rv .ap .fit");f.scrollTop=f.scrollHeight*.45});await p.waitForTimeout(300);const before=await fr();
 await p.evaluate(()=>setSplit(.8,false,true));await p.waitForTimeout(700);
 await p.evaluate(()=>setSplit(.3,false,true));await p.waitForTimeout(700);const after=await fr();
 ok(before>.2&&Math.abs(after-before)<.04,"answer keeps its place after switching sides ("+before.toFixed(2)+" → "+after.toFixed(2)+")");
 await p.evaluate(()=>{BK.fit="page";bankLayout()});await p.waitForTimeout(300);await p.evaluate(()=>{BK.fit="width";bankLayout()});await p.waitForTimeout(400);
 ok(Math.abs(await fr()-before)<.04,"place kept after fit screen and back");
 await p.evaluate(()=>bankGo(BK.rc+1));await p.waitForTimeout(800);ok(await p.evaluate(()=>document.querySelector(".rv .ap .fit").scrollTop)===0,"next question starts at the top");
 ok(!errs.length,"no page errors "+errs.join(";"));await ctx.close()})();
