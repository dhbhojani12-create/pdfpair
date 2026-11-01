const {launch,ok}=require('./base');const fs=require('fs');
(async()=>{const {b,p,errs}=await launch({viewport:{width:1500,height:900}});
 await p.evaluate(()=>{L.folders=[{id:"afm",name:"AFM",color:"#3157d0"},{id:"aud",name:"Audit",color:"#c2410c"}];L.links=[];L.topicList={};
  const mk=(key,sub,subName,src,i,tq,tags,star)=>({id:key+i,key,name:key,src,sub,subName,label:"Q "+i,idx:i,tq,ta:"",data:{pairs:[]},p:{id:key+i,q:[{page:1,y:i/100}],a:[{page:2}],tags,star}});
  BK.items=[mk("Chapter 14 U1","aud","Audit","module",1,"1. CA Harshit is conducting statutory audit of branch of a public sector bank.",["Special Features of Audit of Banks and NBFCs"]),
   mk("Chapter 14 U1","aud","Audit","module",2,"2. Concurrent audit of a branch, export advances.",["Special Features of Audit of Banks and NBFCs"]),
   mk("Chapter 1","aud","Audit","module",3,"3. Engagement quality control reviewer.",["Quality Control (SQC 1, SA 220)"],true),
   mk("AFM RTP","afm","AFM","rtp",4,"4. Calculate the value of the firm using FCFF.",["Business Valuation"])];
  BK.docs=[...new Set(BK.items.map(i=>i.key))].map(k=>({key:k,name:k,sub:{id:BK.items.find(i=>i.key===k).sub}}));window.__saved=[];saveDocData=async(k)=>{__saved.push(k)};
  computeDups();BK.view="list";$("#vLib").hidden=true;$("#vBank").hidden=false;S.view="bank";renderBank()});
 await p.click("#bkVIdx");await p.waitForTimeout(200);
 ok(await p.locator(".ixh").count()===2,"index has one section per subject (AFM, Audit)");
 const heads=await p.locator('.ixt').first().locator('th').allTextContents();ok(heads.join("|")==="#|Source|Q No.|Tag|Subtopic|Description|IMP","columns: "+heads.join(" | "));
 const s1=p.locator('input[data-xsubt="Chapter 14 U12"]');await s1.fill("Bank branch audit – advances");await s1.press("Enter");await p.waitForTimeout(200);
 ok(await p.evaluate(()=>BK.items.find(i=>i.id==="Chapter 14 U12").p.subt==="Bank branch audit – advances"&&__saved.includes("Chapter 14 U1")),"typed subtopic is saved to the question");
 ok(await p.evaluate(()=>[...document.querySelectorAll('#ixSL-aud option')].some(o=>o.value==="Bank branch audit – advances")),"new subtopic is offered for the next Audit question");
 await p.check('input[data-ximp="AFM RTP4"]');await p.waitForTimeout(200);ok(await p.evaluate(()=>BK.items.find(i=>i.id==="AFM RTP4").p.star===true),"IMP tick marks the question Important");
 ok((await p.textContent("#ixImp"))==="2 IMP","IMP count updates: "+await p.textContent("#ixImp"));
 await p.click('[data-ixord=topic]');await p.waitForTimeout(150);const ordA=await p.$$eval('.ixt',t=>[...t[1].querySelectorAll("tbody tr .c-t")].map(x=>x.textContent.slice(0,7)));ok(ordA[0]==="Quality","By topic sorts Audit by tag: "+ordA.join(", "));
 const [dl]=await Promise.all([p.waitForEvent("download"),p.click("#ixCsv")]);const csv=fs.readFileSync(await dl.path(),"utf8");
 ok(/"Subtopic"/.test(csv)&&csv.includes("Bank branch audit – advances")&&csv.split("\n").length===5,"Excel download has the Subtopic column and 4 rows");
 await p.fill("#bkSearch","advances").catch(()=>{});const sbox=await p.$("#bkSearch")?"#bkSearch":"#bkQ";
 await p.fill(sbox,"branch audit – advances");await p.waitForTimeout(300);ok(await p.locator("tbody tr").count()===1,"search finds a question by its subtopic");await p.fill(sbox,"");
 await p.click("#bkVList");await p.waitForTimeout(150);ok(await p.locator(".tchip.subt").count()===1,"List view shows the subtopic chip");
 await p.screenshot({path:"/tmp/e2e/idx_list.png"});await p.click("#bkVIdx");await p.waitForTimeout(150);await p.screenshot({path:"/tmp/e2e/idx.png"});
 await p.click('.ixq[data-open="Chapter 14 U12"]');await p.waitForTimeout(400);ok(await p.evaluate(()=>BK.view==="slides"),"clicking a Q No. opens that question");
 console.log("NB:",await p.evaluate(()=>{const n=document.querySelector("#bkMain .nbar,#bkMain [class*=nb]");return n?n.outerHTML.slice(0,300):document.querySelector("#bkMain").innerHTML.slice(0,600)}));process.exit();await p.waitForTimeout(200);ok((await p.inputValue(".subtin"))==="Bank branch audit – advances","question's own panel shows its subtopic");
 await p.fill(".subtin","LFAR");await p.click('[data-n="done"]');await p.waitForTimeout(200);ok(await p.evaluate(()=>BK.items.find(i=>i.id==="Chapter 14 U12").p.subt==="LFAR"),"subtopic can be changed from the question panel");
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).length?"page errors: "+errs.join("; "):"no page errors");await b.close()})();
