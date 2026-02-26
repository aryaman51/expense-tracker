# Expense Tracker (Infra-Focused)

Minimal Node.js app for infra benchmarking:
- Runs in Docker
- Connects to AWS RDS (Postgres)
- Provides basic CRUD routes for users and expenses

## Run locally
```bash
docker build -t expense-tracker .
docker run -p 3000:3000 \
  -e DB_HOST=your-rds-endpoint \
  -e DB_USER=your-username \
  -e DB_PASS=your-password \
  -e DB_NAME=your-dbname \
  expense-tracker
