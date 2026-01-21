# Threat Model

## 1. Introduction
This document defines the threat landscape addressed by the Insider Threat Detection System. It outlines the types of adversaries, their capabilities, and the system's assumptions and limitations.

## 2. Adversary Categories (Insiders)

We classify insider threats into three primary categories:

### 2.1 The Malicious Insider (The "Turncoat")
- **Profile**: A disgruntled employee or contractor seeking to cause harm or steal data for personal gain or espionage.
- **Goal**: Data exfiltration, sabotage, or unauthorized privilege escalation.
- **Capabilities**:
  - Valid credentials and legitimate access to systems.
  - Knowledge of internal workflows.
  - Ability to blend in with normal traffic.
- **Detection Strategy**: Behavioral anomaly detection (deviation from baseline), specific signature detection (bulk export during off-hours).

### 2.2 The Negligent Insider (The "Oops" Factor)
- **Profile**: A well-intentioned employee who bypasses security policies for convenience or by accident.
- **Goal**: Get work done (speed/efficiency), not harm.
- **Capabilities**: Valid access.
- **Examples**: Storing sensitive data on personal cloud drives, clicking phishing links, sharing passwords.
- **Detection Strategy**: Policy violation rules (e.g., using unapproved devices), outlier detection in data movement.

### 2.3 The Compromised Insider (The "Puppet")
- **Profile**: Account credentials stolen by an external attacker (e.g., via phishing).
- **Goal**: External attacker's goals (masked as the user).
- **Capabilities**: Limited by the compromised account's privileges initially; seeks lateral movement.
- **Detection Strategy**: Sudden changes in behavioral patterns (geo-location anomalies, accessing new systems, unusual working hours).

## 3. Assumptions

- **Log Integrity**: We assume logs ingested from the SIEM/endpoints are trusted and have not been tampered with *before* ingestion.
- **Baseline Validity**: The system requires a burn-in period (e.g., 30 days) to establish valid user baselines.
- **Attribution**: Activity associated with a User ID is performed by that user (unless compromised).

## 4. Adversary Capabilities

- **Privileged Access**: Admins may potentially delete logs to cover tracks. (Mitigation: Immutable log storage - *out of scope for ML model, but required for system*).
- **Slow and Low**: Sophisticated insiders may exfiltrate data in small chunks over months to avoid volume-based triggers.
- **Knowledge of Defense**: Insiders may know the thresholds (e.g., "I can download 10 files without alert").

## 5. System Limitations

- **Encrypted Traffic**: The system looks at metadata (file size, timestamp, source/dest), not the content of encrypted external traffic.
- **False Positives**: Behavioral anomalies can be benign (e.g., crunch time, urgent projects). Human verification is required.
- **Cold Start**: New users will generate higher alert rates until a baseline is established.
