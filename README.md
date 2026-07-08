# Honestly

Honestly is an anonymous feedback web app. A user signs up with email verification, shares a public profile link, and receives anonymous messages that appear in a private dashboard.

The project is split into two apps:

- `client/` - React + TypeScript + Vite frontend
- `server/` - FastAPI backend with PostgreSQL

## What the app does

- Lets people create an account with email verification
- Supports login, logout, refresh tokens, and password reset
- Gives each user a public link at `/u/:username` for anonymous feedback
- Shows received messages in a protected dashboard
- Lets users manage account settings and toggle message visibility
- Sends transactional emails for verification and password recovery

## Tech Stack

### Frontend

- React 19  
- TypeScript
- Vite
- React Router
- Zustand for auth state
- React Hook Form + Zod for forms and validation
- Axios for API calls
- Tailwind CSS and custom UI components
- Sonner for toast notifications

### Backend

- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- Pydantic v2
- JWT auth with access and refresh tokens
- bcrypt password hashing
- Resend / fastapi-mail for email delivery
- SlowAPI for rate limiting

## Project Structure

```text
honestly/
├── client/
│   ├── src/
│   │   ├── components/        # layout, UI, route protection, and views
│   │   ├── lib/               # axios client
│   │   ├── schemas/           # validation schemas
│   │   ├── services/          # API helpers
│   │   ├── stores/            # auth state
│   │   ├── styles/            # global styles
│   │   ├── types/             # shared TypeScript types
│   │   └── utils/             # formatting, storage, error helpers
│   ├── package.json
│   └── vite.config.ts
└── server/
    ├── app/
    │   ├── app.py             # FastAPI app setup, CORS, routers, health check
    │   ├── config.py          # environment settings
    │   ├── database.py        # database connection/session helpers
    │   ├── models/            # ORM models
    │   ├── routers/           # auth, feedback, and user management endpoints
    │   ├── schemas/           # request/response models
    │   └── utils/             # auth, tokens, password, email helpers
    ├── main.py
    ├── requirements.txt
    └── docker-compose.yml
```

## Main User Flows

1. Register with email and username.
2. Verify the account with an OTP sent by email.
3. Log in and access the protected dashboard.
4. Share a public profile link like `/u/alice`.
5. Receive anonymous feedback on that public page.
6. Read, delete, or manage received messages from the dashboard.
7. Reset the password or change account settings when needed.

## Backend API Overview

The FastAPI server exposes routes for:

- Authentication: `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
- Account setup: `/auth/register`, `/verify-email`, `/resend-verification`
- Password recovery: `/forgot-password`, `/verify-reset-otp`, `/reset-password`
- User management: `/change-password`, `/me`, `/toggle-messages`
- Feedback: `/u/{username}`, `/u/{username}/status`, `/messages`, `/messages/count`

The server also provides a `/health` endpoint that checks database availability.

## Local Development

### 1. Start the backend

```bash
cd server
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
docker compose up -d
python main.py
```

The API runs at `http://localhost:8000` and the interactive docs are available at `http://localhost:8000/docs`.

### 2. Start the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at the Vite dev server URL shown in the terminal, usually `http://localhost:5173`.

## Environment Variables

The backend expects a configured `.env` file. Important values include:

- `DATABASE_*` for PostgreSQL connection details
- `SECRET_KEY` and `REFRESH_TOKEN_SECRET_KEY` for JWT signing
- `RESEND_API_KEY` and `MAIL_FROM_ADDRESS` for email delivery
- `FRONTEND_URL` and `BACKEND_URL` for CORS and email links
- `ENVIRONMENT` to control development versus production behavior

See `server/README.md` for backend-specific setup notes.

## Notes

- The frontend uses protected routes for dashboard and settings pages.
- The public write page is available at `/write` and `/u/:username`.
- The backend currently creates tables on startup from the SQLAlchemy models, so add migrations before production use.