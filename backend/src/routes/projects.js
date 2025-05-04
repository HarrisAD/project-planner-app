const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
        SELECT 
          id,
          company_name,
          workstream,
          description,
          status,
          rag,
          progress,
          start_date,
          end_date,
          created_at,
          updated_at
        FROM projects 
        ORDER BY created_at DESC
      `);

    // Transform the data to match what the frontend expects
    const projects = result.rows.map((project) => ({
      ...project,
      name: project.workstream, // Map workstream to name for frontend
      company: project.company_name, // Map company_name to company for frontend
    }));

    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});
// Create a new project
router.post('/', async (req, res) => {
  try {
    const { name, company, description, status, rag, startDate, endDate } =
      req.body;

    const result = await db.query(
      `INSERT INTO projects (company_name, workstream, description, status, rag, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        company,
        name,
        description,
        status || 'Planning',
        rag || 1,
        startDate,
        endDate,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

module.exports = router;
