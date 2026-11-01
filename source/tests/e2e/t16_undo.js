const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1280,height:720}});p.setDefaultTimeout(30000);
 await p.evaluate(()=>{try{localStorage.setItem("pp-hide","0")}catch(_){};BK.hide=false});
 await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>studyStart());await p.waitForSelector(".rv .qp .crop:not(.loading) .hl");await p.waitForTimeout(800);
 const n=()=>p.evaluate(()=>{const it=BK.list[BK.rc],ms=it.data.marks||{};return it.p.q.concat(it.p.a).reduce((s,r)=>s+((ms[r.id]||[]).length),0)});
 const n0=await n();await p.keyboard.press("1");
 const b=await p.evaluate(()=>{const r=document.querySelector(".rv .qp .crop .hl").getBoundingClientRect();return[r.left+r.width*.2,r.top+30,r.left+r.width*.6]});
 for(let k=0;k<2;k++){await p.mouse.move(b[0],b[1]+k*25);await p.mouse.down();await p.mouse.move(b[2],b[1]+k*25,{steps:5});await p.mouse.up()}
 ok(await n()===n0+2,"two highlights drawn");
 await p.keyboard.press("Control+z");ok(await n()===n0+1,"Ctrl+Z removes the last one");
 await p.keyboard.press("Control+z");ok(await n()===n0,"Ctrl+Z again removes the other");
 await p.keyboard.press("Control+y");ok(await n()===n0+1,"Ctrl+Y brings one back");
 await p.keyboard.press("Control+y");ok(await n()===n0+2,"Ctrl+Y brings both back");
 await p.keyboard.press("e");await p.mouse.move(b[0]+40,b[1]);await p.mouse.down();await p.mouse.move(b[0]+60,b[1]+25,{steps:4});await p.mouse.up();
 const ne=await n();ok(ne<n0+2,"eraser removed highlights");await p.keyboard.press("Control+z");ok(await n()===n0+2,"Ctrl+Z undoes the erase");
 const saved=await p.evaluate(async()=>{const it=BK.list[BK.rc];const d=await DB.get("docs",it.key);return 1});
 ok(!errs.length,"no page errors "+errs.join(";"));await ctx.close()})();
