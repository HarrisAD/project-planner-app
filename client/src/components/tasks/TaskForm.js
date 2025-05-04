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
} from '@mui/material';
import { projectService } from '../../services/api';

function TaskForm({ open, onClose, onSubmit }) {
  const [projects, setProjects] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      projectId: '',
      assignee: '',
      status: 'Not Started',
      rag: 1,
      dueDate: '',
      daysAssigned: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      projectService.getAll().then((response) => {
        setProjects(response.data);
      });
    }
  }, [open]);

  const handleFormSubmit = (data) => {
    // Convert string values to proper types
    const taskData = {
      ...data,
      projectId: parseInt(data.projectId),
      daysAssigned: parseInt(data.daysAssigned),
      rag: parseInt(data.rag),
    };
    onSubmit(taskData);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>Create New Task</DialogTitle>
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
                  <FormControl fullWidth error={!!errors.projectId}>
                    <InputLabel>Project</InputLabel>
                    <Select {...field} label="Project">
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name || project.workstream}
                        </MenuItem>
                      ))}
                    </Select>
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
                  <TextField
                    {...field}
                    label="Assignee"
                    fullWidth
                    error={!!errors.assignee}
                    helperText={errors.assignee?.message}
                  />
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
                name="rag"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>RAG Status</InputLabel>
                    <Select {...field} label="RAG Status">
                      <MenuItem value={1}>Green</MenuItem>
                      <MenuItem value={2}>Amber</MenuItem>
                      <MenuItem value={3}>Red</MenuItem>
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

            <Grid item xs={12}>
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
          <Button type="submit" variant="contained" color="primary">
            Create Task
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default TaskForm;
