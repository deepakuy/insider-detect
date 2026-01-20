import requests
import sys

def verify_login_response():
    url = "http://localhost:8001/api/auth/login"
    payload = {
        "username": "admin",
        "password": "admin123"
    }
    
    print(f"Attempting login at {url}...")
    try:
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            data = response.json()
            print("✅ Login Successful!")
            print(f"Response Keys: {list(data.keys())}")
            
            if "user" in data:
                user = data["user"]
                print(f"User Object: {user}")
                if user.get("role") == "admin":
                    print("✅ Role is correctly returned as 'admin'")
                    sys.exit(0)
                else:
                    print(f"❌ Role mismatch! Expected 'admin', got '{user.get('role')}'")
                    sys.exit(1)
            else:
                print("❌ 'user' object missing from response!")
                sys.exit(1)
        else:
            print(f"❌ Login Failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_login_response()
