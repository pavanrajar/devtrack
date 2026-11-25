
-- =====================================================
-- DevTrack: Initial Database Schema
-- PostgreSQL 18
-- =====================================================

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX users_email_unique_idx
ON users (LOWER(email));


-- 2. TEAMS
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT,

    created_by UUID NOT NULL REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 3. TEAM MEMBERS
CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'member')),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (team_id, user_id)
);

CREATE INDEX team_members_user_id_idx
ON team_members(user_id);


-- 4. PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,

    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived')),

    created_by UUID NOT NULL REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX projects_team_name_unique_idx
ON projects (team_id, LOWER(name));

CREATE INDEX projects_team_id_idx
ON projects(team_id);


-- 5. PROJECT MEMBERS
CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL DEFAULT 'member'
        CHECK (role IN ('manager', 'member')),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX project_members_user_id_idx
ON project_members(user_id);


-- 6. TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'backlog'
        CHECK (
            status IN (
                'backlog',
                'in_progress',
                'in_review',
                'done'
            )
        ),

    priority VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (
            priority IN ('low', 'medium', 'high', 'urgent')
        ),

    position INTEGER NOT NULL DEFAULT 0,

    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),

    due_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX tasks_project_id_idx
ON tasks(project_id);

CREATE INDEX tasks_assigned_to_idx
ON tasks(assigned_to);

CREATE INDEX tasks_project_status_idx
ON tasks(project_id, status);


-- 7. TASK COMMENTS
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX task_comments_task_id_idx
ON task_comments(task_id);


-- =====================================================
-- END OF INITIAL SCHEMA
-- =====================================================
