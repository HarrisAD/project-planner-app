// backend/src/routes/tasks.js

const express = require('express');
const router = express.Router();
const db = require('../db');

// Add this function at the top of the file
async function updateProjectProgress(db, projectId) {
  try {
    // Get the total number of tasks and the number of completed tasks
    const result = await db.query(
      `SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'Completed') as completed_tasks
        FROM tasks
        WHERE project_id = $1`,
      [projectId]
    );

    const { total_tasks, completed_tasks } = result.rows[0];

    // Calculate progress (avoid division by zero)
    let progress = 0;
    if (parseInt(total_tasks) > 0) {
      progress = parseInt(completed_tasks) / parseInt(total_tasks);
    }

    console.log(
      `Updating project ${projectId} progress to ${progress} (${completed_tasks}/${total_tasks} tasks completed)`
    );

    // Update the project's progress
    await db.query(
      `UPDATE projects SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [progress, projectId]
    );

    return progress;
  } catch (err) {
    console.error('Error updating project progress:', err);
    throw err;
  }
}

// Get all tasks

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, p.company_name, p.workstream as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY t.created_at DESC
    `);

    // Format decimal values consistently before sending to client
    const formattedTasks = result.rows.map((task) => ({
      ...task,
      days_assigned: parseFloat(parseFloat(task.days_assigned || 0).toFixed(1)),
      days_taken: parseFloat(parseFloat(task.days_taken || 0).toFixed(1)),
    }));

    res.json(formattedTasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});
// Create a new task

router.post('/', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      name,
      subTaskName,
      projectId,
      assignee,
      status,
      rag,
      startDate,
      dueDate,
      daysAssigned,
      description,
      tauNotes,
      pathToGreen,
      persona,
    } = req.body;

    // Parse daysAssigned as float to ensure decimal handling
    const parsedDaysAssigned =
      typeof daysAssigned === 'string'
        ? parseFloat(daysAssigned)
        : daysAssigned;

    // Ensure the value is valid
    const finalDaysAssigned = isNaN(parsedDaysAssigned)
      ? 0
      : parsedDaysAssigned;

    // Debug log
    console.log(
      'Task creation data:',
      JSON.stringify({
        name,
        subTaskName,
        projectId,
        assignee,
        status,
        rag,
        startDate,
        dueDate,
        daysAssigned: finalDaysAssigned,
        description,
        tauNotes,
        pathToGreen,
        persona,
      })
    );

    // Print the type and value of daysAssigned
    console.log(
      'Backend received daysAssigned:',
      daysAssigned,
      'type:',
      typeof daysAssigned,
      'parsed:',
      finalDaysAssigned,
      'type:',
      typeof finalDaysAssigned
    );

    const taskResult = await client.query(
      `INSERT INTO tasks (
      project_id, 
      name, 
      sub_task_name,
      assignee, 
      status, 
      rag, 
      start_date, 
      due_date, 
      days_assigned, 
      description,
      tau_notes,
      path_to_green,
      persona
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, '')::DATE, NULLIF($8, '')::DATE, ROUND($9::DECIMAL, 1), $10, $11, $12, $13) 
    RETURNING *`,
      [
        projectId,
        name,
        subTaskName || null,
        assignee,
        status || 'Not Started',
        rag || 1,
        startDate,
        dueDate,
        finalDaysAssigned,
        description,
        tauNotes || null,
        pathToGreen || null,
        persona || null,
      ]
    );

    // Log the created task to see what was actually saved
    console.log('Created task:', {
      days_assigned: taskResult.rows[0].days_assigned,
      days_assigned_type: typeof taskResult.rows[0].days_assigned,
      days_taken: taskResult.rows[0].days_taken,
      days_taken_type: typeof taskResult.rows[0].days_taken,
    });

    // Update project progress
    await updateProjectProgress(client, projectId);

    await client.query('COMMIT');

    // Format the result before sending it back
    const formattedTask = {
      ...taskResult.rows[0],
      days_assigned: parseFloat(
        parseFloat(taskResult.rows[0].days_assigned).toFixed(1)
      ),
      days_taken: parseFloat(
        parseFloat(taskResult.rows[0].days_taken || 0).toFixed(1)
      ),
    };

    res.status(201).json(formattedTask);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task: ' + err.message });
  } finally {
    client.release();
  }
}); // Update a task

router.put('/:id', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name,
      subTaskName,
      projectId,
      assignee,
      status,
      rag,
      startDate,
      dueDate,
      daysAssigned,
      description,
      daysTaken,
      tauNotes,
      pathToGreen,
      persona,
    } = req.body;

    // Parse values with explicit handling for strings vs numbers
    const parsedDaysAssigned =
      typeof daysAssigned === 'string'
        ? parseFloat(daysAssigned)
        : daysAssigned;

    const parsedDaysTaken =
      typeof daysTaken === 'string' ? parseFloat(daysTaken) : daysTaken;

    // Ensure the values are valid numbers
    const finalDaysAssigned = isNaN(parsedDaysAssigned)
      ? 0
      : parsedDaysAssigned;
    const finalDaysTaken = isNaN(parsedDaysTaken) ? 0 : parsedDaysTaken;

    // UPDATED: Use explicit DECIMAL type and ROUND in SQL
    const result = await client.query(
      `UPDATE tasks 
         SET project_id = $1, 
             name = $2,
             sub_task_name = $3,
             assignee = $4, 
             status = $5, 
             rag = $6, 
             start_date = NULLIF($7, '')::DATE,
             due_date = NULLIF($8, '')::DATE, 
             days_assigned = ROUND($9::DECIMAL, 1),
             days_taken = ROUND($10::DECIMAL, 1),
             description = $11,
             tau_notes = $12,
             path_to_green = $13,
             persona = $14,
             updated_at = CURRENT_TIMESTAMP,
             last_updated_days = CASE 
                WHEN days_taken != ROUND($10::DECIMAL, 1) THEN CURRENT_TIMESTAMP 
                ELSE last_updated_days 
             END
         WHERE id = $15
         RETURNING *`,
      [
        projectId,
        name,
        subTaskName || null,
        assignee,
        status,
        rag,
        startDate,
        dueDate,
        finalDaysAssigned,
        finalDaysTaken,
        description,
        tauNotes || null,
        pathToGreen || null,
        persona || null,
        id,
      ]
    );

    // Log the result to verify data in the database
    console.log('Database update result:', {
      days_assigned: result.rows[0].days_assigned,
      days_assigned_type: typeof result.rows[0].days_assigned,
      days_taken: result.rows[0].days_taken,
      days_taken_type: typeof result.rows[0].days_taken,
    });

    await client.query('COMMIT');

    // Format the result before sending it back
    const formattedResult = {
      ...result.rows[0],
      days_assigned: parseFloat(
        parseFloat(result.rows[0].days_assigned).toFixed(1)
      ),
      days_taken: parseFloat(parseFloat(result.rows[0].days_taken).toFixed(1)),
    };

    res.json(formattedResult);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task: ' + err.message });
  } finally {
    client.release();
  }
}); // Delete a task
router.delete('/:id', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get the project ID before deleting the task
    const taskResult = await client.query(
      'SELECT project_id FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const projectId = taskResult.rows[0].project_id;

    // Delete the task
    await client.query('DELETE FROM tasks WHERE id = $1', [id]);

    // Update project progress
    await updateProjectProgress(client, projectId);

    await client.query('COMMIT');

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  } finally {
    client.release();
  }
});

module.exports = router;
