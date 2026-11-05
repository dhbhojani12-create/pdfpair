/* PDF Pair browser tools: notes, highlights, courses, focus, playback, reader, save PDF, lecture links, command bar, split view.
   Loaded by browser.html (from the GitHub site, or the bundled copy when offline). Needs the v2 desktop app (br.kv etc.). */
(function(){
if(!(window.br&&br.kv&&br.inset)){window.TOOLS={onState(){},onKey(){}};return}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>{t=Math.max(0,Math.floor(t||0));const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')};
const fmtM=m=>m>=60?Math.floor(m/60)+'h '+Math.round(m%60)+'m':Math.round(m)+'m';
const say=(m,ms)=>{try{msg(m,ms)}catch(e){}};
/* ---- storage (files in the app's data folder, through main) */
const KV={},kvT={};
async function kget(k,def,fresh){if(fresh||!(k in KV)){let v=null;try{v=await br.kv.get(k)}catch(e){}KV[k]=v==null?def:v}return KV[k]}
function kset(k,v,now){KV[k]=v;clearTimeout(kvT[k]);if(now)br.kv.set(k,v);else kvT[k]=setTimeout(()=>br.kv.set(k,v),800)}
/* ---- page identity: a YouTube video keeps its notes and progress whatever the URL extras */
const vidOf=u=>{try{const x=new URL(u);if(/youtu\.be$/.test(x.hostname))return x.pathname.slice(1);if(/youtube\.com$/.test(x.hostname.replace(/^www\.|^m\./,''))&&x.searchParams.get('v'))return x.searchParams.get('v');return null}catch(e){return null}};
const pageKey=u=>{const v=vidOf(u);if(v)return 'yt:'+v;try{const x=new URL(u);return x.origin+x.pathname}catch(e){return u}};
const isWeb=u=>/^https?:/.test(u||'');
function atTime(u,t){const v=vidOf(u);if(v)return 'https://www.youtube.com/watch?v='+v+'&t='+Math.floor(t)+'s';return u.replace(/#.*$/,'')+'#t='+Math.floor(t)}
/* ---- in-page helper for videos (speed, resume, silence skipping, sleep timer) */
const HELPER=`(()=>{if(window.__ppv)return 1;
const pick=()=>[...document.querySelectorAll('video')].filter(v=>v.readyState>0||v.currentSrc).sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];
const P=window.__ppv={pick,skipped:0,base:0,
 info(){const v=pick();if(!v)return null;if(!v.__pp){v.__pp=1;v.addEventListener('ratechange',()=>{if(!P.fast)P.base=v.playbackRate})}
  const ch=(document.querySelector('ytd-video-owner-renderer #channel-name a,#owner #channel-name a,ytd-channel-name a')||{}).textContent||'';
  return {t:v.currentTime,d:isFinite(v.duration)?v.duration:0,p:v.paused,r:P.fast?(P.base||1):v.playbackRate,title:document.title.replace(/^\\(\\d+\\)\\s*/,'').replace(/ - YouTube$/,''),ch:ch.trim(),skipped:P.skipped,sil:!!P.sil,sleep:P.sleepAt||0,sleepEnd:!!P.sleepEnd}},
 seek(t){const v=pick();if(v)v.currentTime=t;return !!v},
 rate(r){const v=pick();if(!v)return false;P.base=r;if(!P.fast)v.playbackRate=r;return true},
 play(){const v=pick();if(v){v.paused?v.play():v.pause()}},
 silence(on){const v=pick();if(!v)return false;P.sil=!!on;
  if(on&&!P.an){try{const C=new AudioContext(),src=C.createMediaElementSource(v),an=C.createAnalyser();an.fftSize=2048;src.connect(an);an.connect(C.destination);P.an=an;P.buf=new Float32Array(an.fftSize);P.q=0;
    P.tm=setInterval(()=>{const v2=pick();if(!P.sil||!v2||v2.paused){if(P.fast&&v2){v2.playbackRate=P.base||1;P.fast=0}return}an.getFloatTimeDomainData(P.buf);let s=0;for(let i=0;i<P.buf.length;i+=4)s+=P.buf[i]*P.buf[i];const rms=Math.sqrt(s/(P.buf.length/4));const base=P.base||v2.playbackRate||1;
      if(rms<0.008){P.q+=100;if(P.q>=400&&!P.fast){P.fast=Date.now();v2.playbackRate=Math.min(4,base*2.5)}}
      else{if(P.fast){const w=(Date.now()-P.fast)/1000,f=Math.min(4,base*2.5);P.skipped+=w*f/base-w;v2.playbackRate=base;P.fast=0}P.q=0}},100)}catch(e){P.sil=false;return false}}
  if(!on&&P.fast){v.playbackRate=P.base||1;P.fast=0}return true},
 sleep(min,end){clearTimeout(P.st);clearInterval(P.se);P.sleepAt=0;P.sleepEnd=false;
  if(min>0){P.sleepAt=Date.now()+min*60000;P.st=setTimeout(()=>{const v=pick();if(v)v.pause();P.sleepAt=0},min*60000)}
  if(end){P.sleepEnd=true;P.se=setInterval(()=>{const v=pick();if(v&&v.duration&&v.currentTime>=v.duration-1.5){v.pause();clearInterval(P.se);P.sleepEnd=false}},500)}return true}};return 1})()`;
async function inPage(js){try{return await br.run(js)}catch(e){return null}}
async function vinfo(){await inPage(HELPER);return await inPage('window.__ppv&&__ppv.info()')}
/* ---- highlights on web pages (CSS highlights: nothing on the page is changed) */
const HLJS=`(()=>{if(window.__pphl)return 1;window.__pphl=function(list){try{
 if(!document.getElementById('__pphls')){const s=document.createElement('style');s.id='__pphls';s.textContent='::highlight(pph){background:#fde047;color:inherit}';(document.head||document.documentElement).append(s)}
 const map=[];let full='',sp=true;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(n.parentElement.tagName)?2:1});
 let n;while(n=w.nextNode()){const t=n.nodeValue;for(let i=0;i<t.length;i++){const c=t[i];if(/\\s/.test(c)){if(sp)continue;full+=' ';sp=true}else{full+=c.toLowerCase();sp=false}map.push([n,i])}}
 const rs=[];for(const x of list){const q=String(x).replace(/\\s+/g,' ').trim().toLowerCase();if(!q)continue;const k=full.indexOf(q);if(k<0)continue;const a=map[k],b=map[k+q.length-1];if(!a||!b)continue;const r=new Range();r.setStart(a[0],a[1]);r.setEnd(b[0],b[1]+1);rs.push(r)}
 CSS.highlights.set('pph',new Highlight(...rs));return rs.length}catch(e){return -1}};return 1})()`;
async function applyHL(){const u=cur.url;if(!isWeb(u))return;const H=await kget('hl',{});const L=(H[pageKey(u)]||{}).items||[];if(!L.length)return;await inPage(HLJS);await inPage('__pphl('+JSON.stringify(L.map(x=>x.x))+')')}
async function highlight(){const t=await inPage('(()=>{const s=String(getSelection()||"").replace(/\\s+/g," ").trim();return s})()');
  if(!t||t.length<3){say('Select some text on the page first, then press 🖍 (Alt+H)');return}
  const H=await kget('hl',{}),k=pageKey(cur.url),e=H[k]=H[k]||{title:cur.title,u:cur.url,items:[]};e.title=cur.title||e.title;
  if(!e.items.some(x=>x.x===t.slice(0,2000)))e.items.push({x:t.slice(0,2000),at:Date.now()});kset('hl',H,true);
  await inPage(HLJS);await inPage('__pphl('+JSON.stringify(e.items.map(x=>x.x))+');getSelection().removeAllRanges()');say('🖍 Highlighted · see it in 🗒 Notes');if(panelOn&&ptab==='notes')renderPanel()}
/* ---- reader mode */
let RSRC=null;const readerOn=new Set();
async function reader(){const a=TABS.find(t=>t.active);if(!a)return;
  if(readerOn.has(a.id)){readerOn.delete(a.id);$('#readB').classList.remove('on');br.cmd('reload');return}
  if(!RSRC){try{const r=await fetch('readability.js');if(r.ok)RSRC=await r.text()}catch(e){}if(!RSRC)RSRC=await br.asset('readability.js')}
  if(!RSRC){say('Reader mode needs the internet the first time');return}
  const st=await kget('reader',{size:19,theme:'light'});
  const res=await inPage(RSRC+`;(()=>{try{const art=new Readability(document.cloneNode(true)).parse();if(!art||!art.content||art.textContent.length<200)return 'none';
   const S=${JSON.stringify(st)};const th={light:['#fff','#1f2235'],sepia:['#f6efe1','#3b2f20'],dark:['#17181f','#e6e6ee']};
   const css='html,body{margin:0;background:var(--bg);color:var(--fg)}body{font:var(--fs) Georgia,"Times New Roman",serif;line-height:1.7}#rd{max-width:760px;margin:0 auto;padding:30px 24px 80px}h1.t{font:700 1.6em "Segoe UI",system-ui,sans-serif;line-height:1.25;margin:0 0 6px}.by{font:13px "Segoe UI",system-ui;opacity:.65;margin-bottom:22px}img,video,iframe{max-width:100%;height:auto}a{color:#4f46e5}pre,code{white-space:pre-wrap}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ccc;padding:4px 8px}#rb{position:sticky;top:0;display:flex;gap:6px;justify-content:center;padding:8px;background:var(--bg);border-bottom:1px solid rgba(127,127,127,.25);font:13px "Segoe UI",system-ui;z-index:9}#rb button{border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit}';
   document.documentElement.innerHTML='<head><meta charset="utf-8"><title></title><style>'+css+'</style></head><body><div id="rb"><button data-a="-">A−</button><button data-a="+">A+</button><button data-a="light">☀ Light</button><button data-a="sepia">📜 Sepia</button><button data-a="dark">🌙 Dark</button></div><div id="rd"><h1 class="t"></h1><div class="by"></div><div id="ct"></div></div></body>';
   document.title=art.title||'Reader';document.querySelector('h1.t').textContent=art.title||'';document.querySelector('.by').textContent=[art.byline,art.siteName].filter(Boolean).join(' · ');document.querySelector('#ct').innerHTML=art.content;
   const R=document.documentElement;let fs=S.size;const set=t=>{R.style.setProperty('--bg',th[t][0]);R.style.setProperty('--fg',th[t][1])};set(S.theme);R.style.setProperty('--fs',fs+'px');
   document.querySelector('#rb').onclick=e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;if(a==='+'||a==='-'){fs=Math.max(14,Math.min(30,fs+(a==='+'?1:-1)));R.style.setProperty('--fs',fs+'px')}else set(a);window.__rds={size:fs,theme:a.length>1?a:(window.__rds||S).theme}};
   window.__rds=S;return 'ok'}catch(e){return 'err:'+e.message}})()`);
  if(res==='ok'){readerOn.add(a.id);$('#readB').classList.add('on');say('📖 Reader mode · 📄 Save PDF now gives a clean PDF');
    clearInterval(reader.t);reader.t=setInterval(async()=>{if(!readerOn.has(a.id)){clearInterval(reader.t);return}const s2=await inPage('window.__rds||null');if(s2&&s2.size){const o=KV.reader||{};if(o.size!==s2.size||o.theme!==s2.theme)kset('reader',{size:s2.size,theme:s2.theme})}},3000)}
  else say(res==='none'?'This page has no article to show in reader mode':'Reader mode is not available on this page')}
/* ---- save page as PDF */
async function savePdf(){if(!isWeb(cur.url)&&!readerOn.size){say('Open a web page first');return}say('📄 Making the PDF…');const r=await br.pdf({name:cur.title});
  if(r&&r.ok){say('📄 “'+r.name+'” sent to PDF Pair · pick its subject there',9000);br.appShow()}else say('Could not make a PDF of this page')}
/* ---- PDF Pair bridge */
const APP=js=>br.app('(()=>{if(!window.__ppDesk)return {error:"Update PDF Pair (reload it)"};return '+js+'})()');
async function linkMoment(){const i=isWeb(cur.url)?await vinfo():null;
  const o=i?{u:atTime(cur.url,i.t),t:Math.floor(i.t),title:i.title||cur.title,kind:'video'}:{u:cur.url,t:null,title:cur.title,kind:'page'};
  if(!isWeb(o.u)){say('Open a lecture or page first');return}
  const r=await APP('__ppDesk.link('+JSON.stringify(o)+')');
  if(r&&r.ok)say('📌 Linked to '+r.label+(o.t!=null?' at '+fmt(o.t):''),8000);else say('📌 '+((r&&r.error)||'Could not link'),8000)}
async function noteToQ(text,t){const o={text,u:t!=null?atTime(cur.url,t):cur.url,t:t==null?null:Math.floor(t),title:cur.title};const r=await APP('__ppDesk.note('+JSON.stringify(o)+')');
  say(r&&r.ok?'🗒 Note added to '+r.label:'🗒 '+((r&&r.error)||'Could not add the note'),8000)}
/* ---- playback memory: resume where you stopped, speed per channel, silence skipping */
let progT=null,lastKeyLoaded='';
async function pageInit(){const u=cur.url;if(!isWeb(u))return;const key=pageKey(u);applyHL();
  if(lastKeyLoaded===key)return;lastKeyLoaded=key;
  for(let k=0;k<6;k++){const i=await vinfo();if(i&&i.d>0){const P=await kget('pos',{}),p=P[key],play=await kget('play',{rates:{},silence:false});
      const msgs=[];
      if(p&&p.t>30&&p.t<i.d-20&&i.t<p.t-10){await inPage('__ppv.seek('+p.t+')');msgs.push('resumed at '+fmt(p.t))}
      const rk=i.ch?'ch:'+i.ch:'h:'+new URL(u).hostname;const r=play.rates[rk];if(r&&Math.abs(r-i.r)>.01){await inPage('__ppv.rate('+r+')');msgs.push(r+'× for '+(i.ch||new URL(u).hostname))}
      if(play.silence){await inPage('__ppv.silence(true)');msgs.push('skipping silence')}
      if(msgs.length)say('⏩ '+msgs.join(' · '),7000);return}
    await new Promise(r=>setTimeout(r,1500));if(cur.url!==u)return}}
async function trackProgress(){if(!isWeb(cur.url)||document.hidden)return;const i=await inPage('window.__ppv&&__ppv.info()');if(!i||!i.d)return;
  const P=await kget('pos',{}),k=pageKey(cur.url),o=P[k]||{max:0};o.t=i.t;o.d=i.d;o.title=i.title||o.title;o.u=cur.url;o.at=Date.now();o.max=Math.max(o.max||0,i.t);o.ch=i.ch||o.ch;P[k]=o;
  const ks=Object.keys(P);if(ks.length>600){ks.sort((a,b)=>(P[a].at||0)-(P[b].at||0)).slice(0,ks.length-600).forEach(x=>delete P[x])}
  kset('pos',P);if(panelOn&&ptab==='courses')renderCoursesLive()}
setInterval(trackProgress,5000);
async function playMenu(){const m=$('#vmenu');if(!m.hidden){closePops();return}closePops();const i=await vinfo();
  if(!i){say('No video on this page');return}const play=await kget('play',{rates:{},silence:false});
  m.innerHTML='<div class="lbl">Speed'+(i.ch?' · remembered for '+esc(i.ch):'')+'</div><div class="chips" id="vsp"></div><div class="lbl">Skip silent gaps</div><div class="chips"><button class="chip" id="vsil"></button><span class="me" id="vsv"></span></div><div class="lbl">Sleep timer</div><div class="chips" id="vsl"></div><div class="me" id="vst"></div>';
  [0.75,1,1.25,1.5,1.75,2,2.5].forEach(r=>{const b=document.createElement('button');b.className='chip'+(Math.abs(i.r-r)<.01?' on':'');b.textContent=r+'×';b.onclick=async()=>{await inPage('__ppv.rate('+r+')');const P2=await kget('play',{rates:{},silence:false});P2.rates[i.ch?'ch:'+i.ch:'h:'+host(cur.url)]=r;kset('play',P2,true);$$('#vsp .chip').forEach(x=>x.classList.toggle('on',x===b));say('⏩ '+r+'×'+(i.ch?' for '+i.ch:''))};m.querySelector('#vsp').append(b)});
  const sb=m.querySelector('#vsil');const setS=on=>{sb.textContent=on?'✓ On (all lectures)':'Off';sb.classList.toggle('on',on)};setS(!!i.sil);
  m.querySelector('#vsv').textContent=i.skipped>5?'saved '+fmt(i.skipped)+' here':'';
  sb.onclick=async()=>{const on=!sb.classList.contains('on');const ok=await inPage('__ppv.silence('+on+')');if(on&&!ok){say('This video does not allow silence skipping');return}setS(on);const P2=await kget('play',{rates:{},silence:false});P2.silence=on;kset('play',P2,true)};
  const sl=m.querySelector('#vsl');[['Off',0],['15 min',15],['30 min',30],['45 min',45],['60 min',60],['End of video',-1]].forEach(([t,v])=>{const b=document.createElement('button');b.className='chip';b.textContent=t;
    if(v===-1&&i.sleepEnd)b.classList.add('on');
    b.onclick=async()=>{await inPage(v===-1?'__ppv.sleep(0,true)':'__ppv.sleep('+v+',false)');$$('#vsl .chip').forEach(x=>x.classList.toggle('on',x===b&&v!==0));say(v===0?'Sleep timer off':v===-1?'⏾ Pauses at the end of this video':'⏾ Pauses in '+v+' min')};sl.append(b)});
  m.querySelector('#vst').textContent=i.sleep?'⏾ pauses at '+new Date(i.sleep).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):i.sleepEnd?'⏾ pauses at the end of this video':'';
  place(m,$('#playB'),320);m.hidden=false;cover()}
/* ---- split view */
async function splitMenu(){if(SPLIT==null){br.split({op:'toggle'});say('⇆ Split view · click a tab to put it on the left; ⇆ again for options');return}
  const m=$('#smenu');if(!m.hidden){closePops();return}closePops();m.innerHTML='<div class="lbl">Left · right</div><div class="chips" id="sr"></div>';
  [['40 · 60',.4],['50 · 50',.5],['60 · 40',.6],['70 · 30',.7]].forEach(([t,r])=>{const b=document.createElement('button');b.className='chip';b.textContent=t;b.onclick=()=>{br.split({op:'on',ratio:r,id:SPLIT});closePops()};m.querySelector('#sr').append(b)});
  const a=document.createElement('div');a.className='mi';a.innerHTML='<span>⇄ Swap sides</span>';a.onclick=()=>{closePops();br.tab({op:'switch',id:SPLIT})};m.append(a);
  const c=document.createElement('div');c.className='mi';c.innerHTML='<span>✕ Close split view</span>';c.onclick=()=>{closePops();br.split({op:'off'})};m.append(c);
  place(m,$('#splitB'),240);m.hidden=false;cover()}
/* ---- side panel */
let panelOn=false,ptab='notes';
async function setPanel(on,tab){panelOn=on;if(tab)ptab=tab;$('#panel').hidden=!on;$('#panelB').classList.toggle('on',on);$$('#ptabs button').forEach(b=>b.classList.toggle('on',b.dataset.p===ptab));reportInset();if(on)renderPanel();const p=await kget('ui',{});p.panel=on;p.ptab=ptab;kset('ui',p)}
$$('#ptabs button').forEach(b=>b.onclick=()=>setPanel(true,b.dataset.p));
function renderPanel(){if(!panelOn)return;({notes:renderNotes,courses:renderCourses,focus:renderFocus,history:renderHistory})[ptab]()}
/* history */
let histQ='';
async function renderHistory(){const body=$('#pbody');const L=(await br.hist.get(histQ,400))||[];
  body.innerHTML='<div class="card" style="background:#f6f5ff"><h4>🕘 History</h4><input id="hQ" placeholder="Search history…" style="width:100%;height:34px;border:1.5px solid var(--line);border-radius:9px;padding:0 10px;background:#fff" value="'+esc(histQ)+'"><div class="row" style="justify-content:space-between;margin-top:8px"><span class="sub">'+L.length+(L.length>=400?'+':'')+' pages · Ctrl+H</span><button class="btn" id="hClr">Clear history</button></div></div><div id="hL"></div>';
  const box=body.querySelector('#hL');if(!L.length)box.innerHTML='<div class="empty">'+(histQ?'Nothing found':'Pages you visit appear here')+'</div>';
  const day=t=>{const d=new Date(t),n=new Date(),y=new Date(n);y.setDate(n.getDate()-1);return d.toDateString()===n.toDateString()?'Today':d.toDateString()===y.toDateString()?'Yesterday':d.toLocaleDateString([], {weekday:'long',day:'numeric',month:'short'})};
  let last='',card=null;L.forEach(x=>{const g=day(x.at||0);if(g!==last){last=g;card=document.createElement('div');card.className='card';card.innerHTML='<h4>'+esc(g)+'</h4>';box.append(card)}
    const r=document.createElement('div');r.className='mi';r.title=x.u+'\nCtrl+click: new tab';r.innerHTML='<small style="width:44px;flex:none">'+new Date(x.at||0).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})+'</small><span></span><small></small>';
    r.querySelector('span').textContent=x.t||x.u;r.querySelectorAll('small')[1].textContent=host(x.u);r.onclick=e=>e.ctrlKey?br.tab({op:'new',url:x.u}):br.go(x.u);card.append(r)});
  const q=body.querySelector('#hQ');q.addEventListener('input',()=>{histQ=q.value;clearTimeout(renderHistory.t);renderHistory.t=setTimeout(async()=>{await renderHistory();const q2=$('#hQ');if(q2){q2.focus();q2.setSelectionRange(q2.value.length,q2.value.length)}},250)});
  body.querySelector('#hClr').onclick=()=>ask('Type CLEAR to delete your browsing history','',v=>{if(v.toUpperCase()==='CLEAR'){br.hist.clear();setTimeout(renderHistory,300);say('History cleared')}})}
/* notes */
async function renderNotes(){const body=$('#pbody'),u=cur.url,k=pageKey(u);const N=await kget('notes',{}),H=await kget('hl',{});
  if(!isWeb(u)){body.innerHTML='<div class="empty">Open a web page or lecture to write notes for it.</div>'+allPages(N,H);bindAll(body);return}
  const e=N[k]||{items:[]},h=(H[k]||{}).items||[];const vid=!!vidOf(u)||!!(await inPage('!!document.querySelector("video")'));
  body.innerHTML='<div class="card"><h4>🗒 '+esc(cur.title||host(u))+'</h4><div class="sub" style="margin-bottom:8px">Notes for this '+(vid?'lecture':'page')+' are saved by themselves.</div>'+
   '<textarea class="ni" id="nIn" placeholder="Write a note…  (Ctrl+Enter to add)"></textarea><div class="row" style="margin-top:8px;justify-content:space-between">'+(vid?'<button class="btn" id="nTime" title="Add with the current video time">⏱ With time</button>':'<span></span>')+'<button class="btn pr" id="nAdd">Add note</button></div></div>'+
   '<div class="card"><h4>Notes <span class="sub">'+e.items.length+'</span></h4><div id="nList">'+(e.items.length?'':'<div class="empty">No notes yet</div>')+'</div></div>'+
   '<div class="card"><h4>🖍 Highlights <span class="sub">'+h.length+'</span></h4><div id="hList">'+(h.length?'':'<div class="empty">Select text on the page and press 🖍 Highlight (Alt+H)</div>')+'</div></div>'+allPages(N,H);
  const L=body.querySelector('#nList');e.items.forEach((it,i)=>L.append(noteRow(it,()=>{e.items.splice(i,1);N[k]=e;kset('notes',N,true);renderNotes()})));
  const HL=body.querySelector('#hList');h.forEach((it,i)=>HL.append(noteRow({x:it.x,t:null},async()=>{h.splice(i,1);kset('hl',H,true);await inPage(HLJS);await inPage('__pphl('+JSON.stringify(h.map(x=>x.x))+')');renderNotes()},'#fef9c3')));
  const add=async withT=>{const x=body.querySelector('#nIn').value.trim();let t=null;if(withT){const i=await vinfo();t=i?i.t:null}if(!x&&t==null)return;
    e.title=cur.title;e.u=u;e.items.push({x,t:t==null?null:Math.floor(t),at:Date.now()});N[k]=e;kset('notes',N,true);renderNotes()};
  body.querySelector('#nAdd').onclick=()=>add(false);const nt=body.querySelector('#nTime');if(nt)nt.onclick=()=>add(true);
  body.querySelector('#nIn').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.ctrlKey){ev.preventDefault();add(vid)}});bindAll(body)}
function noteRow(it,del,bg){const d=document.createElement('div');d.className='note';if(bg)d.style.background=bg;if(bg)d.style.borderRadius='8px',d.style.padding='7px 8px',d.style.marginTop='5px';
  d.innerHTML=(it.t!=null?'<button class="ts" title="Jump to this moment">'+fmt(it.t)+'</button>':'')+'<div class="tx"></div><div class="na"><button class="q" title="Add to the question open in PDF Pair">→Q</button><button class="d" title="Delete">×</button></div>';
  d.querySelector('.tx').textContent=it.x||'(moment)';const ts=d.querySelector('.ts');if(ts)ts.onclick=()=>inPage(HELPER).then(()=>inPage('__ppv.seek('+it.t+')'));
  d.querySelector('.q').onclick=()=>noteToQ(it.x||'',it.t);d.querySelector('.d').onclick=del;return d}
function allPages(N,H){const keys=[...new Set([...Object.keys(N),...Object.keys(H)])].filter(k=>((N[k]||{}).items||[]).length||((H[k]||{}).items||[]).length);if(!keys.length)return '';
  return '<div class="card"><h4>📚 All pages with notes <span class="sub">'+keys.length+'</span></h4>'+keys.slice(0,40).map(k=>{const e=N[k]||H[k];const n=((N[k]||{}).items||[]).length,h=((H[k]||{}).items||[]).length;
    return '<div class="mi" data-go="'+esc(e.u||'')+'"><span>'+esc(e.title||e.u||k)+'</span><small>'+(n?n+' note'+(n>1?'s':''):'')+(n&&h?' · ':'')+(h?h+' 🖍':'')+'</small></div>'}).join('')+'</div>'}
function bindAll(body){body.querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>{if(x.dataset.go)br.go(x.dataset.go)})}
/* courses */
async function subjects(){const r=await APP('__ppDesk.subjects()');return Array.isArray(r)&&r.length?r:['FR','AFM','Audit','DT','IDT','IBS']}
function lecPct(P,it){const p=P[pageKey(it.u)];if(!p||!p.d)return 0;return Math.min(1,(p.max||p.t||0)/p.d)}
async function renderCourses(){const body=$('#pbody');const C=await kget('courses',[]),P=await kget('pos',{});const hasVid=!!vidOf(cur.url);
  body.innerHTML='<div class="card" style="background:#f6f5ff"><h4>🎓 Courses</h4><div class="sub">Group lectures into a course to see how much is left. Progress fills in as you watch.</div><div class="row" style="justify-content:flex-start"><button class="btn pr" id="cAddL"'+(hasVid?'':' disabled title="Open a YouTube lecture first"')+'>＋ Add this lecture</button><button class="btn" id="cNew">＋ New course</button></div></div><div id="cList"></div>';
  const L=body.querySelector('#cList');if(!C.length)L.innerHTML='<div class="empty">No courses yet. Open a lecture and press ＋ Add this lecture.</div>';
  C.forEach((c,ci)=>{const items=c.items||[];let dt=0,dw=0;items.forEach(it=>{const p=P[pageKey(it.u)];if(p&&p.d){dt+=p.d;dw+=Math.min(p.d,p.max||p.t||0)}});const pct=dt?dw/dt:0;
    const d=document.createElement('div');d.className='card';d.innerHTML='<h4><span style="flex:1">'+esc(c.name)+'</span><span class="sub">'+esc(c.subject||'')+'</span></h4><div class="bar"><i style="width:'+Math.round(pct*100)+'%"></i></div><div class="sub" style="margin-top:5px">'+Math.round(pct*100)+'% · '+items.length+' lecture'+(items.length===1?'':'s')+(dt?' · '+fmtM((dt-dw)/60)+' left':'')+'</div><div class="cl" hidden></div>';
    d.querySelector('h4').style.cursor='pointer';d.querySelector('h4').onclick=()=>{const x=d.querySelector('.cl');x.hidden=!x.hidden};
    const cl=d.querySelector('.cl');items.forEach((it,ii)=>{const p=P[pageKey(it.u)]||{},pc=lecPct(P,it);const r=document.createElement('div');r.className='note';
      r.innerHTML='<div class="tx"><div>'+(pc>.95?'✓ ':'')+esc(it.title||it.u)+'</div><div class="bar" style="margin-top:4px"><i style="width:'+Math.round(pc*100)+'%"></i></div></div><div class="na"><button class="pl" title="Continue">▶</button><button class="d" title="Remove from course">×</button></div>';
      r.querySelector('.pl').onclick=()=>br.go(p.t>30?atTime(it.u,p.t):it.u);r.querySelector('.d').onclick=()=>{items.splice(ii,1);kset('courses',C,true);renderCourses()};cl.append(r)});
    const del=document.createElement('div');del.className='mh';del.innerHTML='<button>Rename</button><button>Delete course</button>';del.children[0].onclick=()=>ask('Rename course',c.name,n=>{c.name=n;kset('courses',C,true);renderCourses()});
    del.children[1].onclick=()=>ask('Type DELETE to remove the course “'+c.name+'”','',v=>{if(v.toUpperCase()==='DELETE'){C.splice(ci,1);kset('courses',C,true);renderCourses()}});cl.append(del);L.append(d)});
  body.querySelector('#cNew').onclick=()=>newCourse();
  const al=body.querySelector('#cAddL');al.onclick=async()=>{if(!C.length){newCourse(true);return}const m=$('#menu');closePops();m.innerHTML='<div class="lbl">Add this lecture to</div>';m.style.width='300px';
    C.forEach(c=>{const x=document.createElement('div');x.className='mi';x.innerHTML='<span></span><small></small>';x.querySelector('span').textContent=c.name;x.querySelector('small').textContent=c.subject||'';x.onclick=()=>{closePops();addLecture(c)};m.append(x)});
    const n=document.createElement('div');n.className='mi';n.innerHTML='<span>＋ New course…</span>';n.onclick=()=>{closePops();newCourse(true)};m.append(n);place(m,al,300);m.hidden=false;cover()}}
async function renderCoursesLive(){const now=Date.now();if(renderCoursesLive.t&&now-renderCoursesLive.t<15000)return;renderCoursesLive.t=now;if(!anyOpen())renderCourses()}
async function addLecture(c){const i=await vinfo();const C=await kget('courses',[]);const cc=C.find(x=>x.id===c.id);if(!cc)return;cc.items=cc.items||[];
  if(cc.items.some(x=>pageKey(x.u)===pageKey(cur.url))){say('Already in '+cc.name);return}cc.items.push({u:'https://www.youtube.com/watch?v='+vidOf(cur.url),title:(i&&i.title)||cur.title,at:Date.now()});kset('courses',C,true);say('🎓 Added to '+cc.name);renderCourses()}
async function newCourse(thenAdd){const subs=await subjects();ask('New course name (e.g. Audit Revision Marathon)','',async n=>{
  const m=$('#menu');m.innerHTML='<div class="lbl">Subject for “'+esc(n)+'”</div>';m.style.width='260px';
  subs.forEach(s=>{const x=document.createElement('div');x.className='mi';x.innerHTML='<span></span>';x.querySelector('span').textContent=s;x.onclick=async()=>{closePops();const C=await kget('courses',[]);const c={id:'c'+Date.now(),name:n,subject:s,items:[]};C.push(c);kset('courses',C,true);if(thenAdd&&vidOf(cur.url))await addLecture(c);else renderCourses()};m.append(x)});
  m.style.top='120px';m.style.left=(innerWidth-600)+'px';m.hidden=false;cover()})}
/* focus + stats */
const DEFSITES=['youtube.com/shorts','instagram.com','facebook.com','x.com','twitter.com','reddit.com','netflix.com','hotstar.com','primevideo.com','cricbuzz.com','espncricinfo.com'];
let focusT=null;
async function focusState(){return await kget('focus',{until:0,sites:DEFSITES})}
async function startFocus(min){const F=await focusState();F.start=Date.now();F.dur=min;F.until=Date.now()+min*60000;if(!F.sites)F.sites=DEFSITES;kset('focus',F,true);say('🧘 Focus for '+min+' min · distracting sites are blocked');tickFocus();if(panelOn&&ptab==='focus')renderFocus()}
async function stopFocus(done){const F=await focusState();const was=F.until&&F.until>Date.now();F.until=0;const S=await kget('fsess',[]);if(F.start){S.push({at:F.start,min:Math.round((Date.now()-F.start)/60000),done:!!done});kset('fsess',S.slice(-500),true)}F.start=0;kset('focus',F,true);
  if(done)say('🎉 Focus session done · take a 5-minute break',10000);else if(was)say('Focus stopped');tickFocus();if(panelOn&&ptab==='focus')renderFocus()}
async function tickFocus(){const F=await focusState(),left=(F.until||0)-Date.now(),pill=$('#focusPill');
  if(left>0){pill.hidden=false;pill.textContent='🧘 '+fmt(left/1000);clearTimeout(focusT);focusT=setTimeout(tickFocus,1000);const b=$('#fBig');if(b)b.textContent=fmt(left/1000)}
  else{pill.hidden=true;if(F.until){F.until=0;await stopFocus(true)}}}
async function renderFocus(){const body=$('#pbody'),F=await focusState(),S=await kget('stats',{days:{}},true);const on=F.until>Date.now();
  const d=new Date(),dk=t=>t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  const today=S.days[dk(d)]||{};const subs=Object.entries(today).map(([k,v])=>[k,(v.read||0)+(v.watch||0),v]).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...subs.map(x=>x[1]));
  const week=[];for(let i=6;i>=0;i--){const t=new Date(d);t.setDate(d.getDate()-i);const o=S.days[dk(t)]||{};week.push([t.toLocaleDateString([], {weekday:'short'}).slice(0,2),Object.values(o).reduce((a,v)=>a+(v.read||0)+(v.watch||0),0)])}
  const wmax=Math.max(1,...week.map(x=>x[1]));const tot=subs.reduce((a,x)=>a+x[1],0);
  body.innerHTML='<div class="card" style="text-align:center;background:'+(on?'#eef2ff':'#fff')+'"><h4 style="justify-content:center">🧘 Focus</h4><div class="big" id="fBig">'+(on?fmt((F.until-Date.now())/1000):'25:00')+'</div>'+
   (on?'<div class="sub">Distracting sites are blocked until the timer ends.</div><div class="row" style="justify-content:center"><button class="btn" id="fStop">Stop</button></div>':
   '<div class="chips" style="justify-content:center" id="fPre"></div><div class="sub">Distracting sites are blocked while it runs.</div>')+'</div>'+
   '<div class="card"><h4>📊 Today <span class="sub" style="margin-left:auto">'+fmtM(tot)+'</span></h4>'+(subs.length?subs.map(([k,m,v])=>'<div class="srow"><span title="'+esc(k)+'">'+esc(k)+'</span><div class="bar"><i style="width:'+Math.round(m/max*100)+'%"></i></div><small>'+fmtM(m)+'</small></div><div class="sub" style="margin:-3px 0 6px 100px">'+(v.read?'📄 '+fmtM(v.read):'')+(v.read&&v.watch?' · ':'')+(v.watch?'🎬 '+fmtM(v.watch):'')+'</div>').join(''):'<div class="empty">Study time appears here: reading in PDF Pair and watching lectures.</div>')+'</div>'+
   '<div class="card"><h4>📅 Last 7 days</h4><div class="hb">'+week.map(([l,m])=>'<div><b style="height:'+Math.round(m/wmax*70)+'px" title="'+fmtM(m)+'"></b>'+l+'</div>').join('')+'</div></div>'+
   '<div class="card"><h4>🚫 Blocked during focus</h4><div class="sub">One per line. A path blocks only that part, e.g. youtube.com/shorts.</div><textarea class="ni" id="fSites" style="min-height:110px;margin-top:6px"></textarea><div class="row"><button class="btn" id="fSave">Save list</button></div></div>';
  if(on)body.querySelector('#fStop').onclick=()=>stopFocus(false);
  else{const pre=body.querySelector('#fPre');[25,50,90].forEach(mn=>{const b=document.createElement('button');b.className='chip';b.textContent=mn+' min';b.onclick=()=>startFocus(mn);pre.append(b)});const c=document.createElement('button');c.className='chip';c.textContent='Custom…';c.onclick=()=>ask('Focus for how many minutes?','40',v=>{const n=parseInt(v,10);if(n>0&&n<=600)startFocus(n)});pre.append(c)}
  body.querySelector('#fSites').value=(F.sites||DEFSITES).join('\n');body.querySelector('#fSave').onclick=async()=>{const F2=await focusState();F2.sites=body.querySelector('#fSites').value.split('\n').map(x=>x.trim()).filter(Boolean);kset('focus',F2,true);say('🚫 List saved')}}
/* ---- command bar */
let CQ=null,csel=0,citems=[];
async function cmdOpen(){closePops();$('#cmd').hidden=false;cover();$('#cq').value='';$('#cq').focus();CQ=null;cmdRender('');
  const r=await APP('__ppDesk.index()');CQ=Array.isArray(r)?r:[];cmdRender($('#cq').value)}
function cmdClose(){$('#cmd').hidden=true;cover()}
const ACTIONS=()=>[['➕','New tab',()=>br.tab({op:'new'})],['📖','Reader mode',reader],['🖍','Highlight selection',highlight],['📄','Save page as PDF',savePdf],['▣','Pop out video',()=>br.pip()],['📌','Link this moment to the open question',linkMoment],
  ['⏩','Playback options',playMenu],['⇆','Split view',splitMenu],['🗒','Notes panel',()=>setPanel(true,'notes')],['🎓','Courses',()=>setPanel(true,'courses')],['🧘','Focus 25 min',()=>startFocus(25)],['🧘','Focus 50 min',()=>startFocus(50)],
  ['🕘','History',()=>setPanel(true,'history')],['☆','Bookmark this page',()=>openDlg()],['◧','Back to PDF Pair',()=>br.cmd('app')],['🧹','Clear browsing history',()=>ask('Type CLEAR to delete your browsing history','',v=>{if(v.toUpperCase()==='CLEAR'){br.hist.clear();say('History cleared')}})]];
const words=q=>q.toLowerCase().split(/\s+/).filter(Boolean),hit=(t,ws)=>{t=t.toLowerCase();return ws.every(w=>t.includes(w))};
async function cmdRender(q){const ws=words(q),groups=[];
  const acts=ACTIONS().filter(a=>!ws.length||hit(a[1],ws)).slice(0,ws.length?6:8).map(a=>({i:a[0],t:a[1],run:a[2]}));
  if(q.trim()){const looks=/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q.trim())||/^https?:\/\//.test(q.trim());groups.push(['Go',[{i:looks?'🌐':'🔍',t:looks?'Open '+q.trim():'Search Google for “'+q.trim()+'”',run:()=>br.go(q.trim())}]])}
  if(acts.length)groups.push(['Actions',acts]);
  const tabs=TABS.filter(t=>!ws.length||hit(t.title+' '+t.url,ws)).slice(0,5).map(t=>({i:'🗂',t:t.title||t.url,s:host(t.url),run:()=>br.tab({op:'switch',id:t.id})}));if(tabs.length&&ws.length)groups.push(['Open tabs',tabs]);
  const bms=[];if(B){B.bar.forEach(x=>bms.push(x));B.folders.forEach(f=>f.items.forEach(x=>bms.push(Object.assign({f:f.name},x))))}
  const bm=bms.filter(x=>ws.length&&hit(x.t+' '+x.u+' '+(x.f||''),ws)).slice(0,5).map(x=>({i:'☆',t:x.t,s:(x.f?x.f+' · ':'')+host(x.u),run:()=>br.go(x.u)}));if(bm.length)groups.push(['Bookmarks',bm]);
  if(CQ&&ws.length){const qs=CQ.filter(x=>hit(x.name+' '+(x.ch||'')+' '+(x.tp||'')+' '+x.set+' '+x.sub,ws)).slice(0,7).map(x=>({i:'❓',t:x.name,s:x.set+(x.ch?' · '+x.ch:''),run:async()=>{await APP('__ppDesk.open('+JSON.stringify(x.id)+','+x.n+')');br.appShow()}}));if(qs.length)groups.push(['Your questions',qs])}
  if(ws.length){const h=await br.hist.get(q,6);const hs=(h||[]).map(x=>({i:'🕘',t:x.t||x.u,s:host(x.u),run:()=>br.go(x.u)}));if(hs.length)groups.push(['History',hs])}
  if(q!==$('#cq').value)return;citems=[];const box=$('#cr');box.innerHTML='';
  groups.forEach(([g,list])=>{const h=document.createElement('div');h.className='grp-h';h.textContent=g;box.append(h);list.forEach(it=>{const d=document.createElement('div');d.className='mi';d.innerHTML='<i></i><span></span><small></small>';d.querySelector('i').textContent=it.i;d.querySelector('span').textContent=it.t;d.querySelector('small').textContent=it.s||'';
    const k=citems.length;d.onmousemove=()=>{csel=k;mark()};d.onclick=()=>{cmdClose();it.run()};citems.push([d,it]);box.append(d)})});
  if(!citems.length)box.innerHTML='<div class="empty">Nothing found</div>';csel=0;mark()}
function mark(){citems.forEach(([d],i)=>d.classList.toggle('sel',i===csel));const c=citems[csel];if(c)c[0].scrollIntoView({block:'nearest'})}
$('#cq').addEventListener('input',()=>cmdRender($('#cq').value));
$('#cq').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();csel=Math.min(citems.length-1,csel+1);mark()}else if(e.key==='ArrowUp'){e.preventDefault();csel=Math.max(0,csel-1);mark()}
  else if(e.key==='Enter'){e.preventDefault();const c=citems[csel];if(c){cmdClose();c[1].run()}}else if(e.key==='Escape'){e.preventDefault();cmdClose()}});
$('#cmd').addEventListener('mousedown',e=>{if(e.target.id==='cmd')cmdClose()});
/* ---- wiring */
$('#readB').onclick=reader;$('#hlB').onclick=highlight;$('#pdfB').onclick=savePdf;$('#linkB').onclick=linkMoment;
$('#playB').onclick=e=>{e.stopPropagation();playMenu()};$('#splitB').onclick=e=>{e.stopPropagation();splitMenu()};
$('#panelB').onclick=()=>setPanel(!panelOn);$('#kh').onclick=cmdOpen;
let lastUrl='',lastActiveId=null,initT=null;
window.TOOLS={
  onState(s){const a=(s.tabs||[]).find(t=>t.active);if(!a)return;
    if(a.id!==lastActiveId){lastActiveId=a.id;$('#readB').classList.toggle('on',readerOn.has(a.id))}
    if(s.url!==lastUrl){const prev=lastUrl;lastUrl=s.url;if(pageKey(prev)!==pageKey(s.url)){lastKeyLoaded='';readerOn.delete(a.id);$('#readB').classList.remove('on')}
      if(panelOn&&ptab==='notes'&&!anyOpen())renderNotes()}
    if(!s.loading){clearTimeout(initT);initT=setTimeout(pageInit,900)}},
  history(){setPanel(true,'history')},
  onKey(e){const k=e.key.toLowerCase();
    if(e.ctrlKey&&k==='k'){e.preventDefault();$('#cmd').hidden?cmdOpen():cmdClose()}
    if(e.ctrlKey&&k==='.'){e.preventDefault();setPanel(!panelOn)}
    if(e.altKey&&!e.ctrlKey&&k==='h'){e.preventDefault();highlight()}
    if(e.altKey&&!e.ctrlKey&&k==='m'){e.preventDefault();linkMoment()}}};
br.onLoaded(o=>{const a=TABS.find(t=>t.active);if(a&&o.id===a.id){lastKeyLoaded='';clearTimeout(initT);initT=setTimeout(pageInit,700)}});
(async()=>{const ui=await kget('ui',{});if(ui.panel)setPanel(true,ui.ptab||'notes');tickFocus()})();
})();
