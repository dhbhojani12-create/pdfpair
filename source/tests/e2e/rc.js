const fs=require("fs");const js=fs.readFileSync("/tmp/claude-0/-home-claude/d0f961c0-bf6f-5078-a054-6532f3567bf7/scratchpad/qa/app.js","utf8");
const grabF=n=>{const i=js.search(new RegExp("\\nfunction "+n+"\\("));if(i<0)throw n;const j=js.indexOf("\nfunction",i+5),k=js.indexOf("\nconst ",i+5),l=js.indexOf("\nvar ",i+5),m=js.indexOf("\n/*",i+5);const e=Math.min(...[j,k,l,m].filter(x=>x>0));return js.slice(i,e)};
const grabC=(start)=>{const i=js.indexOf(start);const e=js.indexOf("\n",js.indexOf("];",i)>0&&start.includes("[")?js.indexOf("];",i):i);return js.slice(i,js.indexOf("\n",i))};
let src="";for(const n of ["stemW","topicToks","nameWords","nameScore","suggestTopics","tfOf","lexScores","topicKey","lev","sameTopic","cleanTopic","docIndAS","indasTopic"])src+=grabF(n)+"\n";
const lexI=js.indexOf("const TOPIC_LEX=[");const lexE=js.indexOf("\n];",lexI)+3;src+=js.slice(lexI,lexE)+"\n";
src+=js.slice(js.indexOf("const STOP="),js.indexOf("\n",js.indexOf("const STOP=")))+"\n";src+=js.slice(js.indexOf("const INDAS_LIST="),js.indexOf("\n",js.indexOf("const INDAS_LIST=")))+"\n";
src+="var LEXW=.6,CBX=.5,NAMEW=.9;\n";
module.exports=new Function(src+";return {suggestTopics,nameScore,nameWords,sameTopic,topicKey,docIndAS,indasTopic};")();
