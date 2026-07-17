# Enterprise Full Stack Developer Portfolio & CRM
**Portfolio and SRE CRM Workspace of Sudalaimuthu A — Full Stack Developer**

This repository contains the complete, production-ready, highly secure, and performance-optimized full-stack developer portfolio and Enterprise CRM dashboard workspace.

---

## 📋 Table of Contents
1. [System Architecture & Folder Structure](#1-system-architecture--folder-structure)
2. [Local Installation & Developer Setup](#2-local-installation--developer-setup)
3. [Environment Configuration Reference](#3-environment-configuration-reference)
4. [Docker Container Deployment](#4-docker-container-deployment)
5. [Disaster Recovery & Database Backups](#5-disaster-recovery--database-backups)
6. [API Endpoints Guide](#6-api-endpoints-guide)
7. [Security Controls & Auditing](#7-security-controls--auditing)
8. [Testing & Health Diagnostics](#8-testing--health-diagnostics)

---

## 1. System Architecture & Folder Structure

The project is architected as two decoupled service tiers:
* **Frontend**: Responsive static portfolio landing pages and the Dark Glassmorphic Enterprise CRM Workspace.
* **Backend**: Hardy Express.js REST API with rate-limiting, brute-force lockouts, programmatically built indexes, compression, and session cookies.

```
.
├── .github/                      # Automated pipeline triggers
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI compiler check
├── docs/                         # Manual guides & architectural plans
├── frontend/                     # Static Frontend module
│   ├── css/                      # CSS variables, resets, and layout grids
│   ├── js/                       # Scroll anims, GA4 logs, and fetches
│   ├── admin/                    # Enterprise CRM Dashboard View
│   │   ├── css/                  # Glassmorphism grids, kanban, and calendars
│   │   ├── js/                   # Split JS modules
│   │   │   ├── api.js            # Fetch wrappers with RTR refresh interceptors
│   │   │   ├── kanban.js         # Kanban Board drag-and-drop bindings
│   │   │   ├── calendar.js       # Schedules calendar grid builders
│   │   │   ├── messages.js       # Client workspaces drawer, files, templates
│   │   │   └── dashboard.js      # Global router, shortcuts, and timers
│   │   └── dashboard.html        # CRM Workspace main layouts
│   └── index.html                # Portfolio landing index page
├── backend/                      # Node.js/Express.js REST API
│   ├── config/                   # MongoDB Mongoose connection config
│   ├── controllers/              # CRM API endpoints controllers
│   ├── middleware/               # CORS checks, rate limiters, error responders
│   ├── models/                   # Mongoose validation schema definitions
│   ├── routes/                   # Protected versioned routing
│   ├── services/                 # Database, report, and mail service logic
│   ├── utils/                    # Loggers, SRE tools, and errors handlers
│   └── server.js                 # Express Application Entrypoint
├── Dockerfile                    # Multi-stage Alpine containerization build
├── docker-compose.yml            # Docker Compose runtime and SRE volume mounts
├── LICENSE                       # MIT License document
└── README.md                     # [THIS FILE] Unified Enterprise Manual
```

---

## 2. Local Installation & Developer Setup

### Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: Local Community Server or MongoDB Atlas cluster connection
* **Docker**: (Optional) For container deployments

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/thronmuthu18/portfolio.git
   cd portfolio
   ```

2. **Configure Backend environment**:
   - Navigate to the backend directory:
     ```bash
     cd backend
     ```
   - Install production and dev dependencies:
     ```bash
     npm install
     ```
   - Create a `.env` file based on `.env.example`. (See [Environment Configuration](#3-environment-configuration-reference)).
   - Boot local dev server:
     ```bash
     npm run dev
     ```

3. **Serve Frontend**:
   - Serve the `/frontend` directory using any local web server (e.g. VS Code Live Server at `http://localhost:5500` or `http://127.0.0.1:5500`).
   - Open `/frontend/admin/dashboard.html` in your browser to access the Admin CRM Portal.

---

## 3. Environment Configuration Reference

Create a secure `.env` file inside the `backend/` directory with the following variables:

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:5500

# MongoDB Database Connection Parameters
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/portfolio

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-gmail-account@gmail.com
EMAIL_PASS=your-gmail-app-password
RECEIVER_EMAIL=your-inbox-email@gmail.com

# JWT Authentication Secrets
JWT_SECRET=your-cryptographic-jwt-secret-key-phrase
SINGLE_ACTIVE_SESSION=true

# Initial Admin Credentials (created/checked on boot)
ADMIN_USERNAME=sudalaimuthu_admin
ADMIN_PASSWORD=Admin@Portfolio2026!
```

---

## 4. Docker Container Deployment

The project is containerized using a multi-stage Docker build that minimizes final image sizes using Node-Alpine.

### Launching the system:
1. Ensure Docker is running locally.
2. Build and launch containers in background:
   ```bash
   docker-compose up --build -d
   ```
3. Verify running status:
   ```bash
   docker-compose ps
   ```
4. Access the API server container logs:
   ```bash
   docker-compose logs -f app
   ```

---

## 5. Disaster Recovery & Database Backups

The SRE suite supports automatic schema indexing, JSON schema database backups, and restoration points validation.

### Creating a manual Database Backup:
* Issue a POST request using the Admin token header:
  ```bash
  POST /api/v1/admin/database/backup
  ```
  This creates a dated backup file (e.g. `backup-2026-06-30T01-08-35.json`) inside the `backend/backups/` volume.

### Restoring Database state from a Backup point:
* Trigger database restoration:
  ```bash
  POST /api/v1/admin/database/restore
  ```
  Payload:
  ```json
  { "filename": "backup-2026-06-30T01-08-35.json" }
  ```

---

## 6. API Endpoints Guide

| Route path | HTTP Method | Auth Required | Description |
|---|---|---|---|
| `/api/v1/contact` | `POST` | Public | Captures enquiry and sends developer mail. |
| `/api/v1/admin/login` | `POST` | Public | Auth login with rate limits & lockout checks. |
| `/api/v1/admin/refresh-token` | `POST` | Public | Silent RTR refresh token rotation cookie swap. |
| `/api/v1/admin/profile` | `GET` | Admin | Fetches active admin user credentials details. |
| `/api/v1/admin/health` | `GET` | Admin | Returns system status, DB connection, SRE uptimes. |
| `/api/v1/admin/messages` | `GET` | Admin | Inbox listings with search, filter, and pagination. |
| `/api/v1/admin/messages/:id` | `GET` | Admin | Fetches client profile details joined with metadata. |
| `/api/v1/admin/messages/:id/notes` | `POST` | Admin | Appends private admin internal note. |
| `/api/v1/admin/messages/:id/tasks` | `POST` | Admin | Adds task list item to client project. |
| `/api/v1/admin/messages/:id/tasks/:taskId` | `PATCH` | Admin | Toggles task completion state. |
| `/api/v1/admin/messages/:id/attachments` | `POST` | Admin | Uploads secure Base64 document (Max 2MB). |
| `/api/v1/admin/messages/:id/email` | `POST` | Admin | Sends quick template email using SMTP. |
| `/api/v1/admin/messages/:id/timeline` | `GET` | Admin | Returns client profile timeline history logs. |

---

## 7. Security Controls & Auditing

The system enforces enterprise security baselines:
1. **NoSQL Injection Defenses**: `express-mongo-sanitize` strips out parameter operators.
2. **Brute-force lockout protection**: Blocked login attempts on IP and username lock targets for up to 1 hour.
3. **Session Cookies Isolation**: Cookies set with `HttpOnly`, `Secure` (production), and `SameSite=Strict`.
4. **CORS Restrictions**: Block requests originating from unauthorized external origins (CORS 403 Forbidden).
5. **Secure Headers**: Custom Helmet Content Security Policy preventing XSS and clickjacking.

---

## 8. Testing & Health Diagnostics

Verify system integrations by running the master testing suite inside the root directory:
```bash
node backend/monitoring/healthCheckTest.js
```
Or execute SRE integration validations:
```bash
node scratch/testCrm.js
```
This suite automatically tests login lockouts, CORS blocking, database indexes, SMTP connections, SRE diagnostics, and large document Base64 transfers.
#   h m _ p o r t f o l i o  
 #   h m _ p o r t f o l i o  
 