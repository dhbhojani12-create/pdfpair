import sys,re;sys.path.insert(0,'/home/claude/mark')
from parse import lines
def parse(f='mcq.pdf'):
    d,L=lines(f);L=[r for r in L if 60<r['y']<790]
    heads=[i for i,r in enumerate(L) if r['p']>7 and r['b'] and re.match(r'^CASE SCENARIO\s+(\d+)\s*$',r['t'])]
    out=[];key={};bad=[]
    for k,i in enumerate(heads):
        cn=int(re.search(r'\d+',L[i]['t']).group());end=heads[k+1] if k+1<len(heads) else len(L)
        ai=next((j for j in range(i,end) if L[j]['t'].startswith('ANSWERS TO MULTIPLE')),None)
        if ai is None:bad.append(cn);continue
        qs={};want=1
        for j in range(i,ai):
            r=L[j]
            if 100<=r['x']<=116 and re.match(r'^%d\.(\s|$)'%want,r['t']):qs[want]=r;want+=1
        an={};want=1
        for j in range(ai,end):
            r=L[j]
            mm=re.match(r'^(\d+)\.(\s|$)',r['t'])
            if 100<=r['x']<=116 and mm and (r['b'] or re.search(r'Option',' '.join(x['t'] for x in L[j:j+2]))) and int(mm.group(1)) in qs and int(mm.group(1))>=want and int(mm.group(1)) not in an:
                want=int(mm.group(1))
                # the option letter is on this line or the next few
                opt=None
                for jj in range(j,min(j+10,end)):
                    m=re.search(r'Option\s*\(([a-dA-D])\)',L[jj]['t'])
                    if m:opt=m.group(1).lower();break
                an[want]=(r,opt);want+=1
        # an answer printed without its number: take the next unlabelled "Option (x)" line
        idx={id(r):j for j,r in enumerate(L)}
        for n in sorted(qs):
            if n in an:continue
            lo=idx[id(an[n-1][0])] if n-1 in an else ai
            hi=next((idx[id(an[m][0])] for m in sorted(an) if m>n),end)
            for jj in range(lo+1,hi):
                m=re.match(r'^Option\s*\(([a-dA-D])\)',L[jj]['t'])
                if m and 125<=L[jj]['x']<=150 and not re.match(r'^\d+\.',L[jj-1]['t'] if L[jj-1]['p']==L[jj]['p'] and abs(L[jj-1]['y']-L[jj]['y'])<3 else ''):an[n]=(L[jj],m.group(1).lower());break
        if set(qs)!=set(an) or not qs:bad.append((cn,len(qs),len(an)))
        out.append(dict(name=f'Case {cn}',q=L[i],a=L[ai],case=cn))
        for n in sorted(qs):
            if n in an:out.append(dict(name=f'Case {cn} · Q{n}',q=qs[n],a=an[n][0],case=cn,opt=an[n][1]))
    return d,out,bad
if __name__=='__main__':
    d,o,bad=parse()
    print(len(o),'pairs; problems:',bad)
    import collections;print('mcqs',sum(1 for e in o if 'Q' in e['name']),'no option letter:',[e['name'] for e in o if 'Q' in e['name'] and not e['opt']][:20])
    for e in o[:8]:print(e['name'],e['q']['p'],round(e['q']['y']),'|',e['a']['p'],round(e['a']['y']),e.get('opt'))
