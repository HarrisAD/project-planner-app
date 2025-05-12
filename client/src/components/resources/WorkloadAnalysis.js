import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
} from '@mui/material';
import { resourceAllocationService } from '../../services/api';

function WorkloadAnalysis() {
  const [analysisData, setAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    fetchAnalysisData();
  }, [timeframe]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      // Use the workload summary endpoint for allocation data
      const response = await resourceAllocationService.getWorkloadSummary({
        timeframe,
      });
      setAnalysisData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching workload analysis data:', err);
      setError(
        'Failed to fetch workload analysis data. ' + (err.message || '')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  // Calculate prorated allocation for temporary fix
  const calculateProratedAllocation = (allocation) => {
    switch (timeframe) {
      case 'week':
        return parseFloat(allocation) / 3;
      case 'month':
        return parseFloat(allocation);
      case 'quarter':
        return parseFloat(allocation);
      default:
        return parseFloat(allocation) / 3;
    }
  };

  const getAllocationColor = (percentage) => {
    if (percentage > 120) return '#f44336'; // Red
    if (percentage > 90) return '#ff9800'; // Orange
    if (percentage > 50) return '#4caf50'; // Green
    return '#2196f3'; // Blue
  };

  if (loading && !analysisData.workload) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Loading workload analysis...
        </Typography>
      </Box>
    );
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
        <Typography variant="h5">Workload Analysis</Typography>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {analysisData.workload && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1">
              Period: {new Date(analysisData.startDate).toLocaleDateString()} to{' '}
              {new Date(analysisData.endDate).toLocaleDateString()}(
              {analysisData.businessDays} business days)
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Allocation Chart */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Team Allocation
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {analysisData.workload.map((assignee, index) => {
                  const proratedAllocation = calculateProratedAllocation(
                    assignee.allocated
                  );
                  // Calculate allocation percentage
                  let allocationPercentage;
                  if (assignee.totalCapacity > 0) {
                    // Normal case - we have capacity
                    allocationPercentage = Math.round(
                      (proratedAllocation / assignee.totalCapacity) * 100
                    );
                  } else if (proratedAllocation > 0) {
                    // No capacity but has allocation - show as 1000% (extremely overallocated)
                    allocationPercentage = 1000;
                  } else {
                    // No capacity and no allocation - 0%
                    allocationPercentage = 0;
                  }
                  return (
                    <Box key={assignee.assignee} sx={{ mb: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="subtitle1">
                          {assignee.assignee}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: getAllocationColor(allocationPercentage),
                            fontWeight: 'bold',
                          }}
                        >
                          {allocationPercentage}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: '100%',
                          bgcolor: '#eee',
                          borderRadius: 1,
                          height: 20,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.min(100, allocationPercentage)}%`,
                            bgcolor: getAllocationColor(allocationPercentage),
                            height: 20,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mt: 0.5,
                        }}
                      >
                        {proratedAllocation.toFixed(1)} /{' '}
                        {assignee.totalCapacity.toFixed(1)} days
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>
            </Grid>

            {/* Team Utilization Metrics */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Team Utilization
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {(() => {
                  // Calculate overall metrics
                  const totalTeamCapacity = analysisData.workload.reduce(
                    (sum, assignee) => sum + assignee.totalCapacity,
                    0
                  );

                  const totalTeamAllocation = analysisData.workload.reduce(
                    (sum, assignee) =>
                      sum + calculateProratedAllocation(assignee.allocated),
                    0
                  );

                  const overallUtilization = Math.round(
                    (totalTeamAllocation / totalTeamCapacity) * 100
                  );

                  const overallocatedCount = analysisData.workload.filter(
                    (a) =>
                      calculateProratedAllocation(a.allocated) /
                        a.totalCapacity >
                      1.2
                  ).length;

                  const balancedCount = analysisData.workload.filter((a) => {
                    const ratio =
                      calculateProratedAllocation(a.allocated) /
                      a.totalCapacity;
                    return ratio >= 0.5 && ratio <= 0.9;
                  }).length;

                  const underutilizedCount = analysisData.workload.filter(
                    (a) =>
                      calculateProratedAllocation(a.allocated) /
                        a.totalCapacity <
                      0.5
                  ).length;

                  return (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography variant="body1">
                          Overall Team Utilization:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {overallUtilization}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Team Members Overallocated:
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {overallocatedCount} of {analysisData.workload.length}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Team Members Balanced:
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {balancedCount} of {analysisData.workload.length}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          Team Members Underutilized:
                        </Typography>
                        <Typography variant="body2" color="info.main">
                          {underutilizedCount} of {analysisData.workload.length}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Team Capacity: {totalTeamCapacity.toFixed(1)}{' '}
                          days
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Allocated Work: {totalTeamAllocation.toFixed(1)}{' '}
                          days
                        </Typography>
                      </Box>
                    </>
                  );
                })()}
              </Paper>
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {(() => {
                  // Generate recommendations based on allocation data
                  const overallocatedAssignees = analysisData.workload
                    .filter(
                      (a) =>
                        calculateProratedAllocation(a.allocated) /
                          a.totalCapacity >
                        1.2
                    )
                    .map((a) => a.assignee);

                  const underutilizedAssignees = analysisData.workload
                    .filter(
                      (a) =>
                        calculateProratedAllocation(a.allocated) /
                          a.totalCapacity <
                        0.5
                    )
                    .map((a) => a.assignee);

                  return (
                    <>
                      {overallocatedAssignees.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            Consider redistributing tasks from overallocated
                            team members:
                            <strong>
                              {' '}
                              {overallocatedAssignees.join(', ')}
                            </strong>
                          </Typography>
                        </Alert>
                      )}

                      {underutilizedAssignees.length > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            These team members have capacity for additional
                            work:
                            <strong>
                              {' '}
                              {underutilizedAssignees.join(', ')}
                            </strong>
                          </Typography>
                        </Alert>
                      )}

                      {overallocatedAssignees.length === 0 &&
                        underutilizedAssignees.length === 0 && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              Team workload seems well balanced!
                            </Typography>
                          </Alert>
                        )}

                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Optimization Tips:
                        </Typography>
                        <ul>
                          <li>
                            <Typography variant="body2">
                              Consider task priorities when redistribution work
                            </Typography>
                          </li>
                          <li>
                            <Typography variant="body2">
                              Review due dates of overallocated team members
                            </Typography>
                          </li>
                          <li>
                            <Typography variant="body2">
                              Check for skills match when reassigning tasks
                            </Typography>
                          </li>
                        </ul>
                      </Box>
                    </>
                  );
                })()}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

export default WorkloadAnalysis;
