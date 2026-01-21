# 🛡️ Insider Threat Detection & Investigation Platform

An **enterprise-grade Insider Threat Detection and SOC Investigation platform** that goes beyond simple alerting to provide end-to-end detection, investigation, and response workflows, inspired by real-world Security Operations Centers (SOC).

> 🚀 **Built to demonstrate ML-driven detection, MITRE ATT&CK–aligned attack simulation, and analyst-centric investigation workflows.**

---

## 📌 Key Highlights

| Feature | Description |
|---------|-------------|
| ✅ **ML-Powered Detection** | Machine Learning–based insider threat detection |
| ✅ **MITRE ATT&CK Mapped** | Attack simulation aligned with ATT&CK framework |
| ✅ **Real-Time Streaming** | Live alerts & incidents via WebSockets |
| ✅ **SOC Workflows** | Full investigation lifecycle management |
| ✅ **Audit Trail** | Incident timelines & analyst action logging |
| ✅ **Zero Setup** | Dockerized, self-healing, demo-ready system |

---

## 🧠 System Architecture

```
┌─────────────────┐
│    Frontend     │  React + Vite + TailwindCSS
│   (Dashboard)   │
└────────▲────────┘
         │ REST + WebSocket
┌────────┴────────┐
│    Backend      │  FastAPI + JWT Auth
│   (SOC Logic)   │
└────────▲────────┘
         │
┌────────┴────────┐
│  PostgreSQL DB  │  Users, Alerts, Incidents, Timeline
└────────▲────────┘
         │
┌────────┴────────┐
│   ML Engine     │  Random Forest + XGBoost
│ (Auto-Training) │
└─────────────────┘
```

---

## 🔍 Core Capabilities

### 1️⃣ Threat Detection (ML-Driven)

- **Random Forest & XGBoost** ensemble models
- Synthetic enterprise activity dataset for training
- **Automatic training on first startup** — no pre-trained models required
- Global system threat level + per-user risk scoring
- Time-decayed alert weighting for realistic threat assessment

### 2️⃣ Attack Simulation Engine

Admins can simulate realistic insider attack scenarios:

| Scenario | MITRE Technique |
|----------|-----------------|
| Data Exfiltration | T1041 |
| Suspicious File Access | T1083 |
| Abnormal Network Activity | T1071 |
| Privilege Misuse | T1078 |

Each simulation:
- ⚡ Generates severity-tagged alerts
- 📋 Creates linked incidents automatically
- 📈 Updates global threat level in real-time
- 🔴 Streams events live to the dashboard via WebSocket

### 3️⃣ Real-Time Alerts & Incidents

- **WebSocket-based** live alert feed
- Severity levels: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- Automatic incident correlation
- **MITRE ATT&CK** technique tagging on alerts

### 4️⃣ Incident Investigation Workflow (SOC-Grade)

Each incident provides:

| Feature | Description |
|---------|-------------|
| 📄 Incident Detail View | Full metadata and narrative |
| 🔗 Linked Alerts | All related alerts in one place |
| 📜 Event Timeline | Chronological forensic view |
| 👤 Analyst Action Tracking | Who did what and when |
| 🎯 MITRE ATT&CK Panel | Technique explanations |

**Incident Status Lifecycle:**

```
OPEN → INVESTIGATING → CONTAINED → CLOSED
```

All status transitions are logged and visible in the timeline.

### 5️⃣ Timeline & Analyst Actions

Forensic-style event timeline including:

- 🚨 Alerts triggered
- 🔄 Status changes
- 💬 Analyst comments
- 🎮 Simulation events

Provides a clear narrative of **"what happened and why"**.

### 6️⃣ User Risk Profiling

- User directory with roles (Admin / Analyst)
- Per-user risk score calculation
- Total events & alerts per user
- User-specific timeline & investigation pages

---

## 🖥️ Dashboard Features

| Metric | Description |
|--------|-------------|
| 📊 Total Alerts | Cumulative alert count |
| 🔥 Active Incidents | Open + Investigating incidents |
| 👥 Monitored Users | Enterprise users under watch |
| 💚 System Health | Backend connectivity status |
| 🎚️ Global Threat Gauge | Dynamic threat level (0-100%) |
| 📡 Live Alerts Feed | Real-time WebSocket stream |
| 👤 User Risk Panel | Quick user lookup |
| ⚡ Simulate Attack | Admin-only attack trigger |

---

## 🔐 Authentication & Roles

| Role | Capabilities |
|------|--------------|
| **Admin** | Simulate attacks, manage users, investigate incidents |
| **Analyst** | Investigate incidents, update status, review timelines |

### Default Credentials

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `analyst` | `analyst123` | Analyst |

> 📌 Additional Indian enterprise users are automatically seeded on startup.

---

## 🧪 Self-Healing Design

The system is designed to **work immediately after cloning** with zero manual setup.

On backend startup:
- ✅ Creates database tables if missing
- ✅ Seeds default users (admin, analyst)
- ✅ Seeds Indian enterprise demo users
- ✅ Generates synthetic training data if missing
- ✅ Trains ML models if not cached
- ✅ Loads models automatically

**No manual steps required.**

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

### Run the System

```bash
# Optional: clean start (removes previous data)
docker compose down -v

# Build and run
docker compose up --build
```

### Access Points

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:8000 |
| 📊 API Docs | http://localhost:8000/docs |

---

## 🧪 Demo Walkthrough

**Recommended order for evaluation:**

1. **Login** as `admin` / `admin123`
2. Open **Dashboard**
3. Click **Simulate Attack** (top right)
4. Observe:
   - Live alerts appearing
   - Incident auto-creation
   - Threat gauge rising
5. Navigate to **Incidents** page
6. Click on an incident → **View Details**
7. Click **Start Investigation**
8. Click **Contain Incident**
9. Click **Close Incident**
10. Review **Timeline** updates showing all actions

---

## 🧩 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Framer Motion | Animations |
| Recharts | Data Visualization |
| WebSocket | Real-time updates |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | API Framework |
| SQLAlchemy | ORM |
| PostgreSQL | Database |
| Redis | Caching |
| JWT | Authentication |
| WebSocket | Live streaming |

### ML & Data
| Technology | Purpose |
|------------|---------|
| Scikit-learn | Random Forest |
| XGBoost | Gradient Boosting |
| Joblib | Model persistence |
| Pandas | Data processing |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| Health Checks | Auto-recovery |

---

## 🎯 Educational Value

This project demonstrates proficiency in:

| Domain | Skills |
|--------|--------|
| 🤖 **Machine Learning** | Applied ML, ensemble models, feature engineering |
| 🔒 **Cybersecurity** | Insider threats, MITRE ATT&CK, SOC workflows |
| 🏗️ **Full-Stack** | React, FastAPI, PostgreSQL, WebSockets |
| 📊 **Real-Time Systems** | WebSocket streaming, live dashboards |
| 🐳 **DevOps** | Docker, compose, health checks, self-healing |

> **This is not just a detection system — it is an investigation platform.**

---

## 📌 Project Status

| Status | |
|--------|---|
| ✅ **Complete** | All features implemented |
| ✅ **Stable** | Production-ready code |
| ✅ **Demo-Ready** | Works out of the box |
| ✅ **Viva-Ready** | Full documentation |

**No additional features are required for evaluation.**

---

## 📸 Screenshots

*Screenshots can be added here showing:*
- Dashboard with threat gauge
- Incident investigation page
- Timeline view
- Attack simulation modal

---

## 👨‍💻 Author

**Deepak Yaliwal**

*Insider Threat Detection & SOC Platform Project*

---

## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">
  <b>🛡️ Detect. Investigate. Respond. 🛡️</b>
</p>
