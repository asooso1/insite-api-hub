-- Migration: Add Owner/Contact and Comments features
-- Run this script manually: psql $DATABASE_URL -f scripts/migration-v2-owner-comments.sql

-- 1. Add owner columns to endpoints table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_id') THEN
        ALTER TABLE endpoints ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_name') THEN
        ALTER TABLE endpoints ADD COLUMN owner_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='endpoints' AND column_name='owner_contact') THEN
        ALTER TABLE endpoints ADD COLUMN owner_contact TEXT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_endpoints_owner_id ON endpoints(owner_id);

-- 2. Create API Comments/Questions table
CREATE TABLE IF NOT EXISTS api_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES api_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'COMMENT', -- COMMENT, QUESTION, ANSWER
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_comments_project_id ON api_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_endpoint_id ON api_comments(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_user_id ON api_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_api_comments_parent_id ON api_comments(parent_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Owner/Contact and Comments features added successfully!';
END
$$;
