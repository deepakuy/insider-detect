"""
Seed script to add Indian enterprise users for demo purposes.
Safe to re-run - only inserts users that don't already exist (idempotent).

Usage:
    docker compose exec backend python /app/seed_indian_users.py
"""

import sys
from pathlib import Path
from datetime import datetime

# Add app to path
sys.path.insert(0, str(Path(__file__).resolve().parent / "app"))

from passlib.context import CryptContext
from database.database import SessionLocal
from database.models import User

# Use same hashing as the rest of the project
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Default password for all new users
DEFAULT_PASSWORD = "Password@123"

# Users to add
INDIAN_USERS = [
    # Admins
    {"username": "raghav.sharma", "email": "raghav.sharma@company.com", "role": "admin"},
    {"username": "anita.verma", "email": "anita.verma@company.com", "role": "admin"},
    
    # Analysts - SOC
    {"username": "aarav.patel", "email": "aarav.patel@company.com", "role": "analyst"},
    {"username": "sneha.iyer", "email": "sneha.iyer@company.com", "role": "analyst"},
    
    # Analysts - IT Security
    {"username": "rohit.mehra", "email": "rohit.mehra@company.com", "role": "analyst"},
    {"username": "priya.kulkarni", "email": "priya.kulkarni@company.com", "role": "analyst"},
    
    # Analysts - Engineering
    {"username": "vikram.singh", "email": "vikram.singh@company.com", "role": "analyst"},
    {"username": "neha.gupta", "email": "neha.gupta@company.com", "role": "analyst"},
    
    # Analysts - Finance
    {"username": "karan.malhotra", "email": "karan.malhotra@company.com", "role": "analyst"},
    {"username": "pooja.nair", "email": "pooja.nair@company.com", "role": "analyst"},
    
    # Additional users
    {"username": "arjun.reddy", "email": "arjun.reddy@company.com", "role": "analyst"},
    {"username": "kavita.desai", "email": "kavita.desai@company.com", "role": "analyst"},
]

def seed_users():
    """Seed Indian users into the database."""
    print("🇮🇳 Seeding Indian enterprise users...")
    
    db = SessionLocal()
    created_count = 0
    skipped_count = 0
    
    try:
        hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        for user_data in INDIAN_USERS:
            # Check if user already exists
            existing = db.query(User).filter(User.username == user_data["username"]).first()
            
            if existing:
                print(f"   ⏭️  Skipped: {user_data['username']} (already exists)")
                skipped_count += 1
                continue
            
            # Create new user
            new_user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=hashed_password,
                role=user_data["role"],
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            db.add(new_user)
            print(f"   ✅ Created: {user_data['username']} ({user_data['role']})")
            created_count += 1
        
        db.commit()
        
        print(f"\n📊 Summary:")
        print(f"   Created: {created_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total:   {len(INDIAN_USERS)}")
        print("\n✅ Seeding complete!")
        
    except Exception as e:
        print(f"\n❌ Error seeding users: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
