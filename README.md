# Al-Mahir Academy Portal

The management portal for Al-Mahir Academy, an online academy. Admins,
moderators, teachers, students and parents each sign in to their own area to
manage classes, schedules, attendance, reports, invoices and teacher payments.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS and
Supabase (Postgres + Auth). Deployed on Vercel.

## Roles

Every user has a `role` on their `profiles` row. `src/middleware.ts` sends
anyone who isn't signed in back to the login page, and blocks each role from
the other roles' routes.

| Role | Area | What they can do |
| --- | --- | --- |
| Admin | `/admin` | Everything: users, classes, schedule, accounting, invitations, resources, reports, rules and admin tools |
| Moderator | `/admin` | Same as admin, except the admins list, accounting, invitations and adding users |
| Teacher | `/teacher` | Their classes, students, schedule, attendance, session reports and remarks, payments, availability |
| Student | `/student` | Their classes, schedule, reports, invoices and resources |
| Parent | `/parent` | The same for each of their children, with a switcher between children |

Students can be **independent** (with their own login) or **dependent**
(a child profile managed by a parent account).

## Features

- **Classes and sessions.** Recurring classes with per-day times and a
  timezone. Sessions can be cancelled, with a reason, or rescheduled. Checks
  for teacher and student scheduling conflicts.
- **Schedule.** Weekly, monthly calendar and list views, shown in each
  user's own timezone.
- **Attendance.** Separate student and teacher attendance for each session.
- **Session reports.** Teacher remarks and per-student notes after each
  session.
- **Reschedule requests.** Teachers, students and parents request a new time.
  Admins approve or reject.
- **Accounting.** Student subscriptions and invoices, teacher payments
  calculated from hourly rates and session duration, and payment status
  tracking.
- **Resources.** Learning materials attached to classes.
- **Onboarding.** Admins send email invitations with a sign-up link for a
  specific role. There is also a public registration form.
- **Notifications.** In-app notification bell.
- **Support tickets.** Users submit tickets from the portal, which are
  emailed to the academy.
- **Admin tools.** Bulk class-session tools with Excel export.
- **Rules.** Academy rules and guidelines for students and teachers
  (`public/student_rules.md`, `public/teacher_rules.md`).
- Light and dark themes.

## Project structure

```
src/
  app/
    (auth)/signup/[token]   sign-up from an invitation link
    (users)/admin|teacher|student|parent/   one area per role
    api/                    invitations, registration, users, support tickets
    page.tsx                login
  components/               shared UI (tables, schedule views, forms, sidebars)
  components/ui/            shadcn/ui primitives
  contexts/                 timezone and student-switcher state
  hooks/                    auth, notifications, toasts
  lib/
    get/ post/ put/ delete/ Supabase data access, grouped by operation
    auth/                   sign-in and sign-out actions
    services/               notification service
    utils/                  email, timezone, conflict checking, formatting
  utils/supabase/           Supabase clients (browser, server, middleware)
  middleware.ts             auth and role-based route protection
migrations/                 one-off SQL scripts, reviewed before running
public/                     images and rules documents
```

## Getting started

Requirements: Node.js 20+ and a Supabase project with the portal's schema.
The schema is not included in this repo.

```bash
npm install --legacy-peer-deps
# create .env.local with the variables below
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, used server-side only by the API routes |
| `NEXT_PUBLIC_APP_URL` | Base URL of the portal, used in invitation links |
| `GMAIL_EMAIL` | Gmail account that sends invitation and ticket emails |
| `GMAIL_APP_PASSWORD` | App password for that Gmail account |

Never commit these values. `.env*` files are already git-ignored.

If you use a different Supabase project, update the image host in
`next.config.ts` (`images.remotePatterns`) to match.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment

The app is deployed on Vercel (`vercel.json`). It installs with
`--legacy-peer-deps`, runs in the `iad1` region, and API routes have a
30-second limit. Set the environment variables above in the Vercel project
settings.

## Database migrations

`migrations/` holds one-off SQL data fixes. They aren't applied
automatically. Read each script's header, then run it by hand in the
Supabase SQL editor.
