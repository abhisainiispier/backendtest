#!/bin/sh
# Database initialization script for Docker
# All database credentials are loaded from environment variables

# Load environment variables
if [ -f .env.docker ]; then
  export $(cat .env.docker | grep -v '#' | xargs)
fi

# Validate required environment variables
if [ -z "$DB_HOST" ]; then
  echo "✗ ERROR: DB_HOST environment variable is not set"
  exit 1
fi

if [ -z "$DB_PORT" ]; then
  echo "✗ ERROR: DB_PORT environment variable is not set"
  exit 1
fi

echo "Waiting for MySQL to be ready..."
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"

# Wait for MySQL to be available using environment variables
RETRY_LIMIT=30
RETRY_COUNT=0

while ! nc -z $DB_HOST $DB_PORT; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -ge $RETRY_LIMIT ]; then
    echo "✗ ERROR: MySQL did not become ready after ${RETRY_LIMIT} attempts"
    echo "✗ Could not connect to MySQL at $DB_HOST:$DB_PORT"
    exit 1
  fi
  
  echo "MySQL is unavailable at $DB_HOST:$DB_PORT - sleeping (Attempt $RETRY_COUNT/$RETRY_LIMIT)..."
  sleep 2
done

echo "✓ MySQL is ready at $DB_HOST:$DB_PORT"
echo "✓ Starting Node.js server..."

# Start the application
exec npm start
