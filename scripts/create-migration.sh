#!/bin/bash

# Create initial migration
echo "Creating initial migration..."

# Generate Prisma client first
npm run prisma:generate

# Create migration
npx prisma migrate dev --name init

echo "✅ Migration created successfully!"

