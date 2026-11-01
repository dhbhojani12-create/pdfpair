const {open}=require('./shotlib');const which=(process.argv[2]||"all").split(",");const want=n=>which.includes("all")||which.includes(n);
(async()=>{
 const run=async(name,opts,fn)=>{const {ctx,p,errs}=await open(opts);p.setDefaultTimeout(30000);try{await fn(p);await p.waitForTimeout(500);await p.screenshot({path:"/tmp/e2e/shots/"+name+".png"})}catch(e){console.log(name,"ERR",e.message.split("\n")[0])}if(errs.length)console.log(name,errs.slice(0,3).join(" | "));await ctx.close()};
 const phone={viewport:{width:390,height:844},touch:true,mobile:true},land={viewport:{width:844,height:390},touch:true,mobile:true},desk={viewport:{width:1400,height:860}};
 const bank=async p=>{await p.evaluate(()=>openBank());await p.waitForSelector("#vBank:not([hidden]) .brw")};
 if(want("lib")){await run("p_lib",phone,async p=>{});await run("d_lib",desk,async p=>{})}
 if(want("bank")){await run("p_bank",phone,bank);await run("d_bank",desk,bank)}
 if(want("filters"))await run("p_filters",phone,async p=>{await bank(p);await p.click("#bkFilt").catch(()=>{});await p.waitForTimeout(400)});
 if(want("rep")){await run("d_rep",desk,async p=>{await bank(p);await p.evaluate(()=>navGo("rep"));await p.waitForTimeout(500)});await run("p_rep",phone,async p=>{await bank(p);await p.evaluate(()=>navGo("rep"));await p.waitForTimeout(500)})}
 if(want("index")){await run("d_index",desk,async p=>{await bank(p);await p.click("#bkVIdx")});await run("p_index",phone,async p=>{await bank(p);await p.click("#bkVIdx")})}
 if(want("study")){await run("p_study",phone,async p=>{await bank(p);await p.evaluate(()=>studyStart());await p.waitForTimeout(1500)});
   await run("l_study",land,async p=>{await bank(p);await p.evaluate(()=>studyStart());await p.waitForTimeout(1500)});
   await run("d_slides",desk,async p=>{await bank(p);await p.evaluate(()=>{try{localStorage.setItem("pp-hide","1")}catch(_){}BK.hide=true;studyStart()});await p.waitForTimeout(1500)})}
 if(want("mark")){await run("d_mark",desk,async p=>{await p.click('.card:has(.cname:text-is("Ind_AS_7")) [data-act=open]');await p.waitForSelector("canvas.pc");await p.waitForTimeout(1200)});
   await run("p_mark",phone,async p=>{await p.click('.card:has(.cname:text-is("Ind_AS_7")) [data-act=open]');await p.waitForSelector("canvas.pc");await p.waitForTimeout(1200)})}
})();
