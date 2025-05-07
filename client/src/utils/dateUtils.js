import { assigneeService, holidayService } from '../services/api';
/**
 * Calculate business days between two dates (excluding weekends)
 * @param {Date} startDate - The start date
 * @param {Date} endDate - The end date
 * @returns {number} - Number of business days
 */
export const calculateBusinessDays = (startDate, endDate) => {
  // Clone dates to avoid modifying the originals
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // If same day, return 0 or 1 depending on whether it's a weekend
  if (start.getTime() === end.getTime()) {
    const day = start.getDay();
    return day === 0 || day === 6 ? 0 : 1;
  }

  // Ensure start date is before end date
  if (start > end) return 0;

  // Calculate days and subtract weekends
  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      days++;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return days;
};

/**
 * Calculate days remaining to complete a task based on time tracking
 * @param {number} daysAssigned - Total days assigned to task
 * @param {number} daysTaken - Days already spent on task
 * @param {Date} dueDate - Task due date
 * @returns {Object} - Contains RAG status and calculation details
 */
export const calculateTaskRagStatus = (daysAssigned, daysTaken, dueDate) => {
  // Calculate remaining work days needed
  const daysRemaining = Math.max(0, daysAssigned - daysTaken);

  // Calculate business days until due date
  const today = new Date();
  const dueDateObj = new Date(dueDate);
  const businessDaysUntilDue = calculateBusinessDays(today, dueDateObj);

  // Calculate buffer (could be negative if behind schedule)
  const buffer = businessDaysUntilDue - daysRemaining;

  // Determine RAG status
  let ragStatus = 1; // Default Green

  if (daysRemaining > businessDaysUntilDue) {
    // Not enough time left (behind schedule)
    ragStatus = 3; // Red
  } else if (buffer <= 3) {
    // Tight buffer (3 or fewer business days)
    ragStatus = 2; // Amber
  }

  return {
    ragStatus,
    buffer,
    daysRemaining,
    businessDaysUntilDue,
  };
};
// Add these new functions to client/src/utils/dateUtils.js

/**
 * Calculate working days for a specific assignee
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} workingDaysPerWeek - Assignee's working days per week
 * @param {string[]} holidayDates - Array of holiday dates (YYYY-MM-DD format)
 * @returns {number} - Number of working days for the assignee
 */
export const calculateAssigneeWorkingDays = (
  startDate,
  endDate,
  workingDaysPerWeek = 5,
  holidayDates = []
) => {
  // Clone dates to avoid modifying the originals
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // If same day, return 0 or 1 depending on whether it's a working day
  if (start.getTime() === end.getTime()) {
    const dayStr = start.toISOString().split('T')[0];
    if (holidayDates.includes(dayStr)) {
      return 0; // It's a holiday
    }

    const day = start.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return 0; // Weekend
    }

    // Calculate daily work fraction based on working days per week
    const workFraction = workingDaysPerWeek / 5.0; // Assume 5-day standard work week
    return workFraction; // Partial day based on working pattern
  }

  // Ensure start date is before end date
  if (start > end) return 0;

  // Calculate days and subtract weekends and holidays
  let days = 0;
  const current = new Date(start);

  while (current <= end) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const day = current.getDay();
    const dayStr = current.toISOString().split('T')[0];

    if (day !== 0 && day !== 6 && !holidayDates.includes(dayStr)) {
      // It's a potential working day
      // Calculate daily work fraction based on working days per week
      const workFraction = workingDaysPerWeek / 5.0;
      days += workFraction;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return Math.round(days * 10) / 10; // Round to 1 decimal place for readability
};

/**
 * Fetch assignee details and holidays for RAG calculations
 * @param {string} assigneeName - Name of the assignee
 * @returns {Promise<Object>} - Assignee data including working days and holidays
 */
export const getAssigneeWorkingData = async (assigneeName) => {
  try {
    // First, fetch all assignees to find the ID
    const assigneesResponse = await assigneeService.getAll();
    const assignee = assigneesResponse.data.find(
      (a) => a.name === assigneeName
    );

    if (!assignee) {
      // Fallback to default values if assignee not found
      return {
        workingDaysPerWeek: 5,
        holidayDates: [],
      };
    }

    // Now fetch the assignee's holidays
    const holidaysResponse = await assigneeService.getHolidays(assignee.id);

    // Process the holidays to include both single days and date ranges
    const holidayDates = [];

    holidaysResponse.data.forEach((holiday) => {
      if (holiday.date_end) {
        // This is a date range - expand it to individual days
        const start = new Date(holiday.holiday_date);
        const end = new Date(holiday.date_end);

        // Set to start of day
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Add each day in the range
        const current = new Date(start);
        while (current <= end) {
          holidayDates.push(current.toISOString().substring(0, 10));
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Single day
        holidayDates.push(holiday.holiday_date.substring(0, 10));
      }
    });

    // Also fetch and include public holidays
    try {
      const publicHolidaysResponse = await holidayService.getAllPublic();
      publicHolidaysResponse.data.forEach((holiday) => {
        holidayDates.push(holiday.holiday_date.substring(0, 10));
      });
    } catch (error) {
      console.warn('Could not fetch public holidays:', error);
    }

    return {
      workingDaysPerWeek: assignee.working_days_per_week || 5,
      holidayDates,
    };
  } catch (error) {
    console.error('Error fetching assignee data:', error);
    // Return default values if there's an error
    return {
      workingDaysPerWeek: 5,
      holidayDates: [],
    };
  }
};
// Add this to dateUtils.js

/**
 * Calculate RAG status based on assignee-specific working pattern
 * @param {number} daysAssigned - Total days assigned to task
 * @param {number} daysTaken - Days already spent on task
 * @param {string} dueDate - Due date (YYYY-MM-DD format)
 * @param {string} assigneeName - Name of the assignee
 * @returns {Promise<Object>} - RAG status information
 */
export const calculateEnhancedRagStatus = async (
  daysAssigned,
  daysTaken,
  dueDate,
  assigneeName
) => {
  // Calculate remaining work days needed
  const daysRemaining = Math.max(0, daysAssigned - daysTaken);

  // Get assignee-specific data
  const { workingDaysPerWeek, holidayDates } = await getAssigneeWorkingData(
    assigneeName
  );

  // Calculate business days until due date, accounting for assignee's working pattern
  const today = new Date();
  const dueDateObj = new Date(dueDate);

  // Calculate assignee-specific working days
  const assigneeWorkingDays = calculateAssigneeWorkingDays(
    today,
    dueDateObj,
    workingDaysPerWeek,
    holidayDates
  );

  // Calculate buffer
  const buffer = assigneeWorkingDays - daysRemaining;

  // Determine RAG status
  let ragStatus = 1; // Default Green

  if (daysRemaining > assigneeWorkingDays) {
    // Not enough time left (behind schedule)
    ragStatus = 3; // Red
  } else if (buffer <= 3) {
    // Tight buffer (3 or fewer business days)
    ragStatus = 2; // Amber
  }

  return {
    ragStatus,
    buffer,
    daysRemaining,
    assigneeWorkingDays,
    workingDaysPerWeek,
    holidayCount: holidayDates.length,
  };
};

// Add these functions to client/src/utils/dateUtils.js

/**
 * Determine task status based on days taken, days assigned, and last updated timestamp
 * @param {number} daysTaken - Days spent on the task
 * @param {number} daysAssigned - Total days assigned to the task
 * @param {string|Date} lastUpdatedDays - When days taken was last updated
 * @returns {string} - The calculated status
 */
export const determineTaskStatus = (
  daysTaken,
  daysAssigned,
  lastUpdatedDays
) => {
  // Parse values
  const formattedDaysTaken = parseInt(daysTaken) || 0;
  const formattedDaysAssigned = parseInt(daysAssigned) || 1;

  // Check if it's been more than a week since the last update
  const lastUpdated = lastUpdatedDays ? new Date(lastUpdatedDays) : null;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // If last update is more than a week old and task is in progress, set to "On Hold"
  if (
    lastUpdated &&
    lastUpdated < oneWeekAgo &&
    formattedDaysTaken > 0 &&
    formattedDaysTaken < formattedDaysAssigned
  ) {
    return 'On Hold';
  }

  // Determine status based on days taken
  if (formattedDaysTaken === 0) {
    return 'Not Started';
  } else if (formattedDaysTaken < formattedDaysAssigned) {
    return 'In Progress';
  } else {
    return 'Completed';
  }
};

/**
 * Format a date as a time ago string (e.g., "2 days ago")
 * @param {Date} date - The date to format
 * @returns {string} - Formatted string
 */
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return '1 year ago';

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return '1 month ago';

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return '1 day ago';

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return '1 hour ago';

  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return '1 minute ago';

  return 'just now';
};
