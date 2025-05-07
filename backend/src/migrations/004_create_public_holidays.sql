-- backend/src/migrations/004_create_public_holidays.sql

-- Create public holidays table
CREATE TABLE IF NOT EXISTS public_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) DEFAULT 'GB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_public_holidays_country ON public_holidays(country_code);

-- Add a is_public_holiday flag to assignee_holidays to differentiate
ALTER TABLE assignee_holidays ADD COLUMN IF NOT EXISTS date_end DATE;