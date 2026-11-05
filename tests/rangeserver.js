const http=require('http'),fs=require('fs'),path=require('path');
http.createServer((q,r)=>{const f=path.join(__dirname,decodeURIComponent(q.url.split('?')[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
const st=fs.statSync(f),ct=f.endsWith('.webm')?'video/webm':f.endsWith('.html')?'text/html':f.endsWith('.zip')?'application/zip':'application/octet-stream';const m=/bytes=(\d+)-(\d*)/.exec(q.headers.range||'');
if(m){const a=+m[1],b=m[2]?+m[2]:st.size-1;r.writeHead(206,{'Content-Type':ct,'Accept-Ranges':'bytes','Content-Range':`bytes ${a}-${b}/${st.size}`,'Content-Length':b-a+1});fs.createReadStream(f,{start:a,end:b}).pipe(r)}
else{r.writeHead(200,{'Content-Type':ct,'Accept-Ranges':'bytes','Content-Length':st.size});fs.createReadStream(f).pipe(r)}}).listen(9401,'127.0.0.1');
