import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  TextField,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  projectService,
  taskService,
  resourceAllocationService,
} from '../services/api';
function HomePage() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dueDateFilter, setDueDateFilter] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // Default to 2 weeks from today
    return date.toISOString().split('T')[0];
  });
  const [resourceAllocations, setResourceAllocations] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchResourceAllocations();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      // First, get all tasks to calculate progress
      const tasksResponse = await taskService.getAll();
      const allTasks = tasksResponse.data;

      // Then get projects
      const projectsResponse = await projectService.getAll();
      const projectsList = projectsResponse.data;

      // Calculate project progress the same way as in the Projects tab
      const projectsWithCorrectProgress = projectsList.map((project) => {
        // Filter tasks for this project
        const projectTasks = allTasks.filter(
          (task) => task.project_id === project.id
        );

        // Calculate total days assigned and used
        const totalAssigned = projectTasks.reduce(
          (sum, task) => sum + (Number(task.days_assigned) || 0),
          0
        );
        const totalUsed = projectTasks.reduce(
          (sum, task) => sum + (Number(task.days_taken) || 0),
          0
        );

        // Calculate progress (avoid division by zero)
        let progress = 0;
        if (totalAssigned > 0) {
          progress = totalUsed / totalAssigned;
        }

        console.log(
          `Project ${project.id} progress calculation: ${totalUsed}/${totalAssigned} = ${progress}`
        );

        return {
          ...project,
          progress: progress, // Override with our calculated progress
        };
      });

      setProjects(projectsWithCorrectProgress);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAll();

      // Process each task to calculate enhanced RAG status
      const tasksPromises = response.data.map(async (task) => {
        const daysAssigned = task.days_assigned || 0;
        const daysTaken = task.days_taken || 0;
        const dueDate = task.due_date;
        const assignee = task.assignee;

        let timeInfo = {
          daysRemaining: Math.max(0, daysAssigned - daysTaken),
          percentComplete:
            daysAssigned > 0 ? (daysTaken / daysAssigned) * 100 : 0,
          businessDaysUntilDue: 0,
          buffer: 0,
          calculatedRag: task.rag || 1, // Default to existing RAG
        };

        // Calculate enhanced RAG status if we have all necessary data
        if (dueDate && assignee) {
          try {
            // Import the calculation function
            const { calculateEnhancedRagStatus } = await import(
              '../utils/dateUtils'
            );

            const result = await calculateEnhancedRagStatus(
              daysAssigned,
              daysTaken,
              dueDate,
              assignee
            );

            timeInfo = {
              ...timeInfo,
              businessDaysUntilDue: result.assigneeWorkingDays,
              buffer: result.buffer,
              calculatedRag: result.ragStatus,
              workingDaysPerWeek: result.workingDaysPerWeek,
              holidayCount: result.holidayCount,
            };
          } catch (error) {
            console.error(`Error calculating RAG for task ${task.id}:`, error);
          }
        }

        return {
          ...task,
          timeInfo,
        };
      });

      // Wait for all RAG calculations to complete
      const enhancedTasks = await Promise.all(tasksPromises);

      console.log('Enhanced tasks with RAG calculation:', enhancedTasks);
      setTasks(enhancedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
  const fetchResourceAllocations = async () => {
    try {
      // Default empty response structure in case of errors
      const defaultResponse = {
        data: {
          workload: [],
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          businessDays: 0,
        },
      };

      // Fetch allocation summaries for different timeframes with error handling
      let weekResponse, monthResponse, twoMonthResponse, quarterResponse;

      try {
        weekResponse = await resourceAllocationService.getWorkloadSummary({
          timeframe: 'week',
        });
      } catch (error) {
        console.error('Error fetching week data:', error);
        weekResponse = defaultResponse;
      }

      try {
        monthResponse = await resourceAllocationService.getWorkloadSummary({
          timeframe: 'month',
        });
      } catch (error) {
        console.error('Error fetching month data:', error);
        monthResponse = defaultResponse;
      }

      try {
        // Now fetch 2-month data directly instead of interpolating
        twoMonthResponse = await resourceAllocationService.getWorkloadSummary({
          timeframe: 'twomonth', // Add this new timeframe value
        });
      } catch (error) {
        console.error('Error fetching two-month data:', error);
        twoMonthResponse = defaultResponse;
      }

      try {
        quarterResponse = await resourceAllocationService.getWorkloadSummary({
          timeframe: 'quarter',
        });
      } catch (error) {
        console.error('Error fetching quarter data:', error);
        quarterResponse = defaultResponse;
      }

      // Safely access workload arrays with fallbacks
      const weekWorkload = weekResponse?.data?.workload || [];
      const monthWorkload = monthResponse?.data?.workload || [];
      const twoMonthWorkload = twoMonthResponse?.data?.workload || []; // Use direct data
      const quarterWorkload = quarterResponse?.data?.workload || [];

      // Collect all unique assignees from all timeframes
      const allAssigneeNames = new Set([
        ...weekWorkload.map((a) => a.assignee),
        ...monthWorkload.map((a) => a.assignee),
        ...twoMonthWorkload.map((a) => a.assignee), // Add this
        ...quarterWorkload.map((a) => a.assignee),
      ]);

      console.log('All assignee names:', Array.from(allAssigneeNames));

      // Helper function to calculate allocation percentage
      const calculateAllocation = (allocated, capacity) => {
        if (capacity > 0) {
          return Math.round((allocated / capacity) * 100);
        } else if (allocated > 0) {
          return 1000; // Fixed high percentage to indicate extreme overallocation
        } else {
          return 0;
        }
      };

      // Helper function to determine allocation status
      const determineStatus = (percentage) => {
        if (percentage > 120) return 'Overallocated';
        if (percentage > 90) return 'Full';
        if (percentage > 50) return 'Balanced';
        return 'Underallocated';
      };

      // Transform data for easier display
      const assignees = Array.from(allAssigneeNames).map((assigneeName) => {
        // Find data in each timeframe (or use default if not found)
        const weekData = weekWorkload.find(
          (a) => a.assignee === assigneeName
        ) || {
          assignee: assigneeName,
          allocated: 0,
          totalCapacity: 0,
          allocationPercentage: 0,
          allocationStatus: 'Unknown',
          workingDaysPerWeek: 5,
        };

        const monthData = monthWorkload.find(
          (a) => a.assignee === assigneeName
        ) || {
          allocated: 0,
          totalCapacity: 0,
          allocationPercentage: 0,
          allocationStatus: 'Unknown',
        };

        // New: directly use two-month data instead of interpolating
        const twoMonthData = twoMonthWorkload.find(
          (a) => a.assignee === assigneeName
        ) || {
          allocated: 0,
          totalCapacity: 0,
          allocationPercentage: 0,
          allocationStatus: 'Unknown',
        };

        const quarterData = quarterWorkload.find(
          (a) => a.assignee === assigneeName
        ) || {
          allocated: 0,
          totalCapacity: 0,
          allocationPercentage: 0,
          allocationStatus: 'Unknown',
        };

        // Get raw values with safe defaults
        const weekAllocated = parseFloat(weekData.allocated || 0);
        const weekCapacity = parseFloat(weekData.totalCapacity || 0);
        const monthAllocated = parseFloat(monthData.allocated || 0);
        const monthCapacity = parseFloat(monthData.totalCapacity || 0);
        // New: directly use two-month data
        const twoMonthAllocated = parseFloat(twoMonthData.allocated || 0);
        const twoMonthCapacity = parseFloat(twoMonthData.totalCapacity || 0);
        const quarterAllocated = parseFloat(quarterData.allocated || 0);
        const quarterCapacity = parseFloat(quarterData.totalCapacity || 0);

        // Calculate percentages with our helper function
        const weekAllocation = calculateAllocation(weekAllocated, weekCapacity);
        const monthAllocation = calculateAllocation(
          monthAllocated,
          monthCapacity
        );
        // New: use the actual two-month data directly
        const twoMonthAllocation = calculateAllocation(
          twoMonthAllocated,
          twoMonthCapacity
        );
        const threeMonthAllocation = calculateAllocation(
          quarterAllocated,
          quarterCapacity
        );

        console.log(`${assigneeName} allocations:`, {
          week: `${weekAllocated}/${weekCapacity} = ${weekAllocation}%`,
          month: `${monthAllocated}/${monthCapacity} = ${monthAllocation}%`,
          twoMonth: `${twoMonthAllocated}/${twoMonthCapacity} = ${twoMonthAllocation}%`,
          quarter: `${quarterAllocated}/${quarterCapacity} = ${threeMonthAllocation}%`,
        });

        return {
          name: assigneeName,
          week: {
            allocation: weekAllocation,
            status: determineStatus(weekAllocation),
            details: {
              allocated: weekAllocated.toFixed(1),
              capacity: weekCapacity.toFixed(1),
            },
          },
          month: {
            allocation: monthAllocation,
            status: determineStatus(monthAllocation),
            details: {
              allocated: monthAllocated.toFixed(1),
              capacity: monthCapacity.toFixed(1),
            },
          },
          twoMonths: {
            allocation: twoMonthAllocation,
            status: determineStatus(twoMonthAllocation),
            details: {
              allocated: twoMonthAllocated.toFixed(1), // Use the direct value
              capacity: twoMonthCapacity.toFixed(1),
            },
          },
          threeMonths: {
            allocation: threeMonthAllocation,
            status: determineStatus(threeMonthAllocation),
            details: {
              allocated: quarterAllocated.toFixed(1),
              capacity: quarterCapacity.toFixed(1),
            },
          },
        };
      });

      // Add console log to check final data structure
      console.log('Final resource allocations data:', assignees);

      setResourceAllocations(assignees);
    } catch (err) {
      console.error('Error fetching resource allocations:', err);
      // Set an empty array to prevent rendering errors
      setResourceAllocations([]);
    }
  };
  const getMetrics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === 'In Progress' || p.status === 'Active'
    ).length;
    const atRiskProjects = projects.filter(
      (p) => p.rag === 2 || p.rag === 3
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === 'Completed'
    ).length;

    return { totalProjects, activeProjects, atRiskProjects, completedProjects };
  };

  const getRagColor = (rag) => {
    const ragValue =
      typeof rag === 'object' ? rag.calculatedRag || 1 : rag || 1;

    switch (parseInt(ragValue)) {
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const metrics = getMetrics();

  // Helper function to render tooltip content safely
  const renderTooltipContent = (timeframe) => {
    if (!timeframe) {
      return <Typography variant="body2">No data available</Typography>;
    }

    return (
      <>
        <Typography variant="body2">
          <strong>Allocation:</strong> {timeframe.allocation}% (
          {timeframe.status})
        </Typography>
        <Typography variant="body2">
          <strong>Calculation:</strong> {timeframe.details?.allocated} days
          allocated / {timeframe.details?.capacity} days capacity
        </Typography>
        {timeframe.details?.capacity === '0.0' &&
          timeframe.details?.allocated !== '0.0' && (
            <Typography variant="body2" color="error">
              Warning: No capacity available but work is allocated!
            </Typography>
          )}
      </>
    );
  };

  const filteredUpcomingTasks = tasks
    .filter((task) => {
      if (!task.due_date) return false;
      if (!dueDateFilter) return true;

      const taskDueDate = new Date(task.due_date);
      const filterDate = new Date(dueDateFilter);

      return taskDueDate <= filterDate;
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const getAllocationColor = (status) => {
    switch (status) {
      case 'Overallocated':
        return 'error';
      case 'Full':
        return 'warning';
      case 'Balanced':
        return 'success';
      case 'Underallocated':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Project Planning Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Last refreshed: {new Date().toLocaleString()}
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h3">{metrics.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3" color="primary">
                {metrics.activeProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                At Risk
              </Typography>
              <Typography variant="h3" color="warning.main">
                {metrics.atRiskProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h3" color="success.main">
                {metrics.completedProjects}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Tabs for different dashboard views */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Project Summary" />
          <Tab label="Amber/Red Tasks" />
          <Tab label="Upcoming Tasks" />
          <Tab label="Resource Allocation" />
        </Tabs>
      </Box>
      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Project Summary
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>RAG</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name || project.workstream}</TableCell>
                    <TableCell>
                      {project.company || project.company_name}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          project.rag === 1
                            ? 'Green'
                            : project.rag === 2
                            ? 'Amber'
                            : 'Red'
                        }
                        color={getRagColor(project.rag)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            100,
                            Math.round((project.progress || 0) * 100)
                          )}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, textAlign: 'center' }}
                        >
                          {Math.round((project.progress || 0) * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>{' '}
                    <TableCell>{project.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {/* Placeholder for new tabs - we'll implement these next */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Amber/Red Tasks
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Sub Task</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>RAG</TableCell>
                  <TableCell>Path to Green</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks
                  .filter((task) => {
                    // Make sure timeInfo exists
                    if (!task.timeInfo) return task.rag === 2 || task.rag === 3;
                    // Use calculatedRag from timeInfo
                    return (
                      task.timeInfo.calculatedRag === 2 ||
                      task.timeInfo.calculatedRag === 3
                    );
                  })
                  .map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.project_name}</TableCell>
                      <TableCell>{task.company_name}</TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.sub_task_name || '-'}</TableCell>
                      <TableCell>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{task.assignee}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            (task.timeInfo?.calculatedRag || task.rag) === 1
                              ? 'Green'
                              : (task.timeInfo?.calculatedRag || task.rag) === 2
                              ? 'Amber'
                              : 'Red'
                          }
                          color={getRagColor(
                            task.timeInfo?.calculatedRag || task.rag
                          )}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{task.path_to_green || '-'}</TableCell>
                      <TableCell>
                        {task.last_updated_days
                          ? new Date(
                              task.last_updated_days
                            ).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                {tasks.filter((task) => {
                  if (!task.timeInfo) return task.rag === 2 || task.rag === 3;
                  return (
                    task.timeInfo.calculatedRag === 2 ||
                    task.timeInfo.calculatedRag === 3
                  );
                }).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No amber or red tasks found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}{' '}
      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Upcoming Tasks</Typography>
            <TextField
              label="Due Before Date"
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ width: 200 }}
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Task</TableCell>
                  <TableCell>Sub Task</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>RAG</TableCell>
                  <TableCell>Path to Green</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUpcomingTasks.length > 0 ? (
                  filteredUpcomingTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.project_name}</TableCell>
                      <TableCell>{task.company_name}</TableCell>
                      <TableCell>{task.name}</TableCell>
                      <TableCell>{task.sub_task_name || '-'}</TableCell>
                      <TableCell>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{task.assignee}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            (task.timeInfo?.calculatedRag || task.rag) === 1
                              ? 'Green'
                              : (task.timeInfo?.calculatedRag || task.rag) === 2
                              ? 'Amber'
                              : 'Red'
                          }
                          color={getRagColor(
                            task.timeInfo?.calculatedRag || task.rag
                          )}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{task.path_to_green || '-'}</TableCell>
                      <TableCell>
                        {task.last_updated_days
                          ? new Date(
                              task.last_updated_days
                            ).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No tasks due before the selected date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {activeTab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resource Allocation Summary
          </Typography>
          {resourceAllocations.length === 0 ? (
            <Alert severity="info">
              No resource allocation data available. This could be due to no
              assignees or tasks being present in the system.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Assignee</TableCell>
                    <TableCell>Next Week</TableCell>
                    <TableCell>Next Month</TableCell>
                    <TableCell>Next 2 Months</TableCell>
                    <TableCell>Next Quarter</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resourceAllocations.map((assignee) => {
                    // Helper function to render tooltip content safely
                    const renderTooltipContent = (timeframe) => {
                      if (!timeframe) {
                        return (
                          <Typography variant="body2">
                            No data available
                          </Typography>
                        );
                      }

                      return (
                        <>
                          <Typography variant="body2">
                            <strong>Allocation:</strong> {timeframe.allocation}%
                            ({timeframe.status})
                          </Typography>
                          <Typography variant="body2">
                            <strong>Calculation:</strong>{' '}
                            {timeframe.details?.allocated} days allocated /{' '}
                            {timeframe.details?.capacity} days capacity
                          </Typography>
                          {timeframe.details?.capacity === '0.0' &&
                            timeframe.details?.allocated !== '0.0' && (
                              <Typography variant="body2" color="error">
                                Warning: No capacity available but work is
                                allocated!
                              </Typography>
                            )}
                        </>
                      );
                    };

                    // Helper function to safely render progress bar
                    const renderProgressBar = (timeframe) => {
                      if (!timeframe) {
                        return (
                          <Typography variant="caption" color="text.secondary">
                            No data
                          </Typography>
                        );
                      }

                      return (
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, timeframe.allocation || 0)}
                            color={
                              timeframe.status === 'Overallocated'
                                ? 'error'
                                : timeframe.status === 'Full'
                                ? 'warning'
                                : timeframe.status === 'Balanced'
                                ? 'success'
                                : 'info'
                            }
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          <Typography
                            variant="caption"
                            display="block"
                            textAlign="center"
                          >
                            {timeframe.allocation || 0}%
                          </Typography>
                        </Box>
                      );
                    };

                    return (
                      <TableRow key={assignee.name}>
                        <TableCell>{assignee.name}</TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              <React.Fragment>
                                {renderTooltipContent(assignee.week)}
                              </React.Fragment>
                            }
                          >
                            <Box>{renderProgressBar(assignee.week)}</Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              <React.Fragment>
                                {renderTooltipContent(assignee.month)}
                              </React.Fragment>
                            }
                          >
                            <Box>{renderProgressBar(assignee.month)}</Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              <React.Fragment>
                                {renderTooltipContent(assignee.twoMonths)}
                              </React.Fragment>
                            }
                          >
                            <Box>{renderProgressBar(assignee.twoMonths)}</Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              <React.Fragment>
                                {renderTooltipContent(assignee.threeMonths)}
                              </React.Fragment>
                            }
                          >
                            <Box>{renderProgressBar(assignee.threeMonths)}</Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}{' '}
    </Box>
  );
}

export default HomePage;
