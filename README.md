# Officers' Guest House — Booking System

A full-stack web application for managing room bookings at a military guest house. Supports three officer categories, admin approval workflow, room assignment, checkout, cancellation, and SMS notifications.

---

## Project Structure

```
guesthouse/
├── frontend/          # React + Vite frontend
└── backend/           # Node.js + Express API
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in your values
npm run dev               # runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:5173
```

---

## Room Categories

| Category | Eligibility          | Rooms |
|----------|----------------------|-------|
| Cat 1    | Up to Lt Col         | 8     |
| Cat 2    | Colonel              | 2     |
| Cat 3    | Colonel & above      | 2     |

**Total: 12 rooms**

---

## Booking Workflow

```
Guest submits request
        ↓
   [Pending]
        ↓
Admin reviews → Rejects → [Rejected] → SMS sent
        ↓
   Approves + assigns room → [Approved] → SMS sent
        ↓
   Admin checks in guest → [Checked In] → SMS sent
        ↓
   Admin checks out → [Checked Out] → SMS sent
        ↓
   (At any stage) Admin cancels → [Cancelled] → SMS sent
```

---

## SMS Notifications (MSG91)

SMS is sent to the officer's mobile number on:
- Booking approved (with room number)
- Booking rejected
- Check-in confirmed
- Check-out confirmed
- Booking cancelled (with reason)

Configure MSG91_AUTH_KEY and MSG91_SENDER_ID in .env

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router v6   |
| Styling   | CSS Modules + CSS Variables       |
| Backend   | Node.js, Express 5                |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT (admin login)                 |
| SMS       | MSG91                             |
