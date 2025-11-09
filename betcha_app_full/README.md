# Betcha Fullstack (Demo)

## Quick start (local)

1. Install Docker and Docker Compose.
2. Copy `.env.example` into `backend/.env` and set your STRIPE keys if you have them.
3. Run `docker-compose up --build` (this will start Postgres, backend and frontend).
4. Backend: http://localhost:8080
5. Frontend: http://localhost:5173

## Notes
- This is a demo scaffold. For production, secure secrets, enable HTTPS, configure CORS and add monitoring.
- Use Stripe CLI to forward webhooks locally if using Stripe.
