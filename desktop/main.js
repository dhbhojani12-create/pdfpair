// PDF Pair desktop: the same web app (from GitHub Pages) plus a built-in browser whose downloads go straight into the library
const {app,BrowserWindow,WebContentsView,ipcMain,session,net,shell,Menu}=require('electron');
const path=require('path'),fs=require('fs'),os=require('os');
const APP_URL=process.env.PP_URL||'https://dhbhojani12-create.github.io/pdfpair/';
if(process.env.PP_TEST){app.commandLine.appendSwitch('ignore-certificate-errors');if(process.env.HTTPS_PROXY){app.commandLine.appendSwitch('proxy-server',process.env.HTTPS_PROXY.replace(/^https?:\/\//,'').replace(/\/$/,''));app.commandLine.appendSwitch('proxy-bypass-list','127.0.0.1;localhost')}}
const APP_ORIGIN=new URL(APP_URL).origin;
let win=null,bwin=null,view=null;
if(!app.requestSingleInstanceLock()){app.quit()}else app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
Menu.setApplicationMenu(null);

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
  win.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F12')win.webContents.toggleDevTools();if(i.type==='keyDown'&&(i.key==='F5'||(i.control&&i.key.toLowerCase()==='r'&&i.shift)))win.webContents.reload()});
  win.on('closed',()=>{win=null;if(bwin&&!bwin.isDestroyed())bwin.close()});
}

function setupBrowserSession(ses){
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
    const name=item.getFilename()||'download.pdf';
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

const TOP=84;
function layoutBrowser(){if(!bwin||!view)return;const [w,h]=bwin.getContentSize();view.setBounds({x:0,y:TOP,width:w,height:Math.max(0,h-TOP)})}
function openBrowser(url){
  url=url||'https://www.icai.org/';
  if(bwin&&!bwin.isDestroyed()){view.webContents.loadURL(url);bwin.show();bwin.focus();return}
  bwin=new BrowserWindow({width:1250,height:860,title:'PDF Pair · Browser',backgroundColor:'#ffffff',
    webPreferences:{preload:path.join(__dirname,'bpreload.js'),contextIsolation:true,sandbox:false}});
  bwin.loadFile(path.join(__dirname,'browser.html'));
  const ses=session.fromPartition('persist:browser');setupBrowserSession(ses);
  view=new WebContentsView({webPreferences:{session:ses,contextIsolation:true,sandbox:true}});
  bwin.contentView.addChildView(view);layoutBrowser();bwin.on('resize',layoutBrowser);
  const wc=view.webContents;
  const upd=()=>{if(bwin&&!bwin.isDestroyed())bwin.webContents.send('br-state',{url:wc.getURL(),title:wc.getTitle(),back:wc.navigationHistory.canGoBack(),fwd:wc.navigationHistory.canGoForward(),loading:wc.isLoading()})};
  ['did-navigate','did-navigate-in-page','page-title-updated','did-start-loading','did-stop-loading'].forEach(ev=>wc.on(ev,upd));
  wc.setWindowOpenHandler(({url})=>{wc.loadURL(url);return {action:'deny'}});   // one page: new tabs open here
  wc.loadURL(url);
  bwin.on('closed',()=>{bwin=null;view=null});
}

ipcMain.on('br-go',(e,u)=>{if(!view)return;let url=String(u||'').trim();if(!url)return;
  if(!/^[a-z]+:\/\//i.test(url))url=/\s/.test(url)||!/\./.test(url)?'https://www.google.com/search?q='+encodeURIComponent(url):'https://'+url;view.webContents.loadURL(url)});
ipcMain.on('br-cmd',(e,c)=>{if(!view)return;const wc=view.webContents;if(c==='back'&&wc.navigationHistory.canGoBack())wc.navigationHistory.goBack();if(c==='fwd'&&wc.navigationHistory.canGoForward())wc.navigationHistory.goForward();if(c==='reload')wc.reload();if(c==='app'&&win){win.show();win.focus()}if(c==='ext')shell.openExternal(wc.getURL())});
ipcMain.on('br-cover',(e,on)=>{if(view)view.setVisible(!on)});
ipcMain.on('pp-browser',(e,u)=>openBrowser(u));
ipcMain.handle('pp-fetch',async(e,url)=>{
  const r=await net.fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);
  const data=Buffer.from(await r.arrayBuffer());const name=decodeURIComponent(new URL(url).pathname.split('/').pop()||'file.pdf');
  return {name,size:data.length,url,data};
});

app.whenReady().then(()=>{createMain()});
app.on('window-all-closed',()=>app.quit());
