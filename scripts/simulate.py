import argparse
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

import requests


API_URL = "http://localhost:8000"


class Simulator:
    def __init__(self, api_url: str = API_URL):
        self.api_url = api_url.rstrip("/")
        self.token: Optional[str] = None

    # ------------------------- Auth ------------------------- #
    def login(self, username: str = "analyst", password: str = "analyst123") -> bool:
        url = f"{self.api_url}/api/auth/login"
        data = {"username": username, "password": password}
        print(f"[AUTH] Logging in as {username} → {url}")
        resp = requests.post(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if resp.ok:
            payload = resp.json()
            self.token = payload.get("access_token")
            print("[AUTH] ✅ Login successful, token acquired")
            return True
        print(f"[AUTH] ❌ Login failed: {resp.status_code} {resp.text}")
        return False

    def _auth_headers(self) -> Dict[str, str]:
        if not self.token:
            raise RuntimeError("Not authenticated - call login() first")
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    # --------------------- Event Sender --------------------- #
    def send_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.api_url}/api/predict"
        headers = self._auth_headers()
        resp = requests.post(url, json=event, headers=headers)
        if not resp.ok:
            print(f"[PREDICT] ❌ {resp.status_code} {resp.text}")
            resp.raise_for_status()
        return resp.json()

    # ------------------- Demo Scenarios --------------------- #
    def _print_result(self, label: str, result: Dict[str, Any]):
        score = result.get("threat_score")
        level = result.get("threat_level")
        tactic = result.get("mitre_tactic")
        technique = result.get("mitre_technique")
        print(f"  → {label}: score={score:.3f} level={level} mitre={tactic}/{technique}")

    def _now_iso(self, plus_seconds: int = 0) -> str:
        return (datetime.utcnow() + timedelta(seconds=plus_seconds)).isoformat() + "Z"

    def demo_insider_threat(self):
        """
        Simulate insider data exfiltration.
        - User user042
        - Stage 1: 5 file_access on CONFIDENTIAL files over 5 minutes
        - Stage 2: 1 large file transfer (500MB) to external IP
        """
        print("\n=== DEMO: Insider Threat - Data Exfiltration (user042) ===")
        user_id = "user042"
        base_time = datetime.utcnow()
        # Stage 1
        for i in range(5):
            event = {
                "timestamp": (base_time + timedelta(minutes=i)).isoformat() + "Z",
                "user_id": user_id,
                "src_ip": "10.0.42.10",
                "dst_ip": "",
                "event_type": "file_access",
                "file_name": f"CONFIDENTIAL_project_{i}.pdf",
                "bytes_transferred": 0,
                "process": "Explorer.exe",
                "device": f"PC-042",
                "success": True,
                "geo_country": "US",
            }
            result = self.send_event(event)
            self._print_result(f"file_access {i+1}/5", result)
            time.sleep(1)
        # Stage 2: exfiltration
        event = {
            "timestamp": (base_time + timedelta(minutes=6)).isoformat() + "Z",
            "user_id": user_id,
            "src_ip": "10.0.42.10",
            "dst_ip": "203.0.113.200",  # external
            "event_type": "file_transfer",
            "file_name": "archive_confidential.zip",
            "bytes_transferred": 500 * 1024 * 1024,  # 500MB
            "process": "7z.exe",
            "device": "PC-042",
            "success": True,
            "geo_country": "US",
        }
        result = self.send_event(event)
        self._print_result("exfiltration 500MB", result)

    def demo_apt_attack(self):
        """
        Simulate a classic APT kill chain for user007.
        Stages: 5x login_fail (CN), login_success (CN), privilege_escalation (powershell),
                lateral movement (file_access on 3 devices), exfiltration 1GB
        """
        print("\n=== DEMO: APT Kill Chain (user007) ===")
        user_id = "user007"
        base_time = datetime.utcnow()
        # Stage 1: brute force
        for i in range(5):
            event = {
                "timestamp": (base_time + timedelta(minutes=i)).isoformat() + "Z",
                "user_id": user_id,
                "src_ip": "101.81.0.5",  # China
                "dst_ip": "",
                "event_type": "login_fail",
                "file_name": None,
                "bytes_transferred": 0,
                "process": None,
                "device": None,
                "success": False,
                "geo_country": "CN",
            }
            result = self.send_event(event)
            self._print_result(f"login_fail {i+1}/5", result)
            time.sleep(1)
        # Stage 2: success
        event = {
            "timestamp": (base_time + timedelta(minutes=6)).isoformat() + "Z",
            "user_id": user_id,
            "src_ip": "101.81.0.5",
            "dst_ip": "",
            "event_type": "login_success",
            "file_name": None,
            "bytes_transferred": 0,
            "process": None,
            "device": None,
            "success": True,
            "geo_country": "CN",
        }
        result = self.send_event(event)
        self._print_result("login_success (CN)", result)
        time.sleep(1)
        # Stage 3: privilege escalation
        event = {
            "timestamp": (base_time + timedelta(minutes=7)).isoformat() + "Z",
            "user_id": user_id,
            "src_ip": "10.0.7.10",
            "dst_ip": "",
            "event_type": "privilege_escalation",
            "file_name": None,
            "bytes_transferred": 0,
            "process": "powershell.exe",
            "device": "PC-007",
            "success": True,
            "geo_country": "US",
        }
        result = self.send_event(event)
        self._print_result("privilege_escalation (powershell)", result)
        time.sleep(1)
        # Stage 4: lateral movement (3 devices)
        for d in ("PC-021", "PC-033", "PC-045"):
            event = {
                "timestamp": (base_time + timedelta(minutes=8)).isoformat() + "Z",
                "user_id": user_id,
                "src_ip": "10.0.7.10",
                "dst_ip": "",
                "event_type": "file_access",
                "file_name": "system.config",
                "bytes_transferred": 0,
                "process": "Explorer.exe",
                "device": d,
                "success": True,
                "geo_country": "US",
            }
            result = self.send_event(event)
            self._print_result(f"lateral movement to {d}", result)
            time.sleep(1)
        # Stage 5: exfil 1GB
        event = {
            "timestamp": (base_time + timedelta(minutes=12)).isoformat() + "Z",
            "user_id": user_id,
            "src_ip": "10.0.7.10",
            "dst_ip": "198.51.100.55",
            "event_type": "file_transfer",
            "file_name": "backup_apt_payload.bin",
            "bytes_transferred": 1024 * 1024 * 1024,  # 1GB
            "process": "scp",
            "device": "PC-007",
            "success": True,
            "geo_country": "US",
        }
        result = self.send_event(event)
        self._print_result("exfiltration 1GB", result)

    def demo_benign_baseline(self):
        """Simulate benign baseline user activity for 10 events."""
        print("\n=== DEMO: Benign Baseline (user123) ===")
        user_id = "user123"
        base_time = datetime.utcnow()
        activities = [
            ("login_success", None, 0),
            ("file_access", "readme.txt", 0),
            ("file_access", "notes.docx", 0),
            ("file_transfer", "logo.png", 150 * 1024),
            ("http_request", None, 0),
            ("email_send", None, 0),
            ("file_access", "report.xlsx", 0),
            ("file_transfer", "thumbnail.jpg", 200 * 1024),
            ("login_success", None, 0),
            ("file_access", "presentation.pptx", 0),
        ]
        for i, (etype, fname, bytes_tx) in enumerate(activities):
            event = {
                "timestamp": (base_time + timedelta(minutes=i)).isoformat() + "Z",
                "user_id": user_id,
                "src_ip": "10.0.123.5",
                "dst_ip": "",
                "event_type": etype,
                "file_name": fname,
                "bytes_transferred": bytes_tx,
                "process": None,
                "device": "PC-123",
                "success": True,
                "geo_country": "US",
            }
            result = self.send_event(event)
            self._print_result(f"{etype}", result)
            time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description="Interactive demo simulator for Insider Threat Detection API")
    parser.add_argument("scenario", choices=["insider", "apt", "benign", "all"], nargs="?", default="all")
    parser.add_argument("--api", dest="api_url", default=API_URL)
    args = parser.parse_args()

    sim = Simulator(api_url=args.api_url)
    if not sim.login():
        sys.exit(1)

    if args.scenario in ("insider", "all"):
        sim.demo_insider_threat()
    if args.scenario in ("apt", "all"):
        sim.demo_apt_attack()
    if args.scenario in ("benign", "all"):
        sim.demo_benign_baseline()


if __name__ == "__main__":
    main()


