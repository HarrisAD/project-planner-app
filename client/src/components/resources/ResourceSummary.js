import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import { resourceAllocationService } from '../../services/api';

function ResourceSummary() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    fetchSummaryData();
  }, [timeframe]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const response = await resourceAllocationService.getWorkloadSummary({
        timeframe,
      });
      setSummaryData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching resource summary:', err);
      setError(
        'Failed to fetch resource allocation data. ' + (err.message || '')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

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
        return 'default';
    }
  };

  // Helper to safely format numbers
  const safeToFixed = (value, digits = 1) => {
    if (value === null || value === undefined) return '0.0';
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    // Check if it's actually a number after conversion
    if (isNaN(numValue)) return '0.0';
    // Now we can safely use toFixed
    return numValue.toFixed(digits);
  };

  if (loading && !summaryData) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3,
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Resource Allocation Summary</Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={handleTimeframeChange}
          >
            <MenuItem value="week">Next Week</MenuItem>
            <MenuItem value="month">Next Month</MenuItem>
            <MenuItem value="quarter">Next Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {summaryData && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Period: {new Date(summaryData.startDate).toLocaleDateString()} to{' '}
              {new Date(summaryData.endDate).toLocaleDateString()}(
              {summaryData.businessDays} business days)
            </Typography>
          </Box>

          {summaryData.workload && summaryData.workload.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Assignee</TableCell>
                    <TableCell>Working Days/Week</TableCell>
                    <TableCell>Capacity (Days)</TableCell>
                    <TableCell>Allocated (Days)</TableCell>
                    <TableCell>Allocation</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Active Tasks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData.workload.map((row) => (
                    <TableRow key={row.assignee}>
                      <TableCell>{row.assignee}</TableCell>
                      <TableCell>{row.workingDaysPerWeek}</TableCell>
                      <TableCell>{safeToFixed(row.totalCapacity)}</TableCell>
                      <TableCell>{safeToFixed(row.allocated)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(
                                100,
                                parseInt(row.allocationPercentage) || 0
                              )}
                              color={getAllocationColor(row.allocationStatus)}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {row.allocationPercentage || 0}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.allocationStatus || 'Unknown'}
                          color={getAllocationColor(row.allocationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.activeTasks || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No workload data available for this timeframe.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

export default ResourceSummary;
