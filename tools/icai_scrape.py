import re,sys,subprocess,html
def get(u):return subprocess.run(['curl','-s','-m','25',u],capture_output=True,text=True).stdout
def links(u):
  h=get(u);out=[]
  for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',h,re.S):
    href=m.group(1);txt=re.sub(r'<[^>]+>',' ',m.group(2));pre=re.sub(r'<[^>]+>',' ',h[max(0,m.start()-700):m.start()])
    pre=html.unescape(re.sub(r'\s+',' ',pre)).strip()[-160:];out.append((href,html.unescape(re.sub(r'\s+',' ',txt)).strip(),pre))
  return out
if __name__=='__main__':
  for href,t,pre in links(sys.argv[1]):
    if re.search(sys.argv[2] if len(sys.argv)>2 else '.',href+' '+t,re.I):print(href,'|',t[:40],'|',pre[-110:])
