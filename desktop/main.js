// PDF Pair desktop: the same web app (from GitHub Pages) plus a built-in browser whose downloads go straight into the library
const {app,BrowserWindow,WebContentsView,ipcMain,session,net,shell,Menu}=require('electron');
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
  ses.webRequest.onHeadersReceived((d,cb)=>{
    const h=d.responseHeaders||{};
    if(d.resourceType==='mainFrame'||d.resourceType==='subFrame'){
      const ct=Object.keys(h).find(k=>k.toLowerCase()==='content-type');
      if(ct&&String(h[ct]).toLowerCase().includes('application/pdf')){
        for(const k of Object.keys(h))if(k.toLowerCase()==='content-disposition')delete h[k];
        h['Content-Disposition']=['attachment'];
      }
    }
    cb({responseHeaders:h});
  });
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
function layoutBrowser(){if(!bwin||bwin.isDestroyed())return;const [w,h]=bwin.getContentSize();const tp=fsMode?0:top;for(const t of tabs.filter(x=>x&&x.view)){t.view.setBounds({x:0,y:tp,width:w,height:Math.max(0,h-tp)});t.view.setVisible(t.id===active&&!covered)}}
let covered=false;
const alive=t=>t&&t.view&&t.view.webContents&&!t.view.webContents.isDestroyed();
function state(){try{if(!bwin||bwin.isDestroyed())return;tabs=tabs.filter(alive);if(!tabs.some(t=>t.id===active)&&tabs.length)active=tabs[tabs.length-1].id;const c=cur(),wc=c&&c.view.webContents;
  bwin.webContents.send('br-state',{tabs:tabs.map(t=>({id:t.id,title:t.view.webContents.getTitle()||t.view.webContents.getURL(),url:t.view.webContents.getURL(),loading:t.view.webContents.isLoading(),active:t.id===active})),
    url:wc?wc.getURL():'',title:wc?wc.getTitle():'',back:!!wc&&wc.navigationHistory.canGoBack(),fwd:!!wc&&wc.navigationHistory.canGoForward(),loading:!!wc&&wc.isLoading()})}catch(e){}}
function newTab(url){
  const ses=session.fromPartition('persist:browser');
  const v=new WebContentsView({webPreferences:{session:ses,contextIsolation:true,sandbox:true}});
  const t={id:nextId++,view:v};tabs.push(t);bwin.contentView.addChildView(v);
  v.webContents.on('enter-html-full-screen',()=>{htmlFs=true;setFs(true)});v.webContents.on('leave-html-full-screen',()=>{htmlFs=false;setFs(false)});v.webContents.on('before-input-event',(ev,i)=>{fsKeys(ev,i);pipKeys(ev,i)});
  const wc=v.webContents;['did-navigate','did-navigate-in-page','page-title-updated','did-start-loading','did-stop-loading'].forEach(ev=>wc.on(ev,state));
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
function pipKeys(e,i){if(i.type==='keyDown'&&i.alt&&!i.control&&(i.key==='p'||i.key==='P')){e.preventDefault();pipToggle()}}
async function readBm(){try{return JSON.parse(fs.readFileSync(BMF(),'utf8'))}catch(e){}
  // first run of this version: bring over bookmarks saved by the old (local) browser bar
  try{const w=new BrowserWindow({show:false,webPreferences:{contextIsolation:true}});await w.loadFile(path.join(__dirname,'offline.html'));
    const v=await w.webContents.executeJavaScript("localStorage.getItem('bm')");w.destroy();if(v){const o=JSON.parse(v);fs.writeFileSync(BMF(),JSON.stringify(o));return o}}catch(e){}
  return null}
ipcMain.handle('bm-get',()=>readBm());
ipcMain.on('bm-set',(e,o)=>{try{fs.writeFileSync(BMF(),JSON.stringify(o))}catch(err){}});
ipcMain.on('br-top',(e,px)=>{top=Math.max(40,Math.min(240,+px||112));layoutBrowser()});
ipcMain.on('br-tab',(e,a)=>{if(!bwin)return;if(a.op==='new'){const prev=cur();newTab(a.url);pipAuto(prev)}if(a.op==='close')closeTab(a.id);if(a.op==='switch'&&tabs.some(t=>t.id===a.id)&&a.id!==active){const prev=cur();active=a.id;layoutBrowser();state();pipAuto(prev);pipBack(cur())}});
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

app.whenReady().then(()=>{createMain()});
app.on('window-all-closed',()=>app.quit());
