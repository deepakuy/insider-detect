import sys
import os
sys.path.append('/app')
from database.database import engine
from database.models import Base, IncidentActivity

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")
