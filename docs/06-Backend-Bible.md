# Portfolio AI Operating System Blueprint
## Volume 6 — Backend, AI Services & System Architecture Bible
Version 3.0 • Certified Production Standard

---

## Chapter 1 — System Philosophy

The backend of the platform functions as its cognitive engine. Its primary responsibilities are security, data modeling, AI service orchestration, business automation, and system monitoring. Frontend presentation rules must remain separated from backend business logic.

---

## Chapter 2 — Technology Stack

* **Runtime**: Node.js and TypeScript (for secure type checking).
* **Framework**: Express.js (REST-compliant API router).
* **Database**: MongoDB (Atlas cloud cluster) ODM mapping via Mongoose.
* **Security & Auth**: JWT (JSON Web Tokens using explicit HS256 signatures), timing-safe credentials verification, and bcrypt hashing.
* **Communications**: WebSocket operations via Socket.IO.
* **Logging**: Pino structured logging.

---

## Chapter 3 — System Layers

Request execution flows through a decoupled stack:
```
Client Request
  └── CORS & Rate Limits (Middleware Layer)
        └── Route Validation (Zod schemas validation)
              └── Request Handler (Controller Layer)
                    └── Business Logic (Service Layer)
                          └── Database access (Repository Layer)
                                └── Data Schema (Model ODM)
```

---

## Chapter 4 — Project Structure

The repository structure isolates domains:
```
server/
├── src/
│   ├── config/        # Environment and database setup parameters
│   ├── routes/        # Versioned API routes mapping (/api/v1/)
│   ├── controllers/   # Request adapters mapping
│   ├── middleware/    # Auth guards, security headers, rate limits
│   ├── services/      # AI engine, mail transport singletons
│   ├── models/        # Mongoose database schema declarations
│   └── repositories/  # Database read/write adapters
```

---

## Chapter 5 — API Design

* **Versioning**: All API entries map to `/api/v1/`.
* **REST Constraints**: Expose descriptive status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `429 Too Many Requests`).
* **Format**: Dynamic JSON responses utilizing pagination query controls (`page`, `limit`).

---

## Chapter 6 — Domain Service Architecture

Domain operations are isolated inside singletons:
* `AiService`: Prompt building and intent parsing.
* `EmailService`: Connection-pooled SMTP email dispatching.
* `DatabaseService`: Compound database indexing and connection health monitoring.

---

## Chapter 7 — Database Design

Primary database collection schemas:
* `users`: Auth credentials, lockout counts, and lockout timestamps.
* `messages`: Contact form submissions.
* `lockouts`: Active IP and username login failure logs.

---

## Chapter 8 — Repository Pattern

Controllers do not query models directly. Database reads and writes are delegated to a repository layer. This isolates database-specific configurations and database driver types from controller business code.

---

## Chapter 9 — Authentication

* JSON Web Tokens (JWT) manage authentication states.
* Access tokens are generated with strict expiry windows (e.g. 15 minutes).
* Production cookies use `HttpOnly`, `Secure`, and `SameSite: strict` settings to mitigate CSRF risks.

---

## Chapter 10 — Authorization (Role-Based Access)

* Access scopes are declared explicitly: Admin (Full CRM read/write), Editor (Content updates), Visitor (Read-only routes).
* Principle of Least Privilege applies on all API endpoints.

---

## Chapter 11 — AI Service

The backend `AiService` acts as an orchestrator:
* Generates safe prompts with injected portfolio context.
* Parses visitor queries.
* Sanitizes output values.

---

## Chapter 12 — Prompt Engine

System instructions are structured in layers:
1. **System Rules**: Defines assistant profiles, behavior constraints, and safety guidelines.
2. **Context**: Injects verified facts about the developer's credentials.
3. **Conversation State**: Includes history logs from the active session.

---

## Chapter 13 — RAG Architecture

For large text files (e.g. resume descriptions, blog articles), the backend retrieves context using vector semantic searches. The most relevant information blocks are injected into prompt contexts dynamically, preventing LLM hallucinations.

---

## Chapter 14 — Memory System

Tracks session contexts to support multi-turn conversations. Active memory structures are stored in memory stores and clear automatically once sessions end.

---

## Chapter 15 — Voice Services

The voice services pipeline handles voice input (speech-to-text), intent detection, response generation, and text-to-speech synthesis dynamically. Speech playback streams support graceful interruption controls.

---

## Chapter 16 — Search Engine

The search pipeline supports:
* Fast keyword matching with text indexing.
* Semantic lookup using technology synonyms.
* Autocomplete suggestions.

---

## Chapter 17 — File Services

* Uploaded files (attachments, resumes) are parsed as Base64 payloads or binary streams.
* Verify file signature types and enforce file size checks (max 2MB) in controllers to prevent buffer overflow attacks.

---

## Chapter 18 — Event System

Uses events to achieve loose coupling between services:
* Form submission triggers a `contact.submitted` event.
* The event listener fires background handlers: database logging and SMTP mail dispatching.

---

## Chapter 19 — Background Jobs

Time-consuming operations (sending emails, cleaning logs, updating search indexes) run asynchronously outside of the main API request lifecycle. This keeps the application highly responsive.

---

## Chapter 20 — WebSocket Layer (Socket.IO)

Enables real-time data streaming and instant updates:
* Stream chatbot responses.
* Send active typing indicators.
* Push real-time notification alerts.

---

## Chapter 21 — Caching Strategy

Frequently queried assets (such as portfolio information and system settings) are cached in memory. Caches are invalidated only when backend updates occur.

---

## Chapter 22 — Logging System

Logs are structured as JSON streams using Pino:
* Capture request details, timing metrics, and status codes.
* Prevent logging sensitive data (passwords, email strings).
* Write security logs directly to secure audit files.

---

## Chapter 23 — Monitoring

The SRE dashboard monitors CPU, memory, latencies, database speeds, and WebSocket health metrics.

---

## Chapter 24 — System Security Hardening

* **Hardened Headers**: Helmet configures CSP directives, CORS origins, and referrer policies.
* **Rate Limiting**: Implements brute-force protection using rate-limiting lockouts.
* **Safe Encryption**: Enforces constant-time credential comparisons (`crypto.timingSafeEqual`).

---

## Chapter 25 — System Resilience

* Set timeouts on database connection attempts and API requests.
* Network failures fall back gracefully to offline state mockups.
* Auto-reconnection logic is configured on database drivers.

---

## Chapter 26 — Scalability

* API services are designed stateless.
* Sessions are handled as JWT client configurations.
* Database connections leverage clustering configurations.

---

## Chapter 27 — Deployment Pipeline

Supports zero-downtime deployment pipelines:
* Runs testing suites before builds are compiled.
* Preconnects environment variables before boot.
* Enables fast rollback routes.

---

## Chapter 28 — Testing Matrix

Tests are structured as a pyramid: Unit, integration, E2E validation, and security check blocks.

---

## Chapter 29 — Observability

Observability pipelines aggregate Pino log files, trace execution times, and expose health check routes (`/api/v1/admin/health`) for automatic status checks.

---

## Chapter 30 — Definition of Backend Excellence

The backend achieves excellence when it remains a secure, high-performance, and resilient foundation. It abstracts data complexity and exposes clean APIs to the client frontend.
