const fs=require("fs");const js=fs.readFileSync("/tmp/claude-0/-home-claude/d0f961c0-bf6f-5078-a054-6532f3567bf7/scratchpad/qa/app.js","utf8");
const g=n=>{const i=js.indexOf("function "+n+"(");return js.slice(i,js.indexOf("\nfunction",i+5))};
const src=js.slice(js.indexOf("const STOP="),js.indexOf("\n",js.indexOf("const STOP=")))+"\n"+g("toks")+"\n"+g("computeDups")+"\nreturn computeDups;";
const items=require("/tmp/e2e/bank_items.json");const fr=items.filter(it=>/FR RTP/.test(it.name));
global.BK={items:fr.concat(fr.map(it=>({...it,id:it.id+"#2",key:it.key+"#2"}))).map(it=>({...it,p:{tags:it.tags}}))};global.SRC={rtp:"RTP"};global.SRCORD=["module","pyq","rtp","mtp","other"];
new Function("BK","SRC","SRCORD",src)(BK,SRC,SRCORD)();
console.log("items",BK.items.length,"groups",BK.groups.length,"sizes",BK.groups.map(g=>g.items.length).join(","));
const T=new Function(js.slice(js.indexOf("const STOP="),js.indexOf("\n",js.indexOf("const STOP=")))+"\n"+g("toks")+";return toks")();
const inG=new Set(BK.groups.flatMap(g=>g.items.map(i=>i.id)));fr.filter(it=>!inG.has(it.id)).forEach(it=>console.log("missing",it.label,T(it.tq).length,it.tq.slice(0,80)));
