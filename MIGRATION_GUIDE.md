# Database Migration Setup Guide

## Overview
This guide will help you complete the migration from Supabase to PostgreSQL with NextAuth.

## What We've Completed ✅

1. **Removed Supabase Dependencies**: Updated all components to use NextAuth instead of Supabase auth
2. **Created PostgreSQL Database Layer**: New `lib/postgres.ts` with connection pooling
3. **Updated Database Functions**: `lib/db.ts` now uses raw PostgreSQL queries instead of Supabase client
4. **Created API Routes**: New REST endpoints at `/api/chats` and `/api/chats/[id]/messages`
5. **Updated Components**: 
   - `SideNavBar` now uses NextAuth session and API calls
   - `ChatPanel` uses API endpoints for all database operations
   - `UserButton` uses NextAuth signOut
6. **Fixed SSR Issues**: Added proper browser checks for localStorage access

## Next Steps Required ⚠️

### 1. Set up PostgreSQL Database

You need to configure a PostgreSQL database. You have several options:

#### Option A: Local PostgreSQL (Recommended for development)
```bash
# Install PostgreSQL (if not already installed)
# On Ubuntu/Debian:
sudo apt update && sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create a database and user
sudo -u postgres psql
CREATE DATABASE open_artifacts;
CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE open_artifacts TO your_username;
\q
```

#### Option B: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name postgres-db -e POSTGRES_DB=open_artifacts -e POSTGRES_USER=your_username -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:15
```

#### Option C: Cloud PostgreSQL
Use services like:
- Supabase (PostgreSQL only, without auth)
- Railway
- Render
- AWS RDS
- Google Cloud SQL

### 2. Update Environment Variables

Update your `.env` file with the PostgreSQL connection string:

```env
# Replace the empty DATABASE_URL with your PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/open_artifacts
```

### 3. Run Database Migration

After setting up PostgreSQL and updating the DATABASE_URL:

```bash
# Make sure you have psql installed
# Run the migration script
./scripts/setup-db.sh

# Or manually:
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### 4. Test the Application

```bash
npm run dev
```

Navigate to `/new` and verify that:
- The sidebar loads without errors
- You can create new chats
- Messages are saved and retrieved properly

## Current Database Schema

The migration creates these tables:

- `users` - User profiles (optional, NextAuth handles most user data)
- `chats` - Chat conversations linked to NextAuth user IDs
- `messages` - Individual messages within chats with JSON attachments

## Troubleshooting

### Connection Refused Error
- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check firewall settings
- For Docker: ensure port 5432 is exposed

### Authentication Issues
- Verify Azure AD credentials in `.env`
- Check NEXTAUTH_URL matches your development URL
- Ensure NEXTAUTH_SECRET is set

### Migration Failures
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
- Verify database user permissions
- Ensure database exists before running migrations

## Benefits of This Migration

✅ **Better Performance**: Direct PostgreSQL queries instead of Supabase overhead
✅ **Full Control**: Complete ownership of your database and auth flow
✅ **Cost Effective**: No Supabase subscription fees
✅ **Scalability**: Can optimize PostgreSQL specifically for your needs
✅ **Security**: Azure AD integration with your organization's identity provider