import urllib.request
import urllib.parse
import json

# Login
data = urllib.parse.urlencode({'username': 'admin', 'password': 'admin123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=data, method='POST')
resp = urllib.request.urlopen(req)
token = json.loads(resp.read().decode())['access_token']
print('Token obtained')

# Get incidents
incs_req = urllib.request.Request('http://localhost:8000/api/incidents')
incs_req.add_header('Authorization', f'Bearer {token}')
incs = json.loads(urllib.request.urlopen(incs_req).read().decode())
print(f'Found {len(incs)} incidents')
if not incs:
    print('No incidents to test')
    exit(0)
    
inc_id = incs[0]['id']
print(f'Testing PATCH on incident {inc_id}')

# PATCH status
patch_data = json.dumps({'status': 'investigating', 'comment': 'Test from script'}).encode()
patch_req = urllib.request.Request(
    f'http://localhost:8000/api/incidents/{inc_id}/status',
    data=patch_data,
    method='PATCH'
)
patch_req.add_header('Authorization', f'Bearer {token}')
patch_req.add_header('Content-Type', 'application/json')

try:
    patch_resp = urllib.request.urlopen(patch_req)
    result = json.loads(patch_resp.read().decode())
    print(f'SUCCESS: Status is now {result["status"]}')
except urllib.error.HTTPError as e:
    print(f'ERROR {e.code}: {e.read().decode()}')
