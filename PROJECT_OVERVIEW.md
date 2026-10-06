# Mukham — Project Overview

> A plain-language, in-depth explanation of what this codebase is, what it does, and how it's built.
> This file documents the **frontend** repo (`mukham_frontend`), which talks to a separate Django **backend** repo (`mukham_backend`) and AWS services.

---

## 1. What is Mukham, in one sentence

Mukham is a **workforce / organization management web app** — think "HR + attendance system" — that lets a company track **employees, departments, designations, shifts, office locations, and attendance**, with attendance being verified using **GPS geofencing + AWS face biometrics** instead of a simple punch-in button.

The name "Mukham" (मुखम्) means **"face"** in Sanskrit/several Indian languages — fitting, since the product's core differentiator is **face-based identity verification** for attendance.

---

## 2. The problem it solves

Normal attendance systems can be cheated: someone can punch in for a friend, or mark "present" from home. Mukham tries to close that gap by requiring, each time an employee starts a shift:

1. **Proof of location** — the employee's phone/browser GPS must be within a configurable radius (100 meters by default) of the organization's registered office coordinates.
2. **Proof of identity** — the employee's live face must match their enrolled face, verified either via a simple webcam capture against AWS Rekognition, or via **AWS Amplify's Face Liveness** flow (which also detects spoofing — e.g. holding up a photo/video instead of a real face).

Only when **both** checks pass does the system record a "check-in."

---

## 3. Who uses it (two distinct user roles)

The app is split into two completely separate login flows and UIs:

| Role | Login route | Purpose |
|---|---|---|
| **Organization / Admin** | `/login` (mobile number + password) | Manages the company: creates departments, designations, shifts, office locations, and employees; views dashboards; manually marks/edits attendance. |
| **Member / Employee** | `/member-login` (mobile number + password + face biometric) | A normal employee who logs in, enrolls/verifies their face, starts/ends their own shift (with GPS + face check), and views their own attendance history. |

A brand-new organization can self-register at `/register` (name, email, mobile — the backend emails/returns a generated password).

---

## 4. Tech stack

### Frontend (this repo)
| Layer | Technology |
|---|---|
| Framework | **Next.js 13** (App Router, `app/` directory) |
| UI library | **React 18** |
| Styling | **Tailwind CSS** + `tailwindcss-animate`, custom dark "glass/aurora" theme (forced dark mode via `next-themes`) |
| Component kit | **shadcn/ui** — i.e. Radix UI primitives (dialog, select, dropdown, tabs, toast, etc.) wrapped in `components/ui/*.tsx`, assembled with `class-variance-authority` + `tailwind-merge` + `clsx` |
| Forms/validation | `react-hook-form` + `zod` + `@hookform/resolvers` |
| HTTP client | **Axios** (central instance in `context/AuthContext.jsx`) |
| Auth token handling | JWT stored in `localStorage`, decoded client-side with `jwt-decode` |
| Maps | **Leaflet** (OpenStreetMap tiles + Esri satellite tiles), with **Nominatim** for address search |
| Charts | **Recharts** (bar/line/pie charts on dashboards) |
| Camera / biometrics | `react-webcam` (plain webcam capture), **`@aws-amplify/ui-react-liveness`** + **`aws-amplify`** (official AWS Face Liveness UI component) |
| Phone input | `react-phone-input-2` |
| Notifications | `sonner` + custom `useToast` hook |
| Icons | `lucide-react` |
| Dates | `date-fns` |

### Backend (sibling repo, referenced but not inside this folder)
- A **Django** project (`mukham_backend`, started via `python manage.py runserver`), exposing a REST API under `/api/`.
- Handles organization/member auth (JWT issuance), employee/department/designation/shift CRUD, attendance records, geolocation storage, and the **AWS Rekognition** face-matching + **AWS Liveness session** endpoints (`face/check-status/`, `face/verify/`, `face/liveness/create/`, `face/liveness/result/`).

### Cloud / AWS services used
- **AWS Cognito Identity Pool** — gives the browser temporary, unauthenticated-guest AWS credentials (`lib/amplify-config.js`) so the browser can talk directly to AWS's Face Liveness streaming session.
- **AWS Rekognition Face Liveness** — a managed, anti-spoofing "look at the camera and move your head" check, rendered via the `FaceLivenessDetectorCore` component on the member login page.
- (Via the backend) **AWS Rekognition face comparison/collections** for registering and matching employee faces.

### Dev/infra
- `Dockerfile` — simple Node 18 Alpine container running `npm run dev`.
- `scripts/dev-with-backend.js` — a convenience script that spawns **both** the Django backend (port 8001) and the Next.js frontend together with one command, assuming the backend lives at `../mukham_backend` and a `.venv` Python environment at the repo root.
- `.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AWS_REGION`, `NEXT_PUBLIC_AWS_IDENTITY_POOL_ID`.

---

## 5. How the pieces fit together (architecture)

```
Browser (Next.js app, client components)
   │
   ├── Axios ("context/AuthContext.jsx") ──► Django REST API (NEXT_PUBLIC_API_URL, default :8001)
   │        - JWT Bearer token attached automatically via interceptor
   │        - 401 responses auto-logout + redirect to "/"
   │
   ├── AWS Amplify (Cognito guest credentials) ──► AWS Rekognition Face Liveness (streaming session)
   │        - Session created by backend ("face/liveness/create/")
   │        - Rendered/driven in-browser by <FaceLivenessDetectorCore>
   │        - Result reported back to backend ("face/liveness/result/") for the final verdict
   │
   ├── Browser Geolocation API ──► compared (Haversine formula) against office lat/lon from backend
   │
   └── Leaflet + OpenStreetMap/Esri/Nominatim ──► map UI + address search (admin "Location" page)
```

Almost every page is a **client component** (`"use client"`), since the app relies heavily on browser-only APIs: `localStorage`, `navigator.geolocation`, `navigator.mediaDevices` (webcam), and interactive maps.

---

## 6. Authentication model

Two parallel, independent auth flows share one Axios instance and one `AuthContext`:

- **Org login** (`loginUser`) → `POST org/login/` → stores `access_token`, `refresh_token`, `org_id` in `localStorage`.
- **Member login** (`loginMember`) → `POST member/login/` → stores `access_token`, `refresh_token`, `user_id`, `user_mobile`.
- Every outgoing request automatically attaches `Authorization: Bearer <access_token>` (Axios request interceptor).
- A `401` response globally clears storage and redirects to `/` (unless already on a public/login page or embedded in an iframe) — this is a response interceptor registered inside `AuthProvider`.
- `loggedInCheck()` runs on mount/route-change and calls `GET employee-details/` to rehydrate the `user` object (works for both org and member sessions — the backend returns whichever profile matches the token).
- There's no refresh-token rotation logic in the frontend; expiry is handled reactively via the 401 interceptor and via manual `jwt-decode` expiry checks sprinkled across pages (`verifyToken()` helpers).

---

## 7. Feature-by-feature walkthrough

### 7.1 Public landing page (`/`)
Marketing-style hero page ("MUKHAM" branding) with three entry points: **Org Login**, **Member Access**, **Establish Org** (register).

### 7.2 Organization side (admin)
All admin pages share a persistent **`Sidebar`** (and optionally a `Header`) with nav items: Dashboard, Attendance, Designation, Department, Employees, Location, Shifts, Profile.

- **`/dashboard`** — overview stats (total employees, active shifts, attendance rate, active locations) pulled from `list/`, `shifts/`, `locations/`, and `departments/leaderboard/`; renders bar/line/pie charts via Recharts.
- **`/employees`** — full employee CRUD: add/edit/delete employees, assign department/designation/shift/office-location, phone input with country codes, CSV/export of the employee list, and a **Virtual ID Card** modal (`components/VirtualIDCard.js`) — a flippable 3D card showing photo, name, ID, department, plus a **QR code** (generated via `api.qrserver.com`) encoding verification text.
- **`/department`** and **`/designation`** — simple CRUD list/forms for organizational taxonomy, scoped by `org_id`.
- **`/shifts`** — define shift name + start/end time, used later to gate when an employee is allowed to check in/out.
- **`/geolocation`** — interactive Leaflet map (street + satellite toggle) where the admin clicks to drop a pin (or searches an address via Nominatim) and saves it as a named office **Location** tied to the org; saved locations are listed with delete support. This is the "geofence center" every employee's GPS gets compared against.
- **`/attendance`** — admin-side attendance console: a calendar + employee picker for **manual** check-in/out, plus a searchable, expandable table of all employees' attendance logs (grouped per employee, showing per-day in/out/hours/status).
- **`/profile`** — edit the organization's own name/email/details; also reused (via `?embed=true` query param, rendered inside an `<iframe>`) as the **member's** profile view (see `ProfileMember.jsx`) — a clever reuse trick so one page serves two contexts.

### 7.3 Member side (employee)
- **`/member-login`** — two-step flow:
  1. Verify mobile number + password against `member/login/`.
  2. **AWS Face Liveness** step: creates a liveness session on the backend, runs Amazon's `FaceLivenessDetectorCore` widget in-browser (using temporary Cognito credentials), and sends the session result back to the backend. If the member has no face enrolled yet, this *registers* their face; if they do, it *verifies* them. Only after this succeeds does the actual `loginMember()` call complete and redirect to `/member`.
- **`/member`** (and the near-duplicate **`/dashboard2`**, and **`DashboardMember.jsx`**) — the employee's home screen:
  - Live clock, department/designation/shift summary cards.
  - **"Start Shift" flow**: requests browser GPS → computes Haversine distance to the org's registered office location → if within 100m, checks the backend for a registered face → opens a webcam dialog (`react-webcam`) → captures a frame → posts it to `face/verify/` → if Rekognition confidence ≥ 90%, calls `mark-attendance/` to record check-in. Any failure (too far away, no face registered, low confidence) blocks the attendance write and shows a clear error — attendance is never silently faked.
  - **"End Session"** button to check out.
  - A Recharts bar chart of historical hours worked, and a scrollable activity/log feed.
  - A **Profile tab** (`?tab=profile`) showing personal info and a "Terminate Session" (logout) button.
- **`/profile`** embedded via iframe (see above) — i.e. `ProfileMember.jsx` is just a thin wrapper that iframes the org `/profile` page in embed mode and auto-resizes to fit content.

### 7.4 Public verification page (`/verify/[id]`)
A **no-login-required** page meant to be opened by scanning the QR code on an employee's Virtual ID Card. It fetches the employee by ID from a (currently open) `employees/` endpoint and displays a "Verified ✅" screen with photo, name, department, and designation, plus a "Save to Contacts" button that generates and downloads a `.vcf` vCard file client-side.

### 7.5 Auth utility pages
`/login`, `/register`, `/forgot-password`, `/reset-password` — standard org-side auth forms, all going through the shared `Axios`/`AuthContext` helpers.

---

## 8. Notable implementation details worth knowing

- **Dark mode is forced** — `ThemeProvider` is configured with `forcedTheme="dark"` and `enableSystem={false}`; there is currently no real light-mode toggle, despite `next-themes` being wired up.
- **Iframe-embedding pattern** — `DashboardMember.jsx` and `ProfileMember.jsx` are thin `<iframe>` wrappers around `/dashboard2` and `/profile?embed=true`. Several pages/components (`Sidebar`, `Header`, `AuthContext`) explicitly detect `window.self !== window.top` (i.e. "am I inside an iframe?") to hide navigation chrome and relax auth redirects for the embedded view. This suggests Mukham pages are designed to be embeddable inside another host app/dashboard.
- **Geofencing math** lives entirely on the frontend (Haversine formula, 100m constant `GEOFENCE_RADIUS_METERS`), duplicated independently in `app/member/page.jsx` and `app/dashboard2/page.jsx` — these two pages are near-duplicates of the same "employee home" screen (likely one is a legacy/alternate version).
- **Two different face-check UX paths exist**: the simple `FaceCamera.jsx` (plain webcam snapshot sent to backend for Rekognition comparison, used during attendance) vs. the dedicated AWS **Face Liveness** widget (used specifically at member login/enrollment, which is more rigorous and spoof-resistant).
- **Token verification is defensive and repeated** — most admin pages independently decode the JWT (`jwt-decode`) to check expiry and also round-trip a `token/verify/` call before fetching data, rather than relying solely on the global Axios 401 interceptor.
- **No server-side auth guarding** — Next.js middleware/route guards aren't used; all auth/redirect logic happens client-side after mount (`"use client"` + `useEffect`), so pages briefly render before any redirect occurs.

---

## 9. Key backend API endpoints the frontend depends on

(Inferred from frontend calls — actual implementation lives in `mukham_backend`.)

| Endpoint | Purpose |
|---|---|
| `org/signup/`, `org/login/`, `org/logout/` | Organization auth |
| `member/login/` | Employee auth |
| `token/verify/` | JWT validity check |
| `employee-details/` | Returns the logged-in user's profile (works for org admin context via `org_id`, or employee context via `profile`) |
| `list/`, `employees/` | Employee list/CRUD |
| `departments/`, `departments/leaderboard/` | Department CRUD + punctuality leaderboard |
| `designations/` | Designation CRUD |
| `shifts/` | Shift CRUD |
| `locations/`, `organisations/{id}/` | Office location CRUD + org details |
| `attendance-history/`, `mark-attendance/` | Attendance log fetch + check-in/out |
| `face/check-status/`, `face/verify/` | Rekognition face-registered check + face match |
| `face/liveness/create/`, `face/liveness/result/` | AWS Face Liveness session lifecycle |
| `profile/{org_id}/` | Update org profile |

---

## 10. Folder structure cheat-sheet

```
app/                      Next.js App Router pages (each folder = a route)
  (auth)/                 Route group: login, register, forgot/reset password
  dashboard/, dashboard2/  Org dashboard / legacy-ish employee dashboard
  employees/, department/, designation/, shifts/   Admin CRUD screens
  attendance/              Admin attendance console
  geolocation/             Office-location map manager
  member/, member-login/   Employee portal + its biometric login
  profile/                 Shared org/employee profile (iframe-reused)
  verify/[id]/             Public QR-scan verification page
components/
  ui/                      shadcn/Radix-based primitives (buttons, dialogs, etc.)
  Sidebar.js, Header.js    Navigation shells (role-aware: org vs member)
  FaceCamera.jsx           Plain webcam capture widget
  VirtualIDCard.js         Flippable ID card + QR code
  DashboardMember.jsx, ProfileMember.jsx   Iframe wrappers for embedding
context/AuthContext.jsx    Axios instance, interceptors, all auth logic/state
lib/amplify-config.js      AWS Amplify (Cognito) configuration
hooks/use-toast.ts         Toast notification hook
scripts/dev-with-backend.js  Runs Django + Next.js together for local dev
```

---

## 11. In short

Mukham is a **Next.js + Django** HR/attendance platform whose headline feature is **biometric, location-verified attendance**: an employee can only clock in if they are physically near the office (GPS) *and* their face matches their enrolled identity (AWS Rekognition / AWS Face Liveness), with a full admin suite on top for managing employees, departments, designations, shifts, office locations, and reviewing attendance — plus a QR-code-based public ID verification page for quick, no-login identity checks.
