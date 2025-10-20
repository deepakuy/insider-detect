import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import string

random.seed(42)
np.random.seed(42)

NUM_USERS = 100
NUM_DAYS = 30
EVENTS_PER_DAY = 2000
INSIDER_RATIO = 0.10

US_IP_RANGES = ["34.0.0.", "52.0.0.", "18.0.0."]
FOREIGN_IP_RANGES = ["45.83.0.", "185.12.0.", "61.177.0."]  # CN/RU-like ranges (illustrative)

EVENT_TYPES = [
    "login_success",
    "login_fail",
    "file_access",
    "file_transfer",
    "email_send",
    "http_request",
    "privilege_escalation",
]

CONFIDENTIAL_FILES = [f"confidential_doc_{i}.pdf" for i in range(1, 101)]
NORMAL_FILES = [f"report_{i}.docx" for i in range(1, 201)]
PC_IDS = [f"PC-{i:03d}" for i in range(1, 301)]

users = [f"user_{i:03d}" for i in range(1, NUM_USERS + 1)]
insider_users = set(random.sample(users, int(NUM_USERS * INSIDER_RATIO)))

start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=NUM_DAYS)


def random_ip(ranges):
    base = random.choice(ranges)
    return f"{base}{random.randint(1, 254)}"


def random_us_ip():
    return random_ip(US_IP_RANGES)


def random_foreign_ip():
    return random_ip(FOREIGN_IP_RANGES)


def random_filename(confidential=False):
    return random.choice(CONFIDENTIAL_FILES if confidential else NORMAL_FILES)


def generate_benign_event(day_start):
    # Normal work hours 08:00-17:00
    hour = random.randint(8, 17)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    ts = day_start + timedelta(hours=hour, minutes=minute, seconds=second)

    event_type = random.choices(
        population=["login_success", "file_access", "email_send", "http_request", "login_fail"],
        weights=[0.25, 0.25, 0.20, 0.20, 0.10],
        k=1,
    )[0]

    user_id = random.choice(users)
    src_ip = random_us_ip()
    dst_ip = random_us_ip() if event_type in ("http_request", "email_send") else ""

    file_name = ""
    bytes_transferred = 0

    if event_type == "file_access":
        file_name = random_filename(confidential=False)
    elif event_type == "http_request":
        bytes_transferred = int(np.random.lognormal(mean=10, sigma=1))  # typical web traffic
    elif event_type == "email_send":
        bytes_transferred = int(np.random.lognormal(mean=12, sigma=1))
    elif event_type == "login_fail":
        src_ip = random_us_ip()

    return {
        "timestamp": ts,
        "user_id": user_id,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "event_type": event_type,
        "file_name": file_name,
        "bytes_transferred": bytes_transferred,
        "pc_id": random.choice(PC_IDS),
        "scenario_id": "",
        "attack_stage": "",
        "threat_type": "benign",
    }


def generate_insider_exfiltration(day_start, user_id, scenario_id):
    events = []
    # Stage 1: access 8 confidential files over 15 minutes
    stage1_start = day_start + timedelta(hours=18, minutes=random.randint(0, 30))  # after hours
    for i in range(8):
        ts = stage1_start + timedelta(minutes=i * 2)
        events.append({
            "timestamp": ts,
            "user_id": user_id,
            "src_ip": random_us_ip(),
            "dst_ip": "",
            "event_type": "file_access",
            "file_name": random_filename(confidential=True),
            "bytes_transferred": 0,
            "pc_id": random.choice(PC_IDS),
            "scenario_id": scenario_id,
            "attack_stage": "insider_stage1_access",
            "threat_type": "insider",
        })

    # Stage 2: exfiltrate 200MB-1GB to external IP
    stage2_ts = stage1_start + timedelta(minutes=20)
    bytes_tx = random.randint(200 * 1024**2, 1024**3)
    events.append({
        "timestamp": stage2_ts,
        "user_id": user_id,
        "src_ip": random_us_ip(),
        "dst_ip": random_foreign_ip(),
        "event_type": "file_transfer",
        "file_name": "",
        "bytes_transferred": bytes_tx,
        "pc_id": random.choice(PC_IDS),
        "scenario_id": scenario_id,
        "attack_stage": "insider_stage2_exfiltration",
        "threat_type": "insider",
    })
    return events


def generate_apt_attack(day_start, user_id, scenario_id):
    events = []
    base_time = day_start + timedelta(hours=3, minutes=random.randint(0, 30))

    # 1. Reconnaissance: 5 failed logins from external IP (CN/RU)
    for i in range(5):
        ts = base_time + timedelta(minutes=i * 2)
        events.append({
            "timestamp": ts,
            "user_id": user_id,
            "src_ip": random_foreign_ip(),
            "dst_ip": "",
            "event_type": "login_fail",
            "file_name": "",
            "bytes_transferred": 0,
            "pc_id": random.choice(PC_IDS),
            "scenario_id": scenario_id,
            "attack_stage": "recon",
            "threat_type": "apt",
        })

    # 2. Initial Access: successful login from foreign IP
    ts = base_time + timedelta(minutes=12)
    events.append({
        "timestamp": ts,
        "user_id": user_id,
        "src_ip": random_foreign_ip(),
        "dst_ip": "",
        "event_type": "login_success",
        "file_name": "",
        "bytes_transferred": 0,
        "pc_id": random.choice(PC_IDS),
        "scenario_id": scenario_id,
        "attack_stage": "initial_access",
        "threat_type": "apt",
    })

    # 3. Privilege Escalation: powershell.exe privilege_escalation event
    ts = base_time + timedelta(minutes=20)
    events.append({
        "timestamp": ts,
        "user_id": user_id,
        "src_ip": random_us_ip(),
        "dst_ip": "",
        "event_type": "privilege_escalation",
        "file_name": "powershell.exe",
        "bytes_transferred": 0,
        "pc_id": random.choice(PC_IDS),
        "scenario_id": scenario_id,
        "attack_stage": "privilege_escalation",
        "threat_type": "apt",
    })

    # 4. Lateral Movement: access 3 different PCs
    for i in range(3):
        ts = base_time + timedelta(minutes=25 + i * 3)
        events.append({
            "timestamp": ts,
            "user_id": user_id,
            "src_ip": random_us_ip(),
            "dst_ip": "",
            "event_type": "file_access",
            "file_name": random_filename(confidential=False),
            "bytes_transferred": 0,
            "pc_id": random.choice(PC_IDS),
            "scenario_id": scenario_id,
            "attack_stage": "lateral_movement",
            "threat_type": "apt",
        })

    # 5. Exfiltration: 500MB-2GB transfer to external IP
    ts = base_time + timedelta(minutes=40)
    bytes_tx = random.randint(500 * 1024**2, 2 * 1024**3)
    events.append({
        "timestamp": ts,
        "user_id": user_id,
        "src_ip": random_us_ip(),
        "dst_ip": random_foreign_ip(),
        "event_type": "file_transfer",
        "file_name": "",
        "bytes_transferred": bytes_tx,
        "pc_id": random.choice(PC_IDS),
        "scenario_id": scenario_id,
        "attack_stage": "exfiltration",
        "threat_type": "apt",
    })

    return events


def main():
    all_events = []

    for d in range(NUM_DAYS):
        day_start = start_date + timedelta(days=d)

        # Generate baseline benign events
        for _ in range(EVENTS_PER_DAY):
            all_events.append(generate_benign_event(day_start))

        # Generate insider threats - 3 users per day
        insiders_today = random.sample(list(insider_users), k=min(3, len(insider_users)))
        for iu in insiders_today:
            scenario_id = f"insider_{iu}_{day_start.date()}"
            all_events.extend(generate_insider_exfiltration(day_start, iu, scenario_id))

        # Generate APT attacks - 2 users per day
        apt_users = random.sample(users, k=2)
        for au in apt_users:
            scenario_id = f"apt_{au}_{day_start.date()}"
            all_events.extend(generate_apt_attack(day_start, au, scenario_id))

    df = pd.DataFrame(all_events).sort_values("timestamp").reset_index(drop=True)

    df["file_name"] = df["file_name"].fillna("")
    df["dst_ip"] = df["dst_ip"].fillna("")
    df["bytes_transferred"] = df["bytes_transferred"].fillna(0).astype(int)

    out_path = "data/synthetic_events.csv"
    df.to_csv(out_path, index=False)

    print(f"Total events: {len(df)}")
    print("By threat_type:\n", df.threat_type.value_counts())
    print("By event_type:\n", df.event_type.value_counts())
    print("Sample:\n", df.head())



if __name__ == "__main__":
    main()
