const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.company_name, p.workstream as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const {
      name,
      projectId,
      assignee,
      status,
      rag,
      dueDate,
      daysAssigned,
      description,
    } = req.body;

    const result = await db.query(
      `INSERT INTO tasks (project_id, name, assignee, status, rag, due_date, days_assigned, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        projectId,
        name,
        assignee,
        status || 'Not Started',
        rag || 1,
        dueDate,
        daysAssigned,
        description,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

module.exports = router;
