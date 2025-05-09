# Project Planner Web Application

A comprehensive web-based project planning application that replaces Excel-based tracking systems with a modern, interactive web application focused on accurate resource allocation and time tracking.

## Current Status

**Last Updated**: May 2025  
**Version**: 1.1.0

## Tech Stack

- **Frontend**: React with JavaScript
- **UI Framework**: Material-UI v7
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **Authentication**: JWT (planned)
- **Testing**: Jest, React Testing Library
- **Excel Integration**: SheetJS, Multer

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
│   │   │   ├── import/    # Excel import components
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

## Features

### Dashboard

- **Project Summary**: Overview of all projects with progress indicators and RAG status
- **Amber/Red Tasks**: Display of at-risk tasks that need attention
- **Upcoming Tasks**: Tasks due before a specified date with filterable deadline
- **Resource Allocation**: Summary of team member allocation over different time periods

### Project Management

- Create, edit, and delete projects
- Track project progress automatically based on task completion
- RAG (Red, Amber, Green) status system for risk assessment
- Resource allocation tracking by persona type (Exec Sponsor, Developer, etc.)
- Progress calculation based on completed work vs assigned work

### Task Management

- Create, edit, and delete tasks with sub-task capabilities
- Assign tasks to team members from a managed assignee list
- Categorize tasks by persona type
- Time tracking with days assigned vs. days taken
- Automatic status transitions based on progress
- Quick time tracking updates with +/- buttons
- Comprehensive task filtering by multiple criteria
- Resizable table columns for optimized viewing
- Path to green tracking for amber/red tasks

### Excel Import/Export

- **Task Import**: Batch import tasks from Excel or CSV files
- **Template Downloads**: Generate properly formatted Excel templates
- **Column Mapping**: Intelligently map columns from uploaded files
- **Data Validation**: Validate imported data with detailed error reporting
- **Data Preview**: Preview import data before committing to database
- **Error Handling**: Detailed validation error handling and reporting

### Assignee Management

- Maintain a list of team members with their details
- Track working days per week for each assignee
- Record start dates for accurate capacity planning
- Controlled task assignment using the assignee list

### Time Off & Holiday Management

- Record individual holidays for each team member
- Add holiday ranges for extended leave periods
- Manage public holidays with country code support
- Tabbed interface for easy management

### Intelligent Risk Assessment

- Automated RAG status calculation based on:
  - Days taken vs. days assigned
  - Business days until due date
  - Assignee's specific working pattern (days per week)
  - Individual and public holidays
  - Time since last update (for "On Hold" detection)

### Resource Allocation

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

  - Project progress is calculated as total days used / total days assigned across all tasks
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

## Excel Import Functionality

The application provides a robust system for importing task data from Excel files:

### Import Workflow

1. **File Selection & Upload**:

   - Drag-and-drop interface for file selection
   - Support for Excel (.xlsx, .xls) and CSV formats
   - Template download option for proper formatting

2. **Column Mapping**:

   - Automatic mapping of columns by name matching
   - Manual mapping interface for custom Excel formats
   - Required field validation and highlighting

3. **Data Preview**:

   - Formatted preview of mapped data
   - Pagination for large datasets
   - Visual indicators for status and RAG values

4. **Validation & Processing**:

   - Project and assignee validation against database
   - Required field validation
   - Date format conversion
   - Detailed error reporting per row

5. **Import Confirmation**:
   - Success confirmation with count of imported tasks
   - Option to return to task list
   - Automatic project progress recalculation

### Import Validation Rules

- Task name is required
- Project name must match an existing project
- Assignee must match an existing assignee
- Days assigned is required
- Status must be one of: Not Started, In Progress, Completed, On Hold
- RAG must be 1 (Green), 2 (Amber), or 3 (Red)
- Persona must be one of: exec_sponsor, exec_lead, developer, consultant, programme_manager

## Recent Enhancements

### Excel Integration (v1.1.0)

- **Task Import**: Added ability to batch import tasks from Excel files
- **Column Mapping**: Intelligent column mapping with validation
- **Template Download**: Added downloadable import templates
- **Error Handling**: Comprehensive validation and error reporting

### Enhanced Dashboard (v1.0.5)

- **Amber/Red Tasks**: Quick view of all at-risk tasks across projects
- **Upcoming Tasks**: Due date-based filtering with deadline view
- **Resource Allocation Summary**: Team allocation visualization across time periods

### Improved Table UI (v1.0.4)

- **Resizable Columns**: Table columns can now be resized and widths are persisted between sessions
- **Full-width Layout**: Tables now utilize the full width of the screen for better data visibility
- **Visual Progress Indicators**: Progress bars with percentage indicators for clearer status tracking

### Resource Allocation Tracking (v1.0.3)

- **Persona-based Resource Allocation**: Tasks are now categorized by persona type, allowing for better resource planning
- **Allocation Visualization**: Progress bars show resource usage by persona across projects
- **Totals Calculation**: Each project shows total days assigned/used across all personas

### Inline Editing (v1.0.2)

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

### Priority 1: Enhanced Excel Integration

1. ✅ Task import from Excel files
2. Add Excel export functionality for tasks
3. Implement project import/export
4. Add ability to update existing tasks via import
5. Create more advanced templates with validation rules

### Priority 2: Reporting

1. Implement dashboard charts for project metrics
2. Create timeline/Gantt view for projects
3. Generate PDF reports for projects
4. Add project and resource export functionality

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
