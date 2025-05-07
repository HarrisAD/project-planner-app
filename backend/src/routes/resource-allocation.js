const express = require('express');
const router = express.Router();
const db = require('../db');

// Get resource allocation data
router.get('/', async (req, res) => {
  try {
    // Get optional query parameters for filtering
    const { startDate, endDate, assignee, projectId } = req.query;

    // Build the query with optional filters
    let query = `
      SELECT 
        t.assignee,
        p.id as project_id,
        p.workstream as project_name,
        p.company_name,
        t.id as task_id,
        t.name as task_name,
        t.start_date,
        t.due_date,
        t.days_assigned,
        t.days_taken,
        t.status,
        t.rag,
        a.working_days_per_week
      FROM 
        tasks t
      JOIN 
        projects p ON t.project_id = p.id
      LEFT JOIN
        assignees a ON a.name = t.assignee
      WHERE 
        t.assignee IS NOT NULL
    `;

    const queryParams = [];

    // Add filters if provided
    if (startDate) {
      queryParams.push(startDate);
      query += ` AND (t.due_date >= $${queryParams.length})`;
    }

    if (endDate) {
      queryParams.push(endDate);
      query += ` AND (t.start_date <= $${queryParams.length})`;
    }

    if (assignee) {
      queryParams.push(assignee);
      query += ` AND t.assignee = $${queryParams.length}`;
    }

    if (projectId) {
      queryParams.push(projectId);
      query += ` AND t.project_id = $${queryParams.length}`;
    }

    query += ` ORDER BY t.assignee, p.workstream, t.start_date`;

    // Execute query
    const result = await db.query(query, queryParams);

    // Process the results to calculate allocations by assignee
    const assignees = {};

    // Process each task and calculate RAG status
    for (const task of result.rows) {
      const assigneeName = task.assignee;

      // Skip if no assignee
      if (!assigneeName) continue;

      // Initialize assignee if not exists
      if (!assignees[assigneeName]) {
        assignees[assigneeName] = {
          name: assigneeName,
          workingDaysPerWeek: task.working_days_per_week || 5,
          totalDaysAssigned: 0,
          totalDaysRemaining: 0,
          projects: {},
          tasks: [],
        };
      }

      // Calculate remaining days
      const daysRemaining = Math.max(
        0,
        task.days_assigned - (task.days_taken || 0)
      );

      // Add to assignee totals
      assignees[assigneeName].totalDaysAssigned += task.days_assigned;
      assignees[assigneeName].totalDaysRemaining += daysRemaining;

      // Add to projects
      if (!assignees[assigneeName].projects[task.project_id]) {
        assignees[assigneeName].projects[task.project_id] = {
          id: task.project_id,
          name: task.project_name,
          company: task.company_name,
          totalDaysAssigned: 0,
          totalDaysRemaining: 0,
        };
      }

      // Add to project totals
      assignees[assigneeName].projects[task.project_id].totalDaysAssigned +=
        task.days_assigned;
      assignees[assigneeName].projects[task.project_id].totalDaysRemaining +=
        daysRemaining;

      // Calculate RAG status based on same logic as in Tasks view
      let calculatedRag = task.rag; // Default to stored RAG

      // Calculate business days until due
      if (task.due_date) {
        const today = new Date();
        const dueDate = new Date(task.due_date);

        // Simple business days calculation (exclude weekends)
        let businessDays = 0;
        const current = new Date(today);
        current.setHours(0, 0, 0, 0);

        while (current <= dueDate) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Skip weekends
            businessDays++;
          }
          current.setDate(current.getDate() + 1);
        }

        // Calculate buffer (days remaining vs business days until due)
        const buffer = businessDays - daysRemaining;

        // Determine RAG based on buffer
        if (daysRemaining > businessDays) {
          calculatedRag = 3; // Red - not enough time
        } else if (buffer <= 3) {
          calculatedRag = 2; // Amber - tight timeline
        } else {
          calculatedRag = 1; // Green - sufficient buffer
        }
      }

      // Add task
      assignees[assigneeName].tasks.push({
        id: task.task_id,
        name: task.task_name,
        projectId: task.project_id,
        projectName: task.project_name,
        startDate: task.start_date,
        dueDate: task.due_date,
        daysAssigned: task.days_assigned,
        daysRemaining: daysRemaining,
        status: task.status,
        rag: task.rag, // Original RAG from database
        calculatedRag: calculatedRag, // Dynamically calculated RAG
      });
    }

    // Convert the assignees object to an array
    const assigneesArray = Object.values(assignees);

    // Convert projects from objects to arrays
    assigneesArray.forEach((assignee) => {
      assignee.projects = Object.values(assignee.projects);
    });

    res.json(assigneesArray);
  } catch (err) {
    console.error('Error fetching resource allocation data:', err);
    res.status(500).json({ error: 'Failed to fetch resource allocation data' });
  }
});

// Get calendar view data (for timeline visualization)
router.get('/calendar', async (req, res) => {
  try {
    // Get optional query parameters for filtering
    const { startDate, endDate, assignee, projectId } = req.query;

    // Default date range if not provided (next 30 days)
    const defaultStartDate = new Date();
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);

    const queryStartDate =
      startDate || defaultStartDate.toISOString().split('T')[0];
    const queryEndDate = endDate || defaultEndDate.toISOString().split('T')[0];

    console.log(
      'Calendar endpoint called with date range:',
      queryStartDate,
      'to',
      queryEndDate
    );

    // Build the query with optional filters
    let query = `
      SELECT 
        t.id,
        t.assignee,
        p.id as project_id,
        p.workstream as project_name,
        p.company_name,
        t.name as task_name,
        COALESCE(t.start_date, CURRENT_DATE) as start_date,
        t.due_date,
        t.days_assigned,
        t.days_taken,
        t.status,
        t.rag
      FROM 
        tasks t
      JOIN 
        projects p ON t.project_id = p.id
      WHERE 
        t.assignee IS NOT NULL
        AND t.due_date IS NOT NULL
    `;

    const queryParams = [];

    // Add filters if provided
    if (queryStartDate) {
      queryParams.push(queryStartDate);
      query += ` AND (t.due_date >= $${queryParams.length})`;
    }

    if (queryEndDate) {
      queryParams.push(queryEndDate);
      query += ` AND (COALESCE(t.start_date, CURRENT_DATE) <= $${queryParams.length})`;
    }

    if (assignee) {
      queryParams.push(assignee);
      query += ` AND t.assignee = $${queryParams.length}`;
    }

    if (projectId) {
      queryParams.push(projectId);
      query += ` AND t.project_id = $${queryParams.length}`;
    }

    query += ` ORDER BY t.assignee, t.start_date`;

    // Execute query
    const result = await db.query(query, queryParams);
    console.log(`Calendar query returned ${result.rows.length} tasks`);

    // Transform the data for a calendar/timeline view
    const calendarEvents = result.rows.map((task) => {
      // Calculate RAG status the same way as above
      let calculatedRag = task.rag;

      if (task.due_date) {
        const today = new Date();
        const dueDate = new Date(task.due_date);
        const daysRemaining = Math.max(
          0,
          task.days_assigned - (task.days_taken || 0)
        );

        let businessDays = 0;
        const current = new Date(today);
        current.setHours(0, 0, 0, 0);

        while (current <= dueDate) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDays++;
          }
          current.setDate(current.getDate() + 1);
        }

        const buffer = businessDays - daysRemaining;

        if (daysRemaining > businessDays) {
          calculatedRag = 3;
        } else if (buffer <= 3) {
          calculatedRag = 2;
        } else {
          calculatedRag = 1;
        }
      }

      // Format for a timeline visualization
      return {
        id: task.id,
        title: task.task_name,
        assignee: task.assignee,
        start: task.start_date,
        end: task.due_date,
        project: {
          id: task.project_id,
          name: task.project_name,
          company: task.company_name,
        },
        daysAssigned: task.days_assigned,
        daysRemaining: Math.max(0, task.days_assigned - (task.days_taken || 0)),
        status: task.status,
        rag: calculatedRag, // Use calculated RAG
      };
    });

    res.json(calendarEvents);
  } catch (err) {
    console.error('Error fetching calendar data:', err);
    res.status(500).json({ error: 'Failed to fetch calendar data' });
  }
});

// Get workload summary data for all assignees
router.get('/workload-summary', async (req, res) => {
  try {
    // Get optional timeframe parameter
    const { timeframe } = req.query;
    let startDate, endDate;

    // Set date range based on timeframe
    const now = new Date();
    startDate = now.toISOString().split('T')[0];

    switch (timeframe) {
      case 'week':
        // Next 7 days
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        // Next 30 days
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30);
        break;
      case 'quarter':
        // Next 90 days
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 90);
        break;
      default:
        // Default to next 14 days
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 14);
    }

    endDate = endDate.toISOString().split('T')[0];

    console.log('Date range:', startDate, 'to', endDate);

    // Calculate business days in the period
    const businessDaysInPeriod = await calculateBusinessDays(
      startDate,
      endDate
    );

    // Get all tasks for our period
    const tasksQuery = `
        SELECT 
          t.id,
          t.assignee,
          t.name,
          t.status,
          t.days_assigned,
          t.days_taken,
          t.start_date,
          t.due_date,
          a.working_days_per_week
        FROM 
          tasks t
        LEFT JOIN
          assignees a ON a.name = t.assignee
        WHERE 
          t.assignee IS NOT NULL 
          AND t.status != 'Completed'
          AND t.due_date >= $1
          AND (t.start_date IS NULL OR t.start_date <= $2)
      `;

    const tasksResult = await db.query(tasksQuery, [startDate, endDate]);
    console.log(`Found ${tasksResult.rows.length} tasks in period`);

    // Process task data
    const assigneeMap = {};

    for (const task of tasksResult.rows) {
      const assigneeName = task.assignee;

      // Skip if no assignee
      if (!assigneeName) continue;

      // Initialize assignee if needed
      if (!assigneeMap[assigneeName]) {
        assigneeMap[assigneeName] = {
          assignee: assigneeName,
          workingDaysPerWeek: task.working_days_per_week || 5,
          allocated: 0,
          activeTasks: 0,
        };
      }

      // Calculate days remaining on the task
      const daysRemaining = Math.max(
        0,
        task.days_assigned - (task.days_taken || 0)
      );

      // Skip if no work left
      if (daysRemaining <= 0) continue;

      // Count active task
      assigneeMap[assigneeName].activeTasks++;

      // Get task dates
      const taskStartDate = task.start_date
        ? new Date(task.start_date)
        : new Date();
      const taskDueDate = new Date(task.due_date);

      // Get filter dates
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);

      // Debug log
      console.log(`Task: ${task.name}, Assignee: ${task.assignee}`);
      console.log(
        `  Start: ${taskStartDate.toISOString().split('T')[0]}, Due: ${
          taskDueDate.toISOString().split('T')[0]
        }`
      );
      console.log(
        `  Filter period: ${filterStartDate.toISOString().split('T')[0]} to ${
          filterEndDate.toISOString().split('T')[0]
        }`
      );
      console.log(
        `  Days assigned: ${task.days_assigned}, Days taken: ${task.days_taken}, Remaining: ${daysRemaining}`
      );

      // Make sure we're working with clean dates without time components
      taskStartDate.setHours(0, 0, 0, 0);
      taskDueDate.setHours(0, 0, 0, 0);
      filterStartDate.setHours(0, 0, 0, 0);
      filterEndDate.setHours(0, 0, 0, 0);

      // Use the later of task start date or filter start date
      const effectiveStartDate = new Date(
        Math.max(taskStartDate.getTime(), filterStartDate.getTime())
      );

      let proportion = 1.0; // Default to full allocation

      // If the task ends after the filter period, calculate pro-rated allocation
      if (taskDueDate > filterEndDate) {
        // Total working days from effective start to task due date
        const totalDays = Math.max(
          1,
          Math.floor(
            (taskDueDate - effectiveStartDate) / (1000 * 60 * 60 * 24)
          ) + 1
        );

        // Days in our filter period
        const daysInPeriod = Math.max(
          1,
          Math.floor(
            (filterEndDate - effectiveStartDate) / (1000 * 60 * 60 * 24)
          ) + 1
        );

        // Calculate proportion
        proportion = Math.min(1, daysInPeriod / totalDays);
      }

      // Calculate prorated allocation
      const prorated = daysRemaining * proportion;
      console.log(
        `  Total days to complete: ${
          Math.floor(
            (taskDueDate - effectiveStartDate) / (1000 * 60 * 60 * 24)
          ) + 1
        }`
      );
      console.log(
        `  Proportion: ${proportion.toFixed(
          2
        )}, Prorated allocation: ${prorated.toFixed(2)}`
      );

      // Add to assignee's allocation
      assigneeMap[assigneeName].allocated += prorated;
    }

    // Convert to array and calculate additional fields
    const workload = Object.values(assigneeMap).map((assignee) => {
      // Calculate their total capacity based on working days per week
      const workingDaysPerWeek = parseFloat(assignee.workingDaysPerWeek) || 5;

      // Total working days in the period = business days * (working days per week / 5)
      const totalCapacity =
        Math.round(businessDaysInPeriod * (workingDaysPerWeek / 5) * 10) / 10;

      // Calculate allocation percentage
      const allocationPercentage =
        totalCapacity > 0
          ? Math.round((assignee.allocated / totalCapacity) * 100)
          : 0;

      // Determine allocation status
      let allocationStatus;
      if (allocationPercentage > 120) {
        allocationStatus = 'Overallocated';
      } else if (allocationPercentage > 90) {
        allocationStatus = 'Full';
      } else if (allocationPercentage > 50) {
        allocationStatus = 'Balanced';
      } else {
        allocationStatus = 'Underallocated';
      }

      return {
        assignee: assignee.assignee,
        workingDaysPerWeek,
        totalCapacity,
        allocated: assignee.allocated,
        allocationPercentage,
        allocationStatus,
        activeTasks: assignee.activeTasks,
      };
    });

    res.json({
      startDate,
      endDate,
      businessDays: businessDaysInPeriod,
      workload,
    });
  } catch (err) {
    console.error('Error fetching workload summary:', err);
    res.status(500).json({ error: 'Failed to fetch workload summary' });
  }
});

// Helper function to calculate business days between two dates
async function calculateBusinessDays(startDate, endDate) {
  // Convert to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to beginning of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Get public holidays
  const holidaysQuery = `
    SELECT holiday_date FROM public_holidays 
    WHERE holiday_date BETWEEN $1 AND $2
  `;

  try {
    const holidaysResult = await db.query(holidaysQuery, [startDate, endDate]);
    const holidays = holidaysResult.rows.map(
      (h) => h.holiday_date.toISOString().split('T')[0]
    );

    // Calculate days
    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      // Check if it's a weekday and not a holiday
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];

      if (
        dayOfWeek !== 0 &&
        dayOfWeek !== 6 &&
        !holidays.includes(dateString)
      ) {
        days++;
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return days;
  } catch (error) {
    console.error('Error getting holidays:', error);

    // Fallback calculation without holidays
    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      // Check if it's a weekday
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    return days;
  }
}

module.exports = router;
