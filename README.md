# 📚 Smart Attendance App

A full-stack attendance management system for educational institutions.
Built with a simple, clean tech stack — easy to run, easy to explain.

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Full-Stack Framework | Next.js 15 (App Router) | Handles both frontend UI and backend API in one project |
| Database | SQLite | File-based, zero setup, perfect for demo |
| ORM | Prisma | Write TypeScript instead of SQL |
| Auth | bcryptjs + JWT | Hash passwords + stateless token-based sessions |
| UI Components | shadcn/ui + Radix UI | Pre-built, accessible components |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| State Management | Zustand | Lightweight global state for logged-in user |
| QR Codes | qrcode (npm) | Generate QR images for attendance sessions |
| Charts | Recharts | Analytics charts in admin dashboard |
| Notifications | Sonner | Toast notifications |

---

## 👥 User Roles

| Role | Login | Features |
|---|---|---|
| **Student** | student@demo.com | View schedule, mark attendance, manage goals, browse activities |
| **Teacher** | teacher@demo.com | View classes, generate QR codes, monitor live attendance sessions |
| **Admin** | admin@demo.com | Manage all users, view analytics, system settings |

**Password for all demo accounts:** `password123`

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
npm run db:setup
```
This runs 3 commands automatically:
- `prisma generate` — generates the Prisma client
- `prisma migrate dev` — creates the SQLite database tables
- `prisma db seed` — fills the database with demo data

### 3. Start the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔄 Reset Database (If Needed)
```bash
npm run db:reset
```
Wipes all data and re-seeds with fresh demo data.

---

## 📁 Project Structure

```
smart_attendance_app-master/
│
├── app/                         ← Next.js App Router (pages + API)
│   ├── (auth)/                  ← Login & Register pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (main)/                  ← Protected pages (require login)
│   │   ├── layout.tsx           ← Auth guard + Navbar + Sidebar
│   │   ├── dashboard/page.tsx   ← Role-based dashboard
│   │   ├── schedule/page.tsx    ← Weekly timetable
│   │   ├── attendance/page.tsx  ← Student: mark attendance
│   │   ├── goals/page.tsx       ← Student: personal goals
│   │   ├── activities/page.tsx  ← Student: activity suggestions
│   │   ├── teacher/
│   │   │   ├── attendance/      ← Teacher: QR sessions + records
│   │   │   └── classes/         ← Teacher: class & student list
│   │   └── admin/
│   │       ├── users/           ← Admin: manage all users
│   │       ├── analytics/       ← Admin: attendance charts
│   │       └── settings/        ← Admin: system info
│   │
│   ├── api/                     ← Backend REST API routes
│   │   ├── auth/login/          ← POST /api/auth/login
│   │   ├── auth/register/       ← POST /api/auth/register
│   │   ├── auth/me/             ← GET  /api/auth/me
│   │   ├── attendance/mark/     ← GET/POST attendance marking
│   │   ├── attendance/records/  ← GET attendance history + stats
│   │   ├── attendance/session/
│   │   │   ├── start/           ← POST: teacher starts QR session
│   │   │   ├── scan/            ← POST: student scans QR
│   │   │   └── status/[token]/  ← GET/DELETE: live session status
│   │   ├── goals/               ← GET/POST/PATCH/DELETE goals
│   │   ├── schedule/my/         ← GET today's schedule
│   │   ├── schedule/week/       ← GET full week schedule
│   │   ├── suggestions/my/      ← GET activity suggestions
│   │   ├── teacher/classes/     ← GET teacher's classes
│   │   └── admin/users/         ← GET/DELETE users (admin only)
│   │
│   ├── scan/page.tsx            ← QR scan landing page (public)
│   ├── demo/page.tsx            ← Demo showcase page
│   └── page.tsx                 ← Landing / home page
│
├── components/
│   ├── ui/                      ← shadcn/ui components (Button, Card, etc.)
│   ├── layout/
│   │   ├── navbar.tsx           ← Top navigation bar
│   │   └── sidebar.tsx          ← Role-based side navigation
│   └── features/auth/
│       └── login-form.tsx       ← Login form component
│
├── lib/
│   ├── auth.ts                  ← JWT sign / verify helpers
│   ├── api-client.ts            ← Axios instance with auth interceptors
│   ├── prisma.ts                ← Prisma singleton client
│   ├── session-store.ts         ← In-memory QR session store
│   └── utils.ts                 ← Utility helpers (cn, etc.)
│
├── store/
│   └── auth-store.ts            ← Zustand store (login, logout, user state)
│
├── hooks/
│   ├── use-auth.ts              ← Auth hook (wraps Zustand store)
│   ├── use-schedule.ts          ← Schedule data fetching hook
│   ├── use-suggestions.ts       ← Activity suggestions hook
│   ├── use-mobile.ts            ← Mobile screen detection hook
│   └── use-toast.ts             ← Toast notification hook
│
├── types/
│   └── index.ts                 ← Global TypeScript interfaces
│
├── prisma/
│   ├── schema.prisma            ← Database schema (all 9 tables)
│   ├── seed.ts                  ← Demo data seeder
│   └── dev.db                   ← SQLite database file (auto-created)
│
└── .env.local                   ← Environment variables
```

---

## 🗄️ Database Schema

```
User
  ├── StudentProfile  →  ClassEnrollment, AttendanceRecord, PersonalGoal
  └── TeacherProfile  →  Class
                              ├── TimetableSlot  →  AttendanceRecord
                              └── ClassEnrollment

ActivitySuggestion   (standalone catalog, no relations)
```

**9 Models:** User, StudentProfile, TeacherProfile, Class, ClassEnrollment,
TimetableSlot, AttendanceRecord, ActivitySuggestion, PersonalGoal

---

## 🔐 How Authentication Works

```
1. User submits email + password on /login
2. Server: finds user in DB → bcrypt.compare(password, hash)
3. Server: creates JWT token  →  { userId, email, role, name }  signed for 7 days
4. Client: stores token in localStorage
5. Every API request: Axios adds  Authorization: Bearer <token>  header
6. Every API route: getAuthUser(req) verifies token → knows who's calling
7. Role check: if (authUser.role !== "TEACHER") → return 403 Forbidden
8. Logout: remove token from localStorage → Zustand state cleared
```

---

## 📱 QR Code Attendance Flow

```
TEACHER SIDE:
1. Opens /teacher/attendance
2. Clicks "Start QR Session" on a class slot
3. Server generates a UUID token (expires in 5 minutes)
4. QR code image generated using the `qrcode` library
5. QR encodes the URL:  http://localhost:3000/scan?token=<uuid>
6. Teacher shows QR on screen — live countdown timer starts
7. Page polls session status every 3 seconds (scanned count updates live)

STUDENT SIDE:
8. Scans QR code with phone camera
9. Browser opens /scan?token=<uuid>
10. Student taps "Mark My Attendance"
11. Server validates: token exists? not expired? student enrolled?
12. AttendanceRecord created in SQLite database
13. Student sees green success screen
```

---

## 🌐 All API Routes

| Method | Route | Who | Description |
|---|---|---|---|
| POST | /api/auth/login | Public | Login → returns user + JWT |
| POST | /api/auth/register | Public | Register new account |
| GET | /api/auth/me | Any | Get current user from token |
| GET | /api/schedule/my | Any | Today's schedule |
| GET | /api/schedule/week | Any | Full week schedule |
| GET | /api/attendance/mark | Student | Get today's marked slots |
| POST | /api/attendance/mark | Student | Mark attendance manually |
| GET | /api/attendance/records | Any | Attendance history + stats |
| POST | /api/attendance/session/start | Teacher | Start QR session |
| POST | /api/attendance/session/scan | Student | Scan QR → mark attendance |
| GET | /api/attendance/session/status/[token] | Teacher | Live session status |
| DELETE | /api/attendance/session/status/[token] | Teacher | Close session early |
| GET | /api/goals | Student | Get all personal goals |
| POST | /api/goals | Student | Create new goal |
| PATCH | /api/goals | Student | Update goal progress |
| DELETE | /api/goals | Student | Delete a goal |
| GET | /api/suggestions/my | Student | Get activity suggestions |
| GET | /api/teacher/classes | Teacher | Get classes with students |
| GET | /api/admin/users | Admin | List all users |
| DELETE | /api/admin/users | Admin | Delete a user |

---

## 🎓 Key Concepts for Viva

### Why Next.js instead of separate frontend + backend?
> Next.js handles both in one project. The `app/` folder is the frontend (React pages),
> and `app/api/` is the backend (REST API routes). No need for Express or a separate server.

### Why SQLite?
> SQLite is a file-based database — the entire database is a single `.db` file.
> Zero installation, zero configuration. Perfect for demos and development.
> In production, just change one line in `schema.prisma` to switch to PostgreSQL.

### Why Prisma?
> Prisma is a TypeScript ORM. Instead of writing raw SQL queries, you write
> type-safe TypeScript code. If you make a typo in a field name, TypeScript
> catches it immediately before the code even runs.

### Why JWT instead of sessions?
> JWT tokens are stateless — the server doesn't store anything.
> The token itself contains the user's ID and role, signed with a secret key.
> The server just verifies the signature on every request.

### Why Zustand instead of Redux?
> Zustand does the same job as Redux in 10 lines of code instead of 50.
> For a project this size, Zustand is simpler and easier to maintain.

### How is the QR attendance secure?
> 1. Token is a random UUID — impossible to guess
> 2. Token expires in 5 minutes — replay attacks won't work
> 3. Student must be enrolled in that specific class
> 4. Each student can only mark once per session

---

## 📋 Demo Credentials

```
Admin:    admin@demo.com    /  password123
Teacher:  teacher@demo.com  /  password123
Teacher2: teacher2@demo.com /  password123
Teacher3: teacher3@demo.com /  password123
Student:  student@demo.com  /  password123
Student2: student2@demo.com /  password123
Student3: student3@demo.com /  password123
```

---

## 🔧 Environment Variables

```env
# .env.local

DATABASE_URL="file:./dev.db"          # SQLite database file location
JWT_SECRET="your-secret-key"          # Used to sign and verify JWT tokens
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Used in QR code URLs
```

---

## 📦 NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:setup` | Generate Prisma client + migrate + seed (first time) |
| `npm run db:seed` | Seed demo data only |
| `npm run db:reset` | Wipe database and re-seed fresh demo data |

---

*Smart Attendance App — Built with Next.js, Prisma, SQLite, JWT, Tailwind CSS*