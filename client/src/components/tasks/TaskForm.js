// client/src/components/tasks/TaskForm.js

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
import { projectService, assigneeService } from '../../services/api'; // Add assigneeService import
import { calculateTaskRagStatus } from '../../utils/dateUtils';

function TaskForm({ open, onClose, onSubmit, initialData, isEdit }) {
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]); // New state for assignees
  const [ragInfo, setRagInfo] = useState({
    ragStatus: 1,
    buffer: 0,
    daysRemaining: 0,
  });
  const [loading, setLoading] = useState(false); // Track loading state

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
      projectId: '',
      assignee: '', // This will now be the assignee ID
      status: 'Not Started',
      rag: 1,
      dueDate: '',
      daysAssigned: '',
      daysTaken: 0,
      description: '',
    },
  });

  // Watch the fields that affect RAG calculation
  const daysAssigned = watch('daysAssigned');
  const daysTaken = watch('daysTaken');
  const dueDate = watch('dueDate');

  // Fetch assignees when form opens
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

  // Update status based on days taken and assigned
  useEffect(() => {
    if (daysAssigned && daysTaken !== undefined) {
      const formattedDaysAssigned = parseInt(daysAssigned) || 0;
      const formattedDaysTaken = parseInt(daysTaken) || 0;

      // Only auto-update status in these specific cases
      if (
        formattedDaysTaken === 0 ||
        (formattedDaysTaken > 0 &&
          formattedDaysTaken < formattedDaysAssigned) ||
        formattedDaysTaken >= formattedDaysAssigned
      ) {
        // Determine the new status based on days taken vs assigned
        let newStatus = 'Not Started';
        if (formattedDaysTaken === 0) {
          newStatus = 'Not Started';
        } else if (formattedDaysTaken < formattedDaysAssigned) {
          newStatus = 'In Progress';
        } else {
          newStatus = 'Completed';
        }

        // Use setValue from react-hook-form to update the status field
        setValue('status', newStatus);
      }
    }
  }, [daysAssigned, daysTaken, setValue]);

  // Reset form when initialData changes (when editing)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        projectId: initialData.project_id || '',
        // Find the assignee ID that matches the name from initialData
        assignee: initialData.assignee || '', // We'll handle this separately after assignees load
        status: initialData.status || 'Not Started',
        rag: initialData.rag || 1,
        dueDate: initialData.due_date
          ? initialData.due_date.substring(0, 10)
          : '',
        daysAssigned: initialData.days_assigned || '',
        daysTaken: initialData.days_taken || 0,
        description: initialData.description || '',
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
      daysAssigned: parseInt(data.daysAssigned),
      daysTaken: parseInt(data.daysTaken || 0),
      rag: ragInfo.ragStatus, // Use calculated RAG status
    };
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                      sx={{ minHeight: '56px' }} // Ensure minimum height
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
                      sx={{ minHeight: '56px' }} // Ensure minimum height
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
                  min: { value: 1, message: 'Must be at least 1 day' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Days Assigned"
                    type="number"
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
