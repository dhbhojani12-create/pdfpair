const {launch,ok}=require('./base');const fs=require('fs');const RAW=JSON.parse(fs.readFileSync('/tmp/bankitems2.json'));
(async()=>{for(const vp of [{width:1920,height:1000},{width:1280,height:720},{width:390,height:844}]){const {b,p,errs}=await launch({viewport:vp});
 await p.evaluate(raw=>{L.folders=[{id:"afm",name:"AFM",color:"#3157d0"},{id:"fr",name:"FR",color:"#0d855c"}];L.links=[];L.topicList={};
  const extra=["Professional and Ethical Duty of a Chartered Accountant","Ind AS 105: Non-current Assets Held for Sale and Discontinued Operations","Ind AS 37: Provisions, Contingent Liabilities and Contingent Assets","Ind AS 115: Revenue from Contracts with Customers","Ind AS 116: Leases","Ind AS 109: Financial Instruments","Ind AS 103: Business Combinations","Ind AS 110: Consolidated Financial Statements"];
  const srcs=["module","pyq","rtp","mtp"];
  BK.items=raw.concat(raw).map((r,i)=>{const fr=i>=raw.length;return{id:r.n+"|"+i,key:(fr?"FR ":"")+r.n,name:(fr?"FR ":"")+r.n,src:srcs[i%4],sub:fr?"fr":"afm",subName:fr?"FR":"AFM",label:r.label,idx:i,tq:r.tq,ta:r.ta,data:{pairs:[]},p:{id:"p"+i,q:[{page:1,y:i/1000}],a:[{page:2}],tags:i%9===0?[]:[fr?extra[i%extra.length]:r.truth]}}});
  BK.docs=[...new Set(BK.items.map(it=>it.key))].map(k=>({key:k,name:k,sub:{id:k.startsWith("FR")?"fr":"afm"}}));saveDocData=async()=>{};
  computeDups();BK.view="list";$("#vLib").hidden=true;$("#vBank").hidden=false;S.view="bank";renderBank()},RAW);
 await p.click('#bkSub [data-sub=fr]').catch(()=>{});
 if(vp.width<900){await p.click("#bkFilt");await p.waitForTimeout(400)}
 await p.click('#bkSub [data-sub=all]');await p.click('#bkSrc [data-src=rtp]');await p.locator('#bkTopics .fr').nth(3).click();
 await p.waitForTimeout(200);await p.screenshot({path:"/tmp/e2e/f_"+vp.width+".png"});
 const info=await p.evaluate(()=>({topics:document.querySelectorAll("#bkTopics .fr").length,visible:(()=>{const box=document.querySelector("#bkTopics").getBoundingClientRect();return [...document.querySelectorAll("#bkTopics .fr")].filter(e=>{const r=e.getBoundingClientRect();return r.top>=box.top-1&&r.bottom<=box.bottom+1}).length})(),act:document.querySelectorAll("#bkActive .ac").length,hsc:document.documentElement.scrollWidth>innerWidth+1}));
 ok(info.visible>=(vp.height<800?5:6),vp.width+"px: "+info.visible+" of "+info.topics+" topic rows visible at once, "+info.act+" active filter chips, no sideways scroll: "+!info.hsc);
 if(vp.width<900)await p.click('#bkShow');await p.click('#bkActive .ac >> nth=0');ok(await p.evaluate(()=>BK.f.srcs.size===0),vp.width+"px: removing an active chip clears that filter");
 if(vp.width<900){await p.click("#bkFilt");await p.waitForTimeout(400)}await p.click("#bkTopSort");ok(await p.evaluate(()=>BK.topicSort==="n"),"sort by most questions");await p.click("#bkTopSort");
 console.log(errs.filter(e=>!/ERR_FAILED/.test(e)).join("\n")||"  no page errors");await b.close()}})();
