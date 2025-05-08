-- backend/src/migrations/007_update_tasks_subtask_structure.sql

-- Add new sub_task_name field to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS sub_task_name TEXT;

-- Create an index on sub_task_name for faster searches
CREATE INDEX IF NOT EXISTS idx_tasks_sub_task_name ON tasks(sub_task_name);