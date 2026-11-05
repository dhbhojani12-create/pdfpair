const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('br',{
  go:u=>ipcRenderer.send('br-go',u),cmd:c=>ipcRenderer.send('br-cmd',c),cover:on=>ipcRenderer.send('br-cover',on),top:px=>ipcRenderer.send('br-top',px),
  tab:a=>ipcRenderer.send('br-tab',a),run:js=>ipcRenderer.invoke('br-run',js),pip:()=>ipcRenderer.send('br-cmd','pip'),asset:n=>ipcRenderer.invoke('asset',n),kv:{get:k=>ipcRenderer.invoke('kv-get',k),set:(k,v)=>ipcRenderer.send('kv-set',k,v)},hist:{get:(q,n)=>ipcRenderer.invoke('hist-get',q,n),clear:()=>ipcRenderer.send('hist-clear')},
  pdf:o=>ipcRenderer.invoke('br-pdf',o),app:js=>ipcRenderer.invoke('app-run',js),appShow:()=>ipcRenderer.send('app-show'),inset:o=>ipcRenderer.send('br-inset',o),split:o=>ipcRenderer.send('br-split',o),onLoaded:cb=>ipcRenderer.on('br-loaded',(e,s)=>cb(s)),
  ad:{info:()=>ipcRenderer.invoke('ad-info'),set:o=>ipcRenderer.invoke('ad-set',o)},bmGet:()=>ipcRenderer.invoke('bm-get'),bmSet:o=>ipcRenderer.send('bm-set',o),
  onState:cb=>ipcRenderer.on('br-state',(e,s)=>cb(s)),onKey:cb=>ipcRenderer.on('br-key',(e,k)=>cb(k)),onMsg:cb=>ipcRenderer.on('br-msg',(e,m)=>cb(m)),cap:()=>ipcRenderer.invoke('br-cap'),capSend:o=>ipcRenderer.send('br-cap-send',o),shell:5});
