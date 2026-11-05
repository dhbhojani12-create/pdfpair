"""Build rtp.html: ICAI Final RTPs grouped by subject (all attempts), from boslive.icai.org.
   python3 tools/rtp_page.py   (needs curl access to boslive.icai.org)"""
import re,subprocess,html,os,datetime
YEARS=["November, 2026","May, 2026","January, 2026","September 2025","May, 2025","November 2024","May, 2024"]
PAPERS=[(1,'Financial Reporting','FR'),(2,'Advanced Financial Management','AFM'),(3,'Advanced Auditing, Assurance and Professional Ethics','Audit'),(4,'Direct Tax Laws & International Taxation','DT'),(5,'Indirect Tax Laws','IDT'),(6,'Integrated Business Solutions','IBS')]
def get(u):return subprocess.run(['curl','-s','-m','30',u],capture_output=True,text=True).stdout
def short(y):m=re.match(r'(\w+),?\s*(\d{4})',y);return m.group(1)[:3]+' '+m.group(2)
data={p[0]:[] for p in PAPERS};groups={};other=[]
for y in YEARS:
  h=get("https://boslive.icai.org/education_content_rtp_list.php?c=Final&content_year="+y.replace(' ','%20').replace(',','%2C'))
  last=None
  for m in re.finditer(r'<a[^>]+href="([^"]+\.pdf)"',h):
    u=m.group(1)
    if 'resource.cdn' not in u:continue
    pre=html.unescape(re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h[max(0,m.start()-400):m.start()]))).strip()
    lab=re.split(r'Click Here',pre)[-1].strip()
    pm=re.search(r'Paper\s*-?\s*(\d)',lab)
    if re.search(r'corrigendum|addendum',lab,re.I):
      p=int(pm.group(1)) if pm else (last if 'orrig' in lab else None)
      (data[p] if p else other).append((short(y),'Corrigendum' if 'orrig' in lab else 'Addendum',u,True));continue
    if pm:p=int(pm.group(1));last=p;data[p].append((short(y),'RTP',u,False))
    elif re.search(r'Group',lab,re.I):g='Group I' if re.search(r'Group\W*(I|1)\b(?!I)',lab) else 'Group II';groups.setdefault(g,[]).append((short(y),u));last=None
css="""body{margin:0;font:15px system-ui,Segoe UI,sans-serif;background:#f6f7f9;color:#1f2328}main{max-width:900px;margin:0 auto;padding:24px 16px 60px}
h1{font-size:24px;margin:0 0 4px}.sub{color:#57606a;margin:0 0 18px;font-size:13.5px}nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}nav a{padding:6px 12px;border-radius:16px;background:#fff;border:1px solid #d5d8de;color:#1f2328;text-decoration:none;font-size:13.5px}
section{background:#fff;border:1px solid #d5d8de;border-radius:12px;margin-bottom:16px;overflow:hidden}h2{font-size:16px;margin:0;padding:12px 16px;background:#eef0f3}h2 small{font-weight:400;color:#57606a}
.r{display:flex;align-items:center;gap:10px;padding:9px 16px;border-top:1px solid #eceef1}.r b{width:90px}.r a{color:#1a5fd0;text-decoration:none}.r a:hover{text-decoration:underline}.c{font-size:12.5px;color:#9a5b00}"""
out=['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICAI Final RTPs by subject</title><style>'+css+'</style></head><body><main>',
'<h1>ICAI Final RTPs, by subject</h1><p class="sub">All attempts from the BOS Knowledge Portal, newest first. Links open ICAI’s own PDFs. Updated '+datetime.date.today().strftime('%d %b %Y')+'. In PDF Pair’s browser, clicking a link puts the PDF straight into your library.</p><nav>']
out+=['<a href="#p%d">%s</a>'%(n,s) for n,_,s in PAPERS]+['<a href="#groups">Group-wise</a></nav>']
for n,name,s in PAPERS:
  out.append('<section id="p%d"><h2>Paper %d · %s <small>(%s)</small></h2>'%(n,n,html.escape(name),s))
  for y,kind,u,c in data[n]:out.append('<div class="r"><b>%s</b><a href="%s">%s</a>%s</div>'%(y,u,'RTP '+y if kind=='RTP' else kind+' · '+y,' <span class="c">correction to the RTP above</span>' if c else ''))
  out.append('</section>')
out.append('<section id="groups"><h2>Group-wise (all papers of the group in one PDF)</h2>')
for g in sorted(groups):
  for y,u in groups[g]:out.append('<div class="r"><b>%s</b><a href="%s">%s · %s</a></div>'%(y,u,g,y))
for y,k,u,c in other:out.append('<div class="r"><b>%s</b><a href="%s">%s · %s</a></div>'%(y,u,k,y))
out.append('</section></main></body></html>')
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','rtp.html'),'w').write('\n'.join(out))
print({s:len(data[n]) for n,_,s in PAPERS},{g:len(v) for g,v in groups.items()},len(other))
