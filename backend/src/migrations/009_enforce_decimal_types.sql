-- 009_enforce_decimal_types.sql

-- Verify and ensure the column types are DECIMAL(5,1)
ALTER TABLE tasks 
  ALTER COLUMN days_assigned TYPE DECIMAL(5,1) USING days_assigned::DECIMAL(5,1),
  ALTER COLUMN days_taken TYPE DECIMAL(5,1) USING days_taken::DECIMAL(5,1);

-- Update any existing records to ensure precision
UPDATE tasks SET 
  days_assigned = ROUND(days_assigned::DECIMAL, 1),
  days_taken = ROUND(days_taken::DECIMAL, 1);