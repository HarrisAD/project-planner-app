import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
} from '@mui/material';

function AssigneeForm({ open, onClose, onSubmit, initialData, isEdit }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      workingDaysPerWeek: 5,
      startDate: '',
    },
  });

  // Reset form when initialData changes (when editing)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        email: initialData.email || '',
        workingDaysPerWeek: initialData.working_days_per_week || 5,
        startDate: initialData.start_date
          ? initialData.start_date.substring(0, 10)
          : '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
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
        <DialogTitle>
          {isEdit ? 'Edit Assignee' : 'Create New Assignee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Assignee name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="workingDaysPerWeek"
                control={control}
                rules={{
                  required: 'Working days is required',
                  min: { value: 0.5, message: 'Minimum is 0.5 days' },
                  max: { value: 7, message: 'Maximum is 7 days' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Working Days per Week"
                    type="number"
                    inputProps={{ step: 0.5 }}
                    fullWidth
                    error={!!errors.workingDaysPerWeek}
                    helperText={errors.workingDaysPerWeek?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="startDate"
                control={control}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update Assignee' : 'Create Assignee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AssigneeForm;
