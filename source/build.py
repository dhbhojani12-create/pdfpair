import re,glob
t=open("v2.html").read()
t2=t.replace("__SAMPLE__",open("sample.b64").read()).replace("__REGIONS__",open("regions.json").read())
open("paperpair.html","w").write(t2)
js=re.findall(r"<script>(.*?)</script>",t2,re.S)[0];open("app.js","w").write(js)
open("/home/claude/PaperPair.html","w").write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+t2+'</body></html>')
def grab(a,b):
    i=js.index(a);j=js.index(b,i);return js[i:j]
new=grab("function toLines(items){","function overlapsExisting")+grab("const LOG=","function showLog(){")+grab("function leftMargin","function manualPairs")
new=re.sub(r"/\* ---- delete pages.*?(?=/\* ---- combine)","",new,flags=re.S)
for f in glob.glob("*/t7.js")+["t2.js","t5.js","t6.js"]:
    s=open(f).read();i=s.index("function toLines(items){");e="return{pairs:out,orphans,missing};\n}\n";j=s.index(e,i)+len(e)
    open(f,"w").write(s[:i]+new+s[j:])
print("built")
