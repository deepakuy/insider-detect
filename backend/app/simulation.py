
import random
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database.models import User, Event, Alert, Incident, MonitoredUser

class AttackScenario:
    def __init__(self, id: str, name: str, description: str, severity: str, mitre_tactic: str, mitre_technique: str, steps: List[Dict[str, Any]]):
        self.id = id
        self.name = name
        self.description = description
        self.severity = severity
        self.mitre_tactic = mitre_tactic
        self.mitre_technique = mitre_technique
        self.steps = steps

class Simulator:
    def __init__(self, db: Session, ws_manager: Any = None):
        self.db = db
        self.ws_manager = ws_manager
        self.scenarios = self._load_scenarios()

    def _load_scenarios(self) -> Dict[str, AttackScenario]:
        return {
            "credential_dumping": AttackScenario(
                id="credential_dumping",
                name="Credential Dumping (T1003)",
                description="Attacker attempts to dump credentials from memory (LSASS) or registry.",
                severity="critical",
                mitre_tactic="Credential Access",
                mitre_technique="T1003",
                steps=[
                    {"type": "process_start", "process": "mimikatz.exe", "count": 1, "delay_min": 1},
                    {"type": "file_access", "file_name": "lsass.dmp", "count": 1, "delay_min": 2},
                    {"type": "registry_access", "key": "HKLM\\SAM", "count": 5, "delay_min": 3}
                ]
            ),
            "privilege_escalation": AttackScenario(
                id="privilege_escalation",
                name="Privilege Escalation (T1068)",
                description="User exploits a vulnerability to gain elevated privileges.",
                severity="high",
                mitre_tactic="Privilege Escalation",
                mitre_technique="T1068",
                steps=[
                    {"type": "process_start", "process": "whoami.exe", "args": "/priv", "count": 2, "delay_min": 1},
                    {"type": "file_exec", "file_name": "exploit_cve_2024.exe", "count": 1, "delay_min": 3},
                    {"type": "process_start", "process": "cmd.exe", "user": "SYSTEM", "count": 1, "delay_min": 5}
                ]
            ),
            "data_exfil": AttackScenario(
                id="data_exfil",
                name="Data Exfiltration (T1041)",
                description="Sensitive data is engaged and transferred to an external C2 server.",
                severity="critical",
                mitre_tactic="Exfiltration",
                mitre_technique="T1041",
                steps=[
                    {"type": "file_access", "file_type": "confidential", "count": 10, "delay_min": 1},
                    {"type": "archive_create", "file_name": "backup.zip", "count": 1, "delay_min": 5},
                    {"type": "network_connection", "dst_ip": "external_c2", "bytes": 500000000, "count": 1, "delay_min": 8}
                ]
            ),
            "lateral_movement": AttackScenario(
                id="lateral_movement",
                name="Lateral Movement (T1021)",
                description="Attacker moves from one compromised host to another via SMB/RDP.",
                severity="high",
                mitre_tactic="Lateral Movement",
                mitre_technique="T1021",
                steps=[
                    {"type": "network_scan", "dst_port": 445, "count": 20, "delay_min": 1},
                    {"type": "login_success", "auth_method": "SMB", "count": 1, "delay_min": 5},
                    {"type": "file_transfer", "file_name": "psexec.exe", "count": 1, "delay_min": 7}
                ]
            ),
            "insider_theft": AttackScenario(
                id="insider_theft",
                name="Insider Data Theft (T1081)",
                description="Disgruntled employee copies intellectual property to USB/Cloud.",
                severity="medium",
                mitre_tactic="Impact",
                mitre_technique="T1081",
                steps=[
                    {"type": "file_access", "file_type": "source_code", "count": 50, "delay_min": 1},
                    {"type": "usb_mount", "device": "USB_Storage", "count": 1, "delay_min": 10},
                    {"type": "file_copy", "dst": "E:\\", "count": 50, "delay_min": 15}
                ]
            )
        }

    def get_scenarios(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "severity": s.severity,
                "mitre_tactic": s.mitre_tactic,
                "mitre_technique": s.mitre_technique
            }
            for s in self.scenarios.values()
        ]

    async def broadcast(self, message: Dict[str, Any]):
        """Helper to broadcast messages if websocket manager is available."""
        if self.ws_manager:
            await self.ws_manager.broadcast(message)

    async def run_simulation(self, scenario_id: str, target_user: str):
        if scenario_id not in self.scenarios:
            raise ValueError(f"Unknown scenario: {scenario_id}")

        scenario = self.scenarios[scenario_id]
        print(f"🚀 Starting simulation: {scenario.name} on user {target_user}")
        
        # Broadcast start
        await self.broadcast({
            "type": "simulation_start", 
            "scenario": scenario.name, 
            "user": target_user,
            "timestamp": datetime.utcnow().isoformat()
        })

        # Ensure user exists as MonitoredUser
        monitored_user = self.db.query(MonitoredUser).filter(MonitoredUser.user_id == target_user).first()
        if not monitored_user:
            # Create dummy monitored user if needed for the simulation
            monitored_user = MonitoredUser(
                user_id=target_user,
                user_role="employee", 
                department="Engineering",
                risk_score=0.1
            )
            self.db.add(monitored_user)
            self.db.commit()

        base_time = datetime.utcnow()
        generated_alerts = []
        
        # Execute steps
        current_time = base_time
        
        # We process steps. Logic:
        # 1. Create Event
        # 2. "Score" it (simulate ML detection)
        # 3. Create Alert if high score
        # 4. Broadcast Event & Alert
        
        for step in scenario.steps:
            # Small artificial delay to let the frontend animate if we were running truly live,
            # but for API response we process fast. The timestamp, however, should reflect required delays.
            current_time += timedelta(minutes=step.get("delay_min", 1))
            
            count = step.get("count", 1)
            for i in range(count):
                # 1. Create Event
                event = Event(
                    timestamp=current_time + timedelta(seconds=i*5),
                    user_id=target_user,
                    event_type=step["type"],
                    src_ip="192.168.1.50",
                    dst_ip=step.get("dst_ip", "10.0.0.5"),
                    bytes_transferred=step.get("bytes", 1024),
                    file_name=step.get("file_name", ""),
                    process=step.get("process", ""),
                    device=step.get("device", ""),
                    geo_country="US",
                    success=True
                )
                self.db.add(event)
                self.db.commit()
                self.db.refresh(event)

                # Broadcast Event
                # await self.broadcast({"type": "new_event", "event": {...}}) # Optional, might differ too much noise

                # 2. Simulate ML Scoring & Alerting
                # In a real pipeline, we'd call predict(event). Here we deterministicly alert based on scenario steps.
                # All scenario steps are "malicious" by definition of the scenario, but we can vary threat scores.
                
                threat_score = 0.0
                if scenario.severity == "critical":
                    threat_score = random.uniform(0.85, 0.99)
                elif scenario.severity == "high":
                    threat_score = random.uniform(0.70, 0.84)
                elif scenario.severity == "medium":
                    threat_score = random.uniform(0.50, 0.69)
                
                # Check thresholds (using simple logic here matching main.py)
                threat_level = "low"
                if threat_score >= 0.85: threat_level = "critical"
                elif threat_score >= 0.70: threat_level = "high"
                elif threat_score >= 0.50: threat_level = "medium"

                if threat_level != "low":
                    alert = Alert(
                        timestamp=event.timestamp,
                        user_id=target_user,
                        event_id=event.id,
                        threat_score=threat_score,
                        threat_level=threat_level,
                        mitre_tactic=scenario.mitre_tactic,
                        mitre_technique=scenario.mitre_technique,
                        description=f"SIMULATED: {step['type']} - {scenario.name}"
                    )
                    self.db.add(alert)
                    self.db.commit()
                    self.db.refresh(alert)
                    generated_alerts.append(alert)

                    # Update User Risk Score
                    monitored_user.risk_score = min(100.0, monitored_user.risk_score + (threat_score * 10))
                    self.db.commit()

                    # Broadcast Alert
                    await self.broadcast({
                        "type": "new_alert", 
                        "alert": {
                            "id": alert.id,
                            "timestamp": alert.timestamp.isoformat(),
                            "threat_score": alert.threat_score,
                            "threat_level": alert.threat_level,
                            "description": alert.description,
                            "mitre_tactic": alert.mitre_tactic
                        }
                    })

        # 3. Create Incident if Escalated
        incident_created = False
        incident_id = None
        
        # Simple escalation policy: > 2 alerts = Incident
        if len(generated_alerts) >= 2:
            incident = Incident(
                incident_number=f"INC-{random.randint(10000,99999)}",
                user_id=target_user,
                start_time=base_time,
                end_time=current_time,
                severity=scenario.severity,
                status="open",
                narrative=f"Automated incident created via Simulation Engine. Scenario: {scenario.name}. Detected {len(generated_alerts)} malicious events.",
                assigned_to="admin"
            )
            self.db.add(incident)
            self.db.commit()
            self.db.refresh(incident)
            incident_id = incident.id
            incident_created = True
            
            print(f"   🚨 Incident created: {incident.incident_number}")
            
            # Broadcast Incident
            await self.broadcast({
                "type": "new_incident",
                "incident": {
                    "id": incident.id,
                    "number": incident.incident_number,
                    "severity": incident.severity,
                    "status": incident.status,
                    "narrative": incident.narrative
                }
            })

        print("✅ Simulation complete.")
        return {
            "status": "attack_simulated", 
            "incident_id": incident_id, 
            "alerts_created": len(generated_alerts), 
            "threat_level": 0.95 if incident_created else 0.5
        }
