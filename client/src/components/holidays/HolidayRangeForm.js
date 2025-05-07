// client/src/components/holidays/HolidayRangeForm.js

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
} from '@mui/material';

function HolidayRangeForm({ open, onClose, onSubmit, assigneeName }) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  // Watch fields for validation
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Check if end date is before start date
  const invalidDateRange =
    startDate && endDate && new Date(endDate) < new Date(startDate);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>Add Holiday Range for {assigneeName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Add a continuous block of time off by specifying a start and end
                date.
              </Typography>
            </Grid>

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
                name="endDate"
                control={control}
                rules={{ required: 'End date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate?.message}
                  />
                )}
              />
            </Grid>

            {invalidDateRange && (
              <Grid item xs={12}>
                <Alert severity="error">
                  End date cannot be before start date.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (optional)"
                    fullWidth
                    placeholder="e.g., Annual Leave, Vacation, etc."
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
            disabled={invalidDateRange}
          >
            Add Holiday Range
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default HolidayRangeForm;
