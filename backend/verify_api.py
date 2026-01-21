import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data_bytes = None
        
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        sys.exit(1)
    except Exception as e:
        print(f"Request Error: {e}")
        sys.exit(1)

def verify_incident_api():
    print("Starting verification (urllib)...")
    
    # 1. Login
    print("Logging in...")
    # Login form data is x-www-form-urlencoded
    login_data = urllib.parse.urlencode({"username": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            login_resp = json.loads(response.read().decode())
            token = login_resp["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

    # 2. Get Incidents List
    print("Fetching incidents...")
    incidents = make_request(f"{BASE_URL}/incidents", headers=headers)
    if not incidents:
        print("No incidents found to test.")
        sys.exit(0)
        
    incident_id = incidents[0]["id"]
    print(f"Testing Incident ID: {incident_id}")
    
    # 3. Get Incident Detail
    data = make_request(f"{BASE_URL}/incidents/{incident_id}", headers=headers)
    print("Incident Detail Response Keys:", list(data.keys()))
    
    if "activities" not in data:
        print("❌ 'activities' field MISSING in response!")
        sys.exit(1)
    
    print(f"✅ 'activities' field present. Count: {len(data['activities'])}")
    
    # 4. Test Status Update
    print("Testing Status Update...")
    update_data = {"status": "investigating", "comment": "Urllib verification test"}
    resp = make_request(f"{BASE_URL}/incidents/{incident_id}/status", method="PATCH", data=update_data, headers=headers)
    
    # 5. Verify Timeline Log
    data = make_request(f"{BASE_URL}/incidents/{incident_id}", headers=headers)
    activities = data.get("activities", [])
    found = any("Urllib verification test" in (a.get("details") or "") for a in activities)
    
    if found:
        print("✅ Status change logged in activities successfully.")
    else:
        print("❌ Status change NOT found in activities.")
        sys.exit(1)

if __name__ == "__main__":
    verify_incident_api()
