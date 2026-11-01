// tiny stand-in for Firebase Realtime Database REST + streaming
const http=require('http');let db={};const subs=[];
const get=(p)=>p.reduce((o,k)=>o==null?undefined:o[k],db);
const set=(p,v)=>{if(!p.length){db=v||{};return}let o=db;for(const k of p.slice(0,-1)){if(typeof o[k]!=='object'||o[k]==null)o[k]={};o=o[k]}if(v==null)delete o[p[p.length-1]];else o[p[p.length-1]]=v};
const sv=v=>{if(v&&typeof v==='object'){if(v['.sv']==='timestamp')return Date.now();for(const k in v)v[k]=sv(v[k])}return v};
const notify=(p,v)=>{for(const s of subs){const sp=s.p;if(p.slice(0,sp.length).join('/')===sp.join('/')){const rel='/'+p.slice(sp.length).join('/');s.res.write('event: put\ndata: '+JSON.stringify({path:rel==='/'?'/':rel,data:v})+'\n\n')}else if(sp.slice(0,p.length).join('/')===p.join('/')){s.res.write('event: put\ndata: '+JSON.stringify({path:'/',data:get(sp)??null})+'\n\n')}}};
http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,PATCH,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.end();return}
  if(req.url.startsWith('/app.html')){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>'+require('fs').readFileSync('/home/claude/pdfpair/PDF-Pair.html','utf8')+'</body></html>');return}
  const u=new URL(req.url,'http://x');if(!req.url.startsWith('/app'))console.log('LOGREQ',req.method,req.url,(req.headers.accept||'').includes('event')?'(stream)':'');const p=u.pathname.replace(/\.json$/,'').split('/').filter(Boolean);
  let body='';req.on('data',c=>body+=c);req.on('end',()=>{
    if(req.method==='GET'&&(req.headers.accept||'').includes('text/event-stream')){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});res.write('event: put\ndata: '+JSON.stringify({path:'/',data:get(p)??null})+'\n\n');subs.push({p,res});res.on('close',()=>{const i=subs.findIndex(s=>s.res===res);if(i>=0)subs.splice(i,1)});return}
    res.setHeader('Content-Type','application/json');
    if(req.method==='GET'){res.end(JSON.stringify(get(p)??null));return}
    if(req.method==='PUT'){const v=sv(JSON.parse(body));set(p,v);notify(p,v);res.end(JSON.stringify(v));return}
    if(req.method==='POST'){const id='-N'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);const v=sv(JSON.parse(body));set([...p,id],v);notify([...p,id],v);res.end(JSON.stringify({name:id}));return}
    if(req.method==='DELETE'){set(p,null);notify(p,null);res.end('null');return}
    res.end('null')});
}).listen(9300,()=>console.log('mock up'));
