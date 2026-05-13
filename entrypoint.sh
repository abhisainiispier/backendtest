#!/bin/sh
# Database initialization script for Docker

echo "Waiting for MySQL to be ready..."

# Wait for MySQL to be available
while ! nc -z mysql 3306; do
  echo "MySQL is unavailable - sleeping..."
  sleep 2
done

echo "MySQL is ready! Starting Node.js server..."

# Start the application
exec npm start
