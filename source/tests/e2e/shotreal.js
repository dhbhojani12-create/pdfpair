const {chromium}=require('playwright');const fs=require('fs');
const LIB={"pdf.worker.min.js":"/tmp/e2e/pdf.worker.js","pdf.min.js":"/tmp/e2e/pdf.js","jspdf.umd.min.js":"/tmp/e2e/jspdf-real.js","jszip.min.js":"/tmp/e2e/jszip.min.js","pdf-lib.min.js":"/tmp/e2e/pdf-lib.min.js"};
async function open(opts={}){const ctx=await chromium.launchPersistentContext("/tmp/e2e/profile",{viewport:opts.viewport||{width:1400,height:900},hasTouch:!!opts.touch,isMobile:!!opts.mobile,deviceScaleFactor:opts.dpr||1,acceptDownloads:true});
  await ctx.route(/cdnjs|unpkg|gstatic/,r=>{const u=r.request().url();const k=Object.keys(LIB).find(k=>u.endsWith("/"+k));if(k)return r.fulfill({status:200,contentType:"application/javascript",body:fs.readFileSync(LIB[k])});return r.abort()});
  const p=ctx.pages()[0]||await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push("PAGEERROR "+e.message));p.on('console',m=>{if(m.type()==="error"&&!/ERR_FAILED|ERR_NAME|net::/.test(m.text()))errs.push("CONSOLE "+m.text())});
  await p.goto('file:///home/claude/PaperPair.html');await p.waitForFunction(()=>window.pdfjsLib&&document.querySelector(".card"),null,{timeout:30000});return{ctx,p,errs}}
module.exports={open};
