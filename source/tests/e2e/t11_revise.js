const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{
 for(const [nm,vp] of [["port",{width:390,height:844}],["land",{width:844,height:390}]]){
  const {ctx,p,errs}=await open({viewport:vp,touch:true,mobile:true});p.setDefaultTimeout(30000);
  await p.evaluate(()=>{try{localStorage.setItem("pp-hide","1")}catch(_){}BK.hide=true});await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");
  await p.click('#tabbar [data-tb=rev]').catch(async()=>{await p.evaluate(()=>studyStart())});await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>document.body.classList.contains("study")&&!!document.querySelector("#bkMain .rv."+(innerWidth<innerHeight?"port":"land"))),nm+": Revise opens ("+nm+")");
  ok(await p.evaluate(()=>!!document.querySelector("#bkMain .ap.hidden .rvhid")),nm+": answer hidden at first");
  const nb=await p.evaluate(()=>{const n=document.querySelector(".rv.port .rvnav");return n?Math.round(innerHeight-n.getBoundingClientRect().bottom):-1});if(nm==="port")ok(nb>=0&&nb<4,"port: buttons sit at the bottom (gap "+nb+"px)");
  await p.tap('#bkMain .rvhid');await p.waitForTimeout(900);
  ok(await p.evaluate(()=>!document.querySelector("#bkMain .ap.hidden")&&document.querySelectorAll("#bkMain .ap .crop").length>0),nm+": tap shows the answer");
  if(nm==="port"){ok(await p.evaluate(()=>getComputedStyle(document.querySelector(".rv .qp .fit")).display==="none"&&!!document.querySelector(".rv .qtog")),"port: question folds away when the answer shows");
    ok((await p.textContent(".rv .rvmain")).includes("Next"),"port: main button becomes Next question");
    await p.tap(".rv .rvpenbtn");await p.waitForTimeout(300)}
  await p.tap('.rv .rvnote');await p.waitForTimeout(200);
  const c=await p.evaluate(()=>{const r=document.querySelector("#bkMain .ap .crop").getBoundingClientRect();return[r.left+r.width*0.5,r.top+Math.min(40,r.height*0.4)]});
  await p.mouse.click(c[0],c[1]);await p.waitForTimeout(300);ok(await p.isVisible("#menu .pinta"),nm+": tapping the page opens a comment box");
  await p.fill("#menu .pinta","Two tests: capable of being distinct + distinct in context");await p.click('#menu [data-pa=save]');await p.waitForTimeout(300);
  ok(await p.evaluate(()=>{const it=BK.list[BK.rc];return it.p.pins&&it.p.pins.length===1&&it.p.pins[0].t.startsWith("Two tests")&&document.querySelectorAll("#bkMain .cpin").length===1}),nm+": comment pin saved and shown");
  await p.screenshot({path:"/tmp/e2e/shots/"+nm+"_revealed.png"});
  await p.click("#bkMain .cpin");await p.waitForTimeout(200);await p.click('#menu [data-pa=del]');await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!BK.list[BK.rc].p.pins&&!document.querySelector("#bkMain .cpin")),nm+": comment can be deleted");
  await p.tap('.rv [data-t=yellow]');ok(await p.evaluate(()=>S.hl==="yellow"&&document.body.classList.contains("hl-on")),nm+": highlighter picks up");
  await p.tap('.rv [data-act=next]:visible');await p.waitForTimeout(800);ok((await p.textContent(".rv .rvpos")).trim().startsWith("2"),nm+": › goes to next question");
  await p.tap('.rv .rvx');await p.waitForTimeout(500);ok(await p.evaluate(()=>!document.body.classList.contains("study")),nm+": ✕ closes Revise");
  if(errs.length)console.log(nm,"errors:",errs.join(" | "));await ctx.close()}})();
