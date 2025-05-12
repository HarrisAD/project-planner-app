// client/src/components/tasks/TimeUsageDisplay.js
import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

/**
 * Component to display time usage for a task
 * @param {number} daysAssigned - Total days assigned to task
 * @param {number} daysTaken - Days already spent on task
 * @param {number} ragStatus - Current RAG status (1=Green, 2=Amber, 3=Red)
 * @param {boolean} showPercentage - Whether to show percentage completion
 */
function TimeUsageDisplay({
  daysAssigned,
  daysTaken,
  ragStatus,
  showPercentage = false,
}) {
  // Add debug log to see what values are being passed in
  console.log('TimeUsageDisplay received:', {
    daysAssigned,
    daysTaken,
    ragStatus,
  });

  // Parse values more carefully to handle edge cases like '0.0'
  const formattedDaysTaken = parseFloat(daysTaken);
  const formattedDaysAssigned = parseFloat(daysAssigned);

  // Only use default values if the parsed value is NaN, not if it's 0
  const finalDaysTaken = isNaN(formattedDaysTaken) ? 0 : formattedDaysTaken;
  const finalDaysAssigned = isNaN(formattedDaysAssigned)
    ? 1
    : formattedDaysAssigned === 0
    ? 0.1
    : formattedDaysAssigned;

  // Additional debug log to confirm parsed values
  console.log('TimeUsageDisplay final values:', {
    finalDaysTaken,
    finalDaysAssigned,
  });

  // Calculate percentage (capped at 100%)
  const percentage = Math.min(100, (finalDaysTaken / finalDaysAssigned) * 100);

  // Determine color based on RAG status
  let color = 'primary';
  if (ragStatus === 3) {
    color = 'error';
  } else if (ragStatus === 2) {
    color = 'warning';
  } else if (ragStatus === 1) {
    color = 'success';
  }

  return (
    <Tooltip
      title={`${finalDaysTaken.toFixed(1)} of ${finalDaysAssigned.toFixed(
        1
      )} days used (${Math.round(percentage)}%)`}
      arrow
    >
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${finalDaysTaken.toFixed(1)}/${finalDaysAssigned.toFixed(1)}`}
            </Typography>
          </Box>
        </Box>

        {showPercentage && (
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ mt: 0.5 }}
          >
            {Math.round(percentage)}% complete
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
export default TimeUsageDisplay;
