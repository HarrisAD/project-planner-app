// Simulated delay to mimic API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data
const mockProjects = [
  {
    id: 1,
    name: 'Amplifyd - Paid Media',
    company: 'Amplifyd',
    status: 'In Progress',
    rag: 2,
    progress: 0.35,
    startDate: '2025-04-01',
    endDate: '2025-06-30',
  },
  {
    id: 2,
    name: 'the7stars - Media Plan',
    company: 'the7stars',
    status: 'Planning',
    rag: 1,
    progress: 0.1,
    startDate: '2025-05-01',
    endDate: '2025-08-31',
  },
];

export const mockProjectService = {
  getAll: async () => {
    await delay(500); // Simulate network delay
    return { data: mockProjects };
  },

  getById: async (id) => {
    await delay(300);
    const project = mockProjects.find((p) => p.id === parseInt(id));
    if (!project) throw new Error('Project not found');
    return { data: project };
  },

  create: async (projectData) => {
    await delay(500);
    const newProject = {
      id: mockProjects.length + 1,
      ...projectData,
      progress: 0,
      rag: 1,
    };
    mockProjects.push(newProject);
    return { data: newProject };
  },
};

// Add this to your existing mockApi.js file

const mockTasks = [
  {
    id: 1,
    projectId: 1,
    projectName: 'Amplifyd - Paid Media',
    name: 'Platform Outline',
    assignee: 'Greg',
    status: 'In Progress',
    rag: 2,
    dueDate: '2025-04-29',
    daysAssigned: 5,
    daysTaken: 3,
    daysLeft: 2,
    description: 'Create platform architecture outline',
  },
  {
    id: 2,
    projectId: 1,
    projectName: 'Amplifyd - Paid Media',
    name: 'Database Setup',
    assignee: 'Andy',
    status: 'Not Started',
    rag: 1,
    dueDate: '2025-05-15',
    daysAssigned: 3,
    daysTaken: 0,
    daysLeft: 3,
    description: 'Set up PostgreSQL database',
  },
  {
    id: 3,
    projectId: 2,
    projectName: 'the7stars - Media Plan',
    name: 'Requirements Gathering',
    assignee: 'David',
    status: 'Completed',
    rag: 1,
    dueDate: '2025-04-20',
    daysAssigned: 5,
    daysTaken: 5,
    daysLeft: 0,
    description: 'Gather requirements from stakeholders',
  },
];

export const mockTaskService = {
  getAll: async () => {
    await delay(500);
    return { data: mockTasks };
  },

  getByProject: async (projectId) => {
    await delay(300);
    const tasks = mockTasks.filter((t) => t.projectId === parseInt(projectId));
    return { data: tasks };
  },

  getByAssignee: async (assignee) => {
    await delay(300);
    const tasks = mockTasks.filter((t) => t.assignee === assignee);
    return { data: tasks };
  },
};
