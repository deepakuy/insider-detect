from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read database connection URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")

# SQLAlchemy Engine - core interface to the database
engine = create_engine(DATABASE_URL)

# SessionLocal - used to manage database sessions (connections)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for FastAPI routes - provides a clean database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
