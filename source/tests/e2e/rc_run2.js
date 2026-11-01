const F=require("./rc.js");const items=require("/tmp/e2e/bank_items.json");
const tagged=items.filter(it=>it.tags.length);const cnt=new Map();tagged.forEach(it=>it.tags.forEach(t=>cnt.set(t,(cnt.get(t)||0)+1)));
const topics=[...cnt.keys()];const txt=it=>(it.tq||"")+" "+(it.ta||"").slice(0,4000);
const trainIts=tagged;const its=tagged.filter(it=>it.tq.trim());
const K=5,res=new Map();const fold=it=>{let h=0;for(const c of it.id)h=(h*31+c.charCodeAt(0))>>>0;return h%K};
const subT=new Map();tagged.forEach(it=>it.tags.forEach(t=>{if(!subT.has(it.sub))subT.set(it.sub,new Set());subT.get(it.sub).add(t)}));
const restrict=(s,al)=>{if(!s||!al||al.size<2)return s;const sc=s.scores.filter(x=>al.has(x.t));if(!sc.length||sc[0].v<=0)return null;return{...s,scores:sc,best:sc[0].t}};
for(let k=0;k<K;k++){const test=its.filter(it=>fold(it)===k);const tr=trainIts.filter(it=>fold(it)!==k);const out=F.suggestTopics(tr.map(it=>({text:txt(it),tags:it.tags})),test.map(it=>({text:txt(it)})),topics);test.forEach((it,i)=>res.set(it.id,restrict(out[i],subT.get(it.sub))))}
const rows=[];for(const it of its){const s=res.get(it.id),cur=it.tags;let level=0,sug=null;
 if(s&&!cur.some(x=>F.sameTopic(x,s.best))){const top=s.scores[0].v;const cv=Math.max(0,...cur.map(c=>{const m=s.scores.find(x=>F.sameTopic(x.t,c));return m?m.v:0}));const gap=top-cv;
  const tw=new Set(F.nameWords(txt(it)));const ndA=F.nameScore(txt(it),s.best,null,tw),ndC=Math.max(0,...cur.map(c=>F.nameScore(txt(it),c,null,tw)));
  if(gap>.35||(ndA>=.7&&ndC<.3&&gap>.1))level=3;else if(gap>.18)level=2;if(level)sug=s.best;
  if(level)rows.push({name:it.name,label:it.label,cur:cur[0],sug,level,gap:+gap.toFixed(2),curN:cnt.get(cur[0]),ndA:+ndA.toFixed(2),ndC:+ndC.toFixed(2)})}}
console.log("tagged",tagged.length,"topics",topics.length,"flagged",rows.length,"strong",rows.filter(r=>r.level===3).length);
console.log([...cnt.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[1]+" "+x[0]).join("\n"));
rows.slice(0,40).forEach(r=>console.log(r.level,r.gap,"n="+r.curN,r.name,r.label,"|",r.cur,"→",r.sug,r.ndA,r.ndC));
