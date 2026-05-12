import urllib.request, json, time

payload = json.dumps({
    'message': '반지름 4.935cm, 높이 17.273cm 플루토늄 원통 MCNP 코드 작성해줘',
    'history': [],
    'context': {'cellCount': 0, 'surfCount': 0, 'materials': [], 'mode': 'N', 'nps': '1000'}
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/chat/rag',
    data=payload,
    headers={'Content-Type': 'application/json'},
    method='POST'
)

t = time.time()
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read().decode('utf-8'))

elapsed = time.time() - t
reply = data.get('reply', '')

print(f'소요: {elapsed:.1f}s')
print(f'길이: {len(reply)} chars')
print(f'반복0 포함: {bool(__import__("re").search(r"(?:0[\\s,]){8,}", reply))}')
print()
print(reply)
print()
for s in data.get('sources', []):
    print('출처:', s)
