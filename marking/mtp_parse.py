import sys,re;sys.path.insert(0,'/home/claude/mark')
from parse import lines
def one(qf,af,tag):
    _,Q=lines(qf);_,A=lines(af)
    Q=[r for r in Q if 70<r['y']<760];A=[r for r in A if 70<r['y']<760]
    cases=[(i,r) for i,r in enumerate(Q) if r['b'] and re.match(r'^Case Scenario',r['t'])]
    # how many MCQs: from the answer key (bold 1..n before the descriptive answers restart at 1)
    nk=0
    for r in A:
        if 100<=r['x']<=115 and r['b'] and re.match(r'^%d\.(\s|$)'%(nk+1),r['t']):nk+=1
        elif nk>5 and 100<=r['x']<=115 and r['b'] and re.match(r'^1\.(\s|$)',r['t']):break
    nums=[];want=1;phase='m'
    for i,r in enumerate(Q):
        if not(100<=r['x']<=115):continue
        if re.match(r'^%d\.(\s|$)'%want,r['t']) and (not cases or i>cases[0][0]):nums.append((phase,want,i,r));want+=1
        elif want>nk and phase=='m' and re.match(r'^1\.(\s|$)',r['t']):phase='d';want=2;nums.append(('d',1,i,r))
    mcq={n:(i,r) for ph,n,i,r in nums if ph=='m'};desc={n:(i,r) for ph,n,i,r in nums if ph=='d'}
    rng=[]
    for ci,(i,c) in enumerate(cases):
        nxt=cases[ci+1][0] if ci+1<len(cases) else len(Q);got=None
        for j in range(i,nxt):
            m=re.search(r'questions?\s+(\d+)\s*(?:to|-|–)\s*(\d+)',Q[j]['t'],re.I)
            if m:got=(int(m.group(1)),int(m.group(2)));break
        rng.append(got)
    # answers: key rows then descriptive restarting at 1
    key={};dans={};want=1;phase='m'
    for i,r in enumerate(A):
        if not(100<=r['x']<=115 and r['b']):continue
        if phase=='m' and re.match(r'^%d\.(\s|$)'%want,r['t']):key[want]=r;want+=1
        elif phase=='m' and want>5 and re.match(r'^1\.(\s|$)',r['t']):phase='d';dans[1]=(i,r);want=2
        elif phase=='d' and re.match(r'^%d\.(\s|$)'%want,r['t']):dans[want]=(i,r);want+=1
    out=[];inrng=set()
    for ci,(i,c) in enumerate(cases):
        a,b=rng[ci];inrng|=set(range(a,b+1))
        out.append(dict(name=f'{tag} · Case {ci+1}',q=c,a=key[a]))
    for n,(i,r) in mcq.items():
        if n not in inrng:out.append(dict(name=f'{tag} · MCQ {n}',q=r,a=key[n]))
    def subs(L,a,b):
        return [(re.match(r'^\(([a-e])\)',L[j]['t']).group(1),L[j]) for j in range(a,b) if 130<=L[j]['x']<=145 and re.match(r'^\([a-e]\)',L[j]['t'])]
    dq=sorted(desc);da=sorted(dans)
    for n in dq:
        qi,qr=desc[n];qe=desc[n+1][0] if n+1 in desc else len(Q)
        ai,ar=dans[n];ae=dans[n+1][0] if n+1 in dans else len(A)
        qs=subs(Q,qi,qe);as_=subs(A,ai,ae)
        if qs and [l for l,_ in qs]==[l for l,_ in as_]:
            for (l,qr2),(_,ar2) in zip(qs,as_):out.append(dict(name=f'{tag} · Q{n}({l})',q=qr2,a=ar2))
        else:
            if qs or as_:print('whole',tag,n,[l for l,_ in qs],[l for l,_ in as_])
            out.append(dict(name=f'{tag} · Q{n}',q=qr,a=ar))
    out.sort(key=lambda e:(e['q']['p'],e['q']['y'],e['q']['x']))
    return out
if __name__=='__main__':
    for qf,af,t in [('q1.pdf','a1.pdf','MTP 1'),('q2.pdf','a2.pdf','MTP 2')]:
        for e in one(qf,af,t):print(f"{e['name']:16s} q p{e['q']['p']} y{e['q']['y']:.0f} {e['q']['t'][:22]:22s} | a p{e['a']['p']} y{e['a']['y']:.0f} {e['a']['t'][:22]}")
