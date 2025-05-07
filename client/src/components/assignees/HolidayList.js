import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import DateRangeIcon from '@mui/icons-material/DateRange';

function HolidayList({ holidays, loading, onDelete }) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (holidays.length === 0) {
    return <Typography>No holidays found for this assignee.</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {holidays.map((holiday) => (
            <TableRow key={holiday.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {holiday.date_end ? (
                    <>
                      <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Tooltip title="Date Range">
                        <span>
                          {new Date(holiday.holiday_date).toLocaleDateString()}{' '}
                          - {new Date(holiday.date_end).toLocaleDateString()}
                        </span>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <EventIcon fontSize="small" sx={{ mr: 1 }} />
                      {new Date(holiday.holiday_date).toLocaleDateString()}
                    </>
                  )}
                </Box>
              </TableCell>
              <TableCell>{holiday.description || '-'}</TableCell>
              <TableCell>
                <Tooltip title="Delete Holiday">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDelete(holiday.id)}
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
  );
}

export default HolidayList;
