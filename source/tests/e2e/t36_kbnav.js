const {open}=require('./shotlib');const ok=(c,m)=>console.log((c?"PASS ":"FAIL ")+m);
(async()=>{const {ctx,p,errs}=await open({viewport:{width:1400,height:860}});p.setDefaultTimeout(30000);
 const sel=()=>p.evaluate(()=>{const e=document.querySelector(".kbsel");return e?e.className+"|"+(e.textContent||"").slice(0,40):null});
 // Repeats
 await p.evaluate(()=>navGo("rep"));await p.waitForSelector(".rpg");await p.evaluate(()=>{BK.repOpen=-1;renderBank()});await p.waitForTimeout(300);
 await p.mouse.click(5,400);await p.keyboard.press("ArrowDown");let s=await sel();ok(s&&s.includes("rpgh"),"rep: ↓ selects a group "+s);
 const g0=await p.evaluate(()=>document.querySelector(".kbsel").dataset.gi);
 await p.keyboard.press("ArrowDown");s=await sel();ok(s&&s.includes("rpgh")&&await p.evaluate(()=>document.querySelector(".kbsel").dataset.gi)!==g0,"rep: ↓ moves to next group");
 await p.keyboard.press("Enter");await p.waitForTimeout(300);ok(await p.locator(".rpg.open .rpgh.kbsel").count()===1,"rep: Enter opens group, cursor kept");
 await p.keyboard.press("ArrowDown");s=await sel();ok(s&&s.includes("rph1"),"rep: ↓ goes into the copies "+s);
 await p.keyboard.press("ArrowDown");await p.keyboard.press("ArrowUp");s=await sel();ok(s&&s.includes("rph1"),"rep: ↑ works");
 await p.keyboard.press("ArrowLeft");await p.waitForTimeout(300);ok(await p.locator(".rpg.open").count()===0&&await p.locator(".rpgh.kbsel").count()===1,"rep: ← closes group, cursor on header");
 await p.keyboard.press("ArrowRight");await p.waitForTimeout(300);await p.keyboard.press("ArrowDown");await p.keyboard.press("Enter");await p.waitForTimeout(800);
 ok(await p.evaluate(()=>BK.view==="slides"||document.body.classList.contains("study")),"rep: Enter on a copy opens View question");
 await p.keyboard.press("Escape");await p.waitForTimeout(600);ok(await p.evaluate(()=>BK.view)==="rep","rep: Esc back to Repeats");
 await p.keyboard.press("ArrowDown");ok(await p.locator(".rph1.kbsel,.rpgh.kbsel").count()===1,"rep: cursor still usable after coming back");
 // Question bank list
 await p.evaluate(()=>navGo("lib"));await p.waitForSelector("#vBank:not([hidden]) .brw");await p.evaluate(()=>{BK.view="list";renderBank()});
 await p.click("#bkQ");await p.keyboard.press("ArrowDown");s=await sel();ok(s&&s.includes("brw"),"bank: ↓ from search box goes into list");
 await p.keyboard.press("j");await p.keyboard.press("j");const id1=await p.evaluate(()=>document.querySelector(".brw.kbsel [data-sel]").dataset.sel);
 await p.keyboard.press("x");await p.waitForTimeout(200);ok(await p.evaluate(id=>BK.sel.has(id),id1),"bank: X ticks the row");
 ok(await p.evaluate(id=>document.querySelector(".brw.kbsel [data-sel]").dataset.sel===id,id1),"bank: cursor kept after redraw");
 await p.keyboard.press("Enter");await p.waitForTimeout(800);ok(await p.evaluate(()=>BK.view==="slides"||S.view==="work"),"bank: Enter opens the question");
 // Today
 await p.evaluate(()=>{if(document.body.classList.contains("study"))studyEnd()});await p.evaluate(()=>navGo("today"));await p.waitForTimeout(800);
 await p.mouse.click(5,300);await p.keyboard.press("ArrowDown");s=await sel();ok(s&&(s.includes("pli")||s.includes("pcard")),"today: ↓ selects "+s);
 await p.keyboard.press("End");s=await sel();ok(s&&s.includes("pcard"),"today: End goes to last PDF");
 ok(!errs.filter(x=>!/Failed to load resource/.test(x)).length,"no page errors "+errs.join(";"));await ctx.close()})();
