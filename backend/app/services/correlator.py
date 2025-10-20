"""
Alert correlation and incident creation services.

This module provides the `AlertCorrelator` class that can:
- Correlate alerts for the same user within a time window
- Create an incident from a set of related alerts
- Generate a human-readable narrative describing the attack sequence

It relies on SQLAlchemy ORM models defined in `backend/app/database/models.py`.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..database.models import Alert, Incident


THREAT_SEVERITY_ORDER = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


class AlertCorrelator:
    """Correlates alerts into incidents using simple temporal and user-based grouping."""

    def correlate_alerts(
        self,
        db_session: Session,
        user_id: str,
        time_window_minutes: int = 60,
    ) -> Optional[Incident]:
        """
        Find alerts for the same user within a time window and create an Incident.

        - Select alerts for the given user that occurred within the rolling window
          (now - time_window_minutes, now], prioritizing unassigned alerts.
        - Build an attack chain and narrative
        - Persist a new `Incident` and associate included alerts

        Returns the created `Incident` or None if no alerts were found.
        """

        window_end = datetime.utcnow()
        window_start = window_end - timedelta(minutes=time_window_minutes)

        alerts: List[Alert] = (
            db_session.query(Alert)
            .filter(
                and_(
                    Alert.user_id == user_id,
                    Alert.timestamp >= window_start,
                    Alert.timestamp <= window_end,
                )
            )
            .order_by(Alert.timestamp.asc())
            .all()
        )

        if not alerts:
            return None

        incident = self.create_incident(db_session, alerts)
        return incident

    def create_incident(self, db_session: Session, alerts: List[Alert]) -> Incident:
        """
        Create an Incident record from a list of alerts.

        - incident_number: INC-{YYYYMMDDHHMMSS}-{user_id}
        - severity: max of alert threat_levels
        - attack_chain: list of {stage, tactic, technique, timestamp}
        - narrative: auto-generated description based on MITRE fields and timing
        - status: 'open'
        - Associate alerts with the created incident
        """

        if not alerts:
            raise ValueError("create_incident requires at least one alert")

        # Ensure alerts are sorted chronologically
        alerts_sorted = sorted(alerts, key=lambda a: a.timestamp or datetime.utcnow())

        user_id = alerts_sorted[0].user_id
        start_time = alerts_sorted[0].timestamp
        end_time = alerts_sorted[-1].timestamp

        # Determine highest severity
        max_severity = "low"
        for a in alerts_sorted:
            if a.threat_level and THREAT_SEVERITY_ORDER.get(a.threat_level, 0) > THREAT_SEVERITY_ORDER.get(max_severity, 0):
                max_severity = a.threat_level

        # Build attack chain from MITRE mapping present in alerts
        attack_chain: List[Dict[str, Any]] = []
        for a in alerts_sorted:
            attack_chain.append(
                {
                    "stage": self.map_attack_stage(a.mitre_tactic),
                    "tactic": a.mitre_tactic,
                    "technique": a.mitre_technique,
                    "timestamp": (a.timestamp or datetime.utcnow()).isoformat(),
                }
            )

        # Generate narrative
        narrative = self.generate_narrative(alerts_sorted)

        # Generate incident number
        ts_part = (start_time or datetime.utcnow()).strftime("%Y%m%d%H%M%S")
        incident_number = f"INC-{ts_part}-{user_id}"

        incident = Incident(
            incident_number=incident_number,
            user_id=user_id,
            start_time=start_time or datetime.utcnow(),
            end_time=end_time,
            severity=max_severity,
            status="open",
            attack_chain=attack_chain,
            narrative=narrative,
            assigned_to=None,
            resolution_notes=None,
            false_positive=False,
        )

        db_session.add(incident)
        db_session.flush()  # to get incident.id

        # Link alerts to incident
        for a in alerts_sorted:
            a.incident_id = incident.id
        db_session.commit()

        # Refresh relationships
        db_session.refresh(incident)
        return incident

    def generate_narrative(self, alerts: List[Alert]) -> str:
        """
        Create a human-readable narrative describing the attack sequence.
        """

        if not alerts:
            return "No alerts to generate narrative."

        user_id = alerts[0].user_id
        start = alerts[0].timestamp.strftime("%Y-%m-%d %H:%M:%S") if alerts[0].timestamp else "unknown time"
        steps: List[str] = []

        for a in alerts:
            ts = a.timestamp.strftime("%H:%M:%S") if a.timestamp else "unknown time"
            stage = self.map_attack_stage(a.mitre_tactic)
            tactic = a.mitre_tactic or "Unknown Tactic"
            technique = a.mitre_technique or "Unknown Technique"
            steps.append(f"[{ts}] {stage}: {tactic} ({technique}) with score {a.threat_score:.2f}")

        narrative = (
            f"Potential attack sequence detected for user '{user_id}' starting {start}. "
            f"Correlated {len(alerts)} alerts in temporal proximity.\n"
            + "\n".join(steps)
        )
        return narrative

    def map_attack_stage(self, mitre_tactic: Optional[str]) -> str:
        """
        Map a MITRE tactic name to a generalized kill chain stage.
        """

        if not mitre_tactic:
            return "Unknown"

        tactic = mitre_tactic.lower()
        if "initial access" in tactic:
            return "Initial Access"
        if "execution" in tactic:
            return "Execution"
        if "persistence" in tactic:
            return "Persistence"
        if "privilege escalation" in tactic:
            return "Privilege Escalation"
        if "defense evasion" in tactic:
            return "Defense Evasion"
        if "credential access" in tactic:
            return "Credential Access"
        if "discovery" in tactic:
            return "Discovery"
        if "lateral movement" in tactic:
            return "Lateral Movement"
        if "collection" in tactic:
            return "Collection"
        if "exfiltration" in tactic:
            return "Exfiltration"
        if "command and control" in tactic or "c2" in tactic:
            return "Command & Control"
        return "Other"


