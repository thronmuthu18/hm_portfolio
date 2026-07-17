# MongoDB Atlas Integration & Database Architecture Guide

This document explains the technical choices, configuration options, setup instructions, and validation routines established in **Module 5** of the developer portfolio.

---

## 1. Why MongoDB Atlas & Mongoose?

### Why MongoDB Atlas?
1. **Fully Managed & Hosted**: Handles database provisioning, automated backups, patching, and scaling automatically. This removes infrastructure overhead for a freelancer.
2. **Global Clustering**: Offers a free tier cluster (M0) spanning AWS, Google Cloud, or Azure, offering 512MB storage which is more than enough for contact enquiries.
3. **Advanced Security**: Features IP Access Whitelisting, username/password SCRAM authentication, and encryption-at-rest by default.
4. **Atlas Metrics Dashboard**: Offers telemetry displays for read/write operations, connection metrics, and query performance.

### Why Mongoose ODM?
1. **Schema Enforcement**: MongoDB is schema-less by default. Mongoose sits on top of MongoDB to enforce structural validations (`required`, `maxlength`, `match`), guaranteeing database data integrity.
2. **Sanitization & Protection**: Automatically casts fields to match schema types, which mitigates NoSQL injection attacks.
3. **Built-in Timestamps**: Automatic hookups to record `createdAt` and `updatedAt` for every document save, eliminating manual code timestamps.
4. **Connection Pool Management**: Manages socket connections internally, automatically retrying lost connections and reusing sockets efficiently.

---

## 2. Environment Variables & Security
Storing the database credentials in a local `.env` file prevents exposing API passwords in Git history.
- **`MONGODB_URI`**: Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/portfolio`
- Never commit `.env` to version control. The accompanying `.env.example` serves as a template for target server hosting environments (e.g. Render).

---

## 3. Future-Ready Scalable Database Architecture
To support future updates, our database setup decouples models and connection logic. Future models (e.g., `User`, `Project`, `Service`, `Analytics`) can be created in the `models/` directory without altering server logic:

```
backend/
├── config/
│   └── db.js                 # Reusable Connection Module
└── models/
    ├── Contact.js            # Contact Schema
    ├── User.js (Future)      # User Account Credentials
    ├── Project.js (Future)   # Portfolio Project details
    └── Service.js (Future)   # Services configurations
```

---

## 4. Step-by-Step MongoDB Atlas Cluster Setup

Follow these steps to connect your portfolio database:

1. **Create Account**: Register at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Create New Project**: Click **New Project** from your dashboard and name it (e.g., `Sudalaimuthu-Portfolio`).
3. **Deploy Free Cluster**:
   - Choose **Build a Database**.
   - Select the **M0 Free** tier.
   - Choose a cloud provider close to your target audience (e.g., AWS / Singapore or Mumbai regions).
   - Click **Create Cluster**.
4. **Database Access User Setup**:
   - Navigate to **Security** -> **Database Access**.
   - Click **Add New Database User**.
   - Select **Password Authentication**.
   - Create a username (e.g., `db_user`) and a secure password.
   - Assign the role **Read and write to any database**.
   - Click **Add User**.
5. **Network Access Setup (IP Whitelisting)**:
   - Navigate to **Security** -> **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) since Render's dynamic host servers change addresses frequently.
   - Click **Confirm**.
6. **Obtain Connection String**:
   - Navigate to **Database** -> **Connect** (on your cluster).
   - Select **Drivers** (Node.js).
   - Copy the provided connection string.
7. **Configure local `.env`**:
   - Open your backend `.env` file.
   - Paste the connection string:
     `MONGODB_URI=mongodb+srv://db_user:<password>@cluster.xxxx.mongodb.net/portfolio?retryWrites=true&w=majority`
   - Replace `<password>` with your created database user password.

---

## 5. Mongoose Configuration Best Practices

- **Strict Querying (`strictQuery: true`)**: Filters out request arguments that aren't defined in the Mongoose schema, preventing NoSQL injection.
- **Index Management (`autoIndex`)**: We set `autoIndex: process.env.NODE_ENV !== 'production'`. Building indexes in production locks up collection reads, so indexing should only be handled during builds or local development.
- **Timeout Thresholds**: Connection limits (`serverSelectionTimeoutMS: 5000`) ensure that if MongoDB goes down, API queries timeout quickly (5 seconds) rather than hanging the server indefinitely.

---

## 6. How to Test & Verify Connections

### Verification Method 1: Server Console Logs
Start the backend server:
```bash
npm run start
```
- **Success Log Output**:
  ```
  Connecting to MongoDB Atlas...
  Server is running on port 5000 in development mode.
  DATABASE SUCCESS: MongoDB connected successfully. Connected to host: cluster0-shard-00.mongodb.net
  ```
- **Failure Log Output (Incorrect Password)**:
  ```
  Connecting to MongoDB Atlas...
  DATABASE ERROR: Initial MongoDB connection failed 💥
  Detail: Invalid database username or password.
  ```

### Verification Method 2: MongoDB Compass GUI
1. Download and open [MongoDB Compass](https://www.mongodb.com/products/tools/compass).
2. Paste your connection string and click **Connect**.
3. You will see the database `portfolio` and its collection `contacts` (which Mongoose initializes automatically on collection writes).
