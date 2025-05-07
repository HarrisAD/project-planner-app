import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid,
  Collapse,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { taskService } from '../services/api';
import TaskForm from '../components/tasks/TaskForm';
import TimeUsageDisplay from '../components/tasks/TimeUsageDisplay';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';
import {
  calculateEnhancedRagStatus,
  determineTaskStatus,
  timeAgo,
} from '../utils/dateUtils';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { showNotification } = useNotification();

  // Filter state
  const [filters, setFilters] = useState({
    name: '',
    project: '',
    assignee: '',
    status: '',
    rag: '',
    dueDate: '',
  });

  // Filter options (derived from task data)
  const [filterOptions, setFilterOptions] = useState({
    projects: [],
    assignees: [],
    statuses: [],
  });

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

      // Extract filter options from the tasks
      const projectOptions = [
        ...new Set(enhancedTasks.map((task) => task.project_name)),
      ]
        .filter(Boolean)
        .sort();
      const assigneeOptions = [
        ...new Set(enhancedTasks.map((task) => task.assignee)),
      ]
        .filter(Boolean)
        .sort();
      const statusOptions = [
        ...new Set(enhancedTasks.map((task) => task.status)),
      ]
        .filter(Boolean)
        .sort();

      setFilterOptions({
        projects: projectOptions,
        assignees: assigneeOptions,
        statuses: statusOptions,
      });

      setTasks(enhancedTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      showNotification('Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever tasks or filters change
  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to apply filters to tasks
  const applyFilters = () => {
    let result = [...tasks];

    // Filter by name
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      result = result.filter((task) =>
        task.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by project
    if (filters.project) {
      result = result.filter((task) => task.project_name === filters.project);
    }

    // Filter by assignee
    if (filters.assignee) {
      result = result.filter((task) => task.assignee === filters.assignee);
    }

    // Filter by status
    if (filters.status) {
      result = result.filter((task) => task.status === filters.status);
    }

    // Filter by RAG status
    if (filters.rag) {
      const ragValue = parseInt(filters.rag);
      result = result.filter(
        (task) => task.timeInfo && task.timeInfo.calculatedRag === ragValue
      );
    }

    // Filter by due date
    if (filters.dueDate) {
      const filterDate = new Date(filters.dueDate);
      filterDate.setHours(0, 0, 0, 0);

      result = result.filter((task) => {
        if (!task.due_date) return false;
        const taskDueDate = new Date(task.due_date);
        taskDueDate.setHours(0, 0, 0, 0);
        return taskDueDate.getTime() === filterDate.getTime();
      });
    }

    setFilteredTasks(result);
  };

  // Filter change handler
  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      project: '',
      assignee: '',
      status: '',
      rag: '',
      dueDate: '',
    });
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  const handleCreateTask = async (taskData) => {
    try {
      console.log('Creating task with data:', taskData);
      await taskService.create(taskData);
      fetchTasks(); // Refresh the list
      setOpenForm(false);
      showNotification('Task created successfully');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Failed to create task');
      showNotification('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      if (!currentTask) return;

      console.log('Updating task with data:', taskData);
      await taskService.update(currentTask.id, taskData);
      fetchTasks(); // Refresh the list
      setOpenForm(false);
      setCurrentTask(null);
      setIsEditing(false);
      showNotification('Task updated successfully');
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.error || 'Failed to update task');
      showNotification('Failed to update task', 'error');
    }
  };

  const handleOpenCreateForm = () => {
    setCurrentTask(null);
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEditForm = (task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentTask(null);
    setIsEditing(false);
  };

  const handleFormSubmit = (data) => {
    if (isEditing) {
      handleUpdateTask(data);
    } else {
      handleCreateTask(data);
    }
  };

  const handleOpenDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleDeleteTask = async () => {
    try {
      if (!taskToDelete) return;

      await taskService.delete(taskToDelete.id);
      fetchTasks(); // Refresh the list
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      showNotification('Task deleted successfully');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.error || 'Failed to delete task');
      showNotification('Failed to delete task', 'error');
    }
  };

  const handleQuickUpdateDaysTaken = async (task, increment) => {
    try {
      // Get the current task from state first
      const currentTask = tasks.find((t) => t.id === task.id);
      if (!currentTask) {
        throw new Error('Task not found in current state');
      }

      // Calculate new days taken
      const newDaysTaken = Math.max(
        0,
        (currentTask.days_taken || 0) + increment
      );

      // Calculate new RAG status using enhanced calculation
      const ragResult = await calculateEnhancedRagStatus(
        currentTask.days_assigned || 0,
        newDaysTaken,
        currentTask.due_date,
        currentTask.assignee
      );

      // Determine the new status based on the updated values
      const newStatus = determineTaskStatus(
        newDaysTaken,
        currentTask.days_assigned,
        new Date() // Current time for the last update
      );

      // Create a complete update object that preserves all original values
      const updateData = {
        name: currentTask.name,
        projectId: currentTask.project_id,
        assignee: currentTask.assignee,
        status: newStatus, // Use the calculated status
        rag: ragResult.ragStatus,
        startDate: currentTask.start_date, // Make sure to include the start date
        dueDate: currentTask.due_date,
        daysAssigned: currentTask.days_assigned,
        daysTaken: newDaysTaken,
        description: currentTask.description || '',
        // No need to send lastUpdatedDays, the backend will set it automatically
      };

      // Update the task
      await taskService.update(currentTask.id, updateData);

      // Update the task in local state to give immediate feedback
      const updatedTasks = tasks.map((t) => {
        if (t.id === currentTask.id) {
          return {
            ...t,
            days_taken: newDaysTaken,
            rag: ragResult.ragStatus,
            status: newStatus,
            last_updated_days: new Date().toISOString(),
            timeInfo: {
              ...t.timeInfo,
              daysRemaining: Math.max(0, t.days_assigned - newDaysTaken),
              percentComplete:
                t.days_assigned > 0
                  ? (newDaysTaken / t.days_assigned) * 100
                  : 0,
              businessDaysUntilDue: ragResult.assigneeWorkingDays,
              buffer: ragResult.buffer,
              calculatedRag: ragResult.ragStatus,
              workingDaysPerWeek: ragResult.workingDaysPerWeek,
              holidayCount: ragResult.holidayCount,
            },
          };
        }
        return t;
      });

      // Update state without fetching
      setTasks(updatedTasks);

      showNotification(
        `Days taken ${
          increment > 0 ? 'increased' : 'decreased'
        } to ${newDaysTaken}. Status: ${newStatus}`
      );
    } catch (err) {
      console.error('Error updating days taken:', err);
      showNotification('Failed to update days taken', 'error');
      // If there was an error, fetch tasks to ensure accurate data
      fetchTasks();
    }
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

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const displayTasks = filteredTasks.length > 0 ? filteredTasks : tasks;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={toggleFilters}
            color={filtersOpen ? 'primary' : 'default'}
          >
            Filters {filtersOpen ? '(Hide)' : '(Show)'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
          >
            Add Task
          </Button>
        </Stack>
      </Box>

      {/* Filter Panel */}
      <Collapse in={filtersOpen}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TextField
                  label="Task Name"
                  variant="outlined"
                  fullWidth
                  value={filters.name}
                  onChange={handleFilterChange('name')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filters.name ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, name: '' }))
                          }
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel
                    id="project-filter-label"
                    shrink={true} // Forces the label to always be in the "shrunk" position
                  >
                    Project
                  </InputLabel>
                  <Select
                    labelId="project-filter-label"
                    value={filters.project}
                    onChange={handleFilterChange('project')}
                    label="Project"
                    displayEmpty
                    notched={true} // Ensures the label outline is always notched for the label
                  >
                    <MenuItem value="">All Projects</MenuItem>
                    {filterOptions.projects.map((project) => (
                      <MenuItem key={project} value={project}>
                        {project}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>{' '}
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="assignee-filter-label" shrink={true}>
                    Assignee
                  </InputLabel>
                  <Select
                    labelId="assignee-filter-label"
                    value={filters.assignee}
                    onChange={handleFilterChange('assignee')}
                    label="Assignee"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Assignees</MenuItem>
                    {filterOptions.assignees.map((assignee) => (
                      <MenuItem key={assignee} value={assignee}>
                        {assignee}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>{' '}
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="status-filter-label" shrink={true}>
                    Status
                  </InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={filters.status}
                    onChange={handleFilterChange('status')}
                    label="Status"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {filterOptions.statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>{' '}
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="rag-filter-label" shrink={true}>
                    RAG Status
                  </InputLabel>
                  <Select
                    labelId="rag-filter-label"
                    value={filters.rag}
                    onChange={handleFilterChange('rag')}
                    label="RAG Status"
                    displayEmpty
                    notched={true}
                  >
                    <MenuItem value="">All RAG Statuses</MenuItem>
                    <MenuItem value="1">Green</MenuItem>
                    <MenuItem value="2">Amber</MenuItem>
                    <MenuItem value="3">Red</MenuItem>
                  </Select>
                </FormControl>{' '}
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={2}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={filters.dueDate}
                  onChange={handleFilterChange('dueDate')}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: filters.dueDate ? (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, dueDate: '' }))
                          }
                          edge="end"
                          size="small"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                >
                  Clear All Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Display filtered count if filtering is active */}
      {Object.values(filters).some((f) => f !== '') && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </Typography>
        </Box>
      )}

      {!loading && tasks.length === 0 ? (
        <Typography>No tasks found. Create your first task!</Typography>
      ) : !loading &&
        filteredTasks.length === 0 &&
        Object.values(filters).some((f) => f !== '') ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No tasks match the current filters. Try adjusting your filter
          criteria.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    RAG
                    <Tooltip
                      title="Automatically calculated based on days assigned, days taken, assignee working days, and holidays"
                      arrow
                    >
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Time Usage
                    <Tooltip title="Shows days taken vs days assigned" arrow>
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.project_name}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        task.timeInfo
                          ? `Buffer: ${task.timeInfo.buffer.toFixed(
                              1
                            )} working days.
                         ${
                           task.timeInfo.daysRemaining
                         } days of work remaining with 
                         ${task.timeInfo.businessDaysUntilDue.toFixed(
                           1
                         )} working days until due.
                         Assignee works ${
                           task.timeInfo.workingDaysPerWeek || 5
                         } days per week.
                         Holidays in period: ${task.timeInfo.holidayCount || 0}`
                          : 'RAG status'
                      }
                      arrow
                    >
                      <Chip
                        label={
                          task.timeInfo.calculatedRag === 1
                            ? 'Green'
                            : task.timeInfo.calculatedRag === 2
                            ? 'Amber'
                            : 'Red'
                        }
                        color={getRagColor(task.timeInfo.calculatedRag)}
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell width="200px">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, mr: 2 }}>
                        <TimeUsageDisplay
                          daysAssigned={task.days_assigned}
                          daysTaken={task.days_taken}
                          ragStatus={task.timeInfo.calculatedRag}
                        />
                      </Box>
                      {/* Quick update buttons */}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleQuickUpdateDaysTaken(task, 1)}
                        title="Add 1 day"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleQuickUpdateDaysTaken(task, -1)}
                        disabled={!task.days_taken}
                        title="Remove 1 day"
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {task.last_updated_days ? (
                      <Tooltip
                        title={new Date(
                          task.last_updated_days
                        ).toLocaleString()}
                      >
                        <span>{timeAgo(new Date(task.last_updated_days))}</span>
                      </Tooltip>
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditForm(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(task)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TaskForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={currentTask}
        isEdit={isEditing}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        content={`Are you sure you want to delete the task "${taskToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
}

export default TasksPage;
