
import os
import sys
import pandas as pd
import random
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.database.database import SessionLocal, engine
from app.database.models import User, Event, Alert, Incident, MonitoredUser

def seed_data():
    print("🌱 Starting Dashboard Seeding...")
    db = SessionLocal()
    
    try:
        # Load synthetic data
        csv_path = Path("/data/synthetic_events.csv")
        if not csv_path.exists():
            print("❌ synthetic_events.csv not found!")
            return

        df = pd.read_csv(csv_path)
        print(f"   Loaded {len(df)} events from CSV")
        
        # 1. Seed Monitored Users
        print("   Seeding Monitored Users...")
        unique_users = df['user_id'].unique()
        
        departments = ['Engineering', 'Finance', 'HR', 'Sales', 'IT']
        roles = ['Developer', 'Analyst', 'Manager', 'Director', 'Specialist']
        
        users_created = 0
        for uid in unique_users:
            if not db.query(MonitoredUser).filter(MonitoredUser.user_id == uid).first():
                user = MonitoredUser(
                    user_id=uid,
                    user_role=random.choice(roles),
                    department=random.choice(departments),
                    risk_score=random.uniform(0.1, 0.9),
                    last_activity=datetime.utcnow()
                )
                db.add(user)
                users_created += 1
        
        db.commit()
        print(f"   ✅ Created {users_created} monitored users")

        # 2. Seed Recent Events (Last 24h)
        print("   Seeding Recent Events...")
        # Sort by time and take last 500 for speed
        recent_df = df.tail(500).copy()
        
        events_created = 0
        for _, row in recent_df.iterrows():
            # Adjust timestamp to be recent (today/yesterday) regardless of CSV content
            # This ensures they show up in "Recent" filters
            offset = random.randint(0, 24 * 60)
            timestamp = datetime.utcnow() - timedelta(minutes=offset)
            
            event = Event(
                timestamp=timestamp,
                user_id=row['user_id'],
                event_type=row['event_type'],
                src_ip=row.get('src_ip', '127.0.0.1'),
                dst_ip=row.get('dst_ip', ''),
                bytes_transferred=int(row.get('bytes_transferred', 0)),
                file_name=row.get('file_name', ''),
                geo_country='US',
                success=True
            )
            db.add(event)
            db.commit() # Commit individually to get ID for alerts (a bit slow but safe)
            db.refresh(event)
            events_created += 1
            
            # 3. Create Alerts for Malicious Events
            if row['threat_type'] in ['insider', 'apt']:
                is_critical = row['threat_type'] == 'apt'
                threat_score = random.uniform(0.8, 0.99) if is_critical else random.uniform(0.6, 0.85)
                
                alert = Alert(
                    timestamp=timestamp,
                    user_id=row['user_id'],
                    event_id=event.id,
                    threat_score=threat_score,
                    threat_level='critical' if threat_score > 0.8 else 'high',
                    threat_type=row['threat_type'], # 'insider' or 'apt'
                    mitre_tactic="Initial Access" if is_critical else "Exfiltration", # Simplified mapping
                    mitre_technique="T1078" if is_critical else "T1048",
                    description=f"Detected {row['threat_type']} activity: {row['event_type']}"
                )
                db.add(alert)
                db.commit()

        print(f"   ✅ Created {events_created} recent events and associated alerts")

        # 4. Create dummy Incidents
        print("   Seeding Incidents...")
        open_alerts = db.query(Alert).filter(Alert.incident_id == None).limit(5).all()
        
        if open_alerts:
            incident = Incident(
                incident_number=f"INC-{random.randint(1000, 9999)}",
                user_id=open_alerts[0].user_id,
                start_time=datetime.utcnow() - timedelta(hours=2),
                severity="critical",
                status="open",
                narrative="Automated incident created from critical alert correlation.",
                assigned_to="admin"
            )
            db.add(incident)
            db.commit()
            print("   ✅ Created 1 sample incident")
            
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        db.rollback()
    finally:
        db.close()
        print("✅ Seeding Complete!")

if __name__ == "__main__":
    seed_data()
