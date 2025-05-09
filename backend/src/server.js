const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const assigneeRoutes = require('./routes/assignees');
const holidayRoutes = require('./routes/holidays');
const resourceAllocationRoutes = require('./routes/resource-allocation');
const importRoutes = require('./routes/import');

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

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignees', assigneeRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/resource-allocation', resourceAllocationRoutes);
app.use('/api/import', importRoutes);

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
