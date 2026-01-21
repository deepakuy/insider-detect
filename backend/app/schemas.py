from __future__ import annotations

from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel


class EventInput(BaseModel):
    timestamp: datetime
    user_id: str
    src_ip: str
    dst_ip: Optional[str] = ""
    event_type: str
    file_name: Optional[str] = None
    bytes_transferred: Optional[int] = 0
    process: Optional[str] = None
    device: Optional[str] = None
    success: Optional[bool] = True
    geo_country: Optional[str] = None

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    threat_score: float
    threat_level: str
    is_malicious: bool
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    user_id: str
    threat_score: float
    threat_level: str
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class AlertExplainResponse(BaseModel):
    alert_id: int
    feature_contributions: Dict[str, float]
    narrative: str

    class Config:
        from_attributes = True


class UserTimelineResponse(BaseModel):
    user_id: str
    total_events: int
    total_alerts: int
    events: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]]

    class Config:
        from_attributes = True



class UserOut(BaseModel):
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True



class NotificationResponse(BaseModel):
    id: int
    timestamp: datetime
    message: str
    type: str
    read: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    username: Optional[str] = None

    class Config:
        from_attributes = True




class StatsResponse(BaseModel):
    total_alerts: int
    active_incidents: int
    monitored_users: int
    system_status: str
    threat_level: float

    class Config:
        from_attributes = True


class IncidentResponse(BaseModel):
    id: int
    incident_number: str
    user_id: str
    start_time: datetime
    end_time: Optional[datetime]
    severity: str
    status: str
    narrative: Optional[str]
    assigned_to: Optional[str]

    class Config:
        from_attributes = True


class IncidentActivityResponse(BaseModel):
    id: int
    incident_id: int
    action: str
    analyst_id: Optional[str]
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class IncidentDetailResponse(BaseModel):
    incident: IncidentResponse
    alerts: List[AlertResponse]
    activities: List[IncidentActivityResponse]

    class Config:
        from_attributes = True


class IncidentStatusUpdate(BaseModel):
    status: str  # open, investigating, contained, closed
    comment: Optional[str] = None
