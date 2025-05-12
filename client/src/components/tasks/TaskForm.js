import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Tooltip,
  Box,
  Chip,
  FormHelperText,
} from '@mui/material';
import {
  projectService,
  assigneeService,
  taskService,
} from '../../services/api';
import { calculateTaskRagStatus } from '../../utils/dateUtils';

// Define persona options
const PERSONA_OPTIONS = [
  { value: 'exec_sponsor', label: 'Exec Sponsor' },
  { value: 'exec_lead', label: 'Exec Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'programme_manager', label: 'Programme Manager' },
];

function TaskForm({ open, onClose, onSubmit, initialData, isEdit }) {
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [ragInfo, setRagInfo] = useState({
    ragStatus: 1,
    buffer: 0,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      subTaskName: '', // Changed from isSubTask boolean to subTaskName string
      projectId: '',
      assignee: '',
      status: 'Not Started',
      rag: 1,
      startDate: '',
      dueDate: '',
      daysAssigned: '',
      daysTaken: 0,
      description: '',
      tauNotes: '',
      pathToGreen: '',
      persona: '',
    },
  });

  // Watch the fields that affect RAG calculation
  const daysAssigned = watch('daysAssigned');
  const daysTaken = watch('daysTaken');
  const dueDate = watch('dueDate');
  const startDate = watch('startDate');
  const projectId = watch('projectId');

  // Fetch assignees and projects when form opens
  useEffect(() => {
    if (open) {
      setLoading(true);

      // Fetch projects
      projectService
        .getAll()
        .then((response) => {
          setProjects(response.data);
        })
        .catch((err) => {
          console.error('Error fetching projects:', err);
        });

      // Fetch assignees
      assigneeService
        .getAll()
        .then((response) => {
          setAssignees(response.data);
        })
        .catch((err) => {
          console.error('Error fetching assignees:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  // Calculate RAG status whenever relevant fields change
  useEffect(() => {
    if (daysAssigned && dueDate) {
      try {
        const result = calculateTaskRagStatus(
          parseInt(daysAssigned) || 0,
          parseInt(daysTaken) || 0,
          dueDate
        );
        setRagInfo(result);
      } catch (error) {
        console.error('Error calculating RAG status:', error);
      }
    }
  }, [daysAssigned, daysTaken, dueDate]);

  // Reset form when initialData changes (when editing)
  useEffect(() => {
    if (initialData) {
      // Create function to properly format date without timezone issues
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';

        // Parse the date and adjust for timezone
        const date = new Date(dateString);
        // Get year, month, day and properly format with leading zeros
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Format as YYYY-MM-DD
        return `${year}-${month}-${day}`;
      };

      reset({
        name: initialData.name || '',
        subTaskName: initialData.sub_task_name || '', // New field
        projectId: initialData.project_id || '',
        assignee: initialData.assignee || '',
        status: initialData.status || 'Not Started',
        rag: initialData.rag || 1,
        startDate: formatDateForInput(initialData.start_date),
        dueDate: formatDateForInput(initialData.due_date),
        daysAssigned: initialData.days_assigned || '',
        daysTaken: initialData.days_taken || 0,
        description: initialData.description || '',
        tauNotes: initialData.tau_notes || '',
        pathToGreen: initialData.path_to_green || '',
        persona: initialData.persona || '',
      });
    }
  }, [initialData, reset]);

  // Update assignee field when editing and assignees are loaded
  useEffect(() => {
    if (initialData && initialData.assignee && assignees.length > 0) {
      // Try to find the assignee by name
      const matchedAssignee = assignees.find(
        (a) => a.name === initialData.assignee
      );
      if (matchedAssignee) {
        setValue('assignee', matchedAssignee.name);
      }
    }
  }, [initialData, assignees, setValue]);

  const handleFormSubmit = (data) => {
    // Convert string values to proper types
    const taskData = {
      ...data,
      projectId: parseInt(data.projectId),
      daysAssigned: parseFloat(data.daysAssigned),
      daysTaken: parseFloat(data.daysTaken || 0),
      subTaskName: data.subTaskName, // New field
      rag: ragInfo.ragStatus, // Use calculated RAG status
    };

    // Log the data being submitted
    console.log('Submitting task data with sub-task:', taskData);

    onSubmit(taskData);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
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

  const getRagLabel = (rag) => {
    switch (rag) {
      case 1:
        return 'Green';
      case 2:
        return 'Amber';
      case 3:
        return 'Red';
      default:
        return 'Unknown';
    }
  };

  // Set default start date to today if not provided and creating a new task
  useEffect(() => {
    if (!isEdit && open && !startDate) {
      const today = new Date().toISOString().split('T')[0];
      setValue('startDate', today);
    }
  }, [isEdit, open, startDate, setValue]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Task Name */}
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Task name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Task Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            {/* Sub Task Name - new field */}
            <Grid item xs={12}>
              <Controller
                name="subTaskName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sub Task Name"
                    fullWidth
                    placeholder="Optional sub-task description"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="projectId"
                control={control}
                rules={{ required: 'Project is required' }}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    error={!!errors.projectId}
                    sx={{ minWidth: '120px' }}
                  >
                    <InputLabel>Project</InputLabel>
                    <Select
                      {...field}
                      label="Project"
                      displayEmpty
                      sx={{ minHeight: '56px' }}
                    >
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name || project.workstream}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.projectId && (
                      <FormHelperText>
                        {errors.projectId.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="assignee"
                control={control}
                rules={{ required: 'Assignee is required' }}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    error={!!errors.assignee}
                    sx={{ minWidth: '120px' }}
                  >
                    <InputLabel>Assignee</InputLabel>
                    <Select
                      {...field}
                      label="Assignee"
                      displayEmpty
                      sx={{ minHeight: '56px' }}
                      disabled={loading || assignees.length === 0}
                    >
                      {assignees.map((assignee) => (
                        <MenuItem key={assignee.id} value={assignee.name}>
                          {assignee.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.assignee && (
                      <FormHelperText>{errors.assignee.message}</FormHelperText>
                    )}
                    {assignees.length === 0 && !loading && (
                      <FormHelperText>
                        No assignees found. Please add assignees first.
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            {/* Persona Dropdown */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="persona"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Persona</InputLabel>
                    <Select {...field} label="Persona" displayEmpty>
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {PERSONA_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select {...field} label="Status">
                      <MenuItem value="Not Started">Not Started</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="On Hold">On Hold</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            {/* Start Date Field */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="startDate"
                control={control}
                rules={{ required: 'Start date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="dueDate"
                control={control}
                rules={{ required: 'Due date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Due Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.dueDate}
                    helperText={errors.dueDate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="daysAssigned"
                control={control}
                rules={{
                  required: 'Days assigned is required',
                  min: { value: 0.5, message: 'Must be at least 0.5 days' },
                  validate: {
                    isNumber: (value) =>
                      !isNaN(parseFloat(value)) || 'Must be a valid number',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Days Assigned"
                    type="number"
                    inputProps={{
                      step: 0.5,
                      min: 0.5,
                    }}
                    fullWidth
                    error={!!errors.daysAssigned}
                    helperText={errors.daysAssigned?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="daysTaken"
                control={control}
                rules={{
                  validate: {
                    isNumber: (value) =>
                      !isNaN(parseFloat(value)) || 'Must be a valid number',
                    notNegative: (value) =>
                      parseFloat(value) >= 0 || 'Cannot be negative',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Days Taken"
                    type="number"
                    inputProps={{
                      step: 0.5,
                      min: 0,
                    }}
                    fullWidth
                    error={!!errors.daysTaken}
                    helperText={errors.daysTaken?.message}
                  />
                )}
              />
            </Grid>{' '}
            <Grid item xs={12} sm={6}>
              <Controller
                name="daysTaken"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Days Taken"
                    type="number"
                    fullWidth
                    error={!!errors.daysTaken}
                    helperText={errors.daysTaken?.message}
                  />
                )}
              />
            </Grid>
            {/* RAG Status Display (Read-only) */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  RAG Status (Auto-calculated):
                </Typography>
                <Tooltip
                  title={`Buffer: ${ragInfo.buffer} business days. ${ragInfo.daysRemaining} days of work remaining with ${ragInfo.businessDaysUntilDue} business days until due.`}
                  arrow
                >
                  <Chip
                    label={getRagLabel(ragInfo.ragStatus)}
                    color={getRagColor(ragInfo.ragStatus)}
                    sx={{ mt: 1 }}
                  />
                </Tooltip>
              </Box>
            </Grid>
            {/* Task Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter task description here..."
                  />
                )}
              />
            </Grid>
            {/* Path to Green */}
            <Grid item xs={12}>
              <Controller
                name="pathToGreen"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Path to Green"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Enter steps to move task to green status..."
                  />
                )}
              />
            </Grid>
            {/* Tau Notes */}
            <Grid item xs={12}>
              <Controller
                name="tauNotes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tau Notes"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Enter TAU notes here..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || assignees.length === 0}
          >
            {isEdit ? 'Update Task' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default TaskForm;
