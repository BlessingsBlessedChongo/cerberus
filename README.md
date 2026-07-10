# 🛡️ Cerberus

> **Three Heads. One Mission. Watch. Predict. Protect.**

Cerberus is a modular server monitoring and integrity verification platform designed for Windows environments. It combines **real-time system monitoring**, **predictive analytics**, **file integrity verification**, and an interactive dashboard into a single self-hosted solution.

Built as a capstone software engineering project demonstrating systems programming, cybersecurity, distributed software architecture, and full-stack development.

![C++](https://img.shields.io/badge/C++-17-blue.svg)
![Python](https://img.shields.io/badge/Python-3.12-yellow.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Java](https://img.shields.io/badge/Java-21-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

## 📸 Screenshots

| Dashboard | Analytics |
|------------|-----------|
| coming soon | coming soon |

| API | Sentinel |
|------|----------|
| coming soon | coming soon |

## ✨ Features

- 📊 Real-time CPU, RAM and Disk monitoring
- 🔐 User authentication and role management
- 📈 Historical performance analytics
- 🚨 Alert management
- 🧮 Statistical forecasting
- 🛡️ CRC32 file integrity verification
- 🌐 REST API
- 📱 Responsive React dashboard
- ⚡ Local-first architecture
- 🔒 Self-hosted (No cloud dependency)

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Windows 11 Host                      │
│                                                         │
│  ┌─────────────┐   writes metrics   ┌────────────────┐  │
│  │ Core Agent  │ ─────────────────► │  watchdog.log  │  │
│  │  (C++)      │                    │                │  │
│  └──────┬──────┘                    └───────┬────────┘  │
│         │ health endpoint (localhost:9000)  │           │
│         │                                   │           │
│         ▼                                   ▼           │
│  ┌─────────────┐   reads log     ┌─────────────────┐    │
│  │ Django API  │ ◄────────────── │  SQLite DB      │    │
│  │ (Python)    │   stores metrics│ (cerberus.db)   │    │
│  └──────┬──────┘                 └────────┬────────┘    │
│         │ REST (JSON)                     │             │
│         ▼                                 │             │
│  ┌──────────────────┐                     │             │
│  │ React Dashboard  │                     │             │
│  │ (JavaScript)     │                     │             │
│  └──────────────────┘                     │             │
│                                           │             │
│  ┌─────────────────────┐                  │             │
│  │ Spring Boot         │ ◄────────────────┘             │
│  │ Analytics Service   │  reads DB for historical data  │
│  │ (Java)              │  exposes /api/analytics/*      │
│  └─────────────────────┘                                │
│                                                         │
│  ┌─────────────────────┐                                │
│  │ Sentinel (C)        │  scheduled every 5 min         │
│  │ computes CRC32 of   │                                │
│  │ watchdog.log        │  if mismatch → alert + action  │
│  └─────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

## Components

### Core Agent (C++)

Responsible for:

- Collecting system metrics
- Writing watchdog logs
- Local HTTP health endpoint
- Multi-threaded execution

---

### API (Django)

Responsible for:

- Authentication
- Metric storage
- REST endpoints
- User management

---

### Dashboard (React)

Responsible for:

- Live charts
- Alert history
- Responsive UI

---

### Analytics (Spring Boot)

Responsible for:

- Trend prediction
- Moving averages
- Anomaly detection

---

### Sentinel (C)

Responsible for:

- CRC32 checksum generation
- Tamper detection
- Automatic response

## 🛠 Tech Stack

### Backend

- Django
- Django REST Framework
- SQLite

### Frontend

- React
- Chart.js

### Systems Programming

- C++17
- C11

### Analytics

- Java 21
- Spring Boot
- Apache Commons Math

### Tools

- Git
- Maven
- Node.js
- Visual Studio
- VS Code

```
To be updated
cerberus/
│
├── Core/
├── Api/
├── Dashboard/
├── Analytics/
├── Sentinel/
├── docs/
├── screenshots/
├── LICENSE
└── README.md
```
## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/blessingsblessedchongo/cerberus.git
cd cerberus
```

### Core Agent

```bash
cd Core
```

### Backend

```bash
cd Api
python -m venv venv
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd Dashboard
npm install
npm run dev
```

### Analytics

```
cd Analytics
mvn spring-boot:run
```
## 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a feature branch

```
git checkout -b feature/new-feature
```

3. Commit your changes## 👨‍💻 Author

**Blessings B. Chongo**

- Microsoft Learn Student Ambassador
- Computer Science Student — Copperbelt University
- Software Engineering & Cybersecurity Enthusiast

GitHub: https://github.com/blessingsblessedchongo
LinkedIn: https://linkedin.com/in/blessingsblessedchongo

4. Push your branch

5. Open a Pull Request
## 📄 License

Distributed under the MIT License.

See `LICENSE` for more information.
