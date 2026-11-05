const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('ppDesktop',{
  version:'1.6.0',
  openBrowser:u=>ipcRenderer.send('pp-browser',u),
  fetchPdf:u=>ipcRenderer.invoke('pp-fetch',u),
  onFile:cb=>ipcRenderer.on('pp-file',(e,f)=>cb(f)),
  video:js=>ipcRenderer.invoke('pp-video',js),showBrowser:()=>ipcRenderer.send('pp-browser-show')
});
