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
