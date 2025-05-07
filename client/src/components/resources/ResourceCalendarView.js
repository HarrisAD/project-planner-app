import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { resourceAllocationService } from '../../services/api';

// Helper function to get dates in a range
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate <= lastDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Helper to check if a date is a weekend
const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get default date range (next 14 days)
const getDefaultDateRange = () => {
  const today = new Date();
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(today.getDate() + 14);

  return {
    startDate: formatDate(today),
    endDate: formatDate(twoWeeksLater),
  };
};

function ResourceCalendarView() {
  const defaultRange = getDefaultDateRange();
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    assignee: '',
    projectId: '',
  });
  const [dates, setDates] = useState([]);
  const [assignees, setAssignees] = useState([]);

  // Generate dates array when date range changes
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      setDates(getDatesInRange(filters.startDate, filters.endDate));
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchCalendarData();
  }, [filters]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await resourceAllocationService.getCalendarView(filters);
      console.log('Calendar data response:', response.data);

      // Group tasks by assignee
      const assigneeMap = {};

      response.data.forEach((task) => {
        if (!assigneeMap[task.assignee]) {
          assigneeMap[task.assignee] = [];
        }
        assigneeMap[task.assignee].push(task);
      });

      // Convert to array format for rendering
      const assigneesList = Object.keys(assigneeMap)
        .sort()
        .map((name) => ({
          name,
          tasks: assigneeMap[name],
        }));

      console.log('Processed assignees list:', assigneesList);

      setAssignees(assigneesList);
      setCalendarData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to fetch calendar data. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleRefresh = () => {
    fetchCalendarData();
  };

  const getTaskForDate = (assigneeTasks, date) => {
    const dateStr = formatDate(date);
    return assigneeTasks.filter((task) => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);
      const currentDate = new Date(date);

      // Make sure to set the time to beginning of day for comparison
      taskStart.setHours(0, 0, 0, 0);
      taskEnd.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      return currentDate >= taskStart && currentDate <= taskEnd;
    });
  };

  const getRagColor = (rag) => {
    switch (rag) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && calendarData.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading calendar data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5">Resource Calendar</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 200 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={filters.assignee}
                label="Assignee"
                onChange={handleFilterChange('assignee')}
              >
                <MenuItem value="">All Assignees</MenuItem>
                {Array.from(new Set(calendarData.map((t) => t.assignee)))
                  .sort()
                  .map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && calendarData.length === 0 && (
        <Alert severity="info">
          No task data found for the selected period. Try adjusting your
          filters.
        </Alert>
      )}

      {assignees.length > 0 && dates.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>
                  Assignee
                </TableCell>
                {dates.map((date) => (
                  <TableCell
                    key={date.toISOString()}
                    align="center"
                    sx={{
                      width: '60px',
                      backgroundColor: isWeekend(date) ? '#f5f5f5' : 'inherit',
                      fontWeight: 'bold',
                    }}
                  >
                    {date.getDate()}
                    <Typography variant="caption" display="block">
                      {
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
                          date.getDay()
                        ]
                      }
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {assignees.length > 0 ? (
                assignees.map((assignee) => (
                  <TableRow key={assignee.name}>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {assignee.name}
                    </TableCell>
                    {dates.map((date) => {
                      const tasksOnDate = getTaskForDate(assignee.tasks, date);
                      return (
                        <TableCell
                          key={date.toISOString()}
                          align="center"
                          sx={{
                            backgroundColor: isWeekend(date)
                              ? '#f5f5f5'
                              : 'inherit',
                            padding: '4px',
                            position: 'relative',
                            height: '60px',
                            ...(tasksOnDate.length > 0 && {
                              border: '1px solid #e0e0e0',
                            }),
                          }}
                        >
                          {tasksOnDate.length > 0 ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                height: '100%',
                              }}
                            >
                              {tasksOnDate.slice(0, 2).map((task) => (
                                <Chip
                                  key={task.id}
                                  label={task.title}
                                  size="small"
                                  color={getRagColor(task.rag)}
                                  sx={{
                                    height: '20px',
                                    fontSize: '0.7rem',
                                    width: '100%',
                                    textOverflow: 'ellipsis',
                                  }}
                                />
                              ))}
                              {tasksOnDate.length > 2 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  +{tasksOnDate.length - 2} more
                                </Typography>
                              )}
                            </Box>
                          ) : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={dates.length + 1}>
                    <Alert severity="info">
                      No assignees found with tasks in this period.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          {dates.length === 0
            ? 'Please select a valid date range.'
            : 'No resource allocation data found for the selected period.'}
        </Alert>
      )}
    </Box>
  );
}

export default ResourceCalendarView;
