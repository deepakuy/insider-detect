-- Initialize database for insider threat detection system
-- This script runs automatically when PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database schema (the actual tables will be created by SQLAlchemy)
-- This is just a placeholder for any custom SQL needed

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE insider_detect TO postgres;
