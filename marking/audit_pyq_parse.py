import pymupdf,re,sys,json,collections
F=sys.argv[1]
d=pymupdf.open(F);W=d[0].rect.width;L=[]
for pi,p in enumerate(d):
  for b in p.get_text('dict')['blocks']:
    for l in b.get('lines',[]):
      t=''.join(s['text'] for s in l['spans']).strip()
      if not t:continue
      x0,y0,x1,y1=l['bbox'];L.append(dict(p=pi+1,x=x0,y=y0,yc=(y0+y1)/2,t=t,b=any('Bold' in s['font'] for s in l['spans'])))
L.sort(key=lambda r:(r['p'],round(r['y']),r['x']))
MON={'JANUARY':'Jan','MAY':'May','SEPTEMBER':'Sep','NOVEMBER':'Nov','DECEMBER':'Dec','JULY':'Jul','JUNE':'Jun'}
starts=[i for i,r in enumerate(L) if r['t'].startswith('PAPER – 3')]
out=[];probs=[]
for k,s in enumerate(starts):
  e=starts[k+1] if k+1<len(starts) else len(L);seg=L[s:e]
  m=next((re.search(r'EXAMINATION:\s*([A-Z]+)\s+(\d{4})',r['t']) for r in seg if 'EXAMINATION:' in r['t']),None)
  ex=MON.get(m.group(1),m.group(1).title()[:3])+' '+m.group(2)[2:] if m else 'Paper %d'%(k+1)
  cases=[(i,r) for i,r in enumerate(seg) if r['b'] and re.match(r'^(Integrated )?Case (Scenario|Study)',r['t'],re.I)]
  key=next((i for i,r in enumerate(seg) if r['b'] and re.match(r'^Answers? [Kk]ey',r['t'])),None)
  end=key or len(seg);last=0;firsts={};pre=[]
  mstart=next((i for i,r in enumerate(seg) if re.search(r'Multiple Choice|MCQs',r['t'])),cases[0][0] if cases else end)
  for j in range(mstart,end):
    r=seg[j];mm=re.match(r'^(\d+)\.(\s|$)',r['t'])
    if 100<=r['x']<=130 and mm and last<int(mm.group(1))<=last+3:
      v=int(mm.group(1));last=v;cs=[c for c,(i,_) in enumerate(cases) if i<=j]
      if cs:firsts.setdefault(max(cs),v)
      else:pre.append((v,r))
  if pre:
    ar=None
    if key is not None:
      for j in range(key,min(key+200,len(seg))):
        if re.match(r'^%d\.?(\s|$)'%pre[0][0],seg[j]['t']) and seg[j]['x']<300:ar=seg[j];break
    out.append(dict(name=f'{ex} · MCQ {pre[0][0]}–{pre[-1][0]}',q=pre[0][1],a=ar,ex=ex,kind='mcq'))
  for ci,(i,c) in enumerate(cases):
    first=firsts.get(ci);ar=None
    if key is not None and first:
      for j in range(key,min(key+200,len(seg))):
        if re.match(r'^%d\.?(\s|$)'%first,seg[j]['t']) and seg[j]['x']<300:ar=seg[j];break
    if ar is None and key is not None:ar=seg[key]
    out.append(dict(name=f'{ex} · Case {ci+1}',q=c,a=ar,ex=ex,kind='case',mcq=(first,)))
  qi=[(i,int(re.search(r'\d+',r['t']).group())) for i,r in enumerate(seg) if r['b'] and re.match(r'^Questions? \d+\s*$',r['t'])]
  for k2,(i,n) in enumerate(qi):
    nxt=qi[k2+1][0] if k2+1<len(qi) else len(seg)
    ai=next((j for j in range(i,nxt) if seg[j]['b'] and seg[j]['t'] in('Answer','Answers')),None)
    if ai is None:probs.append((ex,n,'no Answer'));out.append(dict(name=f'{ex} · Q{n}',q=seg[i],a=None,ex=ex,kind='q'));continue
    def subs(a,b,ans):
      res=[];prevOR=False
      for j in range(a,b):
        r=seg[j]
        if re.match(r'^OR\s*$',r['t']):prevOR=True;continue
        mm=re.match(r'^\(([a-e])\)',r['t'])
        if mm and 100<=r['x']<=(136 if ans else 125) and (r['b'] or not ans) and r['y']<800:res.append((mm.group(1)+(' OR' if prevOR else ''),r));prevOR=False
      return res
    qs=subs(i,ai,False);as_=subs(ai,nxt,True)
    for lst in (qs,as_):
      seen=set()
      for z,(l,r) in enumerate(lst):
        if l in seen:lst[z]=(l+' OR',r)
        seen.add(l)
    qd0=dict(qs)
    for l,r in list(as_):
      if 'OR' in l and l not in qd0:
        # find an OR line in the question after its main part; else it is only an alternative answer: drop it
        base=qd0.get(l[0]);hit=None
        if base:
          bi=seg.index(base)
          for j in range(bi+1,ai):
            if re.match(r'^OR\s*$',seg[j]['t']):hit=next((seg[z] for z in range(j+1,ai) if seg[z]['t'].strip()),None);break
        if hit:qs.append((l,hit))
        else:as_.remove((l,r));probs.append((ex,n,'dropped alternative answer',l))
    qd=dict(qs);ad=dict(as_)
    if qd and set(qd)==set(ad):
      for l,_ in as_:out.append(dict(name=f'{ex} · Q{n}({l[0]})'+(' OR' if 'OR' in l else ''),q=qd[l],a=ad[l],ex=ex,kind='q'))
    else:
      if qd or ad:probs.append((ex,n,'kept whole',list(qd),list(ad)))
      out.append(dict(name=f'{ex} · Q{n}',q=seg[i],a=seg[ai],ex=ex,kind='q'))
c=collections.Counter(o['ex'] for o in out)
print(dict(c),len(out));[print('PROB',p) for p in probs]
for o in out:
  q,a=o['q'],o['a'];print(f"{o['name']:20s} p{q['p']:3d} {q['t'][:22]:22s} | "+(f"p{a['p']:3d} {a['t'][:22]}" if a else 'MISSING'))
st={'q':[],'a':[]};names={}
for n,o in enumerate(out,1):
  q,a=o['q'],o['a'];st['q'].append(dict(n=n,page=q['p'],x=round(max(13,q['x']-17)/W,4),y=round(q['yc']/W,4)))
  if a:st['a'].append(dict(n=n,page=a['p'],x=round(max(13,a['x']-17)/W,4),y=round(a['yc']/W,4)))
  names[str(n)]=o['name']
json.dump(dict(stickers=st,names=names),open(sys.argv[2],'w'),ensure_ascii=False)
