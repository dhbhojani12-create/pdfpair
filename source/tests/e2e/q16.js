const fs=require("fs");const Q="/tmp/claude-0/-home-claude/d0f961c0-bf6f-5078-a054-6532f3567bf7/scratchpad/qa/";const js=fs.readFileSync(Q+"app.js","utf8");
const grabF=n=>{const i=js.search(new RegExp("\\nfunction "+n+"\\("));const ends=["\nfunction","\nconst ","\nvar ","\n/*","\n//"].map(s=>js.indexOf(s,i+5)).filter(x=>x>0);return js.slice(i,Math.min(...ends))};
const line=s=>{const i=js.indexOf(s);return js.slice(i,js.indexOf("\n",i))};
let src="";for(const n of ["stemW","topicToks","nameWords","nameScore","suggestTopics","tfOf","lexScores","topicKey","lev","sameTopic","stdOf","stdsOf","stdCount","paperStandards","citedSug","chapterSug","regionText"])src+=grabF(n)+"\n";
const lexI=js.indexOf("const TOPIC_LEX=[");src+=js.slice(lexI,js.indexOf("\n];",lexI)+3)+"\n"+line("const STOP=")+"\n"+line("const STDRE=")+"\nvar LEXW=.6,CBX=.5,NAMEW=.9;\n";
const F=new Function(src+";return {suggestTopics,paperStandards,chapterSug,regionText,stdsOf,stdCount};")();
const T=fs.readFileSync("/tmp/e2e/ch_topics.txt","utf8").split("\n").filter(Boolean);
const IT=JSON.parse(fs.readFileSync(Q+"artp/AN26.json"));const P=JSON.parse(fs.readFileSync(Q+"artp/AN26_pairs.json"));
const items=P.map((p,i)=>({id:"r"+i,key:"AN26",src:"rtp",label:p.label,truth:(p.tags||[])[0]||"",tq:p.q.map(r=>F.regionText(IT[r.page]||[],r)).join(" "),ta:p.a.map(r=>F.regionText(IT[r.page]||[],r)).join(" ")}));
const txt=it=>it.tq+" "+it.ta.slice(0,4000);const sug=F.suggestTopics([],items.map(it=>({text:txt(it),lead:it.ta.slice(0,250)})),T);const ds=F.paperStandards(items,T,txt);
const it=items.find(x=>x.label.trim()=="16");const t=txt(it);console.log(t.match(/\b(SA|SRE|SAE|SQC)[\s\-.]*\d+/gi),"\nLEAD:",it.ta.slice(0,250));process.exit()
for(const i of [8,14,18]){const s=sug[i];console.log("\n",items[i].label,s.scores.slice(0,4).map(x=>x.t.split(" (")[0]+"="+x.v.toFixed(2)).join(" | "),"kw:",s.kw.join(","));console.log("   ",txt(items[i]).slice(0,300))}
