# Deployment Readiness Checklist

Deferred items to address before public deployment. Not urgent during core CRUD build-out (Sprints 1-3), but must be a dedicated sprint before going live.

## Security Hardening
- [ ] Add rate limiting on auth routes (`express-rate-limit`) — prevent brute-force login attempts and spam registration
- [ ] Add rigorous input validation (`express-validator`) — email format, password strength (min length, complexity), username character restrictions, max field lengths
- [ ] Enforce minimum password requirements at registration (deferred from Ticket 7)
- [ ] Review all endpoints for consistent, non-leaky error messages (pattern already established in auth — extend to Projects/Tasks/Comments)
- [ ] Add CORS configuration (`cors` package) once frontend origin is known

## Infrastructure
- [ ] Choose hosting for backend (Railway / Render / Fly.io — beginner-friendly, auto HTTPS)
- [ ] Choose hosting for PostgreSQL (same platform, or dedicated host like Supabase/Neon)
- [ ] Confirm HTTPS is enforced in production (should be automatic via hosting platform)
- [ ] Set production environment variables directly on hosting platform (DB credentials, JWT_SECRET) — never commit these, never reuse local dev secrets
- [ ] Run schema.sql against production database separately from local dev DB

## Before Going Live
- [ ] Load test basic endpoints at expected traffic level
- [ ] Add pagination to list endpoints (Tasks especially) if not already done during Tasks sprint
- [ ] Final review of JWT expiry time and refresh strategy (currently 2h expiry, no refresh token — decide if that's acceptable for public use)
- [ ] Backup strategy for production database

---
*Last updated: Sprint 1, Ticket 8 complete*