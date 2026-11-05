const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ppDesktop',{
  version:'1.7.0',
  openBrowser:u=>ipcRenderer.send('pp-browser',u),
  fetchPdf:u=>ipcRenderer.invoke('pp-fetch',u),
  onFile:cb=>ipcRenderer.on('pp-file',(e,f)=>cb(f)),
  video:js=>ipcRenderer.invoke('pp-video',js),showBrowser:()=>ipcRenderer.send('pp-browser-show'),
  fs:{pick:()=>ipcRenderer.invoke('fs-pick'),dir:()=>ipcRenderer.invoke('fs-dir'),clear:()=>ipcRenderer.invoke('fs-clear'),write:(n,d)=>ipcRenderer.invoke('fs-write',n,d),read:n=>ipcRenderer.invoke('fs-read',n)}
});
