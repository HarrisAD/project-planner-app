# Project Planner Web Application

A web-based project planning application to replace Excel-based tracking systems. This application converts an Excel-based project planning system into a modern web application.

## Current Status

**Last Updated**: May 2025  
**Version**: 0.3.0 ✅

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
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── migrations/    # Database migrations
│   │   ├── db.js          # Database connection
│   │   └── server.js      # Express server
│   └── package.json
├── database/             # Migrations and seeds
└── docs/                 # Documentation
```

## Implementation Progress

### Phase 1: Basic Setup & Infrastructure ✅ (100% Complete)

- [x] Project initialization
- [x] Database setup
- [x] Basic Express server with health check
- [x] Basic React app with Material-UI
- [x] Component structure (Dashboard, Projects, Tasks)
- [x] Project and Task forms
- [x] Mock data services
- [x] Frontend-backend connection
- [x] Basic CRUD operations for projects and tasks

### Phase 2: Core Feature Development (Current Phase)

- [ ] Edit/Delete functionality for projects and tasks
- [ ] Project progress calculation based on task completion
- [ ] Task time tracking (days taken vs assigned)
- [ ] RAG status management
- [ ] Resource allocation views
- [ ] Task filtering and search

### Phase 3: Advanced Features (Planned)

- [ ] Dashboard enhancements with charts
- [ ] Project timeline/Gantt view
- [ ] Task dependencies
- [ ] Excel import/export functionality
- [ ] Email notifications
- [ ] Reporting and analytics

### Phase 4: Authentication & Multi-User Support (Future)

- [ ] User model and migration
- [ ] Registration endpoint
- [ ] Login endpoint with JWT
- [ ] Protected route middleware
- [ ] Frontend authentication
- [ ] Role-based access control

## Current Features

### Implemented Features

1. **Dashboard**

   - Project summary cards
   - Metrics display (total projects, active projects, at risk)
   - Project overview table with real data

2. **Projects Module**

   - Project list with RAG status
   - Create new project form
   - Project data display from database
   - Real-time updates

3. **Tasks Module**

   - Task list with status indicators
   - Create new task form
   - Task assignment to projects
   - Due date tracking

4. **Backend API**

   - Projects CRUD endpoints
   - Tasks CRUD endpoints
   - Database integration with PostgreSQL
   - Error handling middleware

5. **Frontend-Backend Integration**
   - Real API calls replacing mock services
   - Error handling and loading states
   - Data persistence in PostgreSQL

## Next Development Tasks

### Priority 1: Complete CRUD Operations

1. Add edit functionality for projects
2. Add edit functionality for tasks
3. Add delete functionality with confirmations
4. Add success/error notifications

### Priority 2: Core Business Features

1. Implement automatic project progress calculation
2. Add task time tracking
3. Create resource allocation views
4. Add RAG status update functionality

### Priority 3: Enhanced User Experience

1. Add search and filtering for projects/tasks
2. Implement sorting on tables
3. Add pagination for large datasets
4. Create detailed project/task views

### Priority 4: Data Management

1. Add Excel import functionality
2. Add Excel export functionality
3. Create data validation rules
4. Implement audit logging

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    workstream VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planning',
    rag INTEGER DEFAULT 1 CHECK (rag IN (1, 2, 3)),
    progress DECIMAL(5,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    assignee VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Not Started',
    rag INTEGER DEFAULT 1 CHECK (rag IN (1, 2, 3)),
    due_date DATE,
    days_assigned INTEGER,
    days_taken INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (future implementation)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project (coming soon)
- `DELETE /api/projects/:id` - Delete project (coming soon)

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task (coming soon)
- `DELETE /api/tasks/:id` - Delete task (coming soon)

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

## Known Issues

- Edit/Delete functionality not yet implemented
- No user authentication (single-user mode)
- Manual project progress updates only
- No data validation on some fields
- No Excel import/export functionality

## Immediate Next Steps

1. **Implement Edit Functionality**

   ```javascript
   // Add to project routes
   router.put('/:id', async (req, res) => {
     // Update project logic
   });
   ```

2. **Implement Delete Functionality**

   ```javascript
   // Add to project routes
   router.delete('/:id', async (req, res) => {
     // Delete project logic
   });
   ```

3. **Add Progress Calculation**
   ```sql
   -- Update project progress based on completed tasks
   UPDATE projects p
   SET progress = (
     SELECT COUNT(*) FILTER (WHERE status = 'Completed') * 100.0 / COUNT(*)
     FROM tasks
     WHERE project_id = p.id
   )
   WHERE id = ?;
   ```

## Future Roadmap

### Version 0.4.0

- Complete CRUD operations
- Automatic progress calculation
- Task time tracking
- Enhanced filtering and search

### Version 0.5.0

- Excel import/export
- Advanced reporting
- Timeline/Gantt view
- Email notifications

### Version 0.6.0

- User authentication
- Role-based access control
- Multi-user support
- Audit logging

### Version 1.0.0

- Complete feature parity with Excel system
- Performance optimization
- Production deployment
- User documentation

## Contributing

1. Create a feature branch from `development`
2. Make your changes
3. Submit a pull request to `development`
4. After review, merge to `main`

## Deployment Notes

For single-user development:

- No authentication required
- Focus on feature completion
- Local deployment only

For future multi-user deployment:

- Implement authentication first
- Add environment-specific configs
- Set up CI/CD pipeline
- Configure production database

## Testing Strategy

Current focus: Manual testing
Future implementation:

- Unit tests for components
- API endpoint tests
- Integration tests
- E2E tests with Cypress

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:

1. Check the troubleshooting section
2. Review known issues
3. Create a GitHub issue

## Acknowledgments

- Original Excel system design
- Material-UI component library
- React community
- PostgreSQL community
