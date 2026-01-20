from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from app.database.models import User

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_passwords():
    print("Fixing user passwords...")
    session = SessionLocal()
    
    # Update admin password
    admin_user = session.query(User).filter(User.username == "admin").first()
    if admin_user:
        admin_user.hashed_password = pwd_context.hash("admin123")
        print("Updated admin password")
    
    # Update analyst password
    analyst_user = session.query(User).filter(User.username == "analyst").first()
    if analyst_user:
        analyst_user.hashed_password = pwd_context.hash("analyst123")
        print("Updated analyst password")
    
    session.commit()
    session.close()
    print("Passwords fixed successfully!")

if __name__ == "__main__":
    fix_passwords()
