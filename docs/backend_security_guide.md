# Backend Security & Production Hardening Guide

This document details the security safeguards, performance utilities, testing instructions, and validation checklists configured in **Module 8**.

---

## 1. Implemented Security & Performance Layers

| Security Layer / Package | Purpose & Action | Threat Prevented |
| :--- | :--- | :--- |
| **Helmet** | Configures secure HTTP response headers (MIME sniff block, frame guard frames lock). | Clickjacking, MIME Type Sniffing, XSS, and Server Information Leakage. |
| **CORS Access Control** | Strictly whitelist requests origin matching `CLIENT_URL` configuration. | Unauthorized cross-origin resource requests. |
| **API Rate Limiter** | Restricts standard endpoints to 100 requests per 15 minutes per IP. | DDoS attacks, brute-force crawling, and API resource overload. |
| **Contact Form Rate Limiter** | Restricts the `POST /api/v1/contact` route to **5 submissions per 15 minutes** per IP. | Inbox flooding, email server spam, and database resource exhaustion. |
| **Express Mongo Sanitize** | Strips out keys starting with `$` or containing `.` from query and body inputs. | NoSQL Query Injection attacks. |
| **HTTP Parameter Pollution (HPP)** | Limits query parser from mapping duplicate parameters into matrices arrays. | Parameter Pollution attacks (e.g., query payload anomalies). |
| **Request Payload Size Limits** | Locks express JSON parser capacity at a maximum of **10KB** per request. | Buffer overflow attacks and database memory flooding. |
| **HTTP Gzip Compression** | Compresses JSON responses sent by the server using standard Gzip. | Latency lag, reducing network load times by up to 70%. |

---

## 2. Dynamic CORS Origins Configurations

In `server.js`, the CORS middleware operates dynamically:
1. **Development**: Standard loops (`localhost:5500`, `127.0.0.1:5500`, Vite development ports) are authorized.
2. **Production**: Authorized origins list expands to include the host domain loaded from `process.env.CLIENT_URL` (e.g., your Netlify custom domain).
3. **Invalid Origin**: Returns a `403 Forbidden` response:
   ```json
   {
     "success": false,
     "message": "Blocked by CORS policy: Request origin unauthorized."
   }
   ```

---

## 3. How to Verify & Test Security Layers

### A. Testing Helmet Security Headers (Browser Dev Tools)
1. Open the portfolio website or run a local curl command against the server:
   ```bash
   curl -I http://localhost:5000/api/health
   ```
2. Verify response headers in the output:
   - `X-Frame-Options: SAMEORIGIN` (Halts Frame Hijacking/Clickjacking)
   - `X-Content-Type-Options: nosniff` (Halts MIME sniffing)
   - `X-XSS-Protection: 0` (Default modern XSS filter flag)
   - Confirm `X-Powered-By` header is completely removed.

### B. Testing Rate Limiting (Postman / Thunder Client)
1. Send a request to `POST http://localhost:5000/api/v1/contact`.
2. Repeatedly send this request 6 times consecutively.
3. On the 6th attempt, you will receive an `HTTP 429 Too Many Requests` status code with the payload:
   ```json
   {
     "success": false,
     "message": "Too many contact enquiries from this IP. Please try again after 15 minutes."
   }
   ```

### C. Testing NoSQL Query Injection Protection
1. Send a query body that attempts to bypass username/fields constraints via query parameters:
   ```json
   {
     "email": { "$ne": null },
     "fullName": "Hacker",
     "phone": "+916382539787",
     "projectType": "Bug Fixing & Troubleshooting",
     "budget": "Under $500",
     "projectDescription": "This is a security test payload."
   }
   ```
2. The server middleware (`express-mongo-sanitize`) will automatically strip the key prefix `$ne` turning it into `ne`. The validation middleware will then catch the malformed email and return an `HTTP 400 Bad Request`.

---

## 4. Production Readiness Security Checklist

- [x] **Helmet enabled** (verified secure headers exist).
- [x] **CORS locked** (restricts domain execution access).
- [x] **Global rate limit set** (100 reqs/15m).
- [x] **Route rate limit locked** (5 submissions/15m for contact form).
- [x] **Payload bounds set** (10KB limit on JSON parser).
- [x] **NoSQL Injection filter active** (escapes `$` and `.`).
- [x] **Parameter Pollution HPP active**.
- [x] **Response Compression active**.
- [x] **Production Error Mask active** (hides stacks traces).
- [x] **Credentials protected** (loaded exclusively from `.env`).
