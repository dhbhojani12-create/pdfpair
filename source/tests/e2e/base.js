const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const LIB={"pdf.worker.min.js":"/tmp/e2e/pdf.worker.js","pdf.min.js":"/tmp/e2e/pdf.js","jspdf.umd.min.js":"/tmp/e2e/jspdf-mock.js","jszip.min.js":"/tmp/e2e/jszip.min.js","pdf-lib.min.js":"/tmp/e2e/pdf-lib.min.js"};
async function launch(opts={}){const b=await chromium.launch();const ctx=await b.newContext({viewport:opts.viewport||{width:1400,height:900},acceptDownloads:true,hasTouch:!!opts.touch,isMobile:!!opts.mobile,deviceScaleFactor:opts.dpr||1});
  await ctx.route(/cdnjs|unpkg|googleapis|gstatic/,r=>{const u=r.request().url();const k=Object.keys(LIB).find(k=>u.endsWith("/"+k));if(k)return r.fulfill({status:200,contentType:"application/javascript",body:fs.readFileSync(LIB[k])});return r.abort()});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>{errs.push("PAGEERROR "+e.message+" "+(e.stack||"").split("\n").slice(1,4).join(" | "));console.log("  !! pageerror: "+e.message)});p.on('console',m=>{if(m.type()==="error")errs.push("CONSOLE "+m.text())});
  await p.goto('file:///home/claude/PaperPair.html');await p.waitForFunction(()=>window.pdfjsLib&&document.querySelector(".card"),null,{timeout:20000});return{b,ctx,p,errs}}
const ok=(c,msg)=>{console.log((c?"PASS ":"FAIL ")+msg);if(!c)process.exitCode=1};
module.exports={launch,ok};
