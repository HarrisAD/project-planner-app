# Project Planner Web Application

A web-based project planning application to replace Excel-based tracking systems. This application converts an Excel-based project planning system into a modern web application.

## Current Status

**Last Updated**: May 2025  
**Version**: 0.5.0 (in development)

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
│   │   │   ├── common/    # Common UI components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── projects/  # Project-related components
│   │   │   └── tasks/     # Task-related components
│   │   ├── context/       # React contexts
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

### Phase 2: Core Feature Development ✅ (100% Complete)

- [x] Edit/Delete functionality for projects and tasks
- [x] Project progress calculation based on task completion
- [x] Success/error notifications
- [x] Database transaction support
- [x] Cross-project updates for task reassignment
- [x] Form validation and error handling

### Phase 3: Advanced Features (Current Phase)

- [ ] Task time tracking (days taken vs assigned)
- [ ] Resource allocation views
- [ ] Task filtering and search
- [ ] Dashboard enhancements with charts
- [ ] Project timeline/Gantt view
- [ ] Task dependencies

### Phase 4: Data Management & Authentication (Planned)

- [ ] Excel import/export functionality
- [ ] Email notifications
- [ ] Reporting and analytics
- [ ] User model and authentication
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
   - Edit existing projects
   - Delete projects with confirmation
   - Real-time updates

3. **Tasks Module**

   - Task list with status indicators
   - Create new task form
   - Edit existing tasks
   - Delete tasks with confirmation
   - Task assignment to projects

4. **Automatic Progress Calculation**

   - Projects progress updates automatically based on task completion
   - Cross-project updates when tasks are reassigned
   - Visual progress indicators in the UI

5. **User Feedback**

   - Success notifications for operations
   - Error notifications with descriptive messages
   - Improved error handling throughout

6. **Backend API**

   - Full CRUD endpoints for projects and tasks
   - Transaction support for data consistency
   - Error handling middleware
   - Database integration with PostgreSQL

## Time Tracking System

The application implements a comprehensive time tracking system across multiple levels:

### Task Level

- **Progress Calculation**:

  - Task progress is calculated as `(days taken / days assigned) × 100%`
  - Visual indicators show time usage with appropriate color coding

- **RAG Status Logic**:
  - **Red**: Not enough time left to complete the task (remaining business days < estimated time needed)
  - **Amber**: Tight deadline buffer (3 or fewer business days buffer)
  - **Green**: Comfortable buffer (more than 3 business days buffer)
  - The calculation considers:
    - Business days remaining until due date (excluding weekends)
    - Estimated days still needed to complete (days assigned - days taken)

### Project Level

- **RAG Status Cascading**:
  - **Red**: Any task within the project has a Red status
  - **Green**: All tasks within the project have Green status
  - **Amber**: Mix of Green and Amber tasks (no Red tasks)
  - Project RAG automatically updates when task RAG status changes

### Resource Allocation (by Assignee)

- **Monthly allocation tracking**:
  - Absolute days allocated per month per assignee
  - Utilization percentage: `(days assigned / business days in month) × 100%`
- **Utilization RAG Status**:
  - **Green**: < 80% utilization (underallocated)
  - **Amber**: 80-99% utilization (optimal allocation)
  - **Red**: ≥ 100% utilization (overallocated)
- **Resource Dashboard**:
  - Monthly view of resource allocation
  - Highlights over/under allocated team members
  - Drill-down to individual assignee workload

## Next Development Tasks

### Priority 1: Resource Management

1. Implement time tracking for tasks (days taken vs. assigned)

   ```javascript
   // In the TasksPage component:
   const handleUpdateTimeTracking = async (task, daysTaken) => {
     const updatedTask = { ...task, daysTaken };
     await taskService.update(task.id, updatedTask);
     fetchTasks();

     // Update task RAG status based on time tracking logic
     const daysRemaining = task.days_assigned - daysTaken;
     const businessDaysUntilDue = calculateBusinessDays(
       new Date(),
       new Date(task.due_date)
     );

     let newRag = 1; // Default Green
     if (daysRemaining > businessDaysUntilDue) {
       newRag = 3; // Red - not enough time left
     } else if (businessDaysUntilDue - daysRemaining <= 3) {
       newRag = 2; // Amber - tight buffer
     }

     if (newRag !== task.rag) {
       await taskService.update(task.id, { ...updatedTask, rag: newRag });
       updateProjectRag(task.project_id);
     }
   };
   ```

2. Create resource allocation views

   ```javascript
   // Create a new component:
   function ResourceAllocationPage() {
     // Get all business days in each month
     const getBusinessDaysInMonth = (year, month) => {
       // Count weekdays in the month
       let count = 0;
       const date = new Date(year, month, 1);
       while (date.getMonth() === month) {
         const day = date.getDay();
         if (day !== 0 && day !== 6) count++;
         date.setDate(date.getDate() + 1);
       }
       return count;
     };

     // Group tasks by assignee and month
     const groupTasksByAssigneeAndMonth = (tasks) => {
       const result = {};
       tasks.forEach((task) => {
         const assignee = task.assignee;
         if (!assignee) return;

         if (!result[assignee]) result[assignee] = {};

         // Get month from due_date
         const dueDate = new Date(task.due_date);
         const monthKey = `${dueDate.getFullYear()}-${dueDate.getMonth() + 1}`;

         if (!result[assignee][monthKey]) {
           result[assignee][monthKey] = {
             tasks: [],
             totalDaysAssigned: 0,
             businessDaysInMonth: getBusinessDaysInMonth(
               dueDate.getFullYear(),
               dueDate.getMonth()
             ),
           };
         }

         result[assignee][monthKey].tasks.push(task);
         result[assignee][monthKey].totalDaysAssigned += task.days_assigned;
       });

       return result;
     };

     // Calculate utilization percentage and RAG status
     const calculateUtilization = (allocation) => {
       return Object.keys(allocation).map((assignee) => {
         const months = Object.keys(allocation[assignee]).map((monthKey) => {
           const { totalDaysAssigned, businessDaysInMonth } =
             allocation[assignee][monthKey];
           const utilization = (totalDaysAssigned / businessDaysInMonth) * 100;

           let ragStatus = 'success'; // Green - under 80%
           if (utilization >= 100) {
             ragStatus = 'error'; // Red - 100% or higher
           } else if (utilization >= 80) {
             ragStatus = 'warning'; // Amber - between 80-99%
           }

           return {
             month: monthKey,
             totalDaysAssigned,
             businessDaysInMonth,
             utilization,
             ragStatus,
           };
         });

         return {
           assignee,
           months,
         };
       });
     };

     // Render the resource allocation dashboard
   }
   ```

3. Add workload analysis by assignee
4. Track task status changes and history

### Priority 2: Search and Filtering

1. Add search functionality for projects and tasks
2. Implement filtering by status, RAG, assignee, etc.
3. Add sorting options for tables
4. Create saved filters/views

### Priority 3: Reporting and Visualization

1. Add dashboard charts for project metrics
2. Create timeline/Gantt view for projects
3. Generate PDF reports for projects
4. Implement team performance analytics

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
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/project/:projectId` - Get tasks by project
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

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

- No user authentication (single-user mode)
- No Excel import/export functionality
- No advanced filtering or searching
- Limited data validation on some fields

## Future Roadmap

### Version 0.5.0

- Resource allocation and time tracking
- Advanced filtering and search
- Dashboard charts and visualizations
- Timeline/Gantt view

### Version 0.6.0

- Excel import/export
- Advanced reporting
- Email notifications
- Data validation rules

### Version 0.7.0

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
