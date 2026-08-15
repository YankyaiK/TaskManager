# Task Manager

A CRUD-based project/task management tool built to practice full-stack development with AI-assisted workflows.

## Stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React
- Auth: JWT

## Status
🚧 In development — Sprint 0

## Setup
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your local PostgreSQL credentials
4. Run the schema: `psql -U postgres -d task_manager -f schema.sql` (or run it via pgAdmin's Query Tool)
5. Run `npm run dev` to start the server