# Wooden Houses Kenya

Full-stack web platform for Wooden Houses Kenya — a public marketing site with a private admin dashboard for managing contacts, quotes, and newsletter subscribers.

## Architecture

```
wooden-houses-kenya/
├── frontend/          # Next.js 16 (App Router) — public site + admin dashboard
├── backend/           # ASP.NET Core 8 Web API
│   └── WoodenHousesAPI/
├── deploy/            # Apache configs, systemd services, deploy scripts
└── package.json       # Workspace root (scripts only)
```

The frontend serves two distinct applications from a single Next.js build:

| Domain | Path group | Purpose |
|---|---|---|
| `woodenhouseskenya.com` | `app/(site)/` | Public marketing site |
| `admin.woodenhouseskenya.com` | `app/(admin)/` | Admin dashboard |

Routing between the two is handled by `src/proxy.ts` (Next.js middleware). In local development, append `?_admin=1` to any URL once to enter admin mode — after logging in, a `wh_is_admin` cookie maintains the session automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS v4 |
| UI components | shadcn/ui, Lucide icons, Sonner (toasts) |
| State management | Zustand |
| Backend | ASP.NET Core 8, Entity Framework Core 8 |
| Database | PostgreSQL |
| Auth | JWT via httpOnly cookie |
| Email | SMTP (configurable) |
| Server | Ubuntu + Apache reverse proxy |

## Local Development

### Prerequisites

- Node.js 20+
- .NET 8 SDK
- PostgreSQL 15+

### 1. Clone and install

```bash
git clone https://github.com/your-org/wooden-houses-kenya.git
cd wooden-houses-kenya
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # or create manually — see below
npm install
npm run dev
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Visit `http://localhost:3000` for the public site.
Visit `http://localhost:3000/login?_admin=1` for the admin panel.

### 3. Backend

```bash
cd backend/WoodenHousesAPI
```

Create `appsettings.Development.json` (already in `.gitignore`) with your local values:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=woodenhouses_db;Username=postgres;Password=yourpassword"
  },
  "Jwt": {
    "Key": "your-64-character-random-secret-key-here-change-this-in-production"
  },
  "Email": {
    "Host": "smtp.yourprovider.com",
    "Port": 587,
    "Username": "your@email.com",
    "Password": "your-email-password"
  },
  "Seed": {
    "AdminEmail": "admin@example.com",
    "AdminName": "Admin",
    "AdminPassword": "YourSecurePassword123"
  }
}
```

```bash
dotnet ef database update    # run migrations
dotnet run                   # starts on http://localhost:5000
```

The database is seeded automatically on first run — an admin user is created using the `Seed` credentials above.

### Running both together

From the project root:

```bash
npm run dev          # runs both frontend (port 3000) and backend (port 5000)
```

(Configured via `package.json` workspace scripts using `concurrently`.)

## Admin Dashboard

| Route | Description |
|---|---|
| `/login` | Admin login |
| `/dashboard` | Overview stats |
| `/dashboard/contacts` | Contact form submissions |
| `/dashboard/contacts/[id]` | Contact detail, status, notes |
| `/dashboard/quotes` | All quotations |
| `/dashboard/quotes/new` | Create quote (optionally from a contact) |
| `/dashboard/quotes/[id]` | A4 printable quotation document |
| `/dashboard/quotes/[id]/edit` | Edit quote + line items |
| `/dashboard/newsletter` | Newsletter subscribers |
| `/dashboard/settings` | Profile & password |

**Default admin credentials** are set via the `Seed` section in `appsettings.json`. Change the password immediately after first login.

## Environment Variables

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |

### Backend (`appsettings.json` / `appsettings.Production.json`)

| Key | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Jwt:Key` | JWT signing secret (min 64 chars in production) |
| `Jwt:ExpiryHours` | Access token expiry (default: 8) |
| `Email:Host/Port/Username/Password` | SMTP credentials |
| `Cors:AllowedOrigins` | Comma-separated list of allowed frontend origins |
| `Seed:AdminEmail/AdminName/AdminPassword` | Initial admin account |

## Database Migrations

```bash
cd backend/WoodenHousesAPI

# Apply all pending migrations
dotnet ef database update

# Create a new migration
dotnet ef migrations add MigrationName

# Roll back one migration
dotnet ef database update PreviousMigrationName
```

## Deployment

The `deploy/` folder contains:

- `deploy.sh` — automated deployment script
- `apache-frontend.conf` — Apache virtual host for the Next.js frontend
- `apache-api.conf` — Apache reverse proxy for the ASP.NET Core API
- `frontend.service` — systemd service for `next start`
- `backend.service` — systemd service for `dotnet run`
- `server-setup.sh` — initial server provisioning script

### Production setup summary

1. Run `deploy/server-setup.sh` on a fresh Ubuntu server
2. Configure Apache with `apache-frontend.conf` and `apache-api.conf`
3. Register systemd services with `frontend.service` and `backend.service`
4. Set `appsettings.Production.json` with real credentials (this file is gitignored)
5. Run `deploy/deploy.sh` for subsequent deploys

### Production environment

The frontend expects `NEXT_PUBLIC_API_URL` to be set at build time:

```bash
NEXT_PUBLIC_API_URL=https://api.woodenhouseskenya.com npm run build
```

The backend reads `appsettings.Production.json` when `ASPNETCORE_ENVIRONMENT=Production`.

## API Overview

All admin endpoints require authentication (JWT cookie).

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, sets httpOnly JWT cookie |
| `POST` | `/api/auth/logout` | Clears JWT cookie |
| `GET` | `/api/auth/me` | Returns current user |
| `GET/POST` | `/api/admin/contacts` | List / create contacts |
| `GET/PUT/DELETE` | `/api/admin/contacts/{id}` | Contact CRUD |
| `GET/POST` | `/api/admin/quotes` | List / create quotes |
| `GET/PUT/DELETE` | `/api/admin/quotes/{id}` | Quote CRUD |
| `POST` | `/api/admin/quotes/{id}/send` | Email quote to customer |
| `GET` | `/api/admin/newsletter` | List subscribers |
| `POST` | `/api/newsletter/subscribe` | Public subscribe endpoint |
| `POST` | `/api/contact` | Public contact form submission |

> **Note:** Quote pricing (`FinalPrice`) is always computed server-side. The frontend never sends a `finalPrice` value — the backend calculates it from line items or `basePrice` minus discount.

## Project Structure

```
frontend/src/
├── app/
│   ├── (admin)/
│   │   ├── (auth)/login/          # Admin login page
│   │   └── (dashboard)/dashboard/ # All dashboard pages
│   └── (site)/                    # Public site pages
├── components/
│   ├── core/                      # Shared: Header, Footer, Hero, etc.
│   ├── dashboard/                 # Dashboard-specific widgets
│   ├── contacts/                  # ContactsTable
│   ├── quotes/                    # QuotesTable
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── api/client.ts              # Typed Axios API client
│   └── store/authStore.ts         # Zustand auth store
└── proxy.ts                       # Next.js middleware (domain routing)

backend/WoodenHousesAPI/
├── Controllers/
│   ├── Admin/                     # Protected admin endpoints
│   └── Public/                    # Public endpoints (contact, newsletter)
├── Data/                          # EF Core DbContext + migrations
├── Models/                        # Entity models
├── Services/                      # Email service, etc.
└── Program.cs                     # App bootstrap, DI, middleware pipeline
```

## License

Private — all rights reserved. Wooden Houses Kenya.
