-- backend/src/migrations/003_create_assignees_tables.sql

-- Create assignees table
CREATE TABLE IF NOT EXISTS assignees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    working_days_per_week DECIMAL(3,1) DEFAULT 5.0,
    start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assignee holidays table
CREATE TABLE IF NOT EXISTS assignee_holidays (
    id SERIAL PRIMARY KEY,
    assignee_id INTEGER REFERENCES assignees(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignee_holidays_date ON assignee_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_assignee_name ON assignees(name);