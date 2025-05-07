// client/src/components/holidays/PublicHolidayForm.js

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

function PublicHolidayForm({ open, onClose, onSubmit }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      holidayDate: '',
      description: '',
      countryCode: 'GB',
    },
  });

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
        <DialogTitle>Add Public Holiday</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="holidayDate"
                control={control}
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Holiday Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.holidayDate}
                    helperText={errors.holidayDate?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    placeholder="e.g., New Year's Day, Christmas Day, etc."
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="countryCode"
                control={control}
                rules={{ required: 'Country code is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.countryCode}>
                    <InputLabel>Country</InputLabel>
                    <Select {...field} label="Country">
                      <MenuItem value="GB">United Kingdom (GB)</MenuItem>
                      <MenuItem value="US">United States (US)</MenuItem>
                      <MenuItem value="CA">Canada (CA)</MenuItem>
                      <MenuItem value="AU">Australia (AU)</MenuItem>
                      <MenuItem value="FR">France (FR)</MenuItem>
                      <MenuItem value="DE">Germany (DE)</MenuItem>
                    </Select>
                    {errors.countryCode && (
                      <FormHelperText>
                        {errors.countryCode.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add Holiday
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default PublicHolidayForm;
