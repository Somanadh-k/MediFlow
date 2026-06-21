# MediFlow AI - Backend

This is the Node.js backend foundation for the MediFlow AI Inventory Intelligence Agent. It is built to run independently and connect directly to your Supabase PostgreSQL database using the Service Role Key.

## Features

- **Authentication Module**: JWT and role-based access (OWNER, PHARMACIST, STAFF).
- **Medicine Management**: Full CRUD operations with comprehensive audit logging.
- **Inventory Monitoring**: Automated background agent (runs hourly) that flags low stock and out-of-stock items.
- **Expiry Monitoring**: Automated background agent (runs daily) that detects expiring medicines, automatically moves expired items to `quarantine_inventory`, and triggers email alerts.
- **Barcode Validation**: Pre-validates a medicine scan against its status (EXPIRED, QUARANTINED, Out of stock).
- **Billing Protection**: Strict pre-billing checks to ensure expired or quarantined items cannot be sold.
- **Notification System**: Nodemailer integration to send automated alerts for stock and expiry events.
- **Audit Logging**: Comprehensive logging for authentication, stock changes, and quarantine actions.

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:
```bash
cp .env.example .env
```

Ensure that you use your **Supabase Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`) and not the Anon key, as the backend directly interacts with the database bypassing RLS when necessary (since it's a secure backend environment acting on behalf of the system).

### 2. Install Dependencies

```bash
npm install
```

### 3. Running the Server

Start in development mode (with nodemon):
```bash
npm run dev
```

Start in production mode:
```bash
npm start
```

## Available Scripts

- `npm start` - Starts the server (`node server.js`).
- `npm run dev` - Starts the server with Nodemon (`nodemon server.js`).

## Next Steps

1. Configure your email SMTP settings in `.env` to test the notification system.
2. Update the frontend React app to point its API requests to this new backend (default: `http://localhost:5000`).
3. Set up the `node-cron` jobs in a production environment or gradually transition them to n8n workflows as your architecture evolves.
