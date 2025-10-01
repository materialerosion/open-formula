#!/bin/bash

# Database setup script for PostgreSQL migration
# This script will create the necessary tables for the chat application

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env.local file"
    echo "Example: DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    exit 1
fi

echo "Running database migrations..."

# Run the migration script
psql $DATABASE_URL -f migrations/001_initial_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
else
    echo "❌ Database migration failed"
    exit 1
fi