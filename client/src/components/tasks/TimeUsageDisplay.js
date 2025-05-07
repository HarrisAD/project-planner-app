// client/src/components/tasks/TimeUsageDisplay.js
import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

/**
 * Component to display time usage for a task
 * @param {number} daysAssigned - Total days assigned to task
 * @param {number} daysTaken - Days already spent on task
 * @param {number} ragStatus - Current RAG status (1=Green, 2=Amber, 3=Red)
 */
function TimeUsageDisplay({ daysAssigned, daysTaken, ragStatus }) {
  const formattedDaysTaken = parseInt(daysTaken) || 0;
  const formattedDaysAssigned = parseInt(daysAssigned) || 1; // Prevent division by zero

  // Calculate percentage (capped at 100%)
  const percentage = Math.min(
    100,
    (formattedDaysTaken / formattedDaysAssigned) * 100
  );

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
      title={`${formattedDaysTaken} of ${formattedDaysAssigned} days used (${Math.round(
        percentage
      )}%)`}
      arrow
    >
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
            {`${formattedDaysTaken}/${formattedDaysAssigned}`}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

export default TimeUsageDisplay;
