-- backend/src/migrations/002_add_last_updated_days.sql

-- Add last_updated_days column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_updated_days TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing tasks to have their last_updated_days match their updated_at value
UPDATE tasks SET last_updated_days = updated_at WHERE last_updated_days IS NULL;

-- Add an index for faster querying of tasks by last_updated_days
CREATE INDEX IF NOT EXISTS idx_tasks_last_updated_days ON tasks(last_updated_days);

-- Add comment to column for documentation
COMMENT ON COLUMN tasks.last_updated_days IS 'Timestamp when days_taken was last updated - used for automatic status transitions';