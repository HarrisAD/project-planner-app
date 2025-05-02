import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import api from '../services/api';

function ApiTestPage() {
  const [results, setResults] = useState([]);

  const testEndpoints = async () => {
    const endpoints = [
      '/health',
      '/projects',
      '/tasks',
      '/users',
      '/', // root
    ];

    const testResults = [];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        testResults.push({
          endpoint,
          status: response.status,
          data: response.data,
        });
      } catch (error) {
        testResults.push({
          endpoint,
          status: error.response?.status || 'Network Error',
          error: error.message,
        });
      }
    }

    setResults(testResults);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        API Endpoint Tester
      </Typography>
      <Button variant="contained" onClick={testEndpoints} sx={{ mb: 3 }}>
        Test All Endpoints
      </Button>

      {results.map((result, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">
            {result.endpoint} - Status: {result.status}
          </Typography>
          {result.error && (
            <Typography color="error">Error: {result.error}</Typography>
          )}
          {result.data && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
        </Paper>
      ))}
    </Box>
  );
}

export default ApiTestPage;
