// backend/src/routes/holidays.js

const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all public holidays
router.get('/public', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, holiday_date, description, country_code, created_at
      FROM public_holidays
      ORDER BY holiday_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching public holidays:', err);
    res.status(500).json({ error: 'Failed to fetch public holidays' });
  }
});

// Create a new public holiday
router.post('/public', async (req, res) => {
  try {
    const { holidayDate, description, countryCode } = req.body;

    const result = await db.query(
      `INSERT INTO public_holidays (holiday_date, description, country_code)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [holidayDate, description, countryCode || 'GB']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating public holiday:', err);
    res.status(500).json({ error: 'Failed to create public holiday' });
  }
});

// Delete a public holiday
router.delete('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM public_holidays WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Public holiday not found' });
    }

    res.json({ message: 'Public holiday deleted successfully' });
  } catch (err) {
    console.error('Error deleting public holiday:', err);
    res.status(500).json({ error: 'Failed to delete public holiday' });
  }
});

// Also, update the assignee holiday endpoints to support date ranges
// Add holiday range for assignee
router.post('/:assigneeId/holiday-range', async (req, res) => {
  try {
    const { assigneeId } = req.params;
    const { startDate, endDate, description } = req.body;

    const result = await db.query(
      `INSERT INTO assignee_holidays (assignee_id, holiday_date, date_end, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [assigneeId, startDate, endDate, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding holiday range:', err);
    res.status(500).json({ error: 'Failed to add holiday range' });
  }
});

module.exports = router;
