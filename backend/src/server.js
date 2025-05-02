const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Project Planner API v1' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📱 Health check available at http://localhost:${PORT}/api/health`
  );
});
// In your backend server.js or routes file
app.get('/api/projects', (req, res) => {
  // Temporary test data
  res.json([
    { id: 1, name: 'Test Project 1', status: 'active' },
    { id: 2, name: 'Test Project 2', status: 'planning' },
  ]);
});
