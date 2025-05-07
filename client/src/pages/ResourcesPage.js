import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import ResourceSummary from '../components/resources/ResourceSummary';
import ResourceAllocationDetail from '../components/resources/ResourceAllocationDetail';
import ResourceCalendarView from '../components/resources/ResourceCalendarView';
import WorkloadAnalysis from '../components/resources/WorkloadAnalysis';

function ResourcesPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Resource Allocation
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Summary" />
          <Tab label="Allocation Details" />
          <Tab label="Calendar View" />
          <Tab label="Workload Analysis" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Box>
          <ResourceSummary />
        </Box>
      )}
      {activeTab === 1 && (
        <Box>
          <ResourceAllocationDetail />
        </Box>
      )}
      {activeTab === 2 && (
        <Box>
          <ResourceCalendarView />
        </Box>
      )}
      {activeTab === 3 && (
        <Box>
          <WorkloadAnalysis />
        </Box>
      )}
    </Box>
  );
}

export default ResourcesPage;
