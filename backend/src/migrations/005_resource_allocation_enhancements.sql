-- backend/src/migrations/005_resource_allocation_enhancements.sql

-- Add start_date to tasks table if it doesn't exist
-- This will help us track when tasks are scheduled to begin
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add an index for faster task queries by assignee
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);

-- Add an index for date range queries
CREATE INDEX IF NOT EXISTS idx_tasks_date_range ON tasks(start_date, due_date);

-- Update any existing tasks to set a reasonable start_date
-- If a task has no start_date, set it to either:
-- 1. created_at date if before due_date
-- 2. or due_date minus days_assigned if that's earlier than due_date
UPDATE tasks 
SET start_date = 
  CASE 
    WHEN created_at::date <= due_date THEN created_at::date
    WHEN due_date - (days_assigned || ' days')::interval <= due_date THEN due_date - (days_assigned || ' days')::interval
    ELSE due_date
  END
WHERE start_date IS NULL AND due_date IS NOT NULL;

-- Add a comment to explain the new column
COMMENT ON COLUMN tasks.start_date IS 'The date when the task is scheduled to start - used for resource allocation views';