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


class UserTimelineResponse(BaseModel):
    user_id: str
    total_events: int
    total_alerts: int
    events: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    username: Optional[str] = None

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True
