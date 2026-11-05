// ▶ Lecture player inside PDF Pair: picker, search (desktop), corner video, listen-only bar, resume. YouTube is replaced by a stand-in.
const {chromium}=require('playwright');
const FAKE=`window.YT={Player:function(el,o){const d=document.getElementById(el);const f=document.createElement('iframe');f.src='about:blank';d.replaceWith(f);
 const S={id:o.videoId,t:o.playerVars.start||0,st:-1,r:1};window.__fake=S;this._f=f;
 const tick=setInterval(()=>{if(S.st===1)S.t+=0.5*S.r},500);
 Object.assign(this,{getPlayerState:()=>S.st,getCurrentTime:()=>S.t,getDuration:()=>600,getVideoData:()=>({video_id:S.id,title:'Lecture '+S.id}),
  playVideo:()=>{if(S.id==='blockedvid1'){o.events.onError({data:150});return}S.st=1;o.events.onStateChange({data:1,target:this})},pauseVideo:()=>{S.st=2;o.events.onStateChange({data:2,target:this})},stopVideo:()=>{S.st=5},
  seekTo:t=>{S.t=t},getPlaybackRate:()=>S.r,setPlaybackRate:r=>{S.r=r},loadVideoById:x=>{S.id=x.videoId;S.t=x.startSeconds||0;this.playVideo()},loadPlaylist:()=>{}});
 setTimeout(()=>o.events.onReady({target:this}),50)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
const SAMPLE='<html><script>var ytInitialData = {"contents":{"a":[{"videoRenderer":{"videoId":"AAAAAAAAAA1","title":{"runs":[{"text":"Ind AS 116 Leases full"}]},"lengthText":{"simpleText":"1:02:10"},"ownerText":{"runs":[{"text":"CA Classes"}]}}},{"videoRenderer":{"videoId":"BBBBBBBBBB2","title":{"runs":[{"text":"Leases \\"part\\" {2}"}]}}}]}};</script></html>';
let ok=0,bad=0;const chk=(c,m)=>{c?ok++:bad++;console.log((c?'✓ ':'✗ ')+m)};
(async()=>{const b=await chromium.launch({args:['--no-proxy-server']});
 for(const desk of [false,true]){const p=await b.newPage({viewport:{width:1300,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'text/javascript',body:FAKE}));await p.route('https://i.ytimg.com/**',r=>r.abort());
  if(desk)await p.addInitScript(s=>{window.ppDesktop={onFile(){},onCapture(){},video:async()=>null,track(){},showBrowser(){},fs:{dir:async()=>null},fetchPdf:async u=>({data:new TextEncoder().encode(s),url:u}),lectures:async()=>({recent:[],courses:[]}),openLecture(){}}},SAMPLE);
  await p.goto('http://127.0.0.1:9300/app.html');await p.waitForTimeout(1500);const W=desk?'[desktop] ':'[web] ';
  chk(await p.locator('#bLec').isVisible(),W+'Lecture button shows');
  await p.click('#bLec');chk(await p.locator('#lecPop').isVisible(),W+'list opens');
  chk((await p.getAttribute('#lecQ','placeholder')).includes(desk?'Search':'Paste'),W+'box says '+(desk?'search':'paste a link'));
  if(desk){await p.fill('#lecQ','leases');await p.press('#lecQ','Enter');await p.waitForTimeout(300);
   const n=await p.locator('#lecPop .li').count();chk(n===2,W+'search shows 2 results ('+n+')');
   chk((await p.locator('#lecPop .li b').nth(1).textContent())==='Leases "part" {2}',W+'tricky title read right');
   await p.locator('#lecPop .li').first().click()}
  else{await p.fill('#lecQ','https://youtu.be/AAAAAAAAAA1?t=90');await p.press('#lecQ','Enter')}
  await p.waitForTimeout(900);
  chk(await p.locator('#lecPop').isHidden(),W+'list closes');
  const box=await p.locator('#lp').boundingBox();chk(box&&box.x>800&&box.width>300,W+'video sits in the corner '+JSON.stringify(box&&{x:Math.round(box.x),w:Math.round(box.width)}));
  chk(await p.evaluate(()=>window.__fake.st)===1,W+'plays');
  if(!desk)chk(await p.evaluate(()=>window.__fake.t)>=90,W+'starts at the link time');
  await p.hover('#lp');await p.waitForTimeout(250);chk(await p.locator('#lp .lpb').evaluate(e=>getComputedStyle(e).opacity)==='1',W+'controls show on hover');
  await p.click('#lp [data-l=pp]');chk(await p.evaluate(()=>window.__fake.st)===2,W+'pause');
  await p.keyboard.press('Alt+K');chk(await p.evaluate(()=>window.__fake.st)===1,W+'Alt+K plays');
  const t0=await p.evaluate(()=>window.__fake.t);await p.keyboard.press('Alt+L');chk(await p.evaluate(()=>window.__fake.t)-t0>=9,W+'Alt+L +10 s');
  await p.hover('#lp');await p.click('#lp [data-l=rate]');chk(await p.evaluate(()=>window.__fake.r)===1.25,W+'speed 1.25');
  await p.click('#lp [data-l=aud]');await p.waitForTimeout(200);
  chk(await p.locator('#lpA').isVisible(),W+'listen-only bar shows');const vb=await p.locator('#lp').boundingBox();chk(vb.x<0,W+'video hidden off screen, still playing: '+(await p.evaluate(()=>window.__fake.st)===1));
  await p.click('#lpA [data-l=link]');await p.waitForTimeout(100);chk((await p.textContent('#toast')).includes('Open a question set'),W+'📌 asks for a set when none open');
  await p.click('#lpA [data-l=vid]');await p.waitForTimeout(200);chk(await p.locator('#lpA').isHidden()&&(await p.locator('#lp').boundingBox()).x>800,W+'back to video');
  // drag the video by its top strip
  await p.hover('#lp');const b1=await p.locator('#lp').boundingBox();await p.mouse.move(b1.x+100,b1.y+10);await p.mouse.down();await p.mouse.move(b1.x-300,b1.y-200,{steps:5});await p.mouse.up();
  const b2=await p.locator('#lp').boundingBox();chk(Math.abs(b2.x-(b1.x-400))<3&&Math.abs(b2.y-(b1.y-210))<3,W+'drag moves it');
  await p.evaluate(()=>window.__fake.t=200);await p.hover('#lp');await p.click('#lp [data-l=x]');await p.waitForTimeout(150);
  chk((await p.locator('#lp').boundingBox()).x<0&&await p.locator('#lpA').isHidden(),W+'close hides it');
  await p.keyboard.press('Alt+Y');await p.waitForTimeout(200);const cw=await p.locator('#lecPop .lh').first().textContent().catch(()=>'');
  chk(cw==='Continue watching',W+'Alt+Y opens list with Continue watching');
  chk((await p.locator('#lecPop .li small').first().textContent()).startsWith('3:20'),W+'remembers 3:20');
  await p.locator('#lecPop .li').first().click();await p.waitForTimeout(400);chk(Math.round(await p.evaluate(()=>window.__fake.t))>=200,W+'resumes where you stopped');
  if(!desk){await p.click('#bLec');await p.fill('#lecQ','blockedvid1');await p.press('#lecQ','Enter');await p.waitForTimeout(400);
   chk(await p.locator('#lp .lpmsg').isVisible()&&(await p.textContent('#lp .lpmsg')).includes('does not allow'),W+'blocked video explains itself');
   await p.click('#bLec');await p.fill('#lecQ','hello world');await p.press('#lecQ','Enter');await p.waitForTimeout(100);chk((await p.textContent('#toast')).includes('desktop app'),W+'web: search explains it needs a link')}
  chk(!errs.length,W+'no page errors '+errs.join(' | '));await p.close()}
 await b.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0)})();
