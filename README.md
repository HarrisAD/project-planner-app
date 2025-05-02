# Project Planner Web Application

A web-based project planning application to replace Excel-based tracking systems. This application converts an Excel-based project planning system into a modern web application.

## Current Status

**Last Updated**: May 2025  
**Version**: 0.2.0

## Tech Stack

- **Frontend**: React with JavaScript
- **UI Framework**: Material-UI
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **Authentication**: JWT (planned)
- **Testing**: Jest, React Testing Library (planned)

## Prerequisites

### Required Software

- Node.js (v18+ recommended)
- PostgreSQL (v14+ recommended)
- Git
- VS Code or preferred IDE

### Required Knowledge

- JavaScript/React fundamentals
- Node.js/Express basics
- SQL/Database concepts
- Git version control

## Project Structure

```
project-planner-app/
├── client/                # React application
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── projects/  # Project-related components
│   │   │   └── tasks/     # Task-related components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── package.json
├── backend/               # Node.js/Express API (in progress)
├── database/             # Migrations and seeds (planned)
└── docs/                 # Documentation
```

## Implementation Progress

### Phase 1: Basic Setup & Infrastructure ✅ (90% Complete)

- [x] Project initialization
- [x] Database setup
- [x] Basic Express server with health check
- [x] Basic React app with Material-UI
- [x] Component structure (Dashboard, Projects, Tasks)
- [x] Project and Task forms
- [x] Mock data services
- [ ] Frontend-backend connection (Next Step)

### Phase 2: Authentication System (Next Phase)

- [ ] User model and migration
- [ ] Registration endpoint
- [ ] Login endpoint with JWT
- [ ] Protected route middleware
- [ ] Frontend login form
- [ ] Authentication context

### Phase 3: Core Data Models (Planned)

- [ ] Project model
- [ ] Task model
- [ ] Task Assignment model
- [ ] API endpoints for CRUD
- [ ] Test data seeding

### Phase 4: Effort Tracker (Planned)

- [ ] User tasks endpoint
- [ ] Time entry submission
- [ ] Task list component
- [ ] Time entry form
- [ ] Data refresh functionality

## Current Features

### Implemented Features

1. **Dashboard**

   - Project summary cards
   - Metrics display (total projects, active projects, at risk)
   - Project overview table

2. **Projects Module**

   - Project list with RAG status
   - Create new project form
   - Project data display

3. **Tasks Module**

   - Task list with status indicators
   - Create new task form
   - Task assignment to projects

4. **UI/UX**
   - Responsive Material-UI components
   - Navigation between pages
   - Form validation
   - Loading states

### Mock Data Structure

Currently using mock services that simulate:

- Projects with RAG status, progress tracking
- Tasks with assignments and due dates
- Dashboard metrics calculations

## Next Steps

### Step 1: Connect Frontend to Backend

Replace mock services with actual API calls:

```javascript
// Update src/services/api.js
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const projectService = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  // ... other endpoints
};

export const taskService = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  // ... other endpoints
};

export default api;
```

### Step 2: Create Backend API Endpoints

Implement the following endpoints in the backend:

```javascript
// backend/src/routes/projects.js
router.get('/', async (req, res) => {
  // Return all projects
});

router.post('/', async (req, res) => {
  // Create new project
});

// backend/src/routes/tasks.js
router.get('/', async (req, res) => {
  // Return all tasks
});

router.post('/', async (req, res) => {
  // Create new task
});
```

### Step 3: Update Components to Use Real API

Update React components to use the API service instead of mock data:

```javascript
// src/pages/ProjectsPage.js
import { projectService } from '../services/api';

useEffect(() => {
  projectService
    .getAll()
    .then((response) => setProjects(response.data))
    .catch((error) => setError(error.message));
}, []);
```

## Database Schema (Planned)

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    status VARCHAR(50),
    rag INTEGER CHECK (rag IN (1, 2, 3)),
    progress DECIMAL(5,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assignee VARCHAR(255),
    status VARCHAR(50),
    rag INTEGER CHECK (rag IN (1, 2, 3)),
    due_date DATE,
    days_assigned INTEGER,
    days_taken INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Workflow

### To run the project:

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd client
npm install
npm start
```

### Current Endpoints

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Health Check: http://localhost:3001/api/health

## Testing Strategy (To Be Implemented)

### Unit Testing

- Component testing with React Testing Library
- API endpoint testing with Jest
- Service layer testing

### Integration Testing

- Frontend-backend integration tests
- Database operation tests

### E2E Testing

- User flow testing with Cypress
- Critical path testing

## Deployment (Planned)

- Docker containerization
- CI/CD with GitHub Actions
- Environment configuration
- Production deployment strategy

## Security Considerations (Planned)

1. **Authentication & Authorization**

   - JWT implementation
   - Role-based access control
   - Secure password storage

2. **API Security**

   - CORS configuration
   - Rate limiting
   - Input validation

3. **Environment Security**
   - Environment variables for secrets
   - Secure production configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Known Issues

- Mock data is currently used instead of real backend
- Authentication system not yet implemented
- No data persistence between sessions

## Roadmap

### Version 0.3.0 (Current Sprint)

- [ ] Connect frontend to backend
- [ ] Implement basic authentication
- [ ] Database migrations

### Version 0.4.0

- [ ] Effort tracking functionality
- [ ] Time entry forms
- [ ] Resource allocation views

### Version 0.5.0

- [ ] Real-time updates
- [ ] Email notifications
- [ ] Advanced reporting

### Version 1.0.0

- [ ] Complete feature parity with Excel system
- [ ] Performance optimization
- [ ] Production deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

## Acknowledgments

- Original Excel system design
- Material-UI component library
- React community
