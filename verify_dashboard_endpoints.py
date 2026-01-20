import requests
import sys
import json

def verify_endpoints():
    base_url = "http://localhost:8001/api"
    # Login to get token
    try:
        login_resp = requests.post(f"{base_url}/auth/login", data={"username": "admin", "password": "admin123"})
        if login_resp.status_code != 200:
            print("❌ Login failed")
            sys.exit(1)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
        
    # Verify /api/users
    print("Testing GET /api/users...")
    try:
        resp = requests.get(f"{base_url}/users", headers=headers)
        if resp.status_code == 200:
            users = resp.json()
            print(f"✅ /api/users returned {len(users)} users")
            print(f"   Sample: {users[0] if users else 'None'}")
        else:
            print(f"❌ /api/users failed: {resp.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ /api/users error: {e}")
        sys.exit(1)

    # Verify /api/notifications
    print("\nTesting GET /api/notifications...")
    try:
        resp = requests.get(f"{base_url}/notifications", headers=headers)
        if resp.status_code == 200:
            notifs = resp.json()
            print(f"✅ /api/notifications returned {len(notifs)} notifications")
        else:
            print(f"❌ /api/notifications failed: {resp.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ /api/notifications error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_endpoints()
