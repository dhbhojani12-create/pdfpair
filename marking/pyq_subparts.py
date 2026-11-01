import re,sys
sys.path.insert(0,'.')
from parse import lines
d,L=lines('pyq.pdf')
starts=[i for i,r in enumerate(L) if r['t'].startswith('PAPER – 1')]
exams=['May 26','Jan 26','Sep 25','May 25','Nov 24','May 24']
res=[]
for k,s in enumerate(starts):
    e=starts[k+1] if k+1<len(starts) else len(L);seg=L[s:e];ex=exams[k]
    qi=[(i,int(re.search(r'\d+',r['t']).group())) for i,r in enumerate(seg) if r['b'] and re.match(r'^Questions? \d+\s*$',r['t'])]
    for k2,(i,n) in enumerate(qi):
        nxt=qi[k2+1][0] if k2+1<len(qi) else len(seg)
        ai=next(j for j in range(i,nxt) if seg[j]['b'] and seg[j]['t']=='Answer')
        def subs(a,b):
            out=[];prevOR=False
            for j in range(a,b):
                r=seg[j]
                if re.match(r'^OR\s*$',r['t']):prevOR=True;continue
                m=re.match(r'^\(([a-e])\)',r['t'])
                if m and 100<=r['x']<=118 and r['y']<700:
                    out.append((m.group(1)+(' OR' if prevOR else ''),r));prevOR=False
            return out
        qs=subs(i,ai);as_=subs(ai,nxt)
        res.append((ex,n,seg[i],seg[ai],qs,as_))

def pyq_split(src='pyq.pdf'):
    from parse import pyq
    d,ents=pyq('pyq.pdf');out=[]
    idx={(ex,n):(qh,ah,qs,as_) for ex,n,qh,ah,qs,as_ in res}
    for e in ents:
        m=re.match(r'^(.*) · Q(\d+)$',e['name'])
        if not m or int(m.group(2))<2:out.append(e);continue
        ex,n=m.group(1),int(m.group(2));qh,ah,qs,as_=idx[(ex,n)]
        alab=[l for l,_ in as_]
        if alab.count('c')==2:
            as_=[(l,r) for l,r in as_];k=[i for i,(l,_) in enumerate(as_) if l=='c'][1];as_[k]=('c OR',as_[k][1])
            if not any(l=='c OR' for l,_ in qs):
                # use the "OR" line before the second (c) in the question
                i0=L.index(qh);i1=L.index(ah)
                orl=[r for r in L[i0:i1] if re.match(r'^OR\s*$',r['t'])]
                if orl:qs=qs+[('c OR',orl[-1])]
        qd=dict(qs);ad=dict(as_)
        if not qd or set(qd)!=set(ad):print('keep whole',ex,n,list(qd),list(ad));out.append(e);continue
        for l,_ in as_:
            out.append(dict(name=f'{ex} · Q{n}({l[0]})'+(' OR' if 'OR' in l else ''),q=qd[l],a=ad[l]))
    return d,out
if __name__=='__main__':
    d,o=pyq_split();print(len(o))
    for e in o:
        if 'Q5(c' in e['name'] or 'Q2' in e['name']:print(e['name'],e['q']['p'],round(e['q']['y']),e['q']['t'][:20],'|',e['a']['p'],round(e['a']['y']),e['a']['t'][:20])
