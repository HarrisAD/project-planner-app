const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all assignees
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, working_days_per_week, start_date, created_at, updated_at
      FROM assignees
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assignees:', err);
    res.status(500).json({ error: 'Failed to fetch assignees' });
  }
});

// Create a new assignee
router.post('/', async (req, res) => {
  try {
    const { name, email, workingDaysPerWeek, startDate } = req.body;

    const result = await db.query(
      `INSERT INTO assignees (name, email, working_days_per_week, start_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, workingDaysPerWeek || 5.0, startDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating assignee:', err);
    res.status(500).json({ error: 'Failed to create assignee' });
  }
});

// Update an assignee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, workingDaysPerWeek, startDate } = req.body;

    const result = await db.query(
      `UPDATE assignees
       SET name = $1, email = $2, working_days_per_week = $3, start_date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, email, workingDaysPerWeek, startDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating assignee:', err);
    res.status(500).json({ error: 'Failed to update assignee' });
  }
});

// Delete an assignee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignee is referenced in any tasks
    const checkTasks = await db.query(
      'SELECT COUNT(*) FROM tasks WHERE assignee = (SELECT name FROM assignees WHERE id = $1)',
      [id]
    );

    if (parseInt(checkTasks.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete assignee that is referenced in tasks',
        count: parseInt(checkTasks.rows[0].count),
      });
    }

    const result = await db.query(
      'DELETE FROM assignees WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    res.json({ message: 'Assignee deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignee:', err);
    res.status(500).json({ error: 'Failed to delete assignee' });
  }
});

// Get holidays for an assignee
router.get('/:id/holidays', async (req, res) => {
  try {
    const { id } = req.params;

    // Updated query to handle date ranges
    const result = await db.query(
      `SELECT 
           ah.id, 
           ah.holiday_date, 
           ah.date_end,
           ah.description, 
           ah.created_at
         FROM assignee_holidays ah
         WHERE ah.assignee_id = $1
         ORDER BY ah.holiday_date ASC`,
      [id]
    );

    // Process the results to include expanded dates for ranges
    const processedHolidays = result.rows.map((holiday) => {
      if (holiday.date_end) {
        // This is a date range
        return {
          ...holiday,
          isRange: true,
          displayText: `${new Date(
            holiday.holiday_date
          ).toLocaleDateString()} to ${new Date(
            holiday.date_end
          ).toLocaleDateString()}`,
        };
      } else {
        // Single day
        return {
          ...holiday,
          isRange: false,
          displayText: new Date(holiday.holiday_date).toLocaleDateString(),
        };
      }
    });

    res.json(processedHolidays);
  } catch (err) {
    console.error('Error fetching assignee holidays:', err);
    res.status(500).json({ error: 'Failed to fetch assignee holidays' });
  }
});

// Add holiday for assignee
router.post('/:id/holidays', async (req, res) => {
  try {
    const { id } = req.params;
    const { holidayDate, description } = req.body;

    const result = await db.query(
      `INSERT INTO assignee_holidays (assignee_id, holiday_date, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, holidayDate, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding assignee holiday:', err);
    res.status(500).json({ error: 'Failed to add assignee holiday' });
  }
});

// Delete holiday
router.delete('/holidays/:holidayId', async (req, res) => {
  try {
    const { holidayId } = req.params;

    const result = await db.query(
      'DELETE FROM assignee_holidays WHERE id = $1 RETURNING id',
      [holidayId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    console.error('Error deleting holiday:', err);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

// Get assignee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT id, name, email, working_days_per_week, start_date, created_at, updated_at
         FROM assignees
         WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching assignee:', err);
    res.status(500).json({ error: 'Failed to fetch assignee' });
  }
});

// Add holiday range for assignee
router.post('/:id/holiday-range', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, description } = req.body;

    const result = await db.query(
      `INSERT INTO assignee_holidays (assignee_id, holiday_date, date_end, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
      [id, startDate, endDate, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding holiday range:', err);
    res.status(500).json({ error: 'Failed to add holiday range' });
  }
});

module.exports = router;
