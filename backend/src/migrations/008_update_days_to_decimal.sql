-- Update days_assigned and days_taken columns to DECIMAL type
ALTER TABLE tasks 
  ALTER COLUMN days_assigned TYPE DECIMAL(5,1),
  ALTER COLUMN days_taken TYPE DECIMAL(5,1);