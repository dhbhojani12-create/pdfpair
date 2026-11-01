import pymupdf,re,json,sys
def lines(f):
    d=pymupdf.open(f);L=[]
    for pi,p in enumerate(d):
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines',[]):
                t=''.join(s['text'] for s in l['spans']).strip()
                if not t:continue
                bold=any('Bold' in s['font'] for s in l['spans'])
                x0,y0,x1,y1=l['bbox'];L.append(dict(p=pi+1,x=x0,y=y0,yc=(y0+y1)/2,t=t,b=bold))
    L.sort(key=lambda r:(r['p'],round(r['y']),r['x']))
    return d,L
ROM={'I':1,'II':2,'III':3,'IV':4,'V':5,'1':1,'2':2,'3':3,'4':4}
def casenum(t):
    m=re.search(r'(?:Scenario|Study|Case)\s*[-–]?\s*([IVX]+|\d)\b',t);return ROM.get(m.group(1),0) if m else 0

def rtp(f):
    d,L=lines(f)
    starts=[i for i,r in enumerate(L) if r['t'].startswith('PAPER – 1')]
    exams=['Nov 26','May 26','Jan 26','Sep 25','May 25','Nov 24','May 24']
    out=[]
    for k,s in enumerate(starts):
        e=starts[k+1] if k+1<len(starts) else len(L);seg=L[s:e];ex=exams[k]
        qs=next(i for i,r in enumerate(seg) if r['b'] and re.match(r'^(Case Scenario|Part II)',r['t']))
        ans=next(i for i,r in enumerate(seg) if i>qs and r['b'] and re.match(r'^Answers? to (Multiple|Case)',r['t']))
        cases=[(i,seg[i]) for i in range(qs,ans) if seg[i]['b'] and re.match(r'^Case Scenario',seg[i]['t'])]
        # numbered questions in question phase, sequential
        nums={};want=1
        for i in range(qs,ans):
            r=seg[i]
            if 100<=r['x']<=125 and re.match(r'^%d\.(\s|$)'%want,r['t']):nums[want]=(i,r);want+=1
        # MCQ ranges from "Questions a to b"
        ranges=[]
        for ci,(i,c) in enumerate(cases):
            nxt=cases[ci+1][0] if ci+1<len(cases) else ans
            rng=None
            for j in range(i,nxt):
                m=re.search(r'Questions?\s+(\d+)\s*(?:to|-|–)\s*(\d+)',seg[j]['t'])
                if m:rng=(int(m.group(1)),int(m.group(2)));break
            if not rng:
                ns=[n for n,(j,r) in nums.items() if i<j<nxt];rng=(min(ns),min(ns)+4) if ns else None
            ranges.append(rng)
        lastmcq=max([r[1] for r in ranges if r] or [0])
        # answers
        def findans(n,frm,boldreq,xmax=130):
            for j in range(frm,len(seg)):
                r=seg[j]
                if r['y']>700:continue
                if r['x']<=xmax and re.match(r'^%d\.(\s|$)'%n,r['t']) and (r['b'] or not boldreq):return j,r
            return None,None
        for ci,(i,c) in enumerate(cases):
            a0=ranges[ci][0] if ranges[ci] else None
            # prefer a specific "Answer to Case Scenario X" heading
            aj=next((j for j in range(ans,len(seg)) if seg[j]['b'] and re.match(r'^Answers? to Case',seg[j]['t']) and casenum(seg[j]['t'])==ci+1),None)
            if aj is None and a0:
                aj,_=findans(a0,ans,False,300)
            ar=seg[aj] if aj is not None else None
            out.append(dict(name=f'{ex} · Case {ci+1}',q=c,a=ar,mcq=ranges[ci]))
        pos=ans
        for n in sorted(nums):
            if n<=lastmcq:continue
            j,r=findans(n,pos,True)
            if j is not None:pos=j
            out.append(dict(name=f'{ex} · Q{n}',q=nums[n][1],a=r))
    return d,out

def pyq(f):
    d,L=lines(f)
    starts=[i for i,r in enumerate(L) if r['t'].startswith('PAPER – 1')]
    exams=['May 26','Jan 26','Sep 25','May 25','Nov 24','May 24']
    out=[]
    for k,s in enumerate(starts):
        e=starts[k+1] if k+1<len(starts) else len(L);seg=L[s:e];ex=exams[k]
        cases=[(i,r) for i,r in enumerate(seg) if r['b'] and re.match(r'^Case (Scenario|Study)',r['t'])]
        key=next((i for i,r in enumerate(seg) if r['b'] and re.match(r'^Answer [Kk]ey',r['t'])),None)
        # MCQ numbers, sequential from 1, assigned to the case they fall in
        firsts={};want=1;end=key or len(seg)
        c0=cases[0][0] if cases else end
        for j in range(c0,end):
            r=seg[j]
            if 100<=r['x']<=126 and r['y']<=700 and re.match(r'^%d\.(\s|$)'%want,r['t']):
                ci=max([c for c,(i,_) in enumerate(cases) if i<=j]);firsts.setdefault(ci,want);want+=1
        for ci,(i,c) in enumerate(cases):
            first=firsts.get(ci);ar=None
            if key is not None and first:
                for j in range(key,min(key+150,len(seg))):
                    if re.match(r'^%d\.?(\s|$)'%first,seg[j]['t']) and seg[j]['x']<300:ar=seg[j];break
            if ar is None and key is not None:ar=seg[key]
            out.append(dict(name=f'{ex} · Case {ci+1}',q=c,a=ar,mcq=first))
        qi=[(i,r,int(re.search(r'\d+',r['t']).group())) for i,r in enumerate(seg) if r['b'] and re.match(r'^Questions? \d+\s*$',r['t'])]
        for k2,(i,r,n) in enumerate(qi):
            nxt=qi[k2+1][0] if k2+1<len(qi) else len(seg)
            a=next((seg[j] for j in range(i,nxt) if seg[j]['b'] and seg[j]['t']=='Answer'),None)
            out.append(dict(name=f'{ex} · Q{n}',q=r,a=a))
    return d,out
if __name__=='__main__':
    for nm,fn in [('rtp',rtp),('pyq',pyq)]:
        d,o=fn(nm+'.pdf')
        print('=====',nm,len(o))
        for e in o:
            q=e['q'];a=e['a']
            print(f"{e['name']:16s} Q p{q['p']:3d} y{q['y']:4.0f} {q['t'][:28]:28s} | A "+(f"p{a['p']:3d} y{a['y']:4.0f} {a['t'][:30]}" if a else 'MISSING')+(f"  mcq{e.get('mcq')}" if 'mcq' in e else ''))
