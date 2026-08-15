# API Design

Base URL: `/api`

All endpoints (except register/login) require a valid JWT in the `Authorization: Bearer <token>` header.

---

## Auth

### POST /api/auth/register
Create a new user account.

**Request body:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "plaintext_password"
}
```

**Response (201):**
```json
{
  "user_id": 1,
  "username": "janedoe",
  "email": "jane@example.com"
}
```

### POST /api/auth/login
Authenticate and receive a JWT.

**Request body:**
```json
{ "username": "janedoe", "password": "plaintext_password" }
```

**Response (200):**
```json
{ "token": "eyJhbGciOi..." }
```

---

## Users

| Method | Path             | Auth required   | Description         |
|--------|------------------|-----------------|----------------------|
| GET    | /api/users/:id   | Yes             | Get a single user   |
| PATCH  | /api/users/:id   | Yes (self only) | Update own profile  |
| DELETE | /api/users/:id   | Yes (self only) | Delete own account  |

**PATCH /api/users/:id request body (any subset of):**
```json
{ "first_name": "Jane", "last_name": "Smith", "email": "jane.smith@example.com" }
```

---

## Projects

| Method | Path                | Auth required | Description                       |
|--------|---------------------|----------------|-------------------------------------|
| GET    | /api/projects       | Yes            | List projects the user is a member of |
| POST   | /api/projects       | Yes            | Create a new project                |
| GET    | /api/projects/:id   | Yes (member)   | Get project details                 |
| PATCH  | /api/projects/:id   | Yes (owner)    | Update project (name, status)       |
| DELETE | /api/projects/:id   | Yes (owner)    | Delete project (cascades tasks)     |

**POST /api/projects request body:**
```json
{ "name": "Website Redesign" }
```
Note: creating a project automatically adds the creator to `project_members` with `role: "owner"`.

**PATCH /api/projects/:id request body:**
```json
{ "name": "Website Redesign v2", "status": "archived" }
```

---

## Project Members

| Method | Path                                  | Auth required | Description                     |
|--------|----------------------------------------|----------------|-----------------------------------|
| GET    | /api/projects/:projectId/members       | Yes (member)   | List members of a project        |
| POST   | /api/projects/:projectId/members       | Yes (owner)    | Add a member to a project         |
| PATCH  | /api/projects/:projectId/members/:userId | Yes (owner)  | Change a member's role            |
| DELETE | /api/projects/:projectId/members/:userId | Yes (owner)  | Remove a member from a project    |

**POST /api/projects/:projectId/members request body:**
```json
{ "user_id": 4, "role": "member" }
```

---

## Tasks

| Method | Path                            | Auth required | Description                            |
|--------|----------------------------------|----------------|------------------------------------------|
| GET    | /api/projects/:projectId/tasks  | Yes (member)   | List tasks in a project (supports filters)|
| POST   | /api/projects/:projectId/tasks  | Yes (member)   | Create a task in a project              |
| GET    | /api/tasks/:id                  | Yes (member)   | Get task details                        |
| PATCH  | /api/tasks/:id                  | Yes (member)   | Update task (status, assignee, etc.)    |
| DELETE | /api/tasks/:id                  | Yes (member)   | Delete a task                           |

**GET /api/projects/:projectId/tasks supports query params:**
```
?status=in_progress&assignee_id=3&priority=high
```

**POST /api/projects/:projectId/tasks request body:**
```json
{
  "title": "Design homepage mockup",
  "description": "Initial draft for review",
  "priority": "high",
  "due_date": "2026-09-01",
  "assignee_id": 3
}
```

**PATCH /api/tasks/:id request body (any subset of):**
```json
{ "status": "done", "assignee_id": 5 }
```

---

## Comments

| Method | Path                          | Auth required   | Description             |
|--------|--------------------------------|-----------------|---------------------------|
| GET    | /api/tasks/:taskId/comments   | Yes (member)    | List comments on a task  |
| POST   | /api/tasks/:taskId/comments   | Yes (member)    | Add a comment             |
| DELETE | /api/comments/:id             | Yes (author)    | Delete own comment        |

**POST /api/tasks/:taskId/comments request body:**
```json
{ "text": "Looks good, just fix the button spacing." }
```

---

## Standard Error Response

```json
{ "error": "Task not found" }
```

**Status codes used:**
- `200` OK
- `201` Created
- `400` Bad Request (validation failure)
- `401` Unauthorized (missing/invalid token)
- `403` Forbidden (authenticated, but not allowed to perform this action)
- `404` Not Found
- `500` Server Error

---

## Open Questions / Future Considerations

- Should task list endpoints be paginated once projects grow large? (likely yes — add `?page=&limit=`)
- Should removing the last owner of a project be blocked, to avoid an ownerless project?
- Notifications endpoints not yet designed — deferred to a later sprint.