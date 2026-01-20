# PowerShell setup script for insider-detect

Write-Host "🚀 Starting complete insider-detect environment setup..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml down

# Build and start all services
Write-Host "🔨 Building and starting all services..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml up --build -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Initialize database
Write-Host "🗄️ Initializing database with tables and default data..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml exec backend python app/database/init_db.py

# Train ML models
Write-Host "🤖 Training ML models..." -ForegroundColor Yellow
docker-compose -f docker-compose.yml exec backend python models/train.py

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000"
Write-Host "   Backend API: http://localhost:8000"
Write-Host "   API Docs: http://localhost:8000/docs"
Write-Host "   pgAdmin: http://localhost:5050 (admin@example.com / admin)"
Write-Host ""
Write-Host "👤 Default users:" -ForegroundColor Cyan
Write-Host "   Admin: admin / admin123"
Write-Host "   Analyst: analyst / analyst123"

# Show running containers
Write-Host ""
Write-Host "📋 Running containers:" -ForegroundColor Cyan
docker-compose -f docker-compose.yml ps
