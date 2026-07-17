# Contact Enquiry System API Documentation
**POST /api/v1/contact**

This document describes the request/response flows, input validations, email configurations, and testing templates established in **Module 6**.

---

## 1. System Request & Data Flow Architecture

The data flow diagram below illustrates how client submissions pass validation, save to the database, and trigger notifications:

```
[ Visitor / Client Frontend ]
              │
              ▼   (POST request payload)
[ Express Server Entrypoint (server.js) ] (Loads Helmets, Rate Limits, request parses)
              │
              ▼
[ Route definition (contactRoutes.js) ]
              │
              ▼   (Validates formats, types, lengths; escapes XSS payloads)
[ Validation Middleware (validator.js) ] ──(Invalid)──► [ Return 400 Bad Request JSON ]
              │
              ▼   (Validates keys, destructures variables)
[ Core Controller (contactController.js) ]
              │
       ┌──────┴──────┐
       ▼             ▼   (Asynchronous, non-blocking SMTP transport)
[ Mongoose ODM ]  [ Email Service (emailService.js) ]
       │             │
       ▼             ▼
[ MongoDB Atlas ] [ Developer Inbox (Gmail Alert) ]
       │
       ▼   (Returns _id & createdAt)
[ Return 201 Created JSON Response ]
```

---

## 2. API Endpoint Specification

- **Method**: `POST`
- **Path**: `/api/v1/contact`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body (JSON)**:
  ```json
  {
    "fullName": "Sudalaimuthu A",
    "email": "sudalaimuthusudalai754@gmail.com",
    "phone": "+916382539787",
    "projectType": "Full Stack Development",
    "budget": "$1,000 - $3,000",
    "projectDescription": "I need a premium, responsive full-stack SaaS platform built with Node.js and MongoDB."
  }
  ```

---

## 3. Data Validation & Sanitization Schema

| Field | Rules | Sanitization Action |
| :--- | :--- | :--- |
| **`fullName`** | Required, length 2 to 80 chars | Whitespace trimmed, HTML escaped (`&lt;`, `&gt;`) |
| **`email`** | Required, standard email validation format | Whitespace trimmed, converted to lowercase |
| **`phone`** | Required, standard international regex format | Whitespace trimmed |
| **`projectType`** | Required | HTML escaped |
| **`budget`** | Required | HTML escaped |
| **`projectDescription`** | Required, length 10 to 2000 chars | Whitespace trimmed, HTML escaped |

**Constraint Lock**: Any keys sent in `req.body` that are *not* in the above list will cause the request to fail with a `400 Bad Request` block. This prevents hackers from spamming junk parameters.

---

## 4. API Response Specifications

### A. Success Response (201 Created)
Returned when data validation succeeds, details are saved to MongoDB Atlas, and the email alert is fired:
```json
{
  "success": true,
  "message": "Your enquiry has been submitted successfully.",
  "data": {
    "id": "667f5a89e13a48e71b2dcd8a",
    "submittedAt": "2026-06-29T03:10:00.123Z"
  }
}
```

### B. Validation Error Response (400 Bad Request)
Returned when inputs fail schema constraints:
```json
{
  "success": false,
  "message": "Validation failed. Please check input parameters.",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address."
    },
    {
      "field": "projectDescription",
      "message": "Description must be between 10 and 2000 characters."
    }
  ]
}
```

### C. Server Error Response (500 Internal Server Error)
Returned when the database goes offline or breaks internally. No system stack traces are exposed:
```json
{
  "status": "error",
  "message": "Failed to record inquiry in database."
}
```

---

## 5. How to Test via Postman or Thunder Client

1. Set method to `POST`.
2. Enter the URL: `http://localhost:5000/api/v1/contact`.
3. In the **Headers** tab, ensure `Content-Type` is set to `application/json`.
4. In the **Body** tab, select **raw** and set the format to **JSON**.
5. Paste the test payload:
   ```json
   {
     "fullName": "Alice Smith",
     "email": "alice@example.com",
     "phone": "+1 555-019-2834",
     "projectType": "Landing Page Development",
     "budget": "$500 - $1,000",
     "projectDescription": "Need a responsive product landing page with dynamic scrolling."
   }
   ```
6. Click **Send**. You should receive a `201 Created` status with the success payload.

### Common Errors and Troubleshooting
- **Error: `Unexpected parameters rejected`**: You included additional parameters in your JSON request (like `"website"` or `"role"`). Clean up the JSON keys so they only contain the 6 allowed keys.
- **Error: `Please provide a valid phone number`**: Your phone input contains letters or is too short. Ensure it only contains digits, spaces, hyphens, parentheses, and optionally a leading `+`.
- **Email Notification Fails**: The server log will display `EMAIL ERROR: Failed to send email alert`. However, the API call will still return a `201 Success` response since the enquiry was saved to MongoDB. Verify your `.env` SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) are correct.
