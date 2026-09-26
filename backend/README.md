# DentalSuite Clinical Backend (NestJS + TypeORM + Supabase + WebSockets)

A corporate-grade, production-ready NestJS REST API designed for high-concurrency dental clinics, multi-operatory dental practices, and hospital dental departments.

---

## 🏛️ System Architecture

- **Framework**: [NestJS 11](https://nestjs.com/) (Modular, Dependency Injection, TypeScript)
- **Database & ORM**: PostgreSQL via [Supabase](https://supabase.com/) managed database & [TypeORM](https://typeorm.io/)
- **Authentication**: Dual-token JWT (15-minute Access Token + 7-day Rotated Refresh Token stored in PostgreSQL)
- **Security**: Bcrypt password hashing, Class Validator DTOs, Role-Based Access Control (Admin, Dentist, Receptionist), HTTP Exception Filter
- **Real-Time Engine**: NestJS WebSockets Gateway (`Socket.io`) for multi-operatory synchronization (Odontogram changes, Appointment status, Chair occupancy)
- **Deployment Target**: [Fly.io](https://fly.io/) via multi-stage Alpine Dockerfile with health checks

---

## 🗄️ Database Schema & Entities

The relational database schema is structured into distinct clinical domains:

1. **`users`**:
   - `id` (UUID, PK)
   - `email` (Unique VARCHAR)
   - `username` (Unique VARCHAR)
   - `passwordHash` (Bcrypt hash, hidden by default from queries)
   - `name`, `role` (`admin` | `dentist` | `receptionist`), `title`, `avatarUrl`
   - `createdAt`, `updatedAt`

2. **`refresh_tokens`**:
   - `id` (UUID, PK)
   - `userId` (FK -> `users.id` with CASCADE delete)
   - `tokenHash` (SHA-256 hash of raw cryptographic token)
   - `expiresAt` (TIMESTAMPTZ, 7 days from issue)
   - `isRevoked` (BOOLEAN, used for rotation and reuse detection)
   - `ipAddress`, `userAgent`, `createdAt`

3. **`patients`**:
   - Core demographic records: name, DOB, gender, phone, email, emergency contacts, medical alerts, allergies, insurance.

4. **`tooth_records`** (`ToothRecordEntity`):
   - 32-tooth Universal Numbering System (Teeth #1 through #32).
   - `toothNumber` (1-32), `condition` (`healthy`, `small_cavity`, `moderate_cavity`, `large_cavity`, `rotted`, `filling`, `crown`, `root_canal`, `implant`, `veneer`, etc.).
   - `surfaces` (JSONB array: `occlusal`, `mesial`, `distal`, `buccal`, `lingual`, `incisal`).
   - `mobility` (0-3), `pocketDepthMm`, `lastTreatedDate`, `surfaceColors`.
   - Unique index on `[patientId, toothNumber]`.

5. **`teeth_snapshots`**:
   - Versioned full 32-tooth chart snapshots taken during clinical visits.

6. **`dental_photos`** & **`before_after_pairs`**:
   - Clinical photography (intraoral, extraoral, radiographic) and comparative before-after case presentations.

7. **`appointments`** & **`appointment_reminder_logs`**:
   - Clinic scheduling with automated chair/doctor conflict detection.
   - Live status workflow: `scheduled` → `confirmed` → `in_progress` → `completed` → `cancelled`.
   - Automatic reminder dispatch logs (`booking_confirmation`, `automated_24h`, `reschedule_notice`).

8. **`treatment_logs`**:
   - Clinical procedure documentation with cost, teeth involved, and clinical notes.
   - **Automatic Inventory Deduction**: Whenever treatment consumables (anesthetics, composites, sealers) are logged, the backend automatically subtracts quantities from `consumable_items` and broadcasts low-stock alerts.

9. **`dental_chairs`**, **`staff_shifts`**, **`consumable_items`**, **`treatment_determinations`**:
   - Operatory management, duty shifts, inventory catalog, and fee schedule master data.

---

## 🔐 Authentication & Token Rotation Lifecycle

### 1. Registration (`POST /api/v1/auth/register`)
- Input validation: Email format, username (alphanumeric min 3 chars), strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 number), `confirmPassword === password`.
- Bcrypt hash with salt rounds.
- Generates 15-minute access token + 7-day refresh token stored in PostgreSQL.

### 2. Login (`POST /api/v1/auth/login`)
- Finds user by email or username.
- Validates password via `bcrypt.compare`.
- Returns `{ accessToken, refreshToken, expiresIn: 900, user }`.
- Persists cryptographically hashed refresh token in database with 7-day expiration.

### 3. Refreshing (`POST /api/v1/auth/refresh`)
- Checks refresh token hash in `refresh_tokens` table.
- **Rotation**: Revokes the used refresh token and creates a brand-new 7-day refresh token + new 15-minute access token.
- **Reuse Detection**: If a revoked token is presented, the system flags a potential replay attack and revokes all user sessions.
- **Expiration**: If the 7-day lifetime has passed, rejects with `401 Unauthorized` prompting a fresh login.

### 4. Middleware Validation
- `TokenValidationMiddleware` inspects Bearer tokens on protected `/api/v1/*` routes, enforcing expiration and populating `req.user`.

---

## ⚡ Real-Time WebSockets (`Socket.io`)

The `ClinicalGateway` (`/socket.io`) broadcasts real-time events to all clinical stations:
- `odontogram:updated`: Fired when a dentist modifies tooth conditions or surfaces.
- `appointment:created` / `appointment:status_changed`: Updates reception and operatory screens.
- `chair:status_changed`: Live operatory occupancy (`operational`, `in_use`, `maintenance`).
- `inventory:low_stock`: Alerts staff when consumable supply falls below threshold.

---

## 🚀 Local Development Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase PostgreSQL URI:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

4. **Start the API in Development Mode**:
   ```bash
   npm run start:dev
   ```

5. **Access Endpoints**:
   - API Root: `http://localhost:3000/api/v1`
   - Interactive Swagger Docs: `http://localhost:3000/api/docs`
   - Healthcheck: `http://localhost:3000/api/v1/health`

Default credentials seeded automatically:
- **Admin**: `admin@dentaflow.ph` or `admin` / `Password123!`
- **Dentist**: `thorne@dentaflow.ph` or `dr.thorne` / `Password123!`
- **Receptionist**: `reception@dentaflow.ph` or `receptionist` / `Password123!`

---

## 🚢 Deployment to Fly.io

1. **Install Flyctl CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io**:
   ```bash
   fly auth login
   ```

3. **Deploy from the `backend/` directory**:
   ```bash
   cd backend
   fly launch --no-deploy
   ```

4. **Set Production Secrets (Supabase Database URL & JWT Keys)**:
   ```bash
   fly secrets set \
     DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres" \
     JWT_ACCESS_SECRET="your-ultra-secure-random-32char-access-secret" \
     JWT_REFRESH_SECRET="your-ultra-secure-random-32char-refresh-secret"
   ```

5. **Deploy Application**:
   ```bash
   fly deploy
   ```

Your backend will boot on Fly.io running the production Alpine container, automatically verify database schema on Supabase, and start accepting clinical traffic.
