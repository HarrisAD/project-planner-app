const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const db = require('../db');

// Set up multer for file upload handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Endpoint for importing tasks
router.post('/tasks', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file type
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      return res.status(400).json({
        error:
          'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)',
      });
    }

    // Parse Excel/CSV file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ error: 'The uploaded file contains no data' });
    }

    // Return the parsed data for preview
    res.json({
      message: 'File parsed successfully',
      data,
      rowCount: data.length,
    });
  } catch (err) {
    console.error('Error importing tasks:', err);
    res
      .status(500)
      .json({ error: 'Failed to process import file: ' + err.message });
  }
});

// Endpoint for validating and importing tasks
router.post('/tasks/process', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { tasks, columnMapping } = req.body;

    console.log('Received import request:');
    console.log('- Number of tasks:', tasks ? tasks.length : 0);
    console.log('- Column mapping:', columnMapping);

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No task data provided' });
    }

    console.log('Sample task data:', JSON.stringify(tasks[0], null, 2));

    // Get all projects to map project name to ID
    const projectsResult = await client.query(
      `SELECT id, workstream as name, company_name as company FROM projects`
    );
    const projectsMap = {};
    projectsResult.rows.forEach((project) => {
      // Create lookup by name
      projectsMap[project.name.toLowerCase()] = project.id;
      // Also create lookup by "company - name" format
      if (project.company) {
        projectsMap[
          `${project.company.toLowerCase()} - ${project.name.toLowerCase()}`
        ] = project.id;
      }
    });

    // Get all assignees to validate assignee names
    const assigneesResult = await client.query(`SELECT name FROM assignees`);
    const assignees = assigneesResult.rows.map((row) => row.name.toLowerCase());

    // Validate and transform task data
    const validTasks = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const rowNumber = i + 1;

      // Skip empty rows
      if (!task.name && !task.projectName && !task.assignee) {
        continue;
      }

      // Required field validation
      if (!task.name) {
        errors.push(`Row ${rowNumber}: Missing required field 'name'`);
        continue;
      }

      if (!task.projectName) {
        errors.push(`Row ${rowNumber}: Missing required field 'projectName'`);
        continue;
      }

      if (!task.assignee) {
        errors.push(`Row ${rowNumber}: Missing required field 'assignee'`);
        continue;
      }

      if (!task.daysAssigned) {
        errors.push(`Row ${rowNumber}: Missing required field 'daysAssigned'`);
        continue;
      }

      // Find project ID
      const projectNameLower = task.projectName.toLowerCase();
      let projectId = null;

      if (projectsMap[projectNameLower]) {
        projectId = projectsMap[projectNameLower];
      } else {
        // Try alternative formats
        for (const [key, id] of Object.entries(projectsMap)) {
          if (projectNameLower.includes(key)) {
            projectId = id;
            break;
          }
        }

        if (!projectId) {
          errors.push(
            `Row ${rowNumber}: Project "${task.projectName}" not found`
          );
          continue;
        }
      }

      // Validate assignee
      if (!assignees.includes(task.assignee.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Assignee "${task.assignee}" not found`);
        continue;
      }

      // Convert dates if needed
      let startDate = task.startDate;
      let dueDate = task.dueDate;

      if (startDate && typeof startDate === 'number') {
        // Excel date number format conversion
        startDate = new Date(Math.round((startDate - 25569) * 86400 * 1000));
        startDate = startDate.toISOString().split('T')[0];
      }

      if (dueDate && typeof dueDate === 'number') {
        // Excel date number format conversion
        dueDate = new Date(Math.round((dueDate - 25569) * 86400 * 1000));
        dueDate = dueDate.toISOString().split('T')[0];
      }

      // Validate status
      const validStatuses = [
        'Not Started',
        'In Progress',
        'Completed',
        'On Hold',
      ];
      const status = task.status || 'Not Started';

      if (task.status && !validStatuses.includes(task.status)) {
        errors.push(
          `Row ${rowNumber}: Invalid status "${
            task.status
          }". Valid values are: ${validStatuses.join(', ')}`
        );
        continue;
      }

      // Validate RAG
      const rag = task.rag ? parseInt(task.rag) : 1;
      if (task.rag && ![1, 2, 3].includes(rag)) {
        errors.push(
          `Row ${rowNumber}: Invalid RAG value "${task.rag}". Valid values are: 1 (Green), 2 (Amber), 3 (Red)`
        );
        continue;
      }

      // Validate persona
      const validPersonas = [
        'exec_sponsor',
        'exec_lead',
        'developer',
        'consultant',
        'programme_manager',
      ];
      if (task.persona && !validPersonas.includes(task.persona.toLowerCase())) {
        errors.push(
          `Row ${rowNumber}: Invalid persona "${
            task.persona
          }". Valid values are: ${validPersonas.join(', ')}`
        );
        continue;
      }

      // All validations passed, prepare task for insertion
      validTasks.push({
        project_id: projectId,
        name: task.name,
        sub_task_name: task.subTaskName || null,
        assignee: task.assignee,
        status: status,
        rag: rag,
        start_date: startDate || null,
        due_date: dueDate || null,
        days_assigned: parseInt(task.daysAssigned) || 0,
        days_taken: parseInt(task.daysTaken) || 0,
        description: task.description || null,
        path_to_green: task.pathToGreen || null,
        tau_notes: task.tauNotes || null,
        persona: task.persona ? task.persona.toLowerCase() : null,
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Validation errors in import data',
        validationErrors: errors,
      });
    }

    // No errors, proceed with insertion
    const importedTasks = [];
    for (const task of validTasks) {
      const result = await client.query(
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
          days_taken,
          description,
          path_to_green,
          tau_notes,
          persona
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING id`,
        [
          task.project_id,
          task.name,
          task.sub_task_name,
          task.assignee,
          task.status,
          task.rag,
          task.start_date,
          task.due_date,
          task.days_assigned,
          task.days_taken,
          task.description,
          task.path_to_green,
          task.tau_notes,
          task.persona,
        ]
      );

      importedTasks.push(result.rows[0].id);
    }

    // Update project progress for all affected projects
    const affectedProjects = [
      ...new Set(validTasks.map((task) => task.project_id)),
    ];

    for (const projectId of affectedProjects) {
      // Get the total number of tasks and the number of completed tasks
      const progressResult = await client.query(
        `SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'Completed') as completed_tasks
        FROM tasks
        WHERE project_id = $1`,
        [projectId]
      );

      const { total_tasks, completed_tasks } = progressResult.rows[0];

      // Calculate progress (avoid division by zero)
      let progress = 0;
      if (parseInt(total_tasks) > 0) {
        progress = parseInt(completed_tasks) / parseInt(total_tasks);
      }

      // Update the project's progress
      await client.query(
        `UPDATE projects SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [progress, projectId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully imported ${importedTasks.length} tasks`,
      importedCount: importedTasks.length,
      taskIds: importedTasks,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing task import:', err);
    console.error('Error details:', err.stack);
    res
      .status(500)
      .json({ error: 'Failed to process task import: ' + err.message });
  } finally {
    client.release();
  }
});

// Endpoint for downloading a template
router.get('/template/tasks', (req, res) => {
  try {
    // Create a workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Define the template columns
    const templateData = [
      {
        name: 'Task Example',
        subTaskName: 'Optional subtask',
        projectName: 'Project Name',
        assignee: 'Assignee Name',
        status: 'Not Started',
        startDate: '2025-05-15',
        dueDate: '2025-06-15',
        daysAssigned: 10,
        daysTaken: 0,
        description: 'Task description here',
        pathToGreen: 'Steps to green',
        tauNotes: 'Notes',
        persona: 'developer',
      },
    ];

    // Create the worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // name
      { wch: 20 }, // subTaskName
      { wch: 20 }, // projectName
      { wch: 15 }, // assignee
      { wch: 15 }, // status
      { wch: 12 }, // startDate
      { wch: 12 }, // dueDate
      { wch: 10 }, // daysAssigned
      { wch: 10 }, // daysTaken
      { wch: 30 }, // description
      { wch: 20 }, // pathToGreen
      { wch: 20 }, // tauNotes
      { wch: 15 }, // persona
    ];

    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks Template');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=tasks_import_template.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    // Send the file
    res.send(buffer);
  } catch (err) {
    console.error('Error generating template:', err);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

module.exports = router;
