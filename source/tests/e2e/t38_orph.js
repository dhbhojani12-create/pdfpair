const {launch,ok}=require('./base');
(async()=>{const {b,p,errs}=await launch();p.setDefaultTimeout(60000);
 await p.setInputFiles('#fileIn',['/tmp/e2e/pdfs/Ind_AS_7.pdf']);await p.waitForSelector("#vMark:not([hidden]) canvas.pc");
 // keywords search where only some questions are found → answers without a question
 await p.click("#autoBtn");await p.waitForSelector("#adGo");await p.evaluate(()=>{$("#adSeg").hidden=false});await p.click('#gBody [data-m=kw]');await p.fill("#adKq","Illustration 1");await p.fill("#adKa","Solution");
 await p.click("#adGo");await p.waitForSelector("#sbar:not([hidden])",{timeout:120000}).catch(()=>{});
 const info=await p.evaluate(()=>({n:(S.sugg||[]).length,orphans:S.suggInfo&&S.suggInfo.orphans,orph:S.suggInfo&&S.suggInfo.orph&&S.suggInfo.orph.length}));console.log(JSON.stringify(info));
 if(!info.orph){// inject for the UI checks
   await p.evaluate(()=>{S.sugg=[{id:"s1",label:"1",q:[{page:2,x:.1,y:.1,w:.8,h:.1}],a:[]},{id:"s2",label:"2",q:[{page:5,x:.1,y:.1,w:.8,h:.1}],a:[{page:5,x:.1,y:.3,w:.8,h:.1}]}];S.suggInfo={orphans:2,missing:[],orph:[{id:"o0",num:"1",parts:[{page:3,x:.1,y:.2,w:.8,h:.2}]},{id:"o1",num:"9",parts:[{page:6,x:.1,y:.2,w:.8,h:.2}]}]};refreshAll()})}
 const n=await p.evaluate(()=>S.suggInfo.orph.length);
 const t=await p.textContent("#sbar .chkbtn");ok(/to check/.test(t),"check button counts the unmatched answers too: "+t.trim());
 await p.click('#sbar [data-s=orph]');await p.waitForTimeout(500);const o0=await p.evaluate(()=>S.suggInfo.orph.find(o=>o.id===S.orphFocus));
 ok(o0&&await p.evaluate(()=>S.cur)===o0.parts[0].page,"unmatched link jumps to the page: p."+(o0&&o0.parts[0].page));
 ok(await p.isVisible(".orph.focus .olab"),"answer without question is drawn with a label");
 await p.screenshot({path:"/tmp/e2e/shots/orph.png"});
 const before=await p.evaluate(id=>{const o=S.suggInfo.orph.find(x=>x.id===id),pos=b=>b.page*10+b.y;const s=S.sugg.filter(s=>s.q[0]&&pos(s.q[0])<pos(o.parts[0])).sort((a,b)=>pos(a.q[0])-pos(b.q[0])).pop();return s&&{id:s.id,a:s.a.length}},o0.id);
 await p.click('.orph.focus [data-oatt]');await p.waitForTimeout(300);
 if(before)ok(await p.evaluate(b=>S.sugg.find(s=>s.id===b.id).a.length===b.a+1,before),"Attach adds it to the question above");
 ok(await p.evaluate(()=>S.suggInfo.orph.length)===n-1,"and it leaves the list");
 if(n>1){await p.click('#sbar [data-s=odd]');let k=0;while(!(await p.evaluate(()=>S.orphFocus))&&k++<40)await p.click('#sbar [data-s=odd]');ok(await p.isVisible(".orph.focus"),"⚠ to check also visits unmatched answers");
   await p.click('.orph.focus [data-oign]');await p.waitForTimeout(300);ok(await p.evaluate(()=>S.suggInfo.orph.length)===n-2,"Ignore removes it")}
 ok(!errs.length,"no page errors "+errs.join(";"));await b.close()})();
