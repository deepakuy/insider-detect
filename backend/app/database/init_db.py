from sqlalchemy.orm import Session
from .database import engine, SessionLocal
from .models import Base, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def init_db():
    print("🔄 Initializing database...")
    # 1. Create Tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created/verified.")

    # 2. Seed Users
    db = SessionLocal()
    try:
        # Check for admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("   Creating default admin user...")
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)
        
        # Check for analyst
        analyst = db.query(User).filter(User.username == "analyst").first()
        if not analyst:
            print("   Creating default analyst user...")
            analyst_user = User(
                username="analyst",
                email="analyst@example.com",
                hashed_password=get_password_hash("analyst123"),
                role="analyst"
            )
            db.add(analyst_user)
        
        db.commit()
        print("✅ Default users seeded.")
    except Exception as e:
        print(f"❌ Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()
