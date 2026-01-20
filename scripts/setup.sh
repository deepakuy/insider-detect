#!/bin/bash

echo "🚀 Starting complete insider-detect environment setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.yml down

# Build and start all services
echo "🔨 Building and starting all services..."
docker-compose -f docker-compose.yml up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize database
echo "🗄️ Initializing database with tables and default data..."
docker-compose -f docker-compose.yml exec backend python app/database/init_db.py

# Train ML models
echo "🤖 Training ML models..."
docker-compose -f docker-compose.yml exec backend python models/train.py

echo "✅ Setup complete!"
echo ""
echo "🌐 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   pgAdmin: http://localhost:5050 (admin@example.com / admin)"
echo ""
echo "👤 Default users:"
echo "   Admin: admin / admin123"
echo "   Analyst: analyst / analyst123"
