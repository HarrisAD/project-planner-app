-- backend/src/migrations/006_enhance_tasks_fields.sql

-- Add new fields to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS tau_notes TEXT,
  ADD COLUMN IF NOT EXISTS path_to_green TEXT,
  ADD COLUMN IF NOT EXISTS persona VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_sub_task BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

-- Create an index on parent_task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create an index on is_sub_task flag
CREATE INDEX IF NOT EXISTS idx_tasks_is_sub_task ON tasks(is_sub_task);