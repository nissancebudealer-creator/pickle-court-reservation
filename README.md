# Company Pickleball — Employee Court Reservation Platform

A corporate court reservation web platform engineered for corporate wellness, automated booking governance, and administrative oversight. Built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL with RLS & Auth SSR)**, and **Resend** transactional emails, optimized for zero-config production deployment on **Vercel**.

---

## 🏸 Key Features

1. **Asia/Manila (PHT, UTC+8) Standard Time Governance**:
   - Fixed operating hours: **5:30 PM – 8:30 PM PHT** across 3 daily slots:
     - `5:30 PM – 6:30 PM`
     - `6:30 PM – 7:30 PM`
     - `7:30 PM – 8:30 PM`
   - Past slots automatically expire and display past session states.
   - Hourly Vercel Cron worker archives past confirmed bookings to `COMPLETED`.

2. **Fair-Access Policy & Concurrency Protection**:
   - **One Active Booking Policy**: Database trigger and application layer enforce that non-admin employees can only hold **1 active** (Pending or Confirmed) reservation at a time.
   - **Concurrency Lock**: PostgreSQL partial unique index ensures zero double-booking on confirmed slots (`UNIQUE INDEX unique_confirmed_court_slot ON reservations (court_id, reservation_date, slot_id) WHERE status = 'CONFIRMED'`).
   - **Contending Requests Supported**: Multiple employees can submit pending requests for the same slot. When an admin confirms an applicant, all other contending requests are auto-rejected and their quotas immediately restored.

3. **Multi-Court Management**:
   - Tab-based court switcher (defaults to Court 1).
   - Dynamic court creation and maintenance toggles (`ACTIVE` vs `MAINTENANCE`).
   - Facility slot/day blocking with public announcements.

4. **Facilities Admin Control Center**:
   - Live metrics: Needs Approval, Today's Confirmed, Upcoming, Utilization %, and Active Courts.
   - Master filterable reservations ledger with instant Approve, Reject, Reschedule, and Cancel capabilities.
   - Staff directory with password reset generator powered by Supabase Admin API (`auth.admin.updateUserById`).

5. **Transactional Email Engine (Resend)**:
   - Request Submitted notice (to employee).
   - Facilities Admin alert with direct review link.
   - Approval confirmation notice with court rules and teammate roster.
   - Auto-rejection notice with quota restored notification.
   - Cancellation and reschedule alerts.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS + Lucide React
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, `@supabase/ssr`)
- **Email Service**: Resend SDK (`resend`)
- **Hosting & Cron**: Vercel (Edge Middleware + Serverless Functions + Vercel Cron)
- **Timezone**: Asia/Manila (`date-fns` & `date-fns-tz`)

---

## 🚀 Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials and Resend API key:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Found in Supabase Dashboard -> Project Settings -> API

RESEND_API_KEY="re_123456789"
ADMIN_NOTIFICATION_EMAIL="facilities@company.com"
EMAIL_FROM_ADDRESS="Company Pickleball <pickleball@company.com>"

CRON_SECRET="your-secure-random-token"
```

### 3. Apply Supabase Database Migrations
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the migration script in `supabase/migrations/20260925000000_init_schema.sql`.
3. Run the seed data script in `supabase/seed.sql`.

#### Seed Demo Credentials
| Role | Email | Password | Department |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.carlos@company.com` | `CompanyPass123!` | Facilities & Operations |
| **Employee** | `juan.delacruz@company.com` | `CompanyPass123!` | Engineering |
| **Employee** | `maria.santos@company.com` | `CompanyPass123!` | Human Resources |

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Deployment to Vercel

### Option A: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```
Set environment variables when prompted or in the Vercel Dashboard:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL`
- `EMAIL_FROM_ADDRESS`
- `CRON_SECRET`

### Option B: Deploy via GitHub / GitLab / Bitbucket
1. Push repository to your Git provider.
2. Import project in [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add the keys from `.env.example`.
4. Deploy! Vercel automatically configures the hourly cron job from `vercel.json`.

---

## 🔒 Security & Policies

- **Row Level Security (RLS)**: Enforced across all tables (`profiles`, `courts`, `court_slots`, `reservations`, `court_blocks`, `system_settings`).
- **Edge Middleware**: Authenticates user sessions, refreshes auth tokens, and gates `/admin/*` routes strictly to accounts with `profiles.role = 'admin'`.
- **Admin Password Resets**: Executed via server actions using `SUPABASE_SERVICE_ROLE_KEY` isolated to the server runtime.
