// PDF Pair desktop: the same web app (from GitHub Pages) plus a built-in browser whose downloads go straight into the library
const {app,BrowserWindow,WebContentsView,ipcMain,session,net,shell,Menu,dialog}=require('electron');
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
  for(const t of tabs.filter(x=>x&&x.view)){
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
function openBrowser(url){
  if(bwin&&!bwin.isDestroyed()){if(url)newTab(url);bwin.show();bwin.focus();return}
  if(!sesReady){setupBrowserSession(session.fromPartition('persist:browser'));sesReady=true}
  bwin=new BrowserWindow({width:1280,height:880,title:'PDF Pair · Browser',backgroundColor:'#ffffff',
    webPreferences:{preload:path.join(__dirname,'bpreload.js'),contextIsolation:true,sandbox:false}});
  let fell=false;const local=()=>{if(!fell){fell=true;bwin.loadFile(path.join(__dirname,'browser.html'))}};
  bwin.webContents.on('did-fail-load',(e,code,desc,u,main)=>{if(main)local()});bwin.webContents.on('did-navigate',(e,u,code)=>{if(code>=400)local()});
  bwin.webContents.on('did-finish-load',async()=>{if(fell)return;try{if(!(await bwin.webContents.executeJavaScript("!!document.getElementById('chrome')&&typeof br==='object'")))local()}catch(e){local()}});
  bwin.loadURL(BR_URL+'?v='+Date.now()).catch(()=>{});
  tabs=[];active=null;newTab(url||'https://www.icai.org/');
  bwin.on('resize',layoutBrowser);bwin.on('blur',()=>{setTimeout(()=>{if(bwin&&!bwin.isDestroyed()&&!bwin.isFocused())pipAuto(cur())},250)});bwin.on('focus',()=>pipBack(cur()));bwin.on('minimize',()=>pipAuto(cur()));bwin.on('leave-full-screen',()=>{fsMode=false;layoutBrowser()});bwin.webContents.on('before-input-event',(ev,i)=>{fsKeys(ev,i);pipKeys(ev,i)});bwin.webContents.on('did-finish-load',state);
  bwin.on('closed',()=>{bwin=null;tabs=[];active=null});
}

// ---- picture-in-picture: the playing video floats on top; it comes back when you return to its tab
const PIP_TOGGLE="(async()=>{const ms=(v)=>{try{const S=navigator.mediaSession;S.setActionHandler('seekbackward',()=>{v.currentTime=Math.max(0,v.currentTime-10)});S.setActionHandler('seekforward',()=>{v.currentTime=Math.min(v.duration||1e9,v.currentTime+10)})}catch(e){}};try{if(document.pictureInPictureElement){await document.exitPictureInPicture();return 'off'}const v=[...document.querySelectorAll('video')].filter(x=>x.readyState>0).sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];if(!v)return 'none';v.disablePictureInPicture=false;ms(v);await v.requestPictureInPicture();return 'on'}catch(e){return 'err:'+e.message}})()";
const PIP_AUTO="(async()=>{const ms=(v)=>{try{const S=navigator.mediaSession;S.setActionHandler('seekbackward',()=>{v.currentTime=Math.max(0,v.currentTime-10)});S.setActionHandler('seekforward',()=>{v.currentTime=Math.min(v.duration||1e9,v.currentTime+10)})}catch(e){}};try{if(document.pictureInPictureElement)return 'on';const v=[...document.querySelectorAll('video')].find(x=>!x.paused&&!x.ended&&x.readyState>2&&x.clientWidth>200);if(!v)return 'none';v.disablePictureInPicture=false;ms(v);await v.requestPictureInPicture();return 'on'}catch(e){return 'err'}})()";
const PIP_EXIT="(async()=>{try{if(document.pictureInPictureElement){await document.exitPictureInPicture();return 'off'}return 'none'}catch(e){return 'err'}})()";
let pipOwner=null;
const tabById=id=>tabs.find(t=>t.id===id&&alive(t));
async function pipRun(t,js){if(!t||!alive(t))return 'none';try{return await t.view.webContents.executeJavaScript(js,true)}catch(e){return 'err'}}
async function pipAuto(t){const r=await pipRun(t,PIP_AUTO);if(r==='on'){pipOwner=t.id;tell('▣ Video popped out. Come back to the tab to bring it back')}}
async function pipBack(t){if(t&&pipOwner===t.id){const r=await pipRun(t,PIP_EXIT);if(r==='off'||r==='none')pipOwner=null}}
async function pipToggle(){const t=cur();const r=await pipRun(t,PIP_TOGGLE);if(r==='on'){pipOwner=t.id;tell('▣ Video popped out (Alt+P to bring it back)')}else if(r==='off'){pipOwner=null}else tell(r==='none'?'No video on this page':'Could not pop out this video')}
function fwdKeys(e,i){if(i.type!=='keyDown'||!bwin||bwin.isDestroyed())return;const k=(i.key||'').toLowerCase();
  const want=(i.control&&['k','.','t','w','l','tab','h'].includes(k))||(i.alt&&!i.control&&['h','m'].includes(k));
  if(want){e.preventDefault();bwin.webContents.send('br-key',{key:i.key,ctrl:i.control,alt:i.alt,shift:i.shift});if(k==='l'||k==='k')bwin.webContents.focus()}}
function pipKeys(e,i){if(i.type==='keyDown'&&i.alt&&!i.control&&(i.key==='p'||i.key==='P')){e.preventDefault();pipToggle()}}

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
ipcMain.on('br-tab',(e,a)=>{if(!bwin)return;if(a.op==='new'){const prev=cur();lastActive=prev&&prev.id;newTab(a.url);if(!splitId)pipAuto(prev)}if(a.op==='close')closeTab(a.id);if(a.op==='switch'&&tabs.some(t=>t.id===a.id)&&a.id!==active){const prev=cur();if(a.id===splitId)splitId=active;lastActive=active;active=a.id;layoutBrowser();state();if(!splitId||prev.id!==splitId)pipAuto(prev);pipBack(cur())}});
ipcMain.on('br-go',(e,u)=>{const c=cur();if(!c)return;let url=String(u||'').trim();if(!url)return;
  if(!/^[a-z]+:\/\//i.test(url))url=/\s/.test(url)||!/\./.test(url)?'https://www.google.com/search?q='+encodeURIComponent(url):'https://'+url;c.view.webContents.loadURL(url)});
ipcMain.on('br-cmd',(e,cmd)=>{if(cmd==='app'&&win){pipAuto(cur());win.show();win.focus();return}if(cmd==='pip'){pipToggle();return}const c=cur();if(!c)return;const wc=c.view.webContents;
  if(cmd==='back'&&wc.navigationHistory.canGoBack())wc.navigationHistory.goBack();if(cmd==='fwd'&&wc.navigationHistory.canGoForward())wc.navigationHistory.goForward();if(cmd==='reload')wc.reload();if(cmd==='stop')wc.stop();if(cmd==='ext')shell.openExternal(wc.getURL())});
ipcMain.handle('pp-video',async(e,js)=>{const t=tabById(pipOwner)||cur();if(!t||!alive(t))return null;try{return await t.view.webContents.executeJavaScript(String(js),true)}catch(err){return null}});
ipcMain.on('pp-browser-show',()=>{if(bwin&&!bwin.isDestroyed()){bwin.show();bwin.focus()}});
ipcMain.handle('br-run',async(e,js)=>{const c=cur();if(!c)return null;try{return await c.view.webContents.executeJavaScript(String(js),true)}catch(err){return {error:String(err.message||err)}}});
ipcMain.on('br-cover',(e,on)=>{covered=!!on;layoutBrowser()});
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
