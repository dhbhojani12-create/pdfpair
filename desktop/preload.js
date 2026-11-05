const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ppDesktop',{
  version:'1.0.0',
  openBrowser:u=>ipcRenderer.send('pp-browser',u),
  fetchPdf:u=>ipcRenderer.invoke('pp-fetch',u),
  onFile:cb=>ipcRenderer.on('pp-file',(e,f)=>cb(f))
});
