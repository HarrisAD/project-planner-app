import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { resourceAllocationService } from '../../services/api';
import { calculateEnhancedRagStatus } from '../../utils/dateUtils';

function ResourceAllocationDetail() {
  const [allocationData, setAllocationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    assignee: '',
    projectId: '',
  });
  const [enhancedRagStatuses, setEnhancedRagStatuses] = useState({});

  useEffect(() => {
    fetchAllocationData();
  }, [filters]);

  // Calculate enhanced RAG statuses for all tasks
  useEffect(() => {
    const calculateAllRagStatuses = async () => {
      const newRagStatuses = {};

      // Process each assignee and their tasks
      for (const assignee of allocationData) {
        if (!assignee.tasks || !Array.isArray(assignee.tasks)) continue;

        for (const task of assignee.tasks) {
          try {
            // Calculate enhanced RAG status using the same function as the Tasks page
            const daysTaken = task.daysAssigned - task.daysRemaining;
            const result = await calculateEnhancedRagStatus(
              task.daysAssigned,
              daysTaken,
              task.dueDate,
              assignee.name
            );

            // Store the calculated RAG status by task ID
            newRagStatuses[task.id] = result.ragStatus;
          } catch (err) {
            console.error(`Error calculating RAG for task ${task.id}:`, err);
            // Use original RAG as fallback
            newRagStatuses[task.id] = task.rag;
          }
        }
      }

      setEnhancedRagStatuses(newRagStatuses);
    };

    if (allocationData.length > 0) {
      calculateAllRagStatuses();
    }
  }, [allocationData]);

  const fetchAllocationData = async () => {
    try {
      setLoading(true);
      const response = await resourceAllocationService.getAll(filters);
      setAllocationData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching allocation data:', err);
      setError('Failed to fetch allocation data. ' + (err.message || ''));
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
    fetchAllocationData();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Not Started':
        return 'default';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Helper function to safely access and format numbers
  const safeToFixed = (value, digits = 1) => {
    if (value === null || value === undefined) return '0.0';
    if (typeof value === 'number') return value.toFixed(digits);
    return '0.0';
  };

  if (loading && allocationData.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading allocation data...
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
          <Typography variant="h5" gutterBottom>
            Resource Allocation Details
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
            size="small"
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
                {Array.from(new Set(allocationData.map((a) => a.name)))
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

      {!loading && allocationData.length === 0 && (
        <Alert severity="info">
          No allocation data found. Try adjusting your filters or make sure
          tasks are assigned to team members.
        </Alert>
      )}

      {allocationData.map((assignee) => (
        <Accordion key={assignee.name} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6">{assignee.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {safeToFixed(assignee.totalDaysRemaining)} days remaining
                  across {assignee.tasks ? assignee.tasks.length : 0} tasks
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: 2 }}
                >
                  {assignee.workingDaysPerWeek || 5} days/week
                </Typography>
                <Chip
                  label={`${
                    assignee.projects ? assignee.projects.length : 0
                  } Projects`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {assignee.projects && assignee.projects.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Projects
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Total Days Assigned</TableCell>
                        <TableCell>Days Remaining</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignee.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>{project.company}</TableCell>
                          <TableCell>
                            {safeToFixed(project.totalDaysAssigned)}
                          </TableCell>
                          <TableCell>
                            {safeToFixed(project.totalDaysRemaining)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No project data available for this assignee.
              </Alert>
            )}

            {assignee.tasks && assignee.tasks.length > 0 ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Tasks
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Task</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>RAG</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Days Assigned</TableCell>
                        <TableCell>Days Remaining</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignee.tasks.map((task) => {
                        // Get the enhanced RAG status from our calculated values
                        const enhancedRag =
                          enhancedRagStatuses[task.id] || task.rag;

                        return (
                          <TableRow key={task.id}>
                            <TableCell>{task.name}</TableCell>
                            <TableCell>{task.projectName}</TableCell>
                            <TableCell>
                              <Chip
                                label={task.status}
                                color={getStatusColor(task.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  enhancedRag === 1
                                    ? 'Green'
                                    : enhancedRag === 2
                                    ? 'Amber'
                                    : 'Red'
                                }
                                color={getRagColor(enhancedRag)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {task.startDate
                                ? new Date(task.startDate).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell>{task.daysAssigned}</TableCell>
                            <TableCell>{task.daysRemaining}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info">
                No tasks assigned to this team member.
              </Alert>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default ResourceAllocationDetail;
