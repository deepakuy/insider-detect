import urllib.request
import urllib.parse
import json

# Login
data = urllib.parse.urlencode({'username': 'admin', 'password': 'admin123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=data, method='POST')
resp = urllib.request.urlopen(req)
token = json.loads(resp.read().decode())['access_token']

# Get incident detail to check activities
inc_req = urllib.request.Request('http://localhost:8000/api/incidents/2')
inc_req.add_header('Authorization', f'Bearer {token}')
inc_data = json.loads(urllib.request.urlopen(inc_req).read().decode())

print(f"Incident status: {inc_data['incident']['status']}")
print(f"Activities count: {len(inc_data['activities'])}")
for act in inc_data['activities'][:3]:
    print(f"  - {act['action']}: {act['details']}")
