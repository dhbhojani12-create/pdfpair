import * as pdfjsLib from "/opt/npm-tools/node_modules/pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
const [src,out]=process.argv.slice(2);
const doc=await pdfjsLib.getDocument({data:new Uint8Array(fs.readFileSync(src)),verbosity:0}).promise;const res={};
for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n);const vp=pg.getViewport({scale:1});const tc=await pg.getTextContent();
  const fn=new Map();try{await pg.getOperatorList();for(const id of new Set(tc.items.map(it=>it.fontName))){try{if(pg.commonObjs.has(id)){const o=pg.commonObjs.get(id);fn.set(id,(o.name||id)+(o.bold&&!/bold/i.test(o.name||"")?"-Bold":"")+(o.black&&!/black/i.test(o.name||"")?"-Black":"")+(o.italic&&!/italic|oblique/i.test(o.name||"")?"-Italic":""))}}catch(e){}}}catch(e){}
  res[n]=tc.items.filter(it=>it.str&&it.str.trim()).map(it=>{const tx=pdfjsLib.Util.transform(vp.transform,it.transform);const fh=Math.hypot(tx[2],tx[3])||Math.abs(it.height)||8;
    return{s:it.str,f:fn.get(it.fontName)||it.fontName,x:tx[4]/vp.width,y:(tx[5]-fh*.85)/vp.height,w:Math.abs(it.width||0)/vp.width,h:fh/vp.height}})}
fs.writeFileSync(out,JSON.stringify(res));
