import pymupdf,re
CH={'2':'Ind AS 2 Inventory','16':'Ind AS 16 PPE','23':'Ind AS 23 Borrowing Cost','36':'Ind AS 36 Impairment of Assets','38':'Ind AS 38 Intangible Asset','40':'Ind AS 40 Investment Property','105':'Ind AS 105 NCA held for Sale','116':'Ind AS 116 Leases',
'19':'Ind AS 19 Employee Benefit','37':'Ind AS 37 Prov, CL and CA','12':'Ind AS 12 Income Tax','21':'Ind AS 21 Forex','24':'Ind AS 24 Related Party','33':'Ind AS 33 EPS','108':'Ind AS 108 Segment Reporting',
'115':'Ind AS 115 Revenue from contract with customer','41':'Ind AS 41 Agriculture','20':'Ind AS 20 Govt Grant','102':'Ind AS 102 Share Based Payment','109':'Ind AS 109 Financial Instruments',
'103':'Ind AS 103 Business Combination','110':'Ind AS 110 Consolidation','111':'Ind AS 111 Joint Arrangements','28':'Ind AS 28 JV and Associates','27':'Ind AS 27 Separate FS','101':'Ind AS 101 First Time Adoption',
'AnFS':'Analysis of Financial Statements','Ethics':'Professional Ethics','Tech':'Accounting and Tech'}
SH={'AnFS':'Analysis','Ethics':'Ethics','Tech':'Acc & Tech'}
BOUNDS={'m2':[(21,'2'),(64,'16'),(117,'23'),(153,'36'),(228,'38'),(295,'40'),(333,'105'),(376,'116'),(537,'2'),(545,'16'),(557,'23'),(568,'36'),(586,'38'),(599,'40'),(605,'105'),(609,'116')],
'm3':[(19,'19'),(111,'37'),(167,'12'),(261,'21'),(299,'24'),(332,'33'),(393,'108'),(433,'19'),(444,'37'),(453,'12'),(466,'21'),(474,'24'),(478,'33'),(485,'108')],
'm4':[(17,'115'),(173,'41'),(204,'20'),(232,'102'),(291,'109'),(549,'115'),(563,'41'),(566,'20'),(576,'102'),(591,'109')],
'm5':[(19,'103'),(153,'110'),(265,'111'),(295,'28'),(330,'27'),(338,'110'),(383,'101'),(443,'AnFS'),(499,'Ethics'),(551,'Tech'),(591,'103'),(623,'110'),(656,'101')]}
PQSTART={'m2':537,'m3':433,'m4':549,'m5':591}
def parse(f):
  d=pymupdf.open(f+'.pdf');W=d[0].rect.width;bounds=BOUNDS[f]
  def chap(pg):
    c=None
    for p,k in bounds:
      if pg>=p:c=k
    return c
  ALL=[]
  for i in range(14,len(d)):
    for b in d[i].get_text('dict')['blocks']:
      for l in b.get('lines',[]):
        t=''.join(s['text'] for s in l['spans']).strip()
        if t:ALL.append(dict(p=i+1,x=l['bbox'][0],y=l['bbox'][1],yc=(l['bbox'][1]+l['bbox'][3])/2,t=t,b='Bold' in l['spans'][0]['font'],sz=l['spans'][0]['size']))
  isnum=lambda l:l['x']<80 and re.match(r'^(\d+)\.(\s|$)',l['t'])
  items=[];probs=[]
  illus=[k for k,l in enumerate(ALL) if l['b'] and re.match(r'^Illustration\s+\d+(?!\d)(?!\s*\))',l['t']) and l['x']<W*.25]
  for n,k in enumerate(illus):
    l=ALL[k]
    if l['p']>=PQSTART[f]:continue
    num=re.match(r'^Illustration\s+(\d+)',l['t']).group(1);end=illus[n+1] if n+1<len(illus) else len(ALL)
    sol=next((j for j in range(k+1,end) if (ALL[j]['b'] or ALL[j]['t'].strip()=='Solution') and re.match(r'^Solution\b',ALL[j]['t']) and ALL[j]['x']<W*.25),None)
    items.append(dict(kind='Illus',num=num,ch=chap(l['p']),q=l,a=ALL[sol] if sol else None))
    if sol is None:probs.append(('no solution',num,chap(l['p']),l['p']))
  heads=[k for k,l in enumerate(ALL) if l['b'] and l['t'] in('Questions','Answers','Question','Answer') and l['sz']>=12.5]
  BIG=[k for k,l in enumerate(ALL) if l['b'] and (l['sz']>=15.5 or (l['sz']>=12.5 and l['t'] in('Questions','Question')))]
  for n,k in enumerate(heads):
    if not ALL[k]['t'].startswith('Question'):continue
    ak=next((h for h in heads[n+1:] if ALL[h]['t'].startswith('Answer')),None)
    if ak is None:probs.append(('no answers',ALL[k]['p']));continue
    nq=next((h for h in BIG if h>ak and not ALL[h]['t'].startswith('Answer')),len(ALL))
    pg=ALL[k]['p'];kind='PQ' if pg>=PQSTART[f] else 'TYK';ch=chap(pg)
    def seq(L):
      out=[];want=1;prev=None
      for l in L:
        v0=int(re.match(r'^(\d+)',l['t']).group(1))
        if out and v0==want-1 and v0==prev:l=dict(l,t=str(want)+'.')   # a misprinted repeat (8, 8, 10): the second is 9
        prev=v0
        v=int(re.match(r'^(\d+)',l['t']).group(1))
        if v==want:out.append(l);want+=1
      return out
    qs=seq([ALL[j] for j in range(k+1,ak) if isnum(ALL[j])]);as_=seq([ALL[j] for j in range(ak+1,nq) if isnum(ALL[j])])
    if ALL[k]['t']=='Question':qs=[dict(ALL[k],t='1.')];as_=[dict(ALL[ak],t='1.')]
    num=lambda l:int(re.match(r'^(\d+)',l['t']).group(1))
    am={num(l):l for l in as_}
    for q in qs:
      v=num(q);items.append(dict(kind=kind,num=str(v),ch=ch,q=q,a=am.get(v)))
      if v not in am:probs.append(('no answer',kind,v,ch,q['p']))
    if len(as_)!=len(qs):probs.append(('count',kind,ch,pg,len(qs),len(as_)))
  for it in items:
    c=it['ch'];it['chname']=CH[c];it['name']=('Ind AS '+c if c.isdigit() else SH[c])+' · '+it['kind']+' '+it['num']
  return d,W,items,probs
if __name__=='__main__':
  import collections,sys
  for f in sys.argv[1:]:
    d,W,it,pr=parse(f);c=collections.Counter((i['ch'],i['kind']) for i in it)
    print('=====',f,len(it),dict(c));[print('  PROBLEM',p) for p in pr]
