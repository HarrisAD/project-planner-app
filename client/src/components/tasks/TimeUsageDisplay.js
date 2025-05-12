// Replace the entire client/src/components/tasks/TimeUsageDisplay.js file

import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';

/**
 * Component to display time usage for a task
 * @param {number|string} daysAssigned - Total days assigned to task
 * @param {number|string} daysTaken - Days already spent on task
 * @param {number} ragStatus - Current RAG status (1=Green, 2=Amber, 3=Red)
 * @param {boolean} showPercentage - Whether to show percentage completion
 */
function TimeUsageDisplay({
  daysAssigned,
  daysTaken,
  ragStatus,
  showPercentage = false,
}) {
  // Use state to store processed values
  const [processedValues, setProcessedValues] = useState({
    daysAssigned: 1,
    daysTaken: 0,
    percentage: 0,
  });

  // Process values when props change
  useEffect(() => {
    // Helper function to safely parse numeric values
    const safeParseFloat = (value) => {
      if (value === null || value === undefined || value === '') return 0;

      // If it's already a number, return it directly
      if (typeof value === 'number') return value;

      // Try to parse it if it's a string
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }

      return 0;
    };

    // Process the values
    const parsedDaysAssigned = safeParseFloat(daysAssigned);
    const parsedDaysTaken = safeParseFloat(daysTaken);

    // Ensure we have valid minimums
    const finalDaysAssigned =
      parsedDaysAssigned <= 0 ? 0.1 : parsedDaysAssigned;
    const finalDaysTaken = parsedDaysTaken < 0 ? 0 : parsedDaysTaken;

    // Calculate percentage
    const percentage = Math.min(
      100,
      (finalDaysTaken / finalDaysAssigned) * 100
    );

    // Update state
    setProcessedValues({
      daysAssigned: finalDaysAssigned,
      daysTaken: finalDaysTaken,
      percentage,
    });
  }, [daysAssigned, daysTaken]);

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
      title={`${processedValues.daysTaken.toFixed(
        1
      )} of ${processedValues.daysAssigned.toFixed(1)} days used (${Math.round(
        processedValues.percentage
      )}%)`}
      arrow
    >
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={processedValues.percentage}
              color={color}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${processedValues.daysTaken.toFixed(
                1
              )}/${processedValues.daysAssigned.toFixed(1)}`}
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
            {Math.round(processedValues.percentage)}% complete
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export default TimeUsageDisplay;
