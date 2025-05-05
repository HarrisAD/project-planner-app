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

// Update an existing project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, description, status, rag, startDate, endDate } =
      req.body;

    // Check if project exists
    const checkProject = await db.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (checkProject.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update the project
    const result = await db.query(
      `UPDATE projects 
       SET company_name = $1, 
           workstream = $2, 
           description = $3, 
           status = $4, 
           rag = $5, 
           start_date = $6, 
           end_date = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [company, name, description, status, rag, startDate, endDate, id]
    );

    // Transform the response to match frontend expectations
    const project = result.rows[0];
    const transformedProject = {
      ...project,
      name: project.workstream,
      company: project.company_name,
    };

    res.json(transformedProject);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Add this after the PUT route in backend/src/routes/projects.js

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const checkProject = await db.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );

    if (checkProject.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete the project
    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Debug endpoint - get raw progress values
router.get('/debug-progress', async (req, res) => {
  try {
    const result = await db.query(`
        SELECT id, workstream, progress 
        FROM projects 
        ORDER BY id
      `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching progress debug:', err);
    res.status(500).json({ error: 'Failed to fetch progress debug' });
  }
});
module.exports = router;
