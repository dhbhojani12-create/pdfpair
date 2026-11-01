import pymupdf,re,json
d=pymupdf.open('m1.pdf');W=d[0].rect.width
NAMES={'1':'Ind AS 1 Presentation of FS','34':'Ind AS 34 Interim Financial Reporting','7':'Ind AS 7 Cashflow','8':'Ind AS 8 Policy, Estimate and Error','10':'Ind AS 10 Events after BS Date','113':'Ind AS 113 Fair Value Measurement'}
SHORT={'Intro':'Intro','CF':'CF'}
CHN={'Intro':'Introduction to Ind AS','CF':'Conceptual Framework'}
# chapter by page (body)
bounds=[(15,'Intro'),(75,'CF'),(149,'1'),(220,'34'),(249,'7'),(309,'8'),(357,'10'),(391,'113'),(429,'SchIII'),(470,'PQ')]
def chap_of(pg):
  c=None
  for p,k in bounds:
    if pg>=p:c=k
  return c
def lines(i):
  out=[]
  for b in d[i].get_text('dict')['blocks']:
    for l in b.get('lines',[]):
      t=''.join(s['text'] for s in l['spans']).strip()
      if t:out.append(dict(p=i+1,x=l['bbox'][0],y=l['bbox'][1],yc=(l['bbox'][1]+l['bbox'][3])/2,t=t,b='Bold' in l['spans'][0]['font'],sz=l['spans'][0]['size']))
  return out
ALL=[]
for i in range(14,520):ALL+=lines(i)
def isnum(l):return l['x']<80 and re.match(r'^(\d+)\.$',l['t'])
items=[];problems=[]
# --- illustrations
cur_pq=None
i=0
illus=[k for k,l in enumerate(ALL) if l['b'] and re.match(r'^Illustration\s+\d+',l['t']) and l['x']<90]
for n,k in enumerate(illus):
  l=ALL[k];num=re.match(r'^Illustration\s+(\d+)',l['t']).group(1)
  end=illus[n+1] if n+1<len(illus) else len(ALL)
  sol=next((j for j in range(k+1,end) if ALL[j]['b'] and re.match(r'^Solution\b',ALL[j]['t']) and ALL[j]['x']<90),None)
  ch=chap_of(l['p'])
  if ch=='PQ':continue
  items.append(dict(kind='Illus',num=num,ch=ch,q=l,a=ALL[sol] if sol else None))
  if sol is None:problems.append(('no solution','Illus',num,ch,l['p']))
# --- Questions / Answers sections (TYK and PQ)
heads=[k for k,l in enumerate(ALL) if l['b'] and l['t'] in('Questions','Answers','Question','Answer') and l['sz']>=13]
BIG=[k for k,l in enumerate(ALL) if l['b'] and l['sz']>=13.5]
for n,k in enumerate(heads):
  if not ALL[k]['t'].startswith('Question'):continue
  ak=next((h for h in heads[n+1:] if ALL[h]['t'].startswith('Answer')),None)
  if ak is None:problems.append(('no answers section',ALL[k]['p']));continue
  nq=next((h for h in BIG if h>ak and not ALL[h]['t'].startswith('Answer')),len(ALL))
  pg=ALL[k]['p'];ch=chap_of(pg);kind='TYK'
  if ch=='PQ':
    kind='PQ'
    # section title just above: CHAPTER x UNIT-y: IND AS n
    hdr=[l for l in ALL[max(0,k-8):k] if re.search(r'IND AS\s*(\d+)',l['t'])]
    m=re.search(r'IND AS\s*(\d+)',hdr[-1]['t']) if hdr else None
    ch=m.group(1) if m else '?'
  qs=[ALL[j] for j in range(k+1,ak) if isnum(ALL[j])]
  as_=[ALL[j] for j in range(ak+1,nq) if isnum(ALL[j])]
  # keep sequential numbering only
  def seq(L):
    out=[];want=1
    for l in L:
      v=int(l['t'][:-1])
      if v==want:out.append(l);want+=1
    return out
  qs,as_=seq(qs),seq(as_)
  if ALL[k]['t']=='Question':qs=[dict(ALL[k],t='1.')];as_=[dict(ALL[ak],t='1.')]
  amap={int(l['t'][:-1]):l for l in as_}
  for q in qs:
    v=int(q['t'][:-1]);a=amap.get(v)
    items.append(dict(kind=kind,num=str(v),ch=ch,q=q,a=a))
    if not a:problems.append(('no answer',kind,v,ch,q['p']))
  if len(as_)!=len(qs):problems.append(('count',kind,ch,pg,len(qs),len(as_)))
def chname(c):return NAMES.get(c,CHN.get(c,'Division II Schedule III' if c=='SchIII' else 'Ind AS '+c))
def short(c):return 'Ind AS '+c if c in NAMES else ('Sch III' if c=='SchIII' else SHORT.get(c,c))
for it in items:it['chname']=chname(it['ch']);it['name']=short(it['ch'])+' · '+it['kind']+' '+it['num']
if __name__=='__main__':
  import collections
  print(len(items),collections.Counter((i['ch'],i['kind']) for i in items))
  for p in problems:print('PROBLEM',p)
