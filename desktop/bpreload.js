const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('br',{
  go:u=>ipcRenderer.send('br-go',u),cmd:c=>ipcRenderer.send('br-cmd',c),cover:on=>ipcRenderer.send('br-cover',on),top:px=>ipcRenderer.send('br-top',px),
  tab:a=>ipcRenderer.send('br-tab',a),run:js=>ipcRenderer.invoke('br-run',js),pip:()=>ipcRenderer.send('br-cmd','pip'),bmGet:()=>ipcRenderer.invoke('bm-get'),bmSet:o=>ipcRenderer.send('bm-set',o),
  onState:cb=>ipcRenderer.on('br-state',(e,s)=>cb(s)),onMsg:cb=>ipcRenderer.on('br-msg',(e,m)=>cb(m)),shell:3});
