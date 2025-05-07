# Project Planner Web Application

A comprehensive web-based project planning application that replaces Excel-based tracking systems with a modern, interactive web application focused on accurate resource allocation and time tracking.

## Current Status

**Last Updated**: May 2025  
**Version**: 0.7.0 (in development)

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
│   │   │   ├── assignees/ # Assignee management components
│   │   │   ├── common/    # Common UI components
│   │   │   ├── holidays/  # Holiday management components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── projects/  # Project-related components
│   │   │   └── tasks/     # Task-related components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main app component
│   └── package.json
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── migrations/    # Database migrations
│   │   ├── db.js          # Database connection
│   │   └── server.js      # Express server
│   └── package.json
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

### Phase 3: Advanced Features ✅ (80% Complete)

- [x] Task time tracking (days taken vs assigned)
- [x] Automatic RAG status calculation based on time tracking
- [x] Automatic task status transitions based on time data
- [x] Last updated tracking for time data
- [x] "On Hold" detection for stale tasks
- [x] Assignee management with working days per week
- [x] Holiday management (individual days and date ranges)
- [x] Public holidays support with country codes
- [x] Enhanced risk assessment accounting for holidays
- [ ] Resource allocation views
- [ ] Task filtering and search
- [ ] Dashboard enhancements with charts
- [ ] Project timeline/Gantt view

### Phase 4: Data Management & Authentication (Planned)

- [ ] Excel import/export functionality
- [ ] Email notifications
- [ ] Reporting and analytics
- [ ] User model and authentication
- [ ] Role-based access control

## Core Features

### 1. Project Management

- Create, edit, and delete projects
- Track project progress automatically based on task completion
- RAG (Red, Amber, Green) status system for risk assessment
- Project overview dashboard

### 2. Task Management

- Create, edit, and delete tasks
- Assign tasks to team members from a managed assignee list
- Time tracking with days assigned vs. days taken
- Automatic status transitions based on progress
- Quick time tracking updates with +/- buttons

### 3. Assignee Management

- Maintain a list of team members with their details
- Track working days per week for each assignee
- Record start dates for accurate capacity planning
- Controlled task assignment using the assignee list

### 4. Time Off & Holiday Management

- Record individual holidays for each team member
- Add holiday ranges for extended leave periods
- Manage public holidays with country code support
- Tabbed interface for easy management

### 5. Intelligent Risk Assessment

- Automated RAG status calculation based on:
  - Days taken vs. days assigned
  - Business days until due date
  - Assignee's specific working pattern (days per week)
  - Individual and public holidays
  - Time since last update (for "On Hold" detection)

## Task Status Automation

The application implements automatic status updates based on time tracking data, ensuring project status accurately reflects the current state of work:

### Status Transition Logic

Task status is automatically determined based on the following rules:

1. **Not Started**: When days taken = 0
2. **In Progress**: When days taken > 0 but < days assigned
3. **Completed**: When days taken = days assigned
4. **On Hold**: When a task in "In Progress" hasn't had its days taken updated in over 1 week

This automation reduces manual status updates and ensures consistency between time tracking and task status.

## Time Tracking System

The application implements a comprehensive time tracking system across multiple levels:

### Task Level

- **Progress Calculation**:

  - Task progress is calculated as `(days taken / days assigned) × 100%`
  - Visual indicators show time usage with appropriate color coding
  - Last update timestamp tracks when time data was most recently modified

- **RAG Status Logic**:
  - **Red**: Not enough time left to complete the task (remaining business days < estimated time needed)
  - **Amber**: Tight deadline buffer (3 or fewer business days buffer)
  - **Green**: Comfortable buffer (more than 3 business days buffer)
  - The calculation considers:
    - Business days remaining until due date (excluding weekends)
    - Assignee's working days per week (e.g., 3 days vs 5 days)
    - Individual holidays and holiday ranges
    - Public holidays
    - Estimated days still needed to complete (days assigned - days taken)

### Project Level

- **RAG Status Cascading**:
  - **Red**: Any task within the project has a Red status
  - **Green**: All tasks within the project have Green status
  - **Amber**: Mix of Green and Amber tasks (no Red tasks)
  - Project RAG automatically updates when task RAG status changes

### Quick Time Tracking

- One-click time updates for logging daily progress
- Automatic status transitions based on time tracking data
- Visual progress indicators showing time usage

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
    last_updated_days TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignees table
CREATE TABLE assignees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    working_days_per_week DECIMAL(3,1) DEFAULT 5.0,
    start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignee holidays table
CREATE TABLE assignee_holidays (
    id SERIAL PRIMARY KEY,
    assignee_id INTEGER REFERENCES assignees(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    date_end DATE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Public holidays table
CREATE TABLE public_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) DEFAULT 'GB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Assignees

- `GET /api/assignees` - Get all assignees
- `GET /api/assignees/:id` - Get assignee by ID
- `POST /api/assignees` - Create assignee
- `PUT /api/assignees/:id` - Update assignee
- `DELETE /api/assignees/:id` - Delete assignee

### Holidays

- `GET /api/assignees/:id/holidays` - Get holidays for an assignee
- `POST /api/assignees/:id/holidays` - Add holiday for assignee
- `POST /api/assignees/:id/holiday-range` - Add holiday range for assignee
- `DELETE /api/assignees/holidays/:id` - Delete holiday
- `GET /api/holidays/public` - Get all public holidays
- `POST /api/holidays/public` - Create public holiday
- `DELETE /api/holidays/public/:id` - Delete public holiday

## Running the Application

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm start
```

### Endpoints

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health Check: http://localhost:3001/api/health

## Next Development Steps

### Priority 1: Resource Allocation Views

1. Create assignee-based workload analysis
2. Implement calendar view of resource allocation
3. Add visual indicators for over/under allocation
4. Create team capacity dashboard

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
