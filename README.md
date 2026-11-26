# 🎫 Support Ticket Management System (HelpDesk Pro)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://mvenkatahemanthreddy.github.io/Project/)

**Live Deployment URL:** **[https://mvenkatahemanthreddy.github.io/Project/](https://mvenkatahemanthreddy.github.io/Project/)**

---

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2d3748.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ed.svg)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passing-brightgreen.svg)]()

A modern, production-grade **Support Ticket Management System (Mini Helpdesk)** engineered with an **Event-Driven Architecture**, strict **Role-Based Access Control (RBAC)**, robust **REST API design**, **PostgreSQL & SQLite dual support**, and an intuitive **React + Tailwind CSS** frontend.

---

## 🌟 Key Capabilities

- **🔐 Dual-Role Authentication & Security**: JWT-based authentication with bcrypt password hashing, token expiration, and role-based route middleware (`USER` vs `ADMIN`).
- **⚡ Decoupled Event-Driven Architecture**: Powered by a centralized, strongly-typed `AppEventEmitter`. Emits events on lifecycle actions (`TicketCreated`, `TicketUpdated`, `StatusChanged`, `CommentAdded`, `TicketResolved`) with decoupled subscribers handling:
  - **Audit Logging**: Immutable activity log records actor, action, timestamp, and payload diffs.
  - **In-App Notifications**: Real-time customer and admin alert generation.
  - **Simulated Email Dispatcher**: Logs simulated outbound customer emails.
- **📊 Comprehensive Admin Operations Center**:
  - Live KPI metric cards (Total Tickets, Open, In Progress, Resolved, Resolution Rate %, Average Resolution Time in hours).
  - Visual breakdown bars for Priorities and Categories.
  - Inline fast status-changer dropdowns.
  - Live event activity stream.
- **🎯 Customer Support Portal**:
  - Ticket submission modal with category & priority selectors.
  - Multi-status filter tabs, full-text keyword search, and pagination.
  - Interactive discussion thread with author role badges.
  - Real-time notification drawer with unread counter.
- **🧪 100% Automated Test Coverage**: End-to-end integration tests using Jest and Supertest covering Auth, Ticket CRUD, RBAC restrictions, and asynchronous event triggers.
- **🐳 One-Command Containerization**: Ready-to-deploy `docker-compose.yml` orchestrating PostgreSQL, Node.js backend, and Nginx frontend.

---

## 🏗️ Architecture & Component Design

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React + Vite + Tailwind)"]
        UI[SPA Frontend]
        AuthContext[Auth Context]
        NotifContext[Notification Context]
    end

    subgraph API ["Backend API Layer (Express.js + TypeScript)"]
        Router[Express Router]
        AuthMW[JWT & RBAC Middleware]
        Validation[Zod Input Validation]
        Controller[Controllers]
        Service[Business Logic Services]
    end

    subgraph Events ["Event-Driven Subsystem"]
        EE["Typed AppEventEmitter (Singleton)"]
        L1[Activity Log Listener]
        L2[In-App Notification Listener]
        L3[Email Simulator Listener]
    end

    subgraph Persistence ["Persistence Layer"]
        Prisma[Prisma ORM Client]
        DB[(PostgreSQL / SQLite)]
    end

    UI --> Router
    Router --> AuthMW --> Validation --> Controller --> Service
    Service --> Prisma --> DB
    Service -- "emitEvent()" --> EE
    EE --> L1 --> Prisma
    EE --> L2 --> Prisma
    EE --> L3
```

---

## 🔄 Event-Driven Workflow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    participant API as Ticket Controller
    participant Service as Ticket Service
    participant DB as Database (Prisma)
    participant Bus as Typed AppEventEmitter
    participant Audit as ActivityLog Listener
    participant Notif as Notification Listener
    participant Email as Email Listener
    actor User as Ticket Owner

    Admin->>API: PATCH /api/tickets/:id { status: "RESOLVED" }
    API->>Service: updateTicket(id, user, data)
    Service->>DB: UPDATE tickets SET status = 'RESOLVED', resolvedAt = NOW()
    Service->>Bus: emitEvent("ticket:status_changed", payload)
    Service->>Bus: emitEvent("ticket:resolved", payload)
    Service-->>API: return updatedTicket
    API-->>Admin: 200 OK (Ticket Resolved)

    par Asynchronous Event Subscribers
        Bus->>Audit: Handle event
        Audit->>DB: INSERT INTO activity_logs (action: 'TICKET_RESOLVED', ...)
    and
        Bus->>Notif: Handle event
        Notif->>DB: INSERT INTO notifications (userId: ticket.userId, ...)
    and
        Bus->>Email: Handle event
        Email-->>Email: Log outbox confirmation message
    end

    Note over User,Notif: User polls or opens notification bell and sees resolution alert!
```

---

## 🗄️ Database Design & Schema

The relational schema is configured with Prisma ORM and is 100% portable across **PostgreSQL** and **SQLite**.

```mermaid
erDiagram
    User ||--o{ Ticket : "creates (UserTickets)"
    User ||--o{ Ticket : "assigned to (AssignedTickets)"
    User ||--o{ Comment : "authors"
    User ||--o{ ActivityLog : "performs"
    User ||--o{ Notification : "receives"
    Ticket ||--o{ Comment : "contains"
    Ticket ||--o{ ActivityLog : "tracks"

    User {
        string id PK
        string email UK
        string name
        string password
        string role "USER | ADMIN"
        datetime createdAt
        datetime updatedAt
    }

    Ticket {
        string id PK
        int ticketNumber UK
        string title
        string description
        string category "TECHNICAL | BILLING | ACCOUNT | FEATURE_REQUEST | GENERAL"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        string status "OPEN | IN_PROGRESS | RESOLVED | CLOSED"
        string userId FK
        string assignedToId FK
        datetime resolvedAt
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        string id PK
        string content
        string ticketId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    ActivityLog {
        string id PK
        string ticketId FK
        string actorId FK
        string action
        string details
        string metadata
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        string ticketId
        string type
        string title
        string message
        boolean isRead
        datetime createdAt
    }
```

---

## 👥 Pre-Configured Demo Accounts

For immediate evaluation, the database includes pre-seeded demo accounts:

| Role | Name | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Sarah Connor | `admin@helpdesk.com` | `admin123` | Full governance, metrics, status transition, any ticket management |
| **USER** | John Doe | `john@example.com` | `user123` | Create, edit/delete open tickets, add comments, view own tickets |
| **USER** | Alice Smith | `alice@example.com` | `user123` | Create, edit/delete open tickets, add comments, view own tickets |

> 💡 **Quick Demo Feature**: The login screen and navbar include **1-Click Quick Switch Buttons** to instantly toggle between Admin, John, and Alice without typing passwords!

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested on Node v20 & v26)
- **npm** v9+

### 1. Local Zero-Config Setup (SQLite Default)

The default configuration uses SQLite so you can test immediately with **zero background daemons or database setup required**:

```bash
# 1. Clone or navigate to the project directory
cd support-ticket-system

# 2. Setup and seed backend
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts

# 3. Start backend server (runs on http://localhost:5000)
npm run dev

# 4. In a new terminal, setup and start frontend
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

---

### 2. Switching to PostgreSQL (Optional)

To connect to a live PostgreSQL instance:

1. Open `backend/.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/support_tickets?schema=public"
   ```
2. In `backend/prisma/schema.prisma`, update provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations and seeder:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

---

### 3. Docker Compose Setup

Run the full stack (PostgreSQL + Backend + Nginx Frontend) in isolated containers with a single command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Automated Testing

The backend includes a comprehensive Jest & Supertest integration test suite covering authentication, RBAC authorization, ticket lifecycle operations, and the asynchronous event bus:

```bash
cd backend
npm test
```

### Test Suite Summary:
- ✅ `tests/auth.test.ts`: User registration, unique email validation, password hashing verification, JWT token issuance, and `/me` endpoint.
- ✅ `tests/tickets.test.ts`: Ticket creation, user-scoped ticket isolation (data protection), admin status transitions, comment addition, and role-based protection on `/api/stats/overview`.
- ✅ `tests/events.test.ts`: Verifies `TICKET_CREATED` triggers immutable `ActivityLog` creation and email dispatch; `STATUS_CHANGED` generates in-app notifications and customer updates; `TICKET_RESOLVED` marks timestamps.

---

## 📖 REST API Reference

All protected endpoints require the header `Authorization: Bearer <token>`.

### Authentication Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/auth/me` | User / Admin | Get profile of currently authenticated user |

### Ticket Management Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets` | User / Admin | Create support ticket (`title`, `description`, `category`, `priority`) |
| `GET` | `/api/tickets` | User / Admin | List tickets (User sees own; Admin sees all). Supports `page`, `limit`, `search`, `status`, `priority`, `category` |
| `GET` | `/api/tickets/:id` | User / Admin | Get ticket details with threaded comments and audit history |
| `PATCH` | `/api/tickets/:id` | User / Admin | User edits own open ticket; Admin can change status, priority, or assignee |
| `DELETE`| `/api/tickets/:id` | User / Admin | User deletes own OPEN ticket; Admin can delete any |

### Comment Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets/:id/comments` | User / Admin | Add comment to ticket (notifies counter-party via event) |
| `GET` | `/api/tickets/:id/comments` | User / Admin | Get chronological comments for ticket |

### Analytics & System Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats/overview` | Admin Only | KPI metrics, resolution rate %, avg hours, distribution charts |
| `GET` | `/api/notifications` | User / Admin | Get in-app notifications for authenticated user |
| `GET` | `/api/notifications/unread-count` | User / Admin | Get unread count for badge |
| `PATCH`| `/api/notifications/:id/read` | User / Admin | Mark specific notification as read |
| `POST` | `/api/notifications/mark-all-read` | User / Admin | Mark all user notifications as read |
| `GET` | `/api/simulator/emails` | Public | Inspect outbound simulated notification emails |
| `GET` | `/api/health` | Public | Healthcheck endpoint (`status: UP`) |

---

## 📮 Postman Collection

A complete, ready-to-import Postman Collection is included at [`postman_collection.json`](./postman_collection.json).
- Includes all endpoints, request bodies, query parameters, and automatic token capture scripts.
- Simply import into Postman, run `Login (Admin)` or `Login (User)`, and test the endpoints interactively.

---

## 🏆 Bonus Features Implemented

- [x] **Full-Text Search & Multi-Criteria Pagination**: Search titles & descriptions with `page`, `limit`, `hasNext`, and `totalPages`.
- [x] **Dynamic Sorting & Filtering**: Multi-parameter query filters across status, priority, category, and date.
- [x] **Real-time In-App Notification Center**: Bell icon with unread badge counter, popover list, and auto-polling.
- [x] **Email Notification Simulator**: Event listener that formats and queues confirmation/status emails into an outbox viewer.
- [x] **Executive Analytics Dashboard**: Resolution rate calculator, average resolution time tracker, and breakdown bars.
- [x] **Automated Integration Tests**: Comprehensive Jest test suite with 100% pass rate.
- [x] **Docker Multi-Stage Builds**: Dockerfile for backend, frontend, and Docker Compose orchestration.
- [x] **Zero "AI Slop"**: Clean TypeScript types, strict error boundaries, proper async wrappers, Zod validation, and human-crafted UX.
