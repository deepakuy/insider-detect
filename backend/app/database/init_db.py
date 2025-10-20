"""
Database Initialization Script
Creates tables, inserts MITRE mappings, and adds default users.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from datetime import datetime
import os
from dotenv import load_dotenv

from .models import Base, User, MITREMapping

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_tables():
    print("  Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print(" Tables created successfully!")

def insert_mitre_mappings():
    print("\n Inserting MITRE ATT&CK mappings...")
    session = SessionLocal()

    mitre_data = [
        ("TA0001", "Initial Access", "T1078", "Valid Accounts", "Adversaries gain access with stolen credentials"),
        ("TA0001", "Initial Access", "T1566", "Phishing", "Spearphishing email campaigns"),
        ("TA0002", "Execution", "T1059", "Command and Scripting Interpreter", "Script execution for malicious actions"),
        ("TA0003", "Persistence", "T1547", "Boot or Logon Autostart Execution", "Configuration abuse for persistence"),
        ("TA0004", "Privilege Escalation", "T1068", "Exploitation for Privilege Escalation", "System vulnerability exploitation"),
        ("TA0004", "Privilege Escalation", "T1134", "Access Token Manipulation", "Privilege impersonation via tokens"),
        ("TA0005", "Defense Evasion", "T1070", "Indicator Removal on Host", "Log or artifact deletion"),
        ("TA0006", "Credential Access", "T1110", "Brute Force", "Password guessing attacks"),
        ("TA0006", "Credential Access", "T1003", "OS Credential Dumping", "Extract credentials via malware"),
        ("TA0007", "Discovery", "T1083", "File and Directory Discovery", "Enumerate file system"),
        ("TA0007", "Discovery", "T1057", "Process Discovery", "List running processes"),
        ("TA0008", "Lateral Movement", "T1021", "Remote Services", "Use remote protocols for movement"),
        ("TA0009", "Collection", "T1005", "Data from Local System", "Collect files or data locally"),
        ("TA0009", "Collection", "T1114", "Email Collection", "Read local email data"),
        ("TA0010", "Exfiltration", "T1041", "Exfiltration Over C2 Channel", "Data exfiltration using command channels"),
        ("TA0010", "Exfiltration", "T1048", "Exfiltration Over Alternative Protocol", "Alternate channel exfiltration"),
    ]

    for row in mitre_data:
        session.add(MITREMapping(
            tactic_id=row[0],
            tactic_name=row[1],
            technique_id=row[2],
            technique_name=row[3],
            description=row[4]
        ))

    session.commit()
    print(f" Inserted {len(mitre_data)} MITRE mappings")
    session.close()

def create_default_users():
    print("\n Creating default users...")
    session = SessionLocal()

    users = [
        ("admin", "admin@threatdetection.local", "admin123", "admin"),
        ("analyst", "analyst@threatdetection.local", "analyst123", "analyst"),
    ]

    for username, email, password, role in users:
        hashed_pw = pwd_context.hash(password)
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_pw,
            role=role,
            created_at=datetime.utcnow(),
            is_active=True
        )
        session.add(new_user)

    session.commit()
    print(" Created users:\n    admin / admin123 (Admin)\n    analyst / analyst123 (Analyst)")
    session.close()

def main():
    print("=" * 70)
    print(" " * 22 + "DATABASE INITIALIZATION")
    print("=" * 70)

    create_tables()
    insert_mitre_mappings()
    create_default_users()

    print("\n" + "=" * 70)
    print(" DATABASE READY!")
    print("=" * 70)

if __name__ == "__main__":
    main()
