# Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string passwordHash
        string name
        Role role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id PK
        string name
        text description
        ProjectStatus status
        datetime startDate
        datetime endDate
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    ProjectMember {
        string id PK
        string projectId FK
        string userId FK
        MemberRole role
        datetime assignedAt
    }

    Task {
        string id PK
        string title
        text description
        TaskStatus status
        TaskPriority priority
        datetime dueDate
        string projectId FK
        string assigneeId FK
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    Comment {
        string id PK
        text content
        string taskId FK
        string userId FK
        datetime createdAt
    }

    User ||--o{ Project : "creates (createdById)"
    User ||--o{ ProjectMember : "belongs to"
    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ Task : "contains"
    User ||--o{ Task : "assigned (assigneeId)"
    User ||--o{ Task : "created (createdById)"
    Task ||--o{ Comment : "has"
    User ||--o{ Comment : "writes"

    User {
        enum Role { ADMIN, PROJECT_MANAGER, TEAM_MEMBER }
    }
    Project { enum ProjectStatus { PLANNING, ACTIVE, ON_HOLD, COMPLETED } }
    Task { enum TaskStatus { TODO, IN_PROGRESS, REVIEW, DONE } }
    Task { enum TaskPriority { LOW, MEDIUM, HIGH, URGENT } }
    ProjectMember { enum MemberRole { MANAGER, MEMBER } }
```

## Relationships summary

- **User → Project** (1:N): a user (typically a Project Manager or Admin) creates many projects (`createdById`).
- **User ⇄ Project** via **ProjectMember** (M:N): users are assigned to projects with a `MEMBER` or `MANAGER` role. A unique constraint on `(projectId, userId)` prevents duplicate membership.
- **Project → Task** (1:N): a project contains many tasks.
- **User → Task** (1:N) as **assignee** (`assigneeId`, nullable) and as **creator** (`createdById`).
- **Task → Comment** (1:N): team members comment on tasks.
