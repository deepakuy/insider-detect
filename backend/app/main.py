"""
FastAPI Application for Insider Threat Detection
Complete API with JWT auth, ML prediction, and database integration.
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, Depends, status, Response, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
import redis
import prometheus_client
from prometheus_client import Counter, Histogram, generate_latest

# Add backend to path for imports
sys.path.append(str(Path(__file__).resolve().parent))

from database.database import get_db
from database.models import User, Event, Alert, MonitoredUser, MITREMapping, Incident, IncidentActivity
from database.init_db import init_db
from schemas import (
    EventInput, PredictionResponse, AlertResponse, UserTimelineResponse,
    Token, TokenData, UserOut, LoginResponse, NotificationResponse,
    StatsResponse, IncidentResponse, IncidentDetailResponse,
    IncidentStatusUpdate, IncidentActivityResponse, AlertExplainResponse
)
from features.engineering import FeatureEngineer
from simulation import Simulator

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-256-bit-secret-key-change-in-production-abc123xyz789")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Dynamic model path relative to this file
MODEL_PATH = os.getenv("MODEL_PATH", str(Path(__file__).resolve().parent.parent / "models" / "artifacts"))
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

# Thresholds
THRESHOLD_CRITICAL = float(os.getenv("THRESHOLD_CRITICAL", "0.85"))
THRESHOLD_HIGH = float(os.getenv("THRESHOLD_HIGH", "0.70"))
THRESHOLD_MEDIUM = float(os.getenv("THRESHOLD_MEDIUM", "0.50"))

# Initialize FastAPI app
app = FastAPI(
    title="Insider Threat Detection API",
    description="Real-time threat detection using ML ensemble models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Redis client
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# ML Models (loaded at startup)
rf_model = None
xgb_model = None
scaler = None
feature_engineer = FeatureEngineer(redis_client)

# Prometheus metrics
REQUEST_COUNT = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('api_request_duration_seconds', 'API request duration', ['method', 'endpoint'])
PREDICTION_COUNT = Counter('predictions_total', 'Total predictions made', ['threat_level'])

def load_ml_models():
    """Load ML models and scaler from artifacts directory."""
    global rf_model, xgb_model, scaler
    
    try:
        # Compute absolute path to models/artifacts relative to this file
        model_dir = Path(__file__).resolve().parent.parent / "models" / "artifacts"
        rf_model = joblib.load(model_dir / "rf_model.pkl")
        xgb_model = joblib.load(model_dir / "xgb_model.pkl")
        scaler = joblib.load(model_dir / "scaler.pkl")
        print("✅ ML models loaded successfully")
    except Exception as e:
        print(f"❌ Error loading ML models: {e}")
        raise

def map_to_mitre(threat_type: str, event_type: str) -> tuple[str, str]:
    """
    Map threat type and event type to MITRE ATT&CK tactics and techniques.
    
    Args:
        threat_type: Type of threat (apt, insider, etc.)
        event_type: Type of event (login_fail, file_transfer, etc.)
    
    Returns:
        Tuple of (tactic, technique)
    """
    mitre_mapping = {
        "apt": {
            "login_fail": ("TA0001", "T1110"),  # Initial Access, Brute Force
            "login_success": ("TA0001", "T1078"),  # Initial Access, Valid Accounts
            "privilege_escalation": ("TA0004", "T1068"),  # Privilege Escalation, Exploitation
            "file_access": ("TA0008", "T1021"),  # Lateral Movement, Remote Services
            "file_transfer": ("TA0010", "T1041"),  # Exfiltration, Over C2 Channel
        },
        "insider": {
            "file_access": ("TA0009", "T1005"),  # Collection, Data from Local System
            "file_transfer": ("TA0010", "T1048"),  # Exfiltration, Over Alternative Protocol
            "email_send": ("TA0009", "T1114"),  # Collection, Email Collection
        }
    }
    
    tactic_id, technique_id = mitre_mapping.get(threat_type, {}).get(event_type, ("TA0000", "T0000"))
    return tactic_id, technique_id

def get_threat_level(score: float) -> str:
    """Determine threat level based on score."""
    if score >= THRESHOLD_CRITICAL:
        return "critical"
    elif score >= THRESHOLD_HIGH:
        return "high"
    elif score >= THRESHOLD_MEDIUM:
        return "medium"
    else:
        return "low"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        # Fallback to direct bcrypt verification
        import bcrypt
        password_bytes = plain_password.encode('utf-8')
        try:
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
        except:
            return False

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    print(f"Looking for user: {username}")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        print(f"User {username} not found in database")
        return None
    
    print(f"User found: {user.username}, checking password...")
    if not verify_password(password, user.hashed_password):
        print(f"Password verification failed for {username}")
        return None
    
    print(f"Password verification successful for {username}")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Startup Readiness Flag
STARTUP_COMPLETE = False

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global STARTUP_COMPLETE
    print("🚀 Starting Insider Threat Detection API...")
    
    # --- DATABASE INITIALIZATION ---
    try:
        init_db()
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
    
    # --- AUTOMATED ARTIFACT RESTORATION ---
    # Check if critical model artifacts exist
    rf_path = Path(MODEL_PATH) / "rf_model.pkl"
    if not rf_path.exists():
        print("⚠️  ML Artifacts not found. Initiating automated restoration...")
        import subprocess
        
        # 1. Check for Dataset
        data_csv = Path("/data/synthetic_events.csv")
        if not data_csv.exists():
            print("   Generating synthetic dataset (this may take 10-20 seconds)...")
            try:
                subprocess.run(["python", "/data/synthetic_generator.py"], check=True, cwd="/")
                print("   ✅ Dataset generated successfully.")
            except Exception as e:
                print(f"   ❌ Failed to generate dataset: {e}")
                raise
        else:
             print("   ✅ Dataset found at /data/synthetic_events.csv")

        # 2. Run Training
        print("   Training ML models (this may take 10-20 seconds)...")
        try:
            # train.py is at /app/models/train.py
            subprocess.run(["python", "/app/models/train.py"], check=True, cwd="/app")
            print("   ✅ Models trained successfully.")
        except Exception as e:
             print(f"   ❌ Failed to train models: {e}")
             raise

    load_ml_models()
    STARTUP_COMPLETE = True
    print("✅ API ready!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("🛑 Shutting down API...")

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Insider Threat Detection API", "version": "1.0.0"}

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return generate_latest()

# Simple healthcheck to support frontend dashboard
@app.get("/api/health")
async def health(response: Response):
    """Healthcheck endpoint for dashboard."""
    if not STARTUP_COMPLETE:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "starting", "detail": "ML models loading"}
    return {"status": "ok"}

# Minimal incidents endpoint to avoid 404s on the dashboard

@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard statistics with dynamic threat level calculation."""
    import math
    
    # Efficient counting
    total_alerts = db.query(Alert).count()
    monitored_users = db.query(MonitoredUser).count()
    
    # Count incidents by status
    open_incidents = db.query(Incident).filter(Incident.status == "open").count()
    investigating_incidents = db.query(Incident).filter(Incident.status == "investigating").count()
    contained_incidents = db.query(Incident).filter(Incident.status == "contained").count()
    
    # Active incidents = open + investigating
    active_incidents = open_incidents + investigating_incidents
    
    # Get closed incident IDs to exclude their alerts
    closed_incident_ids = [i.id for i in db.query(Incident.id).filter(Incident.status == "closed").all()]
    
    # Get recent alerts (last 60 minutes) not linked to closed incidents
    now = datetime.utcnow()
    recent_alerts_query = db.query(Alert).filter(
        Alert.timestamp >= now - timedelta(minutes=60)
    )
    if closed_incident_ids:
        recent_alerts_query = recent_alerts_query.filter(
            ~Alert.incident_id.in_(closed_incident_ids)
        )
    recent_alerts = recent_alerts_query.all()
    
    # Calculate threat contribution from alerts with time decay
    alert_threat = 0.0
    for alert in recent_alerts:
        # Base score by threat level
        base_score = {
            "critical": 0.25,
            "high": 0.15,
            "medium": 0.08,
            "low": 0.03
        }.get(alert.threat_level, 0.05)
        
        # Time decay: exp(-minutes_since / 30)
        minutes_since = (now - alert.timestamp).total_seconds() / 60
        decay = math.exp(-minutes_since / 30)
        
        # Check if alert is from simulation (if field exists)
        is_simulated = getattr(alert, 'is_simulated', False) or False
        sim_weight = 0.5 if is_simulated else 1.0
        
        alert_threat += base_score * decay * sim_weight
    
    # Calculate threat contribution from incidents by status
    incident_threat = (
        open_incidents * 0.15 +           # Full weight
        investigating_incidents * 0.10 +   # 0.7 weight (15 * 0.7 ≈ 10)
        contained_incidents * 0.05         # 0.3 weight (15 * 0.3 ≈ 5)
    )
    
    # Combine threats
    raw_threat = alert_threat + incident_threat
    
    # Apply safety caps
    if open_incidents == 0 and investigating_incidents == 0:
        # No active incidents - cap threat at 35%
        threat_level = min(0.35, raw_threat)
    else:
        threat_level = raw_threat
    
    # If no recent alerts at all, set baseline
    if len(recent_alerts) == 0 and open_incidents == 0:
        threat_level = 0.1
    
    # Normalize between 0.0 and 1.0
    threat_level = max(0.0, min(1.0, threat_level))
    
    return StatsResponse(
        total_alerts=total_alerts,
        active_incidents=active_incidents,
        monitored_users=monitored_users,
        system_status="healthy" if STARTUP_COMPLETE else "degraded",
        threat_level=round(threat_level, 2)
    )

@app.get("/api/incidents", response_model=List[IncidentResponse])
async def get_incidents(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get incidents."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    return query.order_by(Incident.updated_at.desc()).all()

@app.get("/api/incidents/{incident_id}", response_model=IncidentDetailResponse)
async def get_incident_detail(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get full incident details with alerts and activity log."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return IncidentDetailResponse(
        incident=incident,
        alerts=incident.alerts,
        activities=incident.activities
    )



@app.patch("/api/incidents/{incident_id}/status", response_model=IncidentResponse)
async def update_incident_status(
    incident_id: int,
    update: IncidentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update incident status and log activity."""
    # Normalize status to lowercase
    new_status = update.status.lower().strip()
    
    # Validate allowed statuses
    allowed_statuses = {"open", "investigating", "contained", "closed"}
    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status '{new_status}'. Allowed: {', '.join(allowed_statuses)}"
        )
    
    try:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Update status
        old_status = incident.status
        incident.status = new_status
        incident.updated_at = datetime.utcnow()
        
        # Log activity to timeline
        activity = IncidentActivity(
            incident_id=incident.id,
            action="status_change",
            analyst_id=current_user.username,
            details=f"Status changed from {old_status} to {new_status}. Comment: {update.comment or 'None'}",
            timestamp=datetime.utcnow()
        )
        
        db.add(activity)
        db.commit()
        db.refresh(incident)
        
        return incident
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        db.rollback()
        print(f"Error updating incident status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update incident status")

@app.get("/api/timeline", response_model=List[Dict[str, Any]])
async def get_overall_timeline(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated timeline of all system activity (Events + Incident Activities).
    Useful for forensic overview.
    """
    # 1. Fetch recent events
    events = db.query(Event).order_by(Event.timestamp.desc()).limit(limit).all()
    
    # 2. Fetch recent incident activities
    activities = db.query(IncidentActivity).order_by(IncidentActivity.timestamp.desc()).limit(limit).all()
    
    timeline = []
    
    for e in events:
        timeline.append({
            "type": "event",
            "timestamp": e.timestamp,
            "details": f"{e.event_type} by {e.user_id}",
            "metadata": {"src_ip": e.src_ip, "success": e.success}
        })
        
    for a in activities:
        timeline.append({
            "type": "analyst_activity",
            "timestamp": a.timestamp,
            "details": f"{a.action} by {a.analyst_id}",
            "metadata": {"details": a.details, "incident_id": a.incident_id}
        })
        
    # Sort combined list
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return timeline[:limit]


from fastapi import WebSocket, WebSocketDisconnect

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting message: {e}")
                
ws_manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Just keep connection alive, we primarily push data
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/api/simulate/scenarios")
async def get_simulation_scenarios(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get available attack simulation scenarios (Admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    sim = Simulator(db)
    return sim.get_scenarios()

@app.post("/api/simulate/attack")
async def run_simulation(
    scenario_id: str = Body(..., embed=True), 
    target_user: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Run an attack simulation (Admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    sim = Simulator(db, ws_manager)
    try:
        result = await sim.run_simulation(scenario_id, target_user)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/auth/login").inc()
    
    print(f"Login attempt for username: {form_data.username}")
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        print(f"Authentication failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Authentication successful for username: {form_data.username}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/events/ingest")
async def ingest_event(event: EventInput, db: Session = Depends(get_db)):
    """Ingest a security event and store in database."""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/events/ingest").inc()
    
    # Create event record
    db_event = Event(
        timestamp=event.timestamp,
        user_id=event.user_id,
        event_type=event.event_type,
        src_ip=event.src_ip,
        dst_ip=event.dst_ip,
        bytes_transferred=event.bytes_transferred,
        file_name=event.file_name,
        process=event.process,
        device=event.device,
        success=event.success,
        geo_country=event.geo_country
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return {"event_id": db_event.id, "status": "ingested"}

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_threat(event: EventInput, db: Session = Depends(get_db)):
    """Predict threat level for an event using ML ensemble."""
    REQUEST_COUNT.labels(method="POST", endpoint="/api/predict").inc()
    
    if not all([rf_model, xgb_model, scaler]):
        raise HTTPException(status_code=500, detail="ML models not loaded")
    
    # Convert event to DataFrame for feature engineering
    event_df = pd.DataFrame([{
        'timestamp': event.timestamp,
        'user_id': event.user_id,
        'src_ip': event.src_ip,
        'dst_ip': event.dst_ip,
        'event_type': event.event_type,
        'file_name': event.file_name or '',
        'bytes_transferred': event.bytes_transferred,
        'geo_country': event.geo_country or 'US'
    }])
    
    # Compute features
    features_df = feature_engineer.compute_batch_features(event_df)
    feature_cols = [
        'login_count_1h', 'failed_login_rate_1h', 'bytes_transferred_1h',
        'unique_dst_ips_1h', 'unique_files_24h', 'off_hours_ratio_24h',
        'privilege_change_flag', 'geo_anomaly_score', 'dst_ip_entropy_1h'
    ]
    
    X = features_df[feature_cols].fillna(0).values
    X_scaled = scaler.transform(X)
    
    # Ensemble prediction
    rf_prob = rf_model.predict_proba(X_scaled)[:, 1]
    xgb_prob = xgb_model.predict_proba(X_scaled)[:, 1]
    ensemble_score = (rf_prob + xgb_prob) / 2
    
    threat_score = float(ensemble_score[0])
    threat_level = get_threat_level(threat_score)
    is_malicious = threat_score >= THRESHOLD_MEDIUM
    
    # Map to MITRE ATT&CK
    mitre_tactic, mitre_technique = map_to_mitre("apt", event.event_type)
    
    # Create alert if threshold exceeded
    alert_id = None
    if is_malicious:
        alert = Alert(
            timestamp=event.timestamp,
            user_id=event.user_id,
            threat_score=threat_score,
            threat_level=threat_level,
            mitre_tactic=mitre_tactic,
            mitre_technique=mitre_technique,
            description=f"Threat detected: {event.event_type}"
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        alert_id = alert.id
        
        PREDICTION_COUNT.labels(threat_level=threat_level).inc()
    
    return PredictionResponse(
        threat_score=threat_score,
        threat_level=threat_level,
        is_malicious=is_malicious,
        mitre_tactic=mitre_tactic,
        mitre_technique=mitre_technique
    )

@app.get("/api/alerts/recent", response_model=List[AlertResponse])
async def get_recent_alerts(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent security alerts."""
    REQUEST_COUNT.labels(method="GET", endpoint="/api/alerts/recent").inc()
    
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
    
    return [
        AlertResponse(
            id=alert.id,
            timestamp=alert.timestamp,
            user_id=alert.user_id,
            threat_score=alert.threat_score,
            threat_level=alert.threat_level,
            mitre_tactic=alert.mitre_tactic,
            mitre_technique=alert.mitre_technique,
            description=alert.description
        )
        for alert in alerts
    ]

@app.get("/api/alerts/{alert_id}/explain", response_model=AlertExplainResponse)
async def explain_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explain why an alert was flagged.
    Returns feature contributions and a plain-English narrative.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # In a real system, we would retrieve the specific feature values for this event.
    # For now, we use the global feature importance of the Random Forest model
    # combined with the alert's specific attributes to generate a narrative.
    
    feature_contributions = {}
    narrative = f"This alert was flagged as {alert.threat_level.upper()} threat (Score: {alert.threat_score:.2f})."
    
    if rf_model:
        importances = rf_model.feature_importances_
        # Feature names from training
        feature_cols = [
            'login_count_1h', 'failed_login_rate_1h', 'bytes_transferred_1h',
            'unique_dst_ips_1h', 'unique_files_24h', 'off_hours_ratio_24h',
            'privilege_change_flag', 'geo_anomaly_score', 'dst_ip_entropy_1h'
        ]
        
        # Zip and sort
        feats = sorted(zip(feature_cols, importances), key=lambda x: x[1], reverse=True)
        
        # Take top 3
        top_features = feats[:3]
        feature_contributions = {k: float(v) for k, v in top_features}
        
        # Build dynamic narrative
        narrative += " Key contributing factors based on the AI model include:\n"
        
        explanations = {
            'login_count_1h': "unusually high login frequency",
            'failed_login_rate_1h': "excessive failed login attempts",
            'bytes_transferred_1h': "large volume of data transfer",
            'unique_dst_ips_1h': "connections to multiple unique destinations",
            'unique_files_24h': "accessing a high number of unique files",
            'off_hours_ratio_24h': "activity during non-business hours",
            'privilege_change_flag': "recent privilege escalation",
            'geo_anomaly_score': "access from an unusual location",
            'dst_ip_entropy_1h': "dispersed network connections"
        }
        
        reasons = []
        for name, score in top_features:
            desc = explanations.get(name, name.replace('_', ' '))
            reasons.append(f"- {desc} (Importance: {score:.2f})")
            
        narrative += "\n".join(reasons)
    else:
        narrative += " Detailed AI explanation is currently unavailable (Model not loaded)."
        
    return AlertExplainResponse(
        alert_id=alert.id,
        feature_contributions=feature_contributions,
        narrative=narrative
    )

@app.get("/api/users/{user_id}/timeline", response_model=UserTimelineResponse)
async def get_user_timeline(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user activity timeline with events and alerts."""
    REQUEST_COUNT.labels(method="GET", endpoint="/api/users/{user_id}/timeline").inc()
    
    # Get events
    events = db.query(Event).filter(Event.user_id == user_id).order_by(Event.timestamp.desc()).limit(100).all()
    
    # Get alerts
    alerts = db.query(Alert).filter(Alert.user_id == user_id).order_by(Alert.timestamp.desc()).limit(50).all()
    
    return UserTimelineResponse(
        user_id=user_id,
        total_events=len(events),
        total_alerts=len(alerts),
        events=[{
            "timestamp": event.timestamp,
            "event_type": event.event_type,
            "src_ip": event.src_ip,
            "success": event.success
        } for event in events],
        alerts=[{
            "timestamp": alert.timestamp,
            "threat_score": alert.threat_score,
            "threat_level": alert.threat_level,
            "description": alert.description
        } for alert in alerts]
    )

@app.get("/api/users", response_model=List[UserOut])
async def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all users."""
    users = db.query(User).all()
    return [
        UserOut(username=u.username, email=u.email, role=u.role) for u in users
    ]

@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user notifications (mocked from alerts for now)."""
    # Reuse alerts as notifications for simplicity as per requirements
    alerts = db.query(Alert).filter(Alert.user_id == current_user.username).order_by(Alert.timestamp.desc()).limit(10).all()
    
    return [
        NotificationResponse(
            id=a.id,
            timestamp=a.timestamp,
            message=a.description or "Security Alert",
            type="alert",
            read=False
        ) for a in alerts
    ]
@app.get("/api/auth/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserOut(
        username=current_user.username,
        email=current_user.email,
        role=current_user.role
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
