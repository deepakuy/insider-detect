import requests
import sys

def verify_login():
    url = "http://localhost:8001/api/auth/login"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    
    print(f"Attempting login at {url} with default credentials...")
    try:
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            token = response.json().get("access_token")
            if token:
                print("✅ Login Successful! Access token received.")
                print(f"Token: {token[:20]}...")
                sys.exit(0)
            else:
                print("❌ Login succeeded but no token returned.")
                sys.exit(1)
        else:
            print(f"❌ Login Failed using default credentials.")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_login()
