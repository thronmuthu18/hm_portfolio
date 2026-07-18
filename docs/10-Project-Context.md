# 👑 AI PROJECT MEMORY (PROJECT_CONTEXT.md)

This is the **memory file** that you give to every AI coding agent before it starts coding.
It contains the permanent context and permanent rules of the workspace.

---

## Project Overview

* **Project Name**: Portfolio AI Operating System
* **Mission**: Build a premium AI-powered portfolio platform.
* **Developer Context**: Sudalaimuthu A, India.

---

## Technology Stack

### Frontend
* HTML5, CSS3, Vanilla JavaScript (ES6+).
* Three.js (WebGL 3D Scene).
* Responsive mobile layouts.

### Backend
* Node.js, Express.js.
* MongoDB Atlas, Mongoose ODM.
* JWT HS256 auth, bcrypt passwords encryption.
* Nodemailer SMTP connection pool.

### Deployment & Hosting
* Frontend: Vercel (Edge CDN).
* Backend: Render.
* Database: MongoDB Atlas cloud database.

---

## Master Architecture Rules

1. **Incremental Edits**: Never rewrite the project. Optimize and expand on top of working features.
2. **Do Not Break APIs**: Retain `/api/v1/` routes and admin login setups.
3. **Strict Design Tokens**: CSS colors, radii, spacing variables, and spring physics must inherit from Volume 1 tokens.
4. **No Hallucinations**: Standardize responses in `ai-assistant.js` to draw factually from Sudalaimuthu's credentials data only.
5. **Security Enforced**: Set strict Helmet headers, Timing-Safe verification loops, and rate-limiting brute-force controls.

---

## AI Session Execution Steps

For every session trigger, follow this workflow:
```
PROJECT_CONTEXT.md loaded
        ↓
Master Implementation Manual loaded
        ↓
Analyze current codebase files
        ↓
Draft Implementation Plan
        ↓
Apply code modifications
        ↓
Run integration test suite
        ↓
Document changes & PR metadata
```
