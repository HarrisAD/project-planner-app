// client/src/components/holidays/PublicHolidayList.js

import React, { useState, useEffect } from 'react';
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
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { holidayService } from '../../services/api';
import PublicHolidayForm from './PublicHolidayForm';
import { useNotification } from '../../context/NotificationContext';

function PublicHolidayList() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const { showNotification } = useNotification();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getAllPublic();
      setHolidays(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching public holidays:', err);
      setError('Failed to fetch public holidays');
      showNotification('Failed to fetch public holidays', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenForm = () => {
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleAddHoliday = async (data) => {
    try {
      await holidayService.createPublic(data);
      fetchHolidays();
      setOpenForm(false);
      showNotification('Public holiday added successfully');
    } catch (err) {
      console.error('Error adding public holiday:', err);
      showNotification('Failed to add public holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await holidayService.deletePublic(id);
      fetchHolidays();
      showNotification('Public holiday deleted successfully');
    } catch (err) {
      console.error('Error deleting public holiday:', err);
      showNotification('Failed to delete public holiday', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Public Holidays</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenForm}
        >
          Add Public Holiday
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {holidays.length === 0 ? (
        <Typography>
          No public holidays found. Add your first public holiday!
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell>
                    {new Date(holiday.holiday_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{holiday.description}</TableCell>
                  <TableCell>{holiday.country_code}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete Holiday">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <PublicHolidayForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleAddHoliday}
      />
    </Box>
  );
}

export default PublicHolidayList;
