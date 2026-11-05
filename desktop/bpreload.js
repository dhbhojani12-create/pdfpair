const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('br',{go:u=>ipcRenderer.send('br-go',u),cmd:c=>ipcRenderer.send('br-cmd',c),cover:on=>ipcRenderer.send('br-cover',on),onState:cb=>ipcRenderer.on('br-state',(e,s)=>cb(s)),onMsg:cb=>ipcRenderer.on('br-msg',(e,m)=>cb(m))});
