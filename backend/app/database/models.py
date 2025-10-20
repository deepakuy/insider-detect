from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """Dashboard users (analysts, admins)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="analyst")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)


class MonitoredUser(Base):
    """Users being monitored for threats"""
    __tablename__ = "monitored_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, nullable=False, index=True)
    user_role = Column(String(50))
    department = Column(String(100))
    risk_score = Column(Float, default=0.0)
    last_activity = Column(DateTime)
    baseline_profile = Column(JSON)
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("Event", back_populates="monitored_user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="monitored_user", cascade="all, delete-orphan")


class Event(Base):
    """Raw security events (logs)"""
    __tablename__ = "events"
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_event_type_timestamp', 'event_type', 'timestamp'),
    )

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("monitored_users.user_id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    src_ip = Column(String(45))
    dst_ip = Column(String(45))
    bytes_transferred = Column(Integer, default=0)
    file_name = Column(String(500))
    process = Column(String(255))
    device = Column(String(100))
    success = Column(Boolean, default=True)
    geo_country = Column(String(10))
    session_id = Column(String(100))
    auth_method = Column(String(50))
    user_role = Column(String(50))
    is_admin = Column(Boolean, default=False)
    raw_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    monitored_user = relationship("MonitoredUser", back_populates="events")


class Alert(Base):
    """Machine learning generated security alerts"""
    __tablename__ = "alerts"
    __table_args__ = (
        Index('idx_alert_user_time', 'user_id', 'timestamp'),
    )

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("monitored_users.user_id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    threat_score = Column(Float, nullable=False)
    threat_level = Column(String(20), nullable=False, index=True)
    threat_type = Column(String(50))
    mitre_tactic = Column(String(100))
    mitre_technique = Column(String(100))
    mitre_tactic_id = Column(String(20))
    mitre_technique_id = Column(String(20))
    description = Column(Text)
    features_snapshot = Column(JSON)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(50))
    acknowledged_at = Column(DateTime)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    monitored_user = relationship("MonitoredUser", back_populates="alerts")
    incident = relationship("Incident", back_populates="alerts")


class Incident(Base):
    """Correlated alerts forming attack chains"""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), default="open", index=True)
    attack_chain = Column(JSON)
    narrative = Column(Text)
    assigned_to = Column(String(50))
    resolution_notes = Column(Text)
    false_positive = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alerts = relationship("Alert", back_populates="incident")


class MITREMapping(Base):
    """MITRE ATT&CK framework reference"""
    __tablename__ = "mitre_mappings"

    id = Column(Integer, primary_key=True, index=True)
    tactic_id = Column(String(20), nullable=False, index=True)
    tactic_name = Column(String(100), nullable=False)
    technique_id = Column(String(20), nullable=False, index=True)
    technique_name = Column(String(100), nullable=False)
    description = Column(Text)
    detection_pattern = Column(JSON)
