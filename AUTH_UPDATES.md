# Authentication System Updates

This document outlines the complete authentication system built for the CRM application, including database schema design, security mechanisms, and key management.

## 1. Database Schema Design

The foundation of the authentication system and multi-tenancy is built on PostgreSQL using Sequelize ORM. The schema consists of two primary models:

### `Organisation` Model
Represents a tenant or company workspace within the CRM.
* **`id`**: Unique Identifier (UUID)
* **`name`**: Company name (String, Required)
* **`industry`**: Business sector (String, Optional)
* **`website`**: Company URL (String, Optional)
* **`revenue`**: Annual revenue (Decimal, Optional)
* **`employeeCount`**: Total employees (Integer, Optional)
* **`createdAt` / `updatedAt`**: Auto-managed timestamps

### `User` Model
Represents an individual account that logs into the CRM. Every user belongs to exactly one `Organisation`.
* **`id`**: Unique Identifier (UUID)
* **`orgId`**: Foreign Key linking to the `Organisation`
* **`email`**: User's email address (String, Required, Unique)
* **`passwordHash`**: Securely hashed version of the password using **bcrypt** (String, Required). Handled via a `beforeSave` hook to ensure passwords are never stored in plaintext.
* **`name`**: Full name of the user (String, Required)
* **`avatar`**: Profile picture URL (String, Optional)
* **`role`**: Access level, defined as an Enum (`'super_admin'`, `'admin'`, `'sales_rep'`). Defaults to `'sales_rep'`.
* **`permissions`**: A JSON object storing granular rights (e.g., `can_view_leads`, `can_edit_leads`, `can_delete_leads`, `can_export_data`, `can_run_automations`, `can_invite_users`).
* **`refreshToken`**: Stores the active JWT refresh token for long-term session management (Text, Optional)
* **`lastLoginAt`**: Timestamp of the last successful sign-in (Date, Optional)

---

## 2. Token Management: Access vs. Refresh Tokens

The system implements a modern, secure token rotation strategy using two distinct JWTs (JSON Web Tokens).

### Access Token (The "Room Key")
* **Lifespan**: Very short (15 minutes).
* **Purpose**: This token is sent with every request to the backend. It tells the server who the user is and what they are allowed to do.
* **Security**: Because it expires quickly, if an attacker intercepts this token, their access window is extremely limited.

### Refresh Token (The "VIP Card")
* **Lifespan**: Long (7 days).
* **Purpose**: Once the 15-minute Access Token expires, the frontend silently uses the Refresh Token to request a brand new Access Token from the `/api/auth/refresh` endpoint without bothering the user to log in again.
* **Security**: This token is stored in the database alongside the user record. When a user logs out, or if suspicious activity is detected, the server can revoke the Refresh Token by clearing it from the database, instantly forcing a hard logout across all devices.

### Storage: Secure HTTP-Only Cookies
Both tokens are delivered to the frontend via **Secure, HTTP-Only Cookies** with `SameSite=Lax`. 
* **Why?** This prevents Cross-Site Scripting (XSS) attacks. Because JavaScript running in the browser cannot read HTTP-Only cookies, malicious scripts cannot steal the tokens. The browser automatically attaches the cookies to every request made to the API.

---

## 3. Asymmetric Cryptography & In-Memory Keys

Instead of traditional symmetric keys (HS256) where the same secret string creates and verifies tokens, this system uses **RS256** asymmetric cryptography.

### The RS256 Advantage
* **Private Key**: Kept entirely secret by the authentication server. Used solely to *sign* and create tokens.
* **Public Key**: Can be freely shared with any other microservice or backend application. Those services can use the public key to verify that a token is valid without needing to know the private key. This enables scalable microservice architectures.

### Auto-Creation of Keys
The utility `apps/server/src/utils/jwt.ts` is configured to automatically generate a 2048-bit RSA key pair entirely in-memory whenever the server boots up, *unless* they are explicitly provided in the `.env` file.

* **Why is this necessary?** 
  It provides a **zero-configuration developer experience**. When cloning the repository, developers don't have to spend 15 minutes generating `.pem` files or formatting RSA keys into environment variables just to get the server running. The app boots and handles logins flawlessly out of the box.
* **Production Caveat**: Because keys are generated randomly on startup, restarting the dev server invalidates all active cookies (forcing users to log in again). In a production environment, the RSA keys should be generated once and permanently injected via the `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` environment variables to maintain stable sessions.

---

## 4. Endpoints & Middleware

* **`POST /api/auth/login`**: Verifies credentials, generates tokens, and sets HTTP-Only cookies.
* **`POST /api/auth/refresh`**: Verifies the refresh cookie and issues a new access cookie.
* **`GET /api/auth/me`**: Reads the access cookie, returns the user profile, and powers the frontend's auto-login context.
* **`POST /api/auth/logout`**: Clears cookies and revokes the refresh token in the database.
* **`protect` Middleware**: Functions as a gateway security guard. When attached to any Express route, it ensures the request contains a valid access cookie before allowing the request to proceed.
