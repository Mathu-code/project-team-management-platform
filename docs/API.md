# API Documentation

Base URL: `http://localhost:4000/api`

All authenticated requests require the header:
`Authorization: Bearer <token>`

Responses are JSON. Errors follow:
```json
{ "error": "Message", "details": { "field": ["reason"] } }
```

## Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | User | Returns the current user |
| POST | `/auth/change-password` | User | `{ currentPassword, newPassword }` |

## Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/dashboard` | User | Role-based summary statistics |

## Users (Admin only)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users` | Admin | List all users |
| GET | `/users/:id` | Admin | Get a user |
| POST | `/users` | Admin | Create user `{ email, name, password, role }` |
| PATCH | `/users/:id` | Admin | Update `{ name?, email?, role?, isActive?, password? }` |
| DELETE | `/users/:id` | Admin | Delete a user (cannot delete self) |

## Projects

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/projects` | User | List projects visible to the caller |
| POST | `/projects` | Admin/PM | Create project `{ name, description?, status?, startDate?, endDate? }` |
| GET | `/projects/:id` | User* | Project details (members + tasks) |
| PATCH | `/projects/:id` | Owner/Admin | Update project fields |
| DELETE | `/projects/:id` | Owner/Admin | Delete project |
| GET | `/projects/:id/members` | User* | List members |
| GET | `/projects/:id/available-users` | User* | Users not yet members (eligible to add) |
| POST | `/projects/:id/members` | Owner/Admin | Add member `{ userId, role? }` |
| DELETE | `/projects/:id/members/:userId` | Owner/Admin | Remove member |

`*` User must be Admin, the project owner (PM), or a member of the project.

## Tasks

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/projects/:id/tasks` | User* | List tasks in a project |
| POST | `/projects/:id/tasks` | Owner/Admin | Create task `{ title, description?, status?, priority?, dueDate?, assigneeId? }` |
| GET | `/tasks/:id` | User* | Task details (with comments) |
| PATCH | `/tasks/:id` | Owner/Admin or assignee | Update task. Members may only set `status` |
| DELETE | `/tasks/:id` | Owner/Admin | Delete task |
| GET | `/tasks/:id/comments` | User* | List comments |
| POST | `/tasks/:id/comments` | User* | Add comment `{ content }` |

## Enums

- **Role**: `ADMIN`, `PROJECT_MANAGER`, `TEAM_MEMBER`
- **ProjectStatus**: `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`
- **TaskStatus**: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`
- **TaskPriority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **MemberRole**: `MANAGER`, `MEMBER`

## Example

```bash
# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cyphlab.com","password":"Password123!"}'

# Use the returned token
TOKEN="<token>"

# List projects
curl http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

A ready-to-import **Postman collection** is available at
[`docs/postman/PTMP.postman_collection.json`](./postman/PTMP.postman_collection.json).
