# Scripts

This directory contains utility scripts for the Raven UGC Platform.

## Planned Scripts

### setup.sh
Initial project setup script (coming soon)

```bash
#!/bin/bash
# Setup script for Raven UGC Platform

# Check prerequisites
echo "Checking prerequisites..."
node --version || { echo "Node.js required"; exit 1; }

# Copy environment file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file - please fill in your values"
fi

echo "Setup complete!"
```

### backup-workflows.sh
Export n8n workflows for version control

```bash
#!/bin/bash
# Backup n8n workflows to JSON files

N8N_URL="${N8N_API_URL:-http://localhost:5678}"
OUTPUT_DIR="./n8n/workflows"

# Export all workflows via n8n API
# (Implementation depends on n8n API)
```

### add-credits.sql
SQL script to manually add credits to a user

```sql
-- Usage: Replace USER_EMAIL and AMOUNT
-- Run in Supabase SQL Editor

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'USER_EMAIL';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Add credits
  UPDATE credits
  SET
    balance = balance + AMOUNT,
    total_purchased = total_purchased + AMOUNT
  WHERE user_id = v_user_id;

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'purchase', AMOUNT, 'Manual credit purchase');

  RAISE NOTICE 'Added % credits to user %', AMOUNT, v_user_id;
END $$;
```

## Usage

Scripts should be run from the project root directory:

```bash
# Make executable
chmod +x scripts/setup.sh

# Run
./scripts/setup.sh
```

## Contributing

When adding new scripts:

1. Add clear comments explaining purpose
2. Include usage instructions
3. Handle errors gracefully
4. Update this README
