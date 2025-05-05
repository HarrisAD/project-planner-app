import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { taskService } from '../services/api';
import TaskForm from '../components/tasks/TaskForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useNotification } from '../context/NotificationContext';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [error, setError] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const { showNotification } = useNotification();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAll();
      setTasks(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      showNotification('Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (taskData) => {
    try {
      await taskService.create(taskData);
      fetchTasks(); // Refresh the list
      setOpenForm(false);
      showNotification('Task created successfully');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.error || 'Failed to create task');
      showNotification('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      if (!currentTask) return;

      await taskService.update(currentTask.id, taskData);
      fetchTasks(); // Refresh the list
      setOpenForm(false);
      setCurrentTask(null);
      setIsEditing(false);
      showNotification('Task updated successfully');
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.error || 'Failed to update task');
      showNotification('Failed to update task', 'error');
    }
  };

  const handleOpenCreateForm = () => {
    setCurrentTask(null);
    setIsEditing(false);
    setOpenForm(true);
  };

  const handleOpenEditForm = (task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentTask(null);
    setIsEditing(false);
  };

  const handleFormSubmit = (data) => {
    if (isEditing) {
      handleUpdateTask(data);
    } else {
      handleCreateTask(data);
    }
  };

  const handleOpenDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleDeleteTask = async () => {
    try {
      if (!taskToDelete) return;

      await taskService.delete(taskToDelete.id);
      fetchTasks(); // Refresh the list
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      showNotification('Task deleted successfully');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.error || 'Failed to delete task');
      showNotification('Failed to delete task', 'error');
    }
  };

  const getRagColor = (rag) => {
    switch (rag) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'Not Started':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
        >
          Add Task
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && tasks.length === 0 ? (
        <Typography>No tasks found. Create your first task!</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>RAG</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Days Assigned</TableCell>
                <TableCell>Days Taken</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
                  <TableCell>{task.project_name}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        task.rag === 1
                          ? 'Green'
                          : task.rag === 2
                          ? 'Amber'
                          : 'Red'
                      }
                      color={getRagColor(task.rag)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {task.days_assigned ? `${task.days_assigned} days` : '-'}
                  </TableCell>
                  <TableCell>
                    {task.days_taken ? `${task.days_taken} days` : '0 days'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenEditForm(task)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteDialog(task)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TaskForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        initialData={currentTask}
        isEdit={isEditing}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        content={`Are you sure you want to delete the task "${taskToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
}

export default TasksPage;
