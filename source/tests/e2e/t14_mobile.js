const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{
 {const {ctx,p,errs}=await open({viewport:{width:915,height:412},touch:true,mobile:true});p.setDefaultTimeout(30000);
  await p.evaluate(()=>{try{localStorage.setItem("pp-hide","0");localStorage.setItem("pp-split","0.5")}catch(_){};BK.hide=false;BK.split=.5});
  await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");await p.tap("#bkRev").catch(()=>p.evaluate(()=>studyStart()));
  if(!(await p.evaluate(()=>document.body.classList.contains("study"))))await p.evaluate(()=>studyStart());await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>!!document.fullscreenElement),"one tap on Revise goes straight to full screen");
  ok(await p.evaluate(()=>!document.querySelector(".rv [data-act=fs]")),"no second full-screen button");
  const w=()=>p.evaluate(()=>{const q=document.querySelector(".rv .qp").getBoundingClientRect().width,a=document.querySelector(".rv .ap").getBoundingClientRect().width;return q/(q+a)});
  await p.tap('.rv [data-t=yellow]');const tapAt=async(sel,dy)=>{const b=await p.evaluate(([s,d])=>{const r=document.querySelector(s).getBoundingClientRect();return[r.left+r.width/2,d==="top"?r.top+18:r.top+r.height-40]},[sel,dy]);await p.touchscreen.tap(b[0],b[1]);await p.waitForTimeout(450)};
  await tapAt(".rv .ap .phd","top");let r=await w();ok(r<.3,"with highlighter on, tapping the Answer heading enlarges it ("+r.toFixed(2)+")");
  const marks0=await p.evaluate(()=>{const it=BK.list[BK.rc];return Object.values(it.data.marks||{}).reduce((s,a)=>s+(a?a.length:0),0)});
  await tapAt(".rv .qp","bottom");r=await w();const marks1=await p.evaluate(()=>{const it=BK.list[BK.rc];return Object.values(it.data.marks||{}).reduce((s,a)=>s+(a?a.length:0),0)});
  ok(r>.7&&marks1===marks0,"with highlighter on, tapping the small question side switches back without drawing ("+r.toFixed(2)+")");
  ok(await p.evaluate(()=>S.hl==="yellow"),"highlighter stays on after switching");
  await p.tap('.rv [data-t=yellow]');
  const pos0=await p.evaluate(()=>BK.rc);const sw=await p.evaluate(()=>{const r=document.querySelector(".rv .rvbody").getBoundingClientRect();return[r.left+r.width*.7,r.top+r.height*.5]});
  await p.evaluate(([x,y])=>{const el=document.elementFromPoint(x,y);const T=(xx)=>new Touch({identifier:7,target:el,clientX:xx,clientY:y});el.dispatchEvent(new TouchEvent("touchstart",{touches:[T(x)],changedTouches:[T(x)],bubbles:true}));el.dispatchEvent(new TouchEvent("touchend",{touches:[],changedTouches:[T(x-180)],bubbles:true}))},sw);
  await p.waitForTimeout(900);ok(await p.evaluate(()=>BK.rc)===pos0+1,"swipe left goes to the next question");
  // stuck page: make the first page image fail, it must retry and draw
  await p.evaluate(()=>{const orig=window.bankBitmap;let n=0;window.bankBitmap=bankBitmap=function(k,pg){if(n++<1)return Promise.reject(new Error("no canvas memory"));return orig(k,pg)}});
  await p.evaluate(()=>{BBMP.clear();bankGo(BK.rc+1)});await p.waitForTimeout(2500);
  ok(await p.evaluate(()=>document.querySelectorAll("#bkMain .crop").length>0&&!document.querySelector("#bkMain .crop.fail")&&!document.querySelector("#bkMain .crop.loading")),"a page that fails to draw is retried and shows up");
  await p.keyboard.press("Escape").catch(()=>{});await p.evaluate(()=>{if(document.fullscreenElement)document.exitFullscreen()});await p.waitForTimeout(600);
  ok(await p.evaluate(()=>!document.body.classList.contains("study")),"leaving full screen closes Revise");
  if(errs.length)console.log("errors:",errs.join(" | "));await ctx.close()}
 {const {ctx,p,errs}=await open({viewport:{width:390,height:844},touch:true,mobile:true});p.setDefaultTimeout(30000);
  await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");
  await p.tap("#bkExport");await p.waitForTimeout(400);ok(await p.isVisible(".bxsum")&&await p.locator(".chip2").count()===0,"Export shows a short summary, not a wall of filter buttons");
  const sheet=await p.evaluate(()=>{const r=document.querySelector("#gModal .dlg").getBoundingClientRect();return{w:Math.round(r.width),b:Math.round(innerHeight-r.bottom),ov:document.documentElement.scrollWidth>innerWidth+1}});
  ok(sheet.w===390&&sheet.b===0&&!sheet.ov,"Export opens as a full-width bottom sheet");await p.screenshot({path:"/tmp/e2e/shots/p_export.png"});
  await p.tap("#gClose");await p.evaluate(()=>openManageTopics());await p.waitForTimeout(400);
  const mt=await p.evaluate(()=>{const g=document.querySelector("#gBody");return{ov:g.scrollWidth>g.clientWidth+1}});ok(!mt.ov,"Manage topics has nothing spilling sideways");
  await p.screenshot({path:"/tmp/e2e/shots/p_manage.png"});
  if(errs.length)console.log("errors:",errs.join(" | "));await ctx.close()}
})();
