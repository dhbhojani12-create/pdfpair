const fs=require("fs");const Q="/tmp/claude-0/-home-claude/d0f961c0-bf6f-5078-a054-6532f3567bf7/scratchpad/qa/";const js=fs.readFileSync(Q+"app.js","utf8");
const grabF=n=>{const i=js.search(new RegExp("\\nfunction "+n+"\\("));if(i<0)throw n;const ends=["\nfunction","\nconst ","\nvar ","\n/*","\n//"].map(s=>js.indexOf(s,i+5)).filter(x=>x>0);return js.slice(i,Math.min(...ends))};
const line=s=>{const i=js.indexOf(s);return js.slice(i,js.indexOf("\n",i))};
let src="";for(const n of ["stemW","topicToks","nameWords","nameScore","suggestTopics","tfOf","lexScores","topicKey","lev","sameTopic","stdOf","stdsOf","stdCount","paperStandards","citedSug","chapterSug","suggestLevel","toLines","regionText"])src+=grabF(n)+"\n";
const lexI=js.indexOf("const TOPIC_LEX=[");src+=js.slice(lexI,js.indexOf("\n];",lexI)+3)+"\n"+line("const STOP=")+"\n"+line("const STDRE=")+"\nvar LEXW=.6,CBX=.5,NAMEW=.9;\n";
const F=new Function(src+";return {suggestTopics,paperStandards,chapterSug,toLines,regionText,stdOf,stdsOf,stdCount};")();
const SA=fs.readFileSync(process.env.TOP||"/tmp/e2e/sa_topics.txt","utf8").split("\n").filter(Boolean);
const items=[];for(const c of ["QC","C2","C3","C4","C5","C11"]){const IT=JSON.parse(fs.readFileSync(Q+"aud/"+c+".json"));const P=JSON.parse(fs.readFileSync(Q+"aud/"+c+"_pairs.json"));
  const its=n=>(IT[n]||[]).map(t=>({...t,s:t.s}));P.forEach((p,i)=>{const tq=p.q.map(r=>F.regionText(its(r.page),r)).join(" "),ta=p.a.map(r=>F.regionText(its(r.page),r)).join(" ");items.push({id:c+i,key:c,name:c,src:"module",label:p.label,tq,ta})})}
const txt=it=>it.tq+" "+it.ta.slice(0,4000);
const sug=F.suggestTopics([],items.map(it=>({text:txt(it),lead:it.ta.slice(0,250)})),SA);const docStd=F.paperStandards(items,SA,txt);
for(const [k,s] of docStd)console.log("chapter",k,"cites:",[...s].map(x=>x.split(":")[0]).join(", "));
let cited=0,withStd=0;const rows=items.map((it,i)=>{const s=F.chapterSug(sug[i],it,docStd,SA,txt);const c=SA.filter(t=>F.stdsOf(t).some(st=>F.stdCount(txt(it),st)>0));if(c.length){withStd++;if(s&&c.includes(s.best))cited++}return[it,s,c]});
console.log("questions:",items.length,"· citing a standard:",withStd,"· suggestion is one of the cited standards:",cited);
rows.forEach(([it,s,c])=>console.log(it.name.padEnd(4),it.label.padEnd(16),"→",(s?s.best.split(":")[0]:"-").padEnd(9),"| cites:",c.map(x=>x.split(":")[0]).join(",")));
