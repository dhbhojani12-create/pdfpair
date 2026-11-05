"""Put marks for one set into Darshan's Claude inbox (inbox/<hash>.json), locked with his inbox code.

    python3 tools/inbox_send.py CODE marks.json

marks.json = {"setKey": "<name|size::name|size, from his backup>", "setName": "FR Module 2", "note": "optional short text",
              "stickers": {"q": [{"n":1,"page":5,"x":0.09,"y":0.48}], "a": [...]},
              "names": {"1": "Ind AS 2 · Illus 1"}, "meta": {"1": {"ch": "Ind AS 2 Inventory"}}}
Sticker numbers in marks.json can start at 1: the app renumbers them after the set's highest number and skips ones already marked.
Then commit and push inbox/. The app checks raw.githubusercontent.com on open and every 5 minutes, and asks before applying.
Never put the code itself in the repo. Items older than 45 days are pruned.
"""
import sys, os, json, re, time, base64, hashlib, secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def norm(c): return re.sub(r'[^A-Z0-9]', '', c.upper())
def fname(code): return hashlib.sha256(('pdfpair-inbox:' + norm(code)).encode()).hexdigest()[:20] + '.json'

def seal(code, obj):
    salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=150000).derive(norm(code).encode())
    ct = AESGCM(key).encrypt(iv, json.dumps(obj, ensure_ascii=False).encode(), None)
    b = lambda x: base64.b64encode(x).decode()
    return {'id': secrets.token_hex(8), 'at': int(time.time() * 1000), 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}

if __name__ == '__main__':
    code, src = sys.argv[1], sys.argv[2]
    if len(norm(code)) < 12: sys.exit('code looks too short')
    marks = json.load(open(src, encoding='utf-8'))
    for k in ('setKey', 'setName', 'stickers'): assert k in marks, 'marks.json needs ' + k
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'inbox')
    os.makedirs(root, exist_ok=True)
    path = os.path.join(root, fname(code))
    box = json.load(open(path)) if os.path.exists(path) else {'items': []}
    cut = (time.time() - 45 * 86400) * 1000
    box['items'] = [i for i in box['items'] if i['at'] > cut] + [seal(code, marks)]
    json.dump(box, open(path, 'w'))
    n = len({s['n'] for s in marks['stickers'].get('q', []) + marks['stickers'].get('a', [])})
    print('added', n, 'stickers for', marks['setName'], '->', os.path.relpath(path, os.path.join(root, '..')))
