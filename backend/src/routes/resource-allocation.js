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
      case 'twomonth': // Add this new case
        // Next 60 days
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 60);
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

    console.log(
      `HOLIDAY DEBUG: Workload summary for timeframe: ${timeframe}, date range: ${startDate} to ${endDate}`
    );

    // Calculate standard business days (without specific assignee holidays)
    const standardBusinessDays = await calculateBusinessDays(
      startDate,
      endDate
    );
    console.log(
      `HOLIDAY DEBUG: Standard business days (no specific assignee): ${standardBusinessDays}`
    );

    // Get all assignees
    const assigneesQuery = `SELECT id, name, working_days_per_week FROM assignees`;
    const assigneesResult = await db.query(assigneesQuery);
    const assignees = assigneesResult.rows;

    console.log(`HOLIDAY DEBUG: Found ${assignees.length} assignees`);
    for (const a of assignees) {
      console.log(
        `HOLIDAY DEBUG: Assignee: ${a.name}, ID: ${a.id}, Working days/week: ${a.working_days_per_week}`
      );
    }

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
        t.due_date
      FROM 
        tasks t
      WHERE 
        t.assignee IS NOT NULL 
        AND t.status != 'Completed'
        AND t.due_date >= $1
        AND (t.start_date IS NULL OR t.start_date <= $2)
    `;

    const tasksResult = await db.query(tasksQuery, [startDate, endDate]);
    console.log(
      `HOLIDAY DEBUG: Found ${tasksResult.rows.length} tasks in period`
    );

    // Process task data
    const assigneeMap = {};

    // Initialize data for all assignees
    for (const assignee of assignees) {
      const assigneeName = assignee.name;

      console.log(
        `HOLIDAY DEBUG: Calculating capacity for assignee: ${assigneeName}`
      );

      // Calculate business days for this specific assignee (considering their holidays)
      const businessDaysForAssignee = await calculateBusinessDays(
        startDate,
        endDate,
        assigneeName
      );

      // Calculate capacity based on working days per week and holidays
      const workingDaysPerWeek =
        parseFloat(assignee.working_days_per_week) || 5;
      const totalCapacity =
        Math.round(businessDaysForAssignee * (workingDaysPerWeek / 5) * 10) /
        10;

      console.log(
        `HOLIDAY DEBUG: Assignee ${assigneeName}: ${businessDaysForAssignee} business days, ${workingDaysPerWeek} days/week, capacity: ${totalCapacity}`
      );

      assigneeMap[assigneeName] = {
        assignee: assigneeName,
        workingDaysPerWeek,
        totalCapacity,
        allocated: 0,
        activeTasks: 0,
      };
    }

    // Process tasks
    for (const task of tasksResult.rows) {
      const assigneeName = task.assignee;

      // Skip if no assignee or the assignee isn't in our map
      if (!assigneeName || !assigneeMap[assigneeName]) {
        console.log(
          `HOLIDAY DEBUG: Skipping task ${task.id} - assignee ${assigneeName} not found in map`
        );
        continue;
      }

      // Calculate days remaining on the task
      const daysRemaining = Math.max(
        0,
        task.days_assigned - (task.days_taken || 0)
      );

      // Skip if no work left
      if (daysRemaining <= 0) {
        console.log(
          `HOLIDAY DEBUG: Skipping task ${task.id} - no work remaining`
        );
        continue;
      }

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

      console.log(
        `HOLIDAY DEBUG: Processing task ID ${task.id}, name: ${task.name}, assignee: ${assigneeName}`
      );
      console.log(
        `HOLIDAY DEBUG: Task dates - start: ${
          taskStartDate.toISOString().split('T')[0]
        }, due: ${taskDueDate.toISOString().split('T')[0]}`
      );
      console.log(
        `HOLIDAY DEBUG: Filter dates - start: ${
          filterStartDate.toISOString().split('T')[0]
        }, end: ${filterEndDate.toISOString().split('T')[0]}`
      );
      console.log(
        `HOLIDAY DEBUG: Task metrics - assigned: ${
          task.days_assigned
        }, taken: ${task.days_taken || 0}, remaining: ${daysRemaining}`
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

        console.log(
          `HOLIDAY DEBUG: Task allocation calculation - effective start: ${
            effectiveStartDate.toISOString().split('T')[0]
          }`
        );
        console.log(
          `HOLIDAY DEBUG: Days in period: ${daysInPeriod}, total days: ${totalDays}, proportion: ${proportion.toFixed(
            2
          )}`
        );
      } else {
        console.log(
          `HOLIDAY DEBUG: Task ends within filter period, using full allocation`
        );
      }

      // Calculate prorated allocation
      const prorated = daysRemaining * proportion;
      console.log(
        `HOLIDAY DEBUG: Final prorated allocation: ${prorated.toFixed(2)} days`
      );

      // Add to assignee's allocation
      assigneeMap[assigneeName].allocated += prorated;
      console.log(
        `HOLIDAY DEBUG: Updated allocation for ${assigneeName}: ${assigneeMap[
          assigneeName
        ].allocated.toFixed(2)} days`
      );
    }

    // Convert to array and calculate additional fields
    const workload = Object.values(assigneeMap).map((assignee) => {
      // Calculate allocation percentage
      let allocationPercentage;
      if (assignee.totalCapacity > 0) {
        // Normal case - we have capacity
        allocationPercentage = Math.round(
          (assignee.allocated / assignee.totalCapacity) * 100
        );
      } else if (assignee.allocated > 0) {
        // No capacity but has allocation - show as 100% (or overallocated)
        allocationPercentage = 1000;
      } else {
        // No capacity and no allocation - 0%
        allocationPercentage = 0;
      }

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

      console.log(
        `HOLIDAY DEBUG: Final calculation for ${
          assignee.assignee
        }: capacity=${assignee.totalCapacity.toFixed(
          1
        )}, allocated=${assignee.allocated.toFixed(
          1
        )}, percentage=${allocationPercentage}%, status=${allocationStatus}`
      );

      return {
        assignee: assignee.assignee,
        workingDaysPerWeek: assignee.workingDaysPerWeek,
        totalCapacity: assignee.totalCapacity,
        allocated: assignee.allocated,
        allocationPercentage,
        allocationStatus,
        activeTasks: assignee.activeTasks,
      };
    });

    res.json({
      startDate,
      endDate,
      businessDays: standardBusinessDays,
      workload,
    });
  } catch (err) {
    console.error('HOLIDAY DEBUG: Error in workload summary:', err);
    res.status(500).json({ error: 'Failed to fetch workload summary' });
  }
});
// Helper function to calculate business days between two dates for a specific assignee name
async function calculateBusinessDays(startDate, endDate, assigneeName = null) {
  console.log(
    `HOLIDAY DEBUG: calculateBusinessDays for ${
      assigneeName || 'Standard'
    } from ${startDate} to ${endDate}`
  );

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

    console.log(
      `HOLIDAY DEBUG: Found ${holidays.length} public holidays: ${holidays.join(
        ', '
      )}`
    );

    // If we have an assigneeName, look up their ID and get their personal holidays
    let assigneeHolidays = [];
    let assigneeId = null;

    if (assigneeName) {
      // First, look up the assignee ID from their name
      const assigneeQuery = `
        SELECT id FROM assignees WHERE name = $1
      `;

      console.log(
        `HOLIDAY DEBUG: Looking up ID for assignee "${assigneeName}"`
      );
      const assigneeResult = await db.query(assigneeQuery, [assigneeName]);

      if (assigneeResult.rows.length > 0) {
        assigneeId = assigneeResult.rows[0].id;
        console.log(`HOLIDAY DEBUG: Found assignee ID: ${assigneeId}`);

        // Get basic single-day holidays
        const singleDayQuery = `
          SELECT holiday_date 
          FROM assignee_holidays
          WHERE assignee_id = $1 
          AND holiday_date BETWEEN $2 AND $3
          AND date_end IS NULL
        `;

        console.log(
          `HOLIDAY DEBUG: Looking up single-day holidays for assignee ID ${assigneeId}`
        );
        const singleDayResult = await db.query(singleDayQuery, [
          assigneeId,
          startDate,
          endDate,
        ]);
        console.log(
          `HOLIDAY DEBUG: Found ${singleDayResult.rows.length} single-day holidays`
        );

        // Extract dates and add to assigneeHolidays
        const singleDays = singleDayResult.rows.map(
          (h) => h.holiday_date.toISOString().split('T')[0]
        );
        assigneeHolidays.push(...singleDays);

        console.log(
          `HOLIDAY DEBUG: Single-day holidays: ${singleDays.join(', ')}`
        );

        // Get date ranges
        const rangeQuery = `
          SELECT holiday_date, date_end
          FROM assignee_holidays
          WHERE assignee_id = $1 
          AND (
            (holiday_date BETWEEN $2 AND $3) OR
            (date_end BETWEEN $2 AND $3) OR
            (holiday_date <= $2 AND date_end >= $3)
          )
          AND date_end IS NOT NULL
        `;

        console.log(
          `HOLIDAY DEBUG: Looking up date ranges for assignee ID ${assigneeId}`
        );
        const rangeResult = await db.query(rangeQuery, [
          assigneeId,
          startDate,
          endDate,
        ]);
        console.log(
          `HOLIDAY DEBUG: Found ${rangeResult.rows.length} date ranges`
        );

        // Process date ranges into individual dates
        for (const range of rangeResult.rows) {
          const rangeStart = new Date(range.holiday_date);
          const rangeEnd = new Date(range.date_end);

          console.log(
            `HOLIDAY DEBUG: Processing range ${
              rangeStart.toISOString().split('T')[0]
            } to ${rangeEnd.toISOString().split('T')[0]}`
          );

          // Set time to beginning of day
          rangeStart.setHours(0, 0, 0, 0);
          rangeEnd.setHours(0, 0, 0, 0);

          // Add all dates in the range to holidays
          const currentDate = new Date(rangeStart);
          const rangeDays = [];

          while (currentDate <= rangeEnd) {
            // Only add dates that fall within our calculation period
            if (currentDate >= start && currentDate <= end) {
              const dateString = currentDate.toISOString().split('T')[0];
              rangeDays.push(dateString);
              assigneeHolidays.push(dateString);
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }

          console.log(
            `HOLIDAY DEBUG: Range expanded to days: ${rangeDays.join(', ')}`
          );
        }
      } else {
        console.log(
          `HOLIDAY DEBUG: No assignee found with name "${assigneeName}"`
        );
      }
    }

    // Combine all holidays and remove duplicates
    const allHolidays = [...new Set([...holidays, ...assigneeHolidays])];
    console.log(
      `HOLIDAY DEBUG: Total holidays (public + assignee): ${allHolidays.length}`
    );
    console.log(`HOLIDAY DEBUG: All holidays: ${allHolidays.join(', ')}`);

    // Calculate days
    let days = 0;
    const current = new Date(start);
    const workingDays = [];
    const holidayDays = [];

    while (current <= end) {
      // Check if it's a weekday and not a holiday
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = allHolidays.includes(dateString);

      if (!isWeekend && !isHoliday) {
        days++;
        workingDays.push(dateString);
      } else if (isHoliday) {
        holidayDays.push(dateString);
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
    }

    console.log(`HOLIDAY DEBUG: Working days: ${workingDays.join(', ')}`);
    console.log(
      `HOLIDAY DEBUG: Weekend or holiday days: ${holidayDays.join(', ')}`
    );
    console.log(
      `HOLIDAY DEBUG: Final business days for ${
        assigneeName || 'Standard'
      }: ${days}`
    );

    return days;
  } catch (error) {
    console.error('HOLIDAY DEBUG: Error in calculateBusinessDays:', error);

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

    console.log(`HOLIDAY DEBUG: Fallback business days (no holidays): ${days}`);
    return days;
  }
}
module.exports = router;
