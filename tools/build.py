import hashlib,re
import os
W=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
old=open(W+'/index.html',encoding='utf-8').read()
s=open(W+'/src/PDF-Pair.html',encoding='utf-8').read()
for a,b in [('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','lib/pdf.min.js'),('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js','lib/pdf.worker.min.js'),('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js','lib/pdf-lib.min.js'),('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','lib/jszip.min.js'),('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js','lib/qrcode.min.js')]:s=s.replace(a,b)
assert 'cdnjs' not in s
title,rest=s.split('\n',1)
i=old.index('<title>');head=old[:i]
mid=old[old.index('<style>[hidden]',i):old.index('</head><body>\n')+len('</head><body>\n')]
tail=old[old.index('\n<button id="upd"'):]
new=head+title+'\n'+mid+rest+tail
open(W+'/index.html','w',encoding='utf-8').write(new)
sw=open(W+'/sw.js').read();v=hashlib.md5((new+sw).encode()).hexdigest()[:8]
import time as _t
new=new.replace("const APPV='dev'","const APPV='"+_t.strftime('%d %b %H:%M')+"'");open(W+'/index.html','w',encoding='utf-8').write(new)
sw=re.sub(r"pdfpair-[0-9a-f]+","pdfpair-"+v,sw,count=1);open(W+'/sw.js','w').write(sw)
print('built',v)
