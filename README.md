# Mukham web app

Next.js web app for Mukham, a workforce and attendance system. Attendance
is verified by GPS (the employee must be inside the office's radius) and a
live face check with AWS Face Liveness.

It talks to the FastAPI backend in `../mukham_fastAPI` (`/api/v1`). The
mobile app (`../mukham_mobile`) uses the same backend.

## Who uses it

| Role | Sign-in | What they do |
| --- | --- | --- |
| Organisation admin | `/login` (mobile number and password) | Dashboard, employees, departments, designations, shifts, office locations, tasks, org chart, attendance (including manual check-in and check-out) |
| Employee | `/member-login` (mobile number, password and live face check) | Check in and out with GPS and the face check, attendance history, tasks, profile and ID card |

A new organisation registers at `/register`. Anyone can open `/verify/<id>`,
the page an ID card's QR code opens.

## Run it

You need Node 18 or newer and the backend running on port 8002 (see the
backend's README).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The app opens at http://localhost:3000.

### Settings (`.env.local`)

| Variable | Example | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_FASTAPI_URL` | `http://localhost:8002/api/v1/` | The backend, including `/api/v1/` |
| `NEXT_PUBLIC_AWS_REGION` | `ap-south-1` | Region of the face check |
| `NEXT_PUBLIC_AWS_IDENTITY_POOL_ID` | | Cognito identity pool that gives the browser short-lived credentials for the face check |

`NEXT_PUBLIC_*` values are built into the JavaScript bundle, so they must
never hold secrets.

## Checks and builds

```bash
npm run lint    # lint
npm run build   # production build
npm start       # serve the production build on port 3000
```

### Docker

`.env.local` is not copied into the image, so pass the settings as build
arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_FASTAPI_URL=https://api.example.com/api/v1/ \
  --build-arg NEXT_PUBLIC_AWS_REGION=ap-south-1 \
  --build-arg NEXT_PUBLIC_AWS_IDENTITY_POOL_ID=<pool id> \
  -t mukham-web .
docker run -p 3000:3000 mukham-web
```

## Layout

| Path | What it holds |
| --- | --- |
| `app/` | Pages (Next.js App Router). `(auth)/` is admin sign-in, registration and password reset; `member/` and `member-login/` are the employee's area |
| `components/` | Shared components; `components/ui/` is the shadcn/ui kit |
| `context/AuthContext.jsx` | The backend connection (Axios), tokens and session checks |
| `hooks/`, `lib/` | Shared hooks and helpers |
| `scripts/` | Development helpers |

## Tech

Next.js 13 (App Router), React 18, Tailwind CSS with shadcn/ui, Axios,
Recharts, Leaflet maps, and AWS Amplify's Face Liveness component.

## Sibling repositories

| Folder | What it is |
| --- | --- |
| `mukham_fastAPI` | Backend API (FastAPI, PostgreSQL, Alembic) |
| `mukham_frontend` | This web app |
| `mukham_mobile` | Mobile app (Expo, React Native) |
