# Project Planner Web Application - Complete Implementation Guide

A web-based project planning application to replace Excel-based tracking systems. This guide provides detailed, step-by-step instructions for building the entire application from scratch.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Project Setup](#project-setup)
5. [Implementation Phases](#implementation-phases)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)

## Overview

This application converts an Excel-based project planning system into a modern web application with:

- User authentication
- Time tracking interface
- Project management dashboard
- Resource allocation tools
- Real-time updates
- Data import/export capabilities

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Real-time**: WebSocket (Socket.io)
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, GitHub Actions

## Prerequisites

### Required Software

- Node.js (v18+ recommended)
- PostgreSQL (v14+ recommended)
- Git
- VS Code
- Docker (optional)

### Required Knowledge

- JavaScript/TypeScript basics
- React fundamentals
- Node.js/Express basics
- SQL/Database concepts
- Git version control

## Project Setup

### Initial Setup (Completed) ✅

1. **GitHub Repository Setup**

   - Created repository on GitHub
   - Cloned locally
   - Set up .gitignore

2. **VS Code Configuration**

   - Installed recommended extensions
   - Configured workspace settings
   - Set up Prettier formatting

3. **Project Structure**

   ```
   project-planner-app/
   ├── backend/          # Node.js/Express API
   ├── frontend/         # React application
   ├── database/         # Migrations and seeds
   └── docs/            # Documentation
   ```

4. **Database Setup**

   - Installed PostgreSQL
   - Created `project_planner` database
   - Configured environment variables

5. **Backend Server Initialization**
   - Set up Express server
   - Added health check endpoint
   - Configured CORS and middleware

## Implementation Phases

### Phase 1: Basic Setup & Infrastructure ✅

- [x] Project initialization
- [x] Database setup
- [x] Basic Express server
- [ ] Basic React app
- [ ] Frontend-backend connection

### Phase 2: Authentication System (Next)

- [ ] User model and migration
- [ ] Registration endpoint
- [ ] Login endpoint with JWT
- [ ] Protected route middleware
- [ ] Frontend login form
- [ ] Authentication context

### Phase 3: Core Data Models

- [ ] Project model
- [ ] Task model
- [ ] Task Assignment model
- [ ] API endpoints for CRUD
- [ ] Test data seeding

### Phase 4: Effort Tracker (MVP)

- [ ] User tasks endpoint
- [ ] Time entry submission
- [ ] Task list component
- [ ] Time entry form
- [ ] Data refresh functionality

### Phase 5: Data Migration

- [ ] Excel parsing utility
- [ ] User data import
- [ ] Project data import
- [ ] Task data import
- [ ] Validation and error handling

### Phase 6: Dashboard & Reporting

- [ ] Dashboard API
- [ ] RAG status calculation
- [ ] Dashboard UI
- [ ] Project summaries
- [ ] Resource utilization charts

### Phase 7: Advanced Features

- [ ] Real-time updates
- [ ] Email notifications
- [ ] Excel export
- [ ] Audit logging
- [ ] Performance optimization

## Detailed Implementation Steps

### Step 4: Basic React App (Current Step)

**Objective**: Create a minimal React application with TypeScript.

**Implementation**:

```bash
cd frontend
npx create-react-app . --template typescript
npm install axios react-router-dom @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Configure Tailwind** (`frontend/tailwind.config.js`):

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Update CSS** (`frontend/src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Testing**:

```bash
npm start
```

- Verify React app loads at http://localhost:3000
- Check for console errors

### Step 5: Connect Frontend to Backend

**Create API Service** (`frontend/src/services/api.ts`):

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
});

export const healthCheck = () => api.get('/health');

export default api;
```

**Update App Component** (`frontend/src/App.tsx`):

```typescript
import React, { useEffect, useState } from 'react';
import { healthCheck } from './services/api';

function App() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    healthCheck()
      .then((response) => setStatus(response.data.status))
      .catch((error) => setStatus('Error connecting to API'));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Project Planner</h1>
      <p className="mt-4">API Status: {status}</p>
    </div>
  );
}

export default App;
```

### Step 6: User Model and Database Migration

**Install Sequelize**:

```bash
cd backend
npm install sequelize pg pg-hstore
npm install -D sequelize-cli @types/sequelize
```

**Initialize Sequelize**:

```bash
npx sequelize-cli init
```

**Create User Model**:

```bash
npx sequelize-cli model:generate --name User --attributes email:string,password_hash:string,full_name:string,role:string
```

**Update User Model** (`backend/models/user.js`):

```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // associations
    }
  }

  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
    }
  );

  return User;
};
```

**Run Migration**:

```bash
npx sequelize-cli db:migrate
```

### Step 7: Registration Endpoint

**Install Dependencies**:

```bash
npm install bcrypt jsonwebtoken
npm install -D @types/bcrypt @types/jsonwebtoken
```

**Create Auth Routes** (`backend/src/routes/auth.js`):

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password_hash,
      full_name,
      role: 'user',
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating user', error: error.message });
  }
});

module.exports = router;
```

### Step 8: Login Endpoint

**Add Login Route** (`backend/src/routes/auth.js`):

```javascript
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});
```

### Step 9: Protected Route Middleware

**Create Auth Middleware** (`backend/src/middleware/auth.js`):

```javascript
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
```

### Step 10: Frontend Login Form

**Create Login Component** (`frontend/src/components/Login.tsx`):

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

### Database Schema Design

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    workstream VARCHAR(255),
    status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    task_name VARCHAR(255) NOT NULL,
    sub_task VARCHAR(255),
    description TEXT,
    delivery_date DATE,
    status VARCHAR(50),
    rag_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task assignments table
CREATE TABLE task_assignments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id),
    user_id INTEGER REFERENCES users(id),
    days_assigned DECIMAL(10,2),
    days_taken DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time entries table
CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    task_assignment_id INTEGER REFERENCES task_assignments(id),
    user_id INTEGER REFERENCES users(id),
    days_logged DECIMAL(10,2),
    entry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);
```

## API Endpoints Documentation

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Effort Tracking

- `GET /api/efforts/tasks` - Get assigned tasks (protected)
- `POST /api/efforts/time-entry` - Submit time entry (protected)
- `GET /api/efforts/history` - Get time entry history (protected)

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project (admin only)
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)

### Tasks

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard

- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/rag-status` - Get RAG status overview
- `GET /api/dashboard/resource-utilization` - Get resource utilization

### Reports

- `GET /api/reports/project/:id` - Generate project report
- `GET /api/reports/user/:id` - Generate user report
- `POST /api/reports/export` - Export data to Excel

## Testing Strategy

### Unit Testing

```javascript
// Example test for auth service
describe('Auth Service', () => {
  test('should hash password correctly', async () => {
    const password = 'testpassword';
    const hash = await authService.hashPassword(password);
    expect(hash).not.toBe(password);
  });
});
```

### Integration Testing

```javascript
// Example API test
describe('POST /api/auth/login', () => {
  test('should return token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### E2E Testing

```javascript
// Example Cypress test
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Deployment

### Docker Configuration

**Backend Dockerfile**:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

**Frontend Dockerfile**:

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: project_planner
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  backend:
    build: ./backend
    ports:
      - '3001:3001'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/project_planner
      - JWT_SECRET=your-secret-key
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - '3000:80'
    depends_on:
      - backend

volumes:
  postgres_data:
```

### CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml**:

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: |
          cd backend
          npm install

      - name: Run Backend Tests
        run: |
          cd backend
          npm test

      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm install

      - name: Run Frontend Tests
        run: |
          cd frontend
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Production
        # Add your deployment steps here
        run: echo "Deploying to production"
```

## Security Considerations

1. **Authentication & Authorization**

   - JWT tokens with expiration
   - Role-based access control
   - Password hashing with bcrypt

2. **Input Validation**

   - Sanitize all user inputs
   - Use parameterized queries
   - Validate request bodies

3. **Environment Variables**

   - Never commit secrets
   - Use .env files
   - Rotate keys regularly

4. **API Security**
   - Rate limiting
   - CORS configuration
   - HTTPS only in production

## Performance Optimization

1. **Database**

   - Proper indexing
   - Query optimization
   - Connection pooling

2. **Caching**

   - Redis for session management
   - API response caching
   - Static asset caching

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization

## Monitoring and Logging

1. **Application Monitoring**

   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

2. **Logging Strategy**

   - Structured logging
   - Log levels (info, warn, error)
   - Log rotation

3. **Metrics**
   - Response times
   - Error rates
   - User activity

## Troubleshooting Guide

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Test connection
   psql -U postgres -d project_planner
   ```

2. **Port Conflicts**

   ```bash
   # Find process using port
   lsof -i :3001

   # Kill process
   kill -9 <PID>
   ```

3. **Node Module Issues**

   ```bash
   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:

1. Check the troubleshooting guide
2. Search existing issues
3. Create a new issue with detailed information

## Roadmap

### Version 1.0

- [x] Basic authentication
- [ ] Effort tracking
- [ ] Project management
- [ ] Basic reporting

### Version 1.1

- [ ] Real-time updates
- [ ] Email notifications
- [ ] Advanced reporting

### Version 2.0

- [ ] Mobile app
- [ ] API integrations
- [ ] Advanced analytics

## Acknowledgments

- Original Excel system design
- Open source libraries used
- Contributors and testers

---

Last Updated: May 2025
Version: 0.1.0
