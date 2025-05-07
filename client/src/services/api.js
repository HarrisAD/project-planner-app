import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectService = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const taskService = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const assigneeService = {
  getAll: () => api.get('/assignees'),
  getById: (id) => api.get(`/assignees/${id}`), // Add this line
  create: (data) => api.post('/assignees', data),
  update: (id, data) => api.put(`/assignees/${id}`, data),
  delete: (id) => api.delete(`/assignees/${id}`),
  getHolidays: (id) => api.get(`/assignees/${id}/holidays`),
  addHoliday: (id, data) => api.post(`/assignees/${id}/holidays`, data),
  deleteHoliday: (holidayId) => api.delete(`/assignees/holidays/${holidayId}`),
  addHolidayRange: (id, data) =>
    api.post(`/assignees/${id}/holiday-range`, data),
};

export const holidayService = {
  // Public holidays
  getAllPublic: () => api.get('/holidays/public'),
  createPublic: (data) => api.post('/holidays/public', data),
  deletePublic: (id) => api.delete(`/holidays/public/${id}`),

  // For existing assigneeService, add this method:
  addHolidayRange: (assigneeId, data) =>
    api.post(`/assignees/${assigneeId}/holiday-range`, data),
};

export const resourceAllocationService = {
  getAll: (params) => api.get('/resource-allocation', { params }),
  getCalendarView: (params) =>
    api.get('/resource-allocation/calendar', { params }),
  getWorkloadSummary: (params) =>
    api.get('/resource-allocation/workload-summary', { params }),
};

export default api;
