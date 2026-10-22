# 🎉 Gatherly

**Gatherly** is a full-stack event discovery and management platform that makes creating, finding, and managing events simple. It supports both free and paid events, a complete admin approval workflow, and a rich user experience with likes, comments, bookings, and email notifications.

Built with the **MERN stack** (MongoDB, Express, React, Node.js), Eventera delivers a responsive, role-based experience for organizers, attendees, and administrators.

## ✨ Features

### 👤 User Features
- **Secure Authentication** — JWT-based login/register with protected routes.
- **Event Discovery** — Browse, search, and filter events with pagination.
- **Event Details** — View full event info, organizer, likes, and comments.
- **Bookings**
  - Free events: instant booking.
  - Paid events: upload payment proof for admin review.
- **Likes & Comments** — Engage with events you're interested in.
- **Email Notifications** — Get notified on booking approval, event updates, and more.
- **Responsive UI** — Fully optimized for desktop, tablet, and mobile.

### 🛠️ Admin Features
- **Admin Dashboard** — Overview of users, events, and bookings.
- **Event Approval Workflow** — Review and approve/reject submitted events.
- **Payment Proof Review** — Approve or reject paid event bookings after verifying payment proof.
- **User Management** — View and manage registered users.
- **Content Moderation** — Manage comments and flagged content.

### 🎨 General
- Clean, modern UI with **Tailwind CSS**.
- Predictable state management via **Redux Toolkit**.
- RESTful API with **Express** and **Mongoose**.
- Protected routes on both **frontend** and **backend**.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Redux Toolkit, React Router, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Auth** | JWT (JSON Web Tokens), bcrypt |
| **File Uploads** | Multer (payment proofs) |
| **Email** | Nodemailer |
| **Deployment** | Render (backend), Render (frontend) |

---

## 🏗️ Architecture Overview

Gatherly follows a classic **three-tier client–server architecture**, with a React SPA on the frontend, a stateless Express REST API on the backend, and MongoDB as the persistent data store.
┌─────────────────────┐ HTTPS / REST ┌──────────────────────┐
│ │ ─────────────────────────► │ │
│ React Client │ │ Express Server │
│ (Redux Toolkit) │ ◄───────────────────────── │ (REST API) │
│ │ JSON responses │ │
└─────────────────────┘ └──────────┬───────────┘
│
│ Mongoose ODM
▼
┌──────────────────────┐
│ MongoDB │
│ (MongoDB Atlas) │
└──────────────────────┘

### 🔹 Frontend Layer

- **Framework:** React (Vite)
- **State Management:** Redux Toolkit (slices per feature: auth, events, bookings, comments, admin)
- **Routing:** React Router with protected route wrappers
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios with request/response interceptors for JWT injection
- **Responsibilities:**
  - Rendering UI and managing client-side state
  - Handling route guards based on authentication and role
  - Uploading payment proofs to the backend
  - Displaying real-time feedback (toasts, loading states, error handling)

### 🔹 Backend Layer

- **Runtime:** Node.js
- **Framework:** Express.js
- **Authentication:** JWT (stateless, signed tokens)
- **Password Hashing:** bcrypt
- **File Uploads:** Multer (payment proofs stored on disk / cloud)
- **Email Service:** Nodemailer (booking confirmations, approvals, notifications)
- **Responsibilities:**
  - Exposing RESTful API endpoints
  - Enforcing role-based access control (user / organizer / admin)
  - Validating requests and sanitizing inputs
  - Handling business logic: event approval, booking review, payment verification
  - Sending transactional emails

### 🔹 Database Layer

- **Database:** MongoDB (via MongoDB Atlas)
- **ODM:** Mongoose
- **Core Collections:**
  - `users` — credentials, role, profile, verification state
  - `events` — event details, organizer, status (pending / approved / rejected)
  - `bookings` — user, event, payment proof, status (pending / approved / rejected)
  - `comments` — user, event, content, timestamps
  - `likes` — user–event relations
- **Responsibilities:**
  - Persistent storage of all entities
  - Indexing on frequently queried fields (email, event status, user ID)
  - Referential integrity via Mongoose schema references

### 🔹 Request Flow

1. The React client sends an HTTP request (with `Authorization: Bearer <token>` for protected routes).
2. Express routes the request through middleware:
   - **CORS** → **JSON parser** → **Auth middleware** (JWT verification) → **Role middleware** (authorization).
3. The controller executes business logic and interacts with MongoDB via Mongoose.
4. The server responds with JSON.
5. The client updates Redux state and re-renders the UI.

### 🔹 Key Design Decisions

| Decision | Rationale |
|---|---|
| **JWT-based auth** | Stateless — no server-side session storage needed, scales horizontally |
| **Redux Toolkit** | Centralized, predictable state; ideal for multi-role dashboards |
| **Role-based middleware** | Clean separation of user, organizer, and admin permissions |
| **Payment proof upload** | Manual admin verification — no third-party payment gateway dependency |
| **Approval workflows** | Ensures quality of events and authenticity of paid bookings |
| **Mongoose references** | Simple relational modeling, sufficient for this project's scale |

### 🔹 Security Measures

- Passwords hashed with **bcrypt** (never stored in plaintext)
- **JWT expiry** enforced on all protected routes
- **Role-based middleware** prevents privilege escalation
- **Input validation & sanitization** on backend routes
- **CORS** restricted to known frontend origins
- **Environment variables** for all secrets (never committed)

