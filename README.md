# Project Planner Web Application

A comprehensive web-based project planning application that replaces Excel-based tracking systems with a modern, interactive web application focused on accurate resource allocation and time tracking.

## Current Status

**Last Updated**: May 2025  
**Version**: 0.9.5

## Tech Stack

- **Frontend**: React with JavaScript
- **UI Framework**: Material-UI v7
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **Authentication**: JWT (planned)
- **Testing**: Jest, React Testing Library

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
│   │   │   ├── common/    # Common UI components including ResizableTable
│   │   │   ├── holidays/  # Holiday management components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── projects/  # Project-related components
│   │   │   ├── resources/ # Resource allocation components
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

### Phase 3: Advanced Features ✅ (100% Complete)

- [x] Task time tracking (days taken vs assigned)
- [x] Automatic RAG status calculation based on time tracking
- [x] Automatic task status transitions based on time data
- [x] Last updated tracking for time data
- [x] "On Hold" detection for stale tasks
- [x] Assignee management with working days per week
- [x] Holiday management (individual days and date ranges)
- [x] Public holidays support with country codes
- [x] Enhanced risk assessment accounting for holidays

### Phase 4: Resource Planning ✅ (100% Complete)

- [x] Resource allocation views
- [x] Team member workload analysis
- [x] Capacity planning tools
- [x] Resource calendar view
- [x] Intelligent allocation algorithms
- [x] Over/under allocation detection

### Phase 5: UI Enhancements ✅ (100% Complete)

- [x] Resizable table columns with width persistence
- [x] Enhanced project view with resource allocation metrics
- [x] Persona-based resource tracking
- [x] Inline editing for task metadata
- [x] Progress visualization with percentage bars
- [x] Compact resource allocation views
- [x] Full-width table layouts for better data visibility

### Phase 6: Data Management & Filtering ⏳ (70% Complete)

- [x] Advanced task filtering by multiple criteria
- [x] Resource filtering and grouping
- [x] Enhanced UI for filter controls
- [ ] Excel import/export functionality
- [ ] Email notifications
- [ ] Reporting and analytics

### Phase 7: Authentication & Access Control (Planned)

- [ ] User model and authentication
- [ ] Role-based access control
- [ ] Team management
- [ ] User preferences
- [ ] Activity logging

## Core Features

### 1. Project Management

- Create, edit, and delete projects
- Track project progress automatically based on task completion
- RAG (Red, Amber, Green) status system for risk assessment
- Project overview dashboard
- Resource allocation tracking by persona type
- Progress calculation based on completed work vs assigned work

### 2. Task Management

- Create, edit, and delete tasks with sub-task capabilities
- Assign tasks to team members from a managed assignee list
- Categorize tasks by persona type (Exec Sponsor, Developer, etc.)
- Time tracking with days assigned vs. days taken
- Automatic status transitions based on progress
- Quick time tracking updates with +/- buttons
- Comprehensive task filtering by multiple criteria
- Resizable table columns for optimized viewing

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

### 6. Resource Allocation

- Comprehensive resource allocation dashboard
- Workload analysis by team member
- Allocation status indicators (Over/Under/Balanced)
- Calendar view for visualizing assignments
- Resource capacity planning
- Pro-rated allocation calculation for accurate forecasting
- Persona-based allocation tracking

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

- **Progress Calculation**:

  - Project progress is now calculated as total days used / total days assigned across all tasks
  - This provides a more accurate reflection of overall project completion

- **Resource Allocation Tracking**:

  - Projects track resource usage by persona type (Exec Sponsor, Developer, etc.)
  - Provides a ratio of days used to days assigned for each resource type
  - Shows progress bars for visual representation of usage

- **RAG Status Cascading**:
  - **Red**: Any task within the project has a Red status
  - **Green**: All tasks within the project have Green status
  - **Amber**: Mix of Green and Amber tasks (no Red tasks)
  - Project RAG automatically updates when task RAG status changes

## Recent Enhancements

### Improved Table UI

- **Resizable Columns**: Table columns can now be resized and widths are persisted between sessions
- **Full-width Layout**: Tables now utilize the full width of the screen for better data visibility
- **Visual Progress Indicators**: Progress bars with percentage indicators for clearer status tracking

### Resource Allocation Tracking

- **Persona-based Resource Allocation**: Tasks are now categorized by persona type, allowing for better resource planning
- **Allocation Visualization**: Progress bars show resource usage by persona across projects
- **Totals Calculation**: Each project shows total days assigned/used across all personas

### Inline Editing

- **Quick Edits**: Many fields can now be edited inline without opening the full form
- **Path to Green**: Direct editing of remediation steps for at-risk tasks
- **Notes Management**: Better TAU notes management with popup editor

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

### Priority 1: Enhanced Reporting

1. Implement dashboard charts for project metrics
2. Create timeline/Gantt view for projects
3. Generate PDF reports for projects
4. Add project and resource export functionality

### Priority 2: Excel Integration

1. Add Excel import functionality for batch task creation
2. Add Excel export functionality for reports
3. Create data validation rules for imports
4. Implement data mapping for various Excel formats

### Priority 3: Task Dependencies

1. Add ability to create task dependencies
2. Visualize task dependencies in a network graph
3. Automatically update dependent task dates
4. Critical path analysis

### Priority 4: Authentication

1. Implement user authentication
2. Add role-based access control
3. Create team management features
4. Add project permission settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.
