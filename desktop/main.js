// PDF Pair desktop: the same web app (from GitHub Pages) plus a built-in browser whose downloads go straight into the library
const {app,BrowserWindow,WebContentsView,ipcMain,session,net,shell,Menu,dialog,screen}=require('electron');
const path=require('path'),fs=require('fs'),os=require('os');
const APP_URL=process.env.PP_URL||'https://dhbhojani12-create.github.io/pdfpair/';
if(process.env.PP_TEST){app.commandLine.appendSwitch('ignore-certificate-errors');if(process.env.HTTPS_PROXY){app.commandLine.appendSwitch('proxy-server',process.env.HTTPS_PROXY.replace(/^https?:\/\//,'').replace(/\/$/,''));app.commandLine.appendSwitch('proxy-bypass-list','127.0.0.1;localhost')}}
const APP_ORIGIN=new URL(APP_URL).origin;
let win=null,bwin=null,view=null;
if(!app.requestSingleInstanceLock()){app.quit()}else app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
Menu.setApplicationMenu(null);
process.on('uncaughtException',err=>{try{console.error(err)}catch(e){}});

function sendFile(f){if(win&&!win.isDestroyed())win.webContents.send('pp-file',f)}
function tell(msg){if(bwin&&!bwin.isDestroyed())bwin.webContents.send('br-msg',msg)}

function createMain(){
  win=new BrowserWindow({width:1400,height:900,title:'PDF Pair',backgroundColor:'#f3f4f6',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:false}});
  win.maximize();
  const load=()=>win.loadURL(APP_URL).catch(()=>win.loadFile(path.join(__dirname,'offline.html')));
  load();
  win.webContents.setWindowOpenHandler(({url})=>{openBrowser(url);return {action:'deny'}});
  win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith(APP_ORIGIN)&&!url.startsWith('file:')){e.preventDefault();openBrowser(url)}});
  win.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F11'){e.preventDefault();win.setFullScreen(!win.isFullScreen())}if(i.type==='keyDown'&&i.key==='F12')win.webContents.toggleDevTools();if(i.type==='keyDown'&&(i.key==='F5'||(i.control&&i.key.toLowerCase()==='r'&&i.shift)))win.webContents.reload()});
  win.on('closed',()=>{win=null;if(bwin&&!bwin.isDestroyed())bwin.close()});
}

function setupBrowserSession(ses){
  try{ses.setUserAgent(app.userAgentFallback.replace(/\s*Electron\/\S+/,'').replace(/\s*(pdf-?pair|PDF Pair)\/\S+/ig,''))}catch(err){}
  // PDFs are downloaded (into the library) instead of opening in the viewer
  shield(ses);
  ses.on('will-download',(e,item)=>{
    const name=item.getFilename()||'download';
    const isPdf=/\.pdf$/i.test(name)||/pdf/i.test(item.getMimeType()||'');
    if(!isPdf){ // anything else goes to the normal Windows Downloads folder
      const dir=app.getPath('downloads'),ext=path.extname(name),base=path.basename(name,ext);let p=path.join(dir,name),k=1;
      while(fs.existsSync(p))p=path.join(dir,base+' ('+(k++)+')'+ext);
      item.setSavePath(p);tell('⤓ Downloading '+name+' to Downloads…');
      item.once('done',(ev,st)=>{tell(st==='completed'?'✓ Saved to Downloads: '+path.basename(p):'Download failed: '+name);if(st==='completed')shell.showItemInFolder(p)});
      return}
    const tmp=path.join(os.tmpdir(),'pdfpair-'+Date.now()+'-'+name.replace(/[\\/:*?"<>|]/g,'_'));
    item.setSavePath(tmp);tell('⤓ Downloading '+name+'…');
    item.once('done',(ev,state)=>{
      if(state!=='completed'){tell('Download failed: '+name);return}
      try{const data=fs.readFileSync(tmp);fs.unlinkSync(tmp);
        if(!/\.pdf$/i.test(name)&&data.slice(0,4).toString()!=='%PDF'){tell('Not a PDF: '+name+' (not added)');return}
        sendFile({name:/\.pdf$/i.test(name)?name:name+'.pdf',size:data.length,url:item.getURL(),data});
        tell('✓ Sent to PDF Pair: '+name);if(win){win.show();}
      }catch(err){tell('Could not read '+name)}
    });
  });
}

// ---- built-in browser: tabs; the toolbar page loads from GitHub Pages (so it updates itself), local copy when offline
const BR_URL=process.env.PP_BR_URL||APP_URL.replace(/[^/]*$/,'')+'desktop/browser.html';
let top=112,tabs=[],active=null,nextId=1;
const BMF=()=>path.join(app.getPath('userData'),'bookmarks.json');
function cur(){return tabs.find(t=>t.id===active)}
let fsMode=false;
function setFs(on){if(!bwin||bwin.isDestroyed())return;fsMode=!!on;bwin.setFullScreen(fsMode);setTimeout(layoutBrowser,50);setTimeout(layoutBrowser,400)}
function fsKeys(e,i){if(i.type!=='keyDown')return;if(i.key==='F11'){e.preventDefault();setFs(!fsMode)}else if(i.key==='Escape'&&fsMode&&!htmlFs)setFs(false)}
let htmlFs=false;
let rightInset=0,splitId=null,splitRatio=.5,lastActive=null;
function layoutBrowser(){if(!bwin||bwin.isDestroyed())return;const [w,h]=bwin.getContentSize();const tp=fsMode?0:top,W=Math.max(200,w-(fsMode?0:rightInset)),H=Math.max(0,h-tp);
  if(splitId!=null&&(splitId===active||!tabs.some(t=>t.id===splitId&&alive(t))))splitId=null;
  const L=splitId!=null?Math.round(W*splitRatio)-3:W;
  for(const t of tabs.filter(x=>x&&x.view&&x.id!==miniId)){
    if(t.id===active)t.view.setBounds({x:0,y:tp,width:L,height:H});
    else if(t.id===splitId)t.view.setBounds({x:L+6,y:tp,width:W-L-6,height:H});
    else t.view.setBounds({x:0,y:tp,width:W,height:H});
    t.view.setVisible((t.id===active||t.id===splitId)&&!covered)}}
let covered=false;
const alive=t=>t&&t.view&&t.view.webContents&&!t.view.webContents.isDestroyed();
function state(){try{if(!bwin||bwin.isDestroyed())return;tabs=tabs.filter(alive);if(!tabs.some(t=>t.id===active)&&tabs.length)active=tabs[tabs.length-1].id;const c=cur(),wc=c&&c.view.webContents;
  bwin.webContents.send('br-state',{tabs:tabs.map(t=>({id:t.id,blocked:SH.count.get(t.view.webContents.id)||0,title:t.view.webContents.getTitle()||t.view.webContents.getURL(),url:t.view.webContents.getURL(),loading:t.view.webContents.isLoading(),active:t.id===active})),
    split:splitId,ratio:splitRatio,url:wc?wc.getURL():'',title:wc?wc.getTitle():'',back:!!wc&&wc.navigationHistory.canGoBack(),fwd:!!wc&&wc.navigationHistory.canGoForward(),loading:!!wc&&wc.isLoading()})}catch(e){}}
function newTab(url){
  const ses=session.fromPartition('persist:browser');
  const v=new WebContentsView({webPreferences:{session:ses,contextIsolation:true,sandbox:true}});
  const t={id:nextId++,view:v};tabs.push(t);bwin.contentView.addChildView(v);
  v.webContents.on('enter-html-full-screen',()=>{htmlFs=true;setFs(true)});v.webContents.on('leave-html-full-screen',()=>{htmlFs=false;setFs(false)});v.webContents.on('before-input-event',(ev,i)=>{fsKeys(ev,i);pipKeys(ev,i);fwdKeys(ev,i)});
  const wc=v.webContents;['did-navigate','did-navigate-in-page','page-title-updated','did-start-loading','did-stop-loading'].forEach(ev=>wc.on(ev,state));
  wc.on('did-navigate',(e,u)=>histAdd(u,wc));wc.on('page-title-updated',()=>histTitle(wc.getURL(),wc.getTitle()));wc.on('did-stop-loading',()=>{if(bwin&&!bwin.isDestroyed())bwin.webContents.send('br-loaded',{id:t.id,url:wc.getURL()})});
  wc.setWindowOpenHandler(({url,disposition})=>{
    if(disposition==='new-window'||/accounts\.google\.com|appleid\.apple\.com|login\.microsoftonline|oauth|auth/i.test(url))
      return {action:'allow',overrideBrowserWindowOptions:{width:520,height:720,parent:bwin,autoHideMenuBar:true,webPreferences:{session:ses,contextIsolation:true,sandbox:true}}};
    newTab(url);return {action:'deny'}});
  wc.on('destroyed',()=>{const k=tabs.indexOf(t);if(k<0)return;try{bwin&&!bwin.isDestroyed()&&bwin.contentView.removeChildView(v)}catch(e){}tabs.splice(k,1);if(bwin&&!bwin.isDestroyed()){if(!tabs.length)newTab('https://www.google.com/');else{if(active===t.id)active=tabs[Math.max(0,k-1)].id;layoutBrowser();state()}}});
  wc.loadURL(url||'https://www.google.com/');active=t.id;layoutBrowser();state();return t;
}
function closeTab(id){const k=tabs.findIndex(t=>t.id===id);if(k<0)return;const t=tabs[k];tabs.splice(k,1);try{bwin.contentView.removeChildView(t.view)}catch(e){}try{t.view.webContents.close()}catch(e){}
  if(!tabs.length){newTab('https://www.google.com/');return}if(active===id)active=(tabs[k]||tabs[k-1]).id;layoutBrowser();state()}
let sesReady=false;
function openBrowser(url,hidden){
  if(bwin&&!bwin.isDestroyed()){if(url)newTab(url);if(!hidden){bwin.show();bwin.focus()}return}
  if(!sesReady){setupBrowserSession(session.fromPartition('persist:browser'));sesReady=true}
  bwin=new BrowserWindow({width:1280,height:880,show:!hidden,title:'PDF Pair · Browser',backgroundColor:'#ffffff',
    webPreferences:{preload:path.join(__dirname,'bpreload.js'),contextIsolation:true,sandbox:false}});
  let fell=false;const local=()=>{if(!fell){fell=true;bwin.loadFile(path.join(__dirname,'browser.html'))}};
  bwin.webContents.on('did-fail-load',(e,code,desc,u,main)=>{if(main)local()});bwin.webContents.on('did-navigate',(e,u,code)=>{if(code>=400)local()});
  bwin.webContents.on('did-finish-load',async()=>{if(fell)return;try{if(!(await bwin.webContents.executeJavaScript("!!document.getElementById('chrome')&&typeof br==='object'")))local()}catch(e){local()}});
  bwin.loadURL(BR_URL+'?v='+Date.now()).catch(()=>{});
  tabs=[];active=null;newTab(url||'https://www.google.com/');
  bwin.on('resize',layoutBrowser);bwin.on('blur',()=>{setTimeout(()=>{if(bwin&&!bwin.isDestroyed()&&!bwin.isFocused())pipAuto(cur())},250)});bwin.on('focus',()=>pipBack(cur()));bwin.on('minimize',()=>pipAuto(cur()));bwin.on('leave-full-screen',()=>{fsMode=false;layoutBrowser()});bwin.webContents.on('before-input-event',(ev,i)=>{fsKeys(ev,i);pipKeys(ev,i)});bwin.webContents.on('did-finish-load',state);
  bwin.on('closed',()=>{bwin=null;tabs=[];active=null});
}


// ---- 📱 mini window: the lecture's tab moves into a small always-on-top window (same signed-in session).
// A lecture page shows ONLY the video (playing or paused), with our controls fading in on hover. Pages without a video (search, home) use YouTube's phone layout to pick from.
let miniWin=null,miniId=null,miniMode='full',miniSize=1,miniTimer=0,miniW=null,miniBusy=0,miniWant=null,miniWantN=0,miniDrag=null,miniUA=null;
const MINI_BAR=34,MINI_W=[300,360,440],MINI_PH=1.78;
const MOBILE_UA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
// the page's real lecture: on YouTube only watch/live/shorts pages (results and home play muted previews), elsewhere a big video
const MINI_SEL="const yt=/(^|\\.)youtube\\.com$/.test(location.hostname);const v=(yt&&!/^\\/(watch|live|shorts|embed)/.test(location.pathname))?null:[...document.querySelectorAll('video')].filter(x=>x.duration>0&&!x.closest('#inline-preview-player,ytd-video-preview,#video-preview')&&(document.documentElement.classList.contains('ppminiv')||x.getBoundingClientRect().width>=innerWidth*0.6)).sort((a,b)=>(a.paused-b.paused)||(b.duration-a.duration))[0];";
const MINI_CSS=[
 "html.ppminiv,html.ppminiv body{overflow:hidden!important;background:#000!important}",
 "html.ppminiv body *{visibility:hidden!important}",
 "html.ppminiv .ppmvbox,html.ppminiv .ppmvbox video,html.ppminiv #ppmov,html.ppminiv #ppmov *{visibility:visible!important}",
 "html.ppminiv .ppmvbox{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;z-index:2147483646!important;background:#000!important;margin:0!important;padding:0!important;transform:none!important}",
 "html.ppminiv .ppmvbox video{position:absolute!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;object-fit:contain!important;transform:none!important}",
 "#ppmov{position:fixed;inset:0;z-index:2147483647;font:600 12px Segoe UI,system-ui,sans-serif;color:#fff;user-select:none;cursor:default}",
 "#ppmov .tp{position:absolute;left:0;right:0;top:0;height:34px;display:flex;align-items:center;gap:2px;padding:0 6px 0 10px;background:linear-gradient(180deg,rgba(20,18,50,.9),rgba(20,18,50,0));cursor:move;opacity:0;transition:opacity .25s}",
 "#ppmov .tp b{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}",
 "#ppmov .bt{position:absolute;left:0;right:0;bottom:0;padding:26px 10px 8px;background:linear-gradient(0deg,rgba(0,0,0,.8),rgba(0,0,0,0));opacity:0;transition:opacity .25s}",
 "#ppmov.on .tp,#ppmov.on .bt{opacity:1}",
 "#ppmov button{border:0;background:rgba(255,255,255,.16);color:#fff;font:700 11.5px Segoe UI,system-ui,sans-serif;height:26px;min-width:28px;padding:0 6px;border-radius:7px;cursor:pointer}",
 "#ppmov .tp button{background:transparent}#ppmov button:hover{background:rgba(255,255,255,.3)}",
 "#ppmov .pr{height:5px;border-radius:3px;background:rgba(255,255,255,.3);margin-bottom:7px;position:relative;cursor:pointer}#ppmov .pr i{position:absolute;left:0;top:0;bottom:0;background:#ff0033;border-radius:3px}",
 "#ppmov .rw{display:flex;align-items:center;gap:6px}#ppmov .tm{margin-left:auto;font-variant-numeric:tabular-nums;opacity:.9}",
 "#ppmov .big{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;font-size:26px;pointer-events:none}",
 "#ppmov.paused .big{display:flex}#ppmov.paused{background:rgba(0,0,0,.18)}",
 "#ppmov .msg{position:absolute;left:50%;top:42px;transform:translateX(-50%);background:rgba(20,18,50,.92);border-radius:8px;padding:5px 10px;display:none;white-space:nowrap}"
].join('');
// the overlay inside the page: talks to us through console messages ("ppmini:...")
const MINI_OV="(()=>{"+
 "let st=document.getElementById('ppminicss');if(!st){st=document.createElement('style');st.id='ppminicss';document.documentElement.appendChild(st)}st.textContent="+JSON.stringify(MINI_CSS)+";"+
 MINI_SEL+"if(!v)return 0;document.querySelectorAll('.ppmvbox').forEach(x=>x.classList.remove('ppmvbox'));(v.closest('.html5-video-player')||v.parentElement||v).classList.add('ppmvbox');"+
 "document.documentElement.classList.add('ppminiv');window.dispatchEvent(new Event('resize'));"+
 "if(document.getElementById('ppmov'))return 1;"+
 "const o=document.createElement('div');o.id='ppmov';o.innerHTML='<div class=\"tp\"><b></b><button data-k=\"link\" title=\"Link this moment to the open question\">📌</button><button data-k=\"cap\" title=\"Frame to Captures tray\">📸</button><button data-k=\"size\" title=\"Size\">⇲</button><button data-k=\"back\" title=\"Back to the browser\">⤢</button><button data-k=\"close\" title=\"Close\">✕</button></div><div class=\"big\">▶</div><div class=\"msg\"></div><div class=\"bt\"><div class=\"pr\"><i></i></div><div class=\"rw\"><button data-k=\"b10\">⟲10</button><button data-k=\"pp\">⏸</button><button data-k=\"f10\">10⟳</button><button data-k=\"rate\">1×</button><button data-k=\"mute\">🔊</button><span class=\"tm\"></span></div></div>';"+
 "document.documentElement.appendChild(o);const V=()=>{"+MINI_SEL+"return v};let ht=0;"+
 "const fmt=t=>{t=Math.max(0,Math.floor(t||0));const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')};"+
 "const show=()=>{o.classList.add('on');clearTimeout(ht);ht=setTimeout(()=>o.classList.remove('on'),2000)};"+
 "const draw=()=>{const v=V();if(!v)return;o.classList.toggle('paused',v.paused);o.querySelector('[data-k=pp]').textContent=v.paused?'▶':'⏸';o.querySelector('[data-k=rate]').textContent=(v.playbackRate===1?'1':v.playbackRate)+'×';o.querySelector('[data-k=mute]').textContent=v.muted||v.volume===0?'🔇':v.volume<.5?'🔉':'🔊';o.querySelector('.tm').textContent=fmt(v.currentTime)+' / '+fmt(v.duration);o.querySelector('.pr i').style.width=(v.duration?v.currentTime/v.duration*100:0)+'%';o.querySelector('.tp b').textContent=document.title.replace(/^\\(\\d+\\)\\s*/,'').replace(/ - YouTube$/,'')};"+
 "setInterval(draw,500);draw();o.addEventListener('mousemove',show);o.addEventListener('mouseenter',show);"+
 "window.__ppmsay=t=>{const m=o.querySelector('.msg');m.textContent=t;m.style.display='block';clearTimeout(m._t);m._t=setTimeout(()=>{m.style.display='none'},3000)};"+
 "o.addEventListener('wheel',e=>{const v=V();if(!v)return;e.preventDefault();v.muted=false;v.volume=Math.max(0,Math.min(1,v.volume+(e.deltaY<0?.05:-.05)));show();draw()},{passive:false});"+
 "o.addEventListener('pointerdown',e=>{show();const b=e.target.closest('button');if(b)return;if(e.target.closest('.pr')){const v=V();const r=e.target.closest('.pr').getBoundingClientRect();if(v&&v.duration)v.currentTime=(e.clientX-r.left)/r.width*v.duration;draw();return}"+
 "if(e.target.closest('.tp')){e.preventDefault();o.setPointerCapture(e.pointerId);console.log('ppmini:drag:'+e.screenX+':'+e.screenY);const up=()=>{console.log('ppmini:dragend');o.removeEventListener('pointerup',up);o.removeEventListener('pointercancel',up)};o.addEventListener('pointerup',up);o.addEventListener('pointercancel',up);return}"+
 "o._d={x:e.clientX,y:e.clientY}});"+
 "o.addEventListener('click',e=>{const b=e.target.closest('button');const v=V();"+
 "if(b){e.stopPropagation();const k=b.dataset.k;if(!v&&!/link|cap|size|back|close/.test(k))return;"+
 "if(k==='pp')v.paused?v.play():v.pause();else if(k==='b10')v.currentTime=Math.max(0,v.currentTime-10);else if(k==='f10')v.currentTime=Math.min(v.duration||1e9,v.currentTime+10);"+
 "else if(k==='rate')v.playbackRate=({1:1.25,1.25:1.5,1.5:1.75,1.75:2,2:0.75,0.75:1})[v.playbackRate]||1;else if(k==='mute')v.muted=!v.muted;else console.log('ppmini:'+k);draw();return}"+
 "if(e.target.closest('.tp,.bt'))return;if(o._d&&Math.hypot(e.clientX-o._d.x,e.clientY-o._d.y)>6)return;if(v){v.paused?v.play():v.pause();draw()}},true);"+
 "return 1})()";
function miniTab(){return tabById(miniId)}
async function miniRun(js){const t=miniTab();if(!t)return null;try{return await t.view.webContents.executeJavaScript(js,true)}catch(e){return null}}
async function miniState(){return miniRun("(()=>{"+MINI_SEL+"if(!v)return {none:1,title:document.title};return {p:v.paused,t:v.currentTime,d:v.duration,r:v.playbackRate,vw:v.videoWidth,vh:v.videoHeight,u:location.href,title:document.title.replace(/^\\(\\d+\\)\\s*/,'').replace(/ - YouTube$/,'')}})()")}
const miniBarH=()=>miniMode==='vid'?0:MINI_BAR;
function miniLayout(){if(!miniWin||miniWin.isDestroyed())return;const t=miniTab();if(!t)return;const [w,h]=miniWin.getContentSize();const B=miniBarH();t.view.setBounds({x:0,y:B,width:w,height:Math.max(0,h-B)});t.view.setVisible(true);
  try{miniWin.webContents.send('mini-mode',miniMode)}catch(e){}}
function miniResize(mode,ar){if(!miniWin||miniWin.isDestroyed())return;const b=miniWin.getBounds();const W=miniW||MINI_W[miniSize];
  const wa=screen.getDisplayMatching(b).workArea;
  const H=Math.min(wa.height-16,mode==='vid'?Math.round(W*(ar||9/16)):Math.round(W*MINI_PH)+MINI_BAR);let x=b.x+b.width-W,y=b.y+b.height-H;   // keep the bottom-right corner where it is
  x=Math.max(wa.x,Math.min(x,wa.x+wa.width-W));y=Math.max(wa.y,Math.min(y,wa.y+wa.height-H));miniBusy=Date.now();miniWin.setAspectRatio(0);miniWin.setBounds({x,y,width:W,height:H});
  if(mode==='vid')miniWin.setAspectRatio(1/(ar||9/16));miniLayout()}
async function miniSetMode(mode,ar){miniMode=mode;
  if(mode==='vid')await miniRun(MINI_OV);else await miniRun("(()=>{document.documentElement.classList.remove('ppminiv');const o=document.getElementById('ppmov');if(o)o.remove();window.dispatchEvent(new Event('resize'));return 1})()");
  miniResize(mode,ar)}
async function miniPhone(){   // pages to pick from: YouTube's phone layout so it fits the small window
  const t=miniTab();if(!t)return;const wc=t.view.webContents;let u='';try{u=wc.getURL()}catch(e){return}
  if(/^https:\/\/(www\.)?youtube\.com\//.test(u)&&!/\/(watch|live|shorts|embed)/.test(new URL(u).pathname)){if(miniUA==null)miniUA=wc.getUserAgent();wc.setUserAgent(MOBILE_UA);wc.loadURL(u.replace(/^https:\/\/(www\.)?youtube\.com/,'https://m.youtube.com'))}}
async function miniWatch(){if(!miniTab()){miniEnd(false,true);return}const s=await miniState();if(!s)return;
  if(miniMode==='vid'&&!s.none){const has=await miniRun("!!document.getElementById('ppmov')&&document.documentElement.classList.contains('ppminiv')");if(!has)await miniRun(MINI_OV)}
  const want=s.none?'full':'vid';
  if(want===miniMode||Date.now()-miniBusy<1200||miniDrag){miniWantN=0;return}
  if(miniWant!==want){miniWant=want;miniWantN=1;return}if(++miniWantN<2)return;miniWantN=0;
  await miniSetMode(want,s.vw&&s.vh?s.vh/s.vw:9/16);if(want==='full')miniPhone()}
async function miniCmd(c){const t=miniTab();if(!t)return null;
  if(c==='size'){miniSize=(miniSize+1)%3;miniW=MINI_W[miniSize];const s=await miniState();miniResize(miniMode,s&&s.vw?s.vh/s.vw:9/16);return {msg:['Small','Medium','Large'][miniSize]}}
  if(c==='back'){miniEnd(true);return {}}
  if(c==='close'){miniEnd(false,true);return {}}
  if(c==='goback'){try{t.view.webContents.navigationHistory.goBack()}catch(e){}return {}}
  const s=await miniState();if(!s||s.none)return {msg:'No video here'};
  if(c==='link'){if(!win||win.isDestroyed())return {msg:'Open PDF Pair first'};let r=null;try{r=await win.webContents.executeJavaScript('window.__ppDesk?__ppDesk.link('+JSON.stringify({u:s.u.replace('://m.youtube.com','://www.youtube.com'),t:s.t,title:s.title})+'):{error:"Open PDF Pair first"}',true)}catch(err){}
    return {msg:r&&r.ok?'📌 Linked to '+r.label:(r&&r.error)||'Could not link'}}
  if(c==='cap'){const ov=await miniRun("(()=>{const o=document.getElementById('ppmov');if(o)o.style.display='none';return 1})()");
    const rect=await miniRun("(()=>{"+MINI_SEL+"if(!v)return null;const r=v.getBoundingClientRect();return {x:Math.max(0,Math.round(r.left)),y:Math.max(0,Math.round(r.top)),width:Math.round(Math.min(r.width,innerWidth)),height:Math.round(Math.min(r.height,innerHeight))}})()");
    let out;try{const img=await t.view.webContents.capturePage(rect&&rect.width>10?rect:undefined);const sz=img.getSize();if(win&&!win.isDestroyed())win.webContents.send('pp-cap',{data:img.toDataURL(),w:sz.width,h:sz.height,url:s.u,title:s.title});out={msg:'📸 In PDF Pair’s Captures tray'}}catch(err){out={msg:'Could not capture'}}
    await miniRun("(()=>{const o=document.getElementById('ppmov');if(o)o.style.display='';return 1})()");return out}
  return {}}
function miniConsole(e,level,message){const m=String((e&&e.message)||message||'');if(!m.startsWith('ppmini:')||!miniWin||miniWin.isDestroyed())return;const k=m.slice(7);
  if(k.startsWith('drag:')){const b=miniWin.getBounds(),p=screen.getCursorScreenPoint();miniDrag={dx:p.x-b.x,dy:p.y-b.y};miniBusy=Date.now();clearInterval(miniDrag.t);
    miniDrag.t=setInterval(()=>{if(!miniDrag||!miniWin||miniWin.isDestroyed())return;const q=screen.getCursorScreenPoint();miniWin.setPosition(q.x-miniDrag.dx,q.y-miniDrag.dy);miniBusy=Date.now()},16);return}
  if(k==='dragend'){if(miniDrag){clearInterval(miniDrag.t);miniDrag=null;miniSnap()}return}
  miniCmd(k).then(r=>{if(r&&r.msg)miniRun('window.__ppmsay&&__ppmsay('+JSON.stringify(r.msg)+')')})}
function miniSnap(){if(!miniWin||miniWin.isDestroyed())return;const b=miniWin.getBounds(),wa=screen.getDisplayMatching(b).workArea,S=60;let {x,y}=b;
  if(Math.abs(x-wa.x)<S)x=wa.x+8;if(Math.abs(wa.x+wa.width-(x+b.width))<S)x=wa.x+wa.width-b.width-8;if(Math.abs(y-wa.y)<S)y=wa.y+8;if(Math.abs(wa.y+wa.height-(y+b.height))<S)y=wa.y+wa.height-b.height-8;
  if(x!==b.x||y!==b.y)miniWin.setPosition(x,y)}
async function miniStart(t){if(!t||!alive(t)||!bwin||bwin.isDestroyed())return;if(miniWin&&!miniWin.isDestroyed()){if(miniId===t.id){miniWin.show();return}await miniEnd(false)}
  await pipRun(t,PIP_EXIT);if(pipOwner===t.id)pipOwner=null;
  miniId=t.id;miniMode='full';miniWant=null;miniWantN=0;miniUA=null;
  const wa=screen.getDisplayMatching(bwin.getBounds()).workArea,W=MINI_W[miniSize],H=Math.round(W*MINI_PH)+MINI_BAR;
  miniWin=new BrowserWindow({width:W,height:H,x:wa.x+wa.width-W-16,y:wa.y+wa.height-H-16,frame:false,alwaysOnTop:true,resizable:true,minimizable:false,maximizable:false,fullscreenable:false,title:'Lecture',backgroundColor:'#000000',
    webPreferences:{nodeIntegration:true,contextIsolation:false,sandbox:false}});
  miniWin.setAlwaysOnTop(true,'floating');miniWin.setMinimumSize(200,112);miniWin.loadFile(path.join(__dirname,'mini.html'));
  try{bwin.contentView.removeChildView(t.view)}catch(e){}miniWin.contentView.addChildView(t.view);
  t.view.webContents.on('console-message',miniConsole);t._miniCon=true;
  if(active===t.id){const o=tabs.find(x=>x.id!==t.id&&alive(x));if(o)active=o.id;else newTab('https://www.google.com/')}
  layoutBrowser();state();miniLayout();
  miniWin.on('resize',()=>{miniBusy=Date.now();miniLayout()});miniWin.on('will-resize',()=>{miniBusy=Date.now()});
  miniWin.on('resized',()=>{if(!miniWin||miniWin.isDestroyed())return;miniBusy=Date.now();miniW=miniWin.getBounds().width;miniLayout()});
  miniWin.on('moved',()=>{miniBusy=Date.now();if(!miniDrag)miniSnap()});
  miniWin.on('closed',()=>{if(miniId!=null)miniEnd(false,true,true);miniWin=null});
  clearInterval(miniTimer);miniTimer=setInterval(miniWatch,600);
  const s=await miniState();if(s&&!s.none)miniSetMode('vid',s.vw&&s.vh?s.vh/s.vw:9/16);else miniPhone()}
async function miniEnd(show,pause,closed){const t=miniTab();const id=miniId;miniId=null;clearInterval(miniTimer);miniTimer=0;if(miniDrag){clearInterval(miniDrag.t);miniDrag=null}
  if(t&&alive(t)){const wc=t.view.webContents;try{wc.removeListener('console-message',miniConsole)}catch(e){}
    let tm=null;try{tm=await wc.executeJavaScript("(()=>{document.documentElement.classList.remove('ppminiv');const o=document.getElementById('ppmov');if(o)o.remove();"+MINI_SEL+(pause?"if(v)v.pause();":"")+"window.dispatchEvent(new Event('resize'));return v?v.currentTime:null})()",true)}catch(e){}
    if(miniUA!=null){wc.setUserAgent(miniUA);miniUA=null;const u=wc.getURL();if(/^https:\/\/m\.youtube\.com\//.test(u)){let w2=u.replace('https://m.youtube.com','https://www.youtube.com');if(tm>5&&/[?&]v=/.test(w2))w2=w2.replace(/([?&])t=\d+s?&?/,'$1')+'&t='+Math.floor(tm)+'s';wc.loadURL(w2)}}
    try{if(miniWin&&!miniWin.isDestroyed())miniWin.contentView.removeChildView(t.view)}catch(e){}
    if(bwin&&!bwin.isDestroyed()){bwin.contentView.addChildView(t.view);if(show){lastActive=active;active=id}layoutBrowser();state();if(show){bwin.show();bwin.focus()}}}
  if(!closed&&miniWin&&!miniWin.isDestroyed()){const w=miniWin;miniWin=null;w.destroy()}}
async function miniToggle(){if(miniId!=null){miniEnd(true);return}const c=cur();
  const t=tabById(pipOwner)||(c&&(await pipRun(c,"(()=>!!document.querySelector('video'))()"))===true?c:null);if(!t){tell('No video on this page');return}miniStart(t)}
ipcMain.on('br-mini',()=>miniToggle());
// ▶ Lectures (from PDF Pair): open a page straight in the mini window, without showing the browser
const toPhone=u=>/^https:\/\/(www\.)?youtube\.com\//.test(u)&&!/\/(watch|live|shorts|embed)/.test(new URL(u).pathname);
ipcMain.on('mini-open',async(e,u)=>{u=String(u||'');if(!/^https?:\/\//.test(u))return;
  if(miniId!=null&&miniTab()&&miniWin&&!miniWin.isDestroyed()){const wc=miniTab().view.webContents;
    if(toPhone(u)){if(miniUA==null)miniUA=wc.getUserAgent();wc.setUserAgent(MOBILE_UA);u=u.replace(/^https:\/\/(www\.)?youtube\.com/,'https://m.youtube.com')}
    wc.loadURL(u);if(miniMode==='vid'&&toPhone(u))await miniSetMode('full');miniWin.show();return}
  const had=!!(bwin&&!bwin.isDestroyed());openBrowser(had?null:u,true);let t;
  if(had){t=newTab(u)}else t=cur();setTimeout(()=>miniStart(t),300)});
ipcMain.handle('mini-state',async()=>{const s=await miniState();return s?Object.assign(s,{mode:miniMode}):null});
ipcMain.handle('mini-cmd',(e,c)=>miniCmd(c));
ipcMain.handle('lec-list',()=>{const P=kvGet('pos')||{},C=kvGet('courses')||[];
  const recent=Object.entries(P).filter(([k,o])=>/^yt:/.test(k)&&o&&o.u&&o.d>0&&o.t<o.d-20).sort((a,b)=>(b[1].at||0)-(a[1].at||0)).slice(0,4).map(([k,o])=>({u:o.u,t:o.t,d:o.d,title:o.title||'',at:o.at||0}));
  const vid=u=>{try{const x=new URL(u);if(/youtu\.be$/.test(x.hostname))return x.pathname.slice(1);return x.searchParams.get('v')}catch(e){return null}};
  const courses=C.map(c=>{const items=c.items||[];const nx=items.find(it=>{const p=P['yt:'+vid(it.u)];return !p||!p.d||p.max<p.d*.9});if(!nx)return null;const p=P['yt:'+vid(nx.u)]||{};return {name:c.name,subject:c.subject||'',u:nx.u,title:nx.title||'',t:p.t||0}}).filter(Boolean);
  return {recent,courses}});

// ---- picture-in-picture: the playing video floats on top; it comes back when you return to its tab
const PIP_TOGGLE="(async()=>{const ms=(v)=>{try{const S=navigator.mediaSession;S.setActionHandler('seekbackward',()=>{v.currentTime=Math.max(0,v.currentTime-10)});S.setActionHandler('seekforward',()=>{v.currentTime=Math.min(v.duration||1e9,v.currentTime+10)})}catch(e){}};try{if(document.pictureInPictureElement){await document.exitPictureInPicture();return 'off'}const v=[...document.querySelectorAll('video')].filter(x=>x.readyState>0).sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];if(!v)return 'none';v.disablePictureInPicture=false;ms(v);await v.requestPictureInPicture();return 'on'}catch(e){return 'err:'+e.message}})()";
const PIP_AUTO="(async()=>{const ms=(v)=>{try{const S=navigator.mediaSession;S.setActionHandler('seekbackward',()=>{v.currentTime=Math.max(0,v.currentTime-10)});S.setActionHandler('seekforward',()=>{v.currentTime=Math.min(v.duration||1e9,v.currentTime+10)})}catch(e){}};try{if(document.pictureInPictureElement)return 'on';const v=[...document.querySelectorAll('video')].find(x=>!x.paused&&!x.ended&&x.readyState>2&&x.clientWidth>200);if(!v)return 'none';v.disablePictureInPicture=false;ms(v);await v.requestPictureInPicture();return 'on'}catch(e){return 'err'}})()";
const PIP_EXIT="(async()=>{try{if(document.pictureInPictureElement){await document.exitPictureInPicture();return 'off'}return 'none'}catch(e){return 'err'}})()";
let pipOwner=null;
const tabById=id=>tabs.find(t=>t.id===id&&alive(t));
async function pipRun(t,js){if(!t||!alive(t))return 'none';try{return await t.view.webContents.executeJavaScript(js,true)}catch(e){return 'err'}}
async function pipAuto(t){if(t&&t.id===miniId)return;const r=await pipRun(t,PIP_AUTO);if(r==='on'){pipOwner=t.id;tell('▣ Video popped out. Come back to the tab to bring it back')}}
async function pipBack(t){if(t&&pipOwner===t.id){const r=await pipRun(t,PIP_EXIT);if(r==='off'||r==='none')pipOwner=null}}
async function pipToggle(){const t=cur();const r=await pipRun(t,PIP_TOGGLE);if(r==='on'){pipOwner=t.id;tell('▣ Video popped out')}else if(r==='off'){pipOwner=null}else tell(r==='none'?'No video on this page':'Could not pop out this video')}
function fwdKeys(e,i){if(i.type!=='keyDown'||!bwin||bwin.isDestroyed())return;const k=(i.key||'').toLowerCase();
  const want=(i.control&&['k','.','t','w','l','tab','h'].includes(k))||(i.alt&&!i.control&&['h','m','s'].includes(k));
  if(want){e.preventDefault();bwin.webContents.send('br-key',{key:i.key,ctrl:i.control,alt:i.alt,shift:i.shift});if(k==='l'||k==='k')bwin.webContents.focus()}}
function pipKeys(e,i){if(i.type==='keyDown'&&i.alt&&!i.control&&(i.key==='p'||i.key==='P')){e.preventDefault();miniToggle()}}

// ---- 🛡 shield: ads/trackers blocked (Ghostery engine + EasyList, EasyPrivacy, uBlock filters), known phishing/malware sites warned
const SH={blocker:null,bad:new Set(),allowBad:new Set(),count:new Map(),ready:false};
const UD=()=>app.getPath('userData');
const AD_LISTS=['https://raw.githubusercontent.com/easylist/easylist/gh-pages/easylist.txt','https://raw.githubusercontent.com/easylist/easylist/gh-pages/easyprivacy.txt','https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt','https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt'];
const BAD_LISTS=['https://raw.githubusercontent.com/curbengh/phishing-filter/gh-pages/phishing-filter-hosts.txt','https://raw.githubusercontent.com/curbengh/urlhaus-filter/gh-pages/urlhaus-filter-hosts.txt'];
const DAY=864e5,fresh=p=>{try{return Date.now()-fs.statSync(p).mtimeMs<DAY}catch(e){return false}};
const seed=(name)=>{const p=path.join(UD(),name),b=path.join(__dirname,'seed',name);if(!fs.existsSync(p)&&fs.existsSync(b))try{fs.copyFileSync(b,p)}catch(e){}return p};
const hostOf=u=>{try{return new URL(u).hostname.toLowerCase().replace(/^www\./,'')}catch(e){return ''}};
function isBad(h){if(!h)return false;const parts=h.split('.');for(let i=0;i<parts.length-1;i++){const d=parts.slice(i).join('.');if(SH.allowBad.has(d))return false;if(SH.bad.has(d))return true}return false}
const siteOff=h=>{const c=cfg();return !!c.adOff||(c.adAllow||['youtube.com']).includes(h)};   // YouTube is left alone by default: blocking its own requests makes it think it is offline
async function loadBad(){const p=seed('badhosts.txt');
  if(!fresh(p)){try{let out='';for(const u of BAD_LISTS){const r=await net.fetch(u);if(r.ok)out+=await r.text()+'\n'}if(out.length>10000)fs.writeFileSync(p,out)}catch(e){}}
  try{const set=new Set();for(const l of fs.readFileSync(p,'utf8').split('\n')){const m=l.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([a-z0-9.-]+)/i);if(m&&m[1]!=='0.0.0.0')set.add(m[1].toLowerCase())}SH.bad=set}catch(e){}}
async function loadAds(){let EB;try{EB=require('@ghostery/adblocker-electron').ElectronBlocker}catch(e){console.error('adblocker missing',e);return}
  const p=seed('adblock-engine.bin');if(!fresh(p)&&fs.existsSync(p)){try{const tmp=p+'.new';const b=await EB.fromLists(net.fetch,AD_LISTS,{enableCompression:true,loadCosmeticFilters:true,loadNetworkFilters:true});fs.writeFileSync(tmp,b.serialize());fs.renameSync(tmp,p)}catch(e){}}
  try{SH.blocker=await EB.fromLists(net.fetch,AD_LISTS,{enableCompression:true,loadCosmeticFilters:true,loadNetworkFilters:true},{path:p,read:fs.promises.readFile,write:fs.promises.writeFile})}catch(e){console.error('adblock load',e)}}
function shield(ses){
  const pdfHdr=(d,h)=>{if(d.resourceType==='mainFrame'||d.resourceType==='subFrame'){const ct=Object.keys(h).find(k=>k.toLowerCase()==='content-type');
      if(ct&&String(h[ct]).toLowerCase().includes('application/pdf')){for(const k of Object.keys(h))if(k.toLowerCase()==='content-disposition')delete h[k];h['Content-Disposition']=['attachment']}}return h};
  const hook=()=>{
    ses.webRequest.onBeforeRequest({urls:['<all_urls>']},(d,cb)=>{
      const wc=d.webContents;
      if(d.resourceType==='mainFrame'){
        if(wc)SH.count.set(wc.id,0);
        const u=new URL(d.url);
        if(u.hostname==='pdfpair.invalid'){cb({cancel:true});const t=u.searchParams.get('u')||'';const h=hostOf(t);if(u.pathname==='/continue'&&h){SH.allowBad.add(h);if(wc)setTimeout(()=>wc.loadURL(t),10)}return}
        const h=hostOf(d.url);
        if(focusBlocked(d.url)){cb({cancel:true});if(wc)setTimeout(()=>wc.loadFile(path.join(__dirname,'focus.html'),{query:{h,until:String(focusCache.until||0)}}),10);return}
        if(isBad(h)){cb({cancel:true});if(wc)setTimeout(()=>wc.loadFile(path.join(__dirname,'warn.html'),{query:{h,u:d.url}}),10);return}
        return cb({});
      }
      const top=hostOf(wc&&!wc.isDestroyed()?wc.getURL():'');
      if(!SH.blocker||siteOff(top))return cb({});
      try{SH.blocker.onBeforeRequest(d,r=>{if(r&&(r.cancel||r.redirectURL)&&wc){SH.count.set(wc.id,(SH.count.get(wc.id)||0)+1);bump()}cb(r||{})})}catch(e){cb({})}
    });
    ses.webRequest.onHeadersReceived({urls:['<all_urls>']},(d,cb)=>{
      const done=r=>{const h=(r&&r.responseHeaders)||d.responseHeaders||{};cb({responseHeaders:pdfHdr(d,h)})};
      const wc=d.webContents,top=hostOf(wc&&!wc.isDestroyed()?wc.getURL():d.url);
      if(SH.blocker&&!siteOff(top)){try{SH.blocker.onHeadersReceived(d,done)}catch(e){done({})}}else done({});
    });
  };
  hook();
  (async()=>{await Promise.all([loadBad(),loadAds()]);
    if(SH.blocker){
      if(!ses.registerPreloadScript){ses.registerPreloadScript=o=>{const f=o.filePath.replace(/index\.js$/,'index.cjs');ses.setPreloads([...ses.getPreloads(),f]);return f};ses.unregisterPreloadScript=id=>ses.setPreloads(ses.getPreloads().filter(x=>x!==id))}   // Electron 33
      try{SH.blocker.enableBlockingInSession(ses)}catch(e){console.error('adblock enable',e)}
      // page scripts and element hiding also respect "allow ads on this site" (YouTube's own pages break with them)
      const CH='@ghostery/adblocker/inject-cosmetic-filters';try{ipcMain.removeHandler(CH)}catch(e){}
      ipcMain.handle(CH,(event,url,msg)=>{let top='';try{top=hostOf(event.sender.getURL())}catch(e){}if(siteOff(top)||siteOff(hostOf(url)))return;return SH.blocker.onInjectCosmeticFilters(event,url,msg)});
      hook()}   // Ghostery adds its page script; our hooks wrap its request filtering
    SH.ready=true;bump()})();
}
let bumpT=null;function bump(){if(bumpT)return;bumpT=setTimeout(()=>{bumpT=null;state()},400)}
ipcMain.handle('ad-info',()=>{const c=cur(),wc=c&&c.view.webContents,h=hostOf(wc?wc.getURL():'');const k=cfg();return {host:h,blocked:wc?(SH.count.get(wc.id)||0):0,siteOff:(k.adAllow||['youtube.com']).includes(h),allOff:!!k.adOff,ready:SH.ready,lists:{ads:!!SH.blocker,bad:SH.bad.size}}});
ipcMain.handle('ad-set',(e,o)=>{const k=cfg();let allow=k.adAllow||['youtube.com'];if(o.site){allow=o.off?[...new Set([...allow,o.site])]:allow.filter(x=>x!==o.site)}const n={adAllow:allow};if('allOff' in o)n.adOff=!!o.allOff;setCfg(n);const c=cur();if(c&&o.reload!==false)c.view.webContents.reload();return true});

// ---- key/value store for the browser tools (notes, highlights, courses, focus, stats, playback memory)
const KVD=()=>{const d=path.join(app.getPath('userData'),'kv');try{fs.mkdirSync(d,{recursive:true})}catch(e){}return d};
const kvOk=k=>/^[a-z0-9_-]{1,40}$/i.test(String(k||''));
function kvGet(k){if(!kvOk(k))return null;try{return JSON.parse(fs.readFileSync(path.join(KVD(),k+'.json'),'utf8'))}catch(e){return null}}
function kvSet(k,v){if(!kvOk(k))return;try{const p=path.join(KVD(),k+'.json');fs.writeFileSync(p+'.tmp',JSON.stringify(v));fs.renameSync(p+'.tmp',p)}catch(e){}if(k==='focus')focusCache=v||{}}
ipcMain.handle('asset',(e,n)=>{if(!['readability.js','tools.js'].includes(n))return null;try{return fs.readFileSync(path.join(__dirname,n),'utf8')}catch(err){return null}});
ipcMain.handle('kv-get',(e,k)=>kvGet(k));
ipcMain.on('kv-set',(e,k,v)=>kvSet(k,v));
// ---- history
let HIST=null,histT=null;const histLoad=()=>{if(!HIST)HIST=kvGet('history')||[];return HIST};
const histSave=()=>{clearTimeout(histT);histT=setTimeout(()=>kvSet('history',HIST.slice(0,3000)),1500)};
function histAdd(u,wc){if(!/^https?:/.test(u)||/^https:\/\/pdfpair\.invalid/.test(u))return;const H=histLoad();const k=H.findIndex(x=>x.u===u);const o=k>=0?H.splice(k,1)[0]:{u,t:'',n:0};o.at=Date.now();o.n=(o.n||0)+1;o.t=(wc&&wc.getTitle())||o.t;H.unshift(o);histSave()}
function histTitle(u,t){const H=histLoad();const o=H.find(x=>x.u===u);if(o&&t){o.t=t;histSave()}}
ipcMain.handle('hist-get',(e,q,n)=>{const H=histLoad();q=String(q||'').toLowerCase().trim();const out=q?H.filter(x=>(x.u+' '+x.t).toLowerCase().includes(q)):H;return out.slice(0,n||50)});
ipcMain.on('hist-clear',()=>{HIST=[];kvSet('history',[])});
// ---- focus mode: distracting sites are blocked until the session ends
let focusCache=null;const focusNow=()=>{if(!focusCache)focusCache=kvGet('focus')||{};return focusCache};
function focusBlocked(url){const f=focusNow();if(!f.until||f.until<Date.now())return false;let u;try{u=new URL(url)}catch(e){return false}const h=u.hostname.toLowerCase().replace(/^www\.|^m\./,'');
  return (f.sites||[]).some(s=>{s=String(s).toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'');const [d,...p]=s.split('/');const pth='/'+p.join('/');return (h===d||h.endsWith('.'+d))&&(!p.length||u.pathname.toLowerCase().startsWith(pth))})}
// ---- study stats: minutes per day per subject (reading in PDF Pair, watching lectures)
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function statsAdd(sub,mins,kind){sub=String(sub||'Other').slice(0,40);const S=kvGet('stats')||{days:{}};const d=S.days[dayKey()]=S.days[dayKey()]||{};const o=d[sub]=d[sub]||{read:0,watch:0};o[kind==='watch'?'watch':'read']+=mins;kvSet('stats',S)}
ipcMain.on('stats-add',(e,sub,mins,kind)=>statsAdd(sub,Math.min(5,+mins||1),kind));
const vidId=u=>{try{const x=new URL(u);if(/youtu\.be$/.test(x.hostname))return x.pathname.slice(1);return x.searchParams.get('v')||x.pathname}catch(e){return u}};
setInterval(async()=>{   // a playing lecture counts as study time for its course's subject
  const seen=new Set();for(const id of [active,splitId,pipOwner]){const t=tabById(id);if(!t||seen.has(t.id))continue;seen.add(t.id);
    let r=null;try{r=await t.view.webContents.executeJavaScript("(()=>{const v=[...document.querySelectorAll('video')].find(x=>!x.paused&&!x.ended&&x.readyState>2);return !!v})()")}catch(e){}
    if(!r)continue;const u=t.view.webContents.getURL(),C=kvGet('courses')||[];let sub='Lectures';for(const c of C)if((c.items||[]).some(i=>vidId(i.u)===vidId(u))){sub=c.subject||c.name;break}
    statsAdd(sub,1,'watch')}},60000);
// ---- save the page as a PDF into the library
ipcMain.handle('br-pdf',async(e,o)=>{const c=cur();if(!c)return {error:'no tab'};const wc=c.view.webContents;
  try{const data=await wc.printToPDF({printBackground:true,margins:{marginType:'default'},pageSize:'A4'});let name=(o&&o.name)||wc.getTitle()||hostOf(wc.getURL())||'page';name=name.replace(/[\\/:*?"<>|]+/g,' ').trim().slice(0,90)||'page';
    sendFile({name:name+'.pdf',size:data.length,url:wc.getURL(),data});return {ok:true,name}}catch(err){return {error:String(err.message||err)}}});
// ---- talk to the PDF Pair window (questions list, link a lecture moment or a note to the open question)
ipcMain.handle('app-run',async(e,js)=>{if(!win||win.isDestroyed())return null;try{return await win.webContents.executeJavaScript(String(js),true)}catch(err){return {error:String(err.message||err)}}});
ipcMain.on('app-show',()=>{if(win&&!win.isDestroyed()){win.show();win.focus()}});
// ---- layout requests from the toolbar page
ipcMain.on('br-inset',(e,o)=>{if(o&&'top' in o)top=Math.max(40,Math.min(260,+o.top||112));if(o&&'right' in o)rightInset=Math.max(0,Math.min(700,+o.right||0));layoutBrowser()});
ipcMain.on('br-split',(e,o)=>{o=o||{};if(o.ratio)splitRatio=Math.max(.25,Math.min(.75,+o.ratio));
  if(o.op==='off'||(o.op==='toggle'&&splitId!=null))splitId=null;
  else if(o.op==='on'||o.op==='toggle'){let id=o.id&&o.id!==active&&tabById(o.id)?o.id:(lastActive&&lastActive!==active&&tabById(lastActive)?lastActive:null);
    if(id==null){const other=tabs.find(t=>t.id!==active&&alive(t));if(other)id=other.id}
    if(id==null){const keep=active;const t=newTab('https://www.google.com/');id=t.id;active=keep}
    splitId=id}
  layoutBrowser();state()});
async function readBm(){try{return JSON.parse(fs.readFileSync(BMF(),'utf8'))}catch(e){}
  // first run of this version: bring over bookmarks saved by the old (local) browser bar
  try{const w=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});await w.loadFile(path.join(__dirname,'offline.html'));
    const v=await w.webContents.executeJavaScript("localStorage.getItem('bm')");w.destroy();if(v){const o=JSON.parse(v);fs.writeFileSync(BMF(),JSON.stringify(o));return o}}catch(e){}
  return null}
ipcMain.handle('bm-get',()=>readBm());
ipcMain.on('bm-set',(e,o)=>{try{fs.writeFileSync(BMF(),JSON.stringify(o))}catch(err){}});
ipcMain.on('br-top',(e,px)=>{top=Math.max(40,Math.min(240,+px||112));layoutBrowser()});
ipcMain.on('br-tab',(e,a)=>{if(!bwin)return;if(a.op==='new'){const prev=cur();lastActive=prev&&prev.id;newTab(a.url);if(!splitId)pipAuto(prev)}if(a.op==='close'){if(a.id===miniId)miniEnd(false,true);closeTab(a.id)}if(a.op==='switch'&&a.id===miniId){miniEnd(true);return}if(a.op==='switch'&&tabs.some(t=>t.id===a.id)&&a.id!==active){const prev=cur();if(a.id===splitId)splitId=active;lastActive=active;active=a.id;layoutBrowser();state();if(!splitId||prev.id!==splitId)pipAuto(prev);pipBack(cur())}});
ipcMain.on('br-go',(e,u)=>{const c=cur();if(!c)return;let url=String(u||'').trim();if(!url)return;
  if(!/^[a-z]+:\/\//i.test(url))url=/\s/.test(url)||!/\./.test(url)?'https://www.google.com/search?q='+encodeURIComponent(url):'https://'+url;c.view.webContents.loadURL(url)});
ipcMain.on('br-cmd',(e,cmd)=>{if(cmd==='app'&&win){pipAuto(cur());win.show();win.focus();return}if(cmd==='pip'){pipToggle();return}const c=cur();if(!c)return;const wc=c.view.webContents;
  if(cmd==='back'&&wc.navigationHistory.canGoBack())wc.navigationHistory.goBack();if(cmd==='fwd'&&wc.navigationHistory.canGoForward())wc.navigationHistory.goForward();if(cmd==='reload')wc.reload();if(cmd==='stop')wc.stop();if(cmd==='ext')shell.openExternal(wc.getURL())});
ipcMain.handle('pp-video',async(e,js)=>{const t=tabById(miniId)||tabById(pipOwner)||cur();if(!t||!alive(t))return null;try{return await t.view.webContents.executeJavaScript(String(js),true)}catch(err){return null}});
ipcMain.on('pp-browser-show',()=>{if(bwin&&!bwin.isDestroyed()){bwin.show();bwin.focus()}});
ipcMain.handle('br-run',async(e,js)=>{const c=cur();if(!c)return null;try{return await c.view.webContents.executeJavaScript(String(js),true)}catch(err){return {error:String(err.message||err)}}});
ipcMain.on('br-cover',(e,on)=>{covered=!!on;layoutBrowser()});
// 📸 capture: a picture of the page as it looks now; the toolbar lets you drag a box, then it goes to PDF Pair
ipcMain.handle('br-cap',async()=>{const c=cur();if(!c||!alive(c))return null;try{const wc=c.view.webContents;const img=await wc.capturePage();const sz=img.getSize();if(!sz.width)return null;try{bwin.webContents.focus()}catch(e){}return {data:img.toDataURL(),w:sz.width,h:sz.height,url:wc.getURL(),title:wc.getTitle()}}catch(e){return null}});
ipcMain.on('br-cap-send',(e,o)=>{if(!o||typeof o.data!=='string'||!o.data.startsWith('data:image/'))return;if(win&&!win.isDestroyed())win.webContents.send('pp-cap',{data:o.data,w:+o.w||0,h:+o.h||0,url:String(o.url||''),title:String(o.title||'')})});
ipcMain.on('pp-browser',(e,u)=>openBrowser(u));
ipcMain.handle('pp-fetch',async(e,url)=>{
  const r=await net.fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);
  const data=Buffer.from(await r.arrayBuffer());const name=decodeURIComponent(new URL(url).pathname.split('/').pop()||'file.pdf');
  return {name,size:data.length,url,data};
});


// ---- backup folder for the app (plain files through Node, so Windows never has to re-allow it)
const CFG=()=>path.join(app.getPath('userData'),'desktop.json');
const cfg=()=>{try{return JSON.parse(fs.readFileSync(CFG(),'utf8'))}catch(e){return {}}};
const setCfg=o=>{try{fs.writeFileSync(CFG(),JSON.stringify(Object.assign(cfg(),o)))}catch(e){}};
const safeName=n=>{n=String(n||'');if(!n||/[\\/:*?"<>|]/.test(n)||n.startsWith('.'))throw new Error('bad name');return n};
ipcMain.handle('fs-pick',async()=>{const r=await dialog.showOpenDialog(win,{title:'Pick the backup folder',properties:['openDirectory','createDirectory']});
  if(r.canceled||!r.filePaths[0])return null;setCfg({backupDir:r.filePaths[0]});return {path:r.filePaths[0],name:path.basename(r.filePaths[0])}});
ipcMain.handle('fs-dir',()=>{const d=cfg().backupDir;return d&&fs.existsSync(d)?{path:d,name:path.basename(d)}:null});
ipcMain.handle('fs-clear',()=>{setCfg({backupDir:null});return true});
ipcMain.handle('fs-write',(e,name,data)=>{const d=cfg().backupDir;if(!d)throw new Error('no folder');fs.writeFileSync(path.join(d,safeName(name)),typeof data==='string'?data:Buffer.from(data));return true});
ipcMain.handle('fs-read',(e,name)=>{const d=cfg().backupDir;if(!d)return null;const p=path.join(d,safeName(name));if(!fs.existsSync(p))return null;return fs.readFileSync(p)});

app.whenReady().then(()=>{createMain()});
app.on('window-all-closed',()=>app.quit());
